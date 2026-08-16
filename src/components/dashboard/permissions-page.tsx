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
  GitBranch,
  MessageSquare,
  ArrowRight,
  KeyRound,
  Loader2,
  Pencil,
  ShieldAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DotsLoader } from "@/components/ui/dots-loader";
import { CreativeToggle } from "@/components/ui/creative-toggle";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { fadeUp, stagger } from "@/components/dashboard/motion";

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
  scopes: ScopeInfo[];
}[] = [
  {
    id: "google",
    name: "Google",
    icon: Mail,
    color: "text-[#DC2626]",
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
    color: "text-[#FAFAFA]",
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
    color: "text-[#A855F7]",
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
    color: "text-[#6366F1]",
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
      {
        scope: "bot",
        description: "Send messages to channels (requires bot token)",
        riskLevel: "medium",
        readWrite: "write",
      },
    ],
  },
];

const riskColors = {
  low: { text: "text-[#22C55E]", bg: "bg-[#22C55E]/10", border: "border-[#22C55E]/30" },
  medium: { text: "text-[#EAB308]", bg: "bg-[#EAB308]/10", border: "border-[#EAB308]/30" },
  high: { text: "text-[#DC2626]", bg: "bg-[#DC2626]/10", border: "border-[#DC2626]/30" },
};

export function PermissionsPage() {
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [serviceAccess, setServiceAccess] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("clavis:serviceAccess");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return Object.fromEntries(servicePermissions.map((s) => [s.id, true]));
  });
  const [writeAccess, setWriteAccess] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("clavis:writeAccess");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return Object.fromEntries(servicePermissions.map((s) => [s.id, false]));
  });

  useEffect(() => {
    localStorage.setItem("clavis:serviceAccess", JSON.stringify(serviceAccess));
  }, [serviceAccess]);

  useEffect(() => {
    localStorage.setItem("clavis:writeAccess", JSON.stringify(writeAccess));
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

  useEffect(() => {
    fetch("/api/permissions")
      .then((r) => r.json())
      .then((data) => {
        if (data.permissions) setPermissions(data.permissions);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleScope = useCallback(
    async (scope: string) => {
      const newValue = !permissions[scope];
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
        setPermissions((prev) => ({ ...prev, [scope]: !newValue }));
        console.error("Failed to update permission:", err);
      } finally {
        setSaving(null);
      }
    },
    [permissions]
  );

  const isEnabled = (scope: string) => permissions[scope] !== false;

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
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="space-y-6"
      >
        {/* Header */}
        <PageHeader
          icon={Shield}
          title="Permissions"
          description="Control exactly what your AI agent can access. Disable a scope to block the agent from using it, even if the service is connected."
        />

        {/* Stats */}
        <motion.div variants={fadeUp}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={KeyRound}
              label="Total Scopes"
              value={totalScopes}
            />
            <StatCard
              icon={Eye}
              label="Read-Only"
              value={readScopes}
              color="text-[#22C55E]"
            />
            <StatCard
              icon={Lock}
              label="Write Access"
              value={writeScopes}
              color="text-[#EAB308]"
            />
            <StatCard
              icon={CheckCircle}
              label="Enabled"
              value={`${enabledCount}/${totalScopes}`}
              color="text-[#22C55E]"
            />
          </div>
        </motion.div>

        {/* Security Model Info */}
        <motion.div variants={fadeUp}>
          <div className="border border-[#FF3D00]/20 bg-[#FF3D00]/5 p-6">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-[#FF3D00] mt-0.5 shrink-0" strokeWidth={1.5} />
              <div>
                <p className="text-sm font-medium">Server-side enforcement</p>
                <p className="text-xs text-[#737373] mt-1">
                  These toggles are enforced on the server before every tool
                  call. If you disable a scope, the agent is blocked from
                  using any tool that requires it. The request never reaches
                  the external API.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Step-Up Auth Enforcement */}
        <motion.div variants={fadeUp}>
          <div className="border border-[#EAB308]/20 bg-[#EAB308]/5 p-6">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-[#EAB308] mt-0.5 shrink-0" strokeWidth={1.5} />
                <div>
                  <p className="text-sm font-medium">
                    Step-up authentication is enforced
                  </p>
                  <p className="text-xs text-[#737373] mt-1">
                    Write operations are blocked until you explicitly approve
                    each action. The agent cannot execute writes without human
                    authorization.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:ml-8">
                {["createGitHubIssue", "sendSlackMessage", "sendDiscordMessage"].map(
                  (tool) => (
                    <div
                      key={tool}
                      className="flex items-center gap-2 p-2 border border-[#262626] bg-[#0A0A0A]"
                    >
                      <Lock className="w-3.5 h-3.5 text-[#EAB308] shrink-0" strokeWidth={1.5} />
                      <span className="text-xs font-mono truncate">{tool}</span>
                    </div>
                  )
                )}
              </div>
              <p className="text-xs text-[#737373] sm:ml-8">
                Approved actions create a step-up session valid for 10 minutes.
                All approvals and denials are logged in the audit trail.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Service Permissions */}
        {loading ? (
          <motion.div variants={fadeUp} className="flex items-center justify-center py-12">
            <DotsLoader label="Loading permissions..." />
          </motion.div>
        ) : (
          servicePermissions.map((service) => {
            const Icon = service.icon;
            const serviceEnabled = serviceAccess[service.id];
            const enabledScopeCount = service.scopes.filter((s) => isEnabled(s.scope)).length;
            return (
              <motion.div key={service.id} variants={fadeUp}>
                <div className="border border-[#262626] bg-[#0F0F0F]">
                  {/* Service header with master toggles */}
                  <div className="border-b border-[#262626] px-6 py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <Icon
                          className={`w-5 h-5 ${serviceEnabled ? service.color : "text-[#737373]"}`}
                          strokeWidth={1.5}
                        />
                        <div className="min-w-0">
                          <h3 className={`text-base font-semibold tracking-tight ${!serviceEnabled ? "text-[#737373]" : ""}`}>
                            {service.name}
                          </h3>
                          <p className="text-xs text-[#737373]">
                            {serviceEnabled
                              ? `${enabledScopeCount} of ${service.scopes.length} scopes enabled`
                              : "All access blocked"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        {serviceEnabled && (
                          <div className="flex items-center gap-2">
                            <Pencil
                              className={`w-3.5 h-3.5 ${
                                writeAccess[service.id]
                                  ? "text-[#EAB308]"
                                  : "text-[#737373]"
                              }`}
                            />
                            <span className="text-xs text-[#737373] hidden sm:inline">
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
                        {!serviceEnabled && (
                          <Badge
                            variant="outline"
                            className="text-xs text-[#737373] border-[#262626]"
                          >
                            Disabled
                          </Badge>
                        )}
                        <CreativeToggle
                          checked={serviceEnabled}
                          onChange={() => toggleServiceAccess(service.id)}
                          color="emerald"
                          size="md"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Scope list */}
                  <div className={`divide-y divide-[#262626] ${!serviceEnabled ? "opacity-50" : ""}`}>
                    {service.scopes.map((scope) => {
                      const risk = riskColors[scope.riskLevel];
                      const enabled = serviceEnabled && isEnabled(scope.scope);
                      const isSaving = saving === scope.scope;
                      return (
                        <div
                          key={scope.scope}
                          className="flex items-start justify-between gap-4 px-6 py-4 first:pt-4 last:pb-4"
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            {isSaving ? (
                              <div className="w-9 h-5 flex items-center justify-center shrink-0 mt-0.5">
                                <Loader2 className="w-4 h-4 animate-spin text-[#737373]" />
                              </div>
                            ) : (
                              <div className="mt-0.5">
                                <CreativeToggle
                                  checked={enabled}
                                  onChange={() => toggleScope(scope.scope)}
                                  disabled={isSaving || !serviceEnabled}
                                  color={scope.readWrite === "write" ? "yellow" : "emerald"}
                                  size="sm"
                                />
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p
                                  className={`text-sm font-mono font-medium ${
                                    !enabled ? "text-[#737373]" : ""
                                  }`}
                                >
                                  {scope.scope}
                                </p>
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] px-1.5 py-0 ${
                                    scope.readWrite === "write"
                                      ? "text-[#EAB308] border-[#EAB308]/30 bg-[#EAB308]/10"
                                      : "text-[#22C55E] border-[#22C55E]/30 bg-[#22C55E]/10"
                                  }`}
                                >
                                  {scope.readWrite === "write" ? (
                                    <><Pencil className="w-2.5 h-2.5 mr-1" />Write</>
                                  ) : (
                                    <><Eye className="w-2.5 h-2.5 mr-1" />Read</>
                                  )}
                                </Badge>
                                {scope.riskLevel !== "low" && (
                                  <Badge
                                    variant="outline"
                                    className={`text-[10px] px-1.5 py-0 ${risk.text} ${risk.border} ${risk.bg}`}
                                  >
                                    {scope.riskLevel === "high" ? (
                                      <><ShieldAlert className="w-2.5 h-2.5 mr-1" />High risk</>
                                    ) : (
                                      <><AlertTriangle className="w-2.5 h-2.5 mr-1" />Medium risk</>
                                    )}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-[#737373] mt-0.5">
                                {scope.description}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`text-xs font-medium shrink-0 mt-1 ${
                              enabled ? "text-[#22C55E]" : "text-[#DC2626]"
                            }`}
                          >
                            {enabled ? "Allowed" : "Blocked"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}

        {/* Token Flow */}
        <motion.div variants={fadeUp}>
          <div className="border border-[#262626] bg-[#0F0F0F]">
            <div className="border-b border-[#262626] px-6 py-4">
              <h3 className="text-sm font-semibold tracking-tight flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-[#FF3D00]" strokeWidth={1.5} />
                Token Exchange Flow
              </h3>
            </div>
            <div className="px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {[
                  {
                    step: "1",
                    title: "User Request",
                    desc: "You ask Clavis to perform an action",
                  },
                  {
                    step: "2",
                    title: "Permission Check",
                    desc: "Server checks if you have enabled the required scopes",
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
                    desc: "Action and approval decision logged with scope and risk",
                  },
                ].map((item) => (
                  <div
                    key={item.step}
                    className="p-4 border border-[#262626] bg-[#0A0A0A] text-center"
                  >
                    <div className="w-8 h-8 border border-[#FF3D00] text-[#FF3D00] font-semibold text-sm flex items-center justify-center mx-auto mb-3">
                      {item.step}
                    </div>
                    <p className="text-xs font-medium tracking-tight">{item.title}</p>
                    <p className="text-[10px] text-[#737373] mt-1">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
