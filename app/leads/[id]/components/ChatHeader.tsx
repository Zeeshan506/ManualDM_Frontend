"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Info, MoreVertical } from "lucide-react";
import { Lead } from "./LeadDetailsForm";

interface ChatHeaderProps {
  activeChat: Lead | undefined;
  onInfoClick: () => void;
}

export function ChatHeader({ activeChat, onInfoClick }: ChatHeaderProps) {
  const router = useRouter();

  return (
    <div className="h-16 px-3 sm:px-6 bg-white border-b border-gray-200 flex items-center justify-between shadow-sm z-10 shrink-0">
      <div className="flex items-center gap-3">
        {/* Mobile Back Button */}
        <button
          onClick={() => router.push("/leads")}
          className="md:hidden p-1.5 -ml-2 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 border border-indigo-200 flex items-center justify-center shrink-0">
          <span className="text-indigo-700 font-bold text-sm">
            {(activeChat?.name || activeChat?.igsid || "?").charAt(0)}
          </span>
        </div>
        <div className="min-w-0">
          <h2 className="font-bold text-gray-900 leading-tight text-sm sm:text-base truncate">
            {activeChat?.name || "Unknown User"}
          </h2>
          <p className="text-[10px] sm:text-[11px] text-gray-500 font-mono truncate">
            {activeChat?.igsid}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {/* Info Button - Opens Modal on Mobile & Tablet (Hidden on Desktop) */}
        <button
          onClick={onInfoClick}
          className="lg:hidden p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-full transition-colors flex items-center gap-2"
        >
          <Info className="w-5 h-5" />
        </button>
        <button className="hidden sm:block p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
