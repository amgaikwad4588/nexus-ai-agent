import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth0 } from "@/lib/auth0";
import { linkAccounts } from "@/lib/management";

export async function GET(req: Request) {
  const session = await auth0.getSession();
  if (!session) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  const cookieStore = await cookies();
  const primaryUserCookie = cookieStore.get("nexus_link_primary");

  if (primaryUserCookie && primaryUserCookie.value !== session.user.sub) {
    const primaryUserId = primaryUserCookie.value;

    // Parse provider and user_id from the sub claim (e.g., "github|12345")
    const sub = session.user.sub as string;
    const separatorIndex = sub.indexOf("|");
    const provider = sub.substring(0, separatorIndex);
    const userId = sub.substring(separatorIndex + 1);

    if (provider && userId) {
      const success = await linkAccounts(primaryUserId, provider, userId);
      console.log(
        `[Nexus] Account link: ${provider}|${userId} → ${primaryUserId} — ${success ? "SUCCESS" : "FAILED"}`
      );
    }

    // Clear the cookie
    cookieStore.delete("nexus_link_primary");

    // Redirect to login to refresh session with all linked identities
    return NextResponse.redirect(
      new URL("/auth/login?returnTo=/dashboard/connections", req.url)
    );
  }

  // No linking needed
  if (primaryUserCookie) {
    cookieStore.delete("nexus_link_primary");
  }

  return NextResponse.redirect(new URL("/dashboard/connections", req.url));
}
