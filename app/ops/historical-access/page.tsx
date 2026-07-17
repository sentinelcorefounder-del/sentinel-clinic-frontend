"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  decideOpsHistoricalAccess,
  fetchOpsHistoricalAccessRequests,
  type HistoricalAccessRequest,
} from "@/lib/api";

function formatDate(value?: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

export default function OpsHistoricalAccessPage() {
  const [items, setItems] = useState<HistoricalAccessRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError("");
      setItems(await fetchOpsHistoricalAccessRequests(statusFilter));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load requests.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [statusFilter]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) => [
      item.patient_name,
      item.master_patient_display,
      item.requesting_organization_name,
      item.purpose,
      item.status,
    ].some((value) => String(value || "").toLowerCase().includes(term)));
  }, [items, search]);

  async function decide(item: HistoricalAccessRequest, decision: "approve" | "reject" | "revoke") {
    const note = window.prompt("Review note:") || "";
    if (!note.trim()) return;

    let days = 30;
    if (decision === "approve") {
      const value = window.prompt("Access duration in days (1–90):", "30");
      if (!value) return;
      days = Math.min(90, Math.max(1, Number(value) || 30));
    }

    try {
      setBusyId(item.id);
      setMessage("");
      setError("");
      await decideOpsHistoricalAccess(item.id, decision, { note, days });
      setMessage("Historical access updated.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update access.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Historical Record Access</h1>
        <p className="mt-1 text-slate-600">Approve time-limited, read-only access to previous Sentinel reports and retinal images.</p>
      </div>

      <div className="grid gap-3 rounded-xl border bg-white p-4 shadow-sm md:grid-cols-[220px_1fr]">
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl border px-3 py-2">
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="revoked">Revoked</option>
          <option value="all">All</option>
        </select>
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search patient, Sentinel ID, clinic or purpose" className="rounded-xl border px-3 py-2" />
      </div>

      {message ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</div> : null}
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div> : null}

      <section className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        {loading ? <p className="p-6">Loading requests...</p> : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-3">Patient</th>
                <th className="p-3">Requesting clinic</th>
                <th className="p-3">Purpose and scope</th>
                <th className="p-3">Consent</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!filtered.length ? <tr><td colSpan={6} className="p-6 text-slate-500">No historical-access requests found.</td></tr> : filtered.map((item) => (
                <tr key={item.id} className="border-t align-top">
                  <td className="p-3">
                    <p className="font-semibold">{item.patient_name}</p>
                    <p className="mt-1 font-mono text-xs font-semibold text-blue-800">{item.master_patient_display}</p>
                  </td>
                  <td className="p-3">
                    <p>{item.requesting_organization_name}</p>
                    <p className="mt-1 text-xs text-slate-500">Requested by {item.requested_by_display || "—"}</p>
                    <p className="text-xs text-slate-500">{formatDate(item.created_at)}</p>
                  </td>
                  <td className="p-3">
                    <p>{item.purpose}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      {item.include_reports ? "Reports" : ""}{item.include_reports && item.include_images ? " + " : ""}{item.include_images ? "Images" : ""}
                    </p>
                  </td>
                  <td className="p-3">
                    <p>{item.consent_reference || "No reference"}</p>
                    <p className="mt-1 text-xs text-slate-500">Record {item.consent_record || "—"}</p>
                  </td>
                  <td className="p-3">
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold capitalize">{item.status.replaceAll("_", " ")}</span>
                    {item.expires_at ? <p className="mt-2 text-xs text-slate-500">Expires {formatDate(item.expires_at)}</p> : null}
                  </td>
                  <td className="p-3">
                    <div className="flex min-w-[190px] flex-col gap-2">
                      {item.status === "pending" ? (
                        <>
                          <button type="button" disabled={busyId === item.id} onClick={() => decide(item, "approve")} className="rounded bg-emerald-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Approve access</button>
                          <button type="button" disabled={busyId === item.id} onClick={() => decide(item, "reject")} className="rounded border border-red-300 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-50">Reject</button>
                        </>
                      ) : null}
                      {item.status === "approved" && item.is_currently_active ? (
                        <>
                          <Link href={`/patients/historical-access/${item.id}`} className="rounded bg-slate-950 px-3 py-2 text-center text-xs font-semibold text-white">View approved records</Link>
                          <button type="button" disabled={busyId === item.id} onClick={() => decide(item, "revoke")} className="rounded border border-amber-400 px-3 py-2 text-xs font-semibold text-amber-800 disabled:opacity-50">Revoke access</button>
                        </>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
