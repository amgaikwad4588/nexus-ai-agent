"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Link2,
  Mail,
  Calendar,
  GitBranch,
  MessageSquare,
  CheckCircle,
  XCircle,
  ExternalLink,
  Shield,
  RefreshCw,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ConnectedService } from "@/lib/types";

const serviceConfig: Record<
  string,
  {
    icon: typeof Mail;
    color: string;
    bgColor: string;
    description: string;
    capabilities: string[];
  }
> = {
  google: {
    icon: Mail,
    color: "text-red-400",
    bgColor: "bg-red-400/10",
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
    color: "text-white",
    bgColor: "bg-white/10",
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
    color: "text-purple-400",
    bgColor: "bg-purple-400/10",
    description:
      "Access Slack channels to read messages, send notifications, and manage conversations.",
    capabilities: [
      "List channels",
      "Send messages",
      "Read channel history",
    ],
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function ConnectionsPage() {
  const [services, setServices] = useState<ConnectedService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConnections();
  }, []);

  async function fetchConnections() {
    try {
      const res = await fetch("/api/connections");
      const data = await res.json();
      setServices(data.services || []);
    } catch {
      // Use default disconnected state
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
          connection: "slack",
          icon: "slack",
          connected: false,
          scopes: ["channels:read", "chat:write"],
          tokenStatus: "not_connected",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const connectedCount = services.filter((s) => s.connected).length;

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Link2 className="w-6 h-6 text-primary" />
                Connected Services
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {connectedCount} of {services.length} services connected via
                Auth0 Token Vault
              </p>
            </div>
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
          </div>
        </motion.div>

        {/* Info Banner */}
        <motion.div variants={fadeUp}>
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">
                    Secured by Auth0 Token Vault
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your OAuth tokens are stored securely in Auth0&apos;s Token
                    Vault. Nexus exchanges scoped tokens on-demand and never
                    stores raw credentials. You can revoke access at any time
                    from your Auth0 account.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Service Cards */}
        {services.map((service) => {
          const config = serviceConfig[service.id];
          if (!config) return null;
          const Icon = config.icon;

          return (
            <motion.div key={service.id} variants={fadeUp}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-xl ${config.bgColor} flex items-center justify-center`}
                      >
                        <Icon className={`w-6 h-6 ${config.color}`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {service.name}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {config.description}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {service.connected ? (
                        <Badge
                          variant="outline"
                          className="text-green-400 border-green-400/30 bg-green-400/10"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Connected
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-muted-foreground"
                        >
                          <XCircle className="w-3 h-3 mr-1" />
                          Not Connected
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Scopes */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Requested Scopes
                      </p>
                      <div className="flex flex-wrap gap-1.5">
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
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Capabilities
                      </p>
                      <ul className="space-y-1">
                        {config.capabilities.map((cap, i) => (
                          <li
                            key={i}
                            className="text-xs text-muted-foreground flex items-center gap-2"
                          >
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${
                                service.connected
                                  ? "bg-green-400"
                                  : "bg-muted-foreground/30"
                              }`}
                            />
                            {cap}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Connect Button */}
                    {!service.connected && (
                      <a
                        href={`/auth/login?connection=${service.connection}&returnTo=/dashboard/connections`}
                      >
                        <Button size="sm" className="w-full">
                          <ExternalLink className="w-3 h-3 mr-2" />
                          Connect {service.name}
                        </Button>
                      </a>
                    )}

                    {service.connected && service.lastUsed && (
                      <p className="text-[10px] text-muted-foreground">
                        Last used: {new Date(service.lastUsed).toLocaleString()}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
