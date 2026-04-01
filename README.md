<!-- <div align="center">

<img src="https://raw.githubusercontent.com/amgaikwad4588/nexus-ai-agent/main/public/logo.png" alt="Nexus Logo" width="120" height="120" /> -->

# Nexus

### **Your AI Agent. Securely Connected. Always In Control.**

*The only AI command center that bridges Gmail, GitHub, Slack & Discord — without ever touching your passwords.*

[![Built for Auth0 Hackathon 2026](https://img.shields.io/badge/Auth0%20Hackathon-2026-blue?style=for-the-badge&logo=auth0)](https://authorizedtoact.devpost.com/)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/)
[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge)](./LICENSE)

[Live Demo](https://nexus-ai-alpha-seven.vercel.app/) · [Watch the Video](#) · [Devpost](https://authorizedtoact.devpost.com/) · [GitHub](https://github.com/amgaikwad4588/nexus-ai-agent)

</div>

---

## What I Built

> *"Summarize my unread emails and post a digest to #general on Slack."*

One sentence. Four services. Zero passwords exposed.

**Nexus** is an AI-powered command center that lets you control Google, GitHub, Slack, and Discord through plain English — while [Auth0 Token Vault](https://auth0.com/docs/secure/tokens/token-vault) handles every credential with zero raw token exposure. Every action passes through a **centralized risk engine** that decides in real time: auto-execute, require step-up approval, demand re-authentication, or block entirely.

Built for the [**Authorized to Act: Auth0 for AI Agents Hackathon 2026**](https://authorizedtoact.devpost.com/).

---

## The Problem

> *What happens when your AI agent sends a Slack message you didn't approve, or deletes a repo without asking?*

AI agents are powerful — but most implementations are a security nightmare:

| Problem | Reality |
|---|---|
| Raw API tokens in `.env` files | One breach = everything exposed |
| No audit trail | You have no idea what the agent did |
| All-or-nothing permissions | Write access = same as read access |
| No user control over write ops | Agent acts first, tells you later |

The moment you give an AI access to your GitHub, Slack, or Gmail, you need guardrails. Nexus is the security layer between the AI and your services.

---

## My Solution: Risk-First, Token-Vault-Backed AI

Nexus is built on three security pillars:

### 1. Auth0 Token Vault — Credentials Never Leave the Vault
The AI agent **never sees or stores raw OAuth tokens.** Auth0 Token Vault exchanges your stored refresh tokens for short-lived, scoped access tokens on demand. The app is blind to your credentials by design.

### 2. Centralized Risk Engine — Every Action Evaluated Before Execution
All decisions are enforced server-side before token exchange
Every single tool call passes through `riskEngine()` before anything executes:

```
LOW risk    → Auto-execute immediately
MEDIUM risk → Yellow approval card in chat (step-up auth)
HIGH risk   → Red re-authentication card required
UNKNOWN     → Blocked by default (fail-closed)
```

This isn't a checkbox — it's a decision layer baked into every API call.

### 3. Persistent Audit Trail — Full Visibility, Always
Every action is logged to a persistent JSON store with `userId`, scopes used, risk classification, decision outcome, and timestamp. It survives server restarts. You can view raw JSON directly in the dashboard.

---

## Who Is This For?

Developers and teams who let AI agents act on their behalf. The moment you give an AI access to your GitHub, Slack, or Gmail, you need:
- **Visibility** — what did the agent do, and when?
- **Control** — can you approve or deny before it acts?
- **Guardrails** — does it fail safely when something goes wrong?

Nexus isn't a replacement for Slack or GitHub. It's the security layer that sits between your AI and your services — so the agent never acts without your knowledge.

---

## How It Works

```
You
 │
 ▼
Nexus AI (Gemini via Vercel AI SDK)
 │
 ▼
withRiskEngine() ──► Risk Engine evaluates tool call
 │                      LOW  → EXECUTE
 │                      MED  → STEP_UP (yellow card)
 │                      HIGH → REAUTH  (red card)
 │                      ???  → BLOCK
 ▼
Auth0 Token Vault ──► Short-lived scoped token
 │
 ├──► Google API (Gmail, Calendar)
 ├──► GitHub API (Repos, Issues — read & write)
 ├──► Discord API (Profile, Guilds, Members)
 └──► Slack Bot Token (Channels, Messages)
 │
 ▼
Audit Trail logged (persistent JSON, userId-tagged)
```

**Write operations (Medium/High risk)** queue a pending action and surface an approval card in chat. The user clicks **Authorize & Execute** — only then does the token exchange happen and the action fire. Deny it, and nothing ever runs.

---

## 13 Verified Tools Across 4 Services

All 13 tools are **verified working end-to-end**, including the full Token Vault + step-up auth flow.

### Google — Token Vault
| # | Tool | Action | Risk |
|---|------|--------|------|
| 1 | `searchGmail` | Search your inbox by query | Low |
| 2 | `checkCalendar` | Check events & availability | Low |

### GitHub — Token Vault
| # | Tool | Action | Risk |
|---|------|--------|------|
| 3 | `getGitHubProfile` | Get authenticated user's profile | Low |
| 4 | `listGitHubRepos` | List repos with sort/filter | Low |
| 5 | `getGitHubIssues` | View issues on a repo | Low |
| 6 | `createGitHubIssue` | Create a new issue *(write)* | Medium → Step-Up |
| 7 | `deleteGitHubRepo` | Delete a repository *(destructive, simulated)* | High → Re-Auth |

### Slack — Bot Token + Step-Up
| # | Tool | Action | Risk |
|---|------|--------|------|
| 8 | `listSlackChannels` | Browse accessible channels | Low |
| 9 | `getSlackChannelHistory` | Read recent messages | Low |
| 10 | `sendSlackMessage` | Post a message *(write)* | Medium → Step-Up |

### Discord — Token Vault
| # | Tool | Action | Risk |
|---|------|--------|------|
| 11 | `getDiscordProfile` | Get your Discord profile | Low |
| 12 | `listDiscordGuilds` | List your servers | Low |
| 13 | `getDiscordGuildMember` | Check membership & roles | Low |

> **Why bot token for Slack?** Slack's OAuth doesn't issue refresh tokens, making Token Vault technically impossible. I use a workspace bot token instead — an intentional, documented architectural decision, not a shortcut.

---

## Security Model Deep Dive

| Principle | Implementation |
|-----------|----------------|
| **No raw credentials** | Token Vault stores and exchanges all OAuth tokens — app never touches them |
| **Least privilege** | Each tool requests only the scopes it needs, nothing more |
| **Short-lived tokens** | Refresh tokens → temporary access tokens per request |
| **Risk classification** | Every tool tagged: `low / medium / high / unknown` |
| **Fail-closed** | Unknown tools are blocked by default, not allowed |
| **Step-up auth** | Write ops queue pending actions, wait for explicit user approval |
| **Re-auth for high-risk** | Destructive operations require a fresh authentication session |
| **Full audit trail** | Every decision logged: tool name, risk level, decision, userId, timestamp |
| **Smart input validation** | `createGitHubIssue` validates repo existence before even queuing the approval |

---

## Key Technical Highlights

### Smart Repo Validation
`createGitHubIssue` validates the repository exists **before** showing the approval card. If you pass `nexus-ai-agent` instead of `amgaikwad4588/nexus-ai-agent`, it fetches your repos, finds matches, and suggests the correct format — no 404 at execution time.

### Persistent Audit Logging
Audit logs persist to `data/audit-log.json` (capped at 500 entries), survive server restarts, tag every entry with `userId`, and are viewable as formatted raw JSON directly in the dashboard.

### High-Risk Destructive Actions (Simulated)
`deleteGitHubRepo` demonstrates the full HIGH-risk flow — risk engine returns REAUTH, chat UI renders a **red re-authentication card**, user must re-authenticate before approval. The deletion is **simulated** (verifies repo exists but doesn't actually delete), making it safe to demo all three risk tiers:
- **LOW** (10 tools) — green auto-execute
- **MEDIUM** (2 tools) — yellow step-up approval card
- **HIGH** (1 tool) — red re-auth card

### Risk-Aware Approval Cards
The chat UI renders visually distinct cards based on risk level — **yellow** for medium-risk step-up, **red** for high-risk re-authentication. The buttons trigger different flows accordingly.

### Error Handling & Resilience
- **Crash-safe audit writes** — write to `.tmp` → backup `.bak` → rename to main; auto-recovers from backup on corruption
- **Token exchange failures** — every failure path (missing config, expired refresh token, Auth0 API errors) is audited with details
- **Tool execution timeouts** — 30-second deadline on every tool call and step-up execution; timeout → audit entry + graceful error response
- **Performance metrics** — every tool call timed (ms), step-up responses include `executionMs` and `approvalLatencyMs`

### Test Suite
22 tests via Vitest covering the core security layers:
- `risk-engine.test.ts` — 11 tests: all 4 decision paths (EXECUTE, STEP_UP, REAUTH, BLOCK), helper functions, fail-closed for unknown tools
- `audit.test.ts` — 11 tests: persistence, stats aggregation, crash recovery from backup, double-corruption fallback

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, TypeScript) |
| Auth | Auth0 NextJS SDK v4 |
| Token Vault | Auth0 AI SDK (`@auth0/ai`, `@auth0/ai-vercel`) |
| Risk Engine | Custom `riskEngine()` — centralized decision layer |
| AI Model | Google Gemini (via Vercel AI SDK v6) |
| UI | Tailwind CSS v4, shadcn/ui, Framer Motion |
| Audit Store | Persistent JSON file (`data/audit-log.json`) |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites
- Node.js 20+
- Free [Auth0 account](https://auth0.com/signup)
- Free [Google Gemini API key](https://aistudio.google.com/apikey)

### 1. Clone & Install
```bash
git clone https://github.com/amgaikwad4588/nexus-ai-agent.git
cd nexus-ai-agent
npm install
```

### 2. Set Up Auth0

**Create a Regular Web Application:**
1. [Auth0 Dashboard](https://manage.auth0.com) → Applications → Create Application → Regular Web Application
2. Note your `Domain`, `Client ID`, `Client Secret`
3. Set callback URLs:
   - Allowed Callback URLs: `http://localhost:3000/auth/callback`
   - Allowed Logout URLs: `http://localhost:3000`
   - Allowed Web Origins: `http://localhost:3000`
4. Advanced Settings → Grant Types → Enable **Token Vault**

**Create a Machine-to-Machine App** (for Management API):
1. Applications → Create Application → Machine to Machine
2. Authorize for Auth0 Management API
3. Note the M2M `Client ID` and `Client Secret`

**Configure Social Connections with Token Vault:**
- **Google**: Enable Gmail + Calendar scopes → Enable Connected Accounts + Token Vault
- **GitHub**: Enable `repo`, `read:user`, `read:org` → Enable Connected Accounts + Token Vault
- **Discord**: Enable `identify`, `guilds`, `guilds.members.read` → Enable Connected Accounts + Token Vault
- **Slack**: Create a Slack App at [api.slack.com](https://api.slack.com) with scopes `channels:read`, `chat:write`, `channels:history`, `users:read` → Copy the Bot Token (`xoxb-...`)

### 3. Configure Environment

```bash
cp .env.local.example .env.local
```

```env
# Auth0 — Regular Web Application
AUTH0_SECRET=<run: openssl rand -hex 32>
AUTH0_DOMAIN=your-tenant.us.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
APP_BASE_URL=http://localhost:3000

# Auth0 AI / Token Vault (M2M)
AUTH0_AI_DOMAIN=your-tenant.us.auth0.com
AUTH0_AI_CLIENT_ID=your_m2m_client_id
AUTH0_AI_CLIENT_SECRET=your_m2m_client_secret

# AI
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key

# Slack
SLACK_BOT_TOKEN=xoxb-your-bot-token

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), log in, connect your services, and start chatting.

### 5. Deploy

```bash
npx vercel deploy
```

Add all environment variables in Vercel project settings and update Auth0 callback URLs to include your production domain.

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                      # Landing page
│   ├── dashboard/
│   │   ├── chat/page.tsx             # AI chat interface
│   │   ├── connections/page.tsx      # Manage connected accounts
│   │   ├── permissions/page.tsx      # Scopes & risk levels
│   │   └── audit/page.tsx            # Real-time audit trail + raw JSON
│   └── api/
│       ├── chat/route.ts             # AI chat endpoint (withRiskEngine)
│       ├── connect/route.ts          # Connected Accounts flow
│       ├── step-up/route.ts          # Step-up approve/deny endpoint
│       ├── connections/route.ts      # Connection status API
│       └── audit/route.ts            # Audit log API
├── lib/
│   ├── risk-engine.ts                # Centralized risk decision layer
│   ├── auth0.ts                      # Auth0 client config
│   ├── auth0-ai.ts                   # Token Vault setup
│   ├── token-exchange.ts             # Manual token exchange (post-approval)
│   ├── step-up.ts                    # Pending action store + TTL
│   ├── audit.ts                      # Persistent JSON audit logging
│   └── tools/
│       ├── google.ts                 # Gmail + Calendar (Token Vault)
│       ├── github.ts                 # Repos, Issues, Profile (Token Vault)
│       ├── slack.ts                  # Channels, Messages (Bot Token)
│       └── discord.ts               # Profile, Guilds, Members (Token Vault)
├── __tests__/
│   ├── risk-engine.test.ts           # 11 tests — all 4 decision paths
│   └── audit.test.ts                 # 11 tests — persistence + crash recovery
└── components/
    ├── landing/                      # Landing page
    ├── dashboard/                    # Dashboard UI + risk-aware cards
    └── ui/                           # shadcn/ui components
```

---

## Lessons Learned: Real Pain Points

### 1. Account Linking vs. Connected Accounts
Auth0’s **Account Linking** and **Connected Accounts** sound similar but are fundamentally different.

- Account Linking → merges identities  
- Connected Accounts → required for Token Vault  

Using the wrong flow caused Token Vault to fail silently.

**Takeaway:** Token Vault only works with **Connected Accounts + explicit enablement**.

---

### 2. Slack OAuth Limitation
Slack OAuth does **not provide refresh tokens**, making Token Vault unusable.

**Solution:** Switched to **Bot Token (`xoxb-`)** approach.

**Insight:** Not all providers are compatible with Token Vault → leads to inconsistent auth patterns.

---

### 3. In-Memory Audit Logs
Audit logs were initially stored in memory:
- Lost on restart  
- No traceability  

**Fix:** Persistent JSON-based logging with:
- `userId`, tool, risk, decision, timestamp  

**Impact:** Improved **production readiness and accountability**.

---

### 4. DPoP Tradeoff
DPoP (sender-constrained tokens) improves security but requires:
- Tenant-level setup  
- Risk of breaking working flow  

**Decision:** Deferred for stability.

**Insight:** Tradeoff between **advanced security vs system reliability**.

---

### 5. Natural Language vs API Requirements
Users input:
> create issue on nexus-ai-agent

But GitHub requires:
> owner/repo

This caused failures after approval.

**Fix:** Added **repo validation + suggestion before execution**.

**Impact:** Better UX and fewer failed actions.

---

### Key Insight
Building secure AI agents is not just about calling APIs — it’s about handling **OAuth inconsistencies across providers, bridging the gap between natural language and API requirements, and making real-time security tradeoffs** without breaking the user experience.
## What's Next

- **DPoP / Sender-Constrained Tokens** — Planned enhancement, deferred to avoid destabilizing the Token Vault end-to-end flow pre-launch
- **Scoped Access Controls** — Let users selectively enable/disable individual tools per service
- **Multi-Tenant Support** — Bring Nexus to teams, not just individual users
- **Additional Services** — Jira, Notion, Linear — any OAuth provider with refresh tokens can plug into Token Vault

---

## License

Copyright (c) 2026 Aditya Gaikwad. All rights reserved.

This source code is the proprietary property of the author. No part of this code may be used, copied, modified, or distributed without explicit written permission from the author.

---

<div align="center">

Built with obsession, coffee, and [Auth0 Token Vault](https://auth0.com/docs/secure/tokens/token-vault).

**[Star this repo](https://github.com/amgaikwad4588/nexus-ai-agent)** if Nexus made you feel safer about AI agents.

</div>
