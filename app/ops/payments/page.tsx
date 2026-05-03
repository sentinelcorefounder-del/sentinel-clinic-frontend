import { serverFetch } from "@/lib/server-api";

export default async function OpsPaymentsPage() {
  const payments = await serverFetch("/api/ops/payments/");

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Payments</h1>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="p-3">Payment ID</th>
              <th className="p-3">Patient</th>
              <th className="p-3">Referral</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Status</th>
              <th className="p-3">Link</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p: any) => (
              <tr key={p.id} className="border-t">
                <td className="p-3">{p.payment_id}</td>
                <td className="p-3">{p.patient_name}</td>
                <td className="p-3">{p.referral_id_display}</td>
                <td className="p-3">
                  {p.currency} {p.amount}
                </td>
                <td className="p-3">{p.status}</td>
                <td className="p-3">
                  {p.payment_link ? (
                    <a href={p.payment_link} target="_blank" className="text-blue-600 underline">
                      Open link
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}