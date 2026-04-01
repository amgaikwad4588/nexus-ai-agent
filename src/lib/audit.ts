import { AuditEntry } from "./types";
import fs from "fs";
import path from "path";

// ─── JSON file-backed audit log ─────────────────────────────────────
const AUDIT_FILE = path.join(process.cwd(), "data", "audit-log.json");
const AUDIT_TMP = AUDIT_FILE + ".tmp";
const AUDIT_BACKUP = AUDIT_FILE + ".bak";
const MAX_ENTRIES = 500;

function ensureDataDir() {
  const dir = path.dirname(AUDIT_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readLog(): AuditEntry[] {
  try {
    ensureDataDir();
    if (!fs.existsSync(AUDIT_FILE)) return [];
    const raw = fs.readFileSync(AUDIT_FILE, "utf-8");
    return JSON.parse(raw) as AuditEntry[];
  } catch {
    // Main file corrupted — try backup
    try {
      if (fs.existsSync(AUDIT_BACKUP)) {
        const raw = fs.readFileSync(AUDIT_BACKUP, "utf-8");
        const entries = JSON.parse(raw) as AuditEntry[];
        // Restore from backup
        fs.writeFileSync(AUDIT_FILE, JSON.stringify(entries, null, 2), "utf-8");
        console.warn("[audit] Recovered from backup file");
        return entries;
      }
    } catch {
      console.error("[audit] Backup also corrupted — starting fresh");
    }
    return [];
  }
}

function writeLog(entries: AuditEntry[]) {
  ensureDataDir();
  // Write to temp → backup old → rename temp to main (crash-safe)
  fs.writeFileSync(AUDIT_TMP, JSON.stringify(entries, null, 2), "utf-8");
  if (fs.existsSync(AUDIT_FILE)) {
    fs.copyFileSync(AUDIT_FILE, AUDIT_BACKUP);
  }
  fs.renameSync(AUDIT_TMP, AUDIT_FILE);
}

export function addAuditEntry(entry: Omit<AuditEntry, "id" | "timestamp">) {
  const newEntry: AuditEntry = {
    ...entry,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };
  const log = readLog();
  log.unshift(newEntry);
  // Keep last 500 entries
  if (log.length > MAX_ENTRIES) log.length = MAX_ENTRIES;
  writeLog(log);
  return newEntry;
}

export function getAuditLog(limit = 50): AuditEntry[] {
  return readLog().slice(0, limit);
}

export function getAuditStats() {
  const auditLog = readLog();
  const total = auditLog.length;
  const byService = {
    google: auditLog.filter((e) => e.service === "google").length,
    github: auditLog.filter((e) => e.service === "github").length,
    slack: auditLog.filter((e) => e.service === "slack").length,
    discord: auditLog.filter((e) => e.service === "discord").length,
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
