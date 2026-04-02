/**
 * Centralized Risk Engine
 *
 * Every agent action is evaluated through this engine before execution.
 * It assigns a risk level and returns a security decision:
 *
 *   LOW      → EXECUTE    (auto-run, no user friction)
 *   MEDIUM   → STEP_UP    (approval card shown, user must authorize)
 *   HIGH     → REAUTH     (approval + re-authentication required)
 *   UNKNOWN  → BLOCK      (fail-closed for unregistered tools)
 */

import { addAuditEntry } from "@/lib/audit";

// ─── Risk levels & decisions ─────────────────────────────────────────

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type RiskDecision = "EXECUTE" | "STEP_UP" | "REAUTH" | "BLOCK";

export interface RiskEvaluation {
  tool: string;
  risk: RiskLevel;
  decision: RiskDecision;
  reason: string;
  timestamp: string;
}

// ─── Tool risk classification map ────────────────────────────────────
// Every tool MUST be registered here. Unknown tools are blocked.

interface ToolRiskEntry {
  risk: RiskLevel;
  service: "google" | "github" | "slack" | "discord";
  description: string;
}

const TOOL_RISK_MAP: Record<string, ToolRiskEntry> = {
  // ── Google (read-only) ──
  searchGmail:       { risk: "low",    service: "google",  description: "Search Gmail inbox" },
  checkCalendar:     { risk: "low",    service: "google",  description: "Check calendar events" },

  // ── GitHub ──
  listGitHubRepos:   { risk: "low",    service: "github",  description: "List repositories" },
  getGitHubIssues:   { risk: "low",    service: "github",  description: "Read issues" },
  getGitHubProfile:  { risk: "low",    service: "github",  description: "Read user profile" },
  createGitHubIssue: { risk: "medium", service: "github",  description: "Create issue (write)" },

  // ── Slack ──
  listSlackChannels:      { risk: "low",    service: "slack", description: "List channels" },
  getSlackChannelHistory: { risk: "low",    service: "slack", description: "Read channel history" },
  sendSlackMessage:       { risk: "medium", service: "slack", description: "Send message (write)" },

  // ── Discord ──
  getDiscordProfile:      { risk: "low",    service: "discord", description: "Read Discord profile" },
  listDiscordGuilds:      { risk: "low",    service: "discord", description: "List Discord servers" },
  getDiscordGuildMember:  { risk: "low",    service: "discord", description: "Check guild membership" },
  listDiscordChannels:    { risk: "low",    service: "discord", description: "List Discord channels" },
  sendDiscordMessage:     { risk: "medium", service: "discord", description: "Send message (write)" },

  // ── High-risk operations (destructive / bulk) ──
  // These represent the class of actions that require re-authentication.
  // When new destructive tools are added, register them here with "high".
  deleteGitHubRepo:       { risk: "high", service: "github", description: "Delete repository (destructive)" },
  bulkSlackMessage:       { risk: "high", service: "slack",  description: "Broadcast to all channels (bulk write)" },
  deleteGmailMessages:    { risk: "high", service: "google", description: "Delete emails (destructive)" },
};

// ─── Decision mapping ────────────────────────────────────────────────

const RISK_TO_DECISION: Record<RiskLevel, RiskDecision> = {
  low:      "EXECUTE",
  medium:   "STEP_UP",
  high:     "REAUTH",
  critical: "BLOCK",
};

// ─── Core evaluation function ────────────────────────────────────────

/**
 * Evaluate the risk of a tool invocation and return a security decision.
 * This is the single entry point for all tool authorization decisions.
 */
export function evaluateRisk(toolName: string): RiskEvaluation {
  const entry = TOOL_RISK_MAP[toolName];
  const timestamp = new Date().toISOString();

  // Unknown tool → fail-closed
  if (!entry) {
    const evaluation: RiskEvaluation = {
      tool: toolName,
      risk: "critical",
      decision: "BLOCK",
      reason: `Unregistered tool "${toolName}" — blocked by default (fail-closed)`,
      timestamp,
    };
    logRiskDecision(evaluation);
    return evaluation;
  }

  const decision = RISK_TO_DECISION[entry.risk];
  const evaluation: RiskEvaluation = {
    tool: toolName,
    risk: entry.risk,
    decision,
    reason: buildReason(entry, decision),
    timestamp,
  };

  logRiskDecision(evaluation);
  return evaluation;
}

function buildReason(entry: ToolRiskEntry, decision: RiskDecision): string {
  switch (decision) {
    case "EXECUTE":
      return `Read-only operation on ${entry.service} — auto-executed`;
    case "STEP_UP":
      return `Write operation on ${entry.service} — requires user approval`;
    case "REAUTH":
      return `Destructive/bulk operation on ${entry.service} — requires re-authentication`;
    case "BLOCK":
      return `Operation blocked — critical risk level`;
    default:
      return "Unknown decision";
  }
}

// ─── Audit integration ───────────────────────────────────────────────

function logRiskDecision(evaluation: RiskEvaluation) {
  const entry = TOOL_RISK_MAP[evaluation.tool];
  addAuditEntry({
    action: `Risk Engine: ${evaluation.tool} → ${evaluation.decision}`,
    service: entry?.service ?? "system",
    scopes: [],
    status: evaluation.decision === "BLOCK" ? "denied" : "success",
    details: `[Risk=${evaluation.risk.toUpperCase()}] ${evaluation.reason}`,
    riskLevel: evaluation.risk,
    stepUpRequired: evaluation.decision === "STEP_UP" || evaluation.decision === "REAUTH",
  });
}

// ─── Helpers for external consumers ──────────────────────────────────

/** Get the risk level for a tool without triggering an evaluation/audit log. */
export function getToolRiskLevel(toolName: string): RiskLevel | null {
  return TOOL_RISK_MAP[toolName]?.risk ?? null;
}

/** Get full risk map (useful for the permissions UI). */
export function getToolRiskMap(): Record<string, ToolRiskEntry> {
  return { ...TOOL_RISK_MAP };
}
