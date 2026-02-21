import { format } from "date-fns";
import { 
  Users, 
  MailCheck, 
  CreditCard, 
  TrendingUp, 
  MessageCircle,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

// Mock Data for the Activity Feed
const RECENT_ACTIVITY = [
  { id: 1, type: "message", text: "New message from IG_98234", time: "5 mins ago", icon: MessageCircle, color: "text-blue-500", bg: "bg-blue-50" },
  { id: 2, type: "lead", text: "Email captured for Sarah Jenkins", time: "1 hour ago", icon: MailCheck, color: "text-green-500", bg: "bg-green-50" },
  { id: 3, type: "conversion", text: "Invoice #1042 paid ($150)", time: "3 hours ago", icon: CreditCard, color: "text-purple-500", bg: "bg-purple-50" },
  { id: 4, type: "alert", text: "Unread message SLA breached for IG_1120", time: "4 hours ago", icon: AlertCircle, color: "text-red-500", bg: "bg-red-50" },
  { id: 5, type: "lead", text: "Phone number added for Alex Smith", time: "Yesterday", icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50" },
];

export default function Dashboard() {
  const currentDate = format(new Date(), "EEEE, MMMM do, yyyy");

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full overflow-y-auto w-full">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 sm:gap-0 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Welcome back, سید ذیشان اظہر
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

      {/* ================= KPI CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        {/* Total Leads Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Leads</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">1,204</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-sm text-green-600 font-medium">
            <TrendingUp className="w-4 h-4" />
            <span>+12 today</span>
          </div>
        </div>

        {/* Qualified Leads Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Qualified (CAPI)</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">485</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
              <MailCheck className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-sm text-green-600 font-medium">
            <TrendingUp className="w-4 h-4" />
            <span>+3 this week</span>
          </div>
        </div>

        {/* Converted Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Converted (Paid)</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">112</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-sm text-gray-500 font-medium">
            <span>23% Conversion Rate</span>
          </div>
        </div>

        {/* Revenue Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">$4,500</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-sm text-green-600 font-medium">
            <TrendingUp className="w-4 h-4" />
            <span>+15% from last month</span>
          </div>
        </div>
      </div>

      {/* ================= MIDDLE SECTION: CHARTS & ACTIVITY ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        
        {/* Left Side: Funnel / Chart Placeholder (60%) */}
        <div className="lg:col-span-8 bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col min-h-[300px] sm:min-h-[400px]">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Lead Conversion Funnel</h2>
          <p className="text-sm text-gray-500 mb-6">Last 7 days performance</p>
          
          {/* Chart Placeholder Area */}
          <div className="flex-1 bg-gray-50 rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
            <TrendingUp className="w-10 h-10 mb-3 text-gray-300" />
            <p className="font-medium">Chart rendering area</p>
            <p className="text-xs mt-1">Integrate Recharts or Tremor.so here</p>
          </div>
        </div>

        {/* Right Side: Recent Activity Feed (40%) */}
        <div className="lg:col-span-4 bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col min-h-[300px] sm:min-h-[400px]">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Recent Activity</h2>
          <p className="text-sm text-gray-500 mb-6">System & team updates</p>
          
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-100 before:to-transparent">
              
              {RECENT_ACTIVITY.map((activity) => (
                <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  
                  {/* Timeline Node */}
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white ${activity.bg} text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10`}>
                    <activity.icon className={`w-4 h-4 ${activity.color}`} />
                  </div>
                  
                  {/* Activity Card */}
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-400 uppercase">{activity.time}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-800">{activity.text}</p>
                  </div>
                </div>
              ))}

            </div>
          </div>
          
          <button className="w-full mt-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors">
            View All Logs
          </button>
        </div>

      </div>
    </div>
  );
}