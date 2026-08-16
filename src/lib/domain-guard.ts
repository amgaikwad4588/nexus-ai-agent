import { generateText } from "ai";
import { google } from "@ai-sdk/google";

/**
 * Domain guard — keeps Clavis scoped to its actual capabilities
 * (Gmail, Google Calendar, GitHub, Slack, Discord) so users can't use it as a
 * free general-purpose chatbot and burn Gemini tokens.
 *
 * Strategy (cheapest-first):
 *   1. Keyword ALLOW  → in-domain, no LLM call.
 *   2. Keyword BLOCK  → clearly off-domain, no LLM call.
 *   3. Ambiguous      → a tiny, capped classifier call (~1 token out).
 *
 * Only the latest user message is evaluated. Short follow-ups (e.g. "the first
 * one", "yes", "do it") are allowed through as continuations of an existing
 * in-domain thread.
 */

// Words/phrases that clearly map to a supported capability.
const DOMAIN_KEYWORDS: string[] = [
  // Google / Gmail
  "email", "emails", "gmail", "inbox", "unread", "mail", "message from",
  // Calendar
  "calendar", "schedule", "meeting", "event", "availability", "free time",
  "appointment", "tomorrow", "today", "this week", "next week",
  // GitHub
  "github", "repo", "repository", "repositories", "issue", "issues",
  "pull request", "pr", "commit", "branch", "delete repo",
  // Slack
  "slack", "channel", "channels", "workspace", "dm",
  // Discord
  "discord", "server", "servers", "guild", "guilds", "member",
  // Cross-cutting actions Clavis supports
  "send", "send message", "post", "create issue", "raise issue",
  "list", "show", "check", "read", "history", "profile", "connect", "disconnect",
];

// Patterns that are clearly OUTSIDE Clavis's domain (general chatbot usage).
const OFF_DOMAIN_PATTERNS: RegExp[] = [
  /\b(write|compose|generate)\b.*\b(poem|story|essay|song|joke|rap|lyrics|code|program|function|script)\b/i,
  /\b(explain|what is|what's|define|meaning of|how does|why does|tell me about)\b/i,
  /\b(translate|summari[sz]e this|rewrite|paraphrase)\b/i,
  /\b(solve|calculate|compute|math|equation|integral|derivative)\b/i,
  /\b(recipe|weather|news|stock|crypto|bitcoin|movie|joke|riddle|trivia)\b/i,
  /\b(who (is|was|were)|when (is|was|did)|where (is|are)|capital of|population of)\b/i,
  /\b(python|javascript|react|sql|leetcode|homework|assignment)\b/i,
];

// Very short replies that are almost always continuations of an existing flow.
const CONTINUATION_RE =
  /^(yes|no|yep|nope|ok|okay|sure|do it|go ahead|the (first|second|third|last) one|that one|it|this one|confirm|approve|deny|cancel|\d+)\.?$/i;

export interface GuardResult {
  allowed: boolean;
  reason: "keyword-allow" | "keyword-block" | "continuation" | "classifier-allow" | "classifier-block";
}

const REFUSAL_MESSAGE =
  "I'm Clavis — I can only help with your connected services: **Gmail**, **Google Calendar**, **GitHub**, **Slack**, and **Discord**. " +
  "Try something like \"show my unread emails\", \"list my GitHub repos\", or \"send a Slack message\".";

export function getRefusalMessage(): string {
  return REFUSAL_MESSAGE;
}

function keywordVerdict(text: string): "allow" | "block" | "unknown" {
  const lower = text.toLowerCase();

  if (CONTINUATION_RE.test(text.trim())) return "allow";

  const hasDomainKeyword = DOMAIN_KEYWORDS.some((kw) => lower.includes(kw));
  const hasOffDomainPattern = OFF_DOMAIN_PATTERNS.some((re) => re.test(text));

  // Explicit off-domain phrasing beats a stray keyword ("write me a poem about email").
  if (hasOffDomainPattern && !hasDomainKeyword) return "block";
  if (hasDomainKeyword) return "allow";
  return "unknown";
}

/**
 * Decide whether the latest user message is in Clavis's domain.
 * Runs keyword checks first (free); only calls the tiny classifier when unsure.
 */
export async function checkDomain(latestUserText: string): Promise<GuardResult> {
  const text = (latestUserText || "").trim();

  // Empty / trivial → let it through (the main model will handle gracefully).
  if (text.length === 0) return { allowed: true, reason: "continuation" };

  const kw = keywordVerdict(text);
  if (kw === "allow") return { allowed: true, reason: "keyword-allow" };
  if (kw === "block") return { allowed: false, reason: "keyword-block" };

  // Ambiguous → tiny classifier. Capped to 1 output token to stay cheap.
  try {
    const { text: verdict } = await generateText({
      model: google("gemini-3.1-flash-lite-preview"),
      maxOutputTokens: 1,
      temperature: 0,
      system:
        "You are a strict topic classifier for an assistant that ONLY manages Gmail, " +
        "Google Calendar, GitHub, Slack, and Discord. Answer with a single character: " +
        "'Y' if the user's message is a request to do something with one of those services, " +
        "otherwise 'N'. Never answer the message itself.",
      prompt: text,
    });

    const isYes = verdict.trim().toUpperCase().startsWith("Y");
    return isYes
      ? { allowed: true, reason: "classifier-allow" }
      : { allowed: false, reason: "classifier-block" };
  } catch {
    // If the classifier fails, fail OPEN (allow) so we don't block real users on an outage.
    return { allowed: true, reason: "classifier-allow" };
  }
}
