import Link from "next/link";
import { serverFetch } from "@/lib/server-api";

export default async function OpsPatientsPage() {
  const patients = await serverFetch("/api/ops/patients/");

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Patients</h1>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="p-3">Patient ID</th>
              <th className="p-3">Name</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Email</th>
              <th className="p-3">Clinic</th>
              <th className="p-3">Referrals</th>
              <th className="p-3">View</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((p: any) => (
              <tr key={p.id} className="border-t">
                <td className="p-3">{p.patient_id}</td>
                <td className="p-3">{p.name}</td>
                <td className="p-3">{p.phone || "-"}</td>
                <td className="p-3">{p.email || "-"}</td>
                <td className="p-3">{p.assigned_clinic || "-"}</td>
                <td className="p-3">{p.referrals_count}</td>
                <td className="p-3">
                  <Link href={`/ops/patients/${p.id}`} className="text-blue-600 underline">
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