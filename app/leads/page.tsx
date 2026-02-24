"use client";

import React, { useState, useEffect } from "react";
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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Lead {
  id: number;
  igsid: string | null;
  name: string;
  status: string;
  email: string;
  phone: string;
  lastActive: string | null;
}

export default function LeadsDirectory() {
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
  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/leads`);
      if (!res.ok) throw new Error("Failed to fetch leads");
      const data = await res.json();
      setLeads(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load leads from the server.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // Filtering Logic
  const filteredLeads = leads.filter((lead) => {
    const matchName = lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchIg = lead.igsid?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchEmail = lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchesSearch = matchName || matchIg || matchEmail;
    
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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
      const res = await fetch(`${API_URL}/leads/${activeLead.id}/contact-details`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: nameInput.trim() || null,
          email: emailInput || null, 
          phone: phoneInput || null 
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to update lead");
      }

      toast.success(`Contact info saved for ${activeLead.name || activeLead.igsid}`);
      toast.info("LeadSubmitted event queued for Meta CAPI.");
      
      setIsModalOpen(false);
      fetchLeads(); // Refresh the list to reflect updates
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update lead";
      toast.error(message);
    }
  };

  // Helper for Status Pills
  const getStatusStyles = (status: string) => {
    switch(status) {
      case "new": return "bg-gray-100 text-gray-700 border-gray-200";
      case "invoiced": return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "paid": return "bg-green-50 text-green-700 border-green-200";
      case "cancelled": return "bg-red-50 text-red-700 border-red-200";
      default: return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto w-full relative">
      {/* ... HEADER & TOOLBAR HTML REMAINS EXACTLY THE SAME ... */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">All Leads</h1>
        <p className="text-sm text-gray-500 mb-6">Manage and update all incoming Meta contacts.</p>

        <div className="flex justify-between items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Search by name, ID, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none pl-10 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="new">New</option>
                <option value="invoiced">Invoiced</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <div className="col-span-4">Lead</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-3">Contact Info</div>
          <div className="col-span-2">Last Active</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        <div className="divide-y divide-gray-100">
          {isLoading ? (
             <div className="p-8 text-center text-gray-500 text-sm">Loading leads...</div>
          ) : filteredLeads.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">No leads found matching your criteria.</div>
          ) : (
            filteredLeads.map((lead) => (
              <Link 
                href={`/leads/${lead.id}`} 
                key={lead.id}
                className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50 transition-colors group cursor-pointer"
              >
                <div className="col-span-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-200 flex items-center justify-center shrink-0">
                    {lead.name ? (
                      <span className="text-sm font-bold text-gray-600">{lead.name.charAt(0)}</span>
                    ) : (
                      <User className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{lead.name || "Unknown User"}</p>
                    <p className="text-xs text-gray-500 truncate font-mono">{lead.igsid}</p>
                  </div>
                </div>

                <div className="col-span-2 flex items-center">
                  <span className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full border ${getStatusStyles(lead.status)}`}>
                    {lead.status}
                  </span>
                </div>

                <div className="col-span-3 flex flex-col justify-center gap-1">
                  <div className="flex items-center gap-1.5 text-xs">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    {lead.email ? (
                      <span className="text-gray-700 truncate">{lead.email}</span>
                    ) : (
                      <span className="text-gray-400 italic">No email</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    {lead.phone ? (
                      <span className="text-gray-700 truncate">{lead.phone}</span>
                    ) : (
                      <span className="text-gray-400 italic">No phone</span>
                    )}
                  </div>
                </div>

                <div className="col-span-2 flex items-center text-sm text-gray-500">
                  {lead.lastActive 
                    ? formatDistanceToNow(new Date(lead.lastActive), { addSuffix: true })
                    : "Never"}
                </div>

                <div className="col-span-1 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => handleOpenModal(e, lead)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors tooltip-trigger"
                    title="Add Contact Info"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <div className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {isModalOpen && activeLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div 
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()} 
          >
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Update Lead Info</h3>
                <p className="text-xs text-gray-500 mt-0.5">IG: {activeLead.igsid}</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">Custom Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Enter a custom name"
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="lead@example.com"
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="+1 234 567 8900"
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all shadow-sm"
                  />
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 bg-gray-50">
              <button
                onClick={handleSubmitContactInfo}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors flex justify-center items-center gap-2"
              >
                Save & Trigger Meta CAPI
              </button>
              <p className="text-[11px] text-center text-gray-500 mt-3">
                This action fires the <strong>LeadSubmitted</strong> event to your Meta pixel.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}