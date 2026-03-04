"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { 
  Search, 
  Filter, 
  MessageSquare, 
  Plus, 
  Mail, 
  Phone,
  User,
  X
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api-client";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

interface Lead {
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

export default function LeadsDirectory() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");

  // Fetch leads from backend
  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = `${API_URL}/api/leads`;
      const accessToken = user?.accessToken;

      if (!accessToken) {
        setLeads([]);
        return;
      }

      const res = await apiFetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        timeoutMs: 10000,
        minIntervalMs: 700,
        retry: { retries: 1 },
        throttleKey: "leads:list:directory",
      });
      if (!res.ok) throw new Error("Failed to fetch leads");
      const data = (await res.json()) as Array<Lead & Record<string, unknown>>;
      const normalized = data.map(normalizeLead);
      setLeads(normalized);

      if (user?.role === "sales_rep" && normalized.length > 0) {
        const sample = data[0];
        const hasNewEngagementKeys = "isEngaged" in sample || "engagedByUserId" in sample || "engagedByUsername" in sample;
        if (!hasNewEngagementKeys) {
          toast.warning("Backend appears outdated: engagement status fields are missing.");
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load leads from the server.");
    } finally {
      setIsLoading(false);
    }
  }, [user?.accessToken, user?.role]);

  useEffect(() => {
    if (!user) {
      setLeads([]);
      setIsLoading(false);
      return;
    }

    void fetchLeads();
  }, [fetchLeads, user]);

  // Filtering Logic
  const filteredLeads = leads.filter((lead) => {
    const matchName = lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchIg = lead.igsid?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchEmail = lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchesSearch = matchName || matchIg || matchEmail;
    
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getOwnershipBadgeLabel = (lead: Lead) => {
    const owner = lead.engagedByUsername ? `Owner: ${lead.engagedByUsername}` : "Owner: Unassigned";
    const occupancy = lead.isEngaged ? "Occupied" : "Unoccupied";
    return `${owner} • ${occupancy}`;
  };

  // Open Modal Handler
  const handleOpenModal = (e: React.MouseEvent, lead: Lead) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveLead(lead);
    setNameInput(lead.name || "");
    setEmailInput(lead.email || "");
    setPhoneInput(lead.phone || "");
    setIsModalOpen(true);
  };

  // Submit Handler for the Modal
  const handleSubmitContactInfo = async () => {
    if (!activeLead) return;
    
    try {
      const res = await apiFetch(`${API_URL}/api/leads/${activeLead.id}/contact-details`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(user?.accessToken ? { Authorization: `Bearer ${user.accessToken}` } : {}),
        },
        body: JSON.stringify({ 
          name: nameInput.trim() || null,
          email: emailInput || null, 
          phone: phoneInput || null 
        }),
        timeoutMs: 10000,
        minIntervalMs: 250,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to update lead");
      }

      const result = (await res.json()) as {
        leadsubmitted_event_id?: number | null;
      };

      toast.success(`Contact info saved for ${activeLead.name || activeLead.igsid}`);
      if (result.leadsubmitted_event_id != null) {
        toast.info("LeadSubmitted event queued for Meta CAPI.");
      }
      
      setIsModalOpen(false);
      void fetchLeads(); // Refresh the list to reflect updates
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update lead";
      toast.error(message);
    }
  };

  // Helper for Status Pills
  const getStatusStyles = (status: string) => {
    switch(status) {
      case "new": return "bg-muted text-muted-foreground border-border";
      case "invoiced": return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "paid": return "bg-green-50 text-green-700 border-green-200";
      case "cancelled": return "bg-red-50 text-red-700 border-red-200";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full overflow-y-auto w-full relative">
      {/* ... HEADER & TOOLBAR HTML REMAINS EXACTLY THE SAME ... */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1">All Leads</h1>
        <p className="text-sm text-muted-foreground mb-6">Manage and update all incoming Meta contacts.</p>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="relative w-full sm:flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text"
              placeholder="Search by name, ID, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all shadow-sm"
            />
          </div>
          <div className="flex w-full sm:w-auto gap-3">
            <div className="relative w-full sm:w-auto">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto appearance-none pl-10 pr-8 py-2 bg-card border border-border rounded-lg text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring shadow-sm cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="new">New</option>
                <option value="invoiced">Invoiced</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Loading leads...</div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No leads found matching your criteria.</div>
        ) : (
          <>
            <div className="divide-y divide-border/70 md:hidden">
              {filteredLeads.map((lead) => (
                <Link
                  href={`/leads/${lead.id}`}
                  key={lead.id}
                  className="block p-4 hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-primary/12 border border-primary/25 flex items-center justify-center shrink-0">
                        {lead.name ? (
                          <span className="text-sm font-bold text-primary">{lead.name.charAt(0)}</span>
                        ) : (
                          <User className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{lead.name || "Unknown User"}</p>
                        <p className="text-xs text-muted-foreground truncate font-mono">{lead.igsid}</p>
                        <span className={`inline-flex mt-1 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${lead.isEngaged ? "border-amber-200 bg-amber-50 text-amber-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                          {getOwnershipBadgeLabel(lead)}
                        </span>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full border shrink-0 ${getStatusStyles(lead.status)}`}>
                      {lead.status}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                      {lead.email ? (
                        <span className="text-foreground truncate">{lead.email}</span>
                      ) : (
                        <span className="text-muted-foreground italic">No email</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                      {lead.phone ? (
                        <span className="text-foreground truncate">{lead.phone}</span>
                      ) : (
                        <span className="text-muted-foreground italic">No phone</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {lead.lastActive
                        ? formatDistanceToNow(new Date(lead.lastActive), { addSuffix: true })
                        : "Never"}
                    </span>
                    <button
                      onClick={(e) => handleOpenModal(e, lead)}
                      className="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-colors"
                      title="Add Contact Info"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </Link>
              ))}
            </div>

            <div className="hidden md:block">
              <div className="grid grid-cols-12 gap-4 p-4 border-b border-border bg-muted/60 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <div className="col-span-4">Lead</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-3">Contact Info</div>
                <div className="col-span-2">Last Active</div>
                <div className="col-span-1 text-right">Actions</div>
              </div>

              <div className="divide-y divide-border/70">
                {filteredLeads.map((lead) => (
                  <Link
                    href={`/leads/${lead.id}`}
                    key={lead.id}
                    className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-accent transition-colors group cursor-pointer"
                  >
                    <div className="col-span-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/12 border border-primary/25 flex items-center justify-center shrink-0">
                        {lead.name ? (
                          <span className="text-sm font-bold text-primary">{lead.name.charAt(0)}</span>
                        ) : (
                          <User className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{lead.name || "Unknown User"}</p>
                        <p className="text-xs text-muted-foreground truncate font-mono">{lead.igsid}</p>
                        <span className={`inline-flex mt-1 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${lead.isEngaged ? "border-amber-200 bg-amber-50 text-amber-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                          {getOwnershipBadgeLabel(lead)}
                        </span>
                      </div>
                    </div>

                    <div className="col-span-2 flex items-center">
                      <span className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full border ${getStatusStyles(lead.status)}`}>
                        {lead.status}
                      </span>
                    </div>

                    <div className="col-span-3 flex flex-col justify-center gap-1">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                        {lead.email ? (
                          <span className="text-foreground truncate">{lead.email}</span>
                        ) : (
                          <span className="text-muted-foreground italic">No email</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                        {lead.phone ? (
                          <span className="text-foreground truncate">{lead.phone}</span>
                        ) : (
                          <span className="text-muted-foreground italic">No phone</span>
                        )}
                      </div>
                    </div>

                    <div className="col-span-2 flex items-center text-sm text-muted-foreground">
                      {lead.lastActive
                        ? formatDistanceToNow(new Date(lead.lastActive), { addSuffix: true })
                        : "Never"}
                    </div>

                    <div className="col-span-1 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleOpenModal(e, lead)}
                        className="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-colors tooltip-trigger"
                        title="Add Contact Info"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <div className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {isModalOpen && activeLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div 
            className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()} 
          >
            <div className="flex justify-between items-center p-5 border-b border-border bg-muted/40">
              <div>
                <h3 className="text-lg font-bold text-card-foreground">Update Lead Info</h3>
                <p className="text-xs text-muted-foreground mt-0.5">IG: {activeLead.igsid}</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Custom Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Enter a custom name"
                    className="w-full pl-9 pr-3 py-2.5 border border-border bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-sm transition-all shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="lead@example.com"
                    className="w-full pl-9 pr-3 py-2.5 border border-border bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-sm transition-all shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="+1 234 567 8900"
                    className="w-full pl-9 pr-3 py-2.5 border border-border bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-sm transition-all shadow-sm"
                  />
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-border bg-muted/40">
              <button
                onClick={handleSubmitContactInfo}
                className="w-full py-2.5 bg-primary hover:opacity-90 text-primary-foreground font-medium rounded-lg shadow-sm transition-colors flex justify-center items-center gap-2"
              >
                Save & Trigger Meta CAPI
              </button>
              <p className="text-[11px] text-center text-muted-foreground mt-3">
                <strong>LeadSubmitted</strong> is queued only when both email and phone are available.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}