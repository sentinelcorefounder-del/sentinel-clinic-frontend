"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchHospitalReports } from "@/lib/api";

export default function HospitalReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError("");
      setReports(await fetchHospitalReports(search));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load reports.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <main className="sentinel-page min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Issued Reports</h1>
        <p className="mt-1 text-sm text-slate-600">Reports approved and issued to your hospital by Sentinel Ops.</p>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); load(); }} className="mb-6 flex gap-3 rounded-xl border bg-white p-4">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Patient, report or referral" className="flex-1 rounded border px-3 py-2" />
        <button className="rounded bg-slate-950 px-4 py-2 font-semibold text-white">Search</button>
      </form>
      {error ? <p className="mb-4 text-red-700">{error}</p> : null}
      {loading ? <p>Loading reports...</p> : (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100"><tr><th className="p-3">Report</th><th className="p-3">Patient</th><th className="p-3">Referral</th><th className="p-3">Clinic</th><th className="p-3">Issued</th><th className="p-3">Actions</th></tr></thead>
            <tbody>
              {!reports.length ? <tr><td colSpan={6} className="p-5 text-slate-500">No issued reports found.</td></tr> :
                reports.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="p-3 font-semibold">{r.report_id}</td>
                    <td className="p-3"><div>{r.patient_name}</div><div className="text-xs text-slate-500">{r.patient_id}</div></td>
                    <td className="p-3">{r.referral_id}</td>
                    <td className="p-3">{r.clinic_name || "-"}</td>
                    <td className="p-3">{r.issued_at || "-"}</td>
                    <td className="p-3"><Link href={`/hospital/reports/${r.id}`} className="rounded bg-slate-950 px-3 py-2 text-xs font-semibold text-white">Open Report</Link></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
