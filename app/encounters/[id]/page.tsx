"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  fetchEncounterById,
  updateEncounter,
  fetchEncounterUploads,
  fetchEncounterReports,
  fetchEncounterConsents,
  fetchPatientById,
  updatePatient,
  getReportPdfUrl,
  submitReportToOps,
  deleteImageUpload,
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
const ALLOWED_DELETE_UPLOAD_ROLES = ["clinic_screener", "clinic_admin", "super_admin"];

function displayValue(value?: string | null) {
  if (!value) return "-";
  return value.replaceAll("_", " ");
}

function displayProvider(provider?: string | null) {
  if (provider === "openai") return "OpenAI";
  if (provider === "hybrid") return "Hybrid AI";
  return "Sentinel AI";
}

function resolveFileUrl(fileUrl?: string | null) {
  if (!fileUrl) return "";
  return fileUrl.startsWith("http") ? fileUrl : `${API_BASE_URL}${fileUrl}`;
}

export default function EncounterDetailPage({ params }: Props) {
  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [patient, setPatient] = useState<any>(null);
  const [uploads, setUploads] = useState<ImageUpload[]>([]);
  const [reports, setReports] = useState<StructuredReport[]>([]);
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [reportActionMessage, setReportActionMessage] = useState("");
  const [uploadActionMessage, setUploadActionMessage] = useState("");
  const [submittingReportId, setSubmittingReportId] = useState<number | null>(null);
  const [deletingUploadId, setDeletingUploadId] = useState<number | null>(null);

  const [measurementForm, setMeasurementForm] = useState({
    left_unaided_va: "",
    right_unaided_va: "",
    left_corrected_pinhole_va: "",
    right_corrected_pinhole_va: "",
    left_va_method: "",
    right_va_method: "",
    iop_before_dilation_left: "",
    iop_before_dilation_right: "",
    iop_after_dilation_left: "",
    iop_after_dilation_right: "",
    dilation_drops_used: "",
    dilation_notes: "",
  });

  const [savingMeasurements, setSavingMeasurements] = useState(false);
  const [measurementMessage, setMeasurementMessage] = useState("");
  const [measurementMessageType, setMeasurementMessageType] =
    useState<"success" | "error" | "info">("info");

  async function loadEncounterPage(encounterId: string) {
    const encounterData: Encounter = await fetchEncounterById(encounterId);
    const e: any = encounterData;

    const patientData = await fetchPatientById(String(encounterData.patient));

    const [uploadData, reportData, consentData] = await Promise.all([
      fetchEncounterUploads(encounterId),
      fetchEncounterReports(encounterId),
      fetchEncounterConsents(encounterId),
    ]);

    setEncounter(encounterData);

    setMeasurementForm({
      left_unaided_va: e.left_unaided_va || "",
      right_unaided_va: e.right_unaided_va || "",
      left_corrected_pinhole_va: e.left_corrected_pinhole_va || "",
      right_corrected_pinhole_va: e.right_corrected_pinhole_va || "",
      left_va_method: e.left_va_method || "",
      right_va_method: e.right_va_method || "",
      iop_before_dilation_left: e.iop_before_dilation_left || "",
      iop_before_dilation_right: e.iop_before_dilation_right || "",
      iop_after_dilation_left: e.iop_after_dilation_left || "",
      iop_after_dilation_right: e.iop_after_dilation_right || "",
      dilation_drops_used: e.dilation_drops_used || "",
      dilation_notes: e.dilation_notes || "",
    });

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

    if (encounter?.id) {
      const refreshedEncounter = await fetchEncounterById(String(encounter.id));
      setEncounter(refreshedEncounter);
    }
  }

  async function handleDeleteUpload(uploadId: number) {
    const allowed = hasAnyRole(currentUser, ALLOWED_DELETE_UPLOAD_ROLES);

    if (!allowed) {
      setUploadActionMessage("You do not have permission to delete uploaded images.");
      return;
    }

    const confirmed = window.confirm(
      "Delete this image? This will remove the uploaded image, AI analysis, and any linked dataset label for this image."
    );

    if (!confirmed) return;

    try {
      setDeletingUploadId(uploadId);
      setUploadActionMessage("");
      await deleteImageUpload(uploadId);
      await refreshUploads();
      setUploadActionMessage(
        "Image deleted successfully. You can now upload a replacement for that eye."
      );
    } catch (err) {
      setUploadActionMessage(
        err instanceof Error ? err.message : "Failed to delete image."
      );
    } finally {
      setDeletingUploadId(null);
    }
  }

  async function handleConsentSaved() {
    if (!patient?.id || !encounter?.id) return;

    try {
      await updatePatient(String(patient.id), { consent_status: "completed" });
      const refreshedPatient = await fetchPatientById(String(patient.id));
      const refreshedConsents = await fetchEncounterConsents(String(encounter.id));

      setPatient(refreshedPatient);
      setConsents(refreshedConsents);
    } catch (err) {
      console.error("Failed to sync patient consent status:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Consent saved, but patient consent status could not be updated."
      );
    }
  }

  async function handleReportCreated() {
    if (!encounter?.id) return;

    const refreshedReports = await fetchEncounterReports(String(encounter.id));
    const refreshedEncounter = await fetchEncounterById(String(encounter.id));

    setReports(refreshedReports);
    setEncounter(refreshedEncounter);
  }

  async function handleSubmitExistingReportToOps(reportId: number) {
    try {
      setSubmittingReportId(reportId);
      setReportActionMessage("");
      await submitReportToOps(reportId);
      await handleReportCreated();
      setReportActionMessage("Report submitted to Ops successfully.");
    } catch (err) {
      setReportActionMessage(
        err instanceof Error ? err.message : "Failed to submit report to Ops."
      );
    } finally {
      setSubmittingReportId(null);
    }
  }

  function handleMeasurementChange(
    field: keyof typeof measurementForm,
    value: string
  ) {
    setMeasurementForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSaveMeasurements() {
    if (!encounter?.id) return;

    try {
      setSavingMeasurements(true);
      setMeasurementMessage("");
      setMeasurementMessageType("info");

      const updatedEncounter = await updateEncounter(encounter.id, measurementForm);
      const e: any = updatedEncounter;

      setEncounter(updatedEncounter);

      setMeasurementForm({
        left_unaided_va: e.left_unaided_va || "",
        right_unaided_va: e.right_unaided_va || "",
        left_corrected_pinhole_va: e.left_corrected_pinhole_va || "",
        right_corrected_pinhole_va: e.right_corrected_pinhole_va || "",
        left_va_method: e.left_va_method || "",
        right_va_method: e.right_va_method || "",
        iop_before_dilation_left: e.iop_before_dilation_left || "",
        iop_before_dilation_right: e.iop_before_dilation_right || "",
        iop_after_dilation_left: e.iop_after_dilation_left || "",
        iop_after_dilation_right: e.iop_after_dilation_right || "",
        dilation_drops_used: e.dilation_drops_used || "",
        dilation_notes: e.dilation_notes || "",
      });

      setMeasurementMessageType("success");
      setMeasurementMessage("VA, IOP and dilation details saved successfully.");
    } catch (err) {
      setMeasurementMessageType("error");
      setMeasurementMessage(
        err instanceof Error
          ? err.message
          : "Failed to save VA, IOP and dilation details."
      );
    } finally {
      setSavingMeasurements(false);
    }
  }

  function canSubmitReport(reportStatus?: string) {
    return ["draft", "under_review", "signed_off", "ops_rejected", "returned_to_clinic"].includes(reportStatus || "");
  }


  const canSubmitToOps = hasAnyRole(currentUser, ALLOWED_SUBMIT_TO_OPS_ROLES);
  const canDeleteUploads = hasAnyRole(currentUser, ALLOWED_DELETE_UPLOAD_ROLES);

  const encounterAny: any = encounter;

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
        <p className="text-sm text-red-600">{error || "Encounter not found."}</p>
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
              Technician capture and clinical reporting for an assigned patient encounter.
            </p>
          </div>

          <div className="flex gap-3">
            <Link href={`/patients/${patient.id}`} className="rounded-lg border px-4 py-2">
              View Patient
            </Link>
            <Link href="/encounters" className="rounded-lg border px-4 py-2">
              Back to Encounters
            </Link>
          </div>
        </div>

        <div className="space-y-2">
          <p>
            <strong>Encounter ID:</strong> {encounter.encounter_id}
          </p>
          <p>
            <strong>Patient:</strong>{" "}
            <Link href={`/patients/${patient.id}`} className="underline">
              {patient.patient_id} - {patient.first_name} {patient.last_name}
            </Link>
          </p>
          <p>
            <strong>Date:</strong> {encounter.encounter_date}
          </p>
          <p>
            <strong>Status:</strong> {displayValue(encounter.screening_status)}
          </p>
          <p>
            <strong>Type:</strong> {displayValue(encounter.encounter_type)}
          </p>
          <p>
            <strong>Consent Status:</strong> {patient.consent_status || "-"}
          </p>
          <p><strong>Source:</strong> {displayValue(encounterAny.source_type)}</p>
          <p><strong>Workflow:</strong> {displayValue(encounterAny.workflow_route)}</p>
          <p><strong>Payment Responsibility:</strong> {displayValue(encounterAny.payment_responsibility)}</p>
          {encounterAny.source_hospital_name ? <p><strong>Source Hospital:</strong> {encounterAny.source_hospital_name}</p> : null}
        </div>
      </section>

      <section className="rounded-lg border p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Technician Capture: VA, IOP and Dilation</h2>
          <p className="mt-1 text-sm text-gray-600">
            Record unaided VA, corrected/pinhole VA, IOP, dilation details and notes.
            This section is separate from the optometrist report.
          </p>
        </div>

        {measurementMessage ? (
          <div
            className={`mb-4 rounded-lg border p-3 text-sm font-medium ${
              measurementMessageType === "error"
                ? "border-red-200 bg-red-50 text-red-800"
                : measurementMessageType === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-slate-200 bg-slate-50 text-slate-700"
            }`}
          >
            {measurementMessage}
          </div>
        ) : null}

        {encounterAny?.poor_va_flag ? (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">Poor corrected/pinhole VA flag</p>
            <p className="mt-1">
              {encounterAny.poor_va_reason ||
                "Corrected/pinhole VA is 6/12 or worse. Optometrist should consider referral based on clinical judgement."}
            </p>
          </div>
        ) : null}

        <div className="mb-6 rounded-lg border bg-slate-50 p-4">
          <h3 className="mb-3 text-lg font-semibold">Visual Acuity</h3>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm font-medium">Unaided VA - Left</span>
              <input
                type="text"
                value={measurementForm.left_unaided_va}
                onChange={(e) => handleMeasurementChange("left_unaided_va", e.target.value)}
                placeholder="e.g. 6/9"
                className="w-full rounded-lg border px-3 py-2"
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium">Unaided VA - Right</span>
              <input
                type="text"
                value={measurementForm.right_unaided_va}
                onChange={(e) => handleMeasurementChange("right_unaided_va", e.target.value)}
                placeholder="e.g. 6/6"
                className="w-full rounded-lg border px-3 py-2"
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium">Corrected/Pinhole VA - Left</span>
              <input
                type="text"
                value={measurementForm.left_corrected_pinhole_va}
                onChange={(e) =>
                  handleMeasurementChange("left_corrected_pinhole_va", e.target.value)
                }
                placeholder="e.g. 6/12"
                className="w-full rounded-lg border px-3 py-2"
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium">Corrected/Pinhole VA - Right</span>
              <input
                type="text"
                value={measurementForm.right_corrected_pinhole_va}
                onChange={(e) =>
                  handleMeasurementChange("right_corrected_pinhole_va", e.target.value)
                }
                placeholder="e.g. 6/9"
                className="w-full rounded-lg border px-3 py-2"
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium">Left VA method used</span>
              <select
                value={measurementForm.left_va_method}
                onChange={(e) => handleMeasurementChange("left_va_method", e.target.value)}
                className="w-full rounded-lg border px-3 py-2"
              >
                <option value="">Not recorded</option>
                <option value="corrected">Corrected</option>
                <option value="pinhole">Pinhole</option>
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium">Right VA method used</span>
              <select
                value={measurementForm.right_va_method}
                onChange={(e) => handleMeasurementChange("right_va_method", e.target.value)}
                className="w-full rounded-lg border px-3 py-2"
              >
                <option value="">Not recorded</option>
                <option value="corrected">Corrected</option>
                <option value="pinhole">Pinhole</option>
              </select>
            </label>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm font-medium">IOP Before Dilation - Left</span>
            <input
              type="text"
              value={measurementForm.iop_before_dilation_left}
              onChange={(e) =>
                handleMeasurementChange("iop_before_dilation_left", e.target.value)
              }
              placeholder="e.g. 14 mmHg"
              className="w-full rounded-lg border px-3 py-2"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium">IOP Before Dilation - Right</span>
            <input
              type="text"
              value={measurementForm.iop_before_dilation_right}
              onChange={(e) =>
                handleMeasurementChange("iop_before_dilation_right", e.target.value)
              }
              placeholder="e.g. 15 mmHg"
              className="w-full rounded-lg border px-3 py-2"
            />
          </label>

          <label className="space-y-1 md:col-span-2">
            <span className="text-sm font-medium">Dilation Drops Used</span>
            <input
              type="text"
              value={measurementForm.dilation_drops_used}
              onChange={(e) =>
                handleMeasurementChange("dilation_drops_used", e.target.value)
              }
              placeholder="e.g. Tropicamide 1%, Phenylephrine 2.5%"
              className="w-full rounded-lg border px-3 py-2"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium">IOP After Dilation - Left</span>
            <input
              type="text"
              value={measurementForm.iop_after_dilation_left}
              onChange={(e) =>
                handleMeasurementChange("iop_after_dilation_left", e.target.value)
              }
              placeholder="e.g. 15 mmHg"
              className="w-full rounded-lg border px-3 py-2"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium">IOP After Dilation - Right</span>
            <input
              type="text"
              value={measurementForm.iop_after_dilation_right}
              onChange={(e) =>
                handleMeasurementChange("iop_after_dilation_right", e.target.value)
              }
              placeholder="e.g. 16 mmHg"
              className="w-full rounded-lg border px-3 py-2"
            />
          </label>

          <label className="space-y-1 md:col-span-2">
            <span className="text-sm font-medium">Dilation Notes</span>
            <textarea
              value={measurementForm.dilation_notes}
              onChange={(e) => handleMeasurementChange("dilation_notes", e.target.value)}
              rows={3}
              placeholder="Any reaction, poor dilation, contraindication, or timing note"
              className="w-full rounded-lg border px-3 py-2"
            />
          </label>
        </div>

        <div className="mt-4">
          <button
            type="button"
            onClick={handleSaveMeasurements}
            disabled={savingMeasurements}
            className="rounded-lg bg-slate-950 px-4 py-2 font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {savingMeasurements ? "Saving..." : "Save VA / IOP / Dilation Details"}
          </button>
        </div>
      </section>

      <ImageUploadForm
        encounterId={encounter.id}
        patientId={encounter.patient}
        existingUploads={uploads}
        onUploadSuccess={handleImageUploaded}
      />

      <section className="rounded-lg border p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Uploaded Images</h2>
          <p className="mt-1 text-sm text-gray-600">
            One image is allowed per eye. Delete an image before uploading a replacement.
          </p>
        </div>

        {uploadActionMessage ? (
          <p className="mb-4 rounded bg-slate-50 p-3 text-sm text-gray-700">
            {uploadActionMessage}
          </p>
        ) : null}

        {uploads.length === 0 ? (
          <p>No images uploaded yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {uploads.map((upload: any) => {
              const ai = upload.ai_analysis;

              return (
                <div key={upload.id} className="space-y-4 rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 text-sm">
                      <p>
                        <strong>ID:</strong> {upload.image_upload_id}
                      </p>
                      <p>
                        <strong>Laterality:</strong> {upload.eye_laterality}
                      </p>
                      <p>
                        <strong>Type:</strong> {upload.image_type}
                      </p>
                      <p>
                        <strong>Quality:</strong> {upload.image_quality}
                      </p>
                    </div>

                    {canDeleteUploads ? (
                      <button
                        type="button"
                        onClick={() => handleDeleteUpload(upload.id)}
                        disabled={deletingUploadId === upload.id}
                        className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        {deletingUploadId === upload.id ? "Deleting..." : "Delete"}
                      </button>
                    ) : null}
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
                        <p>
                          <strong>Status:</strong> {ai.ai_status || "-"}
                        </p>
                        <p>
                          <strong>Fundus Status:</strong> {ai.fundus_status || "-"}
                        </p>
                        <p>
                          <strong>Prediction / Observation:</strong> {ai.prediction || "-"}
                        </p>

                        {ai.referable !== null && ai.referable !== undefined ? (
                          <p>
                            <strong>Referable:</strong> {ai.referable ? "Yes" : "No"}
                          </p>
                        ) : null}

                        {ai.confidence !== null && ai.confidence !== undefined ? (
                          <p>
                            <strong>Confidence:</strong>{" "}
                            {(Number(ai.confidence) * 100).toFixed(1)}%
                          </p>
                        ) : null}

                        {ai.draft_note ? (
                          <div className="rounded border bg-slate-50 p-3 text-sm">
                            <p className="mb-1 font-semibold">Clinical Observation</p>
                            <p>{ai.draft_note}</p>
                          </div>
                        ) : null}
                        
                        <p className="mt-3 rounded bg-amber-50 p-3 text-xs text-amber-900">
                          {ai.disclaimer ||
                            "AI output is for clinician review only and must not be treated as a final diagnosis."}
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
                <p>
                  <strong>Consent ID:</strong> {consent.consent_id}
                </p>
                <p>
                  <strong>Type:</strong> {consent.consent_type}
                </p>
                <p>
                  <strong>Status:</strong> {consent.consent_status}
                </p>
                <p>
                  <strong>Date:</strong> {consent.consent_date}
                </p>
                <p>
                  <strong>Captured By:</strong> {consent.captured_by || "-"}
                </p>
                <p>
                  <strong>Notes:</strong> {consent.notes || "-"}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-lg border p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Optometrist Report: Diabetic Grading</h2>
          <p className="mt-1 text-sm text-gray-600">
            The optometrist completes diabetic grading and clinical recommendation here.
            VA, IOP and image capture are handled above on the encounter.
          </p>
        </div>

        <ReportForm
          encounterId={encounter.id}
          patientId={encounter.patient}
          patientConsentStatus={patient.consent_status || "pending"}
          encounter={encounterAny}
          existingReport={reports[0] || null}
          onReportSaved={handleReportCreated}
        />
      </section>

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
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p>
                      <strong>Report ID:</strong> {report.report_id}
                    </p>
                    <p>
                      <strong>Review Date:</strong> {report.review_date}
                    </p>
                    <p>
                      <strong>Urgency:</strong> {displayValue(report.urgency_outcome)}
                    </p>
                    <p>
                      <strong>Status:</strong> {displayValue(report.report_status)}
                    </p>
                    {report.return_reason || report.ops_review_note ? (
                      <div className="mt-2 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                        <p className="font-semibold">Sentinel Ops review note</p>
                        <p>{report.return_reason || report.ops_review_note}</p>
                      </div>
                    ) : null}
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded border bg-slate-50 p-3 text-sm">
                      <p className="mb-2 font-semibold">Left Eye Grading</p>
                      <p>
                        <strong>DR Grade:</strong> {report.left_dr_grade || "-"}
                      </p>
                      <p>
                        <strong>Maculopathy:</strong>{" "}
                        {report.left_maculopathy_grade || "-"}
                      </p>
                    </div>

                    <div className="rounded border bg-slate-50 p-3 text-sm">
                      <p className="mb-2 font-semibold">Right Eye Grading</p>
                      <p>
                        <strong>DR Grade:</strong> {report.right_dr_grade || "-"}
                      </p>
                      <p>
                        <strong>Maculopathy:</strong>{" "}
                        {report.right_maculopathy_grade || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded border bg-slate-50 p-3 text-sm">
                    <p className="mb-2 font-semibold">Encounter VA Summary</p>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <p>
                          <strong>Left Unaided VA:</strong>{" "}
                          {encounterAny.left_unaided_va || "-"}
                        </p>
                        <p>
                          <strong>Left Corrected/Pinhole VA:</strong>{" "}
                          {encounterAny.left_corrected_pinhole_va || "-"}
                        </p>
                        <p>
                          <strong>Method:</strong>{" "}
                          {displayValue(encounterAny.left_va_method) || "-"}
                        </p>
                      </div>

                      <div>
                        <p>
                          <strong>Right Unaided VA:</strong>{" "}
                          {encounterAny.right_unaided_va || "-"}
                        </p>
                        <p>
                          <strong>Right Corrected/Pinhole VA:</strong>{" "}
                          {encounterAny.right_corrected_pinhole_va || "-"}
                        </p>
                        <p>
                          <strong>Method:</strong>{" "}
                          {displayValue(encounterAny.right_va_method) || "-"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p>
                      <strong>Recommendation:</strong> {report.recommendation || "-"}
                    </p>
                    <p>
                      <strong>Notes:</strong> {report.notes || "-"}
                    </p>
                  </div>
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