import { auth0 } from "@/lib/auth0";
import { DashboardOverview } from "@/components/dashboard/overview";

export default async function DashboardPage() {
  const session = await auth0.getSession();

  return (
    <DashboardOverview
      userName={session?.user.name || session?.user.email || "User"}
      userAvatar={session?.user.picture}
    />
  );
}
