"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ensureCsrf } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type Notification = {
  id: number;
  title: string;
  message: string;
  level: "info" | "success" | "warning" | "danger";
  action_path: string;
  is_read: boolean;
  created_at: string;
};

const tone = {
  info: "border-blue-200 bg-blue-50",
  success: "border-green-200 bg-green-50",
  warning: "border-amber-200 bg-amber-50",
  danger: "border-red-200 bg-red-50",
};

export default function PartnerNotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const response = await fetch(`${API_URL}/api/organizations/me/notifications/`, {
      credentials: "include",
    });
    if (response.ok) setItems(await response.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function post(path: string) {
    const { csrfToken } = await ensureCsrf();
    await fetch(`${API_URL}${path}`, {
      method: "POST",
      credentials: "include",
      headers: { "X-CSRFToken": csrfToken },
    });
    await load();
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="mt-1 text-slate-600">Finance and report updates for your organisation.</p>
        </div>
        {items.some((item) => !item.is_read) ? (
          <button
            onClick={() => post("/api/organizations/me/notifications/mark-all-read/")}
            className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"
          >
            Mark all as read
          </button>
        ) : null}
      </div>

      {loading ? <p className="text-slate-600">Loading notifications…</p> : null}
      {!loading && items.length === 0 ? (
        <div className="rounded-2xl border bg-white p-8 text-center text-slate-600">
          No notifications yet.
        </div>
      ) : null}
      <div className="space-y-3">
        {items.map((item) => (
          <article key={item.id} className={`rounded-2xl border p-5 ${tone[item.level]} ${item.is_read ? "opacity-75" : "shadow-sm"}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-bold text-slate-950">{item.title}</h2>
                <p className="mt-1 text-sm text-slate-700">{item.message}</p>
                <p className="mt-2 text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                {item.action_path ? (
                  <Link
                    href={item.action_path}
                    onClick={() => !item.is_read && post(`/api/organizations/me/notifications/${item.id}/read/`)}
                    className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                  >
                    Open
                  </Link>
                ) : null}
                {!item.is_read ? (
                  <button
                    onClick={() => post(`/api/organizations/me/notifications/${item.id}/read/`)}
                    className="rounded-lg border bg-white px-3 py-2 text-xs font-semibold"
                  >
                    Mark read
                  </button>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
