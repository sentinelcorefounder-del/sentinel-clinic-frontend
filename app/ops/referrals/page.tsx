import Link from "next/link";
import { serverFetch } from "@/lib/server-api";

export default async function OpsReferralsPage() {
  const referrals = await serverFetch("/api/ops/referrals/");

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Referrals</h1>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="p-3">Referral ID</th>
              <th className="p-3">Patient</th>
              <th className="p-3">Hospital</th>
              <th className="p-3">Clinic</th>
              <th className="p-3">Referral Status</th>
              <th className="p-3">Payment</th>
              <th className="p-3">View</th>
            </tr>
          </thead>
          <tbody>
            {referrals.map((r: any) => (
              <tr key={r.id} className="border-t">
                <td className="p-3">{r.referral_id}</td>
                <td className="p-3">{r.patient_name}</td>
                <td className="p-3">{r.source_hospital_name}</td>
                <td className="p-3">{r.matched_clinic_name || "-"}</td>
                <td className="p-3">{r.referral_status}</td>
                <td className="p-3">{r.payment_status || "-"}</td>
                <td className="p-3">
                  <Link href={`/ops/referrals/${r.id}`} className="text-blue-600 underline">
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}