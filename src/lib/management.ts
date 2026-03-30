let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getManagementToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  const domain = process.env.AUTH0_AI_DOMAIN || process.env.AUTH0_DOMAIN!;
  const res = await fetch(`https://${domain}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: process.env.AUTH0_AI_CLIENT_ID || process.env.AUTH0_CLIENT_ID!,
      client_secret:
        process.env.AUTH0_AI_CLIENT_SECRET || process.env.AUTH0_CLIENT_SECRET!,
      audience: `https://${domain}/api/v2/`,
    }),
  });

  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  return data.access_token;
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
