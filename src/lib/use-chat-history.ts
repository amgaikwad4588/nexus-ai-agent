"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import type { UIMessage } from "ai";

/**
 * Chat history persisted in localStorage (per-device, no backend).
 * Stores multiple conversations; the chat interface seeds `useChat` from the
 * active conversation and saves messages back as they change.
 */

const STORAGE_KEY = "clavis:chats";
const ACTIVE_KEY = "clavis:activeChatId";
const MAX_CHATS = 50;

export interface StoredChat {
  id: string;
  title: string;
  messages: UIMessage[];
  createdAt: number;
  updatedAt: number;
}

function loadChats(): StoredChat[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredChat[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(chats: StoredChat[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats.slice(0, MAX_CHATS)));
  } catch {
    /* quota / disabled storage — ignore */
  }
}

/** Derive a short title from the first user message's text. */
function deriveTitle(messages: UIMessage[]): string {
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser) return "New chat";
  const text = (firstUser.parts || [])
    .filter((p) => p.type === "text")
    .map((p) => (p as { text?: string }).text || "")
    .join(" ")
    .trim();
  if (!text) return "New chat";
  return text.length > 40 ? text.slice(0, 40).trimEnd() + "…" : text;
}

export function useChatHistory() {
  // Lazy initializers read localStorage once on first client render (guarded for
  // SSR). This avoids a mount effect that calls setState synchronously.
  const [chats, setChats] = useState<StoredChat[]>(() => loadChats());
  const [activeId, setActiveId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const loaded = loadChats();
    const savedActive = localStorage.getItem(ACTIVE_KEY);
    if (savedActive && loaded.some((c) => c.id === savedActive)) return savedActive;
    return loaded[0]?.id ?? null;
  });

  const setActive = useCallback((id: string | null) => {
    setActiveId(id);
    try {
      if (id) localStorage.setItem(ACTIVE_KEY, id);
      else localStorage.removeItem(ACTIVE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  /** Start a fresh conversation and make it active. Returns the new id. */
  const newChat = useCallback((): string => {
    const id = crypto.randomUUID();
    const chat: StoredChat = {
      id,
      title: "New chat",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setChats((prev) => {
      const next = [chat, ...prev];
      persist(next);
      return next;
    });
    setActive(id);
    return id;
  }, [setActive]);

  /** Save the messages for a chat (creates it if missing); re-titles + reorders. */
  const saveMessages = useCallback((id: string, messages: UIMessage[]) => {
    setChats((prev) => {
      const existing = prev.find((c) => c.id === id);
      const title =
        existing && existing.title !== "New chat" ? existing.title : deriveTitle(messages);
      const updated: StoredChat = {
        id,
        title,
        messages,
        createdAt: existing?.createdAt ?? Date.now(),
        updatedAt: Date.now(),
      };
      // Newest-updated first.
      const next = [updated, ...prev.filter((c) => c.id !== id)];
      persist(next);
      return next;
    });
  }, []);

  const deleteChat = useCallback(
    (id: string) => {
      setChats((prev) => {
        const next = prev.filter((c) => c.id !== id);
        persist(next);
        return next;
      });
      setActiveId((cur) => {
        if (cur !== id) return cur;
        // Fall back to the most recent remaining chat, or null.
        const remaining = loadChats().filter((c) => c.id !== id);
        const nextActive = remaining[0]?.id ?? null;
        setActive(nextActive);
        return nextActive;
      });
    },
    [setActive]
  );

  // True only on the client (server snapshot is false). Used to defer
  // localStorage-backed UI so server/client initial renders match.
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const activeChat = chats.find((c) => c.id === activeId) ?? null;

  return {
    chats,
    activeId,
    activeChat,
    hydrated,
    newChat,
    setActive,
    saveMessages,
    deleteChat,
  };
}
