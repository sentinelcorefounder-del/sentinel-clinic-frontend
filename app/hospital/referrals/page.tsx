"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchHospitalReferrals, getReportPdfUrl } from "@/lib/api";

type HospitalReferral = {
  id: number;
  referral_id: string;
  patient_id_text: string;
  patient_linked_id?: string;
  first_name: string;
  last_name: string;
  matched_clinic_name: string;
  referral_status: string;
  report_ready: boolean;
  report_pk?: number;
  hospital_commission_amount: string;
  payout_status: string;
};

function statusBadge(status: string) {
  const normalized = (status || "").toLowerCase();

  if (normalized === "completed") {
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
  }
  if (normalized === "clinic_matched") {
    return "bg-blue-100 text-blue-800 border-blue-200";
  }
  if (normalized === "cancelled") {
    return "bg-red-100 text-red-800 border-red-200";
  }
  return "bg-slate-100 text-slate-800 border-slate-200";
}

function displayStatus(status: string) {
  if (status === "clinic_matched") return "Clinic Matched";
  if (status === "completed") return "Completed";
  if (status === "cancelled") return "Cancelled";
  return "Submitted";
}

export default function HospitalReferralsPage() {
  const [referrals, setReferrals] = useState<HospitalReferral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadReferrals() {
      try {
        const data = await fetchHospitalReferrals();
        setReferrals(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load hospital referrals.");
      } finally {
        setLoading(false);
      }
    }

    loadReferrals();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 p-10">
        <p className="text-sm font-medium text-slate-700">Loading referrals...</p>
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
          <h1 className="text-2xl font-bold text-slate-950">Referrals</h1>
          <p className="mt-1 text-sm text-slate-700">
            A simple view of your hospital’s referral progress.
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
              <th className="p-4 text-sm font-semibold text-slate-900">Referral ID</th>
              <th className="p-4 text-sm font-semibold text-slate-900">Patient</th>
              <th className="p-4 text-sm font-semibold text-slate-900">Clinic</th>
              <th className="p-4 text-sm font-semibold text-slate-900">Status</th>
              <th className="p-4 text-sm font-semibold text-slate-900">Report</th>
              <th className="p-4 text-sm font-semibold text-slate-900">Payout</th>
            </tr>
          </thead>
          <tbody>
            {referrals.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-sm text-slate-700">
                  No referrals found.
                </td>
              </tr>
            ) : (
              referrals.map((referral) => (
                <tr key={referral.id} className="border-t border-slate-200 hover:bg-slate-50">
                  <td className="p-4">
                    <Link
                      href={`/hospital/referrals/${referral.id}`}
                      className="font-medium text-blue-700 hover:text-blue-800 hover:underline"
                    >
                      {referral.referral_id}
                    </Link>
                  </td>

                  <td className="p-4 text-sm text-slate-900">
                    <div>{referral.first_name} {referral.last_name}</div>
                    <div className="text-xs text-slate-600">
                      {referral.patient_linked_id || referral.patient_id_text}
                    </div>
                  </td>

                  <td className="p-4 text-sm text-slate-900">
                    {referral.matched_clinic_name || "-"}
                  </td>

                  <td className="p-4 text-sm text-slate-900">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusBadge(referral.referral_status)}`}>
                      {displayStatus(referral.referral_status)}
                    </span>
                  </td>

                  <td className="p-4 text-sm text-slate-900">
                    {referral.report_ready && referral.report_pk ? (
                      <button
                        type="button"
                        onClick={() =>
                          window.open(
                            getReportPdfUrl(referral.report_pk!),
                            "_blank",
                            "noopener,noreferrer"
                          )
                        }
                        className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-medium !text-white hover:bg-blue-800"
                      >
                        Download PDF
                      </button>
                    ) : (
                      <span className="text-slate-600">Not ready</span>
                    )}
                  </td>

                  <td className="p-4 text-sm text-slate-900">
                    ₦{referral.hospital_commission_amount}
                    <div className="text-xs text-slate-600">{referral.payout_status}</div>
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