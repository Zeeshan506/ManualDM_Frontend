"use client";

import React from "react";
import { format } from "date-fns";

export interface MessageItem {
  id: number;
  text: string;
  direction: "inbound" | "outbound";
  time: string;
  timestamp: string;
}

interface MessagesAreaProps {
  activeMessages: MessageItem[];
}

export function MessagesArea({ activeMessages }: MessagesAreaProps) {
  const todayFormatted = format(new Date(), "EEEE, MMMM do");

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <div className="text-center">
        <span className="text-[11px] font-medium text-gray-400 bg-gray-100 px-3 py-1 rounded-full uppercase tracking-wider">
          {todayFormatted}
        </span>
      </div>
      {activeMessages.length > 0 ? (
        activeMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.direction === "outbound" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[75%] lg:max-w-[60%] flex flex-col ${
                msg.direction === "outbound"
                  ? "items-end"
                  : "items-start"
              }`}
            >
              <div
                className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm ${
                  msg.direction === "outbound"
                    ? "bg-blue-600 text-white rounded-tr-sm"
                    : "bg-white border border-gray-100 text-gray-800 rounded-tl-sm"
                }`}
              >
                {msg.text}
              </div>
              <span className="text-[10px] text-gray-400 mt-1 px-1">
                {msg.time}
              </span>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center text-gray-400 text-sm mt-10">
          No messages yet.
        </div>
      )}
    </div>
  );
}
