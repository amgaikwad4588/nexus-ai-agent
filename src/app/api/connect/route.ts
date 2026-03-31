import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth0 } from "@/lib/auth0";
import { getMyAccountToken } from "@/lib/management";

// Scopes to request per connection for the Connected Accounts flow
const CONNECTION_SCOPES: Record<string, string[]> = {
  "google-oauth2": [
    "openid",
    "profile",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/calendar.readonly",
  ],
  github: ["repo", "read:user", "read:org"],
};

export async function GET(req: Request) {
  const session = await auth0.getSession();
  if (!session) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  const url = new URL(req.url);
  const connection = url.searchParams.get("connection");

  if (!connection) {
    return NextResponse.redirect(new URL("/dashboard/connections", req.url));
  }

  const refreshToken = session.tokenSet.refreshToken;
  if (!refreshToken) {
    console.error("[Nexus] No refresh token in session — cannot initiate Connected Accounts flow");
    return NextResponse.redirect(
      new URL("/dashboard/connections?error=no_refresh_token", req.url)
    );
  }

  try {
    const domain = process.env.AUTH0_DOMAIN!;
    const myAccountToken = await getMyAccountToken(refreshToken);

    // Initiate the Connected Accounts flow via My Account API
    const connectRes = await fetch(
      `https://${domain}/me/v1/connected-accounts/connect`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${myAccountToken}`,
        },
        body: JSON.stringify({
          connection,
          redirect_uri: `${process.env.APP_BASE_URL}/api/connect/complete`,
          state: crypto.randomUUID(),
          scopes: CONNECTION_SCOPES[connection] || [],
        }),
      }
    );

    if (!connectRes.ok) {
      const err = await connectRes.text();
      console.error("[Nexus] Connected Accounts initiate failed:", connectRes.status, err);
      return NextResponse.redirect(
        new URL("/dashboard/connections?error=connect_failed", req.url)
      );
    }

    const connectData = await connectRes.json();

    // Store auth_session in a cookie for verification during the complete step
    const cookieStore = await cookies();
    cookieStore.set("nexus_auth_session", connectData.auth_session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 300,
      path: "/",
    });

    // Redirect user to the connect_uri with the ticket for authorization
    const connectUrl = new URL(connectData.connect_uri);
    if (connectData.connect_params?.ticket) {
      connectUrl.searchParams.set("ticket", connectData.connect_params.ticket);
    }

    return NextResponse.redirect(connectUrl.toString());
  } catch (err) {
    console.error("[Nexus] Connected Accounts error:", err);
    return NextResponse.redirect(
      new URL("/dashboard/connections?error=connect_error", req.url)
    );
  }
}
