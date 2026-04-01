import { getManagementToken } from "@/lib/management";
import { addAuditEntry } from "@/lib/audit";

// ---------- Tool → permission mapping ----------

interface ToolPermission {
  service: "google" | "github" | "slack" | "discord";
  requiredScopes: string[];
  accessType: "read" | "write";
}

const TOOL_PERMISSIONS: Record<string, ToolPermission> = {
  // Google
  searchGmail: { service: "google", requiredScopes: ["gmail.readonly"], accessType: "read" },
  checkCalendar: { service: "google", requiredScopes: ["calendar.readonly"], accessType: "read" },
  // GitHub
  listGitHubRepos: { service: "github", requiredScopes: ["repo", "read:user"], accessType: "read" },
  getGitHubIssues: { service: "github", requiredScopes: ["repo"], accessType: "read" },
  createGitHubIssue: { service: "github", requiredScopes: ["repo"], accessType: "write" },
  deleteGitHubRepo: { service: "github", requiredScopes: ["delete_repo"], accessType: "write" },
  getGitHubProfile: { service: "github", requiredScopes: ["read:user"], accessType: "read" },
  // Slack
  listSlackChannels: { service: "slack", requiredScopes: ["channels:read"], accessType: "read" },
  sendSlackMessage: { service: "slack", requiredScopes: ["chat:write"], accessType: "write" },
  getSlackChannelHistory: { service: "slack", requiredScopes: ["channels:history"], accessType: "read" },
  // Discord
  getDiscordProfile: { service: "discord", requiredScopes: ["identify"], accessType: "read" },
  listDiscordGuilds: { service: "discord", requiredScopes: ["guilds"], accessType: "read" },
  getDiscordGuildMember: { service: "discord", requiredScopes: ["guilds.members.read"], accessType: "read" },
};

// Map service id → Auth0 connection name (must match connections/route.ts SERVICES)
const SERVICE_CONNECTIONS: Record<string, string> = {
  google: "google-oauth2",
  github: "github",
  slack: "slack-custom",
  discord: "discord",
};

// ---------- User permission preferences (in-memory) ----------
// Key: `${userId}:${scope}` → boolean (true = allowed, false = denied)
// Default: all scopes are ON — user can turn them off from the Permissions page.

const userScopePreferences = new Map<string, boolean>();

function prefKey(userId: string, scope: string) {
  return `${userId}:${scope}`;
}

/** Get all scope preferences for a user. Returns a map of scope → enabled. */
export function getUserPermissions(userId: string): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  // Collect every known scope across all services
  const allScopes = new Set<string>();
  for (const perm of Object.values(TOOL_PERMISSIONS)) {
    for (const s of perm.requiredScopes) allScopes.add(s);
  }
  for (const scope of allScopes) {
    const key = prefKey(userId, scope);
    // Default to true (allowed) if user hasn't explicitly toggled
    result[scope] = userScopePreferences.get(key) ?? true;
  }
  return result;
}

/** Set a single scope preference for a user. */
export function setUserPermission(userId: string, scope: string, allowed: boolean) {
  userScopePreferences.set(prefKey(userId, scope), allowed);
}

/** Bulk-set scope preferences for a user. */
export function setUserPermissions(userId: string, prefs: Record<string, boolean>) {
  for (const [scope, allowed] of Object.entries(prefs)) {
    userScopePreferences.set(prefKey(userId, scope), allowed);
  }
}

// ---------- Connected-accounts cache (per-request) ----------

interface ConnectedAccount {
  id: string;
  connection: string;
  scopes?: string[];
}

// Simple in-memory cache to avoid hitting the Management API for every tool call
// within the same chat request. TTL = 30 s.
let cachedAccounts: { userId: string; accounts: ConnectedAccount[]; ts: number } | null = null;
const CACHE_TTL_MS = 30_000;

async function getConnectedAccounts(userId: string): Promise<ConnectedAccount[]> {
  if (cachedAccounts && cachedAccounts.userId === userId && Date.now() - cachedAccounts.ts < CACHE_TTL_MS) {
    return cachedAccounts.accounts;
  }

  try {
    const token = await getManagementToken();
    const domain = process.env.AUTH0_DOMAIN;
    const res = await fetch(
      `https://${domain}/api/v2/users/${encodeURIComponent(userId)}/connected-accounts`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (res.ok) {
      const data = await res.json();
      const accounts: ConnectedAccount[] = data.connected_accounts || data || [];
      cachedAccounts = { userId, accounts, ts: Date.now() };
      return accounts;
    }
  } catch (err) {
    console.error("[permissions] Failed to fetch connected accounts:", err);
  }

  return [];
}

// ---------- Public API ----------

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  service?: string;
  accessType?: string;
}

/**
 * Server-side permission check. Call this BEFORE executing any tool.
 *
 * Returns { allowed: true } when the user has the service connected,
 * or { allowed: false, reason: "..." } with a human-readable reason.
 */
export async function checkToolPermission(
  toolName: string,
  userId: string
): Promise<PermissionCheckResult> {
  const perm = TOOL_PERMISSIONS[toolName];

  // Unknown tool → block by default (fail-closed)
  if (!perm) {
    return { allowed: false, reason: `Unknown tool "${toolName}" — blocked by default.` };
  }

  // ---- Check 1: Has the user enabled these scopes on the Permissions page? ----
  const userPrefs = getUserPermissions(userId);
  const deniedScopes = perm.requiredScopes.filter((s) => userPrefs[s] === false);
  if (deniedScopes.length > 0) {
    return {
      allowed: false,
      reason: `You have disabled the following permission(s): ${deniedScopes.join(", ")}. Enable them on the Permissions page to use ${toolName}.`,
      service: perm.service,
      accessType: perm.accessType,
    };
  }

  // ---- Check 2: Is the service actually connected / configured? ----
  // Slack uses a bot token, not per-user Connected Accounts
  if (perm.service === "slack") {
    if (!process.env.SLACK_BOT_TOKEN) {
      return {
        allowed: false,
        reason: "Slack is not configured. Please ask an admin to set up the Slack integration.",
        service: "slack",
        accessType: perm.accessType,
      };
    }
    return { allowed: true, service: "slack", accessType: perm.accessType };
  }

  // For all other services: check that the user has a connected account
  const accounts = await getConnectedAccounts(userId);
  const connectionName = SERVICE_CONNECTIONS[perm.service];
  const connected = accounts.some((a) => a.connection === connectionName);

  if (!connected) {
    return {
      allowed: false,
      reason: `${perm.service.charAt(0).toUpperCase() + perm.service.slice(1)} is not connected. Please connect it from the Connections page before using ${toolName}.`,
      service: perm.service,
      accessType: perm.accessType,
    };
  }

  return { allowed: true, service: perm.service, accessType: perm.accessType };
}

/**
 * Log a blocked tool call to the audit trail.
 */
export function logPermissionDenied(toolName: string, result: PermissionCheckResult) {
  addAuditEntry({
    action: `Permission denied: ${toolName}`,
    service: (result.service as "google" | "github" | "slack" | "discord") || "system",
    scopes: [],
    status: "denied",
    details: result.reason || "Permission check failed",
    riskLevel: result.accessType === "write" ? "medium" : "low",
    stepUpRequired: false,
  });
}

/** Lookup helper — useful for the step-up route to verify before execution. */
export function getToolPermission(toolName: string): ToolPermission | undefined {
  return TOOL_PERMISSIONS[toolName];
}
