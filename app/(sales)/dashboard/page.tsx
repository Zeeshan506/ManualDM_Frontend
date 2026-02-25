"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, User, Clock, Zap, Inbox, RefreshCcw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// Components
import ClaimLeadButton from "./components/ClaimLeadButton";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type UnassignedLead = {
  id: number;
  igsid: string | null;
  name: string;
  lastActive: string | null;
};

export default function UnassignedPoolPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<UnassignedLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isLeadHot = (lastActive: string | null): boolean => {
    if (!lastActive) return false;
    const lastActiveTime = new Date(lastActive).getTime();
    const now = new Date().getTime();
    const fiveHoursInMs = 5 * 60 * 60 * 1000;
    return now - lastActiveTime <= fiveHoursInMs;
  };

  const fetchUnassignedLeads = async (silent = false) => {
    if (!silent) setLoading(true);
    setIsRefreshing(true);

    if (!user?.accessToken) {
      setLeads([]);
      setLoading(false);
      setIsRefreshing(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/leads?status=unassigned`, {
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
        },
      });
      if (res.ok) {
        const data = (await res.json()) as UnassignedLead[];
        setLeads(data);
      }
    } catch (error) {
      console.error("Failed to fetch leads", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const isAuthorized = user?.role === "sales_rep" || user?.role === "admin" || user?.role === "sudo_admin";
    if (!isAuthorized) {
      setLeads([]);
      setLoading(false);
      return;
    }

    fetchUnassignedLeads();
    
    const interval = setInterval(() => fetchUnassignedLeads(true), 10000);
    return () => clearInterval(interval);
  }, [user?.role, user?.accessToken]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        </div>
        <p className="text-muted-foreground font-medium animate-pulse">Scanning the pool for leads...</p>
      </div>
    );
  }

if (user?.role !== "sales_rep" && user?.role !== "admin" && user?.role !== "sudo_admin") {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <Card className="max-w-md w-full border-yellow-200 bg-yellow-50/30">
          <CardContent className="pt-6 text-center">
            <User className="mx-auto h-12 w-12 text-yellow-600 mb-4" />
            <h2 className="text-xl font-semibold text-yellow-900">Access Restricted</h2>
            <p className="text-yellow-700 mt-2">You do not have permission to access the lead pool. Please contact your admin if this is an error.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-50/50 dark:bg-transparent px-4 py-6 md:px-8 lg:px-10">
      {/* Header Section */}
      <div className="max-w-[1600px] mx-auto mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                <Inbox className="h-5 w-5" />
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                Unassigned Pool
              </h1>
            </div>
            <p className="text-sm md:text-base text-muted-foreground">
              Instant access to new Instagram leads. Claim them before they go cold.
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
             <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fetchUnassignedLeads()}
              className="hidden sm:flex items-center gap-1 bg-white dark:bg-slate-950 shadow-sm text-xs md:text-sm"
            >
              <RefreshCcw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Sync</span>
            </Button>
            <div className="flex items-center bg-white dark:bg-slate-900 border rounded-full px-3 sm:px-4 py-1.5 shadow-sm">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse mr-2" />
              <span className="text-xs sm:text-sm font-bold whitespace-nowrap">{leads.length} Available</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Section */}
      <div className="max-w-[1600px] mx-auto">
        {leads.length === 0 ? (
          <Card className="border-dashed border-2 bg-transparent">
            <CardContent className="flex flex-col items-center justify-center py-16 md:py-20 text-center px-4">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="h-8 w-8 text-muted-foreground opacity-40" />
              </div>
              <h3 className="text-lg md:text-2xl font-semibold italic text-slate-400">The pool is currently empty</h3>
              <p className="max-w-sm text-sm md:text-base text-muted-foreground mt-2">
                All leads have been claimed. Relax, or check back in a few moments!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {leads.map((lead) => (
              <Card 
                key={lead.id} 
                className="group relative flex flex-col overflow-hidden border-slate-200 dark:border-slate-800 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
              >
                {/* Visual Accent */}
                <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
                
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="space-y-0.5 overflow-hidden">
                      <CardTitle className="text-base md:text-lg font-bold truncate group-hover:text-primary transition-colors">
                        {lead.name || lead.igsid || "Anonymous Lead"}
                      </CardTitle>
                      <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest leading-none">
                        ID: {lead.id}
                      </span>
                    </div>
                    <Badge className={`text-white border-none shadow-sm flex items-center gap-1 text-xs flex-shrink-0 ${
                      isLeadHot(lead.lastActive)
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600'
                        : 'bg-gradient-to-r from-slate-500 to-slate-600'
                    }`}>
                      <Zap className="h-3 w-3 fill-current" />
                      <span className="hidden sm:inline">{isLeadHot(lead.lastActive) ? 'Hot' : 'Cold'}</span>
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="flex-grow space-y-2.5">
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-100/50 dark:bg-slate-900/50">
                      <User className="h-4 w-4 text-slate-400 flex-shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase font-bold text-slate-400 leading-none mb-0.5">Source ID</span>
                        <span className="text-xs font-medium truncate">{lead.igsid || "N/A"}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-100/50 dark:bg-slate-900/50">
                      <Clock className="h-4 w-4 text-slate-400 flex-shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase font-bold text-slate-400 leading-none mb-0.5">Last Interaction</span>
                        <span className="text-xs font-medium">
                          {lead.lastActive ? formatDistanceToNow(new Date(lead.lastActive), { addSuffix: true }) : "Recent"}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-3 border-t bg-slate-50/80 dark:bg-slate-900/40 p-4">
                  <div className="w-full">
                    <ClaimLeadButton leadId={lead.id} />
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}