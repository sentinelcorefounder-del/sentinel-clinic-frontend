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
  matched_clinic_name?: string;
  referral_status: string;
  report_ready: boolean;
  report_pk?: number;
  report_id_display?: string;
  report_pdf_url?: string;
  report_status?: string;
  targeted_patient_report_url?: string;
  targeted_clinician_report_url?: string;
  combined_patient_bundle_url?: string;
  combined_clinician_bundle_url?: string;
  hospital_commission_amount: string;
  payout_status: string;
  payment_status?: string;
  payment_amount?: string;
  payment_currency?: string;
  payment_reference?: string;
  payment_paid_at?: string;
};

function statusBadge(status: string) {
  const normalized = (status || "").toLowerCase();

  if (
    normalized === "completed" ||
    normalized === "report_issued" ||
    normalized === "issued"
  ) {
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
  }

  if (normalized === "clinic_matched" || normalized === "in_clinic") {
    return "bg-blue-100 text-blue-800 border-blue-200";
  }

  if (normalized === "cancelled") {
    return "bg-red-100 text-red-800 border-red-200";
  }

  return "bg-slate-100 text-slate-800 border-slate-200";
}

function displayStatus(status: string) {
  if (status === "clinic_matched") return "Clinic Matched";
  if (status === "in_clinic") return "In Clinic";
  if (status === "report_created") return "Report Being Prepared";
  if (status === "submitted_to_ops") return "Awaiting Sentinel Ops Review";
  if (status === "returned_to_clinic") return "Returned to Clinic for Correction";
  if (status === "report_issued") return "Report Issued";
  if (status === "completed") return "Completed";
  if (status === "cancelled") return "Cancelled";
  return "Submitted";
}

function paymentBadge(status?: string) {
  const normalized = (status || "not_created").toLowerCase();

  if (normalized === "paid" || normalized === "success" || normalized === "successful") {
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
  }

  if (normalized === "pending" || normalized === "processing") {
    return "bg-amber-100 text-amber-800 border-amber-200";
  }

  if (normalized === "failed" || normalized === "exception") {
    return "bg-red-100 text-red-800 border-red-200";
  }

  if (normalized === "draft") {
    return "bg-slate-100 text-slate-800 border-slate-200";
  }

  return "bg-slate-50 text-slate-600 border-slate-200";
}

function displayPaymentStatus(status?: string) {
  const normalized = (status || "not_created").toLowerCase();

  if (normalized === "paid" || normalized === "success" || normalized === "successful") return "Paid";
  if (normalized === "pending" || normalized === "processing") return "Pending";
  if (normalized === "failed") return "Failed";
  if (normalized === "exception") return "Exception";
  if (normalized === "draft") return "Draft";
  return "Not Created";
}

function displayPaymentAmount(referral: HospitalReferral) {
  if (!referral.payment_amount) return "";
  return `${referral.payment_currency || "NGN"} ${referral.payment_amount}`;
}

function reportUrl(referral: HospitalReferral) {
  if (referral.report_status !== "issued") return "";
  if (referral.report_pdf_url) return referral.report_pdf_url;
  if (referral.report_pk) return getReportPdfUrl(referral.report_pk);
  return "";
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
      <main className="sentinel-page min-h-screen">
        <p className="text-sm font-medium text-slate-700">Loading referrals...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="sentinel-page min-h-screen">
        <p className="text-sm font-medium text-red-700">{error}</p>
      </main>
    );
  }

  return (
    <main className="sentinel-page min-h-screen">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Referrals</h1>
          <p className="mt-1 text-sm text-slate-700">
            Track clinic assignment, assessment progress, report status, patient payment status, and payout status.
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            href="/hospital/referrals/new"
            className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold !text-white hover:bg-slate-800"
          >
            New Referral
          </Link>
          <Link
            href="/hospital"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
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
              <th className="p-4 text-sm font-semibold text-slate-900">Matched Clinic</th>
              <th className="p-4 text-sm font-semibold text-slate-900">Status</th>
              <th className="p-4 text-sm font-semibold text-slate-900">Report</th>
              <th className="p-4 text-sm font-semibold text-slate-900">Payment Status</th>
              <th className="p-4 text-sm font-semibold text-slate-900">Payout</th>
            </tr>
          </thead>

          <tbody>
            {referrals.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-sm text-slate-700">
                  No referrals found.
                </td>
              </tr>
            ) : (
              referrals.map((referral) => {
                const pdfUrl = reportUrl(referral);

                return (
                  <tr
                    key={referral.id}
                    className="border-t border-slate-200 hover:bg-slate-50"
                  >
                    <td className="p-4">
                      <Link
                        href={`/hospital/referrals/${referral.id}`}
                        className="font-semibold text-blue-700 hover:text-blue-800 hover:underline"
                      >
                        {referral.referral_id}
                      </Link>
                    </td>

                    <td className="p-4 text-sm text-slate-900">
                      <div className="font-semibold">
                        {referral.first_name} {referral.last_name}
                      </div>
                      <div className="text-xs text-slate-600">
                        {referral.patient_linked_id || referral.patient_id_text || "No patient ID"}
                      </div>
                    </td>

                    <td className="p-4 text-sm text-slate-900">
                      {referral.matched_clinic_name ? (
                        <span className="font-medium text-slate-950">
                          {referral.matched_clinic_name}
                        </span>
                      ) : (
                        <span className="text-slate-500">Not assigned</span>
                      )}
                    </td>

                    <td className="p-4 text-sm text-slate-900">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadge(
                          referral.referral_status
                        )}`}
                      >
                        {displayStatus(referral.referral_status)}
                      </span>
                    </td>

                    <td className="p-4 text-sm text-slate-900">
                      {referral.report_ready && (pdfUrl || referral.targeted_clinician_report_url) ? (
                        <div className="flex flex-col gap-1">{pdfUrl ? <a href={pdfUrl} target="_blank" rel="noreferrer" className="inline-flex rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold !text-white hover:bg-slate-800">Diabetic Report</a> : null}{referral.targeted_clinician_report_url ? <a href={referral.targeted_clinician_report_url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-blue-700 underline">Clinician Targeted Report</a> : null}{referral.targeted_patient_report_url ? <a href={referral.targeted_patient_report_url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-blue-700 underline">Patient Targeted Report</a> : null}{referral.combined_clinician_bundle_url ? <a href={referral.combined_clinician_bundle_url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-blue-700 underline">Combined Clinician Bundle</a> : null}{referral.combined_patient_bundle_url ? <a href={referral.combined_patient_bundle_url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-blue-700 underline">Combined Patient Bundle</a> : null}</div>
                      ) : (
                        <span className="text-slate-500">
                          {referral.report_status === "submitted_to_ops"
                            ? "Awaiting Sentinel Ops review"
                            : referral.report_status === "returned_to_clinic" || referral.report_status === "ops_rejected"
                              ? "Returned to clinic for correction"
                              : "Report pending"}
                        </span>
                      )}

                      {referral.report_id_display ? (
                        <div className="mt-1 text-xs text-slate-500">
                          {referral.report_id_display}
                        </div>
                      ) : null}
                    </td>

                    <td className="p-4 text-sm text-slate-900">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${paymentBadge(
                          referral.payment_status
                        )}`}
                      >
                        {displayPaymentStatus(referral.payment_status)}
                      </span>

                      {referral.payment_amount ? (
                        <div className="mt-1 text-xs text-slate-600">
                          {displayPaymentAmount(referral)}
                        </div>
                      ) : null}
                    </td>

                    <td className="p-4 text-sm text-slate-900">
                      <div>₦{referral.hospital_commission_amount || "0.00"}</div>
                      <div className="text-xs text-slate-600">
                        {referral.payout_status || "not_due"}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
