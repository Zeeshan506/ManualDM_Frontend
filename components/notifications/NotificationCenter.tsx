"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import { useNotifications } from "@/contexts/NotificationContext";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NotificationCenter() {
  const router = useRouter();
  const { notifications, unreadCount, isNotificationRead, markNotificationAsRead } = useNotifications();
  const [open, setOpen] = useState(false);

  const recent = useMemo(() => notifications.slice(0, 20), [notifications]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SidebarMenuItem>
        <SheetTrigger asChild>
          <SidebarMenuButton
            tooltip="Notifications"
            className="h-auto rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <Bell className="w-5 h-5" />
            <span>Notifications</span>
            {unreadCount > 0 ? <Badge className="ml-auto">{unreadCount}</Badge> : null}
          </SidebarMenuButton>
        </SheetTrigger>
      </SidebarMenuItem>

      <SheetContent side="right" className="p-0">
        <SheetHeader className="border-b border-border">
          <SheetTitle>Notifications</SheetTitle>
          <SheetDescription>Recent system updates.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {recent.length === 0 ? (
            <div className="text-sm text-muted-foreground p-2">No notifications yet.</div>
          ) : (
            recent.map((item) => {
              const isRead = isNotificationRead(item.id);
              const createdAt = item.created_at ? new Date(item.created_at) : null;
              const relativeTime =
                createdAt && !Number.isNaN(createdAt.getTime())
                  ? formatDistanceToNowStrict(createdAt, { addSuffix: true })
                  : "just now";

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    markNotificationAsRead(item.id);
                    if (item.lead_id) {
                      router.push(`/leads/${item.lead_id}`);
                    }
                    setOpen(false);
                  }}
                  className={`w-full text-left rounded-lg border px-3 py-2 hover:bg-accent/60 ${
                    isRead
                      ? "border-border bg-background"
                      : "border-primary/40 bg-primary/5"
                  }`}
                >
                  <div className="text-sm font-medium text-foreground">{item.title}</div>
                  {item.body ? <div className="text-xs text-muted-foreground mt-1">{item.body}</div> : null}
                  <div className="text-[11px] text-muted-foreground mt-1">{relativeTime}</div>
                </button>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
