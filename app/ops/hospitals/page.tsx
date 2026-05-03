import Link from "next/link";
import { serverFetch } from "@/lib/server-api";

export default async function OpsHospitalsPage() {
  const hospitals = await serverFetch("/api/ops/hospitals/");

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Hospitals</h1>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="p-3">Code</th>
              <th className="p-3">Hospital</th>
              <th className="p-3">Email</th>
              <th className="p-3">Referrals</th>
              <th className="p-3">Paid</th>
              <th className="p-3">View</th>
            </tr>
          </thead>
          <tbody>
            {hospitals.map((h: any) => (
              <tr key={h.id} className="border-t">
                <td className="p-3">{h.code}</td>
                <td className="p-3">{h.name}</td>
                <td className="p-3">{h.contact_email || "-"}</td>
                <td className="p-3">{h.referrals_count}</td>
                <td className="p-3">{h.paid_payments}</td>
                <td className="p-3">
                  <Link href={`/ops/hospitals/${h.id}`} className="text-blue-600 underline">
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