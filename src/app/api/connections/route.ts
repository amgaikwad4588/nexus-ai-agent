import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { getManagementToken } from "@/lib/management";
import type { ConnectedService } from "@/lib/types";

const SERVICES: ConnectedService[] = [
  {
    id: "google",
    name: "Google",
    connection: "google-oauth2",
    icon: "google",
    connected: false,
    scopes: ["gmail.readonly", "calendar.readonly", "calendar.freebusy"],
    tokenStatus: "not_connected",
  },
  {
    id: "github",
    name: "GitHub",
    connection: "github",
    icon: "github",
    connected: false,
    scopes: ["repo", "read:user", "read:org"],
    tokenStatus: "not_connected",
  },
  {
    id: "slack",
    name: "Slack",
    connection: "slack-oauth-2",
    icon: "slack",
    connected: false,
    scopes: ["channels:read", "chat:write", "users:read", "channels:history"],
    tokenStatus: "not_connected",
  },
];

export async function GET() {
  const session = await auth0.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use M2M Management API token to get full user profile with all linked identities
  let identities: { connection: string; provider: string }[] = [];

  try {
    const token = await getManagementToken();
    const domain = process.env.AUTH0_DOMAIN;
    const userId = session.user.sub;

    const res = await fetch(
      `https://${domain}/api/v2/users/${encodeURIComponent(userId)}?fields=identities`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (res.ok) {
      const user = await res.json();
      identities = user.identities || [];
      console.log("[Nexus] User identities:", JSON.stringify(identities.map((i: { provider: string; connection: string }) => `${i.provider}|${i.connection}`)));
    } else {
      console.log("[Nexus] Management API error:", res.status, await res.text());
    }
  } catch (err) {
    console.log("[Nexus] Failed to fetch identities:", err);
  }

  const services = SERVICES.map((service) => {
    const identity = identities.find(
      (id) => id.connection === service.connection || id.provider === service.connection
    );

    return {
      ...service,
      connected: !!identity,
      tokenStatus: identity ? ("active" as const) : ("not_connected" as const),
      lastUsed: identity ? new Date().toISOString() : undefined,
    };
  });

  return NextResponse.json({ services });
}
