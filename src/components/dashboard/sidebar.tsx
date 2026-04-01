"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Link2,
  Shield,
  Activity,
  LayoutDashboard,
  Network,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";

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

export function Sidebar({ userName }: { userName?: string }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "h-full flex flex-col border-r border-border/50 bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-border/50 justify-between">
        <Link href="/dashboard">
          <motion.div 
            className="flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div 
              className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0"
              whileHover={{ scale: 1.15, rotate: 10 }}
              whileTap={{ scale: 0.9 }}
            >
              <Network className="w-4 h-4 text-primary-foreground" />
            </motion.div>
            {!collapsed && (
              <motion.span 
                className="text-lg font-bold"
                whileHover={{ letterSpacing: "0.05em" }}
                transition={{ duration: 0.2 }}
              >
                Nexus
              </motion.span>
            )}
          </motion.div>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={() => setCollapsed(!collapsed)}
        >
          <motion.span
            whileHover={{ scale: 1.1, rotate: collapsed ? 0 : 180 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </motion.span>
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className="block"
            >
              <motion.div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
                whileHover={{ x: 4 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <motion.span
                  whileHover={{ y: -2, scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                </motion.span>
                {!collapsed && (
                  <motion.span 
                    className="relative"
                    whileHover={{ x: 2 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* User & Logout */}
      <div className="p-3 border-t border-border/50">
        {userName && (
          <motion.div 
            className="px-3 mb-2"
            whileHover={{ scale: 1.02 }}
          >
            <p className="text-xs text-muted-foreground truncate">
              {userName}
            </p>
          </motion.div>
        )}
        <a href="/auth/logout" className="block">
          <motion.div
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
            whileHover={{ x: 4 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <motion.span
              whileHover={{ y: -2, rotate: -10 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              <LogOut className="w-4 h-4 shrink-0" />
            </motion.span>
            {!collapsed && <span>Log Out</span>}
          </motion.div>
        </a>
      </div>
    </aside>
  );
}
