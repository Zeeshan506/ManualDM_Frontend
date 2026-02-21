"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import { 
  Search, 
  Send, 
  Mail, 
  Phone, 
  User, 
  CheckCircle2, 
  MoreVertical,
  ChevronLeft
} from "lucide-react";

// --- Mock Data ---
const MOCK_INBOX = [
  { id: "1", igsid: "IG_1001456789", name: "Alex Smith", lastMessage: "How much is the premium package?", time: "10:42 AM", unread: true },
  { id: "2", igsid: "IG_1002987654", name: "Sarah Jenkins", lastMessage: "I'll think about it and let you know.", time: "Yesterday", unread: false },
  { id: "3", igsid: "IG_1003112233", name: "Mike Ross", lastMessage: "Thanks for the info!", time: "Mon", unread: false },
];

const MOCK_MESSAGES = [
  { id: 1, text: "Hey there! Saw your ad.", direction: "inbound", time: "10:30 AM" },
  { id: 2, text: "Hi Alex! Thanks for reaching out. How can we help you today?", direction: "outbound", time: "10:35 AM" },
  { id: 3, text: "How much is the premium package?", direction: "inbound", time: "10:42 AM" },
];

const MOCK_ACTIVE_LEAD = {
  id: "1",
  igsid: "IG_1001456789",
  name: "Alex Smith",
  status: "new",
  email: "",
  phone: "",
  metaEventFired: false,
};

export default function ChatView() {
  const params = useParams();
  const router = useRouter();
  const activeId = params.id as string;

  // Form State for the Right Column
  const [emailInput, setEmailInput] = useState(MOCK_ACTIVE_LEAD.email);
  const [phoneInput, setPhoneInput] = useState(MOCK_ACTIVE_LEAD.phone);
  const [leadStatus, setLeadStatus] = useState(MOCK_ACTIVE_LEAD.status);
  const [replyText, setReplyText] = useState("");

  const handleUpdateContactInfo = () => {
    if (!emailInput && !phoneInput) {
      toast.error("Please provide an email or phone number.");
      return;
    }
    
    // TODO: Wire up to POST /leads/{activeId}/contact-details
    toast.success("Lead details updated successfully!");
    toast.info("LeadSubmitted event queued for Meta CAPI.");
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    
    // TODO: Wire up to Instagram Graph API via backend
    toast.success("Message sent to Meta API.");
    setReplyText("");
  };

  return (
    <div className="flex h-full w-full bg-white overflow-hidden">
      
      {/* ================= LEFT COLUMN: INBOX (320px) ================= */}
      <div className="w-80 border-r border-gray-200 flex flex-col bg-white shrink-0">
        {/* Inbox Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => router.push('/leads')} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-gray-900">Active Chats</h2>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search messages..." 
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Inbox List */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {MOCK_INBOX.map((chat) => (
            <Link 
              href={`/leads/${chat.id}`} 
              key={chat.id}
              className={`block p-4 transition-colors relative ${
                activeId === chat.id ? "bg-blue-50" : "hover:bg-gray-50"
              }`}
            >
              {/* Active Indicator Line */}
              {activeId === chat.id && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-full" />
              )}
              
              <div className="flex justify-between items-baseline mb-1">
                <h3 className={`font-semibold text-sm truncate pr-2 ${chat.unread && activeId !== chat.id ? "text-gray-900" : "text-gray-700"}`}>
                  {chat.name || chat.igsid}
                </h3>
                <span className="text-[11px] text-gray-400 whitespace-nowrap">{chat.time}</span>
              </div>
              <p className={`text-xs truncate ${chat.unread && activeId !== chat.id ? "text-gray-900 font-medium" : "text-gray-500"}`}>
                {chat.lastMessage}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* ================= MIDDLE COLUMN: CHAT INTERFACE ================= */}
      <div className="flex-1 flex flex-col bg-[#F9FAFB] min-w-0">
        
        {/* Chat Header */}
        <div className="h-16 px-6 bg-white border-b border-gray-200 flex items-center justify-between shadow-sm z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 border border-indigo-200 flex items-center justify-center">
              <span className="text-indigo-700 font-bold text-sm">
                {MOCK_ACTIVE_LEAD.name.charAt(0)}
              </span>
            </div>
            <div>
              <h2 className="font-bold text-gray-900 leading-tight">{MOCK_ACTIVE_LEAD.name}</h2>
              <p className="text-[11px] text-gray-500 font-mono">{MOCK_ACTIVE_LEAD.igsid}</p>
            </div>
          </div>
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="text-center">
            <span className="text-[11px] font-medium text-gray-400 bg-gray-100 px-3 py-1 rounded-full uppercase tracking-wider">
              Today
            </span>
          </div>

          {MOCK_MESSAGES.map((msg) => (
            <div key={msg.id} className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] lg:max-w-[60%] flex flex-col ${msg.direction === "outbound" ? "items-end" : "items-start"}`}>
                <div
                  className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm ${
                    msg.direction === "outbound"
                      ? "bg-blue-600 text-white rounded-tr-sm"
                      : "bg-white border border-gray-100 text-gray-800 rounded-tl-sm"
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[10px] text-gray-400 mt-1 px-1">
                  {msg.time}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Message Input Area */}
        <div className="p-4 bg-white border-t border-gray-200">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type a reply to send to Instagram..."
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
            />
            <button 
              type="submit"
              disabled={!replyText.trim()}
              className="px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center justify-center"
            >
              <Send className="w-5 h-5 ml-1" />
            </button>
          </form>
          <p className="text-[10px] text-gray-400 mt-2 text-center">
            Replies are sent via the Instagram Graph API (within 24hr window).
          </p>
        </div>
      </div>

      {/* ================= RIGHT COLUMN: LEAD DETAILS (320px) ================= */}
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col shrink-0 overflow-y-auto shadow-[-4px_0_24px_-16px_rgba(0,0,0,0.1)] z-20">
        
        {/* Profile Summary */}
        <div className="p-6 border-b border-gray-100 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 border-2 border-white shadow-md flex items-center justify-center mb-3">
            <User className="w-8 h-8 text-indigo-400" />
          </div>
          <h2 className="font-bold text-gray-900 text-lg">{MOCK_ACTIVE_LEAD.name}</h2>
          <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded mt-2">
            {MOCK_ACTIVE_LEAD.igsid}
          </span>
        </div>

        {/* Pipeline Status */}
        <div className="p-6 border-b border-gray-100">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Pipeline Status
          </label>
          <select 
            value={leadStatus}
            onChange={(e) => setLeadStatus(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="new">New Lead</option>
            <option value="contacted">Contacted</option>
            <option value="invoiced">Invoiced</option>
            <option value="paid">Converted (Paid)</option>
          </select>
        </div>

        {/* Contact Information Form */}
        <div className="p-6 flex-1">
          <div className="flex items-center justify-between mb-4">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Contact Details
            </label>
            {MOCK_ACTIVE_LEAD.metaEventFired && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> CAPI SYNCED
              </span>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Email Address"
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm"
                />
              </div>
            </div>

            <div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="Phone Number"
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Trigger Button */}
          <div className="mt-6">
            <button
              onClick={handleUpdateContactInfo}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors flex justify-center items-center gap-2"
            >
              Save Data & Sync Meta
            </button>
            <p className="text-[11px] text-center text-gray-400 mt-3 leading-tight">
              Saving triggers the <strong>LeadSubmitted</strong> Conversion API event for Ad optimization.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}