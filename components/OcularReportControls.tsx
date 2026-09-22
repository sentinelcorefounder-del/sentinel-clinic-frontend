"use client";

import { useEffect, useState } from "react";

import { getOcularAssessmentPdfUrl, updateOcularAssessment } from "@/lib/api";
import type { OcularDiagnosticAssessment, OcularInvestigation } from "@/types/encounter";
import type { ImageUpload } from "@/types/upload";

type Props = {
  encounterId: number;
  assessment: OcularDiagnosticAssessment | null | undefined;
  onSaved: (assessment: OcularDiagnosticAssessment) => void;
  fundusUploads?: ImageUpload[];
  ocularInvestigations?: OcularInvestigation[];
};

export default function OcularReportControls({
  encounterId,
  assessment,
  onSaved,
  fundusUploads = [],
  ocularInvestigations = [],
}: Props) {
  const [form, setForm] = useState({
    presenting_complaint: assessment?.presenting_complaint || "",
    ocular_history: assessment?.ocular_history || "",
    anterior_eye_findings: assessment?.anterior_eye_findings || "",
    fundus_findings: assessment?.fundus_findings || "",
    visual_field_summary: assessment?.visual_field_summary || "",
    tonometry_summary: assessment?.tonometry_summary || "",
    impression: assessment?.impression || "",
    management_plan: assessment?.management_plan || "",
    management_outcome: assessment?.management_outcome || "",
    report_layout: assessment?.report_layout || "text_only",
    selected_fundus_upload_ids: assessment?.selected_fundus_upload_ids || [],
    selected_ocular_investigation_ids: assessment?.selected_ocular_investigation_ids || [],
    attachment_captions: assessment?.attachment_captions || {},
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setForm({
      presenting_complaint: assessment?.presenting_complaint || "",
      ocular_history: assessment?.ocular_history || "",
      anterior_eye_findings: assessment?.anterior_eye_findings || "",
      fundus_findings: assessment?.fundus_findings || "",
      visual_field_summary: assessment?.visual_field_summary || "",
      tonometry_summary: assessment?.tonometry_summary || "",
      impression: assessment?.impression || "",
      management_plan: assessment?.management_plan || "",
      management_outcome: assessment?.management_outcome || "",
      report_layout: assessment?.report_layout || "text_only",
      selected_fundus_upload_ids: assessment?.selected_fundus_upload_ids || [],
      selected_ocular_investigation_ids: assessment?.selected_ocular_investigation_ids || [],
      attachment_captions: assessment?.attachment_captions || {},
    });
  }, [assessment]);

  if (!assessment) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Save the Comprehensive Ocular Assessment clinical record before configuring its report.
      </div>
    );
  }

  const reportLocked = ["awaiting_ops", "issued", "ops_approved"].includes(assessment.report_status || "");

  async function save() {
    try {
      setSaving(true);
      setError("");
      setMessage("");
      const saved = await updateOcularAssessment(encounterId, form);
      onSaved(saved);
      setMessage("Comprehensive ocular report saved.");
    } catch (value) {
      setError(value instanceof Error ? value.message : "Unable to save ocular report configuration.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Comprehensive Ocular Assessment report</h3>
        <p className="mt-1 text-sm text-slate-600">
          Compose the clinician-facing ocular report here. These fields use the same clinical record that is preserved in the signed immutable report version.
        </p>
      </div>

      {assessment.report_status ? <div className={`rounded-lg border p-4 text-sm ${assessment.report_status === "awaiting_ops" ? "border-blue-200 bg-blue-50 text-blue-950" : assessment.report_status === "returned_to_clinic" ? "border-amber-200 bg-amber-50 text-amber-950" : assessment.report_status === "issued" ? "border-emerald-200 bg-emerald-50 text-emerald-950" : "bg-slate-50"}`}><strong>Report workflow:</strong> {assessment.report_status.replaceAll("_", " ")}{assessment.report_status === "awaiting_ops" ? " — signed by the clinician and awaiting Sentinel Ops review." : assessment.report_status === "returned_to_clinic" ? " — returned for clinician correction." : assessment.report_status === "issued" ? " — clinically issued." : ""}{assessment.ops_review_note ? <p className="mt-2"><strong>Ops note:</strong> {assessment.ops_review_note}</p> : null}</div> : null}

      <div className="rounded-lg border bg-white p-4">
        <h4 className="font-semibold">Clinical report composer</h4>
        <p className="mt-1 text-sm text-slate-600">Record the findings and professional impression that should appear in the Comprehensive Ocular Assessment report.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {([
            ["presenting_complaint", "Presenting complaint / reason for assessment"],
            ["ocular_history", "Relevant ocular history"],
            ["anterior_eye_findings", "Anterior segment findings"],
            ["fundus_findings", "Posterior segment / fundus findings"],
            ["visual_field_summary", "Visual-field findings"],
            ["tonometry_summary", "Intraocular pressure / tonometry findings"],
            ["impression", "Clinical impression / assessment"],
            ["management_plan", "Management, recommendations and referral plan"],
          ] as const).map(([field, label]) => (
            <label key={field} className={field === "impression" || field === "management_plan" ? "md:col-span-2" : ""}>
              <span className="text-sm font-medium">{label}</span>
              <textarea rows={3} disabled={reportLocked} value={form[field]} onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))} className="mt-1 w-full rounded border px-3 py-2 text-sm" />
            </label>
          ))}
          <label className="md:col-span-2">
            <span className="text-sm font-medium">Outcome / urgency</span>
            <select disabled={reportLocked} value={form.management_outcome} onChange={(event) => setForm((current) => ({ ...current, management_outcome: event.target.value }))} className="mt-1 w-full rounded border px-3 py-2 text-sm">
              <option value="">Select outcome</option>
              <option value="routine">Routine care</option>
              <option value="monitor">Monitor / review</option>
              <option value="refer_routine">Routine referral</option>
              <option value="refer_urgent">Urgent referral</option>
              <option value="refer_emergency">Emergency referral</option>
            </select>
          </label>
        </div>
      </div>

      <div className="rounded-lg border bg-slate-50 p-4">
        <p className="font-medium">Report content</p>
        <div className="mt-3 flex flex-wrap gap-5">
          {(["text_only", "with_investigations"] as const).map((layout) => (
            <label key={layout} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                disabled={reportLocked}
                checked={form.report_layout === layout}
                onChange={() => setForm((current) => ({
                  ...current,
                  report_layout: layout,
                  ...(layout === "text_only" ? {
                    selected_fundus_upload_ids: [],
                    selected_ocular_investigation_ids: [],
                  } : {}),
                }))}
              />
              {layout === "text_only" ? "Text only" : "Include selected investigations"}
            </label>
          ))}
        </div>

        {form.report_layout === "with_investigations" ? (
          <div className="mt-4 space-y-3">
            {[
              ...fundusUploads.map((item) => ({ id: item.id, kind: "fundus" as const, label: `Fundus photograph — ${item.eye_laterality}` })),
              ...ocularInvestigations.map((item) => ({ id: item.id, kind: "investigation" as const, label: `${item.investigation_type.replaceAll("_", " ")} — ${item.laterality}` })),
            ].map((item) => {
              const field = item.kind === "fundus" ? "selected_fundus_upload_ids" : "selected_ocular_investigation_ids";
              const selected = form[field].includes(item.id);
              const captionKey = `${item.kind}:${item.id}`;
              return (
                <div key={captionKey} className="rounded border bg-white p-3">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      disabled={reportLocked}
                      checked={selected}
                      onChange={(event) => setForm((current) => ({
                        ...current,
                        [field]: event.target.checked ? [...current[field], item.id] : current[field].filter((id) => id !== item.id),
                      }))}
                    />
                    {item.label}
                  </label>
                  {selected ? (
                    <input
                      disabled={reportLocked}
                      value={form.attachment_captions[captionKey] || ""}
                      onChange={(event) => setForm((current) => ({
                        ...current,
                        attachment_captions: { ...current.attachment_captions, [captionKey]: event.target.value },
                      }))}
                      placeholder="Optional clinician caption"
                      className="mt-2 w-full rounded border px-3 py-2 text-sm"
                    />
                  ) : null}
                </div>
              );
            })}
            {!fundusUploads.length && !ocularInvestigations.length ? (
              <p className="text-sm text-slate-500">No supporting files have been uploaded.</p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={saving || reportLocked} onClick={() => void save()} className="rounded-lg border px-4 py-2 font-semibold disabled:opacity-50">
          {saving ? "Saving..." : "Save report"}
        </button>
        <button
          type="button"
          onClick={() => window.open(getOcularAssessmentPdfUrl(encounterId), "_blank", "noopener,noreferrer")}
          className="rounded-lg border border-blue-700 px-4 py-2 font-semibold text-blue-700"
        >
          {assessment.completed_at ? "Open current report PDF" : "Preview draft report PDF"}
        </button>
      </div>
      {message ? <p className="rounded bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p> : null}
      {error ? <p className="rounded bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}
    </div>
  );
}
