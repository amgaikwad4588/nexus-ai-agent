let cachedM2MToken: { token: string; expiresAt: number } | null = null;
let cachedMyAccountToken: { token: string; expiresAt: number } | null = null;

/**
 * Exchange an Auth0 refresh token for a My Account API access token (via MRRT).
 * Required for the Connected Accounts flow.
 */
export async function getMyAccountToken(
  refreshToken: string
): Promise<string> {
  if (cachedMyAccountToken && cachedMyAccountToken.expiresAt > Date.now()) {
    return cachedMyAccountToken.token;
  }

  const domain = process.env.AUTH0_DOMAIN!;
  const res = await fetch(`https://${domain}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "refresh_token",
      client_id: process.env.AUTH0_CLIENT_ID!,
      client_secret: process.env.AUTH0_CLIENT_SECRET!,
      refresh_token: refreshToken,
      audience: `https://${domain}/me/`,
      scope:
        "openid profile offline_access create:me:connected_accounts read:me:connected_accounts delete:me:connected_accounts",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[Nexus] Failed to get My Account API token:", res.status, err);
    throw new Error(`Failed to get My Account API token: ${res.status}`);
  }

  const data = await res.json();
  cachedMyAccountToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  return data.access_token;
}

export async function getManagementToken(): Promise<string> {
  if (cachedM2MToken && cachedM2MToken.expiresAt > Date.now()) {
    return cachedM2MToken.token;
  }

  const domain = process.env.AUTH0_DOMAIN!;
  const res = await fetch(`https://${domain}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: process.env.AUTH0_M2M_CLIENT_ID!,
      client_secret: process.env.AUTH0_M2M_CLIENT_SECRET!,
      audience: `https://${domain}/api/v2/`,
    }),
  });

  const data = await res.json();
  cachedM2MToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  return data.access_token;
}

export async function getUpstreamToken(
  userId: string,
  connection: string
): Promise<string | null> {
  try {
    const token = await getManagementToken();
    const domain = process.env.AUTH0_DOMAIN!;
    const res = await fetch(
      `https://${domain}/api/v2/users/${encodeURIComponent(userId)}?fields=identities`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const identity = data.identities?.find(
      (i: { connection: string }) => i.connection === connection
    );
    return identity?.access_token || null;
  } catch {
    return null;
  }
}

export async function linkAccounts(
  primaryUserId: string,
  secondaryProvider: string,
  secondaryUserId: string
): Promise<boolean> {
  const token = await getManagementToken();
  const domain = process.env.AUTH0_AI_DOMAIN || process.env.AUTH0_DOMAIN!;

  const res = await fetch(
    `https://${domain}/api/v2/users/${encodeURIComponent(primaryUserId)}/identities`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        provider: secondaryProvider,
        user_id: secondaryUserId,
      }),
    }
  );

  return res.ok;
}
