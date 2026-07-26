"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createReport,
  getReportPdfUrl,
  submitReportToOps,
  clinicIssueReport,
  updateReport,
} from "@/lib/api";
import { getMe, hasAnyRole, type CurrentUser } from "@/lib/auth";
import type { StructuredReport } from "@/types/report";
import type { OcularInvestigation } from "@/types/encounter";
import type { ImageUpload } from "@/types/upload";

type Props = {
  encounterId: number;
  patientId: number;
  patientConsentStatus: string;
  workflowRoute: "clinic_managed" | "sentinel_managed";
  existingReport?: StructuredReport | null;
  encounter?: {
    left_unaided_va?: string;
    right_unaided_va?: string;
    left_corrected_pinhole_va?: string;
    right_corrected_pinhole_va?: string;
    poor_va_flag?: boolean;
    poor_va_reason?: string;
  } | null;
  onReportSaved?: () => Promise<void> | void;
  programme?: string;
  fundusUploads?: ImageUpload[];
  ocularInvestigations?: OcularInvestigation[];
};

const ALLOWED_REPORT_ROLES = ["reviewer", "clinic_admin", "super_admin"];
const ALLOWED_SUBMIT_TO_OPS_ROLES = ["reviewer", "clinic_admin", "super_admin"];

const VA_OPTIONS = ["", "6/4", "6/5", "6/6", "6/7.5", "6/9", "6/12", "6/15", "6/18", "6/24", "6/36", "6/60", "CF", "HM", "PL", "NPL"];
const DR_GRADE_OPTIONS = [
  { value: "", label: "Not Recorded" },
  { value: "R0", label: "R0 - No DR" },
  { value: "R1", label: "R1 - Background DR" },
  { value: "R2", label: "R2 - Pre-proliferative DR" },
  { value: "R3A", label: "R3A - Active proliferative DR" },
  { value: "R3S", label: "R3S - Stable treated proliferative DR" },
  { value: "U", label: "Ungradable" },
];
const MACULOPATHY_OPTIONS = [
  { value: "", label: "Not Recorded" },
  { value: "M0", label: "M0 - No maculopathy" },
  { value: "M1", label: "M1 - Maculopathy" },
  { value: "U", label: "Ungradable" },
];

function blankForm(encounterId: number, patientId: number, encounter?: Props["encounter"]) {
  return {
    report_id: "",
    encounter: encounterId,
    patient: patientId,
    review_date: "",
    left_unaided_va: encounter?.left_unaided_va || "",
    left_corrected_va: encounter?.left_corrected_pinhole_va || "",
    left_dr_grade: "",
    left_maculopathy_grade: "",
    right_unaided_va: encounter?.right_unaided_va || "",
    right_corrected_va: encounter?.right_corrected_pinhole_va || "",
    right_dr_grade: "",
    right_maculopathy_grade: "",
    dr_grade: "",
    maculopathy_grade: "",
    ungradable: false,
    urgency_outcome: "routine_followup",
    recommendation: "",
    next_followup_interval: "",
    recall_months: "",
    final_clinical_summary: "",
    clinical_summary_overridden: false,
    notes: "",
    report_layout: "text_only" as "text_only" | "with_investigations",
    selected_fundus_upload_ids: [] as number[],
    selected_ocular_investigation_ids: [] as number[],
    attachment_captions: {} as Record<string, string>,
  };
}

export default function ReportForm({
  encounterId,
  patientId,
  patientConsentStatus,
  workflowRoute,
  existingReport,
  encounter,
  onReportSaved,
  programme,
  fundusUploads = [],
  ocularInvestigations = [],
}: Props) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [report, setReport] = useState<StructuredReport | null>(existingReport || null);
  const [formData, setFormData] = useState(blankForm(encounterId, patientId, encounter));
  const [loading, setLoading] = useState(false);
  const [submittingToOps, setSubmittingToOps] = useState(false);
  const [issuingDirectly, setIssuingDirectly] = useState(false);
  const [signature, setSignature] = useState({ signer_name: "", signer_role: "", signer_registration_number: "" });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");

  useEffect(() => {
    getMe()
      .then(setCurrentUser)
      .catch(() => setCurrentUser(null))
      .finally(() => setAuthLoading(false));
  }, []);

  useEffect(() => {
    setReport(existingReport || null);
    if (existingReport) {
      setFormData({
        report_id: existingReport.report_id || "",
        encounter: existingReport.encounter,
        patient: existingReport.patient,
        review_date: existingReport.review_date || "",
        left_unaided_va: existingReport.left_unaided_va || "",
        left_corrected_va: existingReport.left_corrected_va || "",
        left_dr_grade: existingReport.left_dr_grade || "",
        left_maculopathy_grade: existingReport.left_maculopathy_grade || "",
        right_unaided_va: existingReport.right_unaided_va || "",
        right_corrected_va: existingReport.right_corrected_va || "",
        right_dr_grade: existingReport.right_dr_grade || "",
        right_maculopathy_grade: existingReport.right_maculopathy_grade || "",
        dr_grade: existingReport.dr_grade || "",
        maculopathy_grade: existingReport.maculopathy_grade || "",
        ungradable: !!existingReport.ungradable,
        urgency_outcome: existingReport.urgency_outcome || "routine_followup",
        recommendation: existingReport.recommendation || "",
        next_followup_interval: existingReport.next_followup_interval || "",
        recall_months: existingReport.recall_months
          ? String(existingReport.recall_months)
          : "",
        final_clinical_summary:
          existingReport.final_clinical_summary || "",
        clinical_summary_overridden:
          Boolean(existingReport.clinical_summary_overridden),
        notes: existingReport.notes || "",
        report_layout: existingReport.report_layout || "text_only",
        selected_fundus_upload_ids: existingReport.selected_fundus_upload_ids || [],
        selected_ocular_investigation_ids:
          existingReport.selected_ocular_investigation_ids || [],
        attachment_captions: existingReport.attachment_captions || {},
      });

      setSignature({
        signer_name: existingReport.signer_name || "",
        signer_role: existingReport.signer_role || "",
        signer_registration_number:
          existingReport.signer_registration_number || "",
      });
    } else {
      setFormData(blankForm(encounterId, patientId, encounter));
    }
  }, [existingReport, encounterId, patientId, encounter]);

  const isExisting = !!report?.id;
  const isEditable = !report || ["draft", "under_review", "signed_off", "returned_to_clinic", "ops_rejected"].includes(report.report_status || "");
  const canSubmit = !!report && ["draft", "under_review", "signed_off", "returned_to_clinic", "ops_rejected"].includes(report.report_status || "");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const fieldName = e.target.name;
    const value = fieldName === "ungradable" ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData((prev) => {
      const next = { ...prev, [fieldName]: value };
      if (fieldName === "ungradable" && value === true) {
        next.urgency_outcome = "image_retake";
        next.left_dr_grade = "U";
        next.left_maculopathy_grade = "U";
        next.right_dr_grade = "U";
        next.right_maculopathy_grade = "U";
      }
      if (fieldName === "urgency_outcome" && value === "image_retake") next.ungradable = true;
      return next;
    });
  }

  async function refresh() {
    await onReportSaved?.();
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hasAnyRole(currentUser, ALLOWED_REPORT_ROLES)) {
      setMessageType("error");
      setMessage("You do not have permission to create or update reports.");
      return;
    }
    if (!isEditable) {
      setMessageType("error");
      setMessage(`This report is ${report?.report_status?.replaceAll("_", " ")} and is read-only.`);
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      const payload = {
        ...formData,

        dr_grade:
          formData.right_dr_grade ||
          formData.left_dr_grade ||
          formData.dr_grade ||
          "",

        maculopathy_grade:
          formData.right_maculopathy_grade ||
          formData.left_maculopathy_grade ||
          formData.maculopathy_grade ||
          "",

        signer_name: signature.signer_name,
        signer_role: signature.signer_role,
        signer_registration_number:
          signature.signer_registration_number,
      };
      const saved = isExisting
        ? await updateReport(report!.id, payload)
        : await createReport(payload);
      setReport(saved);
      setMessageType("success");
      setMessage(isExisting ? "Report saved successfully." : "Report created successfully.");
      await refresh();
    } catch (error) {
      setMessageType("error");
      setMessage(error instanceof Error ? error.message : "Failed to save report.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitToOps() {
    if (!report?.id) return;
    if (!hasAnyRole(currentUser, ALLOWED_SUBMIT_TO_OPS_ROLES)) {
      setMessageType("error");
      setMessage("You do not have permission to submit reports to Ops.");
      return;
    }
    try {
      setSubmittingToOps(true);
      const response = await submitReportToOps(report.id);
      setReport((current) => current ? { ...current, report_status: response.report_status || "submitted_to_ops" } : current);
      setMessageType("success");
      setMessage("Report submitted to Ops successfully.");
      await refresh();
    } catch (error) {
      setMessageType("error");
      setMessage(error instanceof Error ? error.message : "Failed to submit report to Ops.");
    } finally {
      setSubmittingToOps(false);
    }
  }

    async function handleClinicIssue() {
    if (!report?.id) {
      setMessageType("error");
      setMessage("Save the report draft before issuing it.");
      return;
    }

    if (
      !signature.signer_name.trim() ||
      !signature.signer_role.trim() ||
      !signature.signer_registration_number.trim()
    ) {
      setMessageType("error");
      setMessage(
        "Clinician name, professional role and registration number are required before issue."
      );
      return;
    }

    const confirmed = window.confirm(
      [
        "Sign and issue this report?",
        "",
        "After issue:",
        "• The report will become read-only.",
        "• The electronic signature will be permanently recorded.",
        "• Sentinel will retain a read-only audit copy.",
        "",
        "Continue?",
      ].join("\n")
    );

    if (!confirmed) {
      return;
    }

    try {
      setIssuingDirectly(true);
      setMessage("");

      const response = await clinicIssueReport(
        report.id,
        signature
      );

      setReport(
        response.report || {
          ...report,
          report_status: "issued",
        }
      );

      setMessageType("success");
      setMessage(
        "Report signed and issued successfully. The report is now read-only."
      );

      await refresh();
    } catch (error) {
      setMessageType("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to sign and issue report."
      );
    } finally {
      setIssuingDirectly(false);
    }
  }

  if (authLoading) return <div className="rounded-lg border p-4">Checking permissions...</div>;
  if (!hasAnyRole(currentUser, ALLOWED_REPORT_ROLES)) return <div className="rounded-lg border bg-gray-50 p-4">You do not have permission to create or update reports.</div>;
  if ((patientConsentStatus || "").trim().toLowerCase() !== "completed") {
    return <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-800">Report creation is blocked until patient consent is completed.</div>;
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">{isExisting ? "Edit Structured Report" : "Create Structured Report"}</h2>
          <p className="mt-1 text-sm text-gray-600">
            {isExisting ? "Changes update the existing report for this encounter. A second report cannot be created." : "Create the single structured report for this encounter."}
          </p>
        </div>

        {report?.return_reason || report?.ops_review_note ? (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">Sentinel Ops correction request</p>
            <p>{report.return_reason || report.ops_review_note}</p>
          </div>
        ) : null}

        {!isEditable ? (
          <div className="rounded-lg border bg-slate-100 p-3 text-sm">
            This report is currently <strong>{report?.report_status?.replaceAll("_", " ")}</strong> and cannot be edited.
          </div>
        ) : null}

        <input name="report_id" value={formData.report_id} onChange={handleChange} placeholder="Report ID" className="w-full rounded border p-3" required disabled={isExisting || !isEditable} />
        <input name="review_date" type="date" value={formData.review_date} onChange={handleChange} className="w-full rounded border p-3" required disabled={!isEditable} />

        {programme !== "ocular_diagnostics" ? (
          <>
            <EyeSection title="Left Eye" prefix="left" data={formData} onChange={handleChange} disabled={!isEditable} />
            <EyeSection title="Right Eye" prefix="right" data={formData} onChange={handleChange} disabled={!isEditable} />
          </>
        ) : null}

        <label className="flex items-center gap-2">
          <input type="checkbox" name="ungradable" checked={formData.ungradable} onChange={handleChange} disabled={!isEditable} />
          Ungradable / image retake required
        </label>

        <select name="urgency_outcome" value={formData.urgency_outcome} onChange={handleChange} className="w-full rounded border p-3" disabled={!isEditable}>
          <option value="routine_followup">Routine Follow-up</option>
          <option value="early_review">Early Review</option>
          <option value="urgent_referral">Urgent Referral</option>
          <option value="ophthalmology_required">Ophthalmology Required</option>
          <option value="image_retake">Image Retake</option>
        </select>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">
            Recall period in months (1–24)
          </span>
          <input
            name="recall_months"
            type="number"
            min={1}
            max={24}
            value={formData.recall_months}
            onChange={handleChange}
            placeholder="e.g. 12"
            className="w-full rounded border p-3"
            disabled={!isEditable}
          />
        </label>
        <textarea name="recommendation" value={formData.recommendation} onChange={handleChange} placeholder="Recommendation" className="w-full rounded border p-3" rows={4} disabled={!isEditable} />
        <label className="block">
          <span className="mb-1 block text-sm font-medium">
            Final clinical interpretation
          </span>
          <textarea
            name="final_clinical_summary"
            value={formData.final_clinical_summary}
            onChange={(event) =>
              setFormData((current: any) => ({
                ...current,
                final_clinical_summary: event.target.value,
                clinical_summary_overridden: true,
              }))
            }
            placeholder="Generated from grades; edit only when clinically necessary."
            className="w-full rounded border p-3"
            rows={5}
            disabled={!isEditable}
          />
        </label>
        <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Notes" className="w-full rounded border p-3" rows={4} disabled={!isEditable} />

        <section className="rounded-lg border bg-slate-50 p-4">
          <h3 className="font-semibold">Report Content & Attachments</h3>
          <p className="mt-1 text-sm text-slate-600">
            Nothing is included automatically. Select text only, or choose the exact supporting files for the PDF.
          </p>
          <div className="mt-3 flex flex-wrap gap-4">
            {(["text_only", "with_investigations"] as const).map((value) => (
              <label key={value} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="report_layout"
                  checked={formData.report_layout === value}
                  disabled={!isEditable}
                  onChange={() =>
                    setFormData((current) => ({
                      ...current,
                      report_layout: value,
                      ...(value === "text_only"
                        ? {
                            selected_fundus_upload_ids: [],
                            selected_ocular_investigation_ids: [],
                          }
                        : {}),
                    }))
                  }
                />
                {value === "text_only" ? "Text-only report" : "Include selected investigations"}
              </label>
            ))}
          </div>
          {formData.report_layout === "with_investigations" ? (
            <div className="mt-4 space-y-3">
              {fundusUploads.map((item) => (
                <AttachmentChoice
                  key={`fundus-${item.id}`}
                  label={`Fundus photograph — ${item.eye_laterality}`}
                  itemId={item.id}
                  captionKey={`fundus:${item.id}`}
                  selected={formData.selected_fundus_upload_ids}
                  disabled={!isEditable}
                  formData={formData}
                  setFormData={setFormData}
                  selectedField="selected_fundus_upload_ids"
                />
              ))}
              {ocularInvestigations.map((item) => (
                <AttachmentChoice
                  key={`investigation-${item.id}`}
                  label={`${item.investigation_type.replaceAll("_", " ")} — ${item.laterality}`}
                  itemId={item.id}
                  captionKey={`investigation:${item.id}`}
                  selected={formData.selected_ocular_investigation_ids}
                  disabled={!isEditable}
                  formData={formData}
                  setFormData={setFormData}
                  selectedField="selected_ocular_investigation_ids"
                />
              ))}
              {!fundusUploads.length && !ocularInvestigations.length ? (
                <p className="text-sm text-slate-500">No supporting investigations have been uploaded.</p>
              ) : null}
            </div>
          ) : null}
        </section>

        {report?.id && workflowRoute === "clinic_managed" && canSubmit ? (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <h3 className="font-semibold text-blue-950">Electronic Clinician Signature</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <input value={signature.signer_name} onChange={(e)=>setSignature({...signature, signer_name:e.target.value})} placeholder="Clinician full name" className="rounded border bg-white p-3" />
              <input value={signature.signer_role} onChange={(e)=>setSignature({...signature, signer_role:e.target.value})} placeholder="Professional role" className="rounded border bg-white p-3" />
              <input value={signature.signer_registration_number} onChange={(e)=>setSignature({...signature, signer_registration_number:e.target.value})} placeholder="Registration number" className="rounded border bg-white p-3" />
            </div>
          </div>
        ) : null}

        {message ? <div className={`rounded-lg border p-3 text-sm font-medium ${messageType === "error" ? "border-red-200 bg-red-50 text-red-800" : messageType === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-50 text-slate-700"}`}>{message}</div> : null}

        {report?.report_status === "issued" && report?.signed_at ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <p className="font-semibold">Electronically Signed and Issued</p>
            <p>{report.signer_name || report.signed_by_display || "-"}{report.signer_role ? ` · ${report.signer_role}` : ""}{report.signer_registration_number ? ` · ${report.signer_registration_number}` : ""}</p>
            <p>{report.signed_at}</p>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          {isEditable ? (
            <button type="submit" disabled={loading} className="rounded-lg bg-black px-4 py-3 text-white disabled:opacity-50">
              {loading ? "Saving..." : isExisting ? "Save Report" : "Create Report"}
            </button>
          ) : null}

          {report?.id ? (
          <button
            type="button"
            onClick={() =>
              window.open(
                getReportPdfUrl(report.id),
                "_blank",
                "noopener,noreferrer"
              )
            }
            className="rounded-lg border border-blue-600 bg-white px-5 py-3 font-semibold text-blue-700 hover:bg-blue-50"
          >
            {report.report_status === "issued"
              ? "Open Final PDF"
              : "Preview Draft PDF"}
          </button>
          ) : null}

          {canSubmit && workflowRoute === "sentinel_managed" ? (
            <button type="button" onClick={handleSubmitToOps} disabled={submittingToOps} className="rounded-lg bg-emerald-600 px-4 py-3 text-white disabled:opacity-50">
              {submittingToOps ? "Submitting..." : report?.report_status === "returned_to_clinic" || report?.report_status === "ops_rejected" ? "Resubmit to Ops" : "Submit to Sentinel Ops"}
            </button>
          ) : null}
          {canSubmit && workflowRoute === "clinic_managed" ? (
            <button
              type="button"
              onClick={handleClinicIssue}
              disabled={issuingDirectly}
              style={{
                backgroundColor: issuingDirectly ? "#6ee7b7" : "#047857",
                color: "#ffffff",
                border: "1px solid #065f46",
                opacity: 1,
              }}
              className="rounded-lg px-5 py-3 font-semibold shadow-sm hover:brightness-90 disabled:cursor-not-allowed"
            >
              {issuingDirectly
                ? "Signing and Issuing..."
                : "Sign and Issue Report"}
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}

function AttachmentChoice({ label, itemId, captionKey, selected, disabled, formData, setFormData, selectedField }: any) {
  const checked = selected.includes(itemId);
  return (
    <div className="rounded border bg-white p-3">
      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) =>
            setFormData((current: any) => ({
              ...current,
              [selectedField]: event.target.checked
                ? [...current[selectedField], itemId]
                : current[selectedField].filter((id: number) => id !== itemId),
            }))
          }
        />
        {label}
      </label>
      {checked ? (
        <input
          value={formData.attachment_captions[captionKey] || ""}
          disabled={disabled}
          onChange={(event) =>
            setFormData((current: any) => ({
              ...current,
              attachment_captions: {
                ...current.attachment_captions,
                [captionKey]: event.target.value,
              },
            }))
          }
          placeholder="Optional clinician caption"
          className="mt-2 w-full rounded border p-2 text-sm"
        />
      ) : null}
    </div>
  );
}

function EyeSection({ title, prefix, data, onChange, disabled }: any) {
  return (
    <div className="rounded-lg border bg-slate-50 p-4">
      <h3 className="mb-3 font-semibold">{title}</h3>
      <div className="grid gap-3 md:grid-cols-2">
        <SelectField label="Unaided VA" name={`${prefix}_unaided_va`} value={data[`${prefix}_unaided_va`]} onChange={onChange} options={VA_OPTIONS.map((v) => ({ value: v, label: v || "Not Recorded" }))} disabled={disabled} />
        <SelectField label="Corrected / Pinhole VA" name={`${prefix}_corrected_va`} value={data[`${prefix}_corrected_va`]} onChange={onChange} options={VA_OPTIONS.map((v) => ({ value: v, label: v || "Not Recorded" }))} disabled={disabled} />
        <SelectField label="DR Grade" name={`${prefix}_dr_grade`} value={data[`${prefix}_dr_grade`]} onChange={onChange} options={DR_GRADE_OPTIONS} disabled={disabled} />
        <SelectField label="Maculopathy Grade" name={`${prefix}_maculopathy_grade`} value={data[`${prefix}_maculopathy_grade`]} onChange={onChange} options={MACULOPATHY_OPTIONS} disabled={disabled} />
      </div>
    </div>
  );
}

function SelectField({ label, name, value, onChange, options, disabled }: any) {
  return (
    <label className="space-y-1 text-sm">
      <span className="font-medium">{label}</span>
      <select name={name} value={value} onChange={onChange} className="w-full rounded border bg-white p-3" disabled={disabled}>
        {options.map((option: any) => <option key={`${name}-${option.value}`} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}
