import { Auth0AI } from "@auth0/ai-vercel";
import { auth0 } from "./auth0";

export const auth0AI = new Auth0AI({
  auth0: {
    domain: process.env.AUTH0_AI_DOMAIN || process.env.AUTH0_DOMAIN!,
    clientId: process.env.AUTH0_M2M_CLIENT_ID || process.env.AUTH0_AI_CLIENT_ID || process.env.AUTH0_CLIENT_ID!,
    clientSecret:
      process.env.AUTH0_M2M_CLIENT_SECRET || process.env.AUTH0_AI_CLIENT_SECRET || process.env.AUTH0_CLIENT_SECRET!,
  },
});

async function getRefreshToken(): Promise<string | undefined> {
  const session = await auth0.getSession();
  return session?.tokenSet.refreshToken;
}

export const withGoogleAccess = auth0AI.withTokenVault({
  connection: "google-oauth2",
  scopes: [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/calendar.readonly",
  ],
  refreshToken: getRefreshToken,
});

export const withGitHubAccess = auth0AI.withTokenVault({
  connection: "github",
  scopes: ["repo", "read:user", "read:org"],
  refreshToken: getRefreshToken,
});

export const withDiscordAccess = auth0AI.withTokenVault({
  connection: "discord",
  scopes: ["identify", "guilds", "guilds.members.read"],
  refreshToken: getRefreshToken,
});
