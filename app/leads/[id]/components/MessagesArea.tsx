"use client";

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { RotateCcw } from "lucide-react";

export interface MessageItem {
  id: number;
  text: string;
  direction: "inbound" | "outbound";
  time: string;
  timestamp: string;
  clientMessageId?: string;
  deliveryStatus?: "sending" | "sent" | "delivered" | "read" | "failed";
}

interface MessagesAreaProps {
  activeMessages: MessageItem[];
  hasOlderMessages?: boolean;
  isLoadingOlder?: boolean;
  onLoadOlderMessages?: () => void;
  onRetryMessage?: (message: MessageItem) => void | Promise<void>;
}

const BOTTOM_THRESHOLD_PX = 72;
const SAME_GROUP_GAP_MS = 5 * 60 * 1000;

function parseTimestampMs(timestamp: string): number {
  const value = Date.parse(timestamp);
  return Number.isFinite(value) ? value : 0;
}

function resolveTimeLabel(message: MessageItem): string {
  const parsed = parseTimestampMs(message.timestamp);
  if (parsed > 0) {
    return format(new Date(parsed), "h:mm a");
  }
  return message.time;
}

function resolveDeliveryLabel(status?: MessageItem["deliveryStatus"]): string {
  if (!status) return "";
  if (status === "sending") return "Sending…";
  if (status === "sent") return "Sent";
  if (status === "delivered") return "Delivered";
  if (status === "read") return "Read";
  return "Failed";
}

export function MessagesArea({
  activeMessages,
  hasOlderMessages = false,
  isLoadingOlder = false,
  onLoadOlderMessages,
  onRetryMessage,
}: MessagesAreaProps) {
  const todayFormatted = format(new Date(), "EEEE, MMMM do");
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const bottomAnchorRef = useRef<HTMLDivElement | null>(null);
  const nearBottomRef = useRef(true);
  const hasInitializedRef = useRef(false);
  const isLoadingOlderRef = useRef(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const previousRenderRef = useRef({
    firstKey: "",
    lastKey: "",
    length: 0,
    scrollHeight: 0,
    scrollTop: 0,
  });

  useEffect(() => {
    nearBottomRef.current = isNearBottom;
  }, [isNearBottom]);

  useEffect(() => {
    isLoadingOlderRef.current = isLoadingOlder;
  }, [isLoadingOlder]);

  const renderedMessages = useMemo(() => {
    const seen = new Set<string>();
    return activeMessages.filter((msg) => {
      const signature = `${msg.clientMessageId ?? ""}|${msg.id}|${msg.timestamp}|${msg.direction}|${msg.text}`;
      if (seen.has(signature)) {
        return false;
      }
      seen.add(signature);
      return true;
    });
  }, [activeMessages]);

  const groupedMessages = useMemo(() => {
    type Group = {
      groupId: string;
      direction: MessageItem["direction"];
      headerLabel: string;
      messages: MessageItem[];
    };

    const groups: Group[] = [];

    for (let index = 0; index < renderedMessages.length; index += 1) {
      const current = renderedMessages[index];
      const previous = renderedMessages[index - 1];
      const currentMs = parseTimestampMs(current.timestamp);
      const previousMs = previous ? parseTimestampMs(previous.timestamp) : 0;
      const withinGap = previous
        ? Math.abs(currentMs - previousMs) <= SAME_GROUP_GAP_MS
        : false;
      const sameDirection = previous?.direction === current.direction;
      const shouldMerge = Boolean(previous && sameDirection && withinGap);

      if (!shouldMerge) {
        const headerLabel = currentMs > 0
          ? format(new Date(currentMs), "MMM d, h:mm a")
          : current.time;

        groups.push({
          groupId: `${current.clientMessageId ?? current.id}-${index}`,
          direction: current.direction,
          headerLabel,
          messages: [current],
        });
        continue;
      }

      groups[groups.length - 1].messages.push(current);
    }

    return groups;
  }, [renderedMessages]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    bottomAnchorRef.current?.scrollIntoView({ behavior, block: "end" });
  }, []);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const distanceFromBottom = container.scrollHeight - (container.scrollTop + container.clientHeight);
    const nearBottom = distanceFromBottom <= BOTTOM_THRESHOLD_PX;
    setIsNearBottom(nearBottom);
    if (nearBottom) {
      setUnreadCount(0);
    }

    if (
      container.scrollTop <= 40
      && hasOlderMessages
      && onLoadOlderMessages
      && !isLoadingOlderRef.current
    ) {
      onLoadOlderMessages();
    }

    previousRenderRef.current = {
      ...previousRenderRef.current,
      scrollTop: container.scrollTop,
      scrollHeight: container.scrollHeight,
    };
  }, [hasOlderMessages, onLoadOlderMessages]);

  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const length = renderedMessages.length;
    const first = renderedMessages[0];
    const last = renderedMessages[length - 1];
    const currentFirstKey = first ? `${first.clientMessageId ?? first.id}-${first.timestamp}` : "";
    const currentLastKey = last ? `${last.clientMessageId ?? last.id}-${last.timestamp}` : "";

    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      scrollToBottom("auto");
      previousRenderRef.current = {
        firstKey: currentFirstKey,
        lastKey: currentLastKey,
        length,
        scrollHeight: container.scrollHeight,
        scrollTop: container.scrollTop,
      };
      return;
    }

    const previous = previousRenderRef.current;
    const grew = length > previous.length;
    const prependDetected = (
      grew
      && previous.lastKey === currentLastKey
      && previous.firstKey !== currentFirstKey
    );

    if (prependDetected) {
      const delta = container.scrollHeight - previous.scrollHeight;
      container.scrollTop = previous.scrollTop + delta;
    } else if (grew && previous.lastKey !== currentLastKey) {
      const newItems = length - previous.length;
      if (nearBottomRef.current) {
        scrollToBottom("smooth");
      } else {
        setUnreadCount((count) => count + Math.max(newItems, 1));
      }
    }

    previousRenderRef.current = {
      firstKey: currentFirstKey,
      lastKey: currentLastKey,
      length,
      scrollHeight: container.scrollHeight,
      scrollTop: container.scrollTop,
    };
  }, [renderedMessages, scrollToBottom]);

  return (
    <div className="relative flex-1 min-h-0">
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 bg-gradient-to-b from-background to-muted/35"
      >
        <div className="text-center">
          <span className="text-[11px] font-medium text-muted-foreground bg-card border border-border px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
            {todayFormatted}
          </span>
        </div>
        {isLoadingOlder && (
          <div className="text-center text-xs text-muted-foreground">Loading earlier messages…</div>
        )}
        {groupedMessages.length > 0 ? (
          groupedMessages.map((group) => {
            const lastMessage = group.messages[group.messages.length - 1];
            const deliveryLabel = group.direction === "outbound" ? resolveDeliveryLabel(lastMessage.deliveryStatus) : "";

            return (
              <div key={group.groupId} className="space-y-1.5">
                <div className="text-center text-[10px] uppercase tracking-wide text-muted-foreground">
                  {group.headerLabel}
                </div>
                <div className={`space-y-1 ${group.direction === "outbound" ? "items-end" : "items-start"}`}>
                  {group.messages.map((msg, messageIndex) => {
                    const isFirst = messageIndex === 0;
                    const isLast = messageIndex === group.messages.length - 1;

                    return (
                      <div
                        key={`${msg.clientMessageId ?? msg.id}-${msg.timestamp}-${messageIndex}`}
                        className={`flex items-end gap-2 ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}
                        title={resolveTimeLabel(msg)}
                      >
                        {msg.direction === "outbound" && msg.deliveryStatus === "failed" && onRetryMessage && (
                          <button
                            type="button"
                            onClick={() => {
                              void onRetryMessage(msg);
                            }}
                            className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                            aria-label="Retry failed message"
                            title="Retry"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <div
                          className={`group max-w-[85%] sm:max-w-[75%] lg:max-w-[60%] px-4 py-2.5 shadow-sm text-sm transition-colors ${
                            msg.direction === "outbound"
                              ? "bg-primary text-primary-foreground"
                              : "bg-card border border-border text-foreground"
                          } ${
                            msg.direction === "outbound"
                              ? `${isFirst ? "rounded-t-2xl" : "rounded-tl-2xl"} ${isLast ? "rounded-b-2xl rounded-tr-sm" : "rounded-bl-2xl"}`
                              : `${isFirst ? "rounded-t-2xl" : "rounded-tr-2xl"} ${isLast ? "rounded-b-2xl rounded-tl-sm" : "rounded-br-2xl"}`
                          }`}
                        >
                          {msg.text}
                          <div className="mt-1 text-[10px] opacity-0 group-hover:opacity-70 transition-opacity">
                            {resolveTimeLabel(msg)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {deliveryLabel && (
                    <div className={`px-1 text-[10px] text-muted-foreground ${group.direction === "outbound" ? "text-right" : "text-left"}`}>
                      {deliveryLabel}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center text-muted-foreground text-sm mt-10">
            No messages yet.
          </div>
        )}
        <div ref={bottomAnchorRef} />
      </div>
      {!isNearBottom && renderedMessages.length > 0 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
          <button
            type="button"
            onClick={() => {
              scrollToBottom("smooth");
              setUnreadCount(0);
            }}
            className="pointer-events-auto rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-foreground shadow-sm hover:bg-muted"
          >
            {unreadCount > 0 ? `Jump to latest (${unreadCount})` : "Jump to latest"}
          </button>
        </div>
      )}
    </div>
  );
}
