"use client";

import React from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Lead } from "./LeadDetailsForm";

interface InboxItem extends Lead {
  lastMessage: string;
  time: string;
}

interface InboxColumnProps {
  isVisible: boolean;
  isLoading: boolean;
  inboxItems: InboxItem[];
  activeId: number;
}

export function InboxColumn({
  isVisible,
  isLoading,
  inboxItems,
  activeId,
}: InboxColumnProps) {
  return (
    <div
      className={`w-full md:w-80 border-r border-gray-200 bg-white shrink-0 flex flex-col ${isVisible ? "flex" : "hidden md:flex"}`}
    >
      <div className="p-3 sm:p-4 border-b border-gray-200">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">
          Active Chats
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search messages..."
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
        {isLoading ? (
          <div className="p-4 text-sm text-gray-500">Loading chats...</div>
        ) : inboxItems.length === 0 ? (
          <div className="p-4 text-sm text-gray-500">No leads found.</div>
        ) : (
          inboxItems.map((chat) => (
            <Link
              href={`/leads/${chat.id}`}
              key={chat.id}
              className={`block p-3 sm:p-4 transition-colors relative ${activeId === chat.id ? "bg-blue-50" : "hover:bg-gray-50"}`}
            >
              {activeId === chat.id && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-full" />
              )}
              <div className="flex justify-between items-baseline mb-1 gap-2">
                <h3 className="font-semibold text-sm truncate pr-2 text-gray-700">
                  {chat.name || chat.igsid || `Lead #${chat.id}`}
                </h3>
                <span className="text-[10px] sm:text-[11px] text-gray-400 whitespace-nowrap">
                  {chat.time}
                </span>
              </div>
              <p className="text-xs truncate text-gray-500">{chat.lastMessage}</p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
