"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  Lead,
  LeadDetails,
} from "./components/LeadDetailsForm";
import { InboxColumn } from "./components/InboxColumn";
import { ChatHeader } from "./components/ChatHeader";
import { MessagesArea, MessageItem } from "./components/MessagesArea";
import { MessageInput } from "./components/MessageInput";
import { LeadDetailsModal } from "./components/LeadDetailsModal";
import { ChatPlaceholder } from "./components/ChatPlaceholder";
import { RightDetailsPanel } from "./components/RightDetailsPanel";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

let leadsCache: Lead[] | null = null;
let messagesByLeadCache: Record<number, MessageItem[]> = {};
let leadDetailsByIdCache: Record<number, LeadDetails> = {};

type EngagementPayload = {
  engagedByUserId?: number | null;
  engagedByUsername?: string | null;
  isEngaged?: boolean;
};

type LeadListItemUpdate = Partial<Omit<Lead, "id">>;

function normalizeLead(raw: Lead & Record<string, unknown>): Lead {
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
    engagedByUserId,
    engagedByUsername,
    isEngaged,
  };
}

export default function ChatView() {
  const { user } = useAuth();
  const params = useParams();
  const activeIdNumber = Number(params.id);
  const isValidChatId = Number.isFinite(activeIdNumber) && activeIdNumber > 0;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>(() => leadsCache ?? []);
  const [messagesByLead, setMessagesByLead] = useState<Record<number, MessageItem[]>>(
    () => messagesByLeadCache
  );
  const [leadDetailsById, setLeadDetailsById] = useState<Record<number, LeadDetails>>(
    () => leadDetailsByIdCache
  );
  const [engagementError, setEngagementError] = useState<string | null>(null);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const activeChat = useMemo(
    () => leads.find((chat) => chat.id === activeIdNumber),
    [leads, activeIdNumber]
  );

  const upsertLead = useCallback((leadId: number, updates: LeadListItemUpdate) => {
    setLeads((prev) => {
      const existingIndex = prev.findIndex((lead) => lead.id === leadId);
      if (existingIndex === -1) {
        const appended: Lead = {
          id: leadId,
          igsid: updates.igsid ?? null,
          name: updates.name ?? "",
          status: updates.status ?? "new",
          email: updates.email ?? "",
          phone: updates.phone ?? "",
          lastActive: updates.lastActive ?? null,
          engagedByUserId: updates.engagedByUserId ?? null,
          engagedByUsername: updates.engagedByUsername ?? null,
          isEngaged: updates.isEngaged ?? false,
        };
        const nextLeads = [...prev, appended];
        leadsCache = nextLeads;
        return nextLeads;
      }

      const nextLeads = prev.map((lead) =>
        lead.id === leadId
          ? {
              ...lead,
              ...updates,
            }
          : lead
      );
      leadsCache = nextLeads;
      return nextLeads;
    });
  }, []);

  const resolvedActiveChat = useMemo(() => {
    if (activeChat) {
      return activeChat;
    }

    if (!isValidChatId) {
      return undefined;
    }

    const details = leadDetailsById[activeIdNumber];
    if (!details) {
      return undefined;
    }

    return {
      id: details.id,
      igsid: details.igsid,
      name: details.name,
      status: details.status,
      email: details.email,
      phone: details.phone,
      lastActive: null,
      engagedByUserId: details.engagedByUserId ?? null,
      engagedByUsername: details.engagedByUsername ?? null,
      isEngaged: details.isEngaged ?? false,
    } as Lead;
  }, [activeChat, activeIdNumber, isValidChatId, leadDetailsById]);
  
  const activeMessages = messagesByLead[activeIdNumber] || [];
  const activeLeadDetails = leadDetailsById[activeIdNumber] || {
    id: isValidChatId ? activeIdNumber : 0,
    igsid: resolvedActiveChat?.igsid || null,
    name: resolvedActiveChat?.name || "",
    status: resolvedActiveChat?.status || "new",
    email: resolvedActiveChat?.email || "",
    phone: resolvedActiveChat?.phone || "",
    metaEventFired: false,
    createdAt: new Date().toISOString(),
    engagedByUserId: resolvedActiveChat?.engagedByUserId ?? null,
    engagedByUsername: resolvedActiveChat?.engagedByUsername ?? null,
    isEngaged: resolvedActiveChat?.isEngaged ?? false,
  };

  const currentUserId = Number(user?.userId);

  const updateLeadEngagementState = useCallback((leadId: number, payload: EngagementPayload) => {
    setLeads((prev) => {
      const nextLeads = prev.map((lead) =>
        lead.id === leadId
          ? {
              ...lead,
              engagedByUserId: payload.engagedByUserId ?? null,
              engagedByUsername: payload.engagedByUsername ?? null,
              isEngaged: Boolean(payload.isEngaged),
            }
          : lead
      );
      leadsCache = nextLeads;
      return nextLeads;
    });

    setLeadDetailsById((prev) => {
      const existing = prev[leadId];
      if (!existing) return prev;
      const next = {
        ...prev,
        [leadId]: {
          ...existing,
          engagedByUserId: payload.engagedByUserId ?? null,
          engagedByUsername: payload.engagedByUsername ?? null,
          isEngaged: Boolean(payload.isEngaged),
        },
      };
      leadDetailsByIdCache = next;
      return next;
    });
  }, []);

  const fetchLeadDetails = useCallback(async (leadId: number, forceRefresh = false) => {
    const accessToken = user?.accessToken;
    if (!accessToken) {
      return;
    }

    if (!forceRefresh && leadDetailsByIdCache[leadId]) {
      setLeadDetailsById((prev) => ({ ...prev, [leadId]: leadDetailsByIdCache[leadId] }));
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/leads/${leadId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) return;
      const details = (await response.json()) as LeadDetails;
      leadDetailsByIdCache = { ...leadDetailsByIdCache, [leadId]: details };
      setLeadDetailsById((prev) => ({ ...prev, [leadId]: details }));
      upsertLead(leadId, {
        igsid: details.igsid,
        name: details.name || "",
        email: details.email || "",
        phone: details.phone || "",
        status: details.status,
        engagedByUserId: details.engagedByUserId ?? null,
        engagedByUsername: details.engagedByUsername ?? null,
        isEngaged: details.isEngaged ?? false,
      });
    } catch {
      // Silent fail; base lead data is already shown
    }
  }, [upsertLead, user?.accessToken]);

  const fetchLeadsAndMessages = async () => {
    setIsLoading(true);
    try {
      const leadsUrl = `${API_URL}/api/leads`;
      const accessToken = user?.accessToken;

      if (!accessToken) {
        setLeads([]);
        setMessagesByLead({});
        return;
      }

      const leadsRes = await fetch(leadsUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!leadsRes.ok) {
        throw new Error("Failed to fetch leads.");
      }

      const leadsData = (await leadsRes.json()) as Array<Lead & Record<string, unknown>>;
      const normalized = leadsData.map(normalizeLead);
      leadsCache = normalized;
      setLeads(normalized);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load leads."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const engageChat = useCallback(async (leadId: number) => {
    const accessToken = user?.accessToken;
    if (!accessToken || user?.role !== "sales_rep") {
      return;
    }

    if (!Number.isFinite(currentUserId)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/leads/${leadId}/assign`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const detail = errorData?.detail || "This chat is currently engaged by another sales rep.";
        setEngagementError(detail);
        return;
      }

      const result = (await response.json()) as EngagementPayload;
      updateLeadEngagementState(leadId, result);
      setEngagementError(null);
    } catch {
      setEngagementError("Unable to engage this chat right now.");
    }
  }, [currentUserId, updateLeadEngagementState, user?.accessToken, user?.role]);

  const releaseChat = useCallback(async (leadId: number) => {
    const accessToken = user?.accessToken;
    if (!accessToken || user?.role !== "sales_rep" || !Number.isFinite(currentUserId)) {
      return;
    }

    const cachedLead = leadsCache?.find((lead) => lead.id === leadId);
    const engagedByCurrentUser = cachedLead?.engagedByUserId === currentUserId;
    if (!engagedByCurrentUser) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/leads/${leadId}/release`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        return;
      }

      const result = (await response.json()) as EngagementPayload;
      updateLeadEngagementState(leadId, result);
    } catch {
      // Best-effort release on chat exit
    }
  }, [currentUserId, updateLeadEngagementState, user?.accessToken, user?.role]);

  const fetchMessagesForLead = useCallback(async (leadId: number, forceRefresh = false) => {
    const accessToken = user?.accessToken;
    if (!accessToken || !Number.isFinite(leadId) || leadId <= 0) {
      return;
    }

    if (!forceRefresh && messagesByLeadCache[leadId]) {
      setMessagesByLead((prev) => ({ ...prev, [leadId]: messagesByLeadCache[leadId] }));
      return;
    }

    try {
      const messagesRes = await fetch(`${API_URL}/api/leads/${leadId}/messages`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!messagesRes.ok) {
        setMessagesByLead((prev) => ({ ...prev, [leadId]: [] }));
        messagesByLeadCache = { ...messagesByLeadCache, [leadId]: [] };
        return;
      }

      const messagesData = (await messagesRes.json()) as MessageItem[];
      messagesByLeadCache = { ...messagesByLeadCache, [leadId]: messagesData };
      setMessagesByLead((prev) => ({ ...prev, [leadId]: messagesData }));
    } catch {
      setMessagesByLead((prev) => ({ ...prev, [leadId]: [] }));
      messagesByLeadCache = { ...messagesByLeadCache, [leadId]: [] };
    }
  }, [user?.accessToken]);

  const sendCustomMessage = useCallback(async (text: string) => {
    const accessToken = user?.accessToken;
    if (!accessToken || !isValidChatId) {
      return;
    }

    setIsSendingMessage(true);
    try {
      const response = await fetch(`${API_URL}/api/leads/${activeIdNumber}/messages/custom`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ message_text: text }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const detail = errorData?.detail || "Failed to send message.";
        throw new Error(detail);
      }

      await response.json().catch(() => null);

      await fetchMessagesForLead(activeIdNumber);

      setReplyText("");
      toast.success("Message sent.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send message.");
    } finally {
      setIsSendingMessage(false);
    }
  }, [activeIdNumber, fetchMessagesForLead, isValidChatId, user?.accessToken]);

  // Clear reply input on chat change
  useEffect(() => {
    setReplyText("");
  }, [activeIdNumber]);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      setLeads([]);
      setMessagesByLead({});
      return;
    }

    fetchLeadsAndMessages();
  }, [user?.role, user?.userId, user?.accessToken]);

  useEffect(() => {
    if (isValidChatId) {
      fetchMessagesForLead(activeIdNumber, true);
      fetchLeadDetails(activeIdNumber, true);
    }
  }, [activeIdNumber, isValidChatId, user?.accessToken]);

  useEffect(() => {
    if (!isValidChatId || !user?.accessToken) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void fetchMessagesForLead(activeIdNumber, true);
      void fetchLeadDetails(activeIdNumber, true);
    }, 3000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [activeIdNumber, fetchMessagesForLead, isValidChatId, user?.accessToken]);

  useEffect(() => {
    if (!isValidChatId || user?.role !== "sales_rep") {
      setEngagementError(null);
      return;
    }

    if (!Number.isFinite(currentUserId)) {
      setEngagementError("Invalid user session. Please sign in again.");
      return;
    }

    void engageChat(activeIdNumber);

    return () => {
      void releaseChat(activeIdNumber);
    };
  }, [activeIdNumber, currentUserId, engageChat, isValidChatId, releaseChat, user?.accessToken, user?.role]);

  if (isLoading) {
    return (
      <div className="flex h-full w-full bg-card overflow-hidden relative border border-border/70 rounded-2xl">
        <div className="w-full md:w-80 border-r border-border bg-card shrink-0 flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="h-5 w-28 bg-muted rounded animate-pulse" />
            <div className="h-9 mt-3 w-full bg-muted/80 rounded-lg animate-pulse" />
          </div>
          <div className="p-4 space-y-3">
            <div className="h-12 w-full bg-muted/80 rounded-lg animate-pulse" />
            <div className="h-12 w-full bg-muted/80 rounded-lg animate-pulse" />
            <div className="h-12 w-full bg-muted/80 rounded-lg animate-pulse" />
          </div>
        </div>
        <div className="hidden md:flex flex-1 items-center justify-center bg-background/60 text-sm text-muted-foreground">
          Loading conversation...
        </div>
      </div>
    );
  }

  if (isValidChatId && !resolvedActiveChat) {
    return (
      <div className="flex h-full w-full bg-card overflow-hidden relative border border-border/70 rounded-2xl">
        <div className="flex-1 flex items-center justify-center bg-background/60 p-6 text-center">
          <div>
            <p className="text-base font-semibold text-foreground">Chat not found</p>
            <p className="text-sm text-muted-foreground mt-1">This lead is unavailable or was removed.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full bg-card overflow-hidden relative border border-border/70 rounded-2xl">
      {/* ================= LEFT COLUMN: INBOX ================= */}
      <InboxColumn
        isVisible={!isValidChatId}
        activeId={activeIdNumber}
      />

      {/* ================= MIDDLE COLUMN: CHAT INTERFACE / PLACEHOLDER ================= */}
      <div
        className={`flex-1 flex-col bg-background/60 min-w-0 w-full flex`}
      >
        <ChatPlaceholder isVisible={!isValidChatId} />

        {isValidChatId && (
          <>
            <ChatHeader
              activeChat={resolvedActiveChat}
              onInfoClick={() => setIsModalOpen(true)}
              engagementLabel={
                `Owner: ${resolvedActiveChat?.engagedByUsername || "Unassigned"} • ${
                  resolvedActiveChat?.isEngaged ? "Occupied" : "Unoccupied"
                }`
              }
            />
            {engagementError && (
              <div className="mx-3 sm:mx-6 mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {engagementError}
              </div>
            )}
            <MessagesArea activeMessages={activeMessages} />
            <MessageInput
              replyText={replyText}
              onReplyTextChange={setReplyText}
              onSendMessage={sendCustomMessage}
              isSending={isSendingMessage}
            />
          </>
        )}
      </div>

      {/* ================= RIGHT COLUMN: DESKTOP DETAILS ================= */}
      <RightDetailsPanel
        isVisible={isValidChatId && !!resolvedActiveChat}
        activeChat={resolvedActiveChat}
        leadDetails={activeLeadDetails}
        onLeadUpdated={(updatedLead) => {
          leadDetailsByIdCache = {
            ...leadDetailsByIdCache,
            [updatedLead.id]: updatedLead,
          };
          setLeadDetailsById((prev) => ({
            ...prev,
            [updatedLead.id]: updatedLead,
          }));
          upsertLead(updatedLead.id, {
            name: updatedLead.name,
            status: updatedLead.status,
            email: updatedLead.email,
            phone: updatedLead.phone,
            igsid: updatedLead.igsid,
            engagedByUserId: updatedLead.engagedByUserId ?? null,
            engagedByUsername: updatedLead.engagedByUsername ?? null,
            isEngaged: updatedLead.isEngaged ?? false,
          });
        }}
      />

      {/* ================= MODAL: TABLET & MOBILE DETAILS ================= */}
      <LeadDetailsModal
        isOpen={isModalOpen}
        activeChat={resolvedActiveChat}
        leadDetails={activeLeadDetails}
        onClose={() => setIsModalOpen(false)}
        onLeadUpdated={(updatedLead) => {
          leadDetailsByIdCache = {
            ...leadDetailsByIdCache,
            [updatedLead.id]: updatedLead,
          };
          setLeadDetailsById((prev) => ({
            ...prev,
            [updatedLead.id]: updatedLead,
          }));
          upsertLead(updatedLead.id, {
            name: updatedLead.name,
            status: updatedLead.status,
            email: updatedLead.email,
            phone: updatedLead.phone,
            igsid: updatedLead.igsid,
            engagedByUserId: updatedLead.engagedByUserId ?? null,
            engagedByUsername: updatedLead.engagedByUsername ?? null,
            isEngaged: updatedLead.isEngaged ?? false,
          });
        }}
      />
    </div>
  );
}