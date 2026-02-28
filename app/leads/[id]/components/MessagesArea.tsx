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
    <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 bg-gradient-to-b from-background to-muted/35">
      <div className="text-center">
        <span className="text-[11px] font-medium text-muted-foreground bg-card border border-border px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
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
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-card border border-border text-foreground rounded-tl-sm"
                }`}
              >
                {msg.text}
              </div>
              <span className="text-[10px] text-muted-foreground mt-1 px-1">
                {msg.time}
              </span>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center text-muted-foreground text-sm mt-10">
          No messages yet.
        </div>
      )}
    </div>
  );
}
