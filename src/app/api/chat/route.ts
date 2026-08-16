import {
  streamText,
  stepCountIs,
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
} from "ai";
import { google } from "@ai-sdk/google";
import { setAIContext } from "@auth0/ai-vercel";
import { auth0 } from "@/lib/auth0";
import { setRequestRefreshToken } from "@/lib/auth0-ai";
import { checkToolPermission, logPermissionDenied } from "@/lib/permissions";
import { evaluateRisk } from "@/lib/risk-engine";
import { addAuditEntry } from "@/lib/audit";
import { checkDomain, getRefusalMessage } from "@/lib/domain-guard";
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

/** Pull plain text out of a UI message (which carries an array of `parts`). */
function extractText(msg: unknown): string {
  if (!msg || typeof msg !== "object") return "";
  const parts = (msg as { parts?: Array<{ type?: string; text?: string }> }).parts;
  if (!Array.isArray(parts)) {
    // Fallback for the older { content: string } shape.
    const content = (msg as { content?: unknown }).content;
    return typeof content === "string" ? content : "";
  }
  return parts
    .filter((p) => p?.type === "text" && typeof p.text === "string")
    .map((p) => p.text as string)
    .join(" ")
    .trim();
}

/**
 * Emit a canned assistant message as a UI-message stream WITHOUT calling the
 * main model — this is how the domain guard refuses off-topic requests for free.
 */
function refusalStream(text: string): Response {
  const id = `refusal-${Date.now()}`;
  const stream = createUIMessageStream({
    execute: ({ writer }) => {
      writer.write({ type: "text-start", id });
      writer.write({ type: "text-delta", id, delta: text });
      writer.write({ type: "text-end", id });
    },
  });
  return createUIMessageStreamResponse({ stream });
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

    // ── Domain guard: block off-topic messages BEFORE the expensive LLM call ──
    // Extract the latest user message's text (UI messages carry `parts`).
    const lastUserMsg = [...(messages || [])]
      .reverse()
      .find((m: { role?: string }) => m.role === "user");
    const latestText = extractText(lastUserMsg);

    const guard = await checkDomain(latestText);
    if (!guard.allowed) {
      addAuditEntry({
        action: "Off-domain request blocked",
        service: "system",
        scopes: [],
        status: "denied",
        details: `Blocked (${guard.reason}) to conserve tokens: "${latestText.slice(0, 120)}"`,
        riskLevel: "low",
        stepUpRequired: false,
      });
      return refusalStream(getRefusalMessage());
    }

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

Guided, button-driven flows (IMPORTANT — the UI is designed for non-technical users):
The chat UI renders clickable pickers and forms. Never ask the user to type a repository name, channel name, server name, or ID. Instead, guide them with buttons:
- If the user wants to CREATE A GITHUB ISSUE but has not clearly specified which repo, call listGitHubRepos so the UI shows repo buttons. Tell them: "Which repository? Pick one below." Do NOT call createGitHubIssue yet. The user will click a repo and fill in a form; you will then receive a fully-specified request like: Create a GitHub issue in owner/repo with title "..." and body "...". Only then call createGitHubIssue.
- If the user wants to SEND A DISCORD MESSAGE but has not specified the channel, call listDiscordGuilds so the UI shows server buttons. After they pick a server the UI lists channels; after they pick a channel and type a message you will receive: Send this message to Discord channel <id>: "...". Only then call sendDiscordMessage.
- If the user wants to SEND A SLACK MESSAGE but has not specified the channel, call listSlackChannels so the UI shows channel buttons. You will then receive: Send this message to Slack channel #name: "...". Only then call sendSlackMessage.
- If the user wants to VIEW GITHUB ISSUES but has not specified a repo, call listGitHubRepos and tell them to pick a repo.
In all these cases, when you only have a partial request, your job is to call the relevant LIST tool and give a one-line instruction to pick from the buttons. Do not guess identifiers.

Guidelines:
- Always be helpful, concise, and transparent about what actions you're taking
- When performing actions, explain what you're doing and which service you're accessing
- If a tool returns an authorization error, do NOT retry it. Instead tell the user to connect that service from the Connections page.
- Format responses nicely with markdown
- When showing lists, use tables or bullet points for clarity
- The UI renders its own rich interactive cards for the results of listGitHubRepos, listDiscordGuilds, and listDiscordChannels. After calling one of these tools, do NOT repeat or re-list the returned items as text/tables. Reply with at most a single short sentence (e.g. "Here are your repositories:") or no text at all, so the data is not shown twice.
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
