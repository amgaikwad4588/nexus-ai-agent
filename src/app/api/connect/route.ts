import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth0 } from "@/lib/auth0";

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

  // Store the primary user ID before redirecting to the new provider
  const cookieStore = await cookies();
  cookieStore.set("nexus_link_primary", session.user.sub, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 300,
    path: "/",
  });

  // Redirect to Auth0 login with the specific social connection
  return NextResponse.redirect(
    new URL(
      `/auth/login?connection=${connection}&returnTo=/api/connect/complete`,
      req.url
    )
  );
}
