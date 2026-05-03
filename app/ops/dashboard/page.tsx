import { serverFetch } from "@/lib/server-api";

export default async function OpsDashboardPage() {
  const data = await serverFetch("/api/ops/dashboard/");

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Ops Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Patients" value={data.network.patients} />
        <Card title="Total Referrals" value={data.referrals.total} />
        <Card title="Matched Referrals" value={data.referrals.clinic_matched} />
        <Card title="Paid Payments" value={data.payments.paid} />
        <Card title="Pending Payments" value={data.payments.pending} />
        <Card title="Reports Awaiting Ops" value={data.reports.submitted_to_ops} />
        <Card title="Clinics" value={data.network.clinics} />
        <Card title="Hospitals" value={data.network.hospitals} />
      </div>
    </div>
  );
}

function Card({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}