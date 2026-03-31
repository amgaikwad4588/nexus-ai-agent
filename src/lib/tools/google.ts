import { tool } from "ai";
import { z } from "zod";
import { getAccessTokenFromTokenVault } from "@auth0/ai-vercel";
import { withGoogleAccess } from "@/lib/auth0-ai";
import { addAuditEntry } from "@/lib/audit";

export const searchGmail = withGoogleAccess(
  tool({
    description:
      "Search the user's Gmail inbox for emails matching a query. Use this to find specific emails, check for unread messages, or look up conversations.",
    inputSchema: z.object({
      query: z
        .string()
        .describe(
          "Gmail search query (e.g., 'from:john@example.com', 'is:unread', 'subject:meeting')"
        ),
      maxResults: z
        .number()
        .optional()
        .default(5)
        .describe("Maximum number of results to return"),
    }),
    execute: async ({ query, maxResults }) => {
      const accessToken = getAccessTokenFromTokenVault();

      addAuditEntry({
        action: `Search Gmail: "${query}"`,
        service: "google",
        scopes: ["gmail.readonly"],
        status: "success",
        details: `Searched Gmail with query: ${query}`,
        riskLevel: "low",
        stepUpRequired: false,
      });

      const response = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[gmail] API error ${response.status}:`, errorText);
        addAuditEntry({
          action: `Search Gmail failed`,
          service: "google",
          scopes: ["gmail.readonly"],
          status: "failed",
          details: `Error: ${response.status} - ${errorText}`,
          riskLevel: "low",
          stepUpRequired: false,
        });
        return {
          error: `Gmail API error: ${response.status} - ${errorText}`,
          messages: [],
        };
      }

      const data = await response.json();
      if (!data.messages || data.messages.length === 0) {
        return { messages: [], total: 0 };
      }

      const messages = await Promise.all(
        data.messages.slice(0, maxResults).map(async (msg: { id: string }) => {
          const msgResponse = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );
          if (!msgResponse.ok) return null;
          const msgData = await msgResponse.json();
          const headers = msgData.payload?.headers || [];
          return {
            id: msgData.id,
            subject:
              headers.find((h: { name: string }) => h.name === "Subject")
                ?.value || "(no subject)",
            from:
              headers.find((h: { name: string }) => h.name === "From")?.value ||
              "unknown",
            date:
              headers.find((h: { name: string }) => h.name === "Date")?.value ||
              "",
            snippet: msgData.snippet || "",
          };
        })
      );

      return {
        messages: messages.filter(Boolean),
        total: data.resultSizeEstimate || 0,
      };
    },
  })
);

export const checkCalendar = withGoogleAccess(
  tool({
    description:
      "Check the user's Google Calendar for events on a specific date or date range. Use this to check availability or list upcoming events.",
    inputSchema: z.object({
      date: z
        .string()
        .describe("The date to check (ISO format, e.g., 2026-03-29)"),
      daysAhead: z
        .number()
        .optional()
        .default(1)
        .describe("Number of days ahead to check"),
    }),
    execute: async ({ date, daysAhead }) => {
      const accessToken = getAccessTokenFromTokenVault();
      const timeMin = new Date(date).toISOString();
      const timeMax = new Date(
        new Date(date).getTime() + daysAhead * 86400000
      ).toISOString();

      addAuditEntry({
        action: `Check Calendar: ${timeMin.split("T")[0]}`,
        service: "google",
        scopes: ["calendar.readonly"],
        status: "success",
        details: `Checked calendar from ${timeMin} to ${timeMax}`,
        riskLevel: "low",
        stepUpRequired: false,
      });

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime&maxResults=10`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!response.ok) {
        return { error: `Calendar API error: ${response.status}`, events: [] };
      }

      const data = await response.json();
      const events = (data.items || []).map(
        (event: {
          id: string;
          summary?: string;
          start?: { dateTime?: string; date?: string };
          end?: { dateTime?: string; date?: string };
          status?: string;
        }) => ({
          id: event.id,
          title: event.summary || "(no title)",
          start: event.start?.dateTime || event.start?.date || "",
          end: event.end?.dateTime || event.end?.date || "",
          status: event.status,
        })
      );

      return { events, date: timeMin.split("T")[0], daysAhead };
    },
  })
);
