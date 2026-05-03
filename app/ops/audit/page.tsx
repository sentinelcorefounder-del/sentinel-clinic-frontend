import { serverFetch } from "@/lib/server-api";

export default async function OpsAuditPage() {
  const logs = await serverFetch("/api/ops/audit-logs/");

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Audit Logs</h1>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="p-3">Time</th>
              <th className="p-3">Actor</th>
              <th className="p-3">Action</th>
              <th className="p-3">Entity</th>
              <th className="p-3">Message</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log: any) => (
              <tr key={log.id} className="border-t align-top">
                <td className="p-3 whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td className="p-3">{log.actor_display}</td>
                <td className="p-3">
                  <span className="rounded bg-slate-100 px-2 py-1">
                    {log.action}
                  </span>
                </td>
                <td className="p-3">
                  {log.entity_type} {log.entity_label ? `- ${log.entity_label}` : ""}
                </td>
                <td className="p-3">{log.message || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {logs.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">No audit logs yet.</div>
        ) : null}
      </div>
    </div>
  );
}