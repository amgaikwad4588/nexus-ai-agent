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
    scopes: ["gmail.readonly", "calendar.readonly"],
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
];

interface ConnectedAccount {
  id: string;
  connection: string;
  access_type?: string;
  scopes?: string[];
  created_at?: string;
}

export async function GET() {
  const session = await auth0.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check connected_accounts via Management API (this is where Token Vault stores connections)
  let connectedAccounts: ConnectedAccount[] = [];

  try {
    const token = await getManagementToken();
    const domain = process.env.AUTH0_DOMAIN;
    const userId = session.user.sub;

    const res = await fetch(
      `https://${domain}/api/v2/users/${encodeURIComponent(userId)}/connected-accounts`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (res.ok) {
      const data = await res.json();
      connectedAccounts = data.connected_accounts || data || [];
      console.log(
        "[Nexus] Connected accounts:",
        JSON.stringify(
          connectedAccounts.map((a) => `${a.connection} (${a.id})`)
        )
      );
    } else {
      console.log(
        "[Nexus] Management API error fetching connected accounts:",
        res.status,
        await res.text()
      );
    }
  } catch (err) {
    console.log("[Nexus] Failed to fetch connected accounts:", err);
  }

  const services = SERVICES.map((service) => {
    const account = connectedAccounts.find(
      (a) => a.connection === service.connection
    );

    return {
      ...service,
      connected: !!account,
      accountId: account?.id,
      tokenStatus: account
        ? ("active" as const)
        : ("not_connected" as const),
      lastUsed: account?.created_at,
    };
  });

  return NextResponse.json({ services });
}
