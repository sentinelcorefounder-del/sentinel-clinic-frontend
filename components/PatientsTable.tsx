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
      <form onSubmit={handleSearch} className="flex gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by Patient ID, name, or phone"
          className="flex-1 border rounded p-3"
        />
        <button className="rounded-lg bg-black text-white px-4 py-2">
          Search
        </button>
      </form>

      {loading ? (
        <p>Loading patients...</p>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3">Patient ID</th>
                <th className="p-3">Name</th>
                <th className="p-3">Sex</th>
                <th className="p-3">Phone</th>
                <th className="p-3">City</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient) => (
                <tr key={patient.id} className="border-t">
                  <td className="p-3">{patient.patient_id}</td>
                  <td className="p-3">
                    <Link href={`/patients/${patient.id}`} className="underline">
                      {patient.first_name} {patient.last_name}
                    </Link>
                  </td>
                  <td className="p-3">{patient.sex}</td>
                  <td className="p-3">{patient.phone}</td>
                  <td className="p-3">{patient.city}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}