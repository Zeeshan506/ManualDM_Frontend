"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Lead } from "./LeadDetailsForm";
import { useAuth } from "@/contexts/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface InboxItem extends Lead {
  lastMessage: string;
  time: string;
}

interface InboxColumnProps {
  isVisible: boolean;
  activeId: number;
}

export function InboxColumn({
  isVisible,
  activeId,
}: InboxColumnProps) {
  const { user } = useAuth();

  const [inboxItems, setInboxItems] = useState<InboxItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setIsLoading(true);
        let url = `${API_URL}/api/leads`;
        const accessToken = user?.accessToken;
        const currentUserId = Number(user?.userId);

        if (!accessToken) {
          setInboxItems([]);
          return;
        }

        // If the user is a Sales Rep, append the query parameter to only fetch THEIR leads.
        // If the user is an Admin, we leave the URL alone to fetch everything.
        if (user?.role === "sales_rep") {
          if (!Number.isFinite(currentUserId)) {
            setInboxItems([]);
            return;
          }
          url += `?assigned_to=${currentUserId}`;
        }

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        if (!response.ok) throw new Error("Failed to fetch leads");

        const data = await response.json();
        setInboxItems(data);
      } catch (error) {
        console.error("Error fetching leads:", error);
        setInboxItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (!user) {
      setInboxItems([]);
      setIsLoading(false);
      return;
    }

    fetchLeads();
  }, [user?.role, user?.userId, user?.accessToken]);

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
