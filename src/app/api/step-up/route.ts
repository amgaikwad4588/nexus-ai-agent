import { auth0 } from "@/lib/auth0";
import {
  getPendingAction,
  approveAction,
  denyAction,
  markExecuted,
  hasValidStepUpSession,
} from "@/lib/step-up";
import { addAuditEntry } from "@/lib/audit";
import { getAccessTokenForService } from "@/lib/token-exchange";
import { checkToolPermission, logPermissionDenied } from "@/lib/permissions";
import { evaluateRisk } from "@/lib/risk-engine";

// POST /api/step-up - Approve or deny a pending action, then execute if approved
export async function POST(req: Request) {
  try {
    const session = await auth0.getSession();
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { actionId, decision } = await req.json();
    const userId = session.user.sub;

    if (!actionId || !["approve", "deny"].includes(decision)) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }

    if (decision === "deny") {
      const action = denyAction(actionId, userId);
      if (!action) {
        return Response.json({ error: "Action not found or expired" }, { status: 404 });
      }

      addAuditEntry({
        userId,
        action: `Step-up denied: ${action.description}`,
        service: action.service,
        scopes: [],
        status: "denied",
        details: `User denied write operation: ${action.description}`,
        riskLevel: action.riskLevel,
        stepUpRequired: true,
      });

      return Response.json({ status: "denied", action });
    }

    // Approve
    const action = approveAction(actionId, userId);
    if (!action) {
      return Response.json({ error: "Action not found or expired" }, { status: 404 });
    }
    if (action.status === "expired") {
      return Response.json({ error: "Action expired" }, { status: 410 });
    }

    addAuditEntry({
      userId,
      action: `Step-up approved: ${action.description}`,
      service: action.service,
      scopes: [],
      status: "success",
      details: `User approved write operation via step-up auth`,
      riskLevel: action.riskLevel,
      stepUpRequired: true,
    });

    // ── Risk Engine re-evaluation before execution (even after approval) ──
    const riskEval = evaluateRisk(action.toolName);

    // High-risk actions require a valid step-up session (re-authentication)
    if (riskEval.decision === "REAUTH" && !hasValidStepUpSession(userId)) {
      addAuditEntry({
        userId,
        action: `Re-auth required: ${action.description}`,
        service: action.service,
        scopes: [],
        status: "denied",
        details: `High-risk action requires re-authentication — no valid step-up session`,
        riskLevel: "high",
        stepUpRequired: true,
      });
      return Response.json(
        { status: "reauth_required", error: "High-risk action requires re-authentication. Please verify your identity." },
        { status: 403 }
      );
    }

    if (riskEval.decision === "BLOCK") {
      return Response.json(
        { status: "blocked", error: riskEval.reason },
        { status: 403 }
      );
    }

    // Server-side permission check before execution (even after approval)
    const permCheck = await checkToolPermission(action.toolName, userId);
    if (!permCheck.allowed) {
      logPermissionDenied(action.toolName, permCheck);
      return Response.json(
        { status: "error", error: permCheck.reason, permissionDenied: true },
        { status: 403 }
      );
    }

    // Execute the approved action with timeout + timing
    const STEP_UP_TIMEOUT_MS = 30_000;
    const execStart = performance.now();
    let result: Record<string, unknown>;
    try {
      result = await Promise.race([
        executeAction(action.toolName, action.args, session, userId),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("STEP_UP_TIMEOUT")), STEP_UP_TIMEOUT_MS)
        ),
      ]);
    } catch (err) {
      const execMs = Math.round(performance.now() - execStart);
      const isTimeout = err instanceof Error && err.message === "STEP_UP_TIMEOUT";
      addAuditEntry({
        userId,
        action: `Step-up execution ${isTimeout ? "timed out" : "crashed"}: ${action.description}`,
        service: action.service,
        scopes: [],
        status: "failed",
        details: isTimeout
          ? `Execution exceeded ${STEP_UP_TIMEOUT_MS / 1000}s timeout (${execMs}ms elapsed)`
          : `Unexpected error after ${execMs}ms: ${err instanceof Error ? err.message : "Unknown"}`,
        riskLevel: action.riskLevel,
        stepUpRequired: true,
      });
      markExecuted(actionId, { error: isTimeout ? "Timed out" : "Execution failed" });
      return Response.json(
        { status: "error", error: isTimeout ? "Operation timed out" : "Execution failed", timedOut: isTimeout },
        { status: 504 }
      );
    }

    const execMs = Math.round(performance.now() - execStart);
    // Measure total approval latency (queued → executed)
    const approvalLatencyMs = Math.round(
      new Date().getTime() - new Date(action.createdAt).getTime()
    );

    console.log(`[step-up] ${action.toolName} executed in ${execMs}ms (approval latency: ${approvalLatencyMs}ms)`);
    markExecuted(actionId, result);

    if (result.error) {
      addAuditEntry({
        userId,
        action: `Step-up execution failed: ${action.description}`,
        service: action.service,
        scopes: [],
        status: "failed",
        details: `API error after ${execMs}ms: ${String(result.error).slice(0, 200)}`,
        riskLevel: action.riskLevel,
        stepUpRequired: true,
      });
      return Response.json(
        { status: "error", action: { ...action, status: "error" }, result },
        { status: 502 }
      );
    }

    return Response.json({
      status: "executed",
      action: { ...action, status: "executed" },
      result,
      metrics: { executionMs: execMs, approvalLatencyMs },
    });
  } catch (error) {
    console.error("[step-up] Error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}

// GET /api/step-up?actionId=xxx - Check status of a pending action
export async function GET(req: Request) {
  try {
    const session = await auth0.getSession();
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const actionId = url.searchParams.get("actionId");
    if (!actionId) {
      return Response.json({ error: "Missing actionId" }, { status: 400 });
    }

    const action = getPendingAction(actionId);
    if (!action) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    return Response.json({ action });
  } catch (error) {
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

async function executeAction(
  toolName: string,
  args: Record<string, unknown>,
  session: { user: { sub: string }; tokenSet: { refreshToken?: string } },
  userId: string
): Promise<Record<string, unknown>> {
  const refreshToken = session.tokenSet.refreshToken;
  if (!refreshToken) {
    return { error: "No refresh token available" };
  }

  if (toolName === "createGitHubIssue") {
    const accessToken = await getAccessTokenForService("github", refreshToken);
    if (!accessToken) return { error: "Failed to get GitHub access token" };

    const { repo, title, body, labels } = args as {
      repo: string;
      title: string;
      body?: string;
      labels?: string[];
    };

    const response = await fetch(`https://api.github.com/repos/${repo}/issues`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, body, labels }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { error: `GitHub API error: ${response.status} - ${errorText}` };
    }

    const issue = await response.json();

    addAuditEntry({
      userId,
      action: `Created GitHub issue #${issue.number} in ${repo}`,
      service: "github",
      scopes: ["repo"],
      status: "success",
      details: `Issue "${title}" created after step-up approval`,
      riskLevel: "medium",
      stepUpRequired: true,
    });

    return {
      number: issue.number,
      title: issue.title,
      url: issue.html_url,
      state: issue.state,
    };
  }

  if (toolName === "sendSlackMessage") {
    const accessToken = process.env.SLACK_BOT_TOKEN;
    if (!accessToken) return { error: "SLACK_BOT_TOKEN not configured" };

    const { channel, message } = args as { channel: string; message: string };

    const response = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ channel, text: message }),
    });

    if (!response.ok) {
      return { error: `Slack API error: ${response.status}` };
    }

    const data = await response.json();
    if (!data.ok) {
      return { error: data.error || "Failed to send message" };
    }

    addAuditEntry({
      userId,
      action: `Sent Slack message to #${channel}`,
      service: "slack",
      scopes: ["chat:write"],
      status: "success",
      details: `Message sent after step-up approval: "${message.slice(0, 50)}..."`,
      riskLevel: "medium",
      stepUpRequired: true,
    });

    return {
      sent: true,
      channel: data.channel,
      timestamp: data.ts,
      message: message.slice(0, 100),
    };
  }

  if (toolName === "deleteGitHubRepo") {
    const { repo } = args as { repo: string; confirmName: string };

    // ── Simulated deletion — does NOT actually delete ──
    // Verifies the repo exists via GitHub API, then returns a simulated success.
    // This demonstrates the full HIGH-risk flow (re-auth → approve → execute)
    // without any destructive side effects.
    const accessToken = await getAccessTokenForService("github", refreshToken);
    if (!accessToken) return { error: "Failed to get GitHub access token" };

    const repoCheck = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/vnd.github.v3+json" },
    });

    if (!repoCheck.ok) {
      return { error: `Repository "${repo}" not found` };
    }

    const repoData = await repoCheck.json();

    addAuditEntry({
      userId,
      action: `[SIMULATED] Deleted GitHub repo ${repo}`,
      service: "github",
      scopes: ["delete_repo"],
      status: "success",
      details: `Simulated deletion of "${repo}" after re-authentication + step-up approval. No actual deletion performed.`,
      riskLevel: "high",
      stepUpRequired: true,
    });

    return {
      simulated: true,
      deleted: false,
      repo: repoData.full_name,
      message: `[SIMULATED] Repository "${repo}" would be deleted. No actual deletion was performed — this is a demo of the high-risk re-authentication flow.`,
    };
  }

  return { error: `Unknown tool: ${toolName}` };
}
