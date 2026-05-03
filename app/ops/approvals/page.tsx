import { serverFetch } from "@/lib/server-api";

export default async function OpsApprovalsPage() {
  const reports = await serverFetch("/api/ops/reports/approval-queue/");

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Report Approvals</h1>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="p-3">Report ID</th>
              <th className="p-3">Patient</th>
              <th className="p-3">Clinic</th>
              <th className="p-3">Encounter</th>
              <th className="p-3">Outcome</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r: any) => (
              <tr key={r.id} className="border-t">
                <td className="p-3">{r.report_id}</td>
                <td className="p-3">{r.patient_name}</td>
                <td className="p-3">{r.clinic_name}</td>
                <td className="p-3">{r.encounter_id_display}</td>
                <td className="p-3">{r.urgency_outcome}</td>
                <td className="p-3">{r.report_status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}