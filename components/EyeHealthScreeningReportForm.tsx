"use client";

import { useEffect, useState } from "react";
import {
  fetchEyeHealthReport, finalizeEyeHealthReport, previewEyeHealthReport,
  saveEyeHealthReport, startEyeHealthReportCorrection,
} from "@/lib/api";
import type { EyeHealthScreeningReport } from "@/types/report";
import type { OcularInvestigation } from "@/types/encounter";
import type { ImageUpload } from "@/types/upload";

const outcomes = [
  ["no_immediate_concern", "No immediate concern identified"],
  ["routine_eye_examination", "Routine eye examination advised"],
  ["further_assessment", "Further assessment recommended"],
  ["urgent_ophthalmology", "Urgent ophthalmology assessment recommended"],
  ["inconclusive_repeat", "Inconclusive — repeat testing required"],
];
const suggestions = [
  "Arrange a routine comprehensive eye examination.",
  "Continue routine eye care and seek advice if symptoms develop.",
  "Further clinical assessment is recommended.",
  "Repeat screening is recommended because the available result was inconclusive.",
  "Seek urgent ophthalmology assessment as advised by the clinician.",
];

const blank = {
  outcome: "", selected_advice: [] as string[], advice: "",
  right_visual_field_result: "", left_visual_field_result: "",
  right_fundus_result: "", left_fundus_result: "",
  selected_fundus_upload_ids: [] as number[],
  selected_visual_field_investigation_ids: [] as number[],
};

export default function EyeHealthScreeningReportForm({ encounterId, uploads, investigations, canEdit, combined }: {
  encounterId: number; uploads: ImageUpload[]; investigations: OcularInvestigation[]; canEdit: boolean; combined: boolean;
}) {
  const [report, setReport] = useState<EyeHealthScreeningReport | null>(null);
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [signoff, setSignoff] = useState(false);

  useEffect(() => { void fetchEyeHealthReport(encounterId).then((value) => {
    setReport(value); if (value) setForm({
      outcome: value.outcome, selected_advice: value.selected_advice || [], advice: value.advice || "",
      right_visual_field_result: value.right_visual_field_result || "", left_visual_field_result: value.left_visual_field_result || "",
      right_fundus_result: value.right_fundus_result || "", left_fundus_result: value.left_fundus_result || "",
      selected_fundus_upload_ids: value.selected_fundus_upload_ids || [],
      selected_visual_field_investigation_ids: value.selected_visual_field_investigation_ids || [],
    });
  }).catch((value) => setError(value instanceof Error ? value.message : "Unable to load report.")); }, [encounterId]);

  function toggle(field: "selected_fundus_upload_ids" | "selected_visual_field_investigation_ids", id: number) {
    setForm((current) => ({ ...current, [field]: current[field].includes(id) ? current[field].filter((value) => value !== id) : [...current[field], id] }));
  }
  async function save() {
    setBusy(true); setError(""); setMessage("");
    try { const value = await saveEyeHealthReport(encounterId, form, report?.lock_version); setReport(value); setMessage("Draft saved."); return value; }
    catch (value) { setError(value instanceof Error ? value.message : "Save failed."); return null; }
    finally { setBusy(false); }
  }
  async function preview() {
    const current = await save();
    if (!current) return;
    setBusy(true); setError("");
    try { const blob = await previewEyeHealthReport(current.id); const url = URL.createObjectURL(blob); window.open(url, "_blank", "noopener,noreferrer"); setTimeout(() => URL.revokeObjectURL(url), 60000); setReport(await fetchEyeHealthReport(encounterId)); }
    catch (value) { setError(value instanceof Error ? value.message : "Preview failed."); }
    finally { setBusy(false); }
  }
  async function finalize() {
    if (!report || !signoff) return setError("Confirm clinician sign-off after reviewing the preview.");
    setBusy(true); setError("");
    try { const value = await finalizeEyeHealthReport(report.id, report.lock_version); setReport(value); setMessage("Eye Health Screening Report finalized."); }
    catch (value) { setError(value instanceof Error ? value.message : "Finalization failed."); }
    finally { setBusy(false); }
  }
  async function startCorrection() {
    const reason = window.prompt("Enter the required clinical correction reason:", "")?.trim();
    if (!report || !reason) return;
    setBusy(true); setError("");
    try { setReport(await startEyeHealthReportCorrection(report.id, reason)); setSignoff(false); setMessage("Correction draft opened. The prior finalized version remains immutable."); }
    catch (value) { setError(value instanceof Error ? value.message : "Correction could not be started."); }
    finally { setBusy(false); }
  }
  const locked = report?.status === "finalized" || !canEdit;
  const visualFields = investigations.filter((item) => item.investigation_type === "visual_field" && item.original_filename.toLowerCase().endsWith(".pdf"));
  return <div className="space-y-4">
    <p className="text-sm text-slate-600">Patient-facing targeted screening report. Measurements and files never determine the clinician-confirmed outcome automatically.</p>
    {!report?.professional_defaults && <p className="rounded border border-amber-300 bg-amber-50 p-3 text-sm">A verified professional profile is required before preview and sign-off.</p>}
    <label className="block text-sm font-medium">Outcome<select disabled={locked} value={form.outcome} onChange={(event) => setForm({...form, outcome: event.target.value})} className="mt-1 w-full rounded border p-2"><option value="">Select clinician-confirmed outcome</option>{outcomes.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    <fieldset disabled={locked} className="space-y-2"><legend className="text-sm font-medium">Suggested advice</legend>{suggestions.map((item) => <label key={item} className="flex gap-2 text-sm"><input type="checkbox" checked={form.selected_advice.includes(item)} onChange={(event) => setForm((current) => ({...current, selected_advice: event.target.checked ? [...current.selected_advice, item] : current.selected_advice.filter((value) => value !== item), advice: event.target.checked ? [current.advice, item].filter(Boolean).join("\n") : current.advice}))}/>{item}</label>)}</fieldset>
    <label className="block text-sm font-medium">Editable final advice<textarea disabled={locked} value={form.advice} onChange={(event) => setForm({...form, advice: event.target.value})} rows={4} className="mt-1 w-full rounded border p-2" /></label>
    <div className="grid gap-3 md:grid-cols-2">{(["right", "left"] as const).map((eye) => <div key={eye} className="space-y-2 rounded border p-3"><h4 className="font-semibold capitalize">{eye} eye</h4><textarea disabled={locked} value={form[`${eye}_visual_field_result`]} onChange={(event) => setForm({...form, [`${eye}_visual_field_result`]: event.target.value})} placeholder="Clinician-confirmed visual-field result" className="w-full rounded border p-2"/><textarea disabled={locked} value={form[`${eye}_fundus_result`]} onChange={(event) => setForm({...form, [`${eye}_fundus_result`]: event.target.value})} placeholder="Clinician-confirmed fundus result" className="w-full rounded border p-2"/></div>)}</div>
    <fieldset disabled={locked} className="space-y-2"><legend className="font-medium">Selected fundus images</legend>{uploads.map((item) => <label key={item.id} className="flex gap-2 text-sm"><input type="checkbox" checked={form.selected_fundus_upload_ids.includes(item.id)} onChange={() => toggle("selected_fundus_upload_ids", item.id)}/>{item.eye_laterality} eye · image {item.id}</label>)}{!uploads.length && <p className="text-sm text-slate-500">No fundus images available.</p>}</fieldset>
    <fieldset disabled={locked} className="space-y-2"><legend className="font-medium">Visual-field PDF attachments (order selected)</legend>{visualFields.map((item) => <label key={item.id} className="flex gap-2 text-sm"><input type="checkbox" checked={form.selected_visual_field_investigation_ids.includes(item.id)} onChange={() => toggle("selected_visual_field_investigation_ids", item.id)}/>{item.laterality} · {item.test_type || item.original_filename}</label>)}{!visualFields.length && <p className="text-sm text-slate-500">No eligible visual-field PDFs available.</p>}</fieldset>
    {report?.professional_defaults && <p className="rounded bg-slate-50 p-3 text-sm"><strong>Sign-off:</strong> {report.professional_defaults.display_name} · {report.professional_defaults.professional_role} · {report.professional_defaults.registration_number}</p>}
    {report?.status !== "finalized" && canEdit && <><div className="flex flex-wrap gap-2"><button disabled={busy} onClick={() => void save()} className="rounded border px-4 py-2 font-semibold">Save draft</button><button disabled={busy} onClick={() => void preview()} className="rounded bg-slate-800 px-4 py-2 font-semibold text-white">Preview PDF</button></div><label className="flex gap-2 text-sm"><input type="checkbox" checked={signoff} onChange={(event) => setSignoff(event.target.checked)}/>I confirm the professional sign-off after reviewing the current preview.</label><button disabled={busy || !signoff || !report?.previewed_at} onClick={() => void finalize()} className="rounded bg-blue-700 px-4 py-2 font-semibold text-white disabled:opacity-50">Finalize immutable report</button></>}
    {report?.status === "finalized" && <div className="flex flex-wrap gap-2"><a href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/reports/eye-health/${report.id}/pdf/`} target="_blank" rel="noreferrer" className="inline-block rounded bg-blue-700 px-4 py-2 font-semibold text-white">Open finalized report</a>{combined && <a href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/reports/eye-health/combined/${encounterId}/bundle/`} target="_blank" rel="noreferrer" className="inline-block rounded border px-4 py-2 font-semibold">Open combined bundle</a>}{canEdit && <button type="button" disabled={busy} onClick={() => void startCorrection()} className="rounded border px-4 py-2 font-semibold">Start controlled correction</button>}</div>}
    {message && <p className="rounded bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}{error && <p className="rounded bg-red-50 p-3 text-sm text-red-800">{error}</p>}
  </div>;
}
