"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { login, getMe } from "@/lib/auth";

function LoginPageContent() {
  const searchParams = useSearchParams();

  const rawNext = searchParams.get("next");
  const next =
    rawNext && rawNext !== "/login" && !rawNext.startsWith("/login?")
      ? rawNext
      : "/dashboard";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await login(username, password);

      if (user.must_change_password) {
        window.location.href = "/change-password";
        return;
      }

      const me = await getMe();
      if (!me) {
        throw new Error("Login succeeded but no active session was found.");
      }

      window.location.href = next;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-4 rounded-2xl border p-6 shadow-sm bg-white"
      >
        <h1 className="text-2xl font-semibold">Sentinel Login</h1>

        <input
          className="w-full rounded-xl border px-3 py-2"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <input
          type="password"
          className="w-full rounded-xl border px-3 py-2"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <div className="text-right">
          <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
            Forgot password?
          </Link>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-black text-white px-4 py-2"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-6">
          Loading...
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}