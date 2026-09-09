"use client";

import { useEffect, useMemo, useState } from "react";

import EyeHealthScreeningReportForm from "@/components/EyeHealthScreeningReportForm";
import OcularReportControls from "@/components/OcularReportControls";
import ReportForm from "@/components/ReportForm";
import type { Encounter, OcularInvestigation } from "@/types/encounter";
import type { ImageUpload } from "@/types/upload";
import type { StructuredReport } from "@/types/report";

type ReportKind = "diabetic" | "eye_health" | "ocular";

type Props = {
  encounter: Encounter & Record<string, unknown>;
  patientConsentStatus: string;
  uploads: ImageUpload[];
  ocularInvestigations: OcularInvestigation[];
  reports: StructuredReport[];
  canEdit: boolean;
  includesDiabetic: boolean;
  includesEyeHealth: boolean;
  isComprehensiveOcular: boolean;
  onReportSaved: () => Promise<void> | void;
  onOcularAssessmentSaved: (assessment: NonNullable<Encounter["ocular_assessment"]>) => void;
};

function human(value?: string | null) {
  return value ? value.replaceAll("_", " ") : "-";
}

export default function ClinicalReportWorkspace({
  encounter,
  patientConsentStatus,
  uploads,
  ocularInvestigations,
  reports,
  canEdit,
  includesDiabetic,
  includesEyeHealth,
  isComprehensiveOcular,
  onReportSaved,
  onOcularAssessmentSaved,
}: Props) {
  const available = useMemo<Array<{ key: ReportKind; label: string }>>(() => {
    const value: Array<{ key: ReportKind; label: string }> = [];
    if (includesDiabetic) value.push({ key: "diabetic", label: "Diabetic Retinal Assessment" });
    if (includesEyeHealth) value.push({ key: "eye_health", label: "Targeted Retinal & Glaucoma-Risk" });
    if (isComprehensiveOcular) value.push({ key: "ocular", label: "Comprehensive Ocular Assessment" });
    return value;
  }, [includesDiabetic, includesEyeHealth, isComprehensiveOcular]);

  const [selected, setSelected] = useState<ReportKind>(available[0]?.key || "diabetic");
  useEffect(() => {
    if (!available.some((item) => item.key === selected) && available[0]) setSelected(available[0].key);
  }, [available, selected]);

  const hospitalReferred = Boolean(
    encounter.source_type === "hospital_referral" || encounter.hospital_referral
  );
  const diabeticReport = reports[0] || null;

  if (!available.length) {
    return <p className="text-sm text-slate-600">No active clinical report portfolio is configured for this encounter.</p>;
  }

  return (
    <div className="space-y-5">
      <div className={`rounded-lg border p-4 text-sm ${hospitalReferred ? "border-blue-200 bg-blue-50 text-blue-950" : "border-emerald-200 bg-emerald-50 text-emerald-950"}`}>
        <p className="font-semibold">Required report lifecycle</p>
        <p className="mt-1">
          {hospitalReferred
            ? "Clinician completes and signs the report → Sentinel Ops reviews/approves → controlled release to the referring hospital."
            : "Clinician completes and signs the report → issue to the clinic/patient workflow. Sentinel Ops review is not routinely required for a clinic-direct patient."}
        </p>
        <p className="mt-2 text-xs opacity-80">
          Report workflow is clinical governance only. This workspace does not introduce a new charging trigger.
        </p>
      </div>

      <div className="rounded-lg border bg-slate-50 p-4">
        <label className="block text-sm font-medium text-slate-800">
          Report portfolio
          <select
            value={selected}
            onChange={(event) => setSelected(event.target.value as ReportKind)}
            className="mt-1 w-full rounded border bg-white px-3 py-2 md:max-w-xl"
          >
            {available.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
          </select>
        </label>
        {available.length > 1 ? (
          <p className="mt-2 text-xs text-slate-600">This encounter supports more than one clinical report component. Use this selector instead of separate report sections.</p>
        ) : null}
      </div>

      {selected === "diabetic" ? (
        <div className="space-y-5">
          <ReportForm
            encounterId={encounter.id}
            patientId={encounter.patient}
            patientConsentStatus={patientConsentStatus || "pending"}
            workflowRoute={(encounter.workflow_route as "clinic_managed" | "sentinel_managed") || "sentinel_managed"}
            encounter={{
              left_unaided_va: typeof encounter.left_unaided_va === "string" ? encounter.left_unaided_va : undefined,
              right_unaided_va: typeof encounter.right_unaided_va === "string" ? encounter.right_unaided_va : undefined,
              left_corrected_pinhole_va: typeof encounter.left_corrected_pinhole_va === "string" ? encounter.left_corrected_pinhole_va : undefined,
              right_corrected_pinhole_va: typeof encounter.right_corrected_pinhole_va === "string" ? encounter.right_corrected_pinhole_va : undefined,
              poor_va_flag: typeof encounter.poor_va_flag === "boolean" ? encounter.poor_va_flag : undefined,
              poor_va_reason: typeof encounter.poor_va_reason === "string" ? encounter.poor_va_reason : undefined,
            }}
            existingReport={diabeticReport}
            onReportSaved={onReportSaved}
            programme={encounter.programme}
            fundusUploads={uploads}
            ocularInvestigations={ocularInvestigations}
          />
          <details className="rounded-lg border bg-white p-4">
            <summary className="cursor-pointer font-semibold">Report history / versions ({reports.length})</summary>
            <div className="mt-4 space-y-3">
              {!reports.length ? <p className="text-sm text-slate-600">No diabetic structured report has been created yet.</p> : reports.map((report) => (
                <div key={report.id} className="rounded border bg-slate-50 p-3 text-sm">
                  <p><strong>Report ID:</strong> {report.report_id}</p>
                  <p><strong>Status:</strong> {human(report.report_status)}</p>
                  <p><strong>Review date:</strong> {report.review_date || "-"}</p>
                  <p><strong>Urgency:</strong> {human(report.urgency_outcome)}</p>
                  {report.return_reason || report.ops_review_note ? (
                    <div className="mt-2 rounded border border-amber-200 bg-amber-50 p-3 text-amber-900">
                      <p className="font-semibold">Sentinel Ops review note</p>
                      <p>{report.return_reason || report.ops_review_note}</p>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </details>
        </div>
      ) : null}

      {selected === "eye_health" ? (
        <EyeHealthScreeningReportForm
          encounterId={encounter.id}
          uploads={uploads}
          investigations={ocularInvestigations}
          canEdit={canEdit}
          combined={encounter.service_package === "combined_diabetic_eye_health"}
        />
      ) : null}

      {selected === "ocular" ? (
        <OcularReportControls
          encounterId={encounter.id}
          assessment={encounter.ocular_assessment}
          onSaved={onOcularAssessmentSaved}
          fundusUploads={uploads}
          ocularInvestigations={ocularInvestigations}
        />
      ) : null}
    </div>
  );
}
