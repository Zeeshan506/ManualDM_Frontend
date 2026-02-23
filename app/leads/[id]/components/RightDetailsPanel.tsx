"use client";

import React from "react";
import { LeadDetailsForm, Lead, LeadDetails } from "./LeadDetailsForm";

interface RightDetailsPanelProps {
  isVisible: boolean;
  activeChat: Lead | undefined;
  leadDetails: LeadDetails;
  onLeadUpdated?: (lead: LeadDetails) => void;
}

export function RightDetailsPanel({
  isVisible,
  activeChat,
  leadDetails,
  onLeadUpdated,
}: RightDetailsPanelProps) {
  if (!isVisible || !activeChat) return null;

  return (
    <div className="hidden lg:flex w-80 bg-white border-l border-gray-200 flex-col shrink-0 shadow-[-4px_0_24px_-16px_rgba(0,0,0,0.1)] z-20">
      <LeadDetailsForm
        activeChat={activeChat}
        leadDetails={leadDetails}
        onLeadUpdated={onLeadUpdated}
      />
    </div>
  );
}
