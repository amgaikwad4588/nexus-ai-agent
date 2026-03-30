import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { getAuditLog, getAuditStats } from "@/lib/audit";

export async function GET() {
  const session = await auth0.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entries = getAuditLog();
  const stats = getAuditStats();

  return NextResponse.json({ entries, stats });
}
