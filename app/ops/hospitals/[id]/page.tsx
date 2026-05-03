import { serverFetch } from "@/lib/server-api";

export default async function OpsHospitalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await serverFetch(`/api/ops/hospitals/${id}/`);

  const hospital = data.hospital;
  const referrals = data.referrals || [];
  const payments = data.payments || [];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">{hospital.name}</h1>
      <p className="text-slate-500 mb-6">{hospital.code}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Box title="Hospital Info">
          <p>Email: {hospital.contact_email || "-"}</p>
          <p>Phone: {hospital.phone || "-"}</p>
          <p>Address: {hospital.address || "-"}</p>
        </Box>

        <Box title="Summary">
          <p>Total Referrals: {referrals.length}</p>
          <p>Total Payments: {payments.length}</p>
          <p>Paid: {payments.filter((p: any) => p.status === "paid").length}</p>
        </Box>
      </div>

      <Section title="Referrals">
        <Table
          headers={["Referral ID", "Patient", "Clinic", "Status"]}
          rows={referrals.map((r: any) => [
            r.referral_id,
            r.patient_name,
            r.matched_clinic_name || "-",
            r.referral_status,
          ])}
        />
      </Section>

      <Section title="Payments">
        <Table
          headers={["Payment ID", "Patient", "Amount", "Status"]}
          rows={payments.map((p: any) => [
            p.payment_id,
            p.patient_name,
            `${p.currency} ${p.amount}`,
            p.status,
          ])}
        />
      </Section>
    </div>
  );
}

function Box({ title, children }: any) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="font-bold text-lg mb-3">{title}</h2>
      <div className="text-sm space-y-1">{children}</div>
    </div>
  );
}

function Section({ title, children }: any) {
  return (
    <section className="bg-white rounded-xl shadow p-6 mb-6">
      <h2 className="font-bold text-xl mb-4">{title}</h2>
      {children}
    </section>
  );
}

function Table({ headers, rows }: any) {
  if (!rows.length) return <p className="text-sm text-slate-500">No data</p>;

  return (
    <table className="w-full text-sm">
      <thead className="bg-slate-100 text-left">
        <tr>
          {headers.map((h: string) => (
            <th key={h} className="p-3">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row: any[], i: number) => (
          <tr key={i} className="border-t">
            {row.map((cell, j) => (
              <td key={j} className="p-3">{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}