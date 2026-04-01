import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock audit to avoid file I/O during tests
vi.mock("@/lib/audit", () => ({
  addAuditEntry: vi.fn(),
}));

import { evaluateRisk, getToolRiskLevel, getToolRiskMap } from "../risk-engine";

describe("Risk Engine", () => {
  // ─── Decision paths ───────────────────────────────────────────────

  describe("evaluateRisk", () => {
    it("LOW risk tools → EXECUTE decision", () => {
      const lowTools = [
        "searchGmail",
        "checkCalendar",
        "listGitHubRepos",
        "getGitHubIssues",
        "getGitHubProfile",
        "listSlackChannels",
        "getSlackChannelHistory",
        "getDiscordProfile",
        "listDiscordGuilds",
        "getDiscordGuildMember",
      ];

      for (const tool of lowTools) {
        const result = evaluateRisk(tool);
        expect(result.risk).toBe("low");
        expect(result.decision).toBe("EXECUTE");
        expect(result.tool).toBe(tool);
      }
    });

    it("MEDIUM risk tools → STEP_UP decision", () => {
      const mediumTools = ["createGitHubIssue", "sendSlackMessage"];

      for (const tool of mediumTools) {
        const result = evaluateRisk(tool);
        expect(result.risk).toBe("medium");
        expect(result.decision).toBe("STEP_UP");
      }
    });

    it("HIGH risk tools → REAUTH decision", () => {
      const highTools = [
        "deleteGitHubRepo",
        "bulkSlackMessage",
        "deleteGmailMessages",
      ];

      for (const tool of highTools) {
        const result = evaluateRisk(tool);
        expect(result.risk).toBe("high");
        expect(result.decision).toBe("REAUTH");
      }
    });

    it("UNKNOWN tools → BLOCK decision (fail-closed)", () => {
      const result = evaluateRisk("nonExistentTool");
      expect(result.risk).toBe("critical");
      expect(result.decision).toBe("BLOCK");
      expect(result.reason).toContain("Unregistered tool");
      expect(result.reason).toContain("fail-closed");
    });

    it("returns timestamp on every evaluation", () => {
      const result = evaluateRisk("searchGmail");
      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp).getTime()).not.toBeNaN();
    });

    it("reason explains the decision", () => {
      expect(evaluateRisk("searchGmail").reason).toContain("auto-executed");
      expect(evaluateRisk("createGitHubIssue").reason).toContain(
        "requires user approval"
      );
      expect(evaluateRisk("deleteGitHubRepo").reason).toContain(
        "requires re-authentication"
      );
    });
  });

  // ─── Helper functions ─────────────────────────────────────────────

  describe("getToolRiskLevel", () => {
    it("returns risk level for registered tools", () => {
      expect(getToolRiskLevel("searchGmail")).toBe("low");
      expect(getToolRiskLevel("createGitHubIssue")).toBe("medium");
      expect(getToolRiskLevel("deleteGitHubRepo")).toBe("high");
    });

    it("returns null for unregistered tools", () => {
      expect(getToolRiskLevel("fakeTool")).toBeNull();
    });
  });

  describe("getToolRiskMap", () => {
    it("returns all 15 registered tools", () => {
      const map = getToolRiskMap();
      expect(Object.keys(map).length).toBe(15);
    });

    it("every entry has risk, service, and description", () => {
      const map = getToolRiskMap();
      for (const [name, entry] of Object.entries(map)) {
        expect(entry.risk).toBeDefined();
        expect(entry.service).toBeDefined();
        expect(entry.description).toBeDefined();
      }
    });

    it("returns a copy (not mutable reference)", () => {
      const map1 = getToolRiskMap();
      delete (map1 as Record<string, unknown>)["searchGmail"];
      const map2 = getToolRiskMap();
      expect(map2["searchGmail"]).toBeDefined();
    });
  });
});
