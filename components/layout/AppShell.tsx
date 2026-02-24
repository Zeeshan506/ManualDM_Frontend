"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isLoginRoute = useMemo(() => pathname === "/login", [pathname]);

  if (isLoginRoute) {
    return <main className="min-h-screen bg-gray-50">{children}</main>;
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col sm:flex-row">
      <SidebarProvider>
        <AppSidebar />

        <main className="relative flex-1 flex flex-col h-full bg-gray-50 overflow-hidden">
          <SidebarTrigger className="absolute top-4 right-4 sm:top-4 sm:right-4 z-50" />
          {children}
        </main>
      </SidebarProvider>
    </div>
  );
}
