import { streamText, stepCountIs, convertToModelMessages } from "ai";
import { google } from "@ai-sdk/google";
import { setAIContext } from "@auth0/ai-vercel";
import { auth0 } from "@/lib/auth0";
import { setRequestRefreshToken } from "@/lib/auth0-ai";
import { checkToolPermission, logPermissionDenied } from "@/lib/permissions";
import { evaluateRisk } from "@/lib/risk-engine";
import { addAuditEntry } from "@/lib/audit";
import { searchGmail, checkCalendar } from "@/lib/tools/google";
import {
  listGitHubRepos,
  getGitHubIssues,
  createGitHubIssue,
  deleteGitHubRepo,
  getGitHubProfile,
} from "@/lib/tools/github";
import {
  listSlackChannels,
  sendSlackMessage,
  getSlackChannelHistory,
} from "@/lib/tools/slack";
import {
  getDiscordProfile,
  listDiscordGuilds,
  getDiscordGuildMember,
  listDiscordChannels,
  sendDiscordMessage,
} from "@/lib/tools/discord";

/**
 * Wrap a tool so that its execute function is gated by:
 *  1. The centralized Risk Engine (evaluates risk → EXECUTE / STEP_UP / REAUTH / BLOCK)
 *  2. A server-side permission check (service connected? scopes enabled?)
 *
 * This ensures every tool invocation flows through the risk engine before anything runs.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function withRiskEngine<T extends Record<string, any>>(
  toolName: string,
  userId: string,
  originalTool: T
): T {
  if (!originalTool.execute) return originalTool;

  const originalExecute = originalTool.execute;

  return {
    ...originalTool,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    execute: async (...args: any[]) => {
      // ── Step 1: Risk Engine evaluation ──
      const riskEval = evaluateRisk(toolName);

      if (riskEval.decision === "BLOCK") {
        return {
          error: riskEval.reason,
          blocked: true,
          riskLevel: riskEval.risk,
          riskDecision: riskEval.decision,
        };
      }

      // ── Step 2: Permission check (service connected? scopes enabled?) ──
      const check = await checkToolPermission(toolName, userId);
      if (!check.allowed) {
        logPermissionDenied(toolName, check);
        return { error: check.reason, permissionDenied: true };
      }

      // ── Step 3: Execute with timeout + timing ──
      const TOOL_TIMEOUT_MS = 30_000;
      const start = performance.now();
      try {
        const result = await Promise.race([
          originalExecute(...args),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("TOOL_TIMEOUT")), TOOL_TIMEOUT_MS)
          ),
        ]);
        const ms = Math.round(performance.now() - start);
        console.log(`[tool] ${toolName} completed in ${ms}ms`);
        return result;
      } catch (err) {
        const ms = Math.round(performance.now() - start);
        const isTimeout = err instanceof Error && err.message === "TOOL_TIMEOUT";
        console.error(`[tool] ${toolName} FAILED after ${ms}ms:`, err);
        addAuditEntry({
          action: `Tool ${isTimeout ? "timed out" : "failed"}: ${toolName}`,
          service: "system",
          scopes: [],
          status: "failed",
          details: isTimeout
            ? `Tool "${toolName}" exceeded ${TOOL_TIMEOUT_MS / 1000}s timeout (${ms}ms elapsed)`
            : `Tool "${toolName}" threw after ${ms}ms: ${err instanceof Error ? err.message : "Unknown error"}`,
          riskLevel: riskEval.risk,
          stepUpRequired: false,
        });
        return {
          error: isTimeout
            ? `Operation timed out after ${TOOL_TIMEOUT_MS / 1000} seconds. Please try again.`
            : `Tool execution failed: ${err instanceof Error ? err.message : "Unknown error"}`,
          timedOut: isTimeout,
        };
      }
    },
  };
}

export async function POST(req: Request) {
  try {
    const session = await auth0.getSession();
    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { messages } = await req.json();
    const userId = session.user.sub;
    const threadID = `nexus-${userId}-${Date.now()}`;

    setAIContext({ threadID });
    setRequestRefreshToken(session.tokenSet.refreshToken);

    const model = google("gemini-3.1-flash-lite-preview");
    const modelMessages = await convertToModelMessages(messages);

    // Wrap every tool with server-side permission enforcement
    const rawTools = {
      searchGmail,
      checkCalendar,
      listGitHubRepos,
      getGitHubIssues,
      createGitHubIssue,
      deleteGitHubRepo,
      getGitHubProfile,
      listSlackChannels,
      sendSlackMessage,
      getSlackChannelHistory,
      getDiscordProfile,
      listDiscordGuilds,
      getDiscordGuildMember,
      listDiscordChannels,
      sendDiscordMessage,
    };

    // Route every tool through the centralized Risk Engine + permission check
    const tools = Object.fromEntries(
      Object.entries(rawTools).map(([name, t]) => [
        name,
        withRiskEngine(name, userId, t),
      ])
    ) as typeof rawTools;

    const result = streamText({
      model,
      system: `You are Nexus, a powerful AI agent that helps users manage their digital life across Google, GitHub, and Slack. You have secure access to the user's connected services through Auth0 Token Vault.

Your capabilities:
- **Google**: Search Gmail, check Google Calendar events and availability
- **GitHub**: List repositories, view issues, create issues, delete repositories (high-risk), get profile info
- **Slack**: List channels, send messages, read channel history
- **Discord**: View profile, list servers, check membership details

Security Model — Centralized Risk Engine:
Every tool invocation passes through a risk engine that evaluates the action and enforces risk-based authorization:
- **LOW risk** (read operations) → Auto-executed with scoped tokens. No user friction.
- **MEDIUM risk** (write operations like createGitHubIssue, sendSlackMessage) → Step-up authentication required. The action is queued for user approval.
- **HIGH risk** (destructive/bulk operations) → Re-authentication required. The user must re-verify their identity before execution.
- **UNKNOWN tools** → Blocked by default (fail-closed security).

When you receive a requiresApproval response from a tool, tell the user the action has been queued and they need to approve it using the authorization buttons shown in the chat. Do NOT retry the tool call.

Guidelines:
- Always be helpful, concise, and transparent about what actions you're taking
- When performing actions, explain what you're doing and which service you're accessing
- If a tool returns an authorization error, do NOT retry it. Instead tell the user to connect that service from the Connections page.
- Format responses nicely with markdown
- When showing lists, use tables or bullet points for clarity
- Only call one tool at a time. Do not call multiple tools in parallel.

The user's name is ${session.user.name || "there"}.`,
      messages: modelMessages,
      tools,
      maxRetries: 2,
      stopWhen: stepCountIs(2),
    });

    return result.toUIMessageStreamResponse({
      originalMessages: messages,
    });
  } catch (error) {
    console.error("[chat] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
