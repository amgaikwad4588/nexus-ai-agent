import { tool } from "ai";
import { z } from "zod";
import { getAccessTokenFromTokenVault } from "@auth0/ai-vercel";
import { withGitHubAccess } from "@/lib/auth0-ai";
import { addAuditEntry } from "@/lib/audit";

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
      "Create a new issue in a GitHub repository. This is a write action that modifies the repository.",
    inputSchema: z.object({
      repo: z.string().describe("Repository in 'owner/repo' format"),
      title: z.string().describe("Issue title"),
      body: z.string().optional().describe("Issue body/description"),
      labels: z
        .array(z.string())
        .optional()
        .describe("Labels to add to the issue"),
    }),
    execute: async ({ repo, title, body, labels }) => {
      const accessToken = getAccessTokenFromTokenVault();

      addAuditEntry({
        action: `Create GitHub issue in ${repo}`,
        service: "github",
        scopes: ["repo"],
        status: "success",
        details: `Created issue: "${title}" in ${repo}`,
        riskLevel: "medium",
        stepUpRequired: false,
      });

      const response = await fetch(
        `https://api.github.com/repos/${repo}/issues`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title, body, labels }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        return {
          error: `Failed to create issue: ${response.status} - ${errorText}`,
        };
      }

      const issue = await response.json();
      return {
        number: issue.number,
        title: issue.title,
        url: issue.html_url,
        state: issue.state,
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
