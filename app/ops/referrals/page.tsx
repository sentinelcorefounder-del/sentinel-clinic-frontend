import Link from "next/link";
import { serverFetch } from "@/lib/server-api";

export default async function OpsReferralsPage() {
  const referrals = await serverFetch("/api/ops/referrals/");

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Referrals</h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitor hospital and self-referrals across Sentinel.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left text-slate-700">
            <tr>
              <th className="p-4 font-semibold">Referral</th>
              <th className="p-4 font-semibold">Patient</th>
              <th className="p-4 font-semibold">Hospital</th>
              <th className="p-4 font-semibold">Clinic</th>
              <th className="p-4 font-semibold">Referral Status</th>
              <th className="p-4 font-semibold">Payment</th>
              <th className="p-4 font-semibold">View</th>
            </tr>
          </thead>

          <tbody>
            {referrals.map((r: any) => (
              <tr
                key={r.id}
                className="border-t border-slate-100 transition hover:bg-slate-50"
              >
                <td className="p-4">
                  <div className="flex flex-col gap-2">
                    <span className="font-semibold text-slate-900">
                      {r.referral_id}
                    </span>

                    {r.source_system === "self_referral" ? (
                      <span className="w-fit rounded-full bg-purple-100 px-2 py-1 text-xs font-semibold text-purple-700">
                        Self Referral
                      </span>
                    ) : (
                      <span className="w-fit rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                        Hospital Referral
                      </span>
                    )}
                  </div>
                </td>

                <td className="p-4 text-slate-700">
                  {r.patient_name || "-"}
                </td>

                <td className="p-4 text-slate-700">
                  {r.source_hospital_name || "-"}
                </td>

                <td className="p-4 text-slate-700">
                  {r.matched_clinic_name || "-"}
                </td>

                <td className="p-4">
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                    {r.referral_status || "pending"}
                  </span>
                </td>

                <td className="p-4">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      r.payment_status === "paid"
                        ? "bg-green-100 text-green-700"
                        : r.payment_status === "pending"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {r.payment_status || "No payment"}
                  </span>
                </td>

                <td className="p-4">
                  <Link
                    href={`/ops/referrals/${r.id}`}
                    className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
                  >
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {referrals.length === 0 && (
          <div className="p-10 text-center text-sm text-slate-500">
            No referrals found.
          </div>
        )}
      </div>
    </div>
  );
}