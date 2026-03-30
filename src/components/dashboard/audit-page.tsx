"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Mail,
  GitBranch,
  MessageSquare,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Filter,
  BarChart3,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AuditEntry } from "@/lib/types";

const serviceIcons: Record<string, { icon: typeof Mail; color: string }> = {
  google: { icon: Mail, color: "text-red-400" },
  github: { icon: GitBranch, color: "text-white" },
  slack: { icon: MessageSquare, color: "text-purple-400" },
  system: { icon: Shield, color: "text-primary" },
};

const statusConfig = {
  success: { icon: CheckCircle, color: "text-green-400", label: "Success" },
  failed: { icon: XCircle, color: "text-red-400", label: "Failed" },
  pending_approval: { icon: Clock, color: "text-yellow-400", label: "Pending" },
  denied: { icon: XCircle, color: "text-red-400", label: "Denied" },
};

const riskColors = {
  low: "text-green-400 bg-green-400/10 border-green-400/30",
  medium: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  high: "text-orange-400 bg-orange-400/10 border-orange-400/30",
  critical: "text-red-400 bg-red-400/10 border-red-400/30",
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

interface AuditStats {
  total: number;
  byService: Record<string, number>;
  byStatus: Record<string, number>;
  stepUpCount: number;
}

export function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);

  useEffect(() => {
    fetchAudit();
  }, []);

  async function fetchAudit() {
    try {
      const res = await fetch("/api/audit");
      const data = await res.json();
      setEntries(data.entries || []);
      setStats(data.stats || null);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredEntries = filter
    ? entries.filter((e) => e.service === filter)
    : entries;

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
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
                <Activity className="w-6 h-6 text-primary" />
                Audit Trail
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Every agent action logged with full transparency
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setLoading(true);
                fetchAudit();
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

        {/* Stats */}
        {stats && (
          <motion.div variants={fadeUp}>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground">Total Actions</p>
                  <p className="text-xl font-bold">{stats.total}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-400" /> Success
                  </p>
                  <p className="text-xl font-bold text-green-400">
                    {stats.byStatus.success || 0}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <XCircle className="w-3 h-3 text-red-400" /> Failed
                  </p>
                  <p className="text-xl font-bold text-red-400">
                    {stats.byStatus.failed || 0}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Shield className="w-3 h-3 text-yellow-400" /> Step-Up Auth
                  </p>
                  <p className="text-xl font-bold text-yellow-400">
                    {stats.stepUpCount}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <BarChart3 className="w-3 h-3 text-primary" /> Services
                  </p>
                  <p className="text-xl font-bold">
                    {Object.values(stats.byService).filter((v) => v > 0).length}
                  </p>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {/* Filter */}
        <motion.div variants={fadeUp}>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Filter:</span>
            <Button
              variant={filter === null ? "secondary" : "ghost"}
              size="sm"
              className="text-xs h-7"
              onClick={() => setFilter(null)}
            >
              All
            </Button>
            {["google", "github", "slack"].map((service) => {
              const config = serviceIcons[service];
              const Icon = config.icon;
              return (
                <Button
                  key={service}
                  variant={filter === service ? "secondary" : "ghost"}
                  size="sm"
                  className="text-xs h-7"
                  onClick={() =>
                    setFilter(filter === service ? null : service)
                  }
                >
                  <Icon className={`w-3 h-3 mr-1 ${config.color}`} />
                  {service.charAt(0).toUpperCase() + service.slice(1)}
                </Button>
              );
            })}
          </div>
        </motion.div>

        {/* Audit Log */}
        <motion.div variants={fadeUp}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredEntries.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No audit entries yet</p>
                  <p className="text-xs mt-1">
                    Start chatting with Nexus to see activity here
                  </p>
                </div>
              ) : (
                <ScrollArea className="max-h-[600px]">
                  <div className="space-y-2">
                    {filteredEntries.map((entry, i) => {
                      const svc = serviceIcons[entry.service] || serviceIcons.system;
                      const SvcIcon = svc.icon;
                      const status = statusConfig[entry.status];
                      const StatusIcon = status.icon;
                      const risk = riskColors[entry.riskLevel];

                      return (
                        <motion.div
                          key={entry.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="flex items-center gap-3 p-3 rounded-lg bg-accent/10 hover:bg-accent/20 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-lg bg-accent/30 flex items-center justify-center shrink-0">
                            <SvcIcon
                              className={`w-4 h-4 ${svc.color}`}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {entry.action}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(entry.timestamp).toLocaleTimeString()}
                              </span>
                              {entry.scopes.map((scope) => (
                                <span
                                  key={scope}
                                  className="text-[10px] font-mono text-muted-foreground"
                                >
                                  {scope}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {entry.stepUpRequired && (
                              <Badge
                                variant="outline"
                                className="text-[10px] text-yellow-400 border-yellow-400/30"
                              >
                                <Shield className="w-2.5 h-2.5 mr-0.5" />
                                Step-Up
                              </Badge>
                            )}
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${risk}`}
                            >
                              {entry.riskLevel}
                            </Badge>
                            <StatusIcon
                              className={`w-4 h-4 ${status.color}`}
                            />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
