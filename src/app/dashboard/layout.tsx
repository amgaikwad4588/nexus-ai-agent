import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { DotGridBackground } from "@/components/ui/dot-grid-background";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth0.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  return (
    <div className="flex h-screen overflow-hidden relative">
      <DotGridBackground />
      <Sidebar userName={session.user.name || session.user.email} />
      <main className="flex-1 overflow-auto relative z-10">{children}</main>
    </div>
  );
}
