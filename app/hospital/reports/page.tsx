"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ReportFormatMenu from "@/components/ReportFormatMenu";
import { fetchHospitalReports } from "@/lib/api";

function formatDate(value?: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

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
        <p className="mt-1 text-sm text-slate-600">
          Reports approved, released and made available to your hospital by Sentinel Ops.
        </p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); load(); }} className="mb-6 flex gap-3 rounded-xl border bg-white p-4">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Patient, Sentinel ID, report or referral" className="flex-1 rounded border px-3 py-2" />
        <button className="rounded bg-slate-950 px-4 py-2 font-semibold text-white">Search</button>
      </form>

      {error ? <p className="mb-4 text-red-700">{error}</p> : null}
      {loading ? <p>Loading reports...</p> : (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-3">Report</th>
                <th className="p-3">Patient</th>
                <th className="p-3">Referral</th>
                <th className="p-3">Clinic</th>
                <th className="p-3">Issued</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!reports.length ? <tr><td colSpan={6} className="p-5 text-slate-500">No issued reports found.</td></tr> :
                reports.map((report) => (
                  <tr key={report.id} className="border-t align-top">
                    <td className="p-3 font-semibold">{report.report_id}</td>
                    <td className="p-3">
                      <div className="font-medium">{report.patient_name}</div>
                      <div className="mt-1 font-mono text-xs text-slate-500">{report.sentinel_patient_id || report.patient_id}</div>
                    </td>
                    <td className="p-3">{report.referral_id || "—"}</td>
                    <td className="p-3">{report.clinic_name || "—"}</td>
                    <td className="p-3">{formatDate(report.issued_at)}</td>
                    <td className="p-3">
                      <div className="flex min-w-[210px] flex-col gap-2">
                        <ReportFormatMenu reportId={report.id} role="hospital" />
                        <Link href={`/Hospital/reports/${report.id}`} className="rounded border px-3 py-2 text-center text-xs font-semibold text-slate-800">
                          Open report details
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
