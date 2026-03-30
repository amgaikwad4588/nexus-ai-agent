import { AuditEntry } from "./types";

// In-memory audit store (in production, use a database)
const auditLog: AuditEntry[] = [];

export function addAuditEntry(entry: Omit<AuditEntry, "id" | "timestamp">) {
  const newEntry: AuditEntry = {
    ...entry,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };
  auditLog.unshift(newEntry);
  // Keep last 500 entries
  if (auditLog.length > 500) auditLog.pop();
  return newEntry;
}

export function getAuditLog(limit = 50): AuditEntry[] {
  return auditLog.slice(0, limit);
}

export function getAuditStats() {
  const total = auditLog.length;
  const byService = {
    google: auditLog.filter((e) => e.service === "google").length,
    github: auditLog.filter((e) => e.service === "github").length,
    slack: auditLog.filter((e) => e.service === "slack").length,
    system: auditLog.filter((e) => e.service === "system").length,
  };
  const byStatus = {
    success: auditLog.filter((e) => e.status === "success").length,
    failed: auditLog.filter((e) => e.status === "failed").length,
    pending: auditLog.filter((e) => e.status === "pending_approval").length,
    denied: auditLog.filter((e) => e.status === "denied").length,
  };
  const stepUpCount = auditLog.filter((e) => e.stepUpRequired).length;
  return { total, byService, byStatus, stepUpCount };
}
