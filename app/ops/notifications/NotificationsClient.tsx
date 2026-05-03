"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  return parts.length === 2 ? parts.pop()?.split(";").shift() || "" : "";
}

async function ensureCsrf() {
  await fetch(`${API_URL}/api/auth/csrf/`, {
    credentials: "include",
  });

  return getCookie("csrftoken");
}

async function apiAction(path: string, method = "POST") {
  const csrf = await ensureCsrf();

  const res = await fetch(`${API_URL}${path}`, {
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrf,
    },
  });

  let data: any = {};

  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    throw new Error(
      data.detail ||
        data.message ||
        "Something went wrong. Please try again."
    );
  }

  return data;
}

export default function NotificationsClient({
  initialNotifications,
}: {
  initialNotifications: any[];
}) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState("");

  async function markRead(id: number) {
    try {
      setLoading(`read-${id}`);
      setMessage("");

      await apiAction(`/api/ops/notifications/${id}/read/`);

      setNotifications((items) =>
        items.map((item) =>
          item.id === id
            ? {
                ...item,
                is_read: true,
                read_at: new Date().toISOString(),
              }
            : item
        )
      );
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading("");
    }
  }

  async function markAllRead() {
    try {
      setLoading("mark-all");
      setMessage("");

      await apiAction("/api/ops/notifications/mark-all-read/");

      setNotifications((items) =>
        items.map((item) => ({
          ...item,
          is_read: true,
          read_at: new Date().toISOString(),
        }))
      );

      setMessage("All notifications marked as read.");
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading("");
    }
  }

  async function deleteNotification(id: number) {
    try {
      setLoading(`delete-${id}`);
      setMessage("");

      await apiAction(`/api/ops/notifications/${id}/delete/`, "DELETE");

      setNotifications((items) => items.filter((item) => item.id !== id));
      setMessage("Notification deleted.");
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading("");
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="mt-1 text-sm text-slate-600">
            {unreadCount} unread notification{unreadCount === 1 ? "" : "s"}
          </p>
        </div>

        <button
          onClick={markAllRead}
          disabled={loading !== "" || unreadCount === 0}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {loading === "mark-all" ? "Updating..." : "Mark all as read"}
        </button>
      </div>

      {message ? (
        <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 text-sm">
          {message}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl bg-white shadow">
        {notifications.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">
            No notifications yet.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-left">
              <tr>
                <th className="p-3">Status</th>
                <th className="p-3">Time</th>
                <th className="p-3">Level</th>
                <th className="p-3">Title</th>
                <th className="p-3">Message</th>
                <th className="p-3">Entity</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((n: any) => (
                <tr
                  key={n.id}
                  className={`border-t align-top ${
                    n.is_read ? "bg-white" : "bg-blue-50"
                  }`}
                >
                  <td className="p-3">
                    {n.is_read ? (
                      <span className="text-slate-500">Read</span>
                    ) : (
                      <span className="font-semibold text-blue-700">
                        Unread
                      </span>
                    )}
                  </td>

                  <td className="whitespace-nowrap p-3">
                    {new Date(n.created_at).toLocaleString()}
                  </td>

                  <td className="p-3">{n.level}</td>

                  <td className="p-3 font-medium">{n.title}</td>

                  <td className="p-3">{n.message || "-"}</td>

                  <td className="p-3">
                    {n.entity_type}{" "}
                    {n.entity_label ? `- ${n.entity_label}` : ""}
                  </td>

                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      {!n.is_read ? (
                        <button
                          onClick={() => markRead(n.id)}
                          disabled={loading !== ""}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs hover:bg-slate-50 disabled:opacity-50"
                        >
                          {loading === `read-${n.id}` ? "..." : "Mark read"}
                        </button>
                      ) : null}

                      <button
                        onClick={() => deleteNotification(n.id)}
                        disabled={loading !== ""}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        {loading === `delete-${n.id}` ? "..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}