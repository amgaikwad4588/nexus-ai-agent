"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Link2,
  Mail,
  GitBranch,
  MessageSquare,
  CheckCircle,
  XCircle,
  ExternalLink,
  Shield,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { fadeUp, stagger } from "@/components/dashboard/motion";
import type { ConnectedService } from "@/lib/types";

const serviceConfig: Record<
  string,
  {
    icon: typeof Mail;
    color: string;
    description: string;
    capabilities: string[];
  }
> = {
  google: {
    icon: Mail,
    color: "text-[#DC2626]",
    description:
      "Access Gmail and Google Calendar to search emails, check availability, and manage events.",
    capabilities: [
      "Search and read emails",
      "Check calendar availability",
      "View upcoming events",
    ],
  },
  github: {
    icon: GitBranch,
    color: "text-[#FAFAFA]",
    description:
      "Access your GitHub repositories, issues, and profile information.",
    capabilities: [
      "List repositories",
      "View and create issues",
      "Read profile info",
    ],
  },
  slack: {
    icon: MessageSquare,
    color: "text-[#A855F7]",
    description:
      "Access Slack channels to read messages, send notifications, and manage conversations.",
    capabilities: [
      "List channels",
      "Send messages",
      "Read channel history",
    ],
  },
  discord: {
    icon: MessageSquare,
    color: "text-[#6366F1]",
    description:
      "Access Discord servers, view profile, and check membership details via Token Vault.",
    capabilities: [
      "View profile",
      "List servers",
      "Check membership",
    ],
  },
};

export function ConnectionsPage() {
  const [services, setServices] = useState<ConnectedService[]>([]);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  useEffect(() => {
    fetchConnections();
  }, []);

  async function fetchConnections() {
    try {
      const res = await fetch("/api/connections");
      const data = await res.json();
      setServices(data.services || []);
    } catch {
      setServices([
        {
          id: "google",
          name: "Google",
          connection: "google-oauth2",
          icon: "google",
          connected: false,
          scopes: ["gmail.readonly", "calendar.readonly"],
          tokenStatus: "not_connected",
        },
        {
          id: "github",
          name: "GitHub",
          connection: "github",
          icon: "github",
          connected: false,
          scopes: ["repo", "read:user"],
          tokenStatus: "not_connected",
        },
        {
          id: "slack",
          name: "Slack",
          connection: "slack-custom",
          icon: "slack",
          connected: false,
          scopes: ["channels:read", "chat:write", "channels:history", "users:read"],
          tokenStatus: "not_connected",
        },
        {
          id: "discord",
          name: "Discord",
          connection: "discord",
          icon: "discord",
          connected: false,
          scopes: ["identify", "guilds", "guilds.members.read"],
          tokenStatus: "not_connected",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDisconnect(service: ConnectedService) {
    if (!service.accountId) {
      console.error("No accountId for service:", service.id);
      return;
    }

    setDisconnecting(service.id);
    try {
      const res = await fetch("/api/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: service.accountId }),
      });
      if (!res.ok) {
        const data = await res.json();
        console.error("Disconnect failed:", data.error);
      }
    } catch (err) {
      console.error("Disconnect error:", err);
    } finally {
      setDisconnecting(null);
      setLoading(true);
      fetchConnections();
    }
  }

  const connectedCount = services.filter((s) => s.connected).length;

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
          icon={Link2}
          title="Connected Services"
          description={`${connectedCount} of ${services.length} services connected via Auth0 Token Vault`}
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setLoading(true);
                fetchConnections();
              }}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
          }
        />

        {/* Info Banner */}
        <motion.div variants={fadeUp}>
          <div className="border border-[#FF3D00]/20 bg-[#FF3D00]/5 p-6">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-[#FF3D00] mt-0.5 shrink-0" strokeWidth={1.5} />
              <div>
                <p className="text-sm font-medium">
                  Secured by Auth0 Token Vault
                </p>
                <p className="text-xs text-[#737373] mt-1">
                  Your OAuth tokens are stored securely in Auth0&apos;s Token
                  Vault. Clavis exchanges scoped tokens on-demand and never
                  stores raw credentials. You can revoke access at any time.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Service Cards */}
        {services.map((service) => {
          const config = serviceConfig[service.id];
          if (!config) return null;
          const Icon = config.icon;

          return (
            <motion.div key={service.id} variants={fadeUp}>
              <div className="border border-[#262626] bg-[#0F0F0F]">
                {/* Header */}
                <div className="border-b border-[#262626] px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Icon className={`w-5 h-5 ${config.color}`} strokeWidth={1.5} />
                      <div>
                        <h3 className="text-base font-semibold tracking-tight">
                          {service.name}
                        </h3>
                        <p className="text-xs text-[#737373]">
                          {config.description}
                        </p>
                      </div>
                    </div>
                    <div>
                      {service.connected ? (
                        <Badge
                          variant="outline"
                          className="text-[#22C55E] border-[#22C55E]/30"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Connected
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-[#737373]"
                        >
                          <XCircle className="w-3 h-3 mr-1" />
                          Not Connected
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="px-6 py-4 space-y-4">
                  {/* Scopes */}
                  <div>
                    <p className="text-xs text-[#737373] uppercase tracking-wider mb-2">
                      Requested Scopes
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {service.scopes.map((scope) => (
                        <Badge
                          key={scope}
                          variant="secondary"
                          className="text-xs font-mono"
                        >
                          {scope}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Capabilities */}
                  <div>
                    <p className="text-xs text-[#737373] uppercase tracking-wider mb-2">
                      Capabilities
                    </p>
                    <ul className="space-y-1.5">
                      {config.capabilities.map((cap, i) => (
                        <li
                          key={i}
                          className="text-xs text-[#737373] flex items-center gap-2"
                        >
                          <div
                            className={`w-1 h-1 ${
                              service.connected
                                ? "bg-[#22C55E]"
                                : "bg-[#737373]/30"
                            }`}
                          />
                          {cap}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Connect / Disconnect Button */}
                  <div className="pt-2">
                    {!service.connected && service.id !== "slack" && (
                      <a
                        href={`/api/connect?connection=${service.connection}`}
                      >
                        <Button size="sm" className="w-full">
                          <ExternalLink className="w-3 h-3 mr-2" />
                          Connect {service.name}
                        </Button>
                      </a>
                    )}

                    {service.connected && service.id !== "slack" && (
                      <div className="flex items-center justify-between">
                        {service.lastUsed && (
                          <p className="text-[10px] text-[#737373]">
                            Connected:{" "}
                            {new Date(service.lastUsed).toLocaleDateString()}
                          </p>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={disconnecting === service.id}
                          onClick={() => handleDisconnect(service)}
                        >
                          {disconnecting === service.id ? (
                            <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                          ) : (
                            <XCircle className="w-3 h-3 mr-2" />
                          )}
                          Disconnect
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
