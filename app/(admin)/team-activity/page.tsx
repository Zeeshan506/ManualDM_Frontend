"use client";

import React from "react";
import { RepPerformanceTable } from "./components/RepPerformanceTable";
import { ActivityLogTable } from "./components/ActivityLogTable";
import { useAuth } from "@/contexts/AuthContext";

export default function TeamActivityPage() {
  const { user } = useAuth();

  // Protect route conceptually (Middleware should also handle this)
  if (user?.role !== "admin" && user?.role !== "sudo_admin") {
    return null; 
  }

  return (
    <div className="flex w-full flex-col gap-4 overflow-y-auto bg-background/50 p-3 sm:p-4 md:gap-6 md:p-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center md:gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">Team Activity</h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Monitor sales rep performance and system-wide audit logs.
          </p>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm md:rounded-2xl">
        <div className="border-b border-border/50 p-4 sm:p-5">
          <h2 className="text-base font-semibold text-foreground sm:text-lg">Sales Rep Performance</h2>
        </div>
        <RepPerformanceTable />
      </section>

      <section className="flex min-h-[320px] flex-col overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm md:min-h-[400px] md:rounded-2xl">
        <div className="flex flex-col justify-between gap-3 border-b border-border/50 p-4 sm:flex-row sm:items-center sm:p-5">
          <h2 className="text-base font-semibold text-foreground sm:text-lg">System Audit Log</h2>
          <select className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 sm:w-auto">
            <option>All Activities</option>
            <option>Chat Claims</option>
            <option>Messages Sent</option>
            <option>User Management</option>
          </select>
        </div>
        <ActivityLogTable />
      </section>
    </div>
  );
}