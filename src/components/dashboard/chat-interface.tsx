"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Send,
  Sparkles,
  User,
  Loader2,
  Mail,
  GitBranch,
  MessageSquare,
  Calendar,
  Shield,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const toolIcons: Record<string, { icon: typeof Mail; color: string; service: string }> = {
  searchGmail: { icon: Mail, color: "text-red-400", service: "Google" },
  checkCalendar: { icon: Calendar, color: "text-blue-400", service: "Google" },
  listGitHubRepos: { icon: GitBranch, color: "text-white", service: "GitHub" },
  getGitHubIssues: { icon: GitBranch, color: "text-white", service: "GitHub" },
  createGitHubIssue: { icon: GitBranch, color: "text-orange-400", service: "GitHub" },
  getGitHubProfile: { icon: GitBranch, color: "text-white", service: "GitHub" },
  listSlackChannels: { icon: MessageSquare, color: "text-purple-400", service: "Slack" },
  sendSlackMessage: { icon: MessageSquare, color: "text-purple-400", service: "Slack" },
  getSlackChannelHistory: { icon: MessageSquare, color: "text-purple-400", service: "Slack" },
};

const suggestedPrompts = [
  "Search my Gmail for unread emails from today",
  "List my recent GitHub repositories",
  "Check my Google Calendar for tomorrow",
  "Show my Slack channels",
  "Summarize my unread emails and post to Slack",
  "What GitHub issues are assigned to me?",
];

// Tracks approval state for pending actions
interface ApprovalState {
  status: "pending" | "approving" | "approved" | "denied" | "executed" | "error";
  result?: Record<string, unknown>;
  error?: string;
}

// Write tools that require step-up auth
const WRITE_TOOLS = new Set(["createGitHubIssue", "sendSlackMessage"]);

function StepUpApprovalCard({
  pendingActionId,
  action,
  description,
  details,
  approvalState,
  onApprove,
  onDeny,
}: {
  pendingActionId: string;
  action: string;
  description: string;
  details: Record<string, unknown>;
  approvalState?: ApprovalState;
  onApprove: (id: string) => void;
  onDeny: (id: string) => void;
}) {
  const state = approvalState?.status || "pending";
  const isGitHub = action === "createGitHubIssue";
  const Icon = isGitHub ? GitBranch : MessageSquare;
  const serviceColor = isGitHub ? "text-orange-400" : "text-purple-400";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4 space-y-3"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-yellow-400" />
        <span className="text-xs font-semibold text-yellow-400 uppercase tracking-wide">
          Step-Up Authentication Required
        </span>
      </div>

      {/* Action details */}
      <div className="flex items-start gap-3 p-3 rounded-md bg-accent/30 border border-border/30">
        <Icon className={`w-5 h-5 ${serviceColor} mt-0.5 shrink-0`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{description}</p>
          {Boolean("repo" in details && details.repo) && (
            <p className="text-xs text-muted-foreground mt-1">
              Repository: <span className="font-mono">{String(details.repo)}</span>
            </p>
          )}
          {Boolean("title" in details && details.title) && (
            <p className="text-xs text-muted-foreground">
              Title: {String(details.title)}
            </p>
          )}
          {Boolean("channel" in details && details.channel) && (
            <p className="text-xs text-muted-foreground mt-1">
              Channel: <span className="font-mono">#{String(details.channel)}</span>
            </p>
          )}
          {Boolean("message" in details && details.message) && (
            <p className="text-xs text-muted-foreground truncate">
              Message: &ldquo;{String(details.message).slice(0, 100)}&rdquo;
            </p>
          )}
        </div>
        <Badge variant="outline" className="text-xs text-yellow-400 border-yellow-400/30 bg-yellow-400/10 shrink-0">
          <AlertTriangle className="w-3 h-3 mr-1" />
          write
        </Badge>
      </div>

      {/* Action buttons or status */}
      {state === "pending" && (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => onApprove(pendingActionId)}
            className="bg-green-600 hover:bg-green-700 text-white text-xs gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Authorize & Execute
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDeny(pendingActionId)}
            className="text-xs text-red-400 border-red-400/30 hover:bg-red-400/10 gap-1.5"
          >
            <XCircle className="w-3.5 h-3.5" />
            Deny
          </Button>
          <span className="text-[10px] text-muted-foreground ml-auto">
            Expires in 5 minutes
          </span>
        </div>
      )}

      {state === "approving" && (
        <div className="flex items-center gap-2 text-xs text-yellow-400">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Verifying identity and executing action...
        </div>
      )}

      {state === "executed" && approvalState?.result && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-green-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            Action authorized and executed successfully
          </div>
          {Boolean(approvalState.result.url) && (
            <a
              href={String(approvalState.result.url)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline"
            >
              {String(approvalState.result.url)}
            </a>
          )}
          {Boolean(approvalState.result.sent) && (
            <p className="text-xs text-muted-foreground">
              Message sent to channel successfully
            </p>
          )}
        </div>
      )}

      {state === "approved" && (
        <div className="flex items-center gap-2 text-xs text-green-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          Approved — executing...
        </div>
      )}

      {state === "denied" && (
        <div className="flex items-center gap-2 text-xs text-red-400">
          <XCircle className="w-3.5 h-3.5" />
          Action denied by user
        </div>
      )}

      {state === "error" && (
        <div className="flex items-center gap-2 text-xs text-red-400">
          <XCircle className="w-3.5 h-3.5" />
          {approvalState?.error || "Failed to execute action"}
        </div>
      )}
    </motion.div>
  );
}

export function ChatInterface() {
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [approvalStates, setApprovalStates] = useState<Record<string, ApprovalState>>({});

  const isLoading = status === "submitted" || status === "streaming";

  const handleApprove = useCallback(async (actionId: string) => {
    setApprovalStates((prev) => ({
      ...prev,
      [actionId]: { status: "approving" },
    }));

    try {
      const res = await fetch("/api/step-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionId, decision: "approve" }),
      });

      const data = await res.json();
      if (!res.ok || data.status === "error") {
        throw new Error(data.result?.error || data.error || "Action execution failed");
      }
      setApprovalStates((prev) => ({
        ...prev,
        [actionId]: { status: "executed", result: data.result },
      }));
    } catch (err) {
      setApprovalStates((prev) => ({
        ...prev,
        [actionId]: {
          status: "error",
          error: err instanceof Error ? err.message : "Unknown error",
        },
      }));
    }
  }, []);

  const handleDeny = useCallback(async (actionId: string) => {
    setApprovalStates((prev) => ({
      ...prev,
      [actionId]: { status: "denied" },
    }));

    try {
      await fetch("/api/step-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionId, decision: "deny" }),
      });
    } catch {
      // Denial is best-effort on server
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0) setShowSuggestions(false);
  }, [messages.length]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input.trim() });
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border/50 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h1 className="font-semibold text-sm">Nexus AI Agent</h1>
          <p className="text-xs text-muted-foreground">
            Connected to Google, GitHub, Slack via Token Vault
          </p>
        </div>
        <Badge variant="outline" className="ml-auto text-xs">
          <Shield className="w-3 h-3 mr-1" />
          Secure
        </Badge>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-6" ref={scrollRef}>
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Welcome message */}
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 glow">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">
                What can I help you with?
              </h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mb-8">
                I can access your Gmail, Google Calendar, GitHub repos, and
                Slack channels. Every action is scoped and audited.
              </p>

              {/* Suggested prompts */}
              <AnimatePresence>
                {showSuggestions && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg mx-auto"
                  >
                    {suggestedPrompts.map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setInput(prompt);
                          textareaRef.current?.focus();
                        }}
                        className="text-left text-xs p-3 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground"
                      >
                        {prompt}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Chat messages */}
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  message.role === "user"
                    ? "bg-accent"
                    : "bg-primary/10"
                }`}
              >
                {message.role === "user" ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Sparkles className="w-4 h-4 text-primary" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 space-y-2">
                <div className="text-xs font-medium text-muted-foreground">
                  {message.role === "user" ? "You" : "Nexus"}
                </div>

                {/* Message parts */}
                {message.parts?.map((part, i) => {
                  // Handle tool parts (v6: type is "tool-{name}" or "dynamic-tool")
                  const partType = part.type as string;
                  if (partType.startsWith("tool-") || partType === "dynamic-tool") {
                    const toolName = partType === "dynamic-tool"
                      ? (part as { toolName?: string }).toolName || "unknown"
                      : partType.replace("tool-", "");
                    const toolInfo = toolIcons[toolName];
                    const Icon = toolInfo?.icon || Shield;
                    const partAny = part as { state?: string; output?: Record<string, unknown> };
                    const isComplete = partAny.state === "output-available";
                    const isError = partAny.state === "error";

                    // Check if this is a write tool that returned a step-up approval request
                    const output = partAny.output as Record<string, unknown> | undefined;
                    if (
                      isComplete &&
                      output?.requiresApproval === true &&
                      output?.pendingActionId
                    ) {
                      const actionId = String(output.pendingActionId);
                      return (
                        <StepUpApprovalCard
                          key={i}
                          pendingActionId={actionId}
                          action={String(output.action || toolName)}
                          description={String(output.description || "")}
                          details={(output.details as Record<string, unknown>) || {}}
                          approvalState={approvalStates[actionId]}
                          onApprove={handleApprove}
                          onDeny={handleDeny}
                        />
                      );
                    }

                    // Standard tool badge for read operations
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/30 border border-border/30 text-xs"
                      >
                        <Icon
                          className={`w-3.5 h-3.5 ${toolInfo?.color || "text-muted-foreground"}`}
                        />
                        <span className="text-muted-foreground">
                          {toolInfo?.service || "Tool"}:
                        </span>
                        <span className="font-medium">
                          {toolName}
                        </span>
                        {WRITE_TOOLS.has(toolName) && (
                          <Badge variant="outline" className="text-[10px] text-yellow-400 border-yellow-400/30 ml-1">
                            write
                          </Badge>
                        )}
                        <span className="ml-auto">
                          {isError ? (
                            <XCircle className="w-3 h-3 text-destructive" />
                          ) : isComplete ? (
                            <CheckCircle className="w-3 h-3 text-green-400" />
                          ) : (
                            <Loader2 className="w-3 h-3 animate-spin text-primary" />
                          )}
                        </span>
                      </div>
                    );
                  }
                  if (part.type === "text") {
                    const textContent = (part as { text?: string }).text;
                    if (!textContent) return null;
                    return (
                      <div
                        key={i}
                        className="text-sm leading-relaxed prose prose-invert max-w-none prose-sm prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-table:my-2 prose-th:px-3 prose-th:py-1.5 prose-td:px-3 prose-td:py-1.5 prose-th:text-left prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
                      >
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {textContent}
                        </ReactMarkdown>
                      </div>
                    );
                  }
                  return null;
                })}

                {/* Fallback when no parts */}
                {(!message.parts || message.parts.length === 0) && (
                  <div className="text-sm leading-relaxed text-muted-foreground">
                    (No content)
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {/* Loading indicator */}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/30 text-xs text-destructive">
              <XCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error.message || "Something went wrong"}</span>
            </div>
          )}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              <Loader2 className="w-3 h-3 animate-spin" />
              Nexus is thinking...
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border/50">
        <form
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto flex gap-2 items-end"
        >
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Nexus anything... (e.g., 'Check my unread emails')"
              className="min-h-[44px] max-h-[120px] resize-none pr-12 text-sm"
              rows={1}
            />
          </div>
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim()}
            className="shrink-0 h-[44px] w-[44px]"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          All actions are authenticated via Auth0 Token Vault and logged in the
          audit trail
        </p>
      </div>
    </div>
  );
}

