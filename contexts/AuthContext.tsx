"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type UserRole = "admin" | "sales_rep";

type AuthUser = {
  userId: string;
  role: UserRole;
  accessToken?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
};

const AUTH_TOKEN_COOKIE = "crm_auth_token";
const USER_ID_COOKIE = "crm_user_id";
const USER_ROLE_COOKIE = "crm_user_role";
const COOKIE_MAX_AGE = 60 * 60 * 8;

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

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

function setCookie(name: string, value: string, maxAge: number) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; samesite=lax`;
}

function clearCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const readUserFromCookies = useCallback((): AuthUser | null => {
    const token = getCookie(AUTH_TOKEN_COOKIE);
    const userId = getCookie(USER_ID_COOKIE);
    const roleValue = getCookie(USER_ROLE_COOKIE);

    if (token && userId && (roleValue === "admin" || roleValue === "sales_rep")) {
      return {
        userId,
        role: roleValue,
      };
    }
    return null;
  }, []);

  useEffect(() => {
    setUser(readUserFromCookies());
  }, [readUserFromCookies]);

  const login = useCallback((nextUser: AuthUser) => {
    const tokenValue = nextUser.accessToken?.trim() || `${nextUser.userId}-${Date.now()}`;
    setCookie(AUTH_TOKEN_COOKIE, tokenValue, COOKIE_MAX_AGE);
    setCookie(USER_ID_COOKIE, nextUser.userId, COOKIE_MAX_AGE);
    setCookie(USER_ROLE_COOKIE, nextUser.role, COOKIE_MAX_AGE);
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    clearCookie(AUTH_TOKEN_COOKIE);
    clearCookie(USER_ID_COOKIE);
    clearCookie(USER_ROLE_COOKIE);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      login,
      logout,
    }),
    [user, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
