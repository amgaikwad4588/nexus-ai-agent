"use client";

import { useEffect, useState, useCallback } from "react";
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
  Loader2,
  Pencil,
  Clock,
  Bot,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DecryptedText from "@/components/ui/decrypted-text";
import { CreativeToggle } from "@/components/ui/creative-toggle";

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
  lastAccessed: string | null;
  scopes: ScopeInfo[];
}[] = [
  {
    id: "google",
    name: "Google",
    icon: Mail,
    color: "text-red-400",
    bgColor: "bg-red-400/10",
    lastAccessed: "15 mins ago",
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
    lastAccessed: "2 mins ago",
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
    lastAccessed: "1 hour ago",
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
  {
    id: "discord",
    name: "Discord",
    icon: MessageSquare,
    color: "text-indigo-400",
    bgColor: "bg-indigo-400/10",
    lastAccessed: null,
    scopes: [
      {
        scope: "identify",
        description: "Read user profile and avatar",
        riskLevel: "low",
        readWrite: "read",
      },
      {
        scope: "guilds",
        description: "View server list and membership",
        riskLevel: "low",
        readWrite: "read",
      },
      {
        scope: "guilds.members.read",
        description: "View member info in servers",
        riskLevel: "medium",
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
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [serviceAccess, setServiceAccess] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("nexus:serviceAccess");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return Object.fromEntries(servicePermissions.map((s) => [s.id, true]));
  });
  const [writeAccess, setWriteAccess] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("nexus:writeAccess");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return Object.fromEntries(servicePermissions.map((s) => [s.id, false]));
  });

  useEffect(() => {
    localStorage.setItem("nexus:serviceAccess", JSON.stringify(serviceAccess));
  }, [serviceAccess]);

  useEffect(() => {
    localStorage.setItem("nexus:writeAccess", JSON.stringify(writeAccess));
  }, [writeAccess]);

  const toggleServiceAccess = (id: string) => {
    setServiceAccess((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      if (!next[id]) setWriteAccess((w) => ({ ...w, [id]: false }));
      return next;
    });
  };

  const toggleWriteAccess = (id: string) => {
    if (!serviceAccess[id]) return;
    setWriteAccess((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Fetch current permission states on mount
  useEffect(() => {
    fetch("/api/permissions")
      .then((r) => r.json())
      .then((data) => {
        if (data.permissions) setPermissions(data.permissions);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Toggle a single scope
  const toggleScope = useCallback(
    async (scope: string) => {
      const newValue = !permissions[scope];
      // Optimistic update
      setPermissions((prev) => ({ ...prev, [scope]: newValue }));
      setSaving(scope);

      try {
        const res = await fetch("/api/permissions", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ permissions: { [scope]: newValue } }),
        });
        const data = await res.json();
        if (data.permissions) setPermissions(data.permissions);
      } catch (err) {
        // Revert on failure
        setPermissions((prev) => ({ ...prev, [scope]: !newValue }));
        console.error("Failed to update permission:", err);
      } finally {
        setSaving(null);
      }
    },
    [permissions]
  );

  const isEnabled = (scope: string) => permissions[scope] !== false; // default true

  const totalScopes = servicePermissions.reduce(
    (acc, s) => acc + s.scopes.length,
    0
  );
  const readScopes = servicePermissions.reduce(
    (acc, s) => acc + s.scopes.filter((sc) => sc.readWrite === "read").length,
    0
  );
  const writeScopes = totalScopes - readScopes;
  const enabledCount = servicePermissions.reduce(
    (acc, s) => acc + s.scopes.filter((sc) => isEnabled(sc.scope)).length,
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
            <DecryptedText
              text="Permission Dashboard"
              animateOn="view"
              speed={35}
              sequential
              revealDirection="start"
              className="text-foreground"
              encryptedClassName="text-muted-foreground/40"
            />
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Control exactly what your AI agent can access. Uncheck a scope to
            block the AI from using it — even if the service is connected.
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
                label: "Enabled",
                value: `${enabledCount}/${totalScopes}`,
                icon: CheckCircle,
                color: "text-emerald-400",
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
                    Server-Side Enforcement
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    These toggles are enforced on the server before every tool
                    call. If you uncheck a scope, the AI will be blocked from
                    using any tool that requires it — the request never reaches
                    the external API.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Step-Up Auth Enforcement */}
        <motion.div variants={fadeUp}>
          <Card className="bg-yellow-500/5 border-yellow-500/20">
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-yellow-400">
                    Step-Up Authentication — Enforced
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Write operations are blocked until the user explicitly
                    approves each action. The AI agent cannot execute writes
                    without human authorization.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-8">
                <div className="flex items-center gap-2 p-2 rounded-md bg-accent/20 border border-border/30">
                  <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0" />
                  <span className="text-xs">
                    <span className="font-mono text-green-400">createGitHubIssue</span>
                    {" "}&mdash; requires approval
                  </span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-md bg-accent/20 border border-border/30">
                  <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0" />
                  <span className="text-xs">
                    <span className="font-mono text-green-400">sendSlackMessage</span>
                    {" "}&mdash; requires approval
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground ml-8">
                Approved actions create a step-up session valid for 10 minutes.
                All approvals and denials are logged in the audit trail.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Service Permissions — Hierarchical */}
        {loading ? (
          <motion.div variants={fadeUp} className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading permissions...</span>
          </motion.div>
        ) : (
          servicePermissions.map((service) => {
            const Icon = service.icon;
            const serviceEnabled = serviceAccess[service.id];
            const enabledScopeCount = service.scopes.filter((s) => isEnabled(s.scope)).length;
            return (
              <motion.div key={service.id} variants={fadeUp}>
                <Card className={!serviceEnabled ? "border-zinc-800" : ""}>
                  {/* ── Master toggle row ── */}
                  <CardHeader className="pb-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg ${serviceEnabled ? service.bgColor : "bg-zinc-800/50"} flex items-center justify-center transition-colors`}
                        >
                          <Icon className={`w-5 h-5 ${serviceEnabled ? service.color : "text-zinc-500"}`} />
                        </div>
                        <div>
                          <CardTitle className={`text-base ${!serviceEnabled ? "text-zinc-500" : ""}`}>
                            {service.name}
                          </CardTitle>
                          <div className="flex items-center gap-3 mt-0.5">
                            <CardDescription className="text-xs">
                              {serviceEnabled
                                ? `${enabledScopeCount}/${service.scopes.length} scopes enabled`
                                : "All access blocked"}
                            </CardDescription>
                            <span className="text-zinc-700">|</span>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              <span className="text-[11px] text-muted-foreground">
                                {service.lastAccessed ? (
                                  <span
                                    className={
                                      service.lastAccessed.includes("min")
                                        ? "text-emerald-400"
                                        : "text-foreground"
                                    }
                                  >
                                    {service.lastAccessed}
                                  </span>
                                ) : (
                                  <span className="text-zinc-500">Never</span>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {!serviceEnabled && (
                          <Badge variant="outline" className="text-xs text-zinc-400 border-zinc-600/30 bg-zinc-800/30">
                            Disabled
                          </Badge>
                        )}
                        {serviceEnabled && (
                          <div className="flex items-center gap-2">
                            <Pencil
                              className={`w-3.5 h-3.5 ${
                                writeAccess[service.id]
                                  ? "text-yellow-400"
                                  : "text-muted-foreground"
                              }`}
                            />
                            <span className="text-[11px] text-muted-foreground hidden sm:inline">
                              Write
                            </span>
                            <CreativeToggle
                              checked={writeAccess[service.id]}
                              onChange={() => toggleWriteAccess(service.id)}
                              color="yellow"
                              size="sm"
                            />
                          </div>
                        )}
                        <CreativeToggle
                          checked={serviceEnabled}
                          onChange={() => toggleServiceAccess(service.id)}
                          color="emerald"
                          size="md"
                        />
                      </div>
                    </div>
                  </CardHeader>

                  {/* ── Sub-permissions tree ── */}
                  <CardContent className="pt-4">
                    <div className="relative ml-5 pl-4 border-l-2 border-border/40 space-y-2">
                      {service.scopes.map((scope, idx) => {
                        const risk = riskColors[scope.riskLevel];
                        const enabled = serviceEnabled && isEnabled(scope.scope);
                        const isSaving = saving === scope.scope;
                        const isLast = idx === service.scopes.length - 1;
                        return (
                          <div key={scope.scope} className="relative">
                            {/* Tree branch connector */}
                            <div className="absolute -left-4 top-1/2 w-3 h-px bg-border/40" />
                            {isLast && (
                              <div className="absolute -left-2.25 top-1/2 bottom-0 w-0.5 bg-card" />
                            )}
                            <div
                              className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
                                !serviceEnabled
                                  ? "bg-zinc-900/30 border-zinc-800/30 opacity-40"
                                  : enabled
                                    ? "bg-accent/20 border-border/30"
                                    : "bg-red-950/20 border-red-500/20 opacity-75"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {isSaving ? (
                                  <div className="w-11 h-6 flex items-center justify-center">
                                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                  </div>
                                ) : (
                                  <CreativeToggle
                                    checked={enabled}
                                    onChange={() => toggleScope(scope.scope)}
                                    disabled={isSaving || !serviceEnabled}
                                    color={!serviceEnabled ? "emerald" : enabled ? "emerald" : "red"}
                                    size="md"
                                  />
                                )}
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    !serviceEnabled
                                      ? "bg-zinc-600"
                                      : scope.readWrite === "read"
                                        ? "bg-green-400"
                                        : "bg-yellow-400"
                                  }`}
                                />
                                <div>
                                  <p className={`text-sm font-mono font-medium ${!serviceEnabled || !enabled ? "line-through text-muted-foreground" : ""}`}>
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
                                  className={`text-xs ${!serviceEnabled ? "text-zinc-500 border-zinc-700 bg-zinc-800/30" : `${risk.text} ${risk.border} ${risk.bg}`}`}
                                >
                                  {scope.riskLevel}
                                </Badge>
                                <Badge variant="secondary" className={`text-xs ${!serviceEnabled ? "opacity-50" : ""}`}>
                                  {scope.readWrite}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${
                                    !serviceEnabled
                                      ? "text-zinc-500 border-zinc-700 bg-zinc-800/30"
                                      : enabled
                                        ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/10"
                                        : "text-red-400 border-red-400/30 bg-red-400/10"
                                  }`}
                                >
                                  {!serviceEnabled ? "Disabled" : enabled ? "Allowed" : "Denied"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}

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
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {[
                  {
                    step: "1",
                    title: "User Request",
                    desc: "You ask Nexus to perform an action",
                  },
                  {
                    step: "2",
                    title: "Permission Check",
                    desc: "Server checks if user has enabled the required scopes",
                  },
                  {
                    step: "3",
                    title: "Risk Check",
                    desc: "Write ops are flagged for step-up auth; reads proceed directly",
                  },
                  {
                    step: "4",
                    title: "Token Exchange",
                    desc: "Auth0 exchanges refresh token for scoped access token",
                  },
                  {
                    step: "5",
                    title: "Audit Log",
                    desc: "Action + approval decision logged with scope and risk",
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
