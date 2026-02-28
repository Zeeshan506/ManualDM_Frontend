import React from "react";

export type ActionType =
  | "CLAIM_CHAT"
  | "SEND_MESSAGE"
  | "ADD_USER"
  | "UPDATE_ROLE"
  | "CLOSE_CHAT"
  | "UPDATE_NAME"
  | "UPDATE_PASSWORD"
  | "UPDATE_STATUS"
  | "DELETE_USER"
  | "LOGIN_SUCCESS"
  | "LOGOUT"
  | "LOGIN_FAILED"
  | "LOGIN_BLOCKED"
  | "PASSWORD_RESET_REQUEST"
  | "CREATE_PAYMENT"
  | "UPDATE_LEAD_CONTACT"
  | "CREATE_META_EVENT"
  | "CREATE_MOCK_PURCHASE_EVENT";

export function ActivityBadge({ action }: { action: ActionType }) {
  const styles: Record<ActionType, string> = {
    CLAIM_CHAT: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200",
    SEND_MESSAGE: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200",
    ADD_USER: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200",
    UPDATE_ROLE: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200",
    CLOSE_CHAT: "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border-stone-200",
    UPDATE_NAME: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400 border-cyan-200",
    UPDATE_PASSWORD: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200",
    UPDATE_STATUS: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200",
    DELETE_USER: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200",
    LOGIN_SUCCESS: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200",
    LOGOUT: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200",
    LOGIN_FAILED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200",
    LOGIN_BLOCKED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200",
    PASSWORD_RESET_REQUEST: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-400 border-fuchsia-200",
    CREATE_PAYMENT: "bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400 border-lime-200",
    UPDATE_LEAD_CONTACT: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 border-sky-200",
    CREATE_META_EVENT: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200",
    CREATE_MOCK_PURCHASE_EVENT: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border-teal-200",
  };

  const labels: Record<ActionType, string> = {
    CLAIM_CHAT: "Claimed Chat",
    SEND_MESSAGE: "Sent Message",
    ADD_USER: "Added User",
    UPDATE_ROLE: "Updated Role",
    CLOSE_CHAT: "Closed Chat",
    UPDATE_NAME: "Updated Name",
    UPDATE_PASSWORD: "Updated Password",
    UPDATE_STATUS: "Updated Status",
    DELETE_USER: "Deleted User",
    LOGIN_SUCCESS: "Login Success",
    LOGOUT: "Logout",
    LOGIN_FAILED: "Login Failed",
    LOGIN_BLOCKED: "Login Blocked",
    PASSWORD_RESET_REQUEST: "Password Reset",
    CREATE_PAYMENT: "Payment Created",
    UPDATE_LEAD_CONTACT: "Lead Updated",
    CREATE_META_EVENT: "Meta Event",
    CREATE_MOCK_PURCHASE_EVENT: "Mock Purchase",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${styles[action]}`}>
      {labels[action]}
    </span>
  );
}