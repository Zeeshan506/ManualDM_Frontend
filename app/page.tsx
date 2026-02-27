"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
const AUTH_TOKEN_COOKIE = "crm_auth_token";
const USER_ID_COOKIE = "crm_user_id";
const USER_ROLE_COOKIE = "crm_user_role";

type MeResponse = {
  id: number;
  username: string;
  role: "admin" | "sales_rep" | "sudo_admin";
};

function getCookie(name: string) {
  if (typeof document === "undefined") {
    return null;
  }

  const prefix = `${name}=`;
  const match = document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(prefix));

  return match ? decodeURIComponent(match.substring(prefix.length)) : null;
}

function clearCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;
}

function clearAuthCookies() {
  clearCookie(AUTH_TOKEN_COOKIE);
  clearCookie(USER_ID_COOKIE);
  clearCookie(USER_ROLE_COOKIE);
}

export default function RoleRoutingHubPage() {
  const router = useRouter();

  useEffect(() => {
    let isCancelled = false;

    const routeUser = async () => {
      const token = getCookie(AUTH_TOKEN_COOKIE);
      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          clearAuthCookies();
          router.replace("/login");
          return;
        }

        const me = (await response.json()) as MeResponse;
        if (isCancelled) {
          return;
        }

        router.replace(me.role === "sudo_admin" ? "/admin/users" : me.role === "admin" ? "/admin" : "/dashboard");
      } catch (error) {
        console.error(error);
        if (!isCancelled) {
          clearAuthCookies();
          router.replace("/login");
        }
      }
    };

    routeUser();

    return () => {
      isCancelled = true;
    };
  }, [router]);

  return (
    <div className="h-full min-h-[calc(100vh-4rem)] w-full flex items-center justify-center text-sm text-gray-500">
      Routing to your dashboard...
    </div>
  );
}