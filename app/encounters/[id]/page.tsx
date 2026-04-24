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

  async function handleImageUploaded() {
    if (!encounter?.id) return;
    const refreshedUploads = await fetchEncounterUploads(String(encounter.id));
    setUploads(refreshedUploads);
  }

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

  function resolveFileUrl(fileUrl?: string | null) {
    if (!fileUrl) return "";
    return fileUrl.startsWith("http") ? fileUrl : `${API_BASE_URL}${fileUrl}`;
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
            <Link href="/encounters" className="rounded-lg border px-4 py-2">
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

      <ImageUploadForm
        encounterId={encounter.id}
        patientId={encounter.patient}
        onUploadSuccess={handleImageUploaded}
      />

      <section className="rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">Uploaded Images</h2>

        {uploads.length === 0 ? (
          <p>No images uploaded yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {uploads.map((upload: any) => {
              const ai = upload.ai_analysis;

              return (
                <div key={upload.id} className="space-y-4 rounded-lg border p-4">
                  <div className="space-y-1 text-sm">
                    <p><strong>ID:</strong> {upload.image_upload_id}</p>
                    <p><strong>Laterality:</strong> {upload.eye_laterality}</p>
                    <p><strong>Type:</strong> {upload.image_type}</p>
                    <p><strong>Quality:</strong> {upload.image_quality}</p>
                  </div>

                  <img
                    src={resolveFileUrl(upload.image_file)}
                    alt={upload.image_upload_id}
                    className="w-full rounded border"
                  />

                  <div className="rounded-lg border bg-slate-50 p-4">
                    <h3 className="mb-3 text-lg font-semibold">AI Suggestion</h3>

                    {!ai ? (
                      <p className="text-sm text-gray-600">
                        No AI analysis available yet. Refresh shortly if the image was just uploaded.
                      </p>
                    ) : (
                      <div className="space-y-2 text-sm">
                        <p>
                          <strong>Provider:</strong>{" "}
                          {ai.provider === "openai" ? "OpenAI" : "Sentinel AI"}
                        </p>
                        <p><strong>Status:</strong> {ai.ai_status || "-"}</p>
                        <p><strong>Fundus Status:</strong> {ai.fundus_status || "-"}</p>

                        {ai.prediction ? (
                          <p>
                            <strong>Prediction / Observation:</strong>{" "}
                            <span
                              className={
                                ai.prediction === "Referable DR"
                                  ? "font-semibold text-red-700"
                                  : ai.prediction === "No Referable DR"
                                    ? "font-semibold text-emerald-700"
                                    : "font-semibold text-gray-800"
                              }
                            >
                              {ai.prediction}
                            </span>
                          </p>
                        ) : null}

                        {ai.referable !== null && ai.referable !== undefined ? (
                          <p>
                            <strong>Referable:</strong>{" "}
                            {ai.referable ? "Yes" : "No"}
                          </p>
                        ) : null}

                        {ai.confidence !== null && ai.confidence !== undefined ? (
                          <p>
                            <strong>Confidence:</strong>{" "}
                            {(Number(ai.confidence) * 100).toFixed(1)}%
                          </p>
                        ) : null}

                        {ai.severity_label ? (
                          <p><strong>Severity Label:</strong> {ai.severity_label}</p>
                        ) : null}

                        {ai.image_quality ? (
                          <p><strong>AI Image Quality:</strong> {ai.image_quality}</p>
                        ) : null}

                        {ai.risk_flag ? (
                          <p><strong>Risk Flag:</strong> {ai.risk_flag}</p>
                        ) : null}

                        {ai.suggested_review_priority ? (
                          <p>
                            <strong>Suggested Review Priority:</strong>{" "}
                            {ai.suggested_review_priority}
                          </p>
                        ) : null}

                        {ai.message ? (
                          <p><strong>Message:</strong> {ai.message}</p>
                        ) : null}

                        {ai.draft_note ? (
                          <div className="rounded border bg-white p-3">
                            <p className="mb-1 font-semibold">Draft Note</p>
                            <p>{ai.draft_note}</p>
                          </div>
                        ) : null}

                        {ai.heatmap_url ? (
                          <div className="mt-3 space-y-2">
                            <p className="font-semibold">AI Heatmap</p>
                            <img
                              src={resolveFileUrl(ai.heatmap_url)}
                              alt="AI heatmap"
                              className="w-full rounded border"
                            />
                          </div>
                        ) : null}

                        {ai.processed_image_url ? (
                          <div className="mt-3">
                            <a
                              href={resolveFileUrl(ai.processed_image_url)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-700 underline"
                            >
                              View processed image
                            </a>
                          </div>
                        ) : null}

                        <p className="mt-3 rounded bg-amber-50 p-3 text-xs text-amber-900">
                          AI output is for clinician review only and must not be treated as a final diagnosis.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
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