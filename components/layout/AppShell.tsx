"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isLoginRoute = useMemo(() => pathname === "/login", [pathname]);

  if (isLoginRoute) {
    return <main className="min-h-screen bg-background">{children}</main>;
  }

  return (
    <div className="h-dvh overflow-hidden flex flex-col sm:flex-row">
      <SidebarProvider>
        <AppSidebar />

        <main className="relative flex-1 flex flex-col min-h-0 bg-background/60 overflow-y-auto backdrop-blur-[2px]">
          <SidebarTrigger className="fixed top-3 right-3 z-50 md:absolute md:top-4 md:right-4 bg-card/90 backdrop-blur border border-border shadow-sm hover:bg-accent" />
          <div className="pt-12 md:pt-0 min-h-full">{children}</div>
        </main>
      </SidebarProvider>
    </div>
  );
}
