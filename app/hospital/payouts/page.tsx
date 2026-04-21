"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchHospitalPayouts } from "@/lib/api";

type HospitalPayoutItem = {
  id: number;
  referral_id: string;
  patient_id_display: string;
  patient_first_name: string;
  patient_last_name: string;
  matched_clinic_name: string;
  hospital_commission_amount: string;
  payout_status: string;
  payout_date: string | null;
  report_ready: boolean;
};

function payoutBadge(status: string) {
  const normalized = (status || "").toLowerCase();

  if (normalized === "paid") {
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
  }
  if (normalized === "approved") {
    return "bg-blue-100 text-blue-800 border-blue-200";
  }
  if (normalized === "pending") {
    return "bg-amber-100 text-amber-800 border-amber-200";
  }
  return "bg-slate-100 text-slate-800 border-slate-200";
}

export default function HospitalPayoutsPage() {
  const [payouts, setPayouts] = useState<HospitalPayoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPayouts() {
      try {
        const data = await fetchHospitalPayouts();
        setPayouts(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load hospital payouts.");
      } finally {
        setLoading(false);
      }
    }

    loadPayouts();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 p-10">
        <p className="text-sm font-medium text-slate-700">Loading payouts...</p>
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
          <h1 className="text-2xl font-bold text-slate-950">Hospital Payouts</h1>
          <p className="mt-1 text-sm text-slate-700">
            Track hospital commission visibility across completed and payable referrals.
          </p>
        </div>

        <Link
          href="/hospital"
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
        >
          Back to Dashboard
        </Link>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-4 text-sm font-semibold text-slate-900">Referral</th>
              <th className="p-4 text-sm font-semibold text-slate-900">Patient</th>
              <th className="p-4 text-sm font-semibold text-slate-900">Clinic</th>
              <th className="p-4 text-sm font-semibold text-slate-900">Report</th>
              <th className="p-4 text-sm font-semibold text-slate-900">Commission</th>
              <th className="p-4 text-sm font-semibold text-slate-900">Payout Status</th>
              <th className="p-4 text-sm font-semibold text-slate-900">Payout Date</th>
            </tr>
          </thead>
          <tbody>
            {payouts.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-sm text-slate-700">
                  No payout records found.
                </td>
              </tr>
            ) : (
              payouts.map((item) => (
                <tr key={item.id} className="border-t border-slate-200">
                  <td className="p-4">
                    <Link
                      href={`/hospital/referrals/${item.id}`}
                      className="font-medium text-blue-700 hover:text-blue-800 hover:underline"
                    >
                      {item.referral_id}
                    </Link>
                  </td>

                  <td className="p-4 text-sm text-slate-900">
                    <div>{item.patient_first_name} {item.patient_last_name}</div>
                    <div className="text-xs text-slate-600">{item.patient_id_display}</div>
                  </td>

                  <td className="p-4 text-sm text-slate-900">
                    {item.matched_clinic_name || "-"}
                  </td>

                  <td className="p-4 text-sm text-slate-900">
                    {item.report_ready ? (
                      <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
                        Ready
                      </span>
                    ) : (
                      <span className="text-slate-600">Pending</span>
                    )}
                  </td>

                  <td className="p-4 text-sm font-medium text-slate-900">
                    ₦{item.hospital_commission_amount}
                  </td>

                  <td className="p-4 text-sm text-slate-900">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${payoutBadge(item.payout_status)}`}>
                      {item.payout_status}
                    </span>
                  </td>

                  <td className="p-4 text-sm text-slate-900">
                    {item.payout_date || "-"}
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