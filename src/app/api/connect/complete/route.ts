import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth0 } from "@/lib/auth0";
import { getMyAccountToken } from "@/lib/management";

export async function GET(req: Request) {
  const session = await auth0.getSession();
  if (!session) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  const url = new URL(req.url);
  const connectCode = url.searchParams.get("connect_code");

  const cookieStore = await cookies();
  const authSessionCookie = cookieStore.get("nexus_auth_session");

  if (!connectCode || !authSessionCookie?.value) {
    console.error("[Nexus] Missing connect_code or auth_session");
    return NextResponse.redirect(
      new URL("/dashboard/connections?error=missing_params", req.url)
    );
  }

  const refreshToken = session.tokenSet.refreshToken;
  if (!refreshToken) {
    return NextResponse.redirect(
      new URL("/dashboard/connections?error=no_refresh_token", req.url)
    );
  }

  try {
    const domain = process.env.AUTH0_DOMAIN!;
    const myAccountToken = await getMyAccountToken(refreshToken);

    // Complete the Connected Accounts flow
    const completeRes = await fetch(
      `https://${domain}/me/v1/connected-accounts/complete`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${myAccountToken}`,
        },
        body: JSON.stringify({
          auth_session: authSessionCookie.value,
          connect_code: connectCode,
          redirect_uri: `${process.env.APP_BASE_URL}/api/connect/complete`,
        }),
      }
    );

    if (!completeRes.ok) {
      const err = await completeRes.text();
      console.error("[Nexus] Connected Accounts complete failed:", completeRes.status, err);
      return NextResponse.redirect(
        new URL("/dashboard/connections?error=complete_failed", req.url)
      );
    }

    const result = await completeRes.json();
    console.log(
      `[Nexus] Connected account: ${result.connection} (${result.id}), access_type: ${result.access_type}`
    );

    // Clear the cookie
    cookieStore.delete("nexus_auth_session");

    return NextResponse.redirect(
      new URL("/dashboard/connections", req.url)
    );
  } catch (err) {
    console.error("[Nexus] Connected Accounts complete error:", err);
    return NextResponse.redirect(
      new URL("/dashboard/connections?error=complete_error", req.url)
    );
  }
}
