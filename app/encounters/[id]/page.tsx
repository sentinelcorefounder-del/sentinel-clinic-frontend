"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  fetchEncounterById,
  fetchEncounterUploads,
  fetchEncounterReports,
  fetchEncounterConsents,
  fetchPatientById,
  updatePatient,
  getReportPdfUrl,
  submitReportToOps,
} from "@/lib/api";
import { getMe, hasAnyRole, type CurrentUser } from "@/lib/auth";
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

const ALLOWED_SUBMIT_TO_OPS_ROLES = ["reviewer", "clinic_admin", "super_admin"];

export default function EncounterDetailPage({ params }: Props) {
  const [id, setId] = useState<string>("");
  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [patient, setPatient] = useState<any>(null);
  const [uploads, setUploads] = useState<ImageUpload[]>([]);
  const [reports, setReports] = useState<StructuredReport[]>([]);
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reportActionMessage, setReportActionMessage] = useState("");
  const [submittingReportId, setSubmittingReportId] = useState<number | null>(null);

  async function loadEncounterPage(encounterId: string) {
    const encounterData: Encounter = await fetchEncounterById(encounterId);
    const patientData = await fetchPatientById(String(encounterData.patient));
    const [uploadData, reportData, consentData] = await Promise.all([
      fetchEncounterUploads(encounterId),
      fetchEncounterReports(encounterId),
      fetchEncounterConsents(encounterId),
    ]);

    setEncounter(encounterData);
    setPatient(patientData);
    setUploads(uploadData);
    setReports(reportData);
    setConsents(consentData);
  }

  useEffect(() => {
    async function resolveParamsAndLoad() {
      try {
        const me = await getMe().catch(() => null);
        setCurrentUser(me);

        const resolvedParams = await params;
        setId(resolvedParams.id);
        await loadEncounterPage(resolvedParams.id);
      } catch (err) {
        console.error(err);
        setError("Failed to load encounter details.");
      } finally {
        setLoading(false);
      }
    }

    resolveParamsAndLoad();
  }, [params]);

  async function handleConsentSaved() {
    if (!patient?.id || !encounter?.id) return;

    try {
      await updatePatient(String(patient.id), {
        consent_status: "completed",
      });

      const refreshedPatient = await fetchPatientById(String(patient.id));
      const refreshedConsents = await fetchEncounterConsents(String(encounter.id));

      setPatient(refreshedPatient);
      setConsents(refreshedConsents);
    } catch (err) {
      console.error("Failed to sync patient consent status:", err);
      const message =
        err instanceof Error
          ? err.message
          : "Consent was saved, but patient consent status could not be updated.";
      setError(message);
    }
  }

  async function handleReportCreated() {
    if (!encounter?.id) return;
    const refreshedReports = await fetchEncounterReports(String(encounter.id));
    setReports(refreshedReports);
  }

  async function handleSubmitExistingReportToOps(reportId: number) {
    try {
      setSubmittingReportId(reportId);
      setReportActionMessage("");

      await submitReportToOps(reportId);
      await handleReportCreated();

      setReportActionMessage("Report submitted to Ops successfully.");
    } catch (err) {
      const nextMessage =
        err instanceof Error ? err.message : "Failed to submit report to Ops.";
      setReportActionMessage(nextMessage);
    } finally {
      setSubmittingReportId(null);
    }
  }

  function canSubmitReport(reportStatus?: string) {
    return ["draft", "under_review", "signed_off"].includes(reportStatus || "");
  }

  const canSubmitToOps = hasAnyRole(currentUser, ALLOWED_SUBMIT_TO_OPS_ROLES);

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
    <main className="space-y-8 p-10">
      <section className="rounded-lg border p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Encounter Detail</h1>
            <p className="mt-1 text-sm text-gray-600">
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
          <p><strong>Consent Status:</strong> {patient.consent_status || "-"}</p>
          <p><strong>Left VA:</strong> {encounter.visual_acuity_left || "-"}</p>
          <p><strong>Right VA:</strong> {encounter.visual_acuity_right || "-"}</p>
        </div>
      </section>

      <ImageUploadForm encounterId={encounter.id} patientId={encounter.patient} />

      <section className="rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">Uploaded Images</h2>

        {uploads.length === 0 ? (
          <p>No images uploaded yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {uploads.map((upload) => (
              <div key={upload.id} className="space-y-3 rounded-lg border p-4">
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

      <ConsentForm
        encounterId={encounter.id}
        patientId={encounter.patient}
        onConsentSaved={handleConsentSaved}
      />

      <section className="rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">Consent Records</h2>

        {consents.length === 0 ? (
          <p>No consent records yet.</p>
        ) : (
          <div className="space-y-4">
            {consents.map((consent) => (
              <div key={consent.id} className="space-y-2 rounded-lg border p-4">
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

      <ReportForm
        encounterId={encounter.id}
        patientId={encounter.patient}
        patientConsentStatus={patient.consent_status || "pending"}
        onReportCreated={handleReportCreated}
      />

      <section className="rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">Structured Reports</h2>

        {reportActionMessage ? (
          <p className="mb-4 text-sm text-gray-700">{reportActionMessage}</p>
        ) : null}

        {reports.length === 0 ? (
          <p>No reports created yet.</p>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="space-y-3 rounded-lg border p-4">
                <div className="space-y-2">
                  <p><strong>Report ID:</strong> {report.report_id}</p>
                  <p><strong>Review Date:</strong> {report.review_date}</p>
                  <p><strong>DR Grade:</strong> {report.dr_grade || "-"}</p>
                  <p><strong>Maculopathy Grade:</strong> {report.maculopathy_grade || "-"}</p>
                  <p><strong>Urgency:</strong> {report.urgency_outcome}</p>
                  <p><strong>Status:</strong> {report.report_status}</p>
                  <p><strong>Recommendation:</strong> {report.recommendation || "-"}</p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      window.open(
                        getReportPdfUrl(report.id),
                        "_blank",
                        "noopener,noreferrer"
                      )
                    }
                    className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                  >
                    Generate PDF
                  </button>

                  {canSubmitToOps && canSubmitReport(report.report_status) ? (
                    <button
                      type="button"
                      onClick={() => handleSubmitExistingReportToOps(report.id)}
                      disabled={submittingReportId === report.id}
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {submittingReportId === report.id
                        ? "Submitting..."
                        : "Submit to Ops"}
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}