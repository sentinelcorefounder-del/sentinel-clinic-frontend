"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchHospitalSubmissions } from "@/lib/api";

type HospitalSubmission = {
  id: number;
  submission_id: string;
  patient_id_text: string;
  first_name: string;
  last_name: string;
  dob: string;
  patient_sex: string;
  diabetes_type: string;
  submission_status: string;
  baserow_row_id: number | null;
  linked_referral_id: string;
  linked_patient_id: string;
  created_at: string;
};

function statusBadge(status: string) {
  const normalized = (status || "").toLowerCase();

  if (normalized === "linked_to_referral") {
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
  }
  if (normalized === "processing") {
    return "bg-blue-100 text-blue-800 border-blue-200";
  }
  if (normalized === "failed") {
    return "bg-red-100 text-red-800 border-red-200";
  }
  return "bg-slate-100 text-slate-800 border-slate-200";
}

export default function HospitalSubmissionsPage() {
  const [items, setItems] = useState<HospitalSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadItems() {
      try {
        const data = await fetchHospitalSubmissions();
        setItems(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load hospital submissions.");
      } finally {
        setLoading(false);
      }
    }

    loadItems();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 p-10">
        <p className="text-sm font-medium text-slate-700">Loading submissions...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-100 p-10">
        <p className="text-sm font-medium text-red-700">{error}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-10">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Submitted Referrals</h1>
          <p className="mt-1 text-sm text-slate-700">
            Referrals submitted from the hospital portal into Sentinel Ops intake.
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            href="/hospital/referrals/new"
            className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-medium !text-white hover:bg-blue-800"
          >
            New Referral
          </Link>
          <Link
            href="/hospital"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-4 text-sm font-semibold text-slate-900">Submission ID</th>
              <th className="p-4 text-sm font-semibold text-slate-900">Patient</th>
              <th className="p-4 text-sm font-semibold text-slate-900">DOB</th>
              <th className="p-4 text-sm font-semibold text-slate-900">Diabetes</th>
              <th className="p-4 text-sm font-semibold text-slate-900">Status</th>
              <th className="p-4 text-sm font-semibold text-slate-900">Basecrow Row</th>
              <th className="p-4 text-sm font-semibold text-slate-900">Linked Referral</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-sm text-slate-700">
                  No submissions found.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-t border-slate-200 hover:bg-slate-50">
                  <td className="p-4 text-sm font-medium text-slate-900">{item.submission_id}</td>
                  <td className="p-4 text-sm text-slate-900">
                    <div>{item.first_name} {item.last_name}</div>
                    <div className="text-xs text-slate-600">{item.patient_id_text}</div>
                  </td>
                  <td className="p-4 text-sm text-slate-900">{item.dob}</td>
                  <td className="p-4 text-sm text-slate-900">{item.diabetes_type}</td>
                  <td className="p-4 text-sm text-slate-900">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusBadge(item.submission_status)}`}>
                      {item.submission_status}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-900">
                    {item.baserow_row_id ?? "-"}
                  </td>
                  <td className="p-4 text-sm text-slate-900">
                    {item.linked_referral_id || "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}