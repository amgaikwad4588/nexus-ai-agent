import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { getMyAccountToken } from "@/lib/management";

export async function POST(request: Request) {
  const session = await auth0.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { accountId } = await request.json();
  if (!accountId) {
    return NextResponse.json(
      { error: "Missing accountId" },
      { status: 400 }
    );
  }

  const refreshToken = session.tokenSet.refreshToken;
  if (!refreshToken) {
    return NextResponse.json(
      { error: "No refresh token available" },
      { status: 400 }
    );
  }

  try {
    const domain = process.env.AUTH0_DOMAIN!;
    const myAccountToken = await getMyAccountToken(refreshToken);

    // Delete the connected account via My Account API
    const deleteRes = await fetch(
      `https://${domain}/me/v1/connected-accounts/accounts/${encodeURIComponent(accountId)}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${myAccountToken}`,
        },
      }
    );

    if (!deleteRes.ok && deleteRes.status !== 204) {
      const err = await deleteRes.text();
      console.error("[Nexus] Failed to delete connected account:", deleteRes.status, err);
      return NextResponse.json(
        { error: "Failed to disconnect account" },
        { status: 500 }
      );
    }

    console.log(`[Nexus] Disconnected account: ${accountId}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Nexus] Disconnect error:", err);
    return NextResponse.json(
      { error: "Failed to disconnect account" },
      { status: 500 }
    );
  }
}
