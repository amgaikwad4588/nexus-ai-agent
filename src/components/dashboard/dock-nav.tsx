"use client";

import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  Link2,
  Shield,
  Activity,
} from "lucide-react";
import Dock from "@/components/ui/dock";

const navItems = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: LayoutDashboard,
  },
  {
    href: "/dashboard/chat",
    label: "AI Agent",
    icon: MessageSquare,
  },
  {
    href: "/dashboard/connections",
    label: "Connections",
    icon: Link2,
  },
  {
    href: "/dashboard/permissions",
    label: "Permissions",
    icon: Shield,
  },
  {
    href: "/dashboard/audit",
    label: "Audit Trail",
    icon: Activity,
  },
];

export function DashboardDock() {
  const pathname = usePathname();

  const items = navItems.map((item) => {
    const isActive =
      pathname === item.href ||
      (item.href !== "/dashboard" && pathname.startsWith(item.href));

    return {
      icon: <item.icon size={20} />,
      label: item.label,
      href: item.href,
      className: isActive ? "ring-2 ring-primary/50" : "",
    };
  });

  return <Dock items={items} magnification={60} baseItemSize={46} panelHeight={56} />;
}
