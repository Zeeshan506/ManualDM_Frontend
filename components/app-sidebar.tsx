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
  Users,
} from "lucide-react"
import { NotificationCenter } from "@/components/notifications/NotificationCenter"
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

  const handleLogout = async () => {
    await logout()
    router.push("/login")
    router.refresh()
  }

  const adminNavItems = [
    { href: "/admin", label: "Dashboard", tooltip: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/users", label: "Users", tooltip: "Users", icon: Users },
    { href: "/team-activity", label: "Team Activity", tooltip: "Team Activity", icon: Activity },
    { href: "/leads", label: "Leads", tooltip: "Leads", icon: MessageSquare },
    { href: "/chats", label: "All Chats", tooltip: "All Chats", icon: MessageSquare },
  ]

  const salesNavItems = [
    { href: "/dashboard", label: "Unassigned Pool", tooltip: "Unassigned Pool", icon: Inbox },
    { href: "/leads", label: "Leads", tooltip: "Leads", icon: MessageSquare },
    { href: "/chats", label: "My Chats", tooltip: "My Chats", icon: MessageSquare },
  ]

  const superAdminNavItems = [
    { href: "/admin/users", label: "Users", tooltip: "Users", icon: Users },
    { href: "/admin", label: "Dashboard", tooltip: "Dashboard", icon: LayoutDashboard },
    { href: "/team-activity", label: "Team Activity", tooltip: "Team Activity", icon: Activity },
    { href: "/dashboard", label: "Unassigned Pool", tooltip: "Unassigned Pool", icon: Inbox },
    { href: "/leads", label: "Leads", tooltip: "Leads", icon: MessageSquare },
    { href: "/chats", label: "All Chats", tooltip: "All Chats", icon: MessageSquare },
  ]

  const navItems = user?.role === "sudo_admin"
    ? superAdminNavItems
    : user?.role === "admin"
      ? adminNavItems
      : salesNavItems

  return (
    <Sidebar collapsible="icon" className="[&_[data-sidebar=sidebar]]:bg-sidebar [&_[data-sidebar=sidebar]]:text-sidebar-foreground [&_[data-sidebar=sidebar]]:border-r [&_[data-sidebar=sidebar]]:border-sidebar-border">
      <SidebarHeader className="h-16 border-b border-sidebar-border px-6 group-data-[collapsible=icon]:px-2">
        <div className="flex items-center gap-2 text-sidebar-foreground font-bold text-lg tracking-wide group-data-[collapsible=icon]:justify-center">
          <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center shrink-0 shadow-sm">
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
                  className="h-auto rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
                >
                  <Link href={item.href}>
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
          <NotificationCenter />
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4 group-data-[collapsible=icon]:p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip="Logout"
              className="h-auto rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}