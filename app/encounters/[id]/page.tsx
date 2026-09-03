"use client";
/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element */

import Link from "next/link";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import {
  fetchEncounterById,
  updateEncounter,
  fetchEncounterUploads,
  fetchEncounterReports,
  fetchEncounterConsents,
  fetchPatientById,
  updatePatient,
  deleteImageUpload,
  fetchOcularInvestigations,
  correctEncounterServicePackage,
  correctEncounterAssessmentLocation,
} from "@/lib/api";
import { getMe, hasAnyRole, type CurrentUser } from "@/lib/auth";
import { Encounter, OcularInvestigation } from "@/types/encounter";
import { ImageUpload } from "@/types/upload";
import { StructuredReport } from "@/types/report";
import { ConsentRecord } from "@/types/consent";
import ImageUploadForm from "@/components/ImageUploadForm";
import ReportForm from "@/components/ReportForm";
import ConsentForm from "@/components/ConsentForm";
import OcularAssessmentForm from "@/components/OcularAssessmentForm";
import OcularInvestigationsAIReview from "@/components/OcularInvestigationsAIReview";
import RemidioMobileTransfer from "@/components/RemidioMobileTransfer";
import OnwardReferralManager from "@/components/OnwardReferralManager";
import EyeHealthScreeningReportForm from "@/components/EyeHealthScreeningReportForm";

type Props = {
  params: Promise<{ id: string }>;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const ALLOWED_DELETE_UPLOAD_ROLES = ["clinic_screener", "clinic_admin", "super_admin"];

function displayValue(value?: string | null) {
  if (!value) return "-";
  return value.replaceAll("_", " ");
}

function servicePackageLabel(value?: string | null) {
  return ({
    diabetic_retinal_assessment: "Diabetic Retinal Assessment",
    eye_health_screening: "Targeted Retinal and Glaucoma-Risk Screening",
    combined_diabetic_eye_health: "Combined Diabetic Retinal Assessment and Targeted Glaucoma-Risk Screening",
    comprehensive_ocular_assessment: "Comprehensive Ocular Assessment",
  } as Record<string, string>)[value || ""] || "Historical ocular classification not confirmed";
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

type EncounterSectionProps = {
  sectionId: string;
  title: string;
  status?: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
};

function EncounterSection({
  sectionId,
  title,
  status,
  open,
  onToggle,
  children,
}: EncounterSectionProps) {
  const buttonId = `encounter-section-${sectionId}-button`;
  const panelId = `encounter-section-${sectionId}-panel`;

  return (
    <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
      <h2>
        <button
          id={buttonId}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-inset sm:px-6"
        >
          <span className="min-w-0 font-semibold text-slate-950">{title}</span>
          <span className="flex shrink-0 items-center gap-3">
            {status ? (
              <span className="inline-flex max-w-32 truncate rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 sm:max-w-none">
                {status}
              </span>
            ) : null}
            <span aria-hidden="true" className="text-xl leading-none text-slate-500">
              {open ? "−" : "+"}
            </span>
          </span>
        </button>
      </h2>
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        className={open ? "border-t p-3 sm:p-5" : "hidden"}
      >
        {children}
      </div>
    </section>
  );
}

export default function EncounterDetailPage({ params }: Props) {
  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [patient, setPatient] = useState<any>(null);
  const [uploads, setUploads] = useState<ImageUpload[]>([]);
  const [reports, setReports] = useState<StructuredReport[]>([]);
  const [ocularInvestigations, setOcularInvestigations] = useState<OcularInvestigation[]>([]);
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [uploadActionMessage, setUploadActionMessage] = useState("");
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
  const [clinicalIntakeForm, setClinicalIntakeForm] = useState({
    diabetes_duration: "",
    symptoms_notes: "",
    clinical_notes: "",
  });
  const [packageReason, setPackageReason] = useState("");
  const [packageChoice, setPackageChoice] = useState("");
  const [diabeticConfirmed, setDiabeticConfirmed] = useState(false);
  const [packageMessage, setPackageMessage] = useState("");
  const [editingLocation, setEditingLocation] = useState(false);
  const [locationType, setLocationType] = useState("");
  const [locationName, setLocationName] = useState("");
  const [locationAddress, setLocationAddress] = useState("");
  const [locationReason, setLocationReason] = useState("");
  const [locationMessage, setLocationMessage] = useState("");

  const [savingMeasurements, setSavingMeasurements] = useState(false);
  const [measurementMessage, setMeasurementMessage] = useState("");
  const [measurementMessageType, setMeasurementMessageType] =
    useState<"success" | "error" | "info">("info");
  const [savingClinicalIntake, setSavingClinicalIntake] = useState(false);
  const [editingClinicalIntake, setEditingClinicalIntake] = useState(false);
  const [clinicalIntakeMessage, setClinicalIntakeMessage] = useState("");
  const [clinicalIntakeMessageType, setClinicalIntakeMessageType] =
    useState<"success" | "error">("success");
  const [openSections, setOpenSections] = useState<Set<string>>(() => new Set());
  const deepLinkHandled = useRef(false);

  const focusSection = useCallback((sectionId: string) => {
    window.requestAnimationFrame(() => {
      document.getElementById(`encounter-section-${sectionId}-button`)?.focus();
    });
  }, []);

  const expandSection = useCallback(
    (sectionId: string, focus = false) => {
      setOpenSections((current) => {
        if (current.has(sectionId)) return current;
        const next = new Set(current);
        next.add(sectionId);
        return next;
      });
      if (focus) focusSection(sectionId);
    },
    [focusSection]
  );

  function toggleSection(sectionId: string) {
    setOpenSections((current) => {
      const next = new Set(current);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  }

  async function loadEncounterPage(encounterId: string) {
    const encounterData: Encounter = await fetchEncounterById(encounterId);
    const e: any = encounterData;

    const patientData = await fetchPatientById(String(encounterData.patient));

    const [uploadData, reportData, consentData, investigationData] = await Promise.all([
      fetchEncounterUploads(encounterId),
      fetchEncounterReports(encounterId),
      fetchEncounterConsents(encounterId),
      fetchOcularInvestigations(encounterId).catch(() => []),
    ]);

    setEncounter(encounterData);
    setClinicalIntakeForm({
      diabetes_duration: encounterData.diabetes_duration || "",
      symptoms_notes: encounterData.symptoms_notes || "",
      clinical_notes: encounterData.clinical_notes || "",
    });

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
    setOcularInvestigations(investigationData);
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

  useEffect(() => {
    if (loading || deepLinkHandled.current) return;
    deepLinkHandled.current = true;

    const aliases: Record<string, string> = {
      ai: "photographs",
      "ai-analysis": "photographs",
      consent: "record-consents",
      ocular: "ocular-assessment",
      "ocular-ai": "ocular-investigations",
      report: "retinal-report",
      referral: "onward-referral",
    };
    const requested = new URLSearchParams(window.location.search).get("section")
      || window.location.hash.replace(/^#/, "");
    if (requested) {
      expandSection(aliases[requested] || requested, true);
    } else if (reports.some((report) => report.return_reason || report.ops_review_note)) {
      expandSection("retinal-report");
    }
  }, [expandSection, loading, reports]);

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
      expandSection("photographs", true);
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
      expandSection("photographs", true);
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

  function handleMeasurementChange(
    field: keyof typeof measurementForm,
    value: string
  ) {
    setMeasurementForm((current) => ({ ...current, [field]: value }));
  }

  function handleClinicalIntakeChange(
    field: keyof typeof clinicalIntakeForm,
    value: string
  ) {
    setClinicalIntakeForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSaveClinicalIntake() {
    if (!encounter?.id) return;

    try {
      setSavingClinicalIntake(true);
      setClinicalIntakeMessage("");
      const updatedEncounter = await updateEncounter(encounter.id, clinicalIntakeForm);
      setEncounter(updatedEncounter);
      setClinicalIntakeForm({
        diabetes_duration: updatedEncounter.diabetes_duration || "",
        symptoms_notes: updatedEncounter.symptoms_notes || "",
        clinical_notes: updatedEncounter.clinical_notes || "",
      });
      setClinicalIntakeMessageType("success");
      setClinicalIntakeMessage("Clinical intake saved successfully.");
      setEditingClinicalIntake(false);
    } catch (err) {
      setClinicalIntakeMessageType("error");
      setClinicalIntakeMessage(
        err instanceof Error ? err.message : "Failed to save clinical intake."
      );
      expandSection("clinical-intake", true);
    } finally {
      setSavingClinicalIntake(false);
    }
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
      expandSection("technician", true);
    } finally {
      setSavingMeasurements(false);
    }
  }


  const canDeleteUploads = hasAnyRole(currentUser, ALLOWED_DELETE_UPLOAD_ROLES);
  const canEditClinicalIntake = Boolean(
    currentUser &&
      currentUser.organization?.organization_type === "clinic" &&
      currentUser.roles?.some((role) => role === "optometrist" || role === "reviewer")
  );
  const canCorrectPackage = canEditClinicalIntake && !encounter?.service_package_locked;
  const includesDiabetic = encounter?.service_package
    ? ["diabetic_retinal_assessment", "combined_diabetic_eye_health"].includes(encounter.service_package)
    : ["diabetic_screening", "combined_assessment"].includes(encounter?.programme || "");
  const includesEyeHealth = encounter?.service_package
    ? ["eye_health_screening", "combined_diabetic_eye_health"].includes(encounter.service_package)
    : encounter?.programme === "combined_assessment";
  const isComprehensiveOcular = encounter?.service_package
    ? encounter.service_package === "comprehensive_ocular_assessment"
    : encounter?.programme === "ocular_diagnostics";

  function beginLocationCorrection() {
    const location = encounter?.assessment_location_snapshot || {};
    setLocationType(location.location_type || "clinic");
    setLocationName(location.site_name || "");
    setLocationAddress(location.address || "");
    setLocationReason("");
    setLocationMessage("");
    setEditingLocation(true);
  }

  async function saveLocationCorrection() {
    if (!encounter || !locationName.trim() || !locationReason.trim()) {
      setLocationMessage("Enter the corrected location and a correction reason.");
      return;
    }
    try {
      const updated = await correctEncounterAssessmentLocation(encounter.id, {
        location_type: locationType, site_name: locationName.trim(),
        address: locationAddress.trim(), reason: locationReason.trim(),
      });
      setEncounter(updated);
      setEditingLocation(false);
      setLocationMessage("Assessment location corrected and audited.");
    } catch (value) {
      setLocationMessage(value instanceof Error ? value.message : "Location correction failed.");
    }
  }

  async function savePackageCorrection() {
    if (!encounter || !packageChoice || !packageReason.trim()) return setPackageMessage("Choose a package and enter a correction reason.");
    try {
      const updated = await correctEncounterServicePackage(encounter.id, { service_package: packageChoice, reason: packageReason.trim(), diabetic_confirmed: diabeticConfirmed });
      setEncounter(updated); setPackageMessage("Service package corrected and audited."); setPackageReason("");
    } catch (value) { setPackageMessage(value instanceof Error ? value.message : "Correction failed."); }
  }

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
    <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-10">
      <section className="rounded-xl border bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row">
          <div>
            <h1 className="text-2xl font-bold">
              {displayValue(encounter.service_package || encounter.programme)}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Technician capture and programme-specific clinical reporting.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href={`/patients/${patient.id}`} className="rounded-lg border px-4 py-2">
              View Patient
            </Link>
            <Link href="/retinal-assessments" className="rounded-lg px-2 py-2 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
              Back to Retinal Assessments
            </Link>
          </div>
        </div>

        <div className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <p>
            <strong>Assessment ID:</strong> {encounter.encounter_id}
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
            <strong>Programme:</strong> {displayValue(encounter.programme)}
          </p>
          <p><strong>Service package:</strong> {displayValue(encounter.service_package || "Historical — confirmation required")}</p>
          <div className="sm:col-span-2 lg:col-span-3"><p><strong>Assessment location:</strong> {[encounter.assessment_location_snapshot?.site_name, encounter.assessment_location_snapshot?.address].filter(Boolean).join(" · ") || "Not recorded"}</p>{canEditClinicalIntake ? <div className="mt-2 space-y-2">{!editingLocation ? <button type="button" onClick={beginLocationCorrection} className="rounded border px-3 py-1.5 text-xs font-semibold">Correct assessment location</button> : <div className="grid gap-2 rounded border p-3 sm:grid-cols-2"><select value={locationType} onChange={(e)=>setLocationType(e.target.value)} className="rounded border p-2"><option value="clinic">Clinic</option><option value="hospital">Hospital</option><option value="mobile">Mobile</option><option value="community">Community</option><option value="other">Other</option></select><input value={locationName} onChange={(e)=>setLocationName(e.target.value)} placeholder="Site/location name" className="rounded border p-2"/><input value={locationAddress} onChange={(e)=>setLocationAddress(e.target.value)} placeholder="Address (optional)" className="rounded border p-2 sm:col-span-2"/><textarea value={locationReason} onChange={(e)=>setLocationReason(e.target.value)} placeholder="Required correction reason" className="rounded border p-2 sm:col-span-2"/><div className="flex gap-2 sm:col-span-2"><button type="button" onClick={()=>void saveLocationCorrection()} className="rounded bg-slate-900 px-3 py-2 text-xs font-semibold text-white">Save correction</button><button type="button" onClick={()=>setEditingLocation(false)} className="rounded border px-3 py-2 text-xs font-semibold">Cancel</button></div></div>}{locationMessage ? <p className="text-xs text-slate-700">{locationMessage}</p> : null}</div> : null}</div>
          <p>
            <strong>Consent Status:</strong> {patient.consent_status || "-"}
          </p>
          <p><strong>Source:</strong> {displayValue(encounterAny.source_type)}</p>
          <p><strong>Workflow:</strong> {displayValue(encounterAny.workflow_route)}</p>
          <p><strong>Payment Responsibility:</strong> {displayValue(encounterAny.payment_responsibility)}</p>
          {encounterAny.source_hospital_name ? <p><strong>Source Hospital:</strong> {encounterAny.source_hospital_name}</p> : null}
        </div>
      </section>

      {encounterAny?.poor_va_flag ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="alert">
          <p className="font-semibold">Poor corrected/pinhole VA flag</p>
          <p className="mt-1">
            {encounterAny.poor_va_reason ||
              "Corrected/pinhole VA is 6/12 or worse. Optometrist should consider referral based on clinical judgement."}
          </p>
        </div>
      ) : null}

      {reports.some((report) => report.return_reason || report.ops_review_note) ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="alert">
          <p className="font-semibold">Retinal report requires attention</p>
          <p className="mt-1">Open Retinal Report or Structured Reports to review the Sentinel Ops note.</p>
        </div>
      ) : null}

      <div className="space-y-3" aria-label="Encounter workflow sections">
      <EncounterSection sectionId="service-package" title="Service Package" status={encounter.service_package ? "Recorded" : "Attention required"} open={openSections.has("service-package")} onToggle={() => toggleSection("service-package")}>
        <div className="space-y-3"><p><strong>Current:</strong> {servicePackageLabel(encounter.service_package)}</p>{canCorrectPackage ? <><select value={packageChoice} onChange={(event) => setPackageChoice(event.target.value)} className="w-full rounded border p-2"><option value="">Select corrected package</option><option value="diabetic_retinal_assessment">Diabetic Retinal Assessment</option><option value="eye_health_screening">Targeted Retinal and Glaucoma-Risk Screening</option><option value="combined_diabetic_eye_health">Combined Diabetic Retinal Assessment and Targeted Glaucoma-Risk Screening</option><option value="comprehensive_ocular_assessment">Comprehensive Ocular Assessment</option></select><textarea value={packageReason} onChange={(event) => setPackageReason(event.target.value)} placeholder="Required correction reason" className="w-full rounded border p-2"/><label className="flex gap-2 text-sm"><input type="checkbox" checked={diabeticConfirmed} onChange={(event) => setDiabeticConfirmed(event.target.checked)}/>Patient diabetes status confirmed when changing ocular to combined</label><button onClick={() => void savePackageCorrection()} className="rounded bg-slate-900 px-4 py-2 font-semibold text-white">Correct service package</button></> : <p className="text-sm text-slate-600">Package correction requires performing-clinic optometrist/reviewer authority and an unfinalized report.</p>}{packageMessage && <p className="text-sm">{packageMessage}</p>}</div>
      </EncounterSection>
      <EncounterSection
        sectionId="clinical-intake"
        title="Clinical Intake"
        open={openSections.has("clinical-intake")}
        onToggle={() => toggleSection("clinical-intake")}
      >
        <div className="space-y-4 rounded-lg p-1 sm:p-2">
          <div>
            <h2 className="text-xl font-semibold">Clinical Intake</h2>
            <p className="mt-1 text-sm text-gray-600">
              Review the assessment history recorded when this encounter was created.
            </p>
          </div>

          {clinicalIntakeMessage ? (
            <div
              role={clinicalIntakeMessageType === "error" ? "alert" : "status"}
              className={`rounded-lg border p-3 text-sm font-medium ${
                clinicalIntakeMessageType === "error"
                  ? "border-red-200 bg-red-50 text-red-800"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800"
              }`}
            >
              {clinicalIntakeMessage}
            </div>
          ) : null}

          {canEditClinicalIntake && !editingClinicalIntake ? <button type="button" onClick={() => setEditingClinicalIntake(true)} className="rounded border px-3 py-2 text-sm font-semibold">Edit clinical intake</button> : null}

          {canEditClinicalIntake && editingClinicalIntake ? (
            <div className="grid gap-4">
              {includesDiabetic || clinicalIntakeForm.diabetes_duration ? (
                <label className="space-y-1">
                  <span className="text-sm font-medium">Diabetes duration</span>
                  <input
                    value={clinicalIntakeForm.diabetes_duration}
                    onChange={(event) => handleClinicalIntakeChange("diabetes_duration", event.target.value)}
                    className="w-full rounded-lg border px-3 py-2"
                    placeholder="Not recorded"
                  />
                </label>
              ) : null}
              <label className="space-y-1">
                <span className="text-sm font-medium">Symptoms / intake notes</span>
                <textarea
                  value={clinicalIntakeForm.symptoms_notes}
                  onChange={(event) => handleClinicalIntakeChange("symptoms_notes", event.target.value)}
                  className="w-full rounded-lg border px-3 py-2"
                  rows={3}
                  placeholder="Not recorded"
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium">Clinical notes</span>
                <textarea
                  value={clinicalIntakeForm.clinical_notes}
                  onChange={(event) => handleClinicalIntakeChange("clinical_notes", event.target.value)}
                  className="w-full rounded-lg border px-3 py-2"
                  rows={3}
                  placeholder="Not recorded"
                />
              </label>
              <div>
                <button
                  type="button"
                  onClick={handleSaveClinicalIntake}
                  disabled={savingClinicalIntake}
                  className="rounded-lg bg-blue-700 px-4 py-2 font-medium text-white disabled:opacity-60"
                >
                  {savingClinicalIntake ? "Saving..." : "Save clinical intake"}
                </button>
              </div>
            </div>
          ) : (
            <dl className="grid gap-4 text-sm md:grid-cols-2">
              {includesDiabetic || clinicalIntakeForm.diabetes_duration ? (
                <div>
                  <dt className="font-medium text-slate-700">Diabetes duration</dt>
                  <dd className="mt-1 whitespace-pre-wrap text-slate-950">
                    {clinicalIntakeForm.diabetes_duration || "Not recorded"}
                  </dd>
                </div>
              ) : null}
              <div>
                <dt className="font-medium text-slate-700">Symptoms / intake notes</dt>
                <dd className="mt-1 whitespace-pre-wrap text-slate-950">
                  {clinicalIntakeForm.symptoms_notes || "Not recorded"}
                </dd>
              </div>
              <div className="md:col-span-2">
                <dt className="font-medium text-slate-700">Clinical notes</dt>
                <dd className="mt-1 whitespace-pre-wrap text-slate-950">
                  {clinicalIntakeForm.clinical_notes || "Not recorded"}
                </dd>
              </div>
            </dl>
          )}
        </div>
      </EncounterSection>

      <EncounterSection
        sectionId="technician"
        title="Technician Capture: VA, IOP and Dilation"
        status={Object.values(measurementForm).some(Boolean) ? "In progress" : "Not started"}
        open={openSections.has("technician")}
        onToggle={() => toggleSection("technician")}
      >
      <div className="rounded-lg p-1 sm:p-2">
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
      </div>
      </EncounterSection>

      <EncounterSection
        sectionId="upload"
        title="Upload Retinal Image"
        status={uploads.length ? `${uploads.length} image${uploads.length === 1 ? "" : "s"} present` : "Not started"}
        open={openSections.has("upload")}
        onToggle={() => toggleSection("upload")}
      >
      <ImageUploadForm
        encounterId={encounter.id}
        patientId={encounter.patient}
        existingUploads={uploads}
        onUploadSuccess={handleImageUploaded}
      />
      </EncounterSection>

      <EncounterSection
        sectionId="remidio"
        title="Import from Remidio"
        open={openSections.has("remidio")}
        onToggle={() => toggleSection("remidio")}
      >
      <RemidioMobileTransfer
        encounterId={encounter.id}
        onConfirmed={handleImageUploaded}
      />
      </EncounterSection>

      <EncounterSection
        sectionId="photographs"
        title="Fundus Photographs"
        status={uploads.length ? `${uploads.length} available` : "Not started"}
        open={openSections.has("photographs")}
        onToggle={() => toggleSection("photographs")}
      >
      <div className="rounded-lg p-1 sm:p-2">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Fundus Photographs</h2>
          <p className="mt-1 text-sm text-gray-600">
            Upload each retinal image once. General ocular uploads are stored
            only and do not activate any AI; diabetic AI runs only for diabetic
            or combined pathways under its existing consent rules.
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

                  {includesDiabetic ? (
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
                  ) : (
                    <p className="rounded-lg border bg-blue-50 p-3 text-sm text-blue-900">
                      Diabetic AI analysis is not run for general ocular-only assessments.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      </EncounterSection>

      <EncounterSection
        sectionId="record-consents"
        title="Record Consents"
        status={patient.consent_status === "completed" ? "Complete" : "Attention required"}
        open={openSections.has("record-consents")}
        onToggle={() => toggleSection("record-consents")}
      >
      <ConsentForm
        encounterId={encounter.id}
        patientId={encounter.patient}
        onConsentSaved={handleConsentSaved}
      />
      </EncounterSection>

      <EncounterSection
        sectionId="consent-records"
        title="Consent Records"
        status={consents.length ? `${consents.length} recorded` : "Not started"}
        open={openSections.has("consent-records")}
        onToggle={() => toggleSection("consent-records")}
      >
      <div className="rounded-lg p-1 sm:p-2">
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
      </div>
      </EncounterSection>

      {isComprehensiveOcular ? (
        <EncounterSection
          sectionId="ocular-assessment"
          title="Comprehensive Ocular Assessment Clinical Record"
          status={encounter.ocular_assessment ? "In progress" : "Not started"}
          open={openSections.has("ocular-assessment")}
          onToggle={() => toggleSection("ocular-assessment")}
        >
        <OcularAssessmentForm
          encounterId={encounter.id}
          initial={encounter.ocular_assessment}
          onSaved={(assessment) =>
            setEncounter((current) =>
              current ? { ...current, ocular_assessment: assessment } : current
            )
          }
          fundusUploads={uploads}
          ocularInvestigations={ocularInvestigations}
        />
        </EncounterSection>
      ) : null}

      {isComprehensiveOcular || includesEyeHealth ? (
        <EncounterSection
          sectionId="ocular-investigations"
          title="Additional Ocular Investigations and Sentinel AI Clinical Review"
          status={ocularInvestigations.length ? `${ocularInvestigations.length} investigation${ocularInvestigations.length === 1 ? "" : "s"}` : "Not started"}
          open={openSections.has("ocular-investigations")}
          onToggle={() => toggleSection("ocular-investigations")}
        >
        <OcularInvestigationsAIReview
          encounterId={encounter.id}
          assessment={encounter.ocular_assessment}
          fundusUploads={uploads.map((upload) => ({
            ...upload,
            image_file: resolveFileUrl(upload.image_file),
          }))}
        />
        </EncounterSection>
      ) : null}

      {includesDiabetic ? <EncounterSection
        sectionId="retinal-report"
        title="Optometrist Report: Diabetic Grading"
        status={reports[0]?.report_status ? displayValue(reports[0].report_status) : "Not started"}
        open={openSections.has("retinal-report")}
        onToggle={() => toggleSection("retinal-report")}
      >
      <div className="rounded-lg p-1 sm:p-2">
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
          workflowRoute={encounterAny.workflow_route || "sentinel_managed"}
          encounter={encounterAny}
          existingReport={reports[0] || null}
          onReportSaved={handleReportCreated}
          programme={encounter.programme}
          fundusUploads={uploads}
          ocularInvestigations={ocularInvestigations}
        />
      </div>
      </EncounterSection> : null}

      {includesEyeHealth ? <EncounterSection
        sectionId="eye-health-report"
        title="Targeted Retinal and Glaucoma-Risk Screening Report"
        status={displayValue(encounter.targeted_screening_report_status || "not_started")}
        open={openSections.has("eye-health-report")}
        onToggle={() => toggleSection("eye-health-report")}
      >
        <EyeHealthScreeningReportForm
          encounterId={encounter.id}
          uploads={uploads}
          investigations={ocularInvestigations}
          canEdit={canEditClinicalIntake}
          combined={encounter.service_package === "combined_diabetic_eye_health"}
        />
      </EncounterSection> : null}

      {includesDiabetic ? <EncounterSection
        sectionId="structured-reports"
        title="Structured Reports"
        status={reports.length ? `${reports.length} report${reports.length === 1 ? "" : "s"}` : "Not started"}
        open={openSections.has("structured-reports")}
        onToggle={() => toggleSection("structured-reports")}
      >
      <div className="rounded-lg p-1 sm:p-2">
        <h2 className="mb-4 text-xl font-semibold">Structured Reports</h2>

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
                    <p className="mb-2 font-semibold">Assessment VA Summary</p>
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
              </div>
            ))}
          </div>
        )}
      </div>
      </EncounterSection> : null}

      <EncounterSection
        sectionId="onward-referral"
        title="Onward ophthalmology referral"
        open={openSections.has("onward-referral")}
        onToggle={() => toggleSection("onward-referral")}
      >
      <OnwardReferralManager
        encounterId={encounter.id}
        encounterReference={encounter.encounter_id}
        patientPhone={patient.phone || ""}
        user={currentUser}
      />
      </EncounterSection>
      </div>
    </main>
  );
}
