import { tool } from "ai";
import { z } from "zod";
import { getAccessTokenFromTokenVault } from "@auth0/ai-vercel";
import { withDiscordAccess } from "@/lib/auth0-ai";
import { addAuditEntry } from "@/lib/audit";
import { createPendingAction } from "@/lib/step-up";

export const getDiscordProfile = withDiscordAccess(
  tool({
    description: "Get the authenticated user's Discord profile information.",
    inputSchema: z.object({}),
    execute: async () => {
      const accessToken = getAccessTokenFromTokenVault();

      addAuditEntry({
        action: "Get Discord profile",
        service: "discord",
        scopes: ["identify"],
        status: "success",
        details: "Retrieved Discord user profile via Token Vault",
        riskLevel: "low",
        stepUpRequired: false,
      });

      const response = await fetch("https://discord.com/api/v10/users/@me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        const err = await response.text();
        return { error: `Discord API error: ${response.status} - ${err}` };
      }

      const user = await response.json();
      return {
        id: user.id,
        username: user.username,
        globalName: user.global_name,
        avatar: user.avatar
          ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
          : null,
        email: user.email,
      };
    },
  })
);

export const listDiscordGuilds = withDiscordAccess(
  tool({
    description:
      "List Discord servers (guilds) the authenticated user is a member of.",
    inputSchema: z.object({}),
    execute: async () => {
      const accessToken = getAccessTokenFromTokenVault();

      addAuditEntry({
        action: "List Discord servers",
        service: "discord",
        scopes: ["guilds"],
        status: "success",
        details: "Listed Discord guilds via Token Vault",
        riskLevel: "low",
        stepUpRequired: false,
      });

      const response = await fetch(
        "https://discord.com/api/v10/users/@me/guilds",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!response.ok) {
        const err = await response.text();
        return { error: `Discord API error: ${response.status} - ${err}`, guilds: [] };
      }

      const guilds = await response.json();
      return {
        guilds: guilds.map(
          (g: {
            id: string;
            name: string;
            icon: string | null;
            owner: boolean;
            permissions: string;
          }) => ({
            id: g.id,
            name: g.name,
            icon: g.icon
              ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png`
              : null,
            isOwner: g.owner,
          })
        ),
      };
    },
  })
);

export const listDiscordChannels = tool({
  description:
    "List all text channels in a Discord server. Requires the bot to be a member of the server with View Channels permission.",
  inputSchema: z.object({
    guildId: z.string().describe("The Discord server (guild) ID"),
  }),
  execute: async ({ guildId }) => {
    const botToken = getDiscordBotToken();

    addAuditEntry({
      action: `List Discord channels for guild ${guildId}`,
      service: "discord",
      scopes: ["bot"],
      status: "success",
      details: `Listed channels in guild ${guildId} via bot token`,
      riskLevel: "low",
      stepUpRequired: false,
    });

    const response = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/channels`,
      {
        headers: { Authorization: `Bot ${botToken}` },
      }
    );

    if (!response.ok) {
      const err = await response.text();
      return { error: `Discord API error: ${response.status} - ${err}`, channels: [] };
    }

    const channels = await response.json();
    const textChannels = channels
      .filter((c: { type: number }) => c.type === 0)
      .map((c: { id: string; name: string; position: number }) => ({
        id: c.id,
        name: c.name,
      }));

    return {
      channels: textChannels,
      serverId: guildId,
    };
  },
});

export const getDiscordGuildMember = withDiscordAccess(
  tool({
    description:
      "Get the authenticated user's membership details in a specific Discord server, including roles and nickname.",
    inputSchema: z.object({
      guildId: z.string().describe("The Discord server (guild) ID"),
    }),
    execute: async ({ guildId }) => {
      const accessToken = getAccessTokenFromTokenVault();

      addAuditEntry({
        action: `Get Discord membership for guild ${guildId}`,
        service: "discord",
        scopes: ["guilds.members.read"],
        status: "success",
        details: `Retrieved membership info for guild ${guildId} via Token Vault`,
        riskLevel: "low",
        stepUpRequired: false,
      });

      const response = await fetch(
        `https://discord.com/api/v10/users/@me/guilds/${guildId}/member`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!response.ok) {
        const err = await response.text();
        return { error: `Discord API error: ${response.status} - ${err}` };
      }

      const member = await response.json();
      return {
        nickname: member.nick,
        roles: member.roles,
        joinedAt: member.joined_at,
        avatar: member.avatar,
      };
    },
  })
);

function getDiscordBotToken(): string {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) throw new Error("DISCORD_BOT_TOKEN not configured");
  return token;
}

export const sendDiscordMessage = tool({
  description:
    "Send a message to a Discord text channel. Requires the bot to be in the server with Send Messages permission. This is a WRITE action that requires step-up authentication.",
  inputSchema: z.object({
    channelId: z.string().describe("The Discord channel ID to send the message to"),
    message: z.string().describe("The message content to send"),
    userId: z.string().optional().describe("Auto-filled by system"),
  }),
  execute: async ({ channelId, message, userId }) => {
    const pendingAction = createPendingAction(
      "sendDiscordMessage",
      { channelId, message },
      userId || "unknown",
      `Send message to channel: "${message.slice(0, 50)}..."`,
      "discord",
      "medium"
    );

    addAuditEntry({
      action: `Step-up required: Send Discord message`,
      service: "discord",
      scopes: ["bot"],
      status: "pending_approval",
      details: `Write operation queued for approval: message to channel ${channelId}`,
      riskLevel: "medium",
      stepUpRequired: true,
    });

    return {
      requiresApproval: true,
      pendingActionId: pendingAction.id,
      action: "sendDiscordMessage",
      description: `Send message to Discord channel`,
      details: { channelId, message: message.slice(0, 200) },
      message: "This write operation requires your approval. Please confirm or deny this action.",
    };
  },
});

export const executeDiscordMessage = async (channelId: string, message: string) => {
  const botToken = getDiscordBotToken();

  addAuditEntry({
    action: `Send Discord message to channel ${channelId}`,
    service: "discord",
    scopes: ["bot"],
    status: "success",
    details: "Sent message via Discord bot token",
    riskLevel: "medium",
    stepUpRequired: true,
  });

  const response = await fetch(
    `https://discord.com/api/v10/channels/${channelId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bot ${botToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content: message }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    return { error: `Discord API error: ${response.status} - ${err}` };
  }

  const msg = await response.json();
  return {
    sent: true,
    messageId: msg.id,
    channelId: msg.channel_id,
    timestamp: msg.timestamp,
  };
};
