"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ensureCsrf } from "@/lib/auth";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function ChangePasswordPage() {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (newPassword !== confirmPassword) {
      setMessage("New password and confirm password do not match.");
      setLoading(false);
      return;
    }

    try {
      const { csrfToken } = await ensureCsrf();

      const res = await fetch(`${API_BASE}/api/auth/change-password/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMessage(data.detail || "Failed to change password.");
        setLoading(false);
        return;
      }

      setMessage("Password changed successfully. Please log in again.");
      setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch {
      setMessage("Failed to change password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-md mx-auto p-8">
      <div className="border rounded-lg p-6 space-y-4 bg-white">
        <h1 className="text-2xl font-bold">Change Password</h1>
        <p className="text-sm text-gray-600">
          You must change your temporary password before continuing.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Current Password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full border rounded p-3"
            required
          />

          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full border rounded p-3"
            required
          />

          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border rounded p-3"
            required
          />

          {message && <p className="text-sm">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-black text-white px-4 py-3"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </main>
  );
}