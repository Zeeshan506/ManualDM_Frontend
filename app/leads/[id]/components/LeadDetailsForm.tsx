"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Mail, Phone, User, CheckCircle2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Lead {
  id: number;
  igsid: string | null;
  name: string;
  status: string;
  email: string;
  phone: string;
  lastActive: string | null;
}

export interface LeadDetails {
  id: number;
  igsid: string | null;
  name: string;
  status: string;
  email: string;
  phone: string;
  metaEventFired: boolean;
  createdAt: string;
}

interface LeadDetailsFormProps {
  activeChat: Lead;
  leadDetails: LeadDetails;
  onSaveSuccess?: () => void;
  onLeadUpdated?: (lead: LeadDetails) => void;
}

export function LeadDetailsForm({
  activeChat,
  leadDetails,
  onSaveSuccess,
  onLeadUpdated,
}: LeadDetailsFormProps) {
  const [nameInput, setNameInput] = useState(leadDetails.name);
  const [emailInput, setEmailInput] = useState(leadDetails.email);
  const [phoneInput, setPhoneInput] = useState(leadDetails.phone);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setNameInput(leadDetails.name);
    setEmailInput(leadDetails.email);
    setPhoneInput(leadDetails.phone);
  }, [leadDetails]);

  const handleUpdateContactInfo = async () => {
    if (!nameInput.trim() && !emailInput && !phoneInput) {
      toast.error("Please provide a custom name, email, or phone number.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(
        `${API_URL}/leads/${activeChat.id}/contact-details`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: nameInput.trim() || null,
            email: emailInput || null,
            phone: phoneInput || null,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || "Failed to update lead details.");
      }

      const detailsRes = await fetch(`${API_URL}/api/leads/${activeChat.id}`);
      if (detailsRes.ok) {
        const updatedLead = (await detailsRes.json()) as LeadDetails;
        onLeadUpdated?.(updatedLead);
      }

      toast.success("Lead details updated successfully!");
      toast.info("LeadSubmitted event queued for Meta CAPI.");
      onSaveSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update lead details."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Profile Summary */}
      <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col items-center text-center">
        <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 border-2 border-white shadow-md flex items-center justify-center mb-2 sm:mb-3">
          <User className="w-6 sm:w-8 h-6 sm:h-8 text-indigo-400" />
        </div>
        <h2 className="font-bold text-gray-900 text-base sm:text-lg">
          {activeChat.name || "Unknown User"}
        </h2>
        <span className="text-[10px] sm:text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded mt-1 sm:mt-2">
          {activeChat.igsid}
        </span>
      </div>

      {/* Contact Form */}
      <div className="p-4 sm:p-6 flex-1 pb-10">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <label className="block text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Contact Details
          </label>
          {leadDetails.metaEventFired && (
            <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-3 h-3" /> CAPI SYNCED
            </span>
          )}
        </div>

        <div className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Custom Name"
              className="w-full pl-9 pr-3 py-2 sm:py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm"
            />
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="Email Address"
              className="w-full pl-9 pr-3 py-2 sm:py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm"
            />
          </div>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="tel"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="Phone Number"
              className="w-full pl-9 pr-3 py-2 sm:py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm"
            />
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={handleUpdateContactInfo}
            disabled={isSaving}
            className="w-full py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors flex justify-center items-center gap-2 text-sm"
          >
            {isSaving ? "Saving..." : "Save Data & Sync Meta"}
          </button>
          <p className="text-[9px] sm:text-[11px] text-center text-gray-400 mt-3 leading-tight">
            Saving triggers the <strong>LeadSubmitted</strong> Conversion API
            event.
          </p>
        </div>
      </div>
    </div>
  );
}
