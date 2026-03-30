"use client";

import { motion } from "framer-motion";
import {
  Shield,
  Zap,
  Eye,
  GitBranch,
  Mail,
  MessageSquare,
  Lock,
  ArrowRight,
  Sparkles,
  Activity,
  KeyRound,
  Network,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-chart-2/10 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-chart-5/5 rounded-full blur-3xl"
        />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(oklch(0.95 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(0.95 0 0) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Network className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">Nexus</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/auth/login">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </a>
            <a href="/auth/login?screen_hint=signup">
              <Button size="sm" className="glow">
                Get Started
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.section
        className="pt-32 pb-20 px-6"
        initial="hidden"
        animate="visible"
        variants={stagger}
      >
        <div className="max-w-5xl mx-auto text-center">
          <motion.div variants={fadeUp} className="mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-sm font-medium text-muted-foreground">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Powered by Auth0 Token Vault
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]"
          >
            Your AI Agent,{" "}
            <span className="gradient-text">Securely Connected</span>{" "}
            to Your Digital Life
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            Nexus is an AI command center that connects to Google, GitHub, and
            Slack through Auth0 Token Vault. Full transparency. Complete
            control. Zero exposed credentials.
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a href="/auth/login?screen_hint=signup">
              <Button size="lg" className="text-base px-8 glow-strong">
                Launch Nexus
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </a>
            <a href="#features">
              <Button variant="outline" size="lg" className="text-base px-8">
                See How It Works
              </Button>
            </a>
          </motion.div>

          {/* Hero visual - Terminal/Dashboard preview */}
          <motion.div
            variants={fadeUp}
            className="mt-16 relative max-w-4xl mx-auto"
          >
            <div className="glass rounded-2xl p-1 glow-strong">
              <div className="bg-card rounded-xl overflow-hidden">
                {/* Fake terminal header */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <span className="text-xs text-muted-foreground ml-2 font-mono">
                    Nexus AI Agent
                  </span>
                </div>
                {/* Chat preview */}
                <div className="p-6 space-y-4 font-mono text-sm">
                  <div className="flex gap-3">
                    <span className="text-primary font-bold shrink-0">You:</span>
                    <span className="text-foreground">
                      Summarize my unread emails and post a digest to #general
                      on Slack
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-chart-2 font-bold shrink-0">Nexus:</span>
                    <div className="text-muted-foreground">
                      <div className="flex items-center gap-2 mb-2">
                        <Lock className="w-3 h-3 text-primary" />
                        <span className="text-xs text-primary">
                          Using Token Vault: google-oauth2, slack
                        </span>
                      </div>
                      <p>
                        Found 4 unread emails. Posting summary to #general...
                      </p>
                      <div className="mt-2 pl-3 border-l-2 border-primary/30 text-xs">
                        <p>1. Meeting invite from Sarah (Tomorrow 2pm)</p>
                        <p>2. PR review request from @alex</p>
                        <p>3. Weekly report due Friday</p>
                        <p>4. New feature spec from Product</p>
                      </div>
                      <p className="mt-2 text-green-400">
                        Digest posted to #general successfully.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Floating badges */}
            <div className="absolute -top-4 -right-4 glass rounded-lg px-3 py-2 animate-float text-xs font-medium flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-green-400" />
              Scoped Access
            </div>
            <div
              className="absolute -bottom-4 -left-4 glass rounded-lg px-3 py-2 animate-float text-xs font-medium flex items-center gap-1.5"
              style={{ animationDelay: "1s" }}
            >
              <Activity className="w-3.5 h-3.5 text-primary" />
              Full Audit Trail
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        id="features"
        className="py-24 px-6"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={stagger}
      >
        <div className="max-w-6xl mx-auto">
          <motion.div variants={fadeUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Identity-First Agent Architecture
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Every API call is authenticated, scoped, and audited. Your agent
              never touches raw credentials.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: KeyRound,
                title: "Token Vault Integration",
                description:
                  "OAuth tokens stored securely in Auth0. Your agent exchanges scoped tokens on-demand, never seeing or storing raw credentials.",
                color: "text-primary",
              },
              {
                icon: Shield,
                title: "Permission Firewall",
                description:
                  "Every action is classified by risk level. High-risk operations trigger step-up authentication via CIBA before executing.",
                color: "text-green-400",
              },
              {
                icon: Eye,
                title: "Full Transparency",
                description:
                  "See exactly which APIs are called, with what scopes, and when. A real-time permission dashboard shows everything.",
                color: "text-blue-400",
              },
              {
                icon: Zap,
                title: "Cross-Service Orchestration",
                description:
                  "Chain actions across Google, GitHub, and Slack in a single command. Each service uses its own scoped token.",
                color: "text-yellow-400",
              },
              {
                icon: Activity,
                title: "Real-Time Audit Trail",
                description:
                  "Every agent action is logged with timestamps, scopes used, risk levels, and approval status. Complete accountability.",
                color: "text-orange-400",
              },
              {
                icon: Lock,
                title: "Step-Up Authentication",
                description:
                  "Dangerous operations (deleting repos, sending messages) require additional verification via backchannel auth.",
                color: "text-red-400",
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="glass rounded-xl p-6 hover:bg-accent/50 transition-colors group"
              >
                <feature.icon
                  className={`w-10 h-10 ${feature.color} mb-4 group-hover:scale-110 transition-transform`}
                />
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* How It Works */}
      <motion.section
        className="py-24 px-6"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={stagger}
      >
        <div className="max-w-5xl mx-auto">
          <motion.div variants={fadeUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How Nexus Keeps You in Control
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Connect Your Services",
                description:
                  "Link Google, GitHub, and Slack through Auth0 OAuth flows. Tokens are stored in the Vault, never in our app.",
                icons: [Mail, GitBranch, MessageSquare],
              },
              {
                step: "02",
                title: "Chat With Your Agent",
                description:
                  "Tell Nexus what you need in natural language. It plans the actions and shows you exactly what it will do.",
                icons: [Sparkles],
              },
              {
                step: "03",
                title: "Monitor Everything",
                description:
                  "Watch the audit trail in real-time. Revoke access instantly. Every action is transparent and accountable.",
                icons: [Eye, Shield, Activity],
              },
            ].map((item, i) => (
              <motion.div key={i} variants={fadeUp} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full glass text-primary font-bold text-sm mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  {item.description}
                </p>
                <div className="flex items-center justify-center gap-2">
                  {item.icons.map((Icon, j) => (
                    <div
                      key={j}
                      className="w-8 h-8 rounded-lg glass flex items-center justify-center"
                    >
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* CTA */}
      <motion.section
        className="py-24 px-6"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={stagger}
      >
        <motion.div
          variants={fadeUp}
          className="max-w-3xl mx-auto text-center glass rounded-2xl p-12 glow-strong"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Take Control?
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Connect your services, chat with your AI agent, and see exactly
            what it does. No black boxes.
          </p>
          <a href="/auth/login?screen_hint=signup">
            <Button size="lg" className="text-base px-8">
              Get Started Free
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </a>
        </motion.div>
      </motion.section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border/50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <Network className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="text-sm font-medium">Nexus</span>
            <span className="text-xs text-muted-foreground">
              Built with Auth0 Token Vault
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Built for the Authorized to Act Hackathon 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
