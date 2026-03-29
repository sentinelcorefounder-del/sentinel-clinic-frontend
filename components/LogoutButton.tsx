"use client";

import { useState } from "react";
import { logout } from "@/lib/auth";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    try {
      setLoading(true);
      await logout();
      window.location.href = "/login";
    } catch (err) {
      alert(err instanceof Error ? err.message : "Logout failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="rounded-lg border px-3 py-2 text-sm"
    >
      {loading ? "Signing out..." : "Logout"}
    </button>
  );
}