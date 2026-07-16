"use client";

import { useEffect, useState } from "react";
import {
  fetchDistributionQueue,
  markPatientDeliveryRequired,
  releaseReportToHospital,
  type DistributionQueueItem,
} from "@/lib/api";

export default function OpsDistributionPage() {
  const [items, setItems] = useState<DistributionQueueItem[]>([]);
  const [statusFilter, setStatusFilter] = useState("awaiting_distribution");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError("");
      setItems(
        await fetchDistributionQueue({
          status: statusFilter,
          search,
        })
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load Distribution Centre."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [statusFilter]);

  async function release(item: DistributionQueueItem) {
    const confirmed = window.confirm(
      `Release report ${item.report_id} to ${item.source_hospital_name}?\n\nThe hospital will immediately be able to view and download it.`
    );
    if (!confirmed) return;

    try {
      setBusyId(item.id);
      setError("");
      setMessage("");
      await releaseReportToHospital(item.id);
      setMessage(
        `Report ${item.report_id} released to ${item.source_hospital_name}.`
      );
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to release report."
      );
    } finally {
      setBusyId(null);
    }
  }

  async function requirePatientDelivery(item: DistributionQueueItem) {
    try {
      setBusyId(item.id);
      setError("");
      setMessage("");
      await markPatientDeliveryRequired(item.id);
      setMessage(
        `Patient delivery marked as required for ${item.report_id}.`
      );
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update report."
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Distribution Centre</h1>
        <p className="mt-1 text-slate-600">
          Control release of clinically issued reports to hospitals and prepare patient delivery.
        </p>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          load();
        }}
        className="grid gap-3 rounded-xl border bg-white p-4 shadow-sm md:grid-cols-[1fr_220px_auto]"
      >
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search report, patient, referral or hospital"
          className="rounded border px-3 py-2"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded border px-3 py-2"
        >
          <option value="awaiting_distribution">Awaiting Distribution</option>
          <option value="released_to_hospital">Released to Hospital</option>
          <option value="completed">Completed</option>
          <option value="all">All</option>
        </select>
        <button className="rounded bg-slate-950 px-4 py-2 font-semibold text-white">
          Apply
        </button>
      </form>

      {message ? (
        <div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <section className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        {loading ? (
          <p className="p-6 text-slate-600">Loading distribution queue...</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-3">Report</th>
                <th className="p-3">Patient</th>
                <th className="p-3">Source</th>
                <th className="p-3">Hospital</th>
                <th className="p-3">Clinic</th>
                <th className="p-3">Issued</th>
                <th className="p-3">Distribution</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!items.length ? (
                <tr>
                  <td colSpan={8} className="p-6 text-slate-500">
                    No reports found in this queue.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="p-3">
                      <p className="font-semibold">{item.report_id}</p>
                      <a
                        href={item.pdf_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-700 underline"
                      >
                        Preview PDF
                      </a>
                    </td>
                    <td className="p-3">
                      <p>{item.patient_name}</p>
                      <p className="text-xs text-slate-500">{item.patient_id}</p>
                    </td>
                    <td className="p-3">
                      <p>{(item.source_type || "-").replaceAll("_", " ")}</p>
                      <p className="text-xs text-slate-500">
                        {(item.workflow_route || "-").replaceAll("_", " ")}
                      </p>
                    </td>
                    <td className="p-3">
                      <p>{item.source_hospital_name || "—"}</p>
                      <p className="text-xs text-slate-500">{item.referral_id}</p>
                    </td>
                    <td className="p-3">{item.clinic_name || "—"}</td>
                    <td className="p-3">{item.issued_at || "—"}</td>
                    <td className="p-3">
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                        {item.distribution_status.replaceAll("_", " ")}
                      </span>
                      {item.patient_delivery_required ? (
                        <p className="mt-2 text-xs font-medium text-blue-700">
                          Patient delivery required
                        </p>
                      ) : null}
                    </td>
                    <td className="p-3">
                      <div className="flex min-w-[190px] flex-col gap-2">
                        {item.has_hospital_recipient &&
                        item.distribution_status !== "released_to_hospital" ? (
                          <button
                            type="button"
                            disabled={busyId === item.id}
                            onClick={() => release(item)}
                            className="rounded bg-emerald-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                          >
                            Release to Hospital
                          </button>
                        ) : null}
                        {!item.patient_delivery_required ? (
                          <button
                            type="button"
                            disabled={busyId === item.id}
                            onClick={() => requirePatientDelivery(item)}
                            className="rounded border border-blue-600 bg-white px-3 py-2 text-xs font-semibold text-blue-700 disabled:opacity-50"
                          >
                            Mark Patient Delivery
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
