"use client";

import { useState } from "react";
import { ensureCsrf } from "@/lib/auth";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const { csrfToken } = await ensureCsrf();

      const res = await fetch(`${API_BASE}/api/auth/forgot-password/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMessage(data.detail || "Failed to send reset link.");
        setLoading(false);
        return;
      }

      setMessage(data.detail || "If an account exists for that email, a reset link has been sent.");
    } catch {
      setMessage("Failed to send reset link.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-md mx-auto p-8">
      <div className="border rounded-lg p-6 space-y-4 bg-white">
        <h1 className="text-2xl font-bold">Forgot Password</h1>
        <p className="text-sm text-gray-600">
          Enter your email address and we will send you a password reset link.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded p-3"
            required
          />

          {message && <p className="text-sm">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-black text-white px-4 py-3"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
      </div>
    </main>
  );
}