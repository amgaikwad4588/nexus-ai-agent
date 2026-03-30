"use client";

import { motion } from "framer-motion";
import {
  Shield,
  Lock,
  Eye,
  AlertTriangle,
  CheckCircle,
  Mail,
  Calendar,
  GitBranch,
  MessageSquare,
  ArrowRight,
  KeyRound,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

interface ScopeInfo {
  scope: string;
  description: string;
  riskLevel: "low" | "medium" | "high";
  readWrite: "read" | "write";
}

const servicePermissions: {
  id: string;
  name: string;
  icon: typeof Mail;
  color: string;
  bgColor: string;
  scopes: ScopeInfo[];
}[] = [
  {
    id: "google",
    name: "Google",
    icon: Mail,
    color: "text-red-400",
    bgColor: "bg-red-400/10",
    scopes: [
      {
        scope: "gmail.readonly",
        description: "Read email messages and metadata",
        riskLevel: "low",
        readWrite: "read",
      },
      {
        scope: "calendar.readonly",
        description: "View calendar events and details",
        riskLevel: "low",
        readWrite: "read",
      },
      {
        scope: "calendar.freebusy",
        description: "Check availability without seeing event details",
        riskLevel: "low",
        readWrite: "read",
      },
    ],
  },
  {
    id: "github",
    name: "GitHub",
    icon: GitBranch,
    color: "text-white",
    bgColor: "bg-white/10",
    scopes: [
      {
        scope: "read:user",
        description: "Read user profile information",
        riskLevel: "low",
        readWrite: "read",
      },
      {
        scope: "read:org",
        description: "Read organization membership",
        riskLevel: "low",
        readWrite: "read",
      },
      {
        scope: "repo",
        description: "Full access to repositories (read + write)",
        riskLevel: "high",
        readWrite: "write",
      },
    ],
  },
  {
    id: "slack",
    name: "Slack",
    icon: MessageSquare,
    color: "text-purple-400",
    bgColor: "bg-purple-400/10",
    scopes: [
      {
        scope: "channels:read",
        description: "View channel list and info",
        riskLevel: "low",
        readWrite: "read",
      },
      {
        scope: "channels:history",
        description: "Read message history in channels",
        riskLevel: "medium",
        readWrite: "read",
      },
      {
        scope: "chat:write",
        description: "Send messages on behalf of user",
        riskLevel: "high",
        readWrite: "write",
      },
      {
        scope: "users:read",
        description: "View user profiles in workspace",
        riskLevel: "low",
        readWrite: "read",
      },
    ],
  },
];

const riskColors = {
  low: { text: "text-green-400", bg: "bg-green-400/10", border: "border-green-400/30" },
  medium: { text: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/30" },
  high: { text: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/30" },
};

export function PermissionsPage() {
  const totalScopes = servicePermissions.reduce(
    (acc, s) => acc + s.scopes.length,
    0
  );
  const readScopes = servicePermissions.reduce(
    (acc, s) => acc + s.scopes.filter((sc) => sc.readWrite === "read").length,
    0
  );
  const writeScopes = totalScopes - readScopes;
  const highRiskScopes = servicePermissions.reduce(
    (acc, s) =>
      acc + s.scopes.filter((sc) => sc.riskLevel === "high").length,
    0
  );

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={fadeUp}>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Permission Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Complete visibility into what your AI agent can access
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div variants={fadeUp}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: "Total Scopes",
                value: totalScopes,
                icon: KeyRound,
                color: "text-primary",
              },
              {
                label: "Read-Only",
                value: readScopes,
                icon: Eye,
                color: "text-green-400",
              },
              {
                label: "Write Access",
                value: writeScopes,
                icon: Lock,
                color: "text-yellow-400",
              },
              {
                label: "High Risk",
                value: highRiskScopes,
                icon: AlertTriangle,
                color: "text-red-400",
              },
            ].map((stat) => (
              <Card key={stat.label}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-1">
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                    <span className="text-xs text-muted-foreground">
                      {stat.label}
                    </span>
                  </div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Security Model Info */}
        <motion.div variants={fadeUp}>
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">
                    Principle of Least Privilege
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Nexus requests only the minimum scopes needed for each
                    operation. Tokens are exchanged on-demand via Auth0 Token
                    Vault and never cached in our application. High-risk write
                    operations can trigger step-up authentication via CIBA
                    (Client-Initiated Backchannel Authentication).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Service Permissions */}
        {servicePermissions.map((service) => {
          const Icon = service.icon;
          return (
            <motion.div key={service.id} variants={fadeUp}>
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg ${service.bgColor} flex items-center justify-center`}
                    >
                      <Icon className={`w-5 h-5 ${service.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {service.name}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {service.scopes.length} scopes requested
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {service.scopes.map((scope) => {
                      const risk = riskColors[scope.riskLevel];
                      return (
                        <div
                          key={scope.scope}
                          className="flex items-center justify-between p-3 rounded-lg bg-accent/20 border border-border/30"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                scope.readWrite === "read"
                                  ? "bg-green-400"
                                  : "bg-yellow-400"
                              }`}
                            />
                            <div>
                              <p className="text-sm font-mono font-medium">
                                {scope.scope}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {scope.description}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={`text-xs ${risk.text} ${risk.border} ${risk.bg}`}
                            >
                              {scope.riskLevel}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {scope.readWrite}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}

        {/* Token Flow */}
        <motion.div variants={fadeUp}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-primary" />
                Token Exchange Flow
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {[
                  {
                    step: "1",
                    title: "User Request",
                    desc: "You ask Nexus to perform an action",
                  },
                  {
                    step: "2",
                    title: "Token Exchange",
                    desc: "Auth0 exchanges refresh token for scoped access token",
                  },
                  {
                    step: "3",
                    title: "API Call",
                    desc: "Nexus calls the API with the scoped token",
                  },
                  {
                    step: "4",
                    title: "Audit Log",
                    desc: "Action is logged with scope and risk level",
                  },
                ].map((item) => (
                  <div
                    key={item.step}
                    className="p-3 rounded-lg bg-accent/20 text-center"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center mx-auto mb-2">
                      {item.step}
                    </div>
                    <p className="text-xs font-medium">{item.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
