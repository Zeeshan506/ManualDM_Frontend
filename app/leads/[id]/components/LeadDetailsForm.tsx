"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Mail, Phone, User, CheckCircle2, Link2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

export interface Lead {
  id: number;
  igsid: string | null;
  name: string;
  status: string;
  email: string;
  phone: string;
  lastActive: string | null;
  engagedByUserId?: number | null;
  engagedByUsername?: string | null;
  isEngaged?: boolean;
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
  engagedByUserId?: number | null;
  engagedByUsername?: string | null;
  isEngaged?: boolean;
}

interface LeadDetailsFormProps {
  activeChat: Lead;
  leadDetails: LeadDetails;
  onSaveSuccess?: () => void;
  onLeadUpdated?: (lead: LeadDetails) => void;
}

type PaymentOption = "custom" | "stripe";

export function LeadDetailsForm({
  activeChat,
  leadDetails,
  onSaveSuccess,
  onLeadUpdated,
}: LeadDetailsFormProps) {
  const { user } = useAuth();
  const [nameInput, setNameInput] = useState(leadDetails.name);
  const [emailInput, setEmailInput] = useState(leadDetails.email);
  const [phoneInput, setPhoneInput] = useState(leadDetails.phone);
  const [isSaving, setIsSaving] = useState(false);
  const [paymentOption, setPaymentOption] = useState<PaymentOption>("custom");
  const [generatedPaymentLink, setGeneratedPaymentLink] = useState("");
  const [customPaymentAmount, setCustomPaymentAmount] = useState("");
  const [customPaymentCurrency, setCustomPaymentCurrency] = useState("USD");
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  useEffect(() => {
    setNameInput(leadDetails.name);
    setEmailInput(leadDetails.email);
    setPhoneInput(leadDetails.phone);
    setPaymentOption("custom");
    setGeneratedPaymentLink("");
    setCustomPaymentAmount("");
    setCustomPaymentCurrency("USD");
  }, [leadDetails]);

  const handleGeneratePaymentLink = () => {
    const optionKey = paymentOption === "custom" ? "custom" : "stripe";
    const generatedLink = `https://payments.example.com/lead/${activeChat.id}?option=${optionKey}`;
    setGeneratedPaymentLink(generatedLink);
    toast.success("Payment link generated (frontend preview only)");
  };

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

      const result = (await response.json()) as {
        leadsubmitted_event_id?: number | null;
      };

      const detailsRes = await fetch(`${API_URL}/api/leads/${activeChat.id}`);
      if (detailsRes.ok) {
        const updatedLead = (await detailsRes.json()) as LeadDetails;
        onLeadUpdated?.(updatedLead);
      }

      toast.success("Lead details updated successfully!");
      if (result.leadsubmitted_event_id != null) {
        toast.info("LeadSubmitted event queued for Meta CAPI.");
      }
      onSaveSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update lead details."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmCustomPayment = async () => {
    const accessToken = user?.accessToken;
    if (!accessToken) {
      toast.error("Authentication required");
      return;
    }

    const currency = customPaymentCurrency.trim().toUpperCase();
    if (currency.length !== 3 || !/^[A-Z]{3}$/.test(currency)) {
      toast.error("Currency must be a 3-letter ISO code");
      return;
    }

    const amount = Number(customPaymentAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    setIsSubmittingPayment(true);
    try {
      const response = await fetch(
        `${API_URL}/api/leads/${activeChat.id}/payments/custom`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            amount,
            currency,
            send_now: true,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || "Failed to create payment");
      }

      const result = (await response.json()) as {
        queued_for_meta?: boolean;
        meta_event_id?: number;
      };

      toast.success("Payment recorded successfully");
      if (result.queued_for_meta) {
        toast.info(`Purchase event queued to Meta (event #${result.meta_event_id})`);
      }

      setCustomPaymentAmount("");

      const detailsRes = await fetch(`${API_URL}/api/leads/${activeChat.id}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (detailsRes.ok) {
        const updatedLead = (await detailsRes.json()) as LeadDetails;
        onLeadUpdated?.(updatedLead);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create payment");
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Profile Summary */}
      <div className="p-4 sm:p-6 border-b border-border flex flex-col items-center text-center">
        <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-full bg-primary/12 border-2 border-primary/25 shadow-md flex items-center justify-center mb-2 sm:mb-3">
          <User className="w-6 sm:w-8 h-6 sm:h-8 text-primary" />
        </div>
        <h2 className="font-bold text-card-foreground text-base sm:text-lg">
          {activeChat.name || "Unknown User"}
        </h2>
        <span className="text-[10px] sm:text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded mt-1 sm:mt-2">
          {activeChat.igsid}
        </span>
      </div>

      {/* Contact Form */}
      <div className="p-4 sm:p-6 flex-1 pb-10">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <label className="block text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
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
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Custom Name"
              className="w-full pl-9 pr-3 py-2 sm:py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-sm shadow-sm"
            />
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="Email Address"
              className="w-full pl-9 pr-3 py-2 sm:py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-sm shadow-sm"
            />
          </div>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="tel"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="Phone Number"
              className="w-full pl-9 pr-3 py-2 sm:py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-sm shadow-sm"
            />
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={handleUpdateContactInfo}
            disabled={isSaving}
            className="w-full py-2 sm:py-2.5 bg-primary hover:opacity-90 text-primary-foreground font-medium rounded-lg shadow-sm transition-colors flex justify-center items-center gap-2 text-sm"
          >
            {isSaving ? "Saving..." : "Save Data & Sync Meta"}
          </button>
          <p className="text-[9px] sm:text-[11px] text-center text-muted-foreground mt-3 leading-tight">
            <strong>LeadSubmitted</strong> is queued only when both email and
            phone are available.
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-border">
          <label className="block text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Payment Settings
          </label>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setPaymentOption("custom")}
              className={`w-full text-left rounded-lg border px-3 py-2 text-sm transition-colors ${
                paymentOption === "custom"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-foreground"
              }`}
            >
              Custom Payments
            </button>

            <button
              type="button"
              onClick={() => setPaymentOption("stripe")}
              className={`w-full text-left rounded-lg border px-3 py-2 text-sm transition-colors flex items-center justify-between ${
                paymentOption === "stripe"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-foreground"
              }`}
            >
              <span>Stripe Payments</span>
              <span className="text-[10px] font-semibold text-muted-foreground">Future</span>
            </button>
          </div>

          {paymentOption === "custom" ? (
            <div className="mt-4 rounded-lg border border-border bg-muted/45 p-3 space-y-3">
              <p className="text-xs sm:text-sm font-medium text-foreground">Custom Payment</p>

              <div>
                <label className="block text-[11px] sm:text-xs text-muted-foreground mb-1">Currency</label>
                <input
                  type="text"
                  value={customPaymentCurrency}
                  maxLength={3}
                  onChange={(e) => setCustomPaymentCurrency(e.target.value.toUpperCase())}
                  placeholder="USD"
                  className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs text-muted-foreground mb-1">Amount</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={customPaymentAmount}
                  onChange={(e) => setCustomPaymentAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <button
                type="button"
                onClick={handleConfirmCustomPayment}
                disabled={isSubmittingPayment}
                className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
              >
                {isSubmittingPayment ? "Confirming..." : "Confirm Payment"}
              </button>
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-border bg-muted/45 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs sm:text-sm font-medium text-foreground">Generate Link</p>
                <button
                  type="button"
                  onClick={handleGeneratePaymentLink}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  Generate Link
                </button>
              </div>

              {generatedPaymentLink ? (
                <div className="mt-3 rounded-md border border-border bg-background px-2.5 py-2 text-[11px] sm:text-xs text-foreground break-all">
                  {generatedPaymentLink}
                </div>
              ) : (
                <p className="mt-3 text-[11px] sm:text-xs text-muted-foreground">
                  Stripe payment links are placeholder-only for now.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
