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

## The Problem With AI Agents Today

AI agents are powerful, but giving them access to your accounts is terrifying. Most solutions store raw API tokens in environment variables or databases — one breach and everything is exposed. Users have no visibility into what the agent is doing, no way to scope its permissions, and no audit trail.


## Our Solution

Nexus solves this by putting **Auth0 Token Vault** at the center of every interaction:

- The AI agent **never sees or stores raw credentials**. Token Vault exchanges scoped, short-lived access tokens on demand.
- Every action is **logged in a real-time audit trail** — you can see exactly what API was called, with what scopes, and when.
- High-risk operations like sending Slack messages or creating GitHub issues trigger **step-up authentication** — the agent literally asks your permission before acting.
- A **permissions dashboard** lets you visualize exactly what access each connected service has, categorized by risk level.

The result: an AI agent you can actually trust.

---

## What Nexus Can Do

Talk to Nexus like you'd talk to a colleague:

> *"Summarize my unread emails and post a digest to #general on Slack"*

> *"List my open GitHub issues and check if I have any meetings tomorrow"*

> *"Create a GitHub issue for the login bug and let the team know on Slack"*

> *"Show my Discord servers and check my roles"*

Under the hood, Nexus has **12 tools** across 4 services:

| Tool | Service | What It Does | Risk | Auth Method |
|------|---------|-------------|------|-------------|
| `searchGmail` | Google | Search your inbox | Low | Token Vault |
| `checkCalendar` | Google | Check events & availability | Low | Token Vault |
| `listGitHubRepos` | GitHub | List your repositories | Low | Token Vault |
| `getGitHubIssues` | GitHub | View issues on a repo | Low | Token Vault |
| `getGitHubProfile` | GitHub | Get your GitHub profile | Low | Token Vault |
| `createGitHubIssue` | GitHub | Create a new issue | Medium | Token Vault + Step-Up |
| `listSlackChannels` | Slack | Browse your channels | Low | Bot Token |
| `getSlackChannelHistory` | Slack | Read channel messages | Low | Bot Token |
| `sendSlackMessage` | Slack | Send a message | Medium | Bot Token + Step-Up |
| `getDiscordProfile` | Discord | Get your Discord profile | Low | Token Vault |
| `listDiscordGuilds` | Discord | List your servers | Low | Token Vault |
| `getDiscordGuildMember` | Discord | Check membership & roles | Low | Token Vault |

Medium-risk (write) operations trigger step-up authentication before executing.

---

## How It Works

```
You  →  Nexus AI  →  Auth0 Token Vault  →  Google / GitHub / Discord
                         ↓                         ↓
                   Audit Trail logged        Slack (Bot Token)
```

1. **Connect** your Google, GitHub, and Discord accounts through Auth0 Connected Accounts. Tokens go straight to the Vault — our app never sees them. Slack connects via a workspace bot token.
2. **Chat** with Nexus in natural language. It figures out which tools and services are needed.
3. **Token Vault** exchanges your stored refresh tokens for short-lived, scoped access tokens — just enough permission to do the job.
4. **Step-up auth** kicks in for write operations — the agent queues the action and waits for your explicit approval before executing.
5. **Actions execute** against the real APIs, and every step is logged in the audit trail.
6. **You stay in control.** Revoke access anytime. See everything the agent did. No black boxes.

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

## Security Model

| Principle | How Nexus Implements It |
|-----------|------------------------|
| No raw credentials | Token Vault stores and manages all OAuth tokens |
| Least privilege | Each tool requests only the scopes it needs |
| Short-lived tokens | Refresh tokens are exchanged for temporary access tokens |
| Risk classification | Every action is tagged low / medium / high / critical |
| Step-up auth | Write operations require explicit user approval before executing |
| Full audit trail | Every action logged with timestamp, scopes, and status |
| Dual auth patterns | Token Vault for services with refresh tokens; Bot tokens for services without (Slack) |

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

## License

MIT
---

<div align="center">

Built with obsession, coffee, and [Auth0 Token Vault](https://auth0.com/docs/secure/tokens/token-vault).

**[Star this repo](https://github.com/amgaikwad4588/nexus-ai-agent)** if Nexus made you feel safer about AI agents.

</div>
