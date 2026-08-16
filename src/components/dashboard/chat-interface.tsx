"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Send,
  User,
  Loader2,
  Mail,
  GitBranch,
  MessageSquare,
  Shield,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Check,
  Hash,
  Server,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClavisLogo } from "@/components/clavis-logo";
import { CalendarIcon } from "@/components/icons/calendar-icon";
import { useChatHistory } from "@/lib/use-chat-history";
import { ChatHistorySidebar } from "@/components/dashboard/chat-history-sidebar";

type IconComponent = React.ComponentType<{ className?: string; strokeWidth?: number }>;

const toolIcons: Record<string, { icon: IconComponent; color: string; service: string }> = {
  searchGmail: { icon: Mail, color: "text-[#DC2626]", service: "Google" },
  checkCalendar: { icon: CalendarIcon, color: "text-[#3B82F6]", service: "Google" },
  listGitHubRepos: { icon: GitBranch, color: "text-[#FAFAFA]", service: "GitHub" },
  getGitHubIssues: { icon: GitBranch, color: "text-[#FAFAFA]", service: "GitHub" },
  createGitHubIssue: { icon: GitBranch, color: "text-[#F97316]", service: "GitHub" },
  getGitHubProfile: { icon: GitBranch, color: "text-[#FAFAFA]", service: "GitHub" },
  listSlackChannels: { icon: MessageSquare, color: "text-[#A855F7]", service: "Slack" },
  sendSlackMessage: { icon: MessageSquare, color: "text-[#A855F7]", service: "Slack" },
  getSlackChannelHistory: { icon: MessageSquare, color: "text-[#A855F7]", service: "Slack" },
  getDiscordProfile: { icon: MessageSquare, color: "text-[#6366F1]", service: "Discord" },
  listDiscordGuilds: { icon: MessageSquare, color: "text-[#6366F1]", service: "Discord" },
  getDiscordGuildMember: { icon: MessageSquare, color: "text-[#6366F1]", service: "Discord" },
  listDiscordChannels: { icon: MessageSquare, color: "text-[#6366F1]", service: "Discord" },
  sendDiscordMessage: { icon: MessageSquare, color: "text-[#6366F1]", service: "Discord" },
};

const suggestedPrompts = [
  "Search my Gmail for unread emails from today",
  "Create a GitHub issue",
  "Send a Discord message",
  "Send a Slack message",
  "Check my Google Calendar for tomorrow",
  "View my GitHub issues",
];

interface ApprovalState {
  status: "pending" | "approving" | "approved" | "denied" | "executed" | "error";
  result?: Record<string, unknown>;
  error?: string;
}

const WRITE_TOOLS = new Set(["createGitHubIssue", "sendSlackMessage", "sendDiscordMessage"]);

const RISK_STYLES = {
  medium: {
    border: "border-[#EAB308]/30",
    bg: "bg-[#EAB308]/5",
    headerColor: "text-[#EAB308]",
    headerIcon: ShieldAlert,
    headerText: "Step-Up Authentication Required",
    badgeText: "write",
    badgeClass: "text-[#EAB308] border-[#EAB308]/30 bg-[#EAB308]/10",
    approveText: "Authorize & Execute",
    loadingText: "Verifying identity and executing action...",
    loadingColor: "text-[#EAB308]",
  },
  high: {
    border: "border-[#DC2626]/30",
    bg: "bg-[#DC2626]/5",
    headerColor: "text-[#DC2626]",
    headerIcon: Shield,
    headerText: "Re-Authentication Required — High Risk",
    badgeText: "destructive",
    badgeClass: "text-[#DC2626] border-[#DC2626]/30 bg-[#DC2626]/10",
    approveText: "Re-Authenticate & Execute",
    loadingText: "Re-authenticating and executing action...",
    loadingColor: "text-[#DC2626]",
  },
};

function StepUpApprovalCard({
  pendingActionId,
  action,
  description,
  details,
  riskLevel = "medium",
  approvalState,
  onApprove,
  onDeny,
}: {
  pendingActionId: string;
  action: string;
  description: string;
  details: Record<string, unknown>;
  riskLevel?: "medium" | "high";
  approvalState?: ApprovalState;
  onApprove: (id: string) => void;
  onDeny: (id: string) => void;
}) {
  const state = approvalState?.status || "pending";
  const isGitHub = action === "createGitHubIssue";
  const isDiscord = action === "sendDiscordMessage";
  const isSlack = action === "sendSlackMessage";
  const Icon = isGitHub ? GitBranch : MessageSquare;
  const serviceColor = isGitHub ? "text-[#F97316]" : isDiscord ? "text-[#6366F1]" : "text-[#A855F7]";
  const style = RISK_STYLES[riskLevel] || RISK_STYLES.medium;
  const HeaderIcon = style.headerIcon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`border ${style.border} ${style.bg} p-4 space-y-3`}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <HeaderIcon className={`w-4 h-4 ${style.headerColor}`} strokeWidth={1.5} />
        <span className={`text-xs font-semibold ${style.headerColor} uppercase tracking-wider`}>
          {style.headerText}
        </span>
      </div>

      {/* Risk level indicator for high-risk actions */}
      {riskLevel === "high" && (
        <div className="flex items-center gap-2 px-3 py-1.5 border border-[#DC2626]/20 bg-[#DC2626]/10">
          <Shield className="w-3.5 h-3.5 text-[#DC2626]" strokeWidth={1.5} />
          <span className="text-[11px] text-[#DC2626]">
            This action is classified as <strong>high risk</strong> by the Risk Engine. Identity re-verification is required before execution.
          </span>
        </div>
      )}

      {/* Action details */}
      <div className="flex items-start gap-3 p-3 border border-[#262626] bg-[#0A0A0A]">
        <Icon className={`w-5 h-5 ${serviceColor} mt-0.5 shrink-0`} strokeWidth={1.5} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{description}</p>
          {isGitHub && Boolean("repo" in details && details.repo) && (
            <p className="text-xs text-[#737373] mt-1">
              Repository: <span className="font-mono">{String(details.repo)}</span>
            </p>
          )}
          {isGitHub && Boolean("title" in details && details.title) && (
            <p className="text-xs text-[#737373]">
              Title: {String(details.title)}
            </p>
          )}
          {(isSlack) && Boolean("channel" in details && details.channel) && (
            <p className="text-xs text-[#737373] mt-1">
              Channel: <span className="font-mono">#{String(details.channel)}</span>
            </p>
          )}
          {isDiscord && Boolean("channelId" in details && details.channelId) && (
            <p className="text-xs text-[#737373] mt-1">
              Channel ID: <span className="font-mono">{String(details.channelId)}</span>
            </p>
          )}
          {Boolean("message" in details && details.message) && (
            <p className="text-xs text-[#737373] mt-1">
              Message: <span className="italic">&ldquo;{String(details.message).slice(0, 100)}&rdquo;</span>
            </p>
          )}
        </div>
        <Badge variant="outline" className={`text-xs ${style.badgeClass} shrink-0`}>
          <AlertTriangle className="w-3 h-3 mr-1" />
          {style.badgeText}
        </Badge>
      </div>

      {/* Action buttons or status */}
      {state === "pending" && (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => onApprove(pendingActionId)}
            className={`text-xs ${riskLevel === "high" ? "bg-[#DC2626] hover:bg-[#DC2626]/90 text-[#FAFAFA]" : "bg-[#22C55E] hover:bg-[#22C55E]/90 text-[#0A0A0A]"}`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            {style.approveText}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDeny(pendingActionId)}
            className="text-xs text-[#DC2626] border-[#DC2626]/30 hover:bg-[#DC2626]/10"
          >
            <XCircle className="w-3.5 h-3.5" />
            Deny
          </Button>
          <span className="text-[10px] text-[#737373] ml-auto">
            Expires in 5 minutes
          </span>
        </div>
      )}

      {state === "approving" && (
        <div className={`flex items-center gap-2 text-xs ${style.loadingColor}`}>
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          {style.loadingText}
        </div>
      )}

      {state === "executed" && approvalState?.result && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-[#22C55E]">
            <ShieldCheck className="w-3.5 h-3.5" />
            Action authorized and executed successfully
          </div>
          {Boolean(approvalState.result.url) && (
            <a
              href={String(approvalState.result.url)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#FF3D00] hover:underline"
            >
              {String(approvalState.result.url)}
            </a>
          )}
          {isDiscord && Boolean(approvalState.result.sent) && (
            <p className="text-xs text-[#737373] flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              Message sent to Discord channel
            </p>
          )}
          {isSlack && Boolean(approvalState.result.sent) && (
            <p className="text-xs text-[#737373] flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              Message sent to Slack channel
            </p>
          )}
          {Boolean(approvalState.result.messageId) && (
            <p className="text-xs text-[#737373]">
              Message ID: <span className="font-mono">{String(approvalState.result.messageId)}</span>
            </p>
          )}
        </div>
      )}

      {state === "approved" && (
        <div className="flex items-center gap-2 text-xs text-[#22C55E]">
          <ShieldCheck className="w-3.5 h-3.5" />
          Approved — executing...
        </div>
      )}

      {state === "denied" && (
        <div className="flex items-center gap-2 text-xs text-[#DC2626]">
          <XCircle className="w-3.5 h-3.5" />
          Action denied by user
        </div>
      )}

      {state === "error" && (
        <div className="flex items-center gap-2 text-xs text-[#DC2626]">
          <XCircle className="w-3.5 h-3.5" />
          {approvalState?.error || "Failed to execute action"}
        </div>
      )}
    </motion.div>
  );
}

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`flex items-center gap-3 px-4 py-3 border ${
              toast.type === "success"
                ? "bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]"
                : toast.type === "error"
                  ? "bg-[#DC2626]/10 border-[#DC2626]/30 text-[#DC2626]"
                  : "bg-[#3B82F6]/10 border-[#3B82F6]/30 text-[#3B82F6]"
            }`}
          >
            {toast.type === "success" && <Check className="w-4 h-4 shrink-0" />}
            {toast.type === "error" && <XCircle className="w-4 h-4 shrink-0" />}
            {toast.type === "info" && <AlertTriangle className="w-4 h-4 shrink-0" />}
            <span className="text-sm flex-1">{toast.message}</span>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-xs hover:opacity-70 transition-opacity"
            >
              Dismiss
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/**
 * Guided flow types.
 * A "flow" is a multi-step, button-driven task (e.g. create an issue).
 * Pickers (repo/server/channel) advance the flow; when a target is chosen for a
 * "compose" action, an InlineActionForm collects the remaining free-text fields
 * and emits a single natural-language command that the LLM turns into the final
 * (step-up-gated) tool call.
 */
type FlowKind =
  | "create-issue" // pick repo → compose title/body
  | "view-issues" // pick repo → send "show issues"
  | "send-discord" // pick server → pick channel → compose message
  | "send-slack"; // pick channel → compose message

interface ComposeTarget {
  flow: FlowKind;
  // Human label shown in the form header, e.g. "amgaikwad4588/clavis-ai-"
  label: string;
  // The identifier the final command should reference (repo full_name / channel name / id)
  ref: string;
}

const FORM_CONFIG: Record<
  Exclude<FlowKind, "view-issues">,
  {
    title: string;
    accent: string;
    icon: typeof GitBranch;
    fields: { name: string; label: string; placeholder: string; multiline?: boolean; required?: boolean }[];
    // Build the final command string sent to the model
    build: (ref: string, values: Record<string, string>) => string;
  }
> = {
  "create-issue": {
    title: "Create GitHub Issue",
    accent: "#F97316",
    icon: GitBranch,
    fields: [
      { name: "title", label: "Issue title", placeholder: "Short summary of the issue", required: true },
      { name: "body", label: "Description (optional)", placeholder: "Add more detail…", multiline: true },
    ],
    build: (ref, v) =>
      `Create a GitHub issue in ${ref} with title "${v.title}"${v.body ? ` and body "${v.body}"` : ""}.`,
  },
  "send-discord": {
    title: "Send Discord Message",
    accent: "#6366F1",
    icon: MessageSquare,
    fields: [{ name: "message", label: "Message", placeholder: "Type your message…", multiline: true, required: true }],
    build: (ref, v) => `Send this message to Discord channel ${ref}: "${v.message}"`,
  },
  "send-slack": {
    title: "Send Slack Message",
    accent: "#A855F7",
    icon: MessageSquare,
    fields: [{ name: "message", label: "Message", placeholder: "Type your message…", multiline: true, required: true }],
    build: (ref, v) => `Send this message to Slack channel #${ref}: "${v.message}"`,
  },
};

function InlineActionForm({
  target,
  onSubmit,
  onCancel,
}: {
  target: ComposeTarget;
  onSubmit: (command: string) => void;
  onCancel: () => void;
}) {
  const config = FORM_CONFIG[target.flow as Exclude<FlowKind, "view-issues">];
  const [values, setValues] = useState<Record<string, string>>({});
  const Icon = config.icon;

  const requiredFilled = config.fields
    .filter((f) => f.required)
    .every((f) => (values[f.name] || "").trim().length > 0);

  const submit = () => {
    if (!requiredFilled) return;
    onSubmit(config.build(target.ref, values));
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="border p-4 space-y-3"
      style={{ borderColor: `${config.accent}4D`, backgroundColor: `${config.accent}0D` }}
    >
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4" style={{ color: config.accent }} strokeWidth={1.5} />
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: config.accent }}>
          {config.title}
        </span>
        <span className="ml-auto text-[11px] text-[#737373] font-mono truncate max-w-[45%]" title={target.label}>
          {target.label}
        </span>
      </div>

      <div className="space-y-2.5">
        {config.fields.map((field) => (
          <div key={field.name} className="space-y-1">
            <label className="text-[11px] text-[#737373]">
              {field.label}
              {field.required && <span className="text-[#DC2626]"> *</span>}
            </label>
            {field.multiline ? (
              <Textarea
                value={values[field.name] || ""}
                onChange={(e) => setValues((p) => ({ ...p, [field.name]: e.target.value }))}
                placeholder={field.placeholder}
                className="min-h-16 max-h-40 resize-none text-sm"
                rows={2}
              />
            ) : (
              <input
                value={values[field.name] || ""}
                onChange={(e) => setValues((p) => ({ ...p, [field.name]: e.target.value }))}
                placeholder={field.placeholder}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submit();
                  }
                }}
                className="w-full bg-[#0A0A0A] border border-[#262626] px-3 py-2 text-sm outline-none focus:border-[#404040] transition-colors"
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={submit}
          disabled={!requiredFilled}
          className="text-xs text-[#0A0A0A] disabled:opacity-40"
          style={{ backgroundColor: config.accent }}
        >
          <Send className="w-3.5 h-3.5" />
          Continue
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel} className="text-xs text-[#737373]">
          Cancel
        </Button>
        <span className="text-[10px] text-[#737373] ml-auto">You&apos;ll confirm before it&apos;s sent</span>
      </div>
    </motion.div>
  );
}

export function ChatInterface() {
  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });
  const { chats, activeId, activeChat, hydrated, newChat, setActive, saveMessages, deleteChat } =
    useChatHistory();
  // Guards which chat's messages are currently loaded into useChat, so we don't
  // save one chat's messages over another during a switch.
  const loadedChatId = useRef<string | null>(null);
  // Set true right after we call setMessages() for a newly-activated chat, so
  // the persist effect ignores that transitional render (which may still carry
  // the previous chat's messages) and only saves genuine user edits.
  const justLoaded = useRef(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [approvalStates, setApprovalStates] = useState<Record<string, ApprovalState>>({});
  const [toasts, setToasts] = useState<Toast[]>([]);
  // The compose form currently open (repo/channel chosen, collecting free text). Only one at a time.
  const [composeTarget, setComposeTarget] = useState<ComposeTarget | null>(null);

  const isLoading = status === "submitted" || status === "streaming";

  const addToast = useCallback((message: string, type: Toast["type"]) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

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
      addToast("Action executed successfully", "success");
    } catch (err) {
      setApprovalStates((prev) => ({
        ...prev,
        [actionId]: {
          status: "error",
          error: err instanceof Error ? err.message : "Unknown error",
        },
      }));
      addToast(err instanceof Error ? err.message : "Action failed", "error");
    }
  }, [addToast]);

  const handleDeny = useCallback(async (actionId: string) => {
    setApprovalStates((prev) => ({
      ...prev,
      [actionId]: { status: "denied" },
    }));
    addToast("Action denied", "info");

    try {
      await fetch("/api/step-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionId, decision: "deny" }),
      });
    } catch {
      // Denial is best-effort on server
    }
  }, [addToast]);

  const sendQuickMessage = useCallback((text: string) => {
    sendMessage({ text });
  }, [sendMessage]);

  // A picker item was clicked. Read-only flows send a command immediately;
  // "compose" flows open an inline form to collect the message/issue text.
  const startCompose = useCallback((target: ComposeTarget) => {
    setComposeTarget(target);
  }, []);

  const submitCompose = useCallback((command: string) => {
    setComposeTarget(null);
    sendMessage({ text: command });
  }, [sendMessage]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0) setShowSuggestions(false);
  }, [messages.length]);

  // ── Chat history sync ──
  // Make sure there's always an active conversation once history has hydrated.
  useEffect(() => {
    if (activeId === null && chats.length === 0) {
      newChat();
    }
  }, [activeId, chats.length, newChat]);

  // When the active conversation changes, load its messages into useChat.
  useEffect(() => {
    if (!activeId) return;
    if (loadedChatId.current === activeId) return;
    loadedChatId.current = activeId;
    justLoaded.current = true; // ignore the resulting messages render in persist
    setMessages(activeChat?.messages ?? []);
    setComposeTarget(null);
    setShowSuggestions((activeChat?.messages?.length ?? 0) === 0);
  }, [activeId, activeChat, setMessages]);

  // Persist messages to the active conversation as they change (once loaded).
  useEffect(() => {
    if (!activeId || loadedChatId.current !== activeId) return;
    // Skip the transitional render right after a chat switch/new-chat: the
    // messages there belong to the just-loaded chat, not a user edit.
    if (justLoaded.current) {
      justLoaded.current = false;
      return;
    }
    if (messages.length === 0) return;
    saveMessages(activeId, messages);
  }, [messages, activeId, saveMessages]);

  const handleNewChat = useCallback(() => {
    // Don't switch away while a response is streaming — the in-flight stream is
    // bound to the single useChat instance and would land in the wrong chat.
    if (isLoading) return;
    loadedChatId.current = null;
    newChat();
  }, [newChat, isLoading]);

  const handleSelectChat = useCallback(
    (id: string) => {
      if (id === activeId) return;
      if (isLoading) return; // block switching mid-stream (see handleNewChat)
      loadedChatId.current = null;
      setActive(id);
    },
    [activeId, setActive, isLoading]
  );

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
    <div className="flex h-full bg-[#0A0A0A]">
      {/* History sidebar */}
      <ChatHistorySidebar
        chats={hydrated ? chats : []}
        activeId={activeId}
        disabled={isLoading}
        onSelect={handleSelectChat}
        onNew={handleNewChat}
        onDelete={deleteChat}
      />

      {/* Chat column */}
      <div className="flex flex-col h-full flex-1 min-w-0 bg-[#0A0A0A]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#262626] flex items-center gap-3">
        <div className="w-8 h-8 bg-[#0A0A0A] flex items-center justify-center">
          <ClavisLogo className="w-7 h-7 text-[#FF3D00]" />
        </div>
        <div>
          <h1 className="font-semibold text-sm tracking-tight">Clavis AI Agent</h1>
          <p className="text-xs text-[#737373]">
            Connected to Google, GitHub, Slack &amp; Discord via Token Vault
          </p>
        </div>
        <Badge variant="outline" className="ml-auto text-xs">
          <Shield className="w-3 h-3 mr-1" strokeWidth={1.5} />
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
              className="text-center py-6"
            >
              <div className="w-16 h-16 bg-[#0A0A0A] flex items-center justify-center mx-auto mb-4">
                <ClavisLogo className="w-14 h-14 text-[#FF3D00]" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight mb-3">
                What can I help you with?
              </h2>
              <p className="text-sm text-[#737373] max-w-md mx-auto mb-8">
                I can access your Gmail, Google Calendar, GitHub repos, Slack
                channels, and Discord servers. Every action is scoped and
                audited.
              </p>

              {/* Suggested prompts */}
              <AnimatePresence>
                {showSuggestions && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto"
                  >
                    {suggestedPrompts.map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setInput(prompt);
                          textareaRef.current?.focus();
                        }}
                        className="text-left text-xs p-4 border border-[#262626] hover:border-[#404040] transition-colors duration-150 text-[#737373] hover:text-[#FAFAFA]"
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
                className={`w-8 h-8 flex items-center justify-center shrink-0 ${
                  message.role === "user"
                    ? "border border-[#262626]"
                    : "bg-[#0A0A0A]"
                }`}
              >
                {message.role === "user" ? (
                  <User className="w-4 h-4 text-[#737373]" strokeWidth={1.5} />
                ) : (
                  <ClavisLogo className="w-7 h-7 text-[#FF3D00]" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 space-y-2">
                <div className="text-xs font-medium text-[#737373] uppercase tracking-wider">
                  {message.role === "user" ? "You" : "Clavis"}
                </div>

                {/* Message parts */}
                {message.parts?.map((part, i) => {
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

                    const output = partAny.output as Record<string, unknown> | undefined;
                    if (
                      isComplete &&
                      output?.requiresApproval === true &&
                      output?.pendingActionId
                    ) {
                      const actionId = String(output.pendingActionId);
                      const outputRiskLevel = output.riskLevel === "high" ? "high" : "medium";
                      return (
                        <StepUpApprovalCard
                          key={i}
                          pendingActionId={actionId}
                          action={String(output.action || toolName)}
                          description={String(output.description || "")}
                          details={(output.details as Record<string, unknown>) || {}}
                          riskLevel={outputRiskLevel}
                          approvalState={approvalStates[actionId]}
                          onApprove={handleApprove}
                          onDeny={handleDeny}
                        />
                      );
                    }

                    if (toolName === "listDiscordGuilds" && output?.guilds && Array.isArray(output.guilds)) {
                      const guilds = output.guilds as Array<{ id: string; name: string; icon?: string | null; isOwner?: boolean }>;
                      return (
                        <div key={i} className="space-y-2">
                          <div className="flex items-center gap-2 px-3 py-2 border border-[#262626] bg-[#0F0F0F] text-xs">
                            <Server className="w-3.5 h-3.5 text-[#6366F1]" strokeWidth={1.5} />
                            <span className="text-[#737373]">Discord Servers:</span>
                            <span className="ml-auto">
                              {isComplete ? <CheckCircle className="w-3 h-3 text-[#22C55E]" /> : <Loader2 className="w-3 h-3 animate-spin text-[#FF3D00]" />}
                            </span>
                          </div>
                          <div className="grid gap-2">
                            {guilds.map((guild) => (
                              <button
                                key={guild.id}
                                onClick={() => sendQuickMessage(`list channels in ${guild.name}`)}
                                className="flex items-center gap-3 p-3 border border-[#262626] bg-[#0F0F0F] hover:border-[#6366F1]/30 transition-colors duration-150 text-left group"
                              >
                                <Server className="w-4 h-4 text-[#6366F1] shrink-0" strokeWidth={1.5} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{guild.name}</p>
                                  <p className="text-xs text-[#737373] font-mono">ID: {guild.id}</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-[#737373] group-hover:text-[#6366F1] transition-colors duration-150" />
                              </button>
                            ))}
                          </div>
                          <p className="text-[10px] text-[#737373] text-center">Click a server to list its channels</p>
                        </div>
                      );
                    }

                    if (toolName === "listDiscordChannels" && output?.channels && Array.isArray(output.channels)) {
                      const channels = output.channels as Array<{ id: string; name: string }>;
                      return (
                        <div key={i} className="space-y-2">
                          <div className="flex items-center gap-2 px-3 py-2 border border-[#262626] bg-[#0F0F0F] text-xs">
                            <Hash className="w-3.5 h-3.5 text-[#6366F1]" strokeWidth={1.5} />
                            <span className="text-[#737373]">Discord Channels:</span>
                            <span className="ml-auto">
                              {isComplete ? <CheckCircle className="w-3 h-3 text-[#22C55E]" /> : <Loader2 className="w-3 h-3 animate-spin text-[#FF3D00]" />}
                            </span>
                          </div>
                          <div className="grid gap-2">
                            {channels.map((channel) => (
                              <button
                                key={channel.id}
                                onClick={() => startCompose({ flow: "send-discord", label: `#${channel.name}`, ref: channel.id })}
                                disabled={isLoading}
                                className="flex items-center gap-3 p-3 border border-[#262626] bg-[#0F0F0F] hover:border-[#6366F1]/30 transition-colors duration-150 text-left group disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                <Hash className="w-4 h-4 text-[#6366F1] shrink-0" strokeWidth={1.5} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium">#{channel.name}</p>
                                  <p className="text-xs text-[#737373] font-mono">ID: {channel.id}</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-[#737373] group-hover:text-[#6366F1] transition-colors duration-150" />
                              </button>
                            ))}
                          </div>
                          <p className="text-[10px] text-[#737373] text-center">Click a channel to compose a message</p>
                        </div>
                      );
                    }

                    if (toolName === "listGitHubRepos" && output?.repos && Array.isArray(output.repos)) {
                      const repos = output.repos as Array<{ id: number; name: string; full_name: string; html_url: string; description?: string | null; private?: boolean; fork?: boolean }>;
                      return (
                        <div key={i} className="space-y-2">
                          <div className="flex items-center gap-2 px-3 py-2 border border-[#262626] bg-[#0F0F0F] text-xs">
                            <GitBranch className="w-3.5 h-3.5 text-[#FAFAFA]" strokeWidth={1.5} />
                            <span className="text-[#737373]">GitHub Repositories:</span>
                            <span className="ml-auto">
                              {isComplete ? <CheckCircle className="w-3 h-3 text-[#22C55E]" /> : <Loader2 className="w-3 h-3 animate-spin text-[#FF3D00]" />}
                            </span>
                          </div>
                          <div className="grid gap-2">
                            {repos.map((repo) => (
                              <div
                                key={repo.id}
                                className="flex items-center gap-3 p-3 border border-[#262626] bg-[#0F0F0F] hover:border-[#404040] transition-colors duration-150 group"
                              >
                                <GitBranch className="w-4 h-4 text-[#FAFAFA] shrink-0" strokeWidth={1.5} />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium truncate">{repo.name}</p>
                                    {repo.private && <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-[#EAB308] border-[#EAB308]/30">Private</Badge>}
                                    {repo.fork && <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-[#3B82F6] border-[#3B82F6]/30">Forked</Badge>}
                                  </div>
                                  {repo.description && <p className="text-xs text-[#737373] truncate mt-0.5">{repo.description}</p>}
                                  <p className="text-xs text-[#737373]/60 font-mono mt-0.5">{repo.full_name}</p>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => sendQuickMessage(`show issues in ${repo.full_name}`)}
                                    disabled={isLoading}
                                    className="px-2 py-1 text-[11px] border border-[#262626] hover:border-[#404040] hover:bg-[#1A1A1A] transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                    title="View issues in this repo"
                                  >
                                    View Issues
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => startCompose({ flow: "create-issue", label: repo.full_name, ref: repo.full_name })}
                                    disabled={isLoading}
                                    className="px-2 py-1 text-[11px] border border-[#F97316]/40 text-[#F97316] hover:bg-[#F97316]/10 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                    title="Create an issue in this repo"
                                  >
                                    New Issue
                                  </button>
                                  <a
                                    href={repo.html_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 hover:bg-[#1A1A1A] transition-colors duration-150 cursor-pointer"
                                    title="Open in GitHub"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5 text-[#737373] group-hover:text-[#FAFAFA]" strokeWidth={1.5} />
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                          <p className="text-[10px] text-[#737373] text-center">Pick a repo: <span className="text-[#FAFAFA]">View Issues</span>, create a <span className="text-[#F97316]">New Issue</span>, or open it on GitHub</p>
                        </div>
                      );
                    }

                    if (toolName === "listSlackChannels" && output?.channels && Array.isArray(output.channels)) {
                      const channels = output.channels as Array<{ id: string; name: string; purpose?: string; isPrivate?: boolean }>;
                      return (
                        <div key={i} className="space-y-2">
                          <div className="flex items-center gap-2 px-3 py-2 border border-[#262626] bg-[#0F0F0F] text-xs">
                            <Hash className="w-3.5 h-3.5 text-[#A855F7]" strokeWidth={1.5} />
                            <span className="text-[#737373]">Slack Channels:</span>
                            <span className="ml-auto">
                              {isComplete ? <CheckCircle className="w-3 h-3 text-[#22C55E]" /> : <Loader2 className="w-3 h-3 animate-spin text-[#FF3D00]" />}
                            </span>
                          </div>
                          <div className="grid gap-2">
                            {channels.map((channel) => (
                              <button
                                key={channel.id}
                                onClick={() => startCompose({ flow: "send-slack", label: `#${channel.name}`, ref: channel.name })}
                                disabled={isLoading}
                                className="flex items-center gap-3 p-3 border border-[#262626] bg-[#0F0F0F] hover:border-[#A855F7]/30 transition-colors duration-150 text-left group disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                <Hash className="w-4 h-4 text-[#A855F7] shrink-0" strokeWidth={1.5} />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium">#{channel.name}</p>
                                    {channel.isPrivate && <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-[#EAB308] border-[#EAB308]/30">Private</Badge>}
                                  </div>
                                  {channel.purpose && <p className="text-xs text-[#737373] truncate mt-0.5">{channel.purpose}</p>}
                                </div>
                                <ChevronRight className="w-4 h-4 text-[#737373] group-hover:text-[#A855F7] transition-colors duration-150" />
                              </button>
                            ))}
                          </div>
                          <p className="text-[10px] text-[#737373] text-center">Click a channel to compose a message</p>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={i}
                        className="flex items-center gap-2 px-3 py-2 border border-[#262626] bg-[#0F0F0F] text-xs"
                      >
                        <Icon
                          className={`w-3.5 h-3.5 ${toolInfo?.color || "text-[#737373]"}`}
                          strokeWidth={1.5}
                        />
                        <span className="text-[#737373]">
                          {toolInfo?.service || "Tool"}:
                        </span>
                        <span className="font-medium">
                          {toolName}
                        </span>
                        {WRITE_TOOLS.has(toolName) && (
                          <Badge variant="outline" className="text-[10px] text-[#EAB308] border-[#EAB308]/30 ml-1">
                            write · risk engine
                          </Badge>
                        )}
                        <span className="ml-auto">
                          {isError ? (
                            <XCircle className="w-3 h-3 text-[#DC2626]" />
                          ) : isComplete ? (
                            <CheckCircle className="w-3 h-3 text-[#22C55E]" />
                          ) : (
                            <Loader2 className="w-3 h-3 animate-spin text-[#FF3D00]" />
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
                        className="text-sm leading-relaxed prose prose-invert max-w-none prose-sm prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-table:my-2 prose-th:px-3 prose-th:py-1.5 prose-td:px-3 prose-td:py-1.5 prose-th:text-left prose-a:text-[#FF3D00] prose-a:no-underline hover:prose-a:underline"
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
                  <div className="text-sm leading-relaxed text-[#737373]">
                    (No content)
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {/* Loading indicator */}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 border border-[#DC2626]/30 bg-[#DC2626]/10 text-xs text-[#DC2626]">
              <XCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error.message || "Something went wrong"}</span>
            </div>
          )}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-xs text-[#737373]"
            >
              <Loader2 className="w-3 h-3 animate-spin" />
              Clavis is thinking...
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* Active compose form (guided flow) */}
      {composeTarget && (
        <div className="px-4 pt-3 border-t border-[#262626]">
          <div className="max-w-3xl mx-auto">
            <InlineActionForm
              target={composeTarget}
              onSubmit={submitCompose}
              onCancel={() => setComposeTarget(null)}
            />
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-[#262626]">
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
              placeholder="Ask Clavis anything... (e.g., 'Check my unread emails')"
              className="min-h-12 max-h-30 resize-none pr-12 text-sm"
              rows={1}
            />
          </div>
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim()}
            className="shrink-0 h-12 w-12"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
        <p className="text-[10px] text-[#737373] text-center mt-3 uppercase tracking-wider">
          All actions are authenticated via Auth0 Token Vault and logged in the
          audit trail
        </p>
      </div>
      </div>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
