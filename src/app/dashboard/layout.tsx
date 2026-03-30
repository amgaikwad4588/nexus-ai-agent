import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";

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
    <div className="flex h-screen overflow-hidden">
      <Sidebar userName={session.user.name || session.user.email} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
