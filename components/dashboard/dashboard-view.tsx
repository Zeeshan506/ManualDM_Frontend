"use client";

import { useEffect, useMemo, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
  Users,
  MailCheck,
  CreditCard,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

interface DashboardStats {
  totalLeads: number;
  qualifiedLeads: number;
  convertedLeads: number;
  conversionRate: number;
  totalRevenue: number;
}

interface DashboardActivity {
  type: string;
  text: string;
  timestamp: string | null;
}

interface DashboardActivityPage {
  items: DashboardActivity[];
  page: number;
  limit: number;
  hasNext: boolean;
}

const ACTIVITY_PAGE_SIZE = 15;

const numberFormatter = new Intl.NumberFormat("en-US");
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const INITIAL_STATS: DashboardStats = {
  totalLeads: 0,
  qualifiedLeads: 0,
  convertedLeads: 0,
  conversionRate: 0,
  totalRevenue: 0,
};

export function DashboardView() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>(INITIAL_STATS);
  const [activity, setActivity] = useState<DashboardActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActivityLoading, setIsActivityLoading] = useState(true);
  const [activityPage, setActivityPage] = useState(1);
  const [activityHasNext, setActivityHasNext] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    setCurrentDate(format(new Date(), "EEEE, MMMM do, yyyy"));
  }, []);

  const fetchActivityPage = async (page: number) => {
    setIsActivityLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/dashboard/activity?limit=${ACTIVITY_PAGE_SIZE}&page=${page}&include_meta=true`
      );

      if (!response.ok) {
        setActivity([]);
        setActivityHasNext(false);
        return;
      }

      const data = (await response.json()) as DashboardActivityPage | DashboardActivity[];

      if (Array.isArray(data)) {
        setActivity(data);
        setActivityHasNext(data.length === ACTIVITY_PAGE_SIZE);
      } else {
        setActivity(data.items ?? []);
        setActivityHasNext(Boolean(data.hasNext));
      }
    } catch {
      setActivity([]);
      setActivityHasNext(false);
    } finally {
      setIsActivityLoading(false);
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const statsRes = await fetch(`${API_URL}/api/dashboard/stats`);
        if (!statsRes.ok) {
          throw new Error("Failed to load dashboard stats.");
        }

        const statsData = (await statsRes.json()) as DashboardStats;
        setStats(statsData);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to load dashboard data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  useEffect(() => {
    fetchActivityPage(activityPage);
  }, [activityPage]);

  const cardValues = useMemo(
    () => ({
      totalLeads: numberFormatter.format(stats.totalLeads),
      qualifiedLeads: numberFormatter.format(stats.qualifiedLeads),
      convertedLeads: numberFormatter.format(stats.convertedLeads),
      conversionRate: `${stats.conversionRate}% Conversion Rate`,
      totalRevenue: currencyFormatter.format(stats.totalRevenue),
    }),
    [stats]
  );

  const recentActivity = useMemo(() => activity, [activity]);

  const getActivityTypeLabel = (type: string) => {
    switch (type) {
      case "message":
        return "Message";
      case "lead":
        return "Lead";
      case "conversion":
        return "Conversion";
      case "qualified":
        return "Qualified";
      default:
        return "Other";
    }
  };

  const getActivityTypeClasses = (type: string) => {
    switch (type) {
      case "message":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "lead":
        return "bg-green-50 text-green-700 border-green-200";
      case "conversion":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "qualified":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full overflow-y-auto w-full">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 sm:gap-0 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            Welcome back, {user?.userId ?? "User"}!
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 overflow-hidden text-ellipsis">
            {currentDate} • Phone: 03355933938
          </p>
        </div>
        <div className="flex gap-3">
          <button className="w-full sm:w-auto px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium text-foreground hover:bg-accent transition-colors shadow-sm whitespace-nowrap">
            Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        <div className="bg-card p-5 sm:p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Leads</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-card-foreground mt-2">{cardValues.totalLeads}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/12 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-sm text-muted-foreground font-medium">
            <span>{isLoading ? "Loading..." : "Live total from backend"}</span>
          </div>
        </div>

        <div className="bg-card p-5 sm:p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Qualified (CAPI)</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-card-foreground mt-2">{cardValues.qualifiedLeads}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/12 flex items-center justify-center">
              <MailCheck className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-sm text-muted-foreground font-medium">
            <span>{isLoading ? "Loading..." : "LeadSubmitted events"}</span>
          </div>
        </div>

        <div className="bg-card p-5 sm:p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Converted (Paid)</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-card-foreground mt-2">{cardValues.convertedLeads}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/12 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-sm text-muted-foreground font-medium">
            <span>{cardValues.conversionRate}</span>
          </div>
        </div>

        <div className="bg-card p-5 sm:p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-card-foreground mt-2">{cardValues.totalRevenue}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/12 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-sm text-muted-foreground font-medium">
            <TrendingUp className="w-4 h-4" />
            <span>{isLoading ? "Loading..." : "Sum of paid invoices"}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        <div className="bg-card p-4 sm:p-6 rounded-2xl border border-border shadow-sm flex flex-col min-h-[300px] sm:min-h-[400px]">
          <h2 className="text-lg font-bold text-card-foreground mb-1">Recent Activity</h2>
          <p className="text-sm text-muted-foreground mb-4">Simple activity log (15 entries per page)</p>

          <div className="flex-1 overflow-y-auto">
            {isActivityLoading ? (
              <div className="text-sm text-muted-foreground">Loading activity...</div>
            ) : recentActivity.length === 0 ? (
              <div className="text-sm text-muted-foreground">No recent activity found.</div>
            ) : (
              <>
                <div className="md:hidden divide-y divide-border rounded-lg border border-border">
                  {recentActivity.map((item, index) => {
                    const timeLabel = item.timestamp
                      ? formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })
                      : "Unknown time";

                    return (
                      <div key={`${item.type}-${item.timestamp}-${index}`} className="p-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full border ${getActivityTypeClasses(item.type)}`}>
                            {getActivityTypeLabel(item.type)}
                          </span>
                          <span className="text-[11px] text-muted-foreground whitespace-nowrap">{timeLabel}</span>
                        </div>
                        <p className="mt-2 text-sm text-foreground">{item.text}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="hidden md:block overflow-x-auto rounded-lg border border-border">
                  <table className="w-full min-w-[760px] text-sm">
                    <thead>
                      <tr className="bg-muted/60 border-b border-border text-left text-muted-foreground">
                        <th className="px-4 py-2 font-medium w-44">Time</th>
                        <th className="px-4 py-2 font-medium w-36">Type</th>
                        <th className="px-4 py-2 font-medium">Activity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentActivity.map((item, index) => {
                        const timeLabel = item.timestamp
                          ? formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })
                          : "Unknown time";

                        return (
                          <tr key={`${item.type}-${item.timestamp}-${index}`} className="border-b border-border/80 last:border-b-0">
                            <td className="px-4 py-2 text-muted-foreground">{timeLabel}</td>
                            <td className="px-4 py-2">
                              <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full border ${getActivityTypeClasses(item.type)}`}>
                                {getActivityTypeLabel(item.type)}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-foreground">{item.text}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">Page {activityPage}</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActivityPage((prev) => Math.max(1, prev - 1))}
                disabled={activityPage === 1 || isActivityLoading}
                className="px-3 py-2 text-sm font-medium rounded-lg border border-border bg-card text-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setActivityPage((prev) => prev + 1)}
                disabled={!activityHasNext || isActivityLoading}
                className="px-3 py-2 text-sm font-medium rounded-lg border border-border bg-card text-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent transition-colors"
              >
                Next
              </button>
              <button
                onClick={() => fetchActivityPage(activityPage)}
                disabled={isActivityLoading}
                className="px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
