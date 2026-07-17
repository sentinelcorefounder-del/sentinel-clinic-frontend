"use client";

import { useEffect, useState } from "react";
import {
  fetchPatientDeliveries,
  sendPatientDelivery,
  getReportPdfUrl,
  type PatientReportDelivery,
} from "@/lib/api";

function pretty(value?: string | null) {
  if (!value) return "-";
  return value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function OpsPatientDeliveryPage() {
  const [items, setItems] = useState<PatientReportDelivery[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError("");
      setItems(await fetchPatientDeliveries(filter));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load deliveries.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [filter]);

  async function send(item: PatientReportDelivery) {
    if (!item.consent_confirmed) {
      setError("Electronic delivery consent must be confirmed before sending.");
      return;
    }
    if (!window.confirm(`Send the final patient report ${item.report_id_display} to ${item.recipient}?`)) return;
    try {
      setBusyId(item.id);
      setMessage("");
      setError("");
      await sendPatientDelivery(item.id);
      setMessage(`Patient report ${item.report_id_display} was sent to ${item.recipient}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delivery failed.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Patient Delivery Centre</h1>
          <p className="mt-1 text-slate-600">
            Preview the patient-friendly final PDF, confirm consent and send it by email.
          </p>
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-xl border bg-white px-3 py-2">
          <option value="">All deliveries</option>
          <option value="pending">Pending</option>
          <option value="sent">Sent</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
        Only an issued, final patient-format report should be sent. Each delivery attempt is retained in the delivery history.
      </div>

      {message ? <div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</div> : null}
      {error ? <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div> : null}

      <section className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        {loading ? <p className="p-6">Loading deliveries...</p> : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-3">Report</th>
                <th className="p-3">Patient</th>
                <th className="p-3">Recipient</th>
                <th className="p-3">Consent</th>
                <th className="p-3">Status</th>
                <th className="p-3">Sent</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!items.length ? (
                <tr><td colSpan={7} className="p-6 text-slate-500">No deliveries found.</td></tr>
              ) : items.map((item) => (
                <tr key={item.id} className="border-t align-top">
                  <td className="p-3 font-semibold">{item.report_id_display}</td>
                  <td className="p-3">{item.patient_name}</td>
                  <td className="p-3">{item.recipient}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${item.consent_confirmed ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                      {item.consent_confirmed ? "Confirmed" : "Missing"}
                    </span>
                  </td>
                  <td className="p-3">{pretty(item.status)}</td>
                  <td className="p-3">{formatDateTime(item.sent_at)}</td>
                  <td className="p-3">
                    <div className="flex min-w-44 flex-col gap-2">
                      <a href={getReportPdfUrl(item.report, "patient")} target="_blank" rel="noreferrer" className="rounded border px-3 py-2 text-center text-xs font-semibold">
                        Preview Patient PDF
                      </a>
                      {item.status === "pending" || item.status === "failed" ? (
                        <button
                          disabled={busyId === item.id || !item.consent_confirmed}
                          onClick={() => send(item)}
                          className="rounded bg-emerald-700 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {busyId === item.id ? "Sending..." : item.status === "failed" ? "Retry Email" : "Send Email"}
                        </button>
                      ) : null}
                      {item.failure_reason ? <p className="text-xs text-red-700">{item.failure_reason}</p> : null}
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
