# Nexus - Your AI Agent, Securely Connected to Your Digital Life

We live in a world of scattered digital tools. Your emails sit in Gmail, your code lives on GitHub, your team conversations happen on Slack, your communities on Discord. Jumping between them is exhausting. What if one AI assistant could bridge all of them — without ever touching your passwords?

**Nexus** is that assistant. It's an AI-powered command center that talks to Google, GitHub, Slack, and Discord on your behalf, using [Auth0 Token Vault](https://auth0.com/docs/secure/tokens/token-vault) to handle every credential securely. You chat in plain English; Nexus does the rest.

Built for the [Authorized to Act: Auth0 for AI Agents Hackathon 2026](https://authorizedtoact.devpost.com/).

---

## The Problem

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
| AI Model | Google Gemini (via Vercel AI SDK v6) |
| UI | Tailwind CSS v4, shadcn/ui, Framer Motion |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- **Node.js 20+**
- A free [Auth0 account](https://auth0.com/signup)
- A free [Google Gemini API key](https://aistudio.google.com/apikey)

### 1. Clone & Install

```bash
git clone https://github.com/amgaikwad4588/nexus-ai-agent.git
cd nexus-ai-agent
npm install
```

### 2. Set Up Auth0

**Create a Regular Web Application:**
1. Go to [Auth0 Dashboard](https://manage.auth0.com) > Applications > Create Application
2. Choose "Regular Web Application"
3. Note your `Domain`, `Client ID`, and `Client Secret`

**Set Callback URLs** (under Application Settings):
- Allowed Callback URLs: `http://localhost:3000/auth/callback`
- Allowed Logout URLs: `http://localhost:3000`
- Allowed Web Origins: `http://localhost:3000`

**Enable Token Vault:**
1. Go to Application > Advanced Settings > Grant Types
2. Enable the "Token Vault" checkbox and save

**Create a Machine-to-Machine App** (for Management API access):
1. Applications > Create Application > Machine to Machine
2. Authorize it for the Auth0 Management API
3. Note the M2M `Client ID` and `Client Secret`

**Set Up Social Connections:**
- **Google**: Authentication > Social > Google — enable Gmail and Calendar scopes. Enable Connected Accounts + Token Vault.
- **GitHub**: Authentication > Social > GitHub — enable `repo`, `read:user`, `read:org`. Enable Connected Accounts + Token Vault.
- **Discord**: Authentication > Social > Discord — enable `identify`, `guilds`, `guilds.members.read`. Enable Connected Accounts + Token Vault.
- **Slack**: Create a Slack App at [api.slack.com](https://api.slack.com) with bot scopes `channels:read`, `chat:write`, `channels:history`, `users:read`. Copy the Bot Token (`xoxb-...`).

### 3. Configure Environment Variables

```bash
cp .env.local.example .env.local
```

Fill in your `.env.local`:

```env
# Auth0 - Regular Web Application
AUTH0_SECRET=<run: openssl rand -hex 32>
AUTH0_DOMAIN=your-tenant.us.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
APP_BASE_URL=http://localhost:3000

# Auth0 AI / Token Vault (M2M app)
AUTH0_AI_DOMAIN=your-tenant.us.auth0.com
AUTH0_AI_CLIENT_ID=your_m2m_client_id
AUTH0_AI_CLIENT_SECRET=your_m2m_client_secret

# AI Provider
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key

# Slack Bot Token
SLACK_BOT_TOKEN=xoxb-your-bot-token

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run It

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), log in, connect your services, and start chatting.

### 5. Deploy to Vercel

```bash
npx vercel deploy
```

Don't forget to:
- Add all environment variables in your Vercel project settings
- Update Auth0 callback URLs to include your Vercel production domain

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                      # Landing page
│   ├── dashboard/
│   │   ├── chat/page.tsx             # AI chat interface
│   │   ├── connections/page.tsx      # Manage connected accounts
│   │   ├── permissions/page.tsx      # View scopes & risk levels
│   │   └── audit/page.tsx            # Real-time audit trail
│   └── api/
│       ├── chat/route.ts             # AI chat endpoint
│       ├── connect/route.ts          # Connected Accounts flow
│       ├── step-up/route.ts          # Step-up auth endpoint
│       ├── connections/route.ts      # Connection status API
│       └── audit/route.ts            # Audit log API
├── lib/
│   ├── auth0.ts                      # Auth0 client config
│   ├── auth0-ai.ts                   # Token Vault setup
│   ├── token-exchange.ts             # Manual token exchange for step-up
│   ├── step-up.ts                    # Pending action store
│   ├── audit.ts                      # Audit logging
│   └── tools/
│       ├── google.ts                 # Gmail + Calendar (Token Vault)
│       ├── github.ts                 # Repos, Issues, Profile (Token Vault)
│       ├── slack.ts                  # Channels, Messages (Bot Token)
│       └── discord.ts               # Profile, Guilds, Members (Token Vault)
└── components/
    ├── landing/                      # Landing page
    ├── dashboard/                    # Dashboard UI
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

## License

Copyright (c) 2026 Aditya Gaikwad

All rights reserved.

This source code is the proprietary property of the author.
No part of this code may be used, copied, modified, or distributed
without explicit permission from the author.


---

Built with coffee, curiosity, and [Auth0 Token Vault](https://auth0.com/docs/secure/tokens/token-vault).
