<div align="center">

<img src="https://raw.githubusercontent.com/amgaikwad4588/nexus-ai-agent/main/public/logo.png" alt="Nexus Logo" width="120" height="120" />

# Nexus

### **Your AI Agent. Securely Connected. Always In Control.**

*The only AI command center that bridges Gmail, GitHub, Slack & Discord — without ever touching your passwords.*

[![Built for Auth0 Hackathon 2026](https://img.shields.io/badge/Auth0%20Hackathon-2026-blue?style=for-the-badge&logo=auth0)](https://authorizedtoact.devpost.com/)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/)
[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge)](./LICENSE)

[Live Demo](#) · [Watch the Video](#) · [Devpost](https://authorizedtoact.devpost.com/) · [GitHub](https://github.com/amgaikwad4588/nexus-ai-agent)

</div>

---

## What I Built

> *"Summarize my unread emails and post a digest to #general on Slack."*

One sentence. Four services. Zero passwords exposed.

**Nexus** is an AI-powered command center that lets you control Google, GitHub, Slack, and Discord through plain English — while [Auth0 Token Vault](https://auth0.com/docs/secure/tokens/token-vault) handles every credential with zero raw token exposure. Every action passes through a **centralized risk engine** that decides in real time: auto-execute, require step-up approval, demand re-authentication, or block entirely.

Built for the [**Authorized to Act: Auth0 for AI Agents Hackathon 2026**](https://authorizedtoact.devpost.com/).

---

## The Problem With AI Agents Today

AI agents are powerful — but most implementations are a security nightmare:

| Problem | Reality |
|---|---|
| Raw API tokens in `.env` files | One breach = everything exposed |
| No audit trail | You have no idea what the agent did |
| All-or-nothing permissions | Write access = same as read access |
| No user control over write ops | Agent acts first, tells you later |

Developers patch this with duct tape. Users just hope for the best.

---

## My Solution: Risk-First, Token-Vault-Backed AI

Nexus is built on three security pillars:

### 1. Auth0 Token Vault — Credentials Never Leave the Vault
The AI agent **never sees or stores raw OAuth tokens.** Auth0 Token Vault exchanges your stored refresh tokens for short-lived, scoped access tokens on demand. The app is blind to your credentials by design.

### 2. Centralized Risk Engine — Every Action Evaluated Before Execution
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

## 12 Verified Tools Across 4 Services

All 12 tools are **verified working end-to-end**, including the full Token Vault + step-up auth flow.

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

### Slack — Bot Token + Step-Up
| # | Tool | Action | Risk |
|---|------|--------|------|
| 7 | `listSlackChannels` | Browse accessible channels | Low |
| 8 | `getSlackChannelHistory` | Read recent messages | Low |
| 9 | `sendSlackMessage` | Post a message *(write)* | Medium → Step-Up |

### Discord — Token Vault
| # | Tool | Action | Risk |
|---|------|--------|------|
| 10 | `getDiscordProfile` | Get your Discord profile | Low |
| 11 | `listDiscordGuilds` | List your servers | Low |
| 12 | `getDiscordGuildMember` | Check membership & roles | Low |

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

### Risk-Aware Approval Cards
The chat UI renders visually distinct cards based on risk level — **yellow** for medium-risk step-up, **red** for high-risk re-authentication. The buttons trigger different flows accordingly.

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
└── components/
    ├── landing/                      # Landing page
    ├── dashboard/                    # Dashboard UI + risk-aware cards
    └── ui/                           # shadcn/ui components
```

---

## Lessons Learned: The Auth0 Pain Point

The single most confusing part of this build: **Auth0 "Login with Google" vs. Auth0 Connected Accounts are completely different things.**

Standard social login gives your *app* a token scoped to Auth0. Token Vault requires Connected Accounts — a separate flow that stores the *user's* OAuth tokens in the Vault. If you configure the wrong one, Token Vault silently fails with no useful error message. I lost hours to this.

**The fix:** Connected Accounts must be explicitly enabled per social connection in the Auth0 Dashboard, *and* Token Vault must be toggled on separately. They're independent settings. The docs don't make this clear.

This is exactly the kind of developer experience gap that Token Vault needs to address before wider adoption.

---

## What's Next

- **DPoP / Sender-Constrained Tokens** — Planned enhancement, skipped pre-launch to avoid destabilizing the Token Vault end-to-end flow
- **Per-Tool Permission Toggles** — Let users selectively enable/disable individual tools, not just entire services
- **High-Risk Tool Expansion** — Add delete operations with full REAUTH flow
- **Multi-Tenant Support** — Bring Nexus to teams, not just individual users

---

## License

Copyright (c) 2026 Aditya Gaikwad. All rights reserved.

This source code is the proprietary property of the author. No part of this code may be used, copied, modified, or distributed without explicit written permission from the author.

---

<div align="center">

Built with obsession, coffee, and [Auth0 Token Vault](https://auth0.com/docs/secure/tokens/token-vault).

**[Star this repo](https://github.com/amgaikwad4588/nexus-ai-agent)** if Nexus made you feel safer about AI agents.

</div>
