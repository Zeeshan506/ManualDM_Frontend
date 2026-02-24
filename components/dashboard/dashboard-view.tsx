"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { formatDistanceToNow } from "date-fns";
import {
  Users,
  MailCheck,
  CreditCard,
  TrendingUp,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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

const ACTIVITY_STYLE_MAP = {
  message: { icon: MessageCircle, color: "text-blue-500", bg: "bg-blue-50" },
  lead: { icon: MailCheck, color: "text-green-500", bg: "bg-green-50" },
  conversion: { icon: CreditCard, color: "text-purple-500", bg: "bg-purple-50" },
  qualified: { icon: CheckCircle2, color: "text-indigo-500", bg: "bg-indigo-50" },
  alert: { icon: AlertCircle, color: "text-red-500", bg: "bg-red-50" },
} as const;

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
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    setCurrentDate(format(new Date(), "EEEE, MMMM do, yyyy"));
  }, []);

  useEffect(() => {
    const fetchDashboard = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [statsRes, activityRes] = await Promise.all([
          fetch(`${API_URL}/api/dashboard/stats`),
          fetch(`${API_URL}/api/dashboard/activity?limit=12`),
        ]);

        if (!statsRes.ok) {
          throw new Error("Failed to load dashboard stats.");
        }

        const statsData = (await statsRes.json()) as DashboardStats;
        setStats(statsData);

        if (activityRes.ok) {
          const activityData = (await activityRes.json()) as DashboardActivity[];
          setActivity(activityData);
        } else {
          setActivity([]);
        }
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to load dashboard data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, []);

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

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full overflow-y-auto w-full">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 sm:gap-0 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Welcome back, {user?.userId ?? "User"}!
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 overflow-hidden text-ellipsis">
            {currentDate} • Phone: 03355933938
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm whitespace-nowrap">
            Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Leads</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">{cardValues.totalLeads}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-sm text-gray-500 font-medium">
            <span>{isLoading ? "Loading..." : "Live total from backend"}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Qualified (CAPI)</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">{cardValues.qualifiedLeads}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
              <MailCheck className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-sm text-gray-500 font-medium">
            <span>{isLoading ? "Loading..." : "LeadSubmitted events"}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Converted (Paid)</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">{cardValues.convertedLeads}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-sm text-gray-500 font-medium">
            <span>{cardValues.conversionRate}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">{cardValues.totalRevenue}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-sm text-gray-500 font-medium">
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
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col min-h-[300px] sm:min-h-[400px]">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Recent Activity</h2>
          <p className="text-sm text-gray-500 mb-6">Live updates from messages, leads, and invoices</p>

          <div className="flex-1 overflow-y-auto pr-2">
            {isLoading ? (
              <div className="text-sm text-gray-500">Loading activity...</div>
            ) : activity.length === 0 ? (
              <div className="text-sm text-gray-500">No recent activity found.</div>
            ) : (
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-100 before:to-transparent">
                {activity.map((item, index) => {
                  const style = ACTIVITY_STYLE_MAP[item.type as keyof typeof ACTIVITY_STYLE_MAP] || ACTIVITY_STYLE_MAP.alert;
                  const Icon = style.icon;
                  const timeLabel = item.timestamp
                    ? formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })
                    : "Unknown time";

                  return (
                    <div key={`${item.type}-${item.timestamp}-${index}`} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white ${style.bg} text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10`}>
                        <Icon className={`w-4 h-4 ${style.color}`} />
                      </div>

                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-gray-400 uppercase">{timeLabel}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-800">{item.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <button
            onClick={() => window.location.reload()}
            className="w-full mt-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
          >
            Refresh Activity
          </button>
        </div>
      </div>
    </div>
  );
}
