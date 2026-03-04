"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api-client";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

type NotificationEvent = {
  id: number;
  event_type: string;
  title: string;
  body: string | null;
  lead_id: number | null;
  payload?: Record<string, unknown> | null;
  created_at: string | null;
  type?: string;
};

type NotificationContextValue = {
  notifications: NotificationEvent[];
  unreadCount: number;
  markAllAsRead: () => void;
  isNotificationRead: (notificationId: number) => boolean;
  markNotificationAsRead: (notificationId: number) => void;
};

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);
const RECENT_NOTIFICATION_LIMIT = 20;

function normalizeNotification(raw: NotificationEvent): NotificationEvent | null {
  if (typeof raw?.id !== "number") {
    return null;
  }

  return {
    id: raw.id,
    event_type: typeof raw.event_type === "string" ? raw.event_type : "unknown",
    title: typeof raw.title === "string" ? raw.title : "Notification",
    body: typeof raw.body === "string" ? raw.body : null,
    lead_id: typeof raw.lead_id === "number" ? raw.lead_id : null,
    payload: raw.payload ?? null,
    created_at: typeof raw.created_at === "string" ? raw.created_at : null,
    type: typeof raw.type === "string" ? raw.type : undefined,
  };
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<Set<number>>(new Set());

  const notificationIdsRef = useRef<Set<number>>(new Set());
  const reconnectTimerRef = useRef<number | null>(null);

  const addNotification = useCallback((nextEvent: NotificationEvent, isLive: boolean) => {
    setNotifications((prev) => {
      if (notificationIdsRef.current.has(nextEvent.id)) {
        return prev;
      }

      notificationIdsRef.current.add(nextEvent.id);
      const merged = [nextEvent, ...prev].slice(0, RECENT_NOTIFICATION_LIMIT);
      return merged;
    });

    if (isLive) {
      return;
    }
  }, []);

  const goToLeadFromNotification = useCallback(
    (event: NotificationEvent) => {
      if (typeof event.lead_id === "number" && event.lead_id > 0) {
        router.push(`/leads/${event.lead_id}`);
      }
    },
    [router]
  );

  useEffect(() => {
    const accessToken = user?.accessToken;
    if (!accessToken) {
      notificationIdsRef.current.clear();
      return;
    }

    let isCancelled = false;

    const loadRecent = async () => {
      try {
        console.info("[WS][notifications] loading recent history", { limit: RECENT_NOTIFICATION_LIMIT });
        const response = await apiFetch(`${API_URL}/api/notifications?limit=${RECENT_NOTIFICATION_LIMIT}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          timeoutMs: 10000,
          minIntervalMs: 500,
          retry: { retries: 2 },
          throttleKey: "notifications:recent",
        });

        if (!response.ok || isCancelled) {
          console.warn("[WS][notifications] history request ignored", {
            ok: response.ok,
            status: response.status,
            isCancelled,
          });
          return;
        }

        const payload = (await response.json()) as NotificationEvent[];
        const normalized = payload
          .map(normalizeNotification)
          .filter((item): item is NotificationEvent => item !== null)
          .sort((a, b) => b.id - a.id);

        notificationIdsRef.current = new Set(normalized.map((item) => item.id));
        setNotifications(normalized);
        setReadNotificationIds(new Set(normalized.map((item) => item.id)));
        console.info("[WS][notifications] history loaded", {
          count: normalized.length,
          newestId: normalized[0]?.id ?? null,
        });
      } catch {
        console.error("[WS][notifications] history load failed");
      }
    };

    loadRecent();

    return () => {
      isCancelled = true;
    };
  }, [user?.accessToken]);

  useEffect(() => {
    const accessToken = user?.accessToken;
    if (!accessToken) {
      return;
    }

    let socket: WebSocket | null = null;
    let isClosedByEffect = false;

    const connect = () => {
      const rawBase = API_URL || window.location.origin;
      const wsBase = rawBase.replace(/^http:\/\//i, "ws://").replace(/^https:\/\//i, "wss://").replace(/\/$/, "");
      const wsUrl = `${wsBase}/api/ws/notifications`;

      console.info("[WS][notifications] connecting", { wsUrl });
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.info("[WS][notifications] connected", { wsUrl });
      };

      socket.onmessage = (event) => {
        try {
          console.info("[WS][notifications] raw message", { data: event.data });
          const parsed = JSON.parse(event.data) as NotificationEvent;
          const normalized = normalizeNotification(parsed);
          if (!normalized) {
            console.warn("[WS][notifications] ignored malformed payload", { parsed });
            return;
          }

          console.info("[WS][notifications] parsed message", {
            id: normalized.id,
            event_type: normalized.event_type,
            lead_id: normalized.lead_id,
          });
          addNotification(normalized, true);

          const sameLeadOpen =
            typeof normalized.lead_id === "number" &&
            pathname === `/leads/${normalized.lead_id}`;

          if (normalized.event_type === "incoming_message" && !sameLeadOpen) {
            toast.info(normalized.title, {
              description: normalized.body ?? "New activity received.",
              action:
                typeof normalized.lead_id === "number"
                  ? {
                      label: "Open Chat",
                      onClick: () => goToLeadFromNotification(normalized),
                    }
                  : undefined,
            });
          }
        } catch {
          console.error("[WS][notifications] failed to parse message", { data: event.data });
        }
      };

      socket.onerror = (event) => {
        console.error("[WS][notifications] error", {
          event,
          readyState: socket?.readyState,
          wsUrl,
        });
      };

      socket.onclose = () => {
        console.warn("[WS][notifications] closed", {
          readyState: socket?.readyState,
          reconnectInMs: isClosedByEffect ? null : 1000,
        });
        if (isClosedByEffect) {
          return;
        }
        console.info("[WS][notifications] reconnecting scheduled", { delayMs: 1000 });
        reconnectTimerRef.current = window.setTimeout(connect, 1000);
      };
    };

    connect();

    return () => {
      isClosedByEffect = true;
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
      }
      reconnectTimerRef.current = null;
      socket?.close();
    };
  }, [addNotification, goToLeadFromNotification, pathname, user?.accessToken]);

  const markAllAsRead = useCallback(() => {
    setReadNotificationIds(new Set(notifications.map((item) => item.id)));
  }, [notifications]);

  const markNotificationAsRead = useCallback((notificationId: number) => {
    setReadNotificationIds((prev) => {
      if (prev.has(notificationId)) {
        return prev;
      }
      const next = new Set(prev);
      next.add(notificationId);
      return next;
    });
  }, []);

  const isNotificationRead = useCallback(
    (notificationId: number) => readNotificationIds.has(notificationId),
    [readNotificationIds]
  );

  const unreadCount = useMemo(() => {
    if (!user?.accessToken) {
      return 0;
    }
    return notifications.reduce((count, item) => (readNotificationIds.has(item.id) ? count : count + 1), 0);
  }, [notifications, readNotificationIds, user?.accessToken]);

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications: user?.accessToken ? notifications : [],
      unreadCount: user?.accessToken ? unreadCount : 0,
      markAllAsRead,
      isNotificationRead,
      markNotificationAsRead,
    }),
    [isNotificationRead, markAllAsRead, markNotificationAsRead, notifications, unreadCount, user?.accessToken]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
}
