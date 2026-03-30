"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  CheckCircle,
  XCircle,
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

export function ChatInterface() {
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const isLoading = status === "submitted" || status === "streaming";

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
                    const partAny = part as { state?: string; output?: { error?: string } };
                    const isComplete = partAny.state === "output-available";
                    const isError = partAny.state === "error";
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
                        className="text-sm leading-relaxed prose prose-invert max-w-none prose-sm prose-p:my-1 prose-ul:my-1 prose-li:my-0.5"
                        dangerouslySetInnerHTML={{
                          __html: formatMarkdown(textContent),
                        }}
                      />
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

// Simple markdown formatter
function formatMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, '<code class="bg-accent/50 px-1 py-0.5 rounded text-xs">$1</code>')
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-3 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold mt-3 mb-1">$1</h2>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$2</li>')
    .replace(/\n/g, "<br/>");
}
