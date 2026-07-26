"use client";

import { useState } from "react";

import { getOcularAssessmentPdfUrl, updateOcularAssessment } from "@/lib/api";
import type { OcularDiagnosticAssessment, OcularInvestigation } from "@/types/encounter";
import type { ImageUpload } from "@/types/upload";

type Props = {
  encounterId: number;
  initial: OcularDiagnosticAssessment | null | undefined;
  onSaved: (assessment: OcularDiagnosticAssessment) => void;
  fundusUploads?: ImageUpload[];
  ocularInvestigations?: OcularInvestigation[];
};

const emptyAssessment = {
  fundus_photography_performed: false,
  visual_field_performed: false,
  tonometry_performed: false,
  visual_acuity_performed: true,
  anterior_eye_assessment_performed: false,
  presenting_complaint: "",
  ocular_history: "",
  anterior_eye_findings: "",
  fundus_findings: "",
  visual_field_summary: "",
  tonometry_summary: "",
  impression: "",
  management_plan: "",
  management_outcome: "",
  report_layout: "text_only" as "text_only" | "with_investigations",
  selected_fundus_upload_ids: [] as number[],
  selected_ocular_investigation_ids: [] as number[],
  attachment_captions: {} as Record<string, string>,
  completed_at: null as string | null,
};

export default function OcularAssessmentForm({
  encounterId,
  initial,
  onSaved,
  fundusUploads = [],
  ocularInvestigations = [],
}: Props) {
  const [form, setForm] = useState({ ...emptyAssessment, ...(initial || {}) });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function setField(field: string, value: string | boolean) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function save(markComplete = false) {
    try {
      setSaving(true);
      setError("");
      setMessage("");
      if (markComplete && (!form.impression.trim() || !form.management_plan.trim())) {
        throw new Error(
          "Clinical impression and management plan are required before completion."
        );
      }
      const saved = await updateOcularAssessment(encounterId, {
        ...form,
        mark_complete: markComplete,
      });
      setForm((current) => ({ ...current, ...saved }));
      onSaved(saved);
      setMessage(markComplete ? "Ocular assessment completed." : "Ocular assessment saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save assessment.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-lg border p-6">
      <h2 className="text-xl font-semibold">General Ocular Clinical Record</h2>
      <p className="mt-1 text-sm text-gray-600">
        Clinic-owned findings for general ocular care. This record is separate
        from diabetic grading and the hospital report-release queue.
      </p>

      {error ? <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="mt-4 rounded bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p> : null}

      <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {[
          ["visual_acuity_performed", "Visual acuity"],
          ["tonometry_performed", "Tonometry / IOP"],
          ["fundus_photography_performed", "Fundus photography"],
          ["visual_field_performed", "Visual fields"],
          ["anterior_eye_assessment_performed", "Anterior eye assessment"],
        ].map(([field, label]) => (
          <label key={field} className="flex items-center gap-2 rounded border p-3 text-sm">
            <input
              type="checkbox"
              checked={Boolean((form as any)[field])}
              onChange={(event) => setField(field, event.target.checked)}
            />
            {label}
          </label>
        ))}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {[
          ["presenting_complaint", "Presenting complaint"],
          ["ocular_history", "Ocular and relevant medical history"],
          ["anterior_eye_findings", "Anterior eye findings"],
          ["fundus_findings", "Fundus findings"],
          ["visual_field_summary", "Visual field result / interpretation"],
          ["tonometry_summary", "Tonometry interpretation"],
          ["impression", "Clinical impression / diagnosis"],
          ["management_plan", "Management and referral plan"],
        ].map(([field, label]) => (
          <label key={field} className="space-y-1">
            <span className="text-sm font-medium">{label}</span>
            <textarea
              rows={3}
              value={String((form as any)[field] || "")}
              onChange={(event) => setField(field, event.target.value)}
              className="w-full rounded-lg border px-3 py-2"
            />
          </label>
        ))}

        <label className="space-y-1">
          <span className="text-sm font-medium">Outcome</span>
          <select
            value={form.management_outcome}
            onChange={(event) => setField("management_outcome", event.target.value)}
            className="w-full rounded-lg border px-3 py-2"
          >
            <option value="">Select outcome</option>
            <option value="routine">Routine care</option>
            <option value="monitor">Monitor / review</option>
            <option value="refer_routine">Routine referral</option>
            <option value="refer_urgent">Urgent referral</option>
            <option value="refer_emergency">Emergency referral</option>
          </select>
        </label>
      </div>

      <section className="mt-5 rounded-lg border bg-slate-50 p-4">
        <h3 className="font-semibold">Printable Report Content</h3>
        <p className="mt-1 text-sm text-slate-600">
          Choose a text-only report or the exact images and investigations to add after the clinical page.
        </p>
        <div className="mt-3 flex flex-wrap gap-5">
          {(["text_only", "with_investigations"] as const).map((layout) => (
            <label key={layout} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
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
              ...fundusUploads.map((item) => ({
                id: item.id,
                kind: "fundus" as const,
                label: `Fundus photograph — ${item.eye_laterality}`,
              })),
              ...ocularInvestigations.map((item) => ({
                id: item.id,
                kind: "investigation" as const,
                label: `${item.investigation_type.replaceAll("_", " ")} — ${item.laterality}`,
              })),
            ].map((item) => {
              const field = item.kind === "fundus"
                ? "selected_fundus_upload_ids"
                : "selected_ocular_investigation_ids";
              const selected = form[field].includes(item.id);
              const captionKey = `${item.kind}:${item.id}`;
              return (
                <div key={captionKey} className="rounded border bg-white p-3">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={(event) => setForm((current) => ({
                        ...current,
                        [field]: event.target.checked
                          ? [...current[field], item.id]
                          : current[field].filter((id) => id !== item.id),
                      }))}
                    />
                    {item.label}
                  </label>
                  {selected ? (
                    <input
                      value={form.attachment_captions[captionKey] || ""}
                      onChange={(event) => setForm((current) => ({
                        ...current,
                        attachment_captions: {
                          ...current.attachment_captions,
                          [captionKey]: event.target.value,
                        },
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
      </section>

      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" disabled={saving} onClick={() => save(false)} className="rounded-lg border px-4 py-2 font-semibold disabled:opacity-50">
          Save draft
        </button>
        <button type="button" disabled={saving} onClick={() => save(true)} className="rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white disabled:opacity-50">
          Complete ocular assessment
        </button>
        {initial?.id ? (
          <button
            type="button"
            onClick={() => window.open(getOcularAssessmentPdfUrl(encounterId), "_blank", "noopener,noreferrer")}
            className="rounded-lg border border-blue-700 px-4 py-2 font-semibold text-blue-700"
          >
            {form.completed_at ? "Open final PDF" : "Preview draft PDF"}
          </button>
        ) : null}
        {initial?.completed_at ? (
          <span className="self-center text-sm text-emerald-700">
            Completed {new Date(initial.completed_at).toLocaleString()}
          </span>
        ) : null}
      </div>
    </section>
  );
}
