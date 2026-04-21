"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { login, getMe, isHospitalUser } from "@/lib/auth";

function LoginPageContent() {
  const searchParams = useSearchParams();

  const rawNext = searchParams.get("next");
  const next =
    rawNext && rawNext !== "/login" && !rawNext.startsWith("/login?")
      ? rawNext
      : null;

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

      if (next) {
        window.location.href = next;
        return;
      }

      window.location.href = isHospitalUser(me) ? "/hospital" : "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-5 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-950">
            Sentinel Login
          </h1>
          <p className="text-sm text-slate-700">
            Sign in to access clinic or hospital workflows.
          </p>
        </div>

        <input
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-950 placeholder:text-slate-500 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <input
          type="password"
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-950 placeholder:text-slate-500 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <div className="text-right">
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-blue-700 hover:text-blue-800 hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
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
        <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6 text-slate-700">
          Loading...
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}