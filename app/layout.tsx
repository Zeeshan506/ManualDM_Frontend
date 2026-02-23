import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PSC CRM",
  description: "Internal Instagram Lead Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} bg-gray-50 text-gray-900 h-screen overflow-hidden flex flex-col sm:flex-row`}
      >
        <SidebarProvider>
          <AppSidebar />

          <main className="relative flex-1 flex flex-col h-full bg-gray-50 overflow-hidden">
            <SidebarTrigger className="absolute top-4 right-4 sm:top-4 sm:right-4 z-50" />
            {children}
          </main>
        </SidebarProvider>

        {/* ================= GLOBAL TOASTER ================= */}
        {/* Placed here so it can render over any page content */}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}

