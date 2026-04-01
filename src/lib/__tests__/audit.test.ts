import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";

// Use a test-specific data directory to avoid touching real audit logs
const TEST_DATA_DIR = path.join(process.cwd(), "data-test");
const TEST_AUDIT_FILE = path.join(TEST_DATA_DIR, "audit-log.json");
const TEST_AUDIT_TMP = TEST_AUDIT_FILE + ".tmp";
const TEST_AUDIT_BACKUP = TEST_AUDIT_FILE + ".bak";

// Override the audit file path before importing
import { vi } from "vitest";
vi.mock("fs", async () => {
  const actual = await vi.importActual<typeof import("fs")>("fs");
  return { ...actual, default: actual };
});

// We'll test the core logic by importing and using the real module
// but with a controlled data directory
import { addAuditEntry, getAuditLog, getAuditStats } from "../audit";

function cleanTestDir() {
  if (fs.existsSync(TEST_DATA_DIR)) {
    fs.rmSync(TEST_DATA_DIR, { recursive: true });
  }
}

// Since the audit module uses a hardcoded path, we test via integration
// by cleaning the real data directory before/after tests
const DATA_DIR = path.join(process.cwd(), "data");
const AUDIT_FILE = path.join(DATA_DIR, "audit-log.json");
const AUDIT_BACKUP = AUDIT_FILE + ".bak";
let originalData: string | null = null;

beforeEach(() => {
  // Backup existing audit data
  try {
    if (fs.existsSync(AUDIT_FILE)) {
      originalData = fs.readFileSync(AUDIT_FILE, "utf-8");
    }
  } catch {
    originalData = null;
  }
  // Clear for clean test
  if (fs.existsSync(AUDIT_FILE)) fs.unlinkSync(AUDIT_FILE);
  if (fs.existsSync(AUDIT_BACKUP)) fs.unlinkSync(AUDIT_BACKUP);
});

afterEach(() => {
  // Restore original data
  if (originalData) {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(AUDIT_FILE, originalData, "utf-8");
  } else {
    if (fs.existsSync(AUDIT_FILE)) fs.unlinkSync(AUDIT_FILE);
  }
  if (fs.existsSync(AUDIT_BACKUP)) fs.unlinkSync(AUDIT_BACKUP);
});

describe("Audit Module", () => {
  describe("addAuditEntry", () => {
    it("creates an entry with auto-generated id and timestamp", () => {
      const entry = addAuditEntry({
        action: "Test action",
        service: "system",
        scopes: [],
        status: "success",
        details: "Test details",
        riskLevel: "low",
        stepUpRequired: false,
      });

      expect(entry.id).toBeDefined();
      expect(entry.timestamp).toBeDefined();
      expect(entry.action).toBe("Test action");
      expect(new Date(entry.timestamp).getTime()).not.toBeNaN();
    });

    it("persists to disk", () => {
      addAuditEntry({
        action: "Persist test",
        service: "github",
        scopes: ["repo"],
        status: "success",
        details: "Should be on disk",
        riskLevel: "low",
        stepUpRequired: false,
      });

      expect(fs.existsSync(AUDIT_FILE)).toBe(true);
      const raw = JSON.parse(fs.readFileSync(AUDIT_FILE, "utf-8"));
      expect(raw).toHaveLength(1);
      expect(raw[0].action).toBe("Persist test");
    });

    it("includes userId when provided", () => {
      const entry = addAuditEntry({
        userId: "auth0|test123",
        action: "With userId",
        service: "system",
        scopes: [],
        status: "success",
        details: "Has userId",
        riskLevel: "low",
        stepUpRequired: false,
      });

      expect(entry.userId).toBe("auth0|test123");
    });

    it("newest entries come first", () => {
      addAuditEntry({
        action: "First",
        service: "system",
        scopes: [],
        status: "success",
        details: "",
        riskLevel: "low",
        stepUpRequired: false,
      });
      addAuditEntry({
        action: "Second",
        service: "system",
        scopes: [],
        status: "success",
        details: "",
        riskLevel: "low",
        stepUpRequired: false,
      });

      const log = getAuditLog();
      expect(log[0].action).toBe("Second");
      expect(log[1].action).toBe("First");
    });
  });

  describe("getAuditLog", () => {
    it("returns empty array when no entries exist", () => {
      expect(getAuditLog()).toEqual([]);
    });

    it("respects limit parameter", () => {
      for (let i = 0; i < 10; i++) {
        addAuditEntry({
          action: `Entry ${i}`,
          service: "system",
          scopes: [],
          status: "success",
          details: "",
          riskLevel: "low",
          stepUpRequired: false,
        });
      }

      expect(getAuditLog(3)).toHaveLength(3);
      expect(getAuditLog(10)).toHaveLength(10);
    });
  });

  describe("getAuditStats", () => {
    it("returns zero counts when empty", () => {
      const stats = getAuditStats();
      expect(stats.total).toBe(0);
      expect(stats.stepUpCount).toBe(0);
    });

    it("counts by service correctly", () => {
      addAuditEntry({ action: "a", service: "github", scopes: [], status: "success", details: "", riskLevel: "low", stepUpRequired: false });
      addAuditEntry({ action: "b", service: "github", scopes: [], status: "success", details: "", riskLevel: "low", stepUpRequired: false });
      addAuditEntry({ action: "c", service: "slack", scopes: [], status: "failed", details: "", riskLevel: "low", stepUpRequired: false });

      const stats = getAuditStats();
      expect(stats.total).toBe(3);
      expect(stats.byService.github).toBe(2);
      expect(stats.byService.slack).toBe(1);
      expect(stats.byService.google).toBe(0);
    });

    it("counts by status correctly", () => {
      addAuditEntry({ action: "a", service: "system", scopes: [], status: "success", details: "", riskLevel: "low", stepUpRequired: false });
      addAuditEntry({ action: "b", service: "system", scopes: [], status: "failed", details: "", riskLevel: "low", stepUpRequired: false });
      addAuditEntry({ action: "c", service: "system", scopes: [], status: "denied", details: "", riskLevel: "low", stepUpRequired: true });

      const stats = getAuditStats();
      expect(stats.byStatus.success).toBe(1);
      expect(stats.byStatus.failed).toBe(1);
      expect(stats.byStatus.denied).toBe(1);
      expect(stats.stepUpCount).toBe(1);
    });
  });

  describe("crash recovery", () => {
    it("recovers from corrupted main file using backup", () => {
      // Write two entries so the second write creates a .bak of the first
      addAuditEntry({
        action: "Before crash",
        service: "system",
        scopes: [],
        status: "success",
        details: "",
        riskLevel: "low",
        stepUpRequired: false,
      });
      addAuditEntry({
        action: "Second entry",
        service: "system",
        scopes: [],
        status: "success",
        details: "",
        riskLevel: "low",
        stepUpRequired: false,
      });

      // Verify backup exists
      expect(fs.existsSync(AUDIT_BACKUP)).toBe(true);

      // Corrupt the main file
      fs.writeFileSync(AUDIT_FILE, "{{not valid json!!", "utf-8");

      // Read should recover from backup (which has the state before the second write)
      const log = getAuditLog();
      expect(log.length).toBeGreaterThanOrEqual(1);
      expect(log[0].action).toBe("Before crash");
    });

    it("returns empty if both main and backup are corrupted", () => {
      fs.writeFileSync(AUDIT_FILE, "corrupt", "utf-8");
      fs.writeFileSync(AUDIT_BACKUP, "also corrupt", "utf-8");

      const log = getAuditLog();
      expect(log).toEqual([]);
    });
  });
});
