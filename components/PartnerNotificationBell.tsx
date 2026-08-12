"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function PartnerNotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch(
          `${API_URL}/api/organizations/me/notifications/?unread=true`,
          { credentials: "include" },
        );
        if (!response.ok) return;
        const data = await response.json();
        setUnreadCount(Array.isArray(data) ? data.length : 0);
      } catch {
        setUnreadCount(0);
      }
    }

    load();
    const interval = window.setInterval(load, 15000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <Link
      href="/notifications"
      className="relative rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
      title="Notifications"
      aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
    >
      🔔
      {unreadCount > 0 ? (
        <span className="absolute -right-2 -top-2 rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
          {unreadCount}
        </span>
      ) : null}
    </Link>
  );
}
