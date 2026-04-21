"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchEncounters, filterEncounters } from "@/lib/api";
import { Encounter } from "@/types/encounter";

function statusBadge(status: string) {
  const normalized = (status || "").toLowerCase();

  if (normalized === "completed") {
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
  }
  if (
    normalized === "scheduled" ||
    normalized === "in_progress" ||
    normalized === "images_uploaded" ||
    normalized === "under_review" ||
    normalized === "report_ready"
  ) {
    return "bg-blue-100 text-blue-800 border-blue-200";
  }
  if (normalized === "cancelled") {
    return "bg-red-100 text-red-800 border-red-200";
  }
  return "bg-slate-100 text-slate-800 border-slate-200";
}

export default function EncountersTable() {
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadEncounters() {
    setLoading(true);
    try {
      const hasFilters = search || status || date;
      const data = hasFilters
        ? await filterEncounters({ search, status, date })
        : await fetchEncounters();
      setEncounters(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEncounters();
  }, []);

  async function handleFilter(e: React.FormEvent) {
    e.preventDefault();
    await loadEncounters();
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={handleFilter}
        className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4"
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by encounter or patient"
          className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 placeholder:text-slate-500 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="">All statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="in_progress">In Progress</option>
          <option value="images_uploaded">Images Uploaded</option>
          <option value="under_review">Under Review</option>
          <option value="report_ready">Report Ready</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />

        <button className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800">
          Apply Filters
        </button>
      </form>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-700">Loading encounters...</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-4 text-sm font-semibold text-slate-900">Encounter ID</th>
                <th className="p-4 text-sm font-semibold text-slate-900">Patient ID</th>
                <th className="p-4 text-sm font-semibold text-slate-900">Date</th>
                <th className="p-4 text-sm font-semibold text-slate-900">Type</th>
                <th className="p-4 text-sm font-semibold text-slate-900">Status</th>
              </tr>
            </thead>
            <tbody>
              {encounters.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-sm text-slate-700">
                    No encounters found.
                  </td>
                </tr>
              ) : (
                encounters.map((encounter) => (
                  <tr
                    key={encounter.id}
                    className="border-t border-slate-200 hover:bg-slate-50"
                  >
                    <td className="p-4 text-sm text-slate-900">
                      <Link
                        href={`/encounters/${encounter.id}`}
                        className="font-medium text-blue-700 hover:text-blue-800 hover:underline"
                      >
                        {encounter.encounter_id}
                      </Link>
                    </td>
                    <td className="p-4 text-sm text-slate-900">
                      {encounter.patient}
                    </td>
                    <td className="p-4 text-sm text-slate-900">
                      {encounter.encounter_date}
                    </td>
                    <td className="p-4 text-sm text-slate-900">
                      {encounter.encounter_type}
                    </td>
                    <td className="p-4 text-sm text-slate-900">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusBadge(
                          encounter.screening_status
                        )}`}
                      >
                        {encounter.screening_status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}