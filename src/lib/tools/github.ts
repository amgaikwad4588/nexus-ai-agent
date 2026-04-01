import { tool } from "ai";
import { z } from "zod";
import { getAccessTokenFromTokenVault } from "@auth0/ai-vercel";
import { withGitHubAccess } from "@/lib/auth0-ai";
import { addAuditEntry } from "@/lib/audit";
import { createPendingAction } from "@/lib/step-up";

export const listGitHubRepos = withGitHubAccess(
  tool({
    description:
      "List the user's GitHub repositories. Can filter by type and sort order.",
    inputSchema: z.object({
      sort: z
        .enum(["created", "updated", "pushed", "full_name"])
        .optional()
        .default("updated")
        .describe("Sort order for repositories"),
      perPage: z
        .number()
        .optional()
        .default(10)
        .describe("Number of repos to return"),
    }),
    execute: async ({ sort, perPage }) => {
      const accessToken = getAccessTokenFromTokenVault();

      addAuditEntry({
        action: "List GitHub repositories",
        service: "github",
        scopes: ["repo", "read:user"],
        status: "success",
        details: `Listed repos sorted by ${sort}`,
        riskLevel: "low",
        stepUpRequired: false,
      });

      const response = await fetch(
        `https://api.github.com/user/repos?sort=${sort}&per_page=${perPage}&direction=desc`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );

      if (!response.ok) {
        return { error: `GitHub API error: ${response.status}`, repos: [] };
      }

      const repos = await response.json();
      return {
        repos: repos.map(
          (repo: {
            name: string;
            full_name: string;
            description: string | null;
            html_url: string;
            stargazers_count: number;
            language: string | null;
            updated_at: string;
            private: boolean;
          }) => ({
            name: repo.name,
            fullName: repo.full_name,
            description: repo.description,
            url: repo.html_url,
            stars: repo.stargazers_count,
            language: repo.language,
            updatedAt: repo.updated_at,
            isPrivate: repo.private,
          })
        ),
      };
    },
  })
);

export const getGitHubIssues = withGitHubAccess(
  tool({
    description:
      "Get issues from a specific GitHub repository or all issues assigned to the user.",
    inputSchema: z.object({
      repo: z
        .string()
        .optional()
        .describe(
          "Repository in 'owner/repo' format. If omitted, returns issues assigned to the user across all repos."
        ),
      state: z
        .enum(["open", "closed", "all"])
        .optional()
        .default("open")
        .describe("Filter by issue state"),
    }),
    execute: async ({ repo, state }) => {
      const accessToken = getAccessTokenFromTokenVault();

      addAuditEntry({
        action: `Get GitHub issues${repo ? ` for ${repo}` : ""}`,
        service: "github",
        scopes: ["repo"],
        status: "success",
        details: `Fetched ${state} issues${repo ? ` from ${repo}` : " assigned to user"}`,
        riskLevel: "low",
        stepUpRequired: false,
      });

      const url = repo
        ? `https://api.github.com/repos/${repo}/issues?state=${state}&per_page=10`
        : `https://api.github.com/issues?filter=assigned&state=${state}&per_page=10`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (!response.ok) {
        return { error: `GitHub API error: ${response.status}`, issues: [] };
      }

      const issues = await response.json();
      return {
        issues: issues.map(
          (issue: {
            number: number;
            title: string;
            state: string;
            html_url: string;
            created_at: string;
            labels: { name: string }[];
            user: { login: string };
          }) => ({
            number: issue.number,
            title: issue.title,
            state: issue.state,
            url: issue.html_url,
            createdAt: issue.created_at,
            labels: issue.labels.map((l) => l.name),
            author: issue.user.login,
          })
        ),
      };
    },
  })
);

export const createGitHubIssue = withGitHubAccess(
  tool({
    description:
      "Create a new issue in a GitHub repository. This is a WRITE action that requires step-up authentication. The action will be queued for user approval before execution. IMPORTANT: The repo MUST be in 'owner/repo' format (e.g. 'amgaikwad4588/nexus-ai-agent'). If the user gives only a repo name without the owner, first call listGitHubRepos to find the correct full name.",
    inputSchema: z.object({
      repo: z.string().describe("Repository in 'owner/repo' format (e.g. 'amgaikwad4588/nexus-ai-agent'). MUST include the owner prefix."),
      title: z.string().describe("Issue title"),
      body: z.string().optional().describe("Issue body/description"),
      labels: z
        .array(z.string())
        .optional()
        .describe("Labels to add to the issue"),
      userId: z.string().optional().describe("Auto-filled by system"),
    }),
    execute: async ({ repo, title, body, labels, userId }) => {
      // ── Validate repo format: must be "owner/repo" ──
      if (!repo.includes("/")) {
        // Repo name is missing the owner — fetch user's repos to suggest matches
        const accessToken = getAccessTokenFromTokenVault();
        let suggestions: { fullName: string; description: string | null }[] = [];
        try {
          const res = await fetch(
            `https://api.github.com/user/repos?per_page=100&sort=updated`,
            { headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/vnd.github.v3+json" } }
          );
          if (res.ok) {
            const repos = await res.json();
            suggestions = repos
              .filter((r: { name: string }) => r.name.toLowerCase().includes(repo.toLowerCase()))
              .slice(0, 5)
              .map((r: { full_name: string; description: string | null }) => ({
                fullName: r.full_name,
                description: r.description,
              }));
          }
        } catch { /* best-effort */ }

        return {
          error: `Invalid repo format: "${repo}". Repository must be in "owner/repo" format.`,
          invalidRepo: true,
          suggestions: suggestions.length > 0 ? suggestions : undefined,
          hint: suggestions.length > 0
            ? `Did you mean one of these? ${suggestions.map((s) => s.fullName).join(", ")}`
            : `No repos found matching "${repo}". Use listGitHubRepos to see your repositories.`,
        };
      }

      // ── Verify the repo exists before queuing ──
      const accessToken = getAccessTokenFromTokenVault();
      const repoCheck = await fetch(`https://api.github.com/repos/${repo}`, {
        headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/vnd.github.v3+json" },
      });

      if (!repoCheck.ok) {
        // Repo not found — search for similar repos
        let suggestions: { fullName: string; description: string | null }[] = [];
        try {
          const repoName = repo.split("/").pop() || repo;
          const res = await fetch(
            `https://api.github.com/user/repos?per_page=100&sort=updated`,
            { headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/vnd.github.v3+json" } }
          );
          if (res.ok) {
            const repos = await res.json();
            suggestions = repos
              .filter((r: { name: string; full_name: string }) =>
                r.name.toLowerCase().includes(repoName.toLowerCase()) ||
                r.full_name.toLowerCase().includes(repoName.toLowerCase())
              )
              .slice(0, 5)
              .map((r: { full_name: string; description: string | null }) => ({
                fullName: r.full_name,
                description: r.description,
              }));
          }
        } catch { /* best-effort */ }

        return {
          error: `Repository "${repo}" not found (404).`,
          invalidRepo: true,
          suggestions: suggestions.length > 0 ? suggestions : undefined,
          hint: suggestions.length > 0
            ? `Did you mean one of these? ${suggestions.map((s) => s.fullName).join(", ")}`
            : `No matching repos found. Use listGitHubRepos to see your repositories.`,
        };
      }

      // ── Repo valid — queue for step-up approval ──
      const pendingAction = createPendingAction(
        "createGitHubIssue",
        { repo, title, body, labels },
        userId || "unknown",
        `Create issue "${title}" in ${repo}`,
        "github",
        "medium"
      );

      addAuditEntry({
        action: `Step-up required: Create GitHub issue in ${repo}`,
        service: "github",
        scopes: ["repo"],
        status: "pending_approval",
        details: `Write operation queued for approval: "${title}" in ${repo}`,
        riskLevel: "medium",
        stepUpRequired: true,
      });

      return {
        requiresApproval: true,
        pendingActionId: pendingAction.id,
        action: "createGitHubIssue",
        description: `Create issue "${title}" in ${repo}`,
        details: { repo, title, body, labels },
        message: "This write operation requires your approval. Please confirm or deny this action.",
      };
    },
  })
);

export const deleteGitHubRepo = withGitHubAccess(
  tool({
    description:
      "Delete a GitHub repository. This is a DESTRUCTIVE HIGH-RISK action that requires re-authentication. The action will be queued for user approval and identity re-verification before execution. IMPORTANT: The repo MUST be in 'owner/repo' format. If the user gives only a repo name, first call listGitHubRepos to find the correct full name.",
    inputSchema: z.object({
      repo: z.string().describe("Repository in 'owner/repo' format (e.g. 'amgaikwad4588/nexus-ai-agent'). MUST include the owner prefix."),
      confirmName: z.string().describe("User must type the repo name to confirm deletion"),
      userId: z.string().optional().describe("Auto-filled by system"),
    }),
    execute: async ({ repo, confirmName, userId }) => {
      // ── Validate repo format ──
      if (!repo.includes("/")) {
        const accessToken = getAccessTokenFromTokenVault();
        let suggestions: { fullName: string }[] = [];
        try {
          const res = await fetch(
            `https://api.github.com/user/repos?per_page=100&sort=updated`,
            { headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/vnd.github.v3+json" } }
          );
          if (res.ok) {
            const repos = await res.json();
            suggestions = repos
              .filter((r: { name: string }) => r.name.toLowerCase().includes(repo.toLowerCase()))
              .slice(0, 5)
              .map((r: { full_name: string }) => ({ fullName: r.full_name }));
          }
        } catch { /* best-effort */ }

        return {
          error: `Invalid repo format: "${repo}". Must be "owner/repo".`,
          suggestions: suggestions.length > 0 ? suggestions : undefined,
        };
      }

      // ── Verify confirmation matches repo name ──
      const repoName = repo.split("/")[1];
      if (confirmName !== repoName) {
        return {
          error: `Confirmation mismatch. You typed "${confirmName}" but the repo name is "${repoName}". Deletion aborted.`,
          confirmationRequired: true,
        };
      }

      // ── Verify repo exists ──
      const accessToken = getAccessTokenFromTokenVault();
      const repoCheck = await fetch(`https://api.github.com/repos/${repo}`, {
        headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/vnd.github.v3+json" },
      });

      if (!repoCheck.ok) {
        return { error: `Repository "${repo}" not found (404).` };
      }

      // ── Queue for step-up approval (HIGH risk = re-auth required) ──
      const pendingAction = createPendingAction(
        "deleteGitHubRepo",
        { repo, confirmName },
        userId || "unknown",
        `DELETE repository ${repo} (destructive)`,
        "github",
        "high"
      );

      addAuditEntry({
        action: `Re-auth required: Delete GitHub repo ${repo}`,
        service: "github",
        scopes: ["delete_repo"],
        status: "pending_approval",
        details: `Destructive operation queued: delete ${repo} — requires re-authentication`,
        riskLevel: "high",
        stepUpRequired: true,
      });

      return {
        requiresApproval: true,
        pendingActionId: pendingAction.id,
        action: "deleteGitHubRepo",
        description: `DELETE repository ${repo}`,
        riskLevel: "high",
        details: { repo, confirmName },
        message: "⚠️ DESTRUCTIVE ACTION: This will permanently delete the repository. Re-authentication is required before execution.",
      };
    },
  })
);

export const getGitHubProfile = withGitHubAccess(
  tool({
    description: "Get the authenticated user's GitHub profile information.",
    inputSchema: z.object({}),
    execute: async () => {
      const accessToken = getAccessTokenFromTokenVault();

      addAuditEntry({
        action: "Get GitHub profile",
        service: "github",
        scopes: ["read:user"],
        status: "success",
        details: "Fetched user GitHub profile",
        riskLevel: "low",
        stepUpRequired: false,
      });

      const response = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (!response.ok) {
        return { error: `GitHub API error: ${response.status}` };
      }

      const user = await response.json();
      return {
        login: user.login,
        name: user.name,
        bio: user.bio,
        publicRepos: user.public_repos,
        followers: user.followers,
        following: user.following,
        avatarUrl: user.avatar_url,
        profileUrl: user.html_url,
      };
    },
  })
);
