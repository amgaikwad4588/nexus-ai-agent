import { auth0 } from "@/lib/auth0";
import {
  getPendingAction,
  approveAction,
  denyAction,
  markExecuted,
} from "@/lib/step-up";
import { addAuditEntry } from "@/lib/audit";
import { getAccessTokenForService } from "@/lib/token-exchange";

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
      action: `Step-up approved: ${action.description}`,
      service: action.service,
      scopes: [],
      status: "success",
      details: `User approved write operation via step-up auth`,
      riskLevel: action.riskLevel,
      stepUpRequired: true,
    });

    // Execute the approved action
    const result = await executeAction(action.toolName, action.args, session);
    console.log("[step-up] executeAction result:", JSON.stringify(result));
    markExecuted(actionId, result);

    if (result.error) {
      return Response.json(
        { status: "error", action: { ...action, status: "error" }, result },
        { status: 502 }
      );
    }

    return Response.json({ status: "executed", action: { ...action, status: "executed" }, result });
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
  session: { user: { sub: string }; tokenSet: { refreshToken?: string } }
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
    const accessToken = await getAccessTokenForService("slack", refreshToken);
    if (!accessToken) return { error: "Failed to get Slack access token" };

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

  return { error: `Unknown tool: ${toolName}` };
}
