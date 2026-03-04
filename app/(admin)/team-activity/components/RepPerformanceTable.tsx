"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api-client";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

type RepPerformanceItem = {
  id: number;
  name: string;
  role: string;
  activeChats: number;
  converted: number;
  revenue: number;
  status: "Online" | "Offline";
};

function formatRevenue(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value || 0);
}

export function RepPerformanceTable() {
  const { user } = useAuth();
  const [rows, setRows] = useState<RepPerformanceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchPerformance() {
      if (!user?.accessToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await apiFetch(`${API_URL}/api/sudo/team-activity/performance`, {
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
          },
          timeoutMs: 10000,
          minIntervalMs: 700,
          retry: { retries: 1 },
          throttleKey: "team-activity:performance",
        });
        if (!response.ok) {
          throw new Error("Failed to fetch team performance");
        }

        const data = (await response.json()) as RepPerformanceItem[];
        if (!cancelled) {
          setRows(data ?? []);
        }
      } catch {
        if (!cancelled) {
          setRows([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchPerformance();
    return () => {
      cancelled = true;
    };
  }, [user?.accessToken]);

  return (
    <div className="w-full">
      <div className="space-y-3 p-3 sm:hidden">
        {loading ? (
          <div className="rounded-lg border border-border/60 bg-background p-4 text-sm text-muted-foreground">
            Loading team performance...
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-lg border border-border/60 bg-background p-4 text-sm text-muted-foreground">
            No sales rep performance data found.
          </div>
        ) : (
          rows.map((rep) => (
            <article key={rep.id} className="rounded-lg border border-border/60 bg-background p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{rep.name}</p>
                  <p className="text-xs text-muted-foreground">{rep.role}</p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    rep.status === "Online"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {rep.status}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-md bg-muted/40 p-2">
                  <p className="text-[11px] text-muted-foreground">Active</p>
                  <p className="text-sm font-semibold text-foreground">{rep.activeChats}</p>
                </div>
                <div className="rounded-md bg-muted/40 p-2">
                  <p className="text-[11px] text-muted-foreground">Converted</p>
                  <p className="text-sm font-semibold text-foreground">{rep.converted}</p>
                </div>
                <div className="rounded-md bg-muted/40 p-2">
                  <p className="text-[11px] text-muted-foreground">Revenue</p>
                  <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{formatRevenue(rep.revenue)}</p>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      <div className="hidden w-full overflow-x-auto sm:block">
      <table className="min-w-[700px] w-full text-left text-xs sm:text-sm">
        <thead className="text-xs uppercase bg-muted/50 text-muted-foreground">
          <tr>
            <th className="px-3 py-3 font-medium sm:px-4 md:px-6">Team Member</th>
            <th className="px-3 py-3 font-medium sm:px-4 md:px-6">Role</th>
            <th className="px-3 py-3 text-center font-medium sm:px-4 md:px-6">Active Chats</th>
            <th className="px-3 py-3 text-center font-medium sm:px-4 md:px-6">Converted Leads</th>
            <th className="px-3 py-3 text-right font-medium sm:px-4 md:px-6">Revenue Gen.</th>
            <th className="px-3 py-3 text-center font-medium sm:px-4 md:px-6">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {loading ? (
            <tr>
              <td className="px-3 py-6 text-muted-foreground sm:px-4 md:px-6" colSpan={6}>Loading team performance...</td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td className="px-3 py-6 text-muted-foreground sm:px-4 md:px-6" colSpan={6}>No sales rep performance data found.</td>
            </tr>
          ) : rows.map((rep) => (
            <tr key={rep.id} className="hover:bg-muted/20 transition-colors">
              <td className="px-3 py-3 font-medium text-foreground sm:px-4 md:px-6">{rep.name}</td>
              <td className="px-3 py-3 text-muted-foreground sm:px-4 md:px-6">{rep.role}</td>
              <td className="px-3 py-3 text-center font-medium text-foreground sm:px-4 md:px-6">{rep.activeChats}</td>
              <td className="px-3 py-3 text-center text-muted-foreground sm:px-4 md:px-6">{rep.converted}</td>
              <td className="px-3 py-3 text-right font-medium text-emerald-600 dark:text-emerald-400 sm:px-4 md:px-6">{formatRevenue(rep.revenue)}</td>
              <td className="px-3 py-3 text-center sm:px-4 md:px-6">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    rep.status === "Online"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {rep.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}