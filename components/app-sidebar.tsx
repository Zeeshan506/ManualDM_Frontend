"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Activity,
  BotMessageSquare,
  Inbox,
  LayoutDashboard,
  LogOut,
  MessageSquare,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/AuthContext"

export function AppSidebar() {
  const router = useRouter()
  const { user, logout } = useAuth()

  const displayName = user?.userId || "User"
  const roleLabel = user?.role === "admin" ? "Admin" : "Sales Rep"
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U"

  const handleLogout = () => {
    logout()
    router.push("/login")
    router.refresh()
  }

  const adminNavItems = [
    { href: "/admin", label: "Dashboard", tooltip: "Dashboard", icon: LayoutDashboard },
    { href: "/admin", label: "Team Activity", tooltip: "Team Activity", icon: Activity },
    { href: "/leads", label: "All Chats", tooltip: "All Chats", icon: MessageSquare },
  ]

  const salesNavItems = [
    { href: "/leads", label: "Unassigned Pool", tooltip: "Unassigned Pool", icon: Inbox },
    { href: "/leads/active", label: "My Chats", tooltip: "My Chats", icon: MessageSquare },
  ]

  const navItems = user?.role === "admin" ? adminNavItems : salesNavItems

  return (
    <Sidebar collapsible="icon" className="[&_[data-sidebar=sidebar]]:bg-gray-900 [&_[data-sidebar=sidebar]]:text-gray-300">
      <SidebarHeader className="h-16 border-b border-gray-800 px-6 group-data-[collapsible=icon]:px-2">
        <div className="flex items-center gap-2 text-white font-bold text-lg tracking-wide group-data-[collapsible=icon]:justify-center">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <BotMessageSquare className="w-5 h-5 text-white" />
          </div>
          <span className="group-data-[collapsible=icon]:hidden">PSC CRM</span>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-4 group-data-[collapsible=icon]:p-2">
        <SidebarMenu className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.tooltip}
                  className="h-auto rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-gray-800 hover:text-white data-[active=true]:bg-gray-800 data-[active=true]:text-white"
                >
                  <Link href={item.href}>
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-800 p-4 group-data-[collapsible=icon]:p-2">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors group group-data-[collapsible=icon]:justify-center"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="text-sm font-medium text-white truncate">{displayName}</p>
            <p className="text-xs text-gray-500 truncate group-hover:text-gray-400 transition-colors">
              {roleLabel}
            </p>
          </div>
          <LogOut className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors shrink-0 group-data-[collapsible=icon]:hidden" />
        </button>
      </SidebarFooter>
    </Sidebar>
  )
}