// Manual token exchange for step-up approved actions
// Uses the same Auth0 Token Vault exchange as the AI SDK, but callable outside tool context

const connectionMap: Record<string, string> = {
  github: "github",
  google: "google-oauth2",
  slack: "sign-in-with-slack",
};

export async function getAccessTokenForService(
  service: "github" | "google" | "slack",
  refreshToken: string
): Promise<string | null> {
  const domain = process.env.AUTH0_AI_DOMAIN || process.env.AUTH0_DOMAIN;
  const clientId = process.env.AUTH0_AI_CLIENT_ID || process.env.AUTH0_CLIENT_ID;
  const clientSecret = process.env.AUTH0_AI_CLIENT_SECRET || process.env.AUTH0_CLIENT_SECRET;
  const connection = connectionMap[service];

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
      return null;
    }

    const data = JSON.parse(responseText);
    console.log(`[token-exchange] Success for ${service}:`, {
      scopes: data.scope,
      tokenType: data.token_type,
      tokenPrefix: data.access_token?.slice(0, 15),
      expiresIn: data.expires_in,
    });
    return data.access_token || null;
  } catch (error) {
    console.error(`[token-exchange] Error for ${service}:`, error);
    return null;
  }
}
