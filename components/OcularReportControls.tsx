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

  async function save() {
    try {
      setSaving(true);
      setError("");
      setMessage("");
      const saved = await updateOcularAssessment(encounterId, form);
      onSaved(saved);
      setMessage("Ocular report configuration saved.");
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
          Clinical findings remain in the ocular clinical record. Configure the printable report and supporting investigations here.
        </p>
      </div>

      <div className="rounded-lg border bg-slate-50 p-4">
        <p className="font-medium">Report content</p>
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
        <button type="button" disabled={saving} onClick={() => void save()} className="rounded-lg border px-4 py-2 font-semibold disabled:opacity-50">
          {saving ? "Saving..." : "Save report configuration"}
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
