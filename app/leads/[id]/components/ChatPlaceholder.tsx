"use client";

import React from "react";
import { Mail } from "lucide-react";

interface ChatPlaceholderProps {
  isVisible: boolean;
}

export function ChatPlaceholder({ isVisible }: ChatPlaceholderProps) {
  if (!isVisible) return null;

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-6">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Mail className="w-8 h-8 text-gray-300" />
      </div>
      <p className="text-lg font-medium text-gray-500">No chat selected</p>
      <p className="text-sm mt-1">
        Select a conversation from the left to start replying.
      </p>
    </div>
  );
}
