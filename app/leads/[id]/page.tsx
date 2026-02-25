"use client";

import React, { useState, useEffect, useMemo } from "react";
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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

let leadsCache: Lead[] | null = null;
let messagesByLeadCache: Record<number, MessageItem[]> = {};
let leadDetailsByIdCache: Record<number, LeadDetails> = {};

export default function ChatView() {
  const { user } = useAuth();
  const params = useParams();
  const activeIdNumber = Number(params.id);
  const isValidChatId = Number.isFinite(activeIdNumber) && activeIdNumber > 0;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isLoading, setIsLoading] = useState(
    !leadsCache
  );
  const [leads, setLeads] = useState<Lead[]>(() => leadsCache ?? []);
  const [messagesByLead, setMessagesByLead] = useState<Record<number, MessageItem[]>>(
    () => messagesByLeadCache
  );
  const [leadDetailsById, setLeadDetailsById] = useState<Record<number, LeadDetails>>(
    () => leadDetailsByIdCache
  );

  const activeChat = useMemo(
    () => leads.find((chat) => chat.id === activeIdNumber),
    [leads, activeIdNumber]
  );
  
  const activeMessages = messagesByLead[activeIdNumber] || [];
  const activeLeadDetails = leadDetailsById[activeIdNumber] || {
    id: isValidChatId ? activeIdNumber : 0,
    igsid: activeChat?.igsid || null,
    name: activeChat?.name || "",
    status: activeChat?.status || "new",
    email: activeChat?.email || "",
    phone: activeChat?.phone || "",
    metaEventFired: false,
    createdAt: new Date().toISOString(),
  };

  const fetchLeadDetails = async (leadId: number) => {
    const accessToken = user?.accessToken;
    if (!accessToken) {
      return;
    }

    if (leadDetailsByIdCache[leadId]) {
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
      setLeads((prev) => {
        const nextLeads = prev.map((lead) =>
          lead.id === leadId
            ? {
                ...lead,
                name: details.name || "",
                email: details.email || "",
                phone: details.phone || "",
                status: details.status,
              }
            : lead
        );
        leadsCache = nextLeads;
        return nextLeads;
      });
    } catch {
      // Silent fail; base lead data is already shown
    }
  };

  const fetchLeadsAndMessages = async () => {
    if (leadsCache) {
      setLeads(leadsCache);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      let leadsUrl = `${API_URL}/api/leads`;
      const accessToken = user?.accessToken;
      const currentUserId = Number(user?.userId);

      if (!accessToken) {
        setLeads([]);
        setMessagesByLead({});
        return;
      }

      if (user?.role === "sales_rep") {
        if (!Number.isFinite(currentUserId)) {
          setLeads([]);
          setMessagesByLead({});
          return;
        }
        leadsUrl += `?assigned_to=${currentUserId}`;
      }

      const leadsRes = await fetch(leadsUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!leadsRes.ok) {
        throw new Error("Failed to fetch leads.");
      }

      const leadsData = (await leadsRes.json()) as Lead[];
      leadsCache = leadsData;
      setLeads(leadsData);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load leads."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessagesForLead = async (leadId: number) => {
    const accessToken = user?.accessToken;
    if (!accessToken || !Number.isFinite(leadId) || leadId <= 0) {
      return;
    }

    if (messagesByLeadCache[leadId]) {
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
  };

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
      fetchMessagesForLead(activeIdNumber);
      fetchLeadDetails(activeIdNumber);
    }
  }, [activeIdNumber, isValidChatId, user?.accessToken]);

  return (
    <div className="flex h-full w-full bg-white overflow-hidden relative">
      {/* ================= LEFT COLUMN: INBOX ================= */}
      <InboxColumn
        isVisible={!isValidChatId}
        activeId={activeIdNumber}
      />

      {/* ================= MIDDLE COLUMN: CHAT INTERFACE / PLACEHOLDER ================= */}
      <div
        className={`flex-1 flex-col bg-[#F9FAFB] min-w-0 w-full flex`}
      >
        <ChatPlaceholder isVisible={!isValidChatId} />

        {isValidChatId && (
          <>
            <ChatHeader
              activeChat={activeChat}
              onInfoClick={() => setIsModalOpen(true)}
            />
            <MessagesArea activeMessages={activeMessages} />
            <MessageInput
              replyText={replyText}
              onReplyTextChange={setReplyText}
            />
          </>
        )}
      </div>

      {/* ================= RIGHT COLUMN: DESKTOP DETAILS ================= */}
      <RightDetailsPanel
        isVisible={isValidChatId && !!activeChat}
        activeChat={activeChat}
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
          setLeads((prev) => {
            const nextLeads = prev.map((lead) =>
              lead.id === updatedLead.id
                ? {
                    ...lead,
                    name: updatedLead.name,
                    status: updatedLead.status,
                    email: updatedLead.email,
                    phone: updatedLead.phone,
                  }
                : lead
            );
            leadsCache = nextLeads;
            return nextLeads;
          });
        }}
      />

      {/* ================= MODAL: TABLET & MOBILE DETAILS ================= */}
      <LeadDetailsModal
        isOpen={isModalOpen}
        activeChat={activeChat}
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
          setLeads((prev) => {
            const nextLeads = prev.map((lead) =>
              lead.id === updatedLead.id
                ? {
                    ...lead,
                    name: updatedLead.name,
                    status: updatedLead.status,
                    email: updatedLead.email,
                    phone: updatedLead.phone,
                  }
                : lead
            );
            leadsCache = nextLeads;
            return nextLeads;
          });
        }}
      />
    </div>
  );
}