"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  fetchEncounterById,
  fetchEncounterUploads,
  fetchEncounterReports,
  fetchEncounterConsents,
  fetchPatientById,
} from "@/lib/api";
import { Encounter } from "@/types/encounter";
import { ImageUpload } from "@/types/upload";
import { StructuredReport } from "@/types/report";
import { ConsentRecord } from "@/types/consent";
import ImageUploadForm from "@/components/ImageUploadForm";
import ReportForm from "@/components/ReportForm";
import ConsentForm from "@/components/ConsentForm";

type Props = {
  params: Promise<{ id: string }>;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function EncounterDetailPage({ params }: Props) {
  const [id, setId] = useState<string>("");
  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [patient, setPatient] = useState<any>(null);
  const [uploads, setUploads] = useState<ImageUpload[]>([]);
  const [reports, setReports] = useState<StructuredReport[]>([]);
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function resolveParamsAndLoad() {
      try {
        const resolvedParams = await params;
        setId(resolvedParams.id);

        const encounterData: Encounter = await fetchEncounterById(resolvedParams.id);
        const patientData = await fetchPatientById(String(encounterData.patient));
        const [uploadData, reportData, consentData] = await Promise.all([
          fetchEncounterUploads(resolvedParams.id),
          fetchEncounterReports(resolvedParams.id),
          fetchEncounterConsents(resolvedParams.id),
        ]);

        setEncounter(encounterData);
        setPatient(patientData);
        setUploads(uploadData);
        setReports(reportData);
        setConsents(consentData);
      } catch (err) {
        console.error(err);
        setError("Failed to load encounter details.");
      } finally {
        setLoading(false);
      }
    }

    resolveParamsAndLoad();
  }, [params]);

  if (loading) {
    return (
      <main className="p-10">
        <p className="text-sm text-gray-700">Loading encounter...</p>
      </main>
    );
  }

  if (error || !encounter || !patient) {
    return (
      <main className="p-10">
        <p className="text-sm text-red-600">
          {error || "Encounter not found."}
        </p>
      </main>
    );
  }

  return (
    <main className="p-10 space-y-8">
      <section className="border rounded-lg p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold">Encounter Detail</h1>
            <p className="text-sm text-gray-600 mt-1">
              Clinical workflow for an assigned patient encounter.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href={`/patients/${patient.id}`}
              className="rounded-lg border px-4 py-2"
            >
              View Patient
            </Link>
            <Link
              href="/encounters"
              className="rounded-lg border px-4 py-2"
            >
              Back to Encounters
            </Link>
          </div>
        </div>

        <div className="space-y-2">
          <p><strong>Encounter ID:</strong> {encounter.encounter_id}</p>
          <p>
            <strong>Patient:</strong>{" "}
            <Link href={`/patients/${patient.id}`} className="underline">
              {patient.patient_id} - {patient.first_name} {patient.last_name}
            </Link>
          </p>
          <p><strong>Date:</strong> {encounter.encounter_date}</p>
          <p><strong>Status:</strong> {encounter.screening_status}</p>
          <p><strong>Type:</strong> {encounter.encounter_type}</p>
          <p><strong>Left VA:</strong> {encounter.visual_acuity_left || "-"}</p>
          <p><strong>Right VA:</strong> {encounter.visual_acuity_right || "-"}</p>
        </div>
      </section>

      <ImageUploadForm encounterId={encounter.id} patientId={encounter.patient} />

      <section className="border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Uploaded Images</h2>

        {uploads.length === 0 ? (
          <p>No images uploaded yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {uploads.map((upload) => (
              <div key={upload.id} className="border rounded-lg p-4 space-y-3">
                <div className="space-y-1 text-sm">
                  <p><strong>ID:</strong> {upload.image_upload_id}</p>
                  <p><strong>Laterality:</strong> {upload.eye_laterality}</p>
                  <p><strong>Type:</strong> {upload.image_type}</p>
                  <p><strong>Quality:</strong> {upload.image_quality}</p>
                </div>

                <img
                  src={
                    upload.image_file.startsWith("http")
                      ? upload.image_file
                      : `${API_BASE_URL}${upload.image_file}`
                  }
                  alt={upload.image_upload_id}
                  className="w-full rounded border"
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <ReportForm encounterId={encounter.id} patientId={encounter.patient} />

      <section className="border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Structured Reports</h2>

        {reports.length === 0 ? (
          <p>No reports created yet.</p>
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

      <ConsentForm encounterId={encounter.id} patientId={encounter.patient} />

      <section className="border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Consent Records</h2>

        {consents.length === 0 ? (
          <p>No consent records yet.</p>
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