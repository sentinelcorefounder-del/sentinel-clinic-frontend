import Link from "next/link";
import { serverFetch } from "@/lib/server-api";

export default async function OpsPatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await serverFetch(`/api/ops/patients/${id}/`);

  const patient = data.patient;
  const referrals = data.referrals || [];
  const payments = data.payments || [];
  const reports = data.reports || [];
  const uploads = data.uploads || [];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">{patient.name}</h1>
      <p className="text-slate-500 mb-6">{patient.patient_id}</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Box title="Patient Profile">
          <p>DOB: {patient.date_of_birth}</p>
          <p>Sex: {patient.sex}</p>
          <p>Phone: {patient.phone || "-"}</p>
          <p>Email: {patient.email || "-"}</p>
          <p>Address: {patient.address || "-"}</p>
          <p>City: {patient.city || "-"}</p>
          <p>State: {patient.state || "-"}</p>
          <p>Country: {patient.country || "-"}</p>
        </Box>

        <Box title="Care Status">
          <p>Consent: {patient.consent_status || "-"}</p>
          <p>Assigned Clinic: {patient.assigned_clinic || "-"}</p>
          <p>Referral Status: {patient.referral_status || "-"}</p>
          <p>Appointment Date: {patient.appointment_date || "-"}</p>
        </Box>

        <Box title="Summary">
          <p>Referrals: {referrals.length}</p>
          <p>Payments: {payments.length}</p>
          <p>Reports: {reports.length}</p>
          <p>Images: {uploads.length}</p>
        </Box>
      </div>

      <Section title="Referrals">
        <Table
          headers={["Referral ID", "Hospital", "Clinic", "Status", "Payment", "Open"]}
          rows={referrals.map((r: any) => [
            r.referral_id,
            r.source_hospital_name || "-",
            r.matched_clinic_name || "-",
            r.referral_status || "-",
            r.payment_status || "-",
            <Link key={r.id} href={`/ops/referrals/${r.id}`} className="text-blue-600 underline">
              Open
            </Link>,
          ])}
        />
      </Section>

      <Section title="Payments">
        <Table
          headers={["Payment ID", "Amount", "Status", "Paid At", "Link"]}
          rows={payments.map((p: any) => [
            p.payment_id,
            `${p.currency} ${p.amount}`,
            p.status,
            p.paid_at || "-",
            p.payment_link ? (
              <a key={p.id} href={p.payment_link} target="_blank" className="text-blue-600 underline">
                Open
              </a>
            ) : (
              "-"
            ),
          ])}
        />
      </Section>

      <Section title="Reports">
        <Table
          headers={["Report ID", "Encounter", "Status", "Outcome", "Review Date", "PDF"]}
          rows={reports.map((r: any) => [
            r.report_id,
            r.encounter_id_display || "-",
            r.report_status,
            r.urgency_outcome,
            r.review_date,
            r.report_pdf_url ? (<a key={r.id} href={r.report_pdf_url} target="_blank" className="text-blue-600 underline">View PDF</a>) : "-",
          ])}
        />
      </Section>

      <Section title="Images">
        {uploads.length === 0 ? (
          <p className="text-sm text-slate-500">No images uploaded yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {uploads.map((u: any) => (
              <div key={u.id} className="border rounded p-3">
                {u.url ? (
                  <a href={u.url} target="_blank" rel="noreferrer">
                    <img
                      src={u.url}
                      alt="Retinal upload"
                      className="w-full rounded mb-3 border hover:opacity-90"
                    />
                  </a>
                ) : (
                  <div className="mb-3 rounded bg-slate-100 p-6 text-center text-sm text-slate-500">
                    Image file unavailable
                  </div>
                )}
                <p className="text-sm">Encounter: {u.encounter_id || "-"}</p>
                <p className="text-sm">Eye: {u.eye_laterality || "-"}</p>
                <p className="text-sm">Quality: {u.image_quality || "-"}</p>
                <p className="text-sm">Uploaded: {u.uploaded_at || "-"}</p>
                {u.url ? (
                  <a href={u.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-blue-600 underline">
                    Open full image
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function Box({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="font-bold text-lg mb-3">{title}</h2>
      <div className="space-y-1 text-sm">{children}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl shadow p-6 mb-6">
      <h2 className="font-bold text-xl mb-4">{title}</h2>
      {children}
    </section>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: any[][] }) {
  if (!rows.length) return <p className="text-sm text-slate-500">No records found.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-100 text-left">
          <tr>
            {headers.map((h) => (
              <th key={h} className="p-3">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className="border-t">
              {row.map((cell, cidx) => (
                <td key={cidx} className="p-3">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}