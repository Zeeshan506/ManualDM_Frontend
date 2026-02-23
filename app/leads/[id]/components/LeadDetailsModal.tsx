"use client";

import React from "react";
import { X } from "lucide-react";
import { LeadDetailsForm, Lead, LeadDetails } from "./LeadDetailsForm";

interface LeadDetailsModalProps {
  isOpen: boolean;
  activeChat: Lead | undefined;
  leadDetails: LeadDetails;
  onClose: () => void;
  onLeadUpdated?: (lead: LeadDetails) => void;
}

export function LeadDetailsModal({
  isOpen,
  activeChat,
  leadDetails,
  onClose,
  onLeadUpdated,
}: LeadDetailsModalProps) {
  if (!isOpen || !activeChat) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 lg:hidden">
      {/* Modal Background click to close */}
      <div className="absolute inset-0" onClick={onClose}></div>

      <div className="relative w-full max-w-md bg-white sm:rounded-2xl rounded-t-2xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Lead Information</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <LeadDetailsForm
          activeChat={activeChat}
          leadDetails={leadDetails}
          onSaveSuccess={onClose}
          onLeadUpdated={onLeadUpdated}
        />
      </div>
    </div>
  );
}
