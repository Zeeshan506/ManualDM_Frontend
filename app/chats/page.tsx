"use client";

import { InboxColumn } from "@/app/leads/[id]/components/InboxColumn";
import { ChatPlaceholder } from "@/app/leads/[id]/components/ChatPlaceholder";

export default function ChatsPage() {
  return (
    <div className="flex h-full w-full bg-card overflow-hidden relative border border-border/70 rounded-2xl">
      <InboxColumn isVisible activeId={-1} />

      <div className="hidden md:flex flex-1 flex-col bg-background/60 min-w-0">
        <ChatPlaceholder isVisible />
      </div>
    </div>
  );
}
