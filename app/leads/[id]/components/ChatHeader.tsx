"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Info } from "lucide-react";
import { Lead } from "./LeadDetailsForm";

interface ChatHeaderProps {
  activeChat: Lead | undefined;
  onInfoClick: () => void;
  engagementLabel?: string;
}

export function ChatHeader({ activeChat, onInfoClick, engagementLabel }: ChatHeaderProps) {
  const router = useRouter();

  return (
    <div className="h-16 px-3 sm:px-6 bg-card/95 backdrop-blur border-b border-border flex items-center justify-between shadow-sm z-10 shrink-0 sticky top-0">
      <div className="flex items-center gap-3">
        {/* Mobile Back Button */}
        <button
          onClick={() => router.push("/chats")}
          className="md:hidden p-1.5 -ml-2 text-muted-foreground hover:bg-accent rounded-md transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="w-10 h-10 rounded-full bg-primary/12 border border-primary/25 flex items-center justify-center shrink-0">
          <span className="text-primary font-bold text-sm">
            {(activeChat?.name || activeChat?.igsid || "?").charAt(0)}
          </span>
        </div>
        <div className="min-w-0">
          <h2 className="font-bold text-foreground leading-tight text-sm sm:text-base truncate">
            {activeChat?.name || "Unknown User"}
          </h2>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground font-mono truncate">
            {activeChat?.igsid}
          </p>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">
            {engagementLabel || "Unoccupied"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {/* Info Button - Opens modal on small screens, toggles side details panel on desktop */}
        <button
          onClick={onInfoClick}
          className="p-2 text-primary bg-primary/10 hover:bg-primary/15 rounded-full transition-colors flex items-center gap-2"
        >
          <Info className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
