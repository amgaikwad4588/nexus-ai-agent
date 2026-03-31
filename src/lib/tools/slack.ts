import { tool } from "ai";
import { z } from "zod";
import { getAccessTokenFromTokenVault } from "@auth0/ai-vercel";
import { withSlackAccess } from "@/lib/auth0-ai";
import { addAuditEntry } from "@/lib/audit";

export const listSlackChannels = withSlackAccess(
  tool({
    description:
      "List Slack channels the user has access to in their workspace.",
    inputSchema: z.object({
      limit: z
        .number()
        .optional()
        .default(20)
        .describe("Maximum number of channels to return"),
    }),
    execute: async ({ limit }) => {
      const accessToken = getAccessTokenFromTokenVault();

      addAuditEntry({
        action: "List Slack channels",
        service: "slack",
        scopes: ["channels:read"],
        status: "success",
        details: `Listed up to ${limit} Slack channels`,
        riskLevel: "low",
        stepUpRequired: false,
      });

      const response = await fetch(
        `https://slack.com/api/conversations.list?limit=${limit}&types=public_channel,private_channel`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!response.ok) {
        return { error: `Slack API error: ${response.status}`, channels: [] };
      }

      const data = await response.json();
      if (!data.ok) {
        return { error: data.error || "Slack API error", channels: [] };
      }

      return {
        channels: (data.channels || []).map(
          (ch: {
            id: string;
            name: string;
            purpose: { value: string };
            num_members: number;
            is_private: boolean;
          }) => ({
            id: ch.id,
            name: ch.name,
            purpose: ch.purpose?.value || "",
            memberCount: ch.num_members,
            isPrivate: ch.is_private,
          })
        ),
      };
    },
  })
);

export const sendSlackMessage = withSlackAccess(
  tool({
    description:
      "Send a message to a Slack channel. This is a write action that posts visible content.",
    inputSchema: z.object({
      channel: z
        .string()
        .describe("Channel name (without #) or channel ID"),
      message: z.string().describe("The message text to send"),
    }),
    execute: async ({ channel, message }) => {
      const accessToken = getAccessTokenFromTokenVault();

      addAuditEntry({
        action: `Send Slack message to #${channel}`,
        service: "slack",
        scopes: ["chat:write"],
        status: "success",
        details: `Sent message to #${channel}: "${message.slice(0, 50)}..."`,
        riskLevel: "medium",
        stepUpRequired: false,
      });

      const response = await fetch("https://slack.com/api/chat.postMessage", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ channel, text: message }),
      });

      if (!response.ok) {
        return { error: `Slack API error: ${response.status}` };
      }

      const data = await response.json();
      if (!data.ok) {
        return { error: data.error || "Failed to send message" };
      }

      return {
        sent: true,
        channel: data.channel,
        timestamp: data.ts,
        message: message.slice(0, 100),
      };
    },
  })
);

export const getSlackChannelHistory = withSlackAccess(
  tool({
    description:
      "Get recent messages from a Slack channel to understand the conversation context.",
    inputSchema: z.object({
      channel: z.string().describe("Channel ID"),
      limit: z
        .number()
        .optional()
        .default(10)
        .describe("Number of messages to fetch"),
    }),
    execute: async ({ channel, limit }) => {
      const accessToken = getAccessTokenFromTokenVault();

      addAuditEntry({
        action: `Read Slack channel history`,
        service: "slack",
        scopes: ["channels:history"],
        status: "success",
        details: `Read ${limit} messages from channel ${channel}`,
        riskLevel: "low",
        stepUpRequired: false,
      });

      const response = await fetch(
        `https://slack.com/api/conversations.history?channel=${channel}&limit=${limit}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!response.ok) {
        return { error: `Slack API error: ${response.status}`, messages: [] };
      }

      const data = await response.json();
      if (!data.ok) {
        return { error: data.error, messages: [] };
      }

      return {
        messages: (data.messages || []).map(
          (msg: { text: string; user: string; ts: string; type: string }) => ({
            text: msg.text,
            user: msg.user,
            timestamp: msg.ts,
            type: msg.type,
          })
        ),
      };
    },
  })
);
