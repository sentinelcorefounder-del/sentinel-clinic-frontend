import { serverFetch } from "@/lib/server-api";

export default async function OpsClinicDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await serverFetch(`/api/ops/clinics/${id}/`);

  const clinic = data.clinic;
  const patients = data.patients || [];
  const referrals = data.referrals || [];
  const reports = data.reports || [];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">{clinic.name}</h1>
      <p className="text-slate-500 mb-6">{clinic.code}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Box title="Clinic Info">
          <p>Email: {clinic.contact_email || "-"}</p>
          <p>Phone: {clinic.phone || "-"}</p>
          <p>Address: {clinic.address || "-"}</p>
        </Box>

        <Box title="Summary">
          <p>Patients: {patients.length}</p>
          <p>Referrals: {referrals.length}</p>
          <p>Reports: {reports.length}</p>
        </Box>
      </div>

      <Section title="Patients">
        <Table
          headers={["Patient ID", "Name", "Phone"]}
          rows={patients.map((p: any) => [
            p.patient_id,
            p.name,
            p.phone || "-",
          ])}
        />
      </Section>

      <Section title="Referrals">
        <Table
          headers={["Referral ID", "Hospital", "Status"]}
          rows={referrals.map((r: any) => [
            r.referral_id,
            r.source_hospital_name,
            r.referral_status,
          ])}
        />
      </Section>

      <Section title="Reports">
        <Table
          headers={["Report ID", "Patient", "Status", "Outcome"]}
          rows={reports.map((r: any) => [
            r.report_id,
            r.patient_name,
            r.report_status,
            r.urgency_outcome,
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
            <th key={h} className="p-3">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row: any[], i: number) => (
          <tr key={i} className="border-t">
            {row.map((cell, j) => (
              <td key={j} className="p-3">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}