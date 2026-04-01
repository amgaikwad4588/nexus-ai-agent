// Manual token exchange for step-up approved actions
// Uses the same Auth0 Token Vault exchange as the AI SDK, but callable outside tool context

import { addAuditEntry } from "@/lib/audit";

const connectionMap: Record<string, string> = {
  github: "github",
  google: "google-oauth2",
  slack: "slack-custom",
  discord: "discord",
};

export interface TokenExchangeResult {
  accessToken: string | null;
  error?: string;
  errorCode?: "missing_config" | "exchange_failed" | "network_error" | "invalid_response";
}

export async function getAccessTokenForService(
  service: "github" | "google" | "slack" | "discord",
  refreshToken: string
): Promise<string | null> {
  const domain = process.env.AUTH0_AI_DOMAIN || process.env.AUTH0_DOMAIN;
  const clientId = process.env.AUTH0_AI_CLIENT_ID || process.env.AUTH0_CLIENT_ID;
  const clientSecret = process.env.AUTH0_AI_CLIENT_SECRET || process.env.AUTH0_CLIENT_SECRET;
  const connection = connectionMap[service];

  if (!domain || !clientId || !clientSecret) {
    const missing = [!domain && "domain", !clientId && "clientId", !clientSecret && "clientSecret"].filter(Boolean).join(", ");
    console.error(`[token-exchange] Missing config for ${service}: ${missing}`);
    addAuditEntry({
      action: `Token Vault exchange failed: ${service}`,
      service,
      scopes: [],
      status: "failed",
      details: `Missing environment config: ${missing}`,
      riskLevel: "high",
      stepUpRequired: false,
    });
    return null;
  }

  if (!refreshToken) {
    console.error(`[token-exchange] No refresh token for ${service}`);
    addAuditEntry({
      action: `Token Vault exchange failed: ${service}`,
      service,
      scopes: [],
      status: "failed",
      details: "No refresh token available in session — user may need to re-login",
      riskLevel: "high",
      stepUpRequired: false,
    });
    return null;
  }

  try {
    const res = await fetch(`https://${domain}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type:
          "urn:auth0:params:oauth:grant-type:token-exchange:federated-connection-access-token",
        client_id: clientId,
        client_secret: clientSecret,
        subject_token_type: "urn:ietf:params:oauth:token-type:refresh_token",
        subject_token: refreshToken,
        connection,
        requested_token_type:
          "http://auth0.com/oauth/token-type/federated-connection-access-token",
      }),
    });

    const responseText = await res.text();
    if (!res.ok) {
      console.error(`[token-exchange] Failed for ${service}:`, res.status, responseText);
      addAuditEntry({
        action: `Token Vault exchange failed: ${service}`,
        service,
        scopes: [],
        status: "failed",
        details: `Auth0 returned ${res.status}: ${responseText.slice(0, 200)}`,
        riskLevel: "high",
        stepUpRequired: false,
      });
      return null;
    }

    let data: { access_token?: string; scope?: string; token_type?: string; expires_in?: number };
    try {
      data = JSON.parse(responseText);
    } catch {
      console.error(`[token-exchange] Invalid JSON response for ${service}`);
      addAuditEntry({
        action: `Token Vault exchange failed: ${service}`,
        service,
        scopes: [],
        status: "failed",
        details: "Auth0 returned invalid JSON in token exchange response",
        riskLevel: "high",
        stepUpRequired: false,
      });
      return null;
    }

    if (!data.access_token) {
      console.error(`[token-exchange] No access_token in response for ${service}`);
      addAuditEntry({
        action: `Token Vault exchange failed: ${service}`,
        service,
        scopes: [],
        status: "failed",
        details: "Token exchange response missing access_token field",
        riskLevel: "high",
        stepUpRequired: false,
      });
      return null;
    }

    console.log(`[token-exchange] Success for ${service}:`, {
      scopes: data.scope,
      tokenType: data.token_type,
      tokenPrefix: data.access_token?.slice(0, 15),
      expiresIn: data.expires_in,
    });
    return data.access_token;
  } catch (error) {
    console.error(`[token-exchange] Error for ${service}:`, error);
    addAuditEntry({
      action: `Token Vault exchange failed: ${service}`,
      service,
      scopes: [],
      status: "failed",
      details: `Network error: ${error instanceof Error ? error.message : "Unknown error"}`,
      riskLevel: "high",
      stepUpRequired: false,
    });
    return null;
  }
}
