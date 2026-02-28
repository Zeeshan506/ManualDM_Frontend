import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { AuthProvider } from "@/contexts/AuthContext";
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
      <body className={`${inter.className} bg-background text-foreground`}>
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>

        {/* ================= GLOBAL TOASTER ================= */}
        {/* Placed here so it can render over any page content */}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}

