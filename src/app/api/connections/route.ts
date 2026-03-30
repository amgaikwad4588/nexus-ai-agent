import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import type { ConnectedService } from "@/lib/types";

const SERVICES: ConnectedService[] = [
  {
    id: "google",
    name: "Google",
    connection: "google-oauth2",
    icon: "google",
    connected: false,
    scopes: [
      "gmail.readonly",
      "calendar.readonly",
      "calendar.freebusy",
    ],
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
    connection: "slack",
    icon: "slack",
    connected: false,
    scopes: [
      "channels:read",
      "chat:write",
      "users:read",
      "channels:history",
    ],
    tokenStatus: "not_connected",
  },
];

export async function GET() {
  const session = await auth0.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check which services are connected by looking at the user's identities
  const identities = session.user.identities || [];
  const services = SERVICES.map((service) => {
    const identity = identities.find(
      (id: { connection: string }) => id.connection === service.connection
    );
    return {
      ...service,
      connected: !!identity,
      tokenStatus: identity ? "active" as const : "not_connected" as const,
      lastUsed: identity ? new Date().toISOString() : undefined,
    };
  });

  return NextResponse.json({ services });
}
