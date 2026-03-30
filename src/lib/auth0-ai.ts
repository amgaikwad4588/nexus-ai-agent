import { Auth0AI } from "@auth0/ai-vercel";
import { auth0 } from "./auth0";

export const auth0AI = new Auth0AI({
  auth0: {
    domain: process.env.AUTH0_AI_DOMAIN || process.env.AUTH0_DOMAIN!,
    clientId: process.env.AUTH0_AI_CLIENT_ID || process.env.AUTH0_CLIENT_ID!,
    clientSecret:
      process.env.AUTH0_AI_CLIENT_SECRET || process.env.AUTH0_CLIENT_SECRET!,
  },
});

// Token Vault authorizer for Google (Gmail + Calendar)
export const withGoogleAccess = auth0AI.withTokenVault({
  connection: "google-oauth2",
  scopes: [
    "openid",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/calendar.freebusy",
  ],
  refreshToken: async () => {
    const session = await auth0.getSession();
    return session?.tokenSet.refreshToken!;
  },
});

// Token Vault authorizer for GitHub
export const withGitHubAccess = auth0AI.withTokenVault({
  connection: "github",
  scopes: ["repo", "read:user", "read:org"],
  refreshToken: async () => {
    const session = await auth0.getSession();
    return session?.tokenSet.refreshToken!;
  },
});

// Token Vault authorizer for Slack
export const withSlackAccess = auth0AI.withTokenVault({
  connection: "slack-oauth-2",
  scopes: [
    "channels:read",
    "chat:write",
    "users:read",
    "channels:history",
  ],
  refreshToken: async () => {
    const session = await auth0.getSession();
    return session?.tokenSet.refreshToken!;
  },
});

// CIBA authorizer for dangerous actions
export const withStepUpAuth = auth0AI.withAsyncAuthorization({
  userID: async () => {
    const session = await auth0.getSession();
    return session?.user.sub!;
  },
  bindingMessage: async (params: { action: string }) => {
    return `Confirm: ${params.action}`;
  },
  requestedExpiry: 300,
  scopes: ["openid"],
});
