"use client";

import { motion } from "framer-motion";
import {
  MessageSquare,
  Link2,
  Shield,
  Activity,
  ArrowRight,
  Sparkles,
  Mail,
  GitBranch,
  KeyRound,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

export function DashboardOverview({
  userName,
  userAvatar,
}: {
  userName: string;
  userAvatar?: string;
}) {
  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="space-y-8"
      >
        {/* Welcome Header */}
        <motion.div variants={fadeUp} className="flex items-center gap-4">
          <Avatar className="w-12 h-12">
            <AvatarImage src={userAvatar} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {userName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {userName.split(" ")[0]}</h1>
            <p className="text-muted-foreground text-sm">
              Your AI agent is ready. Here&apos;s your command center.
            </p>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={fadeUp}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: MessageSquare,
                title: "Chat with Agent",
                description: "Start a conversation",
                href: "/dashboard/chat",
                color: "text-primary",
                bgColor: "bg-primary/10",
              },
              {
                icon: Link2,
                title: "Connections",
                description: "Manage services",
                href: "/dashboard/connections",
                color: "text-blue-400",
                bgColor: "bg-blue-400/10",
              },
              {
                icon: Shield,
                title: "Permissions",
                description: "View access scopes",
                href: "/dashboard/permissions",
                color: "text-green-400",
                bgColor: "bg-green-400/10",
              },
              {
                icon: Activity,
                title: "Audit Trail",
                description: "Review activity",
                href: "/dashboard/audit",
                color: "text-orange-400",
                bgColor: "bg-orange-400/10",
              },
            ].map((item) => (
              <Link key={item.href} href={item.href}>
                <Card className="hover:bg-accent/50 transition-colors cursor-pointer group h-full">
                  <CardContent className="pt-6">
                    <div
                      className={`w-10 h-10 rounded-lg ${item.bgColor} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
                    >
                      <item.icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    <h3 className="font-semibold text-sm">{item.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Architecture Diagram */}
        <motion.div variants={fadeUp}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-primary" />
                How Nexus Protects Your Identity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {/* Flow diagram */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-2">
                  {/* User */}
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={userAvatar} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          You
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <span className="text-xs font-medium">You</span>
                  </div>

                  <ArrowRight className="w-5 h-5 text-muted-foreground rotate-90 md:rotate-0 shrink-0" />

                  {/* Nexus Agent */}
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center glow">
                      <Sparkles className="w-7 h-7 text-primary" />
                    </div>
                    <span className="text-xs font-medium">Nexus Agent</span>
                  </div>

                  <ArrowRight className="w-5 h-5 text-muted-foreground rotate-90 md:rotate-0 shrink-0" />

                  {/* Token Vault */}
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <div className="w-16 h-16 rounded-xl bg-green-400/10 flex items-center justify-center border border-green-400/20">
                      <Shield className="w-7 h-7 text-green-400" />
                    </div>
                    <span className="text-xs font-medium">Auth0 Token Vault</span>
                  </div>

                  <ArrowRight className="w-5 h-5 text-muted-foreground rotate-90 md:rotate-0 shrink-0" />

                  {/* Services */}
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <div className="flex gap-2">
                      {[
                        { icon: Mail, color: "text-red-400", bg: "bg-red-400/10" },
                        { icon: GitBranch, color: "text-white", bg: "bg-white/10" },
                        { icon: Zap, color: "text-purple-400", bg: "bg-purple-400/10" },
                      ].map((s, i) => (
                        <div
                          key={i}
                          className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center`}
                        >
                          <s.icon className={`w-5 h-5 ${s.color}`} />
                        </div>
                      ))}
                    </div>
                    <span className="text-xs font-medium">Your Services</span>
                  </div>
                </div>

                {/* Description */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div className="p-3 rounded-lg bg-accent/30">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">1.</span> You
                      chat naturally with Nexus
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-accent/30">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">2.</span> Nexus
                      requests scoped tokens from Auth0 Vault
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-accent/30">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">3.</span> APIs
                      called with minimal-privilege tokens
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Get Started CTA */}
        <motion.div variants={fadeUp}>
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold mb-1">Ready to get started?</h3>
                <p className="text-sm text-muted-foreground">
                  Connect your services first, then start chatting with your AI
                  agent.
                </p>
              </div>
              <div className="flex gap-3">
                <Link href="/dashboard/connections">
                  <Button variant="outline" size="sm">
                    <Link2 className="w-4 h-4 mr-2" />
                    Connect Services
                  </Button>
                </Link>
                <Link href="/dashboard/chat">
                  <Button size="sm">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Start Chatting
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
