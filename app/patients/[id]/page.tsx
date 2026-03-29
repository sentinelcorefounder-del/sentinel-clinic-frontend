import Link from "next/link";
import {
  fetchPatientByIdServer,
  fetchPatientEncountersServer,
  fetchPatientReportsServer,
  fetchPatientConsentsServer,
} from "@/lib/server-auth";
import { Patient } from "@/types/patient";
import { Encounter } from "@/types/encounter";
import { StructuredReport } from "@/types/report";
import { ConsentRecord } from "@/types/consent";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PatientDetailPage({ params }: Props) {
  const { id } = await params;

const patient: Patient = await fetchPatientByIdServer(id);
const encounters: Encounter[] = await fetchPatientEncountersServer(id);
const reports: StructuredReport[] = await fetchPatientReportsServer(id);
const consents: ConsentRecord[] = await fetchPatientConsentsServer(id);

  return (
    <main className="p-10 space-y-8">
      <section className="border rounded-lg p-6">
        <div className="flex items-start justify-between mb-4 gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              {patient.first_name} {patient.last_name}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Patient records are managed by Sentinel Ops. Clinical encounters,
              uploads, reports, and consent activities are handled here.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href={`/encounters/new?patientId=${patient.id}`}
              className="rounded-lg bg-black text-white px-4 py-2"
            >
              Create Encounter
            </Link>
            <Link
              href="/patients"
              className="rounded-lg border px-4 py-2"
            >
              Back to Patients
            </Link>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <p><strong>Patient ID:</strong> {patient.patient_id}</p>
          <p><strong>Sex:</strong> {patient.sex}</p>
          <p><strong>Date of Birth:</strong> {patient.date_of_birth}</p>
          <p><strong>Phone:</strong> {patient.phone || "-"}</p>
          <p><strong>Email:</strong> {patient.email || "-"}</p>
          <p><strong>City:</strong> {patient.city || "-"}</p>
          <p><strong>State:</strong> {patient.state || "-"}</p>
          <p><strong>Country:</strong> {patient.country || "-"}</p>
          <p><strong>Consent Status:</strong> {patient.consent_status}</p>
        </div>
      </section>

      <section className="border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Encounter History</h2>

        {encounters.length === 0 ? (
          <p>No encounters found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3">Encounter ID</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {encounters.map((encounter) => (
                  <tr key={encounter.id} className="border-t">
                    <td className="p-3">
                      <Link
                        href={`/encounters/${encounter.id}`}
                        className="underline"
                      >
                        {encounter.encounter_id}
                      </Link>
                    </td>
                    <td className="p-3">{encounter.encounter_date}</td>
                    <td className="p-3">{encounter.encounter_type}</td>
                    <td className="p-3">{encounter.screening_status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Reports</h2>

        {reports.length === 0 ? (
          <p>No reports found.</p>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="border rounded-lg p-4 space-y-2">
                <p><strong>Report ID:</strong> {report.report_id}</p>
                <p><strong>Review Date:</strong> {report.review_date}</p>
                <p><strong>DR Grade:</strong> {report.dr_grade || "-"}</p>
                <p><strong>Maculopathy Grade:</strong> {report.maculopathy_grade || "-"}</p>
                <p><strong>Urgency:</strong> {report.urgency_outcome}</p>
                <p><strong>Status:</strong> {report.report_status}</p>
                <p><strong>Recommendation:</strong> {report.recommendation || "-"}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Consent History</h2>

        {consents.length === 0 ? (
          <p>No consent records found.</p>
        ) : (
          <div className="space-y-4">
            {consents.map((consent) => (
              <div key={consent.id} className="border rounded-lg p-4 space-y-2">
                <p><strong>Consent ID:</strong> {consent.consent_id}</p>
                <p><strong>Type:</strong> {consent.consent_type}</p>
                <p><strong>Status:</strong> {consent.consent_status}</p>
                <p><strong>Date:</strong> {consent.consent_date}</p>
                <p><strong>Captured By:</strong> {consent.captured_by || "-"}</p>
                <p><strong>Notes:</strong> {consent.notes || "-"}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}