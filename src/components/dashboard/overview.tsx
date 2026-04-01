"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Link2,
  Shield,
  Activity,
  ArrowRight,
  Sparkles,
  Mail,
  KeyRound,
  Zap,
  CheckCircle,
  ShieldAlert,
  TrendingUp,
  Clock,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import DecryptedText from "@/components/ui/decrypted-text";
import type { AuditEntry } from "@/lib/types";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

const fadeInScale = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
};

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  trend?: string;
  color: string;
  bgColor: string;
}

function StatCard({ icon: Icon, label, value, trend, color, bgColor }: StatCardProps) {
  return (
    <motion.div variants={fadeInScale}>
      <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
        <div className={`absolute inset-0 bg-gradient-to-br ${bgColor} opacity-50 group-hover:opacity-70 transition-opacity`} />
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full" />
        <CardContent className="relative z-10 p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
              <p className="text-2xl font-bold mt-1 tracking-tight">{value}</p>
              {trend && (
                <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  {trend}
                </p>
              )}
            </div>
            <motion.div 
              className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center`}
              whileHover={{ scale: 1.15, rotate: -10 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              <Icon className={`w-5 h-5 ${color}`} />
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface QuickActionProps {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
  color: string;
  bgColor: string;
  gradient: string;
}

function QuickAction({ icon: Icon, title, description, color, bgColor, gradient, href }: QuickActionProps) {
  return (
    <Link href={href}>
      <Card className="relative overflow-hidden transition-all duration-300 cursor-pointer group h-full hover:shadow-md hover:border-primary/30">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
        <CardContent className="pt-5 pb-5 relative z-10">
          <div className="flex items-center gap-4">
            <motion.div 
              className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center`}
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Icon className={`w-6 h-6 ${color}`} />
            </motion.div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{title}</h3>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <motion.div
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 3 }}
            >
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </motion.div>
          </div>
        </CardContent>
      </Card>
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

  useEffect(() => {
    fetch("/api/audit")
      .then((res) => res.json())
      .then((data) => {
        setAuditStats(data.stats || null);
        setRecentEntries((data.entries || []).slice(0, 5));
      })
      .catch(() => {});
  }, []);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="min-h-screen p-6 md:p-8 max-w-7xl mx-auto"
    >
      {/* Welcome Section */}
      <motion.div variants={fadeUp} className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="w-14 h-14 ring-4 ring-primary/10">
                <AvatarImage src={userAvatar} />
                <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                  {userName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                <DecryptedText
                  text={`Welcome back, ${userName.split(" ")[0]}`}
                  animateOn="view"
                  speed={30}
                  sequential
                  revealDirection="start"
                  className="text-foreground"
                  encryptedClassName="text-muted-foreground/40"
                />
              </h1>
              <p className="text-muted-foreground text-sm flex items-center gap-2">
                <Clock className="w-3 h-3" />
                Your AI agent is ready to help
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/chat">
              <Button size="sm" className="gap-2">
                <MessageSquare className="w-4 h-4" />
                New Chat
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Activity}
          label="Total Actions"
          value={auditStats?.total || 0}
          trend="+12% this week"
          color="text-primary"
          bgColor="bg-primary/10"
        />
        <StatCard
          icon={CheckCircle}
          label="Successful"
          value={auditStats?.byStatus?.success || 0}
          trend="98% rate"
          color="text-green-500"
          bgColor="bg-green-500/10"
        />
        <StatCard
          icon={ShieldAlert}
          label="Step-up Auth"
          value={auditStats?.stepUpCount || 0}
          color="text-yellow-500"
          bgColor="bg-yellow-500/10"
        />
        <StatCard
          icon={Lock}
          label="Connections"
          value={3}
          color="text-blue-500"
          bgColor="bg-blue-500/10"
        />
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Quick Actions - 2 columns on large screens */}
        <motion.div variants={fadeUp} className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <QuickAction
              icon={MessageSquare}
              title="Chat with Agent"
              description="Start a conversation"
              href="/dashboard/chat"
              color="text-primary"
              bgColor="bg-primary/10"
              gradient="from-primary/20 via-primary/5 to-transparent"
            />
            <QuickAction
              icon={Link2}
              title="Connections"
              description="Manage your services"
              href="/dashboard/connections"
              color="text-blue-400"
              bgColor="bg-blue-400/10"
              gradient="from-blue-400/20 via-blue-400/5 to-transparent"
            />
            <QuickAction
              icon={Shield}
              title="Permissions"
              description="View access scopes"
              href="/dashboard/permissions"
              color="text-green-400"
              bgColor="bg-green-400/10"
              gradient="from-green-400/20 via-green-400/5 to-transparent"
            />
            <QuickAction
              icon={Activity}
              title="Audit Trail"
              description="Review activity"
              href="/dashboard/audit"
              color="text-orange-400"
              bgColor="bg-orange-400/10"
              gradient="from-orange-400/20 via-orange-400/5 to-transparent"
            />
          </div>
        </motion.div>

        {/* Architecture Flow */}
        <motion.div variants={fadeUp}>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-primary" />
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Avatar className="w-7 h-7">
                      <AvatarImage src={userAvatar} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-[10px]">You</AvatarFallback>
                    </Avatar>
                  </div>
                  <span className="text-[10px] text-muted-foreground">You</span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground -mt-4" />
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center glow">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-[10px] text-muted-foreground">Nexus</span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground -mt-4" />
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-lg bg-green-400/10 flex items-center justify-center border border-green-400/20">
                    <Shield className="w-5 h-5 text-green-400" />
                  </div>
                  <span className="text-[10px] text-muted-foreground">Vault</span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground -mt-4" />
                <div className="flex flex-col items-center gap-1">
                  <div className="flex gap-1">
                    <div className="w-8 h-8 rounded-lg bg-red-400/10 flex items-center justify-center">
                      <Mail className="w-4 h-4 text-red-400" />
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Services</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-4">
                Secure token-based authentication with minimal privileges
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity & CTA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-5 h-5 text-orange-400" />
                  Recent Activity
                </CardTitle>
                <Link href="/dashboard/audit">
                  <Button variant="ghost" size="sm" className="text-xs gap-1">
                    View all <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {auditStats && auditStats.total > 0 ? (
                <div className="space-y-2">
                  {recentEntries.map((entry) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          entry.riskLevel === "low" ? "bg-green-500" :
                          entry.riskLevel === "medium" ? "bg-yellow-500" : "bg-red-500"
                        }`} />
                        <span className="text-sm font-medium truncate max-w-[200px] md:max-w-[300px]">{entry.action}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            entry.riskLevel === "low"
                              ? "text-green-400 border-green-400/30"
                              : entry.riskLevel === "medium"
                              ? "text-yellow-400 border-yellow-400/30"
                              : "text-red-400 border-red-400/30"
                          }`}
                        >
                          {entry.riskLevel}
                        </Badge>
                        <span className="text-xs text-muted-foreground hidden sm:inline">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No activity yet</p>
                  <p className="text-xs text-muted-foreground/70">Start chatting to see your activity here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Get Started CTA */}
        <motion.div variants={fadeUp}>
          <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20 h-full">
            <CardContent className="pt-6 h-full flex flex-col">
              <div className="flex-1">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Ready to get started?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect your services and start chatting with your AI agent for secure, scoped access.
                </p>
              </div>
              <div className="space-y-2">
                <Link href="/dashboard/connections" className="block">
                  <Button variant="outline" className="w-full gap-2">
                    <Link2 className="w-4 h-4" />
                    Connect Services
                  </Button>
                </Link>
                <Link href="/dashboard/chat" className="block">
                  <Button className="w-full gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Start Chatting
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
