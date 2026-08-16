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
  RefreshCw,
  Loader2,
  Filter,
  BarChart3,
  FileJson,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { fadeUp, stagger } from "@/components/dashboard/motion";
import type { AuditEntry } from "@/lib/types";

const serviceIcons: Record<string, { icon: typeof Mail; color: string }> = {
  google: { icon: Mail, color: "text-[#DC2626]" },
  github: { icon: GitBranch, color: "text-[#FAFAFA]" },
  slack: { icon: MessageSquare, color: "text-[#A855F7]" },
  discord: { icon: MessageSquare, color: "text-[#6366F1]" },
  system: { icon: Shield, color: "text-[#FF3D00]" },
};

const statusConfig = {
  success: { icon: CheckCircle, color: "text-[#22C55E]", label: "Success" },
  failed: { icon: XCircle, color: "text-[#DC2626]", label: "Failed" },
  pending_approval: { icon: Clock, color: "text-[#EAB308]", label: "Pending" },
  denied: { icon: XCircle, color: "text-[#DC2626]", label: "Denied" },
};

const riskColors = {
  low: "text-[#22C55E] bg-[#22C55E]/10 border-[#22C55E]/30",
  medium: "text-[#EAB308] bg-[#EAB308]/10 border-[#EAB308]/30",
  high: "text-[#F97316] bg-[#F97316]/10 border-[#F97316]/30",
  critical: "text-[#DC2626] bg-[#DC2626]/10 border-[#DC2626]/30",
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
  const [showRawJson, setShowRawJson] = useState(false);

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
        variants={stagger}
        className="space-y-6"
      >
        {/* Header */}
        <PageHeader
          icon={Activity}
          title="Audit Trail"
          description="Every agent action logged with full transparency"
          actions={
            <>
              <Button
                variant={showRawJson ? "secondary" : "outline"}
                size="sm"
                onClick={() => setShowRawJson(!showRawJson)}
              >
                <FileJson className="w-4 h-4 mr-1" />
                Raw JSON
              </Button>
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
            </>
          }
        />

        {/* Stats */}
        {stats && (
          <motion.div variants={fadeUp}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <StatCard
                icon={Activity}
                label="Total Actions"
                value={stats.total}
              />
              <StatCard
                icon={CheckCircle}
                label="Success"
                value={stats.byStatus.success || 0}
                color="text-[#22C55E]"
              />
              <StatCard
                icon={XCircle}
                label="Failed"
                value={stats.byStatus.failed || 0}
                color="text-[#DC2626]"
              />
              <StatCard
                icon={Shield}
                label="Step-Up Auth"
                value={stats.stepUpCount}
                color="text-[#EAB308]"
              />
              <StatCard
                icon={BarChart3}
                label="Services"
                value={Object.values(stats.byService).filter((v) => v > 0).length}
                color="text-[#3B82F6]"
              />
            </div>
          </motion.div>
        )}

        {/* Filter */}
        <motion.div variants={fadeUp}>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#737373]" />
            <span className="text-xs text-[#737373] uppercase tracking-wider">Filter:</span>
            <Button
              variant={filter === null ? "secondary" : "ghost"}
              size="sm"
              className="text-xs h-7"
              onClick={() => setFilter(null)}
            >
              All
            </Button>
            {["google", "github", "slack", "discord"].map((service) => {
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
                  <Icon className={`w-3 h-3 mr-1 ${config.color}`} strokeWidth={1.5} />
                  {service.charAt(0).toUpperCase() + service.slice(1)}
                </Button>
              );
            })}
          </div>
        </motion.div>

        {/* Raw JSON Viewer */}
        {showRawJson && (
          <motion.div variants={fadeUp}>
            <div className="border border-[#262626] bg-[#0F0F0F]">
              <div className="border-b border-[#262626] px-6 py-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold tracking-tight flex items-center gap-2">
                  <FileJson className="w-4 h-4 text-[#FF3D00]" strokeWidth={1.5} />
                  Raw JSON — audit-log.json
                </h3>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setShowRawJson(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="p-6">
                <div className="max-h-125 overflow-auto">
                  <pre className="text-xs font-mono bg-[#0A0A0A] p-4 whitespace-pre-wrap break-all">
                    {JSON.stringify(entries, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Audit Log */}
        <motion.div variants={fadeUp}>
          <div className="border border-[#262626] bg-[#0F0F0F]">
            <div className="border-b border-[#262626] px-6 py-4">
              <h3 className="text-sm font-semibold tracking-tight">Activity Log</h3>
            </div>
            <div className="px-6 py-4">
              {filteredEntries.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="w-10 h-10 text-[#262626] mx-auto mb-3" strokeWidth={1.5} />
                  <p className="text-sm text-[#737373]">No audit entries yet</p>
                  <p className="text-xs text-[#737373]/60 mt-1">
                    Start chatting with Clavis to see activity here
                  </p>
                </div>
              ) : (
                <ScrollArea className="max-h-[600px]">
                  <div className="space-y-3">
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
                          className="flex items-center gap-3 py-3 border-b border-[#262626] last:border-0"
                        >
                          <SvcIcon
                            className={`w-4 h-4 ${svc.color} shrink-0`}
                            strokeWidth={1.5}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {entry.action}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-[#737373]">
                                {new Date(entry.timestamp).toLocaleTimeString()}
                              </span>
                              {entry.scopes.map((scope) => (
                                <span
                                  key={scope}
                                  className="text-[10px] font-mono text-[#737373]"
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
                                className="text-[10px] text-[#EAB308] border-[#EAB308]/30"
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
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
