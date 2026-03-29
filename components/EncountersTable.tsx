"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchEncounters, filterEncounters } from "@/lib/api";
import { Encounter } from "@/types/encounter";

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
      <form onSubmit={handleFilter} className="grid gap-3 md:grid-cols-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by encounter or patient"
          className="border rounded p-3"
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border rounded p-3"
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
          className="border rounded p-3"
        />

        <button className="rounded-lg bg-black text-white px-4 py-2">
          Apply Filters
        </button>
      </form>

      {loading ? (
        <p>Loading encounters...</p>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3">Encounter ID</th>
                <th className="p-3">Patient ID</th>
                <th className="p-3">Date</th>
                <th className="p-3">Type</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {encounters.map((encounter) => (
                <tr key={encounter.id} className="border-t">
                  <td className="p-3">
                    <Link href={`/encounters/${encounter.id}`} className="underline">
                      {encounter.encounter_id}
                    </Link>
                  </td>
                  <td className="p-3">{encounter.patient}</td>
                  <td className="p-3">{encounter.encounter_date}</td>
                  <td className="p-3">{encounter.encounter_type}</td>
                  <td className="p-3">{encounter.screening_status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}