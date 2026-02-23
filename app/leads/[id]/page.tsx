"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  LeadDetailsForm,
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

export default function ChatView() {
  const params = useParams();
  const activeId = params.id as string;
  
  // Create a flag to verify we have an ID and it isn't the "active" slug
  const isValidChatId = Boolean(activeId && activeId !== "active");
  const activeIdNumber = Number(activeId); // Will safely become NaN if "active", which we handle below

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [messagesByLead, setMessagesByLead] = useState<Record<number, MessageItem[]>>({});
  const [leadDetailsById, setLeadDetailsById] = useState<Record<number, LeadDetails>>({});

  const activeChat = useMemo(
    () => leads.find((chat) => chat.id === activeIdNumber),
    [leads, activeIdNumber]
  );
  
  const activeMessages = messagesByLead[activeIdNumber] || [];
  const activeLeadDetails = leadDetailsById[activeIdNumber] || {
    id: activeIdNumber,
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
    try {
      const response = await fetch(`${API_URL}/api/leads/${leadId}`);
      if (!response.ok) return;
      const details = (await response.json()) as LeadDetails;
      setLeadDetailsById((prev) => ({ ...prev, [leadId]: details }));
      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === leadId
            ? {
                ...lead,
                email: details.email || "",
                phone: details.phone || "",
                status: details.status,
              }
            : lead
        )
      );
    } catch {
      // Silent fail; base lead data is already shown
    }
  };

  const fetchLeadsAndMessages = async () => {
    setIsLoading(true);
    try {
      const leadsRes = await fetch(`${API_URL}/api/leads`);
      if (!leadsRes.ok) {
        throw new Error("Failed to fetch leads.");
      }

      const leadsData = (await leadsRes.json()) as Lead[];
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

      setMessagesByLead(Object.fromEntries(messageResults));
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
  }, [activeId]);

  useEffect(() => {
    fetchLeadsAndMessages();
  }, []);

  useEffect(() => {
    // Number.isFinite catches NaN (which activeIdNumber will be if activeId is "active")
    if (Number.isFinite(activeIdNumber) && activeIdNumber > 0) {
      fetchLeadDetails(activeIdNumber);
    }
  }, [activeIdNumber]);

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
          setLeadDetailsById((prev) => ({
            ...prev,
            [updatedLead.id]: updatedLead,
          }));
          setLeads((prev) =>
            prev.map((lead) =>
              lead.id === updatedLead.id
                ? {
                    ...lead,
                    status: updatedLead.status,
                    email: updatedLead.email,
                    phone: updatedLead.phone,
                  }
                : lead
            )
          );
        }}
      />

      {/* ================= MODAL: TABLET & MOBILE DETAILS ================= */}
      <LeadDetailsModal
        isOpen={isModalOpen}
        activeChat={activeChat}
        leadDetails={activeLeadDetails}
        onClose={() => setIsModalOpen(false)}
        onLeadUpdated={(updatedLead) => {
          setLeadDetailsById((prev) => ({
            ...prev,
            [updatedLead.id]: updatedLead,
          }));
          setLeads((prev) =>
            prev.map((lead) =>
              lead.id === updatedLead.id
                ? {
                    ...lead,
                    status: updatedLead.status,
                    email: updatedLead.email,
                    phone: updatedLead.phone,
                  }
                : lead
            )
          );
        }}
      />
    </div>
  );
}