"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth, type UserRole } from "@/contexts/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("admin");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAssistanceModal, setShowAssistanceModal] = useState(false);
  const [assistanceRequested, setAssistanceRequested] = useState(false);

  const canSubmit = useMemo(() => email.trim() !== "" && password.trim() !== "", [email, password]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    setIsSubmitting(true);

    const localIdPart = email.split("@")[0]?.trim() || "user";

    login({
      userId: localIdPart,
      role,
    });

    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">Sign in</h1>
        <p className="mt-1 text-sm text-gray-500">Use your CRM account credentials.</p>

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">
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
            <p className="text-sm font-medium text-gray-700">Role</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole("admin")}
                className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                  role === "admin"
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => setRole("sales_rep")}
                className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                  role === "sales_rep"
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Sales Rep
              </button>
            </div>
          </div>

          <div className="pt-1 text-sm">
            {role === "admin" ? (
              <Link href="/login?reset=true" className="text-blue-600 hover:text-blue-700 hover:underline">
                Forgot password? Reset here.
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setShowAssistanceModal(true);
                  setAssistanceRequested(false);
                }}
                className="text-blue-600 hover:text-blue-700 hover:underline"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-lg">
            <h2 className="text-lg font-semibold text-gray-900">Manager Assistance</h2>
            <p className="mt-2 text-sm text-gray-600">
              Send a reset request to your reporting manager for account verification.
            </p>

            {assistanceRequested && (
              <p className="mt-3 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
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
