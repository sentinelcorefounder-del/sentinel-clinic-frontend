import Link from "next/link";
import { serverFetch } from "@/lib/server-api";

export default async function OpsClinicsPage() {
  const clinics = await serverFetch("/api/ops/clinics/");

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Clinics</h1>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="p-3">Code</th>
              <th className="p-3">Clinic</th>
              <th className="p-3">Email</th>
              <th className="p-3">Assigned Referrals</th>
              <th className="p-3">Reports</th>
              <th className="p-3">View</th>
            </tr>
          </thead>
          <tbody>
            {clinics.map((c: any) => (
              <tr key={c.id} className="border-t">
                <td className="p-3">{c.code}</td>
                <td className="p-3">{c.name}</td>
                <td className="p-3">{c.contact_email || "-"}</td>
                <td className="p-3">{c.assigned_referrals}</td>
                <td className="p-3">{c.reports_count}</td>
                <td className="p-3">
                  <Link href={`/ops/clinics/${c.id}`} className="text-blue-600 underline">
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