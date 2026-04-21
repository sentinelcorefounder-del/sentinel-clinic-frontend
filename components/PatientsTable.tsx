"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchPatients, searchPatients } from "@/lib/api";
import { Patient } from "@/types/patient";

export default function PatientsTable() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadPatients() {
    setLoading(true);
    try {
      const data = search.trim()
        ? await searchPatients(search)
        : await fetchPatients();
      setPatients(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPatients();
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    await loadPatients();
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={handleSearch}
        className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row"
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by Patient ID, name, or phone"
          className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 placeholder:text-slate-500 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
        <button className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800">
          Search
        </button>
      </form>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-700">Loading patients...</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-4 text-sm font-semibold text-slate-900">Patient ID</th>
                <th className="p-4 text-sm font-semibold text-slate-900">Name</th>
                <th className="p-4 text-sm font-semibold text-slate-900">Sex</th>
                <th className="p-4 text-sm font-semibold text-slate-900">Phone</th>
                <th className="p-4 text-sm font-semibold text-slate-900">City</th>
              </tr>
            </thead>
            <tbody>
              {patients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-sm text-slate-700">
                    No patients found.
                  </td>
                </tr>
              ) : (
                patients.map((patient) => (
                  <tr
                    key={patient.id}
                    className="border-t border-slate-200 hover:bg-slate-50"
                  >
                    <td className="p-4 text-sm font-medium text-slate-900">
                      {patient.patient_id}
                    </td>
                    <td className="p-4 text-sm text-slate-900">
                      <Link
                        href={`/patients/${patient.id}`}
                        className="font-medium text-blue-700 hover:text-blue-800 hover:underline"
                      >
                        {patient.first_name} {patient.last_name}
                      </Link>
                    </td>
                    <td className="p-4 text-sm text-slate-900">
                      {patient.sex || "-"}
                    </td>
                    <td className="p-4 text-sm text-slate-900">
                      {patient.phone || "-"}
                    </td>
                    <td className="p-4 text-sm text-slate-900">
                      {patient.city || "-"}
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