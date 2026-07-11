"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchHospitalReferralById, getReportPdfUrl } from "@/lib/api";

type Props = {
  params: Promise<{ id: string }>;
};

type HospitalReferralDetail = {
  id: number;
  referral_id: string;
  patient_linked_id?: string;
  patient_id_text?: string;
  first_name: string;
  last_name: string;
  source_hospital_name: string;
  matched_clinic_name: string;
  report_pk?: number;
  report_id_display?: string;
  report_status?: string;
  referral_date: string | null;
  referral_status: string;
  report_ready: boolean;
  hospital_commission_amount: string;
  payout_status: string;
  payout_date: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
};

function badgeClass(status: string) {
  const normalized = (status || "").toLowerCase();

  if (normalized === "completed" || normalized === "paid") {
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
  }
  if (normalized === "matched" || normalized === "booked" || normalized === "approved") {
    return "bg-blue-100 text-blue-800 border-blue-200";
  }
  if (normalized === "pending") {
    return "bg-amber-100 text-amber-800 border-amber-200";
  }
  if (normalized === "cancelled" || normalized === "no_show") {
    return "bg-red-100 text-red-800 border-red-200";
  }
  return "bg-slate-100 text-slate-800 border-slate-200";
}

export default function HospitalReferralDetailPage({ params }: Props) {
  const [referral, setReferral] = useState<HospitalReferralDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function resolveParamsAndLoad() {
      try {
        const resolvedParams = await params;
        const data = await fetchHospitalReferralById(resolvedParams.id);
        setReferral(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load hospital referral.");
      } finally {
        setLoading(false);
      }
    }

    resolveParamsAndLoad();
  }, [params]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 p-10">
        <p className="text-sm font-medium text-slate-700">Loading referral...</p>
      </main>
    );
  }

  if (error || !referral) {
    return (
      <main className="min-h-screen bg-slate-100 p-10">
        <p className="text-sm font-medium text-red-700">
          {error || "Referral not found."}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-10">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Referral Detail</h1>
          <p className="mt-1 text-sm text-slate-700">
            Hospital referral tracking, report readiness, and payout visibility
          </p>
        </div>

        <Link
          href="/hospital/referrals"
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
        >
          Back to Referrals
        </Link>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <p><strong>Referral ID:</strong> {referral.referral_id}</p>
          <p><strong>Patient ID:</strong> {referral.patient_linked_id || referral.patient_id_text || "-"}</p>
          <p><strong>Patient:</strong> {referral.first_name} {referral.last_name}</p>
          <p><strong>Hospital:</strong> {referral.source_hospital_name}</p>
          <p><strong>Matched Clinic:</strong> {referral.matched_clinic_name || "-"}</p>

          <div>
            <strong>Referral Status:</strong>{" "}
            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${badgeClass(referral.referral_status)}`}>
              {referral.referral_status}
            </span>
          </div>

          <p><strong>Referral Date:</strong> {referral.referral_date || "-"}</p>
          <p><strong>Report Ready:</strong> {referral.report_ready ? "Yes" : "No"}</p>
          <p><strong>Report ID:</strong> {referral.report_id_display || "-"}</p>
          <p><strong>Hospital Commission:</strong> ₦{referral.hospital_commission_amount}</p>

          <div>
            <strong>Payout Status:</strong>{" "}
            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${badgeClass(referral.payout_status)}`}>
              {referral.payout_status}
            </span>
          </div>

          <p><strong>Payout Date:</strong> {referral.payout_date || "-"}</p>
        </div>

        {referral.report_status === "issued" && referral.report_ready && referral.report_pk ? (
          <div className="mt-6">
            <button
              type="button"
              onClick={() =>
                window.open(
                  getReportPdfUrl(referral.report_pk!),
                  "_blank",
                  "noopener,noreferrer"
                )
              }
              className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
            >
              Download Report PDF
            </button>
          </div>
        ) : null}

        <div className="mt-6">
          <h2 className="mb-2 text-lg font-semibold text-slate-950">Notes</h2>
          <p className="text-sm text-slate-700">{referral.notes || "-"}</p>
        </div>
      </section>
    </main>
  );
}