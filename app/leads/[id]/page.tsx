"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
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
let messagesByLeadCache: Record<number, MessageItem[]> | null = null;
let leadDetailsByIdCache: Record<number, LeadDetails> = {};

export default function ChatView() {
  const params = useParams();
  const activeIdNumber = Number(params.id);
  const isValidChatId = Number.isFinite(activeIdNumber) && activeIdNumber > 0;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isLoading, setIsLoading] = useState(
    !(leadsCache && messagesByLeadCache)
  );
  const [leads, setLeads] = useState<Lead[]>(() => leadsCache ?? []);
  const [messagesByLead, setMessagesByLead] = useState<Record<number, MessageItem[]>>(
    () => messagesByLeadCache ?? {}
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

  const inboxItems = useMemo(
    () =>
      leads.map((lead) => {
        const leadMessages = messagesByLead[lead.id] || [];
        const latestMessage = leadMessages[leadMessages.length - 1];
        return {
          ...lead,
          lastMessage: latestMessage?.text || "No messages yet",
          time: latestMessage?.time || "",
        };
      }),
    [leads, messagesByLead]
  );

  const fetchLeadDetails = async (leadId: number) => {
    if (leadDetailsByIdCache[leadId]) {
      setLeadDetailsById((prev) => ({ ...prev, [leadId]: leadDetailsByIdCache[leadId] }));
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/leads/${leadId}`);
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
    if (leadsCache && messagesByLeadCache) {
      setLeads(leadsCache);
      setMessagesByLead(messagesByLeadCache);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const leadsRes = await fetch(`${API_URL}/api/leads`);
      if (!leadsRes.ok) {
        throw new Error("Failed to fetch leads.");
      }

      const leadsData = (await leadsRes.json()) as Lead[];
  leadsCache = leadsData;
      setLeads(leadsData);

      const messageResults = await Promise.all(
        leadsData.map(async (lead) => {
          try {
            const messagesRes = await fetch(
              `${API_URL}/api/leads/${lead.id}/messages`
            );
            if (!messagesRes.ok) {
              return [lead.id, [] as MessageItem[]] as const;
            }
            const messagesData = (await messagesRes.json()) as MessageItem[];
            return [lead.id, messagesData] as const;
          } catch {
            return [lead.id, [] as MessageItem[]] as const;
          }
        })
      );

      const nextMessagesByLead = Object.fromEntries(messageResults);
      messagesByLeadCache = nextMessagesByLead;
      setMessagesByLead(nextMessagesByLead);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load leads."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Clear reply input on chat change
  useEffect(() => {
    setReplyText("");
  }, [activeIdNumber]);

  useEffect(() => {
    fetchLeadsAndMessages();
  }, []);

  useEffect(() => {
    if (isValidChatId) {
      fetchLeadDetails(activeIdNumber);
    }
  }, [activeIdNumber, isValidChatId]);

  return (
    <div className="flex h-full w-full bg-white overflow-hidden relative">
      {/* ================= LEFT COLUMN: INBOX ================= */}
      <InboxColumn
        isVisible={!isValidChatId}
        isLoading={isLoading}
        inboxItems={inboxItems}
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