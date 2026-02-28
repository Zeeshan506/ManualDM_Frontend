"use client";

import React from "react";
import { Send } from "lucide-react";

interface MessageInputProps {
  replyText: string;
  onReplyTextChange: (text: string) => void;
  onSendMessage: (text: string) => void | Promise<void>;
  isSending?: boolean;
}

export function MessageInput({
  replyText,
  onReplyTextChange,
  onSendMessage,
  isSending = false,
}: MessageInputProps) {
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = replyText.trim();
    if (!text || isSending) return;
    await onSendMessage(text);
  };

  return (
    <div className="p-3 sm:p-4 bg-card/95 backdrop-blur border-t border-border sticky bottom-0 z-10">
      <form onSubmit={handleSendMessage} className="flex gap-2 sm:gap-3">
        <input
          type="text"
          value={replyText}
          onChange={(e) => onReplyTextChange(e.target.value)}
          placeholder="Type a reply..."
          className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-background border border-border rounded-xl focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring text-sm"
        />
        <button
          type="submit"
          disabled={!replyText.trim() || isSending}
          className="px-3 sm:px-5 py-2.5 sm:py-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 disabled:opacity-50 transition-colors flex shrink-0"
        >
          <Send className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </form>
    </div>
  );
}
