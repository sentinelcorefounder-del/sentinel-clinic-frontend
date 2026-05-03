import { serverFetch } from "@/lib/server-api";

export default async function OpsNotificationsPage() {
  const notifications = await serverFetch("/api/ops/notifications/");

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Notifications</h1>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">
            No notifications yet.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-left">
              <tr>
                <th className="p-3">Status</th>
                <th className="p-3">Time</th>
                <th className="p-3">Level</th>
                <th className="p-3">Title</th>
                <th className="p-3">Message</th>
                <th className="p-3">Entity</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((n: any) => (
                <tr
                  key={n.id}
                  className={`border-t align-top ${
                    n.is_read ? "bg-white" : "bg-blue-50"
                  }`}
                >
                  <td className="p-3">
                    {n.is_read ? (
                      <span className="text-slate-500">Read</span>
                    ) : (
                      <span className="font-semibold text-blue-700">Unread</span>
                    )}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    {new Date(n.created_at).toLocaleString()}
                  </td>
                  <td className="p-3">{n.level}</td>
                  <td className="p-3 font-medium">{n.title}</td>
                  <td className="p-3">{n.message || "-"}</td>
                  <td className="p-3">
                    {n.entity_type} {n.entity_label ? `- ${n.entity_label}` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}