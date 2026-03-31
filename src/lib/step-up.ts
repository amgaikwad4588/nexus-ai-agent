// Step-up authentication for high-risk write operations
// Stores pending actions that require user approval before execution

export interface PendingAction {
  id: string;
  toolName: string;
  args: Record<string, unknown>;
  userId: string;
  createdAt: string;
  expiresAt: string;
  status: "pending" | "approved" | "denied" | "expired" | "executed";
  result?: Record<string, unknown>;
  description: string;
  service: "github" | "slack";
  riskLevel: "medium" | "high" | "critical";
}

// In-memory store for pending actions (in production, use a database)
// Attached to globalThis to survive Next.js HMR in development
const globalForStepUp = globalThis as typeof globalThis & {
  _pendingActions?: Map<string, PendingAction>;
  _stepUpSessions?: Map<string, { verifiedAt: string; expiresAt: string }>;
};

const pendingActions = globalForStepUp._pendingActions ??= new Map<string, PendingAction>();

// Step-up session: tracks users who have recently verified their identity
const stepUpSessions = globalForStepUp._stepUpSessions ??= new Map<string, { verifiedAt: string; expiresAt: string }>();

const PENDING_ACTION_TTL_MS = 5 * 60 * 1000; // 5 minutes
const STEP_UP_SESSION_TTL_MS = 10 * 60 * 1000; // 10 minutes

export function createPendingAction(
  toolName: string,
  args: Record<string, unknown>,
  userId: string,
  description: string,
  service: "github" | "slack",
  riskLevel: "medium" | "high" | "critical" = "medium"
): PendingAction {
  const now = new Date();
  const action: PendingAction = {
    id: crypto.randomUUID(),
    toolName,
    args,
    userId,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + PENDING_ACTION_TTL_MS).toISOString(),
    status: "pending",
    description,
    service,
    riskLevel,
  };
  pendingActions.set(action.id, action);
  cleanupExpired();
  return action;
}

export function getPendingAction(id: string): PendingAction | null {
  const action = pendingActions.get(id);
  if (!action) return null;
  if (new Date(action.expiresAt) < new Date()) {
    action.status = "expired";
    return action;
  }
  return action;
}

export function approveAction(id: string, userId: string): PendingAction | null {
  const action = getPendingAction(id);
  if (!action) return null;
  if (action.status !== "pending") return action;
  action.status = "approved";
  action.userId = userId;
  createStepUpSession(userId);
  return action;
}

export function denyAction(id: string, userId: string): PendingAction | null {
  const action = getPendingAction(id);
  if (!action) return null;
  if (action.status !== "pending") return action;
  action.status = "denied";
  action.userId = userId;
  return action;
}

export function markExecuted(id: string, result: Record<string, unknown>): void {
  const action = pendingActions.get(id);
  if (action) {
    action.status = "executed";
    action.result = result;
  }
}

export function createStepUpSession(userId: string): void {
  const now = new Date();
  stepUpSessions.set(userId, {
    verifiedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + STEP_UP_SESSION_TTL_MS).toISOString(),
  });
}

export function hasValidStepUpSession(userId: string): boolean {
  const session = stepUpSessions.get(userId);
  if (!session) return false;
  if (new Date(session.expiresAt) < new Date()) {
    stepUpSessions.delete(userId);
    return false;
  }
  return true;
}

function cleanupExpired(): void {
  const now = new Date();
  for (const [id, action] of pendingActions) {
    if (new Date(action.expiresAt) < now) {
      action.status = "expired";
      pendingActions.delete(id);
    }
  }
}
