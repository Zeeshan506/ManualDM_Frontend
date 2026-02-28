"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Lead } from "./LeadDetailsForm";
import { useAuth } from "@/contexts/AuthContext";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

interface InboxItem extends Lead {
  lastMessage: string;
  time: string;
}

function normalizeInboxItem(raw: InboxItem & Record<string, unknown>): InboxItem {
  const engagedByUserIdRaw = raw.engagedByUserId ?? raw.engaged_by_user_id ?? raw.assigned_to ?? null;
  const engagedByUserId = typeof engagedByUserIdRaw === "number" ? engagedByUserIdRaw : null;

  const engagedByUsernameRaw = raw.engagedByUsername ?? raw.engaged_by_username ?? null;
  const engagedByUsername = typeof engagedByUsernameRaw === "string" ? engagedByUsernameRaw : null;

  const isEngagedRaw = raw.isEngaged ?? raw.is_engaged;
  const isEngaged =
    typeof isEngagedRaw === "boolean"
      ? isEngagedRaw
      : engagedByUserId !== null;

  return {
    ...raw,
    lastMessage: typeof raw.lastMessage === "string" ? raw.lastMessage : "",
    time: typeof raw.time === "string" ? raw.time : "",
    engagedByUserId,
    engagedByUsername,
    isEngaged,
  };
}

function getOwnershipBadgeLabel(chat: InboxItem): string {
  const owner = chat.engagedByUsername ? `Owner: ${chat.engagedByUsername}` : "Owner: Unassigned";
  const occupancy = chat.isEngaged ? "Occupied" : "Unoccupied";
  return `${owner} • ${occupancy}`;
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
    let cancelled = false;

    const fetchLeads = async (silent = false) => {
      try {
        if (!silent) {
          setIsLoading(true);
        }
        const url = `${API_URL}/api/leads`;
        const accessToken = user?.accessToken;

        if (!accessToken) {
          setInboxItems([]);
          return;
        }

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        if (!response.ok) throw new Error("Failed to fetch leads");

        const data = (await response.json()) as Array<InboxItem & Record<string, unknown>>;
        if (!cancelled) {
          setInboxItems(data.map(normalizeInboxItem));
        }
      } catch (error) {
        console.error("Error fetching leads:", error);
        if (!cancelled) {
          setInboxItems([]);
        }
      } finally {
        if (!cancelled && !silent) {
          setIsLoading(false);
        }
      }
    };

    if (!user) {
      setInboxItems([]);
      setIsLoading(false);
      return;
    }

    fetchLeads();
    const intervalId = window.setInterval(() => {
      void fetchLeads(true);
    }, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [user?.role, user?.userId, user?.accessToken]);

  return (
    <div
      className={`w-full md:w-80 border-r border-border bg-card shrink-0 flex flex-col ${isVisible ? "flex" : "hidden md:flex"}`}
    >
      <div className="p-3 sm:p-4 border-b border-border">
        <h2 className="text-base sm:text-lg font-bold text-card-foreground mb-3 sm:mb-4">
          Active Chats
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search messages..."
            className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-border/70">
        {isLoading ? (
          <div className="p-4 text-sm text-muted-foreground">Loading chats...</div>
        ) : inboxItems.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">No leads found.</div>
        ) : (
          inboxItems.map((chat) => (
            <Link
              href={`/leads/${chat.id}`}
              key={chat.id}
              className={`block p-3 sm:p-4 transition-colors relative ${activeId === chat.id ? "bg-primary/10" : "hover:bg-accent"}`}
            >
              {activeId === chat.id && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
              )}
              <div className="flex justify-between items-baseline mb-1 gap-2">
                <h3 className="font-semibold text-sm truncate pr-2 text-foreground">
                  {chat.name || chat.igsid || `Lead #${chat.id}`}
                </h3>
                <span className="text-[10px] sm:text-[11px] text-muted-foreground whitespace-nowrap">
                  {chat.time}
                </span>
              </div>
              <p className="text-xs truncate text-muted-foreground">{chat.lastMessage}</p>
              <span className={`inline-flex mt-1 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${chat.isEngaged ? "border-amber-200 bg-amber-50 text-amber-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                {getOwnershipBadgeLabel(chat)}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
