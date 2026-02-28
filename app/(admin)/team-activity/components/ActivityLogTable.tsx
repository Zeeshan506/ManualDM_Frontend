"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { ActivityBadge, type ActionType } from "./ActivityBadge";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

type ActivityLogItem = {
  id: number;
  timestamp: string | null;
  actor: string;
  action: ActionType;
  details: string | null;
};

type ActivityLogsResponse = {
  items: ActivityLogItem[];
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
};

function formatTimestamp(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

export function ActivityLogTable() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<"50" | "all">("50");

  const fetchLogs = useCallback(
    async (manual = false) => {
      if (!user?.accessToken) {
        setLoading(false);
        return;
      }

      if (manual) {
        setIsRefreshing(true);
      }

      try {
        if (viewMode === "50") {
          const response = await fetch(`${API_URL}/api/sudo/team-activity/logs?limit=50&page=1`, {
            headers: {
              Authorization: `Bearer ${user.accessToken}`,
            },
          });

          if (!response.ok) {
            throw new Error("Failed to fetch activity logs");
          }

          const data = (await response.json()) as ActivityLogsResponse;
          setLogs(data.items ?? []);
        } else {
          const pageSize = 200;
          let page = 1;
          let hasNext = true;
          const allItems: ActivityLogItem[] = [];

          while (hasNext) {
            const response = await fetch(
              `${API_URL}/api/sudo/team-activity/logs?limit=${pageSize}&page=${page}`,
              {
                headers: {
                  Authorization: `Bearer ${user.accessToken}`,
                },
              }
            );

            if (!response.ok) {
              throw new Error("Failed to fetch activity logs");
            }

            const data = (await response.json()) as ActivityLogsResponse;
            allItems.push(...(data.items ?? []));
            hasNext = Boolean(data.hasNext);
            page += 1;

            if (page > 500) {
              break;
            }
          }

          setLogs(allItems);
        }

        setLastUpdatedAt(new Date());
      } catch {
        setLogs([]);
      } finally {
        setLoading(false);
        if (manual) {
          setIsRefreshing(false);
        }
      }
    },
    [user?.accessToken, viewMode]
  );

  useEffect(() => {
    let cancelled = false;

    const runFetch = async () => {
      if (cancelled) return;
      await fetchLogs(false);
    };

    runFetch();
    const intervalId = window.setInterval(runFetch, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [fetchLogs]);

  const rows = useMemo(() => logs, [logs]);

  return (
    <div className="flex max-h-[70vh] min-h-[360px] w-full flex-col">
      <div className="sticky top-0 z-10 flex flex-col gap-2 border-b border-border/30 bg-card px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4 md:px-6">
        <p className="text-xs text-muted-foreground">
          {lastUpdatedAt ? `Last updated: ${lastUpdatedAt.toLocaleTimeString()}` : "Waiting for first update..."}
        </p>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <select
            value={viewMode}
            onChange={(event) => setViewMode(event.target.value as "50" | "all")}
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 sm:w-auto"
          >
            <option value="50">Latest 50</option>
            <option value="all">All logs</option>
          </select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fetchLogs(true)}
            disabled={loading || isRefreshing}
            className="w-full sm:w-auto"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="space-y-3 p-3 sm:hidden">
          {loading ? (
            <div className="rounded-lg border border-border/60 bg-background p-4 text-sm text-muted-foreground">
              Loading activity logs...
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-lg border border-border/60 bg-background p-4 text-sm text-muted-foreground">
              No activity logs found.
            </div>
          ) : (
            rows.map((log) => (
              <article key={log.id} className="rounded-lg border border-border/60 bg-background p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{log.actor}</p>
                    <p className="text-xs text-muted-foreground">{formatTimestamp(log.timestamp)}</p>
                  </div>
                  <ActivityBadge action={log.action} />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{log.details || "-"}</p>
              </article>
            ))
          )}
        </div>

      <div className="hidden w-full overflow-x-auto sm:block">
      <table className="min-w-[720px] w-full text-left text-xs sm:text-sm">
        <thead className="text-xs uppercase bg-muted/30 text-muted-foreground border-b border-border/50">
          <tr>
            <th className="w-48 px-3 py-3 font-medium sm:px-4 md:px-6">Timestamp</th>
            <th className="w-40 px-3 py-3 font-medium sm:px-4 md:px-6">Actor</th>
            <th className="w-40 px-3 py-3 font-medium sm:px-4 md:px-6">Action</th>
            <th className="px-3 py-3 font-medium sm:px-4 md:px-6">Details</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {loading ? (
            <tr>
              <td className="px-3 py-6 text-muted-foreground sm:px-4 md:px-6" colSpan={4}>Loading activity logs...</td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td className="px-3 py-6 text-muted-foreground sm:px-4 md:px-6" colSpan={4}>No activity logs found.</td>
            </tr>
          ) : rows.map((log) => (
            <tr key={log.id} className="hover:bg-muted/10 transition-colors group">
              <td className="px-3 py-3 text-[11px] text-muted-foreground sm:px-4 md:px-6">{formatTimestamp(log.timestamp)}</td>
              <td className="px-3 py-3 font-medium text-foreground sm:px-4 md:px-6">{log.actor}</td>
              <td className="px-3 py-3 sm:px-4 md:px-6">
                <ActivityBadge action={log.action} />
              </td>
              <td className="max-w-md truncate px-3 py-3 text-muted-foreground transition-colors group-hover:text-foreground sm:px-4 md:px-6">
                {log.details || "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      </div>
    </div>
  );
}