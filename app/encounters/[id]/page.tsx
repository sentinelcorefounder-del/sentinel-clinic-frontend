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
  createDatasetLabel,
  updateDatasetLabel,
  getDatasetExportUrl,
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

type DatasetLabelFormProps = {
  upload: any;
  patientConsentStatus?: string;
  onSaved: () => Promise<void> | void;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const ALLOWED_SUBMIT_TO_OPS_ROLES = ["reviewer", "clinic_admin", "super_admin"];

function DatasetLabelForm({
  upload,
  patientConsentStatus,
  onSaved,
}: DatasetLabelFormProps) {
  const existingLabel = upload.dataset_label;

  const [imageQualityLabel, setImageQualityLabel] = useState(
    existingLabel?.image_quality_label || upload.image_quality || "good"
  );
  const [drGrade, setDrGrade] = useState(existingLabel?.dr_grade || "no_dr");
  const [maculopathyGrade, setMaculopathyGrade] = useState(
    existingLabel?.maculopathy_grade || "unknown"
  );
  const [referable, setReferable] = useState(Boolean(existingLabel?.referable));
  const [referralUrgency, setReferralUrgency] = useState(
    existingLabel?.referral_urgency || "routine"
  );
  const [clinicianNotes, setClinicianNotes] = useState(
    existingLabel?.clinician_notes || ""
  );
  const [otherFindings, setOtherFindings] = useState(
    existingLabel?.other_findings || ""
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const consentCompleted = patientConsentStatus === "completed";

  useEffect(() => {
    setImageQualityLabel(existingLabel?.image_quality_label || upload.image_quality || "good");
    setDrGrade(existingLabel?.dr_grade || "no_dr");
    setMaculopathyGrade(existingLabel?.maculopathy_grade || "unknown");
    setReferable(Boolean(existingLabel?.referable));
    setReferralUrgency(existingLabel?.referral_urgency || "routine");
    setClinicianNotes(existingLabel?.clinician_notes || "");
    setOtherFindings(existingLabel?.other_findings || "");
  }, [existingLabel, upload.image_quality]);

  async function handleSaveDatasetLabel(e: React.FormEvent) {
    e.preventDefault();

    if (!consentCompleted) {
      setMessage("Dataset label cannot be saved because patient consent is not completed.");
      return;
    }

    setSaving(true);
    setMessage("");

    const payload = {
      image_upload: upload.id,
      image_quality_label: imageQualityLabel,
      dr_grade: drGrade,
      maculopathy_grade: maculopathyGrade,
      referable,
      referral_urgency: referralUrgency,
      clinician_notes: clinicianNotes,
      other_findings: otherFindings,
    };

    try {
      if (existingLabel?.id) {
        await updateDatasetLabel(existingLabel.id, payload);
        setMessage("Dataset label updated successfully.");
      } else {
        await createDatasetLabel(payload);
        setMessage("Dataset label saved successfully.");
      }

      await onSaved();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to save dataset label.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSaveDatasetLabel} className="rounded-lg border bg-white p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Dataset Label / Clinician Ground Truth</h3>
          <p className="mt-1 text-xs text-gray-500">
            Saved labels become consented training data for Sentinel model improvement.
          </p>
        </div>

        {existingLabel ? (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            Labelled
          </span>
        ) : (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            Not labelled
          </span>
        )}
      </div>

      {!consentCompleted ? (
        <div className="mb-4 rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          Dataset labelling is disabled because patient consent is not completed.
          Only consented patient data can be added to the dataset.
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium">Image quality label</span>
          <select
            value={imageQualityLabel}
            onChange={(e) => setImageQualityLabel(e.target.value)}
            disabled={!consentCompleted || saving}
            className="w-full rounded border p-2"
          >
            <option value="good">Good</option>
            <option value="acceptable">Acceptable</option>
            <option value="poor">Poor</option>
            <option value="ungradable">Ungradable</option>
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">Final DR grade</span>
          <select
            value={drGrade}
            onChange={(e) => setDrGrade(e.target.value)}
            disabled={!consentCompleted || saving}
            className="w-full rounded border p-2"
          >
            <option value="no_dr">No DR</option>
            <option value="mild_npdr">Mild NPDR</option>
            <option value="moderate_npdr">Moderate NPDR</option>
            <option value="severe_npdr">Severe NPDR</option>
            <option value="pdr">Proliferative DR</option>
            <option value="ungradable">Ungradable</option>
            <option value="other">Other</option>
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">Maculopathy grade</span>
          <select
            value={maculopathyGrade}
            onChange={(e) => setMaculopathyGrade(e.target.value)}
            disabled={!consentCompleted || saving}
            className="w-full rounded border p-2"
          >
            <option value="m0">M0 - No maculopathy</option>
            <option value="m1">M1 - Maculopathy present / suspected</option>
            <option value="unknown">Unknown</option>
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">Referral urgency</span>
          <select
            value={referralUrgency}
            onChange={(e) => setReferralUrgency(e.target.value)}
            disabled={!consentCompleted || saving}
            className="w-full rounded border p-2"
          >
            <option value="routine">Routine</option>
            <option value="priority">Priority</option>
            <option value="urgent">Urgent</option>
            <option value="not_required">Not Required</option>
          </select>
        </label>
      </div>

      <label className="mt-3 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={referable}
          onChange={(e) => setReferable(e.target.checked)}
          disabled={!consentCompleted || saving}
        />
        Referable after clinician review
      </label>

      <label className="mt-3 block space-y-1 text-sm">
        <span className="font-medium">Clinician notes</span>
        <textarea
          value={clinicianNotes}
          onChange={(e) => setClinicianNotes(e.target.value)}
          disabled={!consentCompleted || saving}
          className="min-h-[90px] w-full rounded border p-2"
          placeholder="Clinician-confirmed findings, grading rationale, lesion description..."
        />
      </label>

      <label className="mt-3 block space-y-1 text-sm">
        <span className="font-medium">Other findings</span>
        <textarea
          value={otherFindings}
          onChange={(e) => setOtherFindings(e.target.value)}
          disabled={!consentCompleted || saving}
          className="min-h-[70px] w-full rounded border p-2"
          placeholder="Other non-DR observations, artefacts, media opacity, glaucoma suspicion, AMD suspicion, etc."
        />
      </label>

      {existingLabel ? (
        <div className="mt-3 rounded bg-slate-50 p-3 text-xs text-slate-600">
          <p><strong>Label ID:</strong> {existingLabel.label_id}</p>
          <p><strong>Labelled by:</strong> {existingLabel.labelled_by_username || "-"}</p>
          <p><strong>Labelled at:</strong> {existingLabel.labelled_at || "-"}</p>
          <p><strong>Consent confirmed:</strong> {existingLabel.consent_confirmed ? "Yes" : "No"}</p>
        </div>
      ) : null}

      {message ? (
        <p className="mt-3 rounded bg-slate-50 p-3 text-sm text-gray-700">{message}</p>
      ) : null}

      <button
        type="submit"
        disabled={!consentCompleted || saving}
        className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? "Saving..." : existingLabel ? "Update Dataset Label" : "Save Dataset Label"}
      </button>
    </form>
  );
}

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

  async function refreshUploads() {
    if (!encounter?.id) return;
    const refreshedUploads = await fetchEncounterUploads(String(encounter.id));
    setUploads(refreshedUploads);
  }

  async function handleImageUploaded() {
    await refreshUploads();
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

  function displayProvider(provider?: string | null) {
    if (provider === "openai") return "OpenAI";
    if (provider === "hybrid") return "Hybrid AI";
    return "Sentinel AI";
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
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Uploaded Images</h2>
            <p className="mt-1 text-sm text-gray-600">
              AI analysis and consent-gated clinician dataset labelling.
            </p>
          </div>

          <a
            href={getDatasetExportUrl()}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Export Dataset CSV
          </a>
        </div>

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
                          <strong>Provider:</strong> {displayProvider(ai.provider)}
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
                          {ai.disclaimer ||
                            "AI output is for clinician review only and must not be treated as a final diagnosis."}
                        </p>
                      </div>
                    )}
                  </div>

                  <DatasetLabelForm
                    upload={upload}
                    patientConsentStatus={patient.consent_status}
                    onSaved={refreshUploads}
                  />
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