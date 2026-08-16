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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NexusLogo } from "@/components/nexus-logo";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

export function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#0A0A0A]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/90 backdrop-blur-sm border-b border-[#262626]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#0A0A0A] flex items-center justify-center">
              <NexusLogo className="w-7 h-7 text-[#FF3D00]" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Nexus</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/auth/login">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </a>
            <a href="/auth/login?screen_hint=signup">
              <Button variant="primary" size="sm">
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.section
        className="pt-28 pb-24 px-6 relative"
        initial="hidden"
        animate="visible"
        variants={stagger}
      >
        <div className="max-w-7xl mx-auto text-center">
          <motion.div variants={fadeInUp} className="mb-8">
            <span className="uppercase text-xs font-medium tracking-widest text-[#737373]">
              Powered by Auth0 Token Vault
            </span>
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-8 leading-[0.95]"
          >
            Your AI Agent,
            <br />
            <span className="text-[#FF3D00]">Securely Connected</span>
            <br />
            to Your Digital Life
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="text-lg md:text-xl text-[#737373] max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            Nexus is an AI command center that connects to Google, GitHub, and
            Slack through Auth0 Token Vault. Full transparency. Complete
            control. Zero exposed credentials.
          </motion.p>

          <motion.div
            variants={fadeInUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a href="/auth/login?screen_hint=signup">
              <Button variant="primary" size="lg">
                <Zap className="w-5 h-5" />
                Launch Nexus
                <ArrowRight className="w-5 h-5" />
              </Button>
            </a>
            <a href="#features">
              <Button variant="outline" size="lg">
                See How It Works
                <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
          </motion.div>
        </div>
      </motion.section>

      {/* Stats Bar */}
      <motion.section
        className="border-t border-b border-[#262626] py-12 px-6"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={stagger}
      >
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: "4", label: "Services" },
            { value: "0", label: "Exposed Credentials" },
            { value: "100%", label: "Audit Coverage" },
            { value: "<50ms", label: "Token Exchange" },
          ].map((stat, i) => (
            <motion.div key={i} variants={fadeInUp} className="text-center">
              <div className="text-3xl md:text-4xl font-bold tracking-tight mb-1">
                {stat.value}
              </div>
              <div className="text-xs uppercase tracking-wider text-[#737373]">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        id="features"
        className="py-24 px-6"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        variants={stagger}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div variants={fadeInUp} className="mb-12 text-center">
            <span className="uppercase text-xs font-medium tracking-widest text-[#737373] mb-4 block">
              Architecture
            </span>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">
              Identity-First Agent Architecture
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: KeyRound,
                title: "Token Vault Integration",
                description:
                  "OAuth tokens stored securely in Auth0. Your agent exchanges scoped tokens on-demand, never seeing or storing raw credentials.",
              },
              {
                icon: Shield,
                title: "Permission Firewall",
                description:
                  "Every action is classified by risk level. High-risk operations trigger step-up authentication via CIBA before executing.",
              },
              {
                icon: Eye,
                title: "Full Transparency",
                description:
                  "See exactly which APIs are called, with what scopes, and when. A real-time permission dashboard shows everything.",
              },
              {
                icon: Zap,
                title: "Cross-Service Orchestration",
                description:
                  "Chain actions across Google, GitHub, and Slack in a single command. Each service uses its own scoped token.",
              },
              {
                icon: Activity,
                title: "Real-Time Audit Trail",
                description:
                  "Every agent action is logged with timestamps, scopes used, risk levels, and approval status. Complete accountability.",
              },
              {
                icon: Lock,
                title: "Step-Up Authentication",
                description:
                  "Dangerous operations (deleting repos, sending messages) require additional verification via backchannel auth.",
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="border border-[#262626] bg-[#0F0F0F] p-8 group hover:border-[#404040] transition-colors duration-150 text-center"
              >
                <feature.icon
                  className="w-6 h-6 text-[#FF3D00] mb-6 mx-auto"
                  strokeWidth={1.5}
                />
                <h3 className="text-lg font-semibold tracking-tight mb-3">
                  {feature.title}
                </h3>
                <p className="text-sm text-[#737373] leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* How It Works */}
      <motion.section
        className="py-24 px-6 bg-[#0F0F0F]"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        variants={stagger}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div variants={fadeInUp} className="mb-12 text-center">
            <span className="uppercase text-xs font-medium tracking-widest text-[#737373] mb-4 block">
              Process
            </span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tighter">
              How Nexus Keeps You in Control
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
              <motion.div
                key={i}
                variants={fadeInUp}
                className="text-center"
              >
                <span className="text-4xl md:text-5xl font-bold tracking-tighter text-[#262626] block mb-4">
                  {item.step}
                </span>
                <h3 className="text-lg font-semibold tracking-tight mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-[#737373] leading-relaxed mb-4">
                  {item.description}
                </p>
                <div className="flex items-center justify-center gap-3">
                  {item.icons.map((Icon, j) => (
                    <Icon
                      key={j}
                      className="w-4 h-4 text-[#737373]"
                      strokeWidth={1.5}
                    />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Testimonial */}
      <motion.section
        className="py-24 px-6 bg-[#FAFAFA] text-[#0A0A0A]"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={stagger}
      >
        <motion.div
          variants={fadeInUp}
          className="max-w-4xl mx-auto text-center"
        >
          <blockquote className="font-display text-3xl md:text-4xl lg:text-5xl italic leading-tight tracking-tight mb-8">
            &ldquo;Finally, an AI agent that shows me exactly what it&apos;s doing with my data.&rdquo;
          </blockquote>
          <div className="flex items-center justify-center gap-3">
            <div className="w-px h-4 bg-[#FF3D00]" />
            <span className="text-sm text-[#525252] uppercase tracking-wider">
              Beta User
            </span>
          </div>
        </motion.div>
      </motion.section>

      {/* CTA Section - Inverted */}
      <motion.section
        className="py-24 px-6 bg-[#FAFAFA] text-[#0A0A0A]"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={stagger}
      >
        <motion.div
          variants={fadeInUp}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">
            Ready to Take Control?
          </h2>
          <p className="text-lg text-[#737373] mb-10 max-w-2xl mx-auto">
            Connect your services, chat with your AI agent, and see exactly
            what it does. No black boxes.
          </p>
          <a href="/auth/login?screen_hint=signup">
            <Button variant="primary" size="lg">
              <Zap className="w-5 h-5" />
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Button>
          </a>
        </motion.div>
      </motion.section>
    </div>
  );
}
