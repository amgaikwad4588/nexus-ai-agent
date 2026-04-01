import { Auth0AI } from "@auth0/ai-vercel";
import { auth0 } from "./auth0";

export const auth0AI = new Auth0AI({
  auth0: {
    domain: process.env.AUTH0_DOMAIN!,
    clientId: process.env.AUTH0_CLIENT_ID!,
    clientSecret: process.env.AUTH0_CLIENT_SECRET!,
  },
});

// Cache refresh token per-request so tools can access it during streaming
// (Next.js cookies context is lost inside async tool execution on Vercel)
let _requestRefreshToken: string | undefined;

export function setRequestRefreshToken(token: string | undefined) {
  _requestRefreshToken = token;
}

async function getRefreshToken(): Promise<string | undefined> {
  if (_requestRefreshToken) {
    console.log("[auth0-ai] Using cached refresh token:", _requestRefreshToken.slice(0, 10) + "...");
    return _requestRefreshToken;
  }
  console.log("[auth0-ai] No cached token, trying getSession...");
  const session = await auth0.getSession();
  const token = session?.tokenSet.refreshToken;
  console.log("[auth0-ai] getSession result:", token ? token.slice(0, 10) + "..." : "NO TOKEN");
  return token;
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
