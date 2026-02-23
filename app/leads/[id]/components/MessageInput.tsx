"use client";

import React from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";

interface MessageInputProps {
  replyText: string;
  onReplyTextChange: (text: string) => void;
}

export function MessageInput({
  replyText,
  onReplyTextChange,
}: MessageInputProps) {
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    toast.success("Message sent to Meta API.");
    onReplyTextChange("");
  };

  return (
    <div className="p-3 sm:p-4 bg-white border-t border-gray-200">
      <form onSubmit={handleSendMessage} className="flex gap-2 sm:gap-3">
        <input
          type="text"
          value={replyText}
          onChange={(e) => onReplyTextChange(e.target.value)}
          placeholder="Type a reply..."
          className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
        <button
          type="submit"
          disabled={!replyText.trim()}
          className="px-3 sm:px-5 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex shrink-0"
        >
          <Send className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </form>
    </div>
  );
}
