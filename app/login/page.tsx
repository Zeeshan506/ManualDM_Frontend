"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth, type UserRole } from "@/contexts/AuthContext";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

type LoginApiSuccess = {
  access_token: string;
  token_type: string;
  user_id: number;
  username: string;
  role: UserRole;
};

type LoginApiError = {
  detail?: string;
};

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("admin");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showAssistanceModal, setShowAssistanceModal] = useState(false);
  const [assistanceRequested, setAssistanceRequested] = useState(false);

  const canSubmit = useMemo(() => username.trim() !== "" && password.trim() !== "", [username, password]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    const normalizedUsername = username.trim();
    const normalizedPassword = password;

    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: normalizedUsername,
          password: normalizedPassword,
        }),
      });

      if (!response.ok) {
        let apiError: LoginApiError | null = null;
        try {
          apiError = (await response.json()) as LoginApiError;
        } catch {
          apiError = null;
        }

        setErrorMessage(apiError?.detail || "Unable to sign in. Please try again.");
        return;
      }

      const data = (await response.json()) as LoginApiSuccess;

      const isAdminSelection = role === "admin";
      const isAdminLikeAccount = data.role === "admin" || data.role === "sudo_admin";
      const roleSelectionMatches = isAdminSelection ? isAdminLikeAccount : data.role === role;

      if (!roleSelectionMatches) {
        const accountRoleLabel = isAdminLikeAccount ? "Admin" : "Sales Rep";
        setErrorMessage(`Account role is ${accountRoleLabel}. Please select the correct role and try again.`);
        return;
      }

      login({
        userId: String(data.user_id),
        role: data.role,
        accessToken: data.access_token,
      });

      const nextPath = data.role === "sudo_admin" ? "/admin/users" : data.role === "admin" ? "/admin" : "/dashboard";
      router.push(nextPath);
      router.refresh();
    } catch (error) {
      console.error(error);
      setErrorMessage("Unable to reach the server. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,theme(colors.primary/.18),transparent_50%)]" />

      <div className="relative w-full max-w-md rounded-3xl border border-border/80 bg-card/95 p-6 sm:p-7 shadow-lg backdrop-blur">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">PSC CRM</p>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">Use your CRM account credentials.</p>
        </div>

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium text-foreground/90">
              Username
            </label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Enter your username"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-foreground/90">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground/90">Role</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole("admin")}
                className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                  role === "admin"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => setRole("sales_rep")}
                className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                  role === "sales_rep"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                Sales Rep
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </div>
          )}

          <div className="pt-1 text-sm">
            {role === "admin" ? (
              <Link href="/login?reset=true" className="text-primary hover:opacity-80 hover:underline">
                Forgot password? Reset here.
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setShowAssistanceModal(true);
                  setAssistanceRequested(false);
                }}
                className="text-primary hover:opacity-80 hover:underline"
              >
                Need password help? Request manager assistance.
              </button>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={!canSubmit || isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>

      {showAssistanceModal && role === "sales_rep" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-card-foreground">Manager Assistance</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Send a reset request to your reporting manager for account verification.
            </p>

            {assistanceRequested && (
              <p className="mt-3 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
                Request sent successfully. Your manager will contact you shortly.
              </p>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowAssistanceModal(false)}>
                Close
              </Button>
              <Button type="button" onClick={() => setAssistanceRequested(true)}>
                Send Request
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
