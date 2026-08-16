"use client";

import { Plus, MessageSquare, Trash2 } from "lucide-react";
import type { StoredChat } from "@/lib/use-chat-history";

/**
 * Chat history panel: list of past conversations (newest first), a "New chat"
 * button, click-to-open, and per-chat delete.
 */
export function ChatHistorySidebar({
  chats,
  activeId,
  disabled = false,
  onSelect,
  onNew,
  onDelete,
}: {
  chats: StoredChat[];
  activeId: string | null;
  disabled?: boolean;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="w-60 shrink-0 border-r border-[#262626] bg-[#0A0A0A] flex flex-col h-full">
      <div className="p-3 border-b border-[#262626]">
        <button
          onClick={onNew}
          disabled={disabled}
          title={disabled ? "Wait for the current response to finish" : undefined}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm border border-[#262626] hover:border-[#404040] hover:bg-[#1A1A1A] transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[#262626] disabled:hover:bg-transparent"
        >
          <Plus className="w-4 h-4 text-[#FF3D00]" strokeWidth={1.5} />
          New chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {chats.length === 0 ? (
          <p className="text-xs text-[#737373] text-center px-3 py-6">
            No conversations yet. Start a new chat.
          </p>
        ) : (
          chats.map((chat) => (
            <div
              key={chat.id}
              className={`group flex items-center gap-2 px-3 py-2 transition-colors duration-150 ${
                chat.id === activeId
                  ? "bg-[#1A1A1A] border-l-2 border-[#FF3D00]"
                  : "hover:bg-[#141414] border-l-2 border-transparent"
              } ${disabled && chat.id !== activeId ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
              title={disabled ? "Wait for the current response to finish" : undefined}
              onClick={() => onSelect(chat.id)}
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#737373] shrink-0" strokeWidth={1.5} />
              <span className="flex-1 min-w-0 truncate text-xs">{chat.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(chat.id);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-[#DC2626] text-[#737373]"
                title="Delete chat"
                aria-label="Delete chat"
              >
                <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
