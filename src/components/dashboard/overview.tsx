"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Link2,
  Shield,
  Activity,
  ArrowRight,
  Mail,
  KeyRound,
  CheckCircle,
  ShieldAlert,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ClavisLogo } from "@/components/clavis-logo";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { fadeUp, stagger } from "@/components/dashboard/motion";
import type { AuditEntry } from "@/lib/types";

interface QuickActionProps {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
  color: string;
}

function QuickAction({ icon: Icon, title, description, color, href }: QuickActionProps) {
  return (
    <Link href={href}>
      <div className="border border-[#262626] bg-[#0F0F0F] p-6 transition-colors duration-150 cursor-pointer group h-full hover:border-[#404040]">
        <div className="flex items-center gap-4">
          <Icon
            className={`w-5 h-5 ${color} shrink-0`}
            strokeWidth={1.5}
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm tracking-tight">{title}</h3>
            <p className="text-xs text-[#737373] mt-1">{description}</p>
          </div>
          <ArrowRight className="w-4 h-4 text-[#737373] group-hover:text-[#FAFAFA] transition-colors duration-150 shrink-0" />
        </div>
      </div>
    </Link>
  );
}

export function DashboardOverview({
  userName,
  userAvatar,
}: {
  userName: string;
  userAvatar?: string;
}) {
  const [auditStats, setAuditStats] = useState<{
    total: number;
    byStatus: Record<string, number>;
    stepUpCount: number;
  } | null>(null);
  const [recentEntries, setRecentEntries] = useState<AuditEntry[]>([]);
  const [connectionsCount, setConnectionsCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/audit")
      .then((res) => res.json())
      .then((data) => {
        setAuditStats(data.stats || null);
        setRecentEntries((data.entries || []).slice(0, 5));
      })
      .catch(() => {});
    fetch("/api/connections")
      .then((res) => res.json())
      .then((data) => {
        const services = (data.services || []) as { connected?: boolean }[];
        setConnectionsCount(services.filter((s) => s.connected).length);
      })
      .catch(() => {});
  }, []);

  const successRate =
    auditStats && auditStats.total > 0
      ? Math.round(((auditStats.byStatus?.success || 0) / auditStats.total) * 100)
      : null;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="min-h-screen p-6 md:p-8 max-w-7xl mx-auto"
    >
      {/* Welcome Section */}
      <motion.div variants={fadeUp} className="mb-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tighter">
              Welcome back, {userName.split(" ")[0]}
            </h1>
            <p className="text-[#737373] mt-2">
              Your AI agent is ready to help
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard/chat">
              <Button variant="primary" size="default">
                <MessageSquare className="w-4 h-4" />
                New Chat
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        <StatCard
          icon={Activity}
          label="Total Actions"
          value={auditStats?.total || 0}
        />
        <StatCard
          icon={CheckCircle}
          label="Successful"
          value={auditStats?.byStatus?.success || 0}
          trend={successRate !== null ? `${successRate}% rate` : undefined}
          color="text-[#22C55E]"
        />
        <StatCard
          icon={ShieldAlert}
          label="Step-up Auth"
          value={auditStats?.stepUpCount || 0}
          color="text-[#EAB308]"
        />
        <StatCard
          icon={Lock}
          label="Connections"
          value={connectionsCount ?? "—"}
          color="text-[#3B82F6]"
        />
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        {/* Quick Actions - 2 columns on large screens */}
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <h2 className="text-lg font-semibold tracking-tight mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <QuickAction
              icon={MessageSquare}
              title="Chat with Agent"
              description="Start a conversation"
              href="/dashboard/chat"
              color="text-[#FF3D00]"
            />
            <QuickAction
              icon={Link2}
              title="Connections"
              description="Manage your services"
              href="/dashboard/connections"
              color="text-[#3B82F6]"
            />
            <QuickAction
              icon={Shield}
              title="Permissions"
              description="View access scopes"
              href="/dashboard/permissions"
              color="text-[#22C55E]"
            />
            <QuickAction
              icon={Activity}
              title="Audit Trail"
              description="Review activity"
              href="/dashboard/audit"
              color="text-[#F97316]"
            />
          </div>
        </motion.div>

        {/* Architecture Flow */}
        <motion.div variants={fadeUp}>
          <div className="border border-[#262626] bg-[#0F0F0F] h-full">
            <div className="border-b border-[#262626] px-6 py-4">
              <h3 className="text-sm font-semibold tracking-tight flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#FF3D00]" strokeWidth={1.5} />
                How It Works
              </h3>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 border border-[#262626] flex items-center justify-center">
                    <span className="text-xs font-medium text-[#737373]">You</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#262626]" />
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 border border-[#262626] flex items-center justify-center">
                    <ClavisLogo className="w-8 h-8 text-[#FF3D00]" />
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#262626]" />
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 border border-[#262626] flex items-center justify-center">
                    <Shield className="w-4 h-4 text-[#22C55E]" strokeWidth={1.5} />
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#262626]" />
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 border border-[#262626] flex items-center justify-center">
                    <Mail className="w-4 h-4 text-[#737373]" strokeWidth={1.5} />
                  </div>
                </div>
              </div>
              <p className="text-xs text-[#737373] text-center mt-6">
                Secure token-based authentication with minimal privileges
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Activity & CTA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <div className="border border-[#262626] bg-[#0F0F0F]">
            <div className="border-b border-[#262626] px-6 py-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold tracking-tight flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#F97316]" strokeWidth={1.5} />
                Recent Activity
              </h3>
              <Link href="/dashboard/audit">
                <Button variant="ghost" size="sm" className="text-xs">
                  View all <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
            <div className="p-6">
              {auditStats && auditStats.total > 0 ? (
                <div className="space-y-3">
                  {recentEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between py-3 border-b border-[#262626] last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 ${
                          entry.riskLevel === "low" ? "bg-[#22C55E]" :
                          entry.riskLevel === "medium" ? "bg-[#EAB308]" : "bg-[#DC2626]"
                        }`} />
                        <span className="text-sm font-medium truncate max-w-[200px] md:max-w-[300px]">
                          {entry.action}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            entry.riskLevel === "low"
                              ? "text-[#22C55E] border-[#22C55E]/30"
                              : entry.riskLevel === "medium"
                              ? "text-[#EAB308] border-[#EAB308]/30"
                              : "text-[#DC2626] border-[#DC2626]/30"
                          }`}
                        >
                          {entry.riskLevel}
                        </Badge>
                        <span className="text-xs text-[#737373] hidden sm:inline">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Activity className="w-12 h-12 text-[#262626] mx-auto mb-3" strokeWidth={1.5} />
                  <p className="text-sm text-[#737373]">No activity yet</p>
                  <p className="text-xs text-[#737373]/60 mt-1">Start chatting to see your activity here</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Get Started CTA */}
        <motion.div variants={fadeUp}>
          <div className="border border-[#262626] bg-[#0F0F0F] h-full flex flex-col">
            <div className="p-6 flex-1">
              <h3 className="font-semibold text-lg tracking-tight mb-2">Ready to get started?</h3>
              <p className="text-sm text-[#737373]">
                Connect your services and start chatting with your AI agent for secure, scoped access.
              </p>
            </div>
            <div className="p-6 pt-0 space-y-3">
              <Link href="/dashboard/connections" className="block">
                <Button variant="outline" className="w-full">
                  <Link2 className="w-4 h-4" />
                  Connect Services
                </Button>
              </Link>
              <Link href="/dashboard/chat" className="block">
                <Button variant="primary" className="w-full">
                  <MessageSquare className="w-4 h-4" />
                  Start Chatting
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
