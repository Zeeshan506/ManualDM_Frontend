"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminRouteGroupLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthLoading } = useAuth();

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.role === "sales_rep") {
      router.replace("/dashboard");
    }
  }, [isAuthLoading, user, router]);

  if (isAuthLoading || !user || user.role === "sales_rep") {
    return null;
  }

  return <>{children}</>;
}
