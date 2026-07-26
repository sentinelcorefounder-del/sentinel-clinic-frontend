"use client";

import { useEffect, useState } from "react";

import {
  createOcularInvestigation,
  decideOcularAIReview,
  deleteOcularInvestigation,
  fetchOcularAIReviews,
  fetchOcularInvestigations,
  requestOcularAIReview,
} from "@/lib/api";
import type {
  OcularAIReview,
  OcularDiagnosticAssessment,
  OcularInvestigation,
} from "@/types/encounter";

type Props = {
  encounterId: number;
  assessment?: OcularDiagnosticAssessment | null;
  fundusUploads?: Array<{
    id: number;
    eye_laterality: string;
    image_file: string;
    image_quality?: string;
  }>;
};

export default function OcularInvestigationsAIReview({
  encounterId,
  assessment,
  fundusUploads = [],
}: Props) {
  const [investigations, setInvestigations] = useState<OcularInvestigation[]>([]);
  const [reviews, setReviews] = useState<OcularAIReview[]>([]);
  const [aiPrice, setAiPrice] = useState({
    amount: "0.00",
    amount_due: "0.00",
    currency: "NGN",
    free_review_available: false,
    pricing_source: "default",
  });
  const [consent, setConsent] = useState({
    clinical_ai_review_granted: false,
    ai_training_granted: false,
    ai_training_optional: true,
  });
  const [privacyConfirmed, setPrivacyConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    investigation_type: "visual_field",
    laterality: "right",
    test_type: "",
    device_name: "",
    performed_at: "",
    reliability: "not_recorded",
    reliability_notes: "",
    interpretation: "",
  });

  async function refresh() {
    const [loadedInvestigations, loadedReviewData] = await Promise.all([
      fetchOcularInvestigations(encounterId),
      fetchOcularAIReviews(encounterId),
    ]);
    setInvestigations(loadedInvestigations);
    setReviews(loadedReviewData.reviews);
    setAiPrice(loadedReviewData.pricing);
    setConsent(loadedReviewData.consent);
  }

  useEffect(() => {
    refresh().catch((err) =>
      setError(err instanceof Error ? err.message : "Unable to load ocular investigations.")
    );
  }, [encounterId]);

  async function upload() {
    if (!file) {
      setError("Choose a PDF, JPEG, or PNG file.");
      return;
    }
    try {
      setBusy(true);
      setError("");
      setMessage("");
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value) payload.append(key, value);
      });
      payload.append("file", file);
      await createOcularInvestigation(encounterId, payload);
      setFile(null);
      const input = document.getElementById("ocular-investigation-file") as HTMLInputElement | null;
      if (input) input.value = "";
      await refresh();
      setMessage("Investigation uploaded and linked to this encounter.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    if (!window.confirm("Delete this investigation file?")) return;
    try {
      setBusy(true);
      await deleteOcularInvestigation(id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setBusy(false);
    }
  }

  async function requestReview() {
    if (!consent.clinical_ai_review_granted) {
      setError("Record granted AI Clinical Review consent before requesting the review.");
      return;
    }
    if (!privacyConfirmed) {
      setError("Confirm that all investigation files have been checked for visible identifiers.");
      return;
    }
    const confirmed = window.confirm(aiPrice.free_review_available
      ? "Use this clinic's one free Sentinel AI Clinical Review for this encounter?"
      : `Charge ${aiPrice.currency} ${Number(aiPrice.amount_due).toLocaleString()} ` +
        "to the clinic wallet for this one-time Sentinel AI Clinical Review?");
    if (!confirmed) return;
    try {
      setBusy(true);
      setError("");
      setMessage("");
      await requestOcularAIReview(encounterId, true);
      await refresh();
      setMessage("Sentinel AI Clinical Review completed. A clinician must review the result.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI review failed.");
    } finally {
      setBusy(false);
    }
  }

  async function decide(
    review: OcularAIReview,
    decision: "accepted" | "modified" | "rejected"
  ) {
    const notes =
      decision === "accepted"
        ? window.prompt("Optional clinician note:", "") || ""
        : window.prompt("Explain why the AI output is being modified or rejected:") || "";
    if (decision !== "accepted" && !notes.trim()) return;
    try {
      setBusy(true);
      await decideOcularAIReview(review.id, decision, notes);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Decision could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-6 rounded-lg border p-6">
      <div>
        <h2 className="text-xl font-semibold">Additional Ocular Investigations</h2>
        <p className="mt-1 text-sm text-gray-600">
          Upload visual-field reports, OCT, anterior-segment images and other
          investigations. Fundus photographs are uploaded once in the Fundus
          Photographs section and are automatically available here.
        </p>
      </div>

      {error ? <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="rounded bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p> : null}

      <div className="grid gap-3 rounded-lg bg-slate-50 p-4 md:grid-cols-2 lg:grid-cols-3">
        <select className="rounded border px-3 py-2" value={form.investigation_type}
          onChange={(e) => setForm({ ...form, investigation_type: e.target.value })}>
          <option value="visual_field">Visual field</option>
          <option value="oct">OCT</option>
          <option value="anterior_segment">Anterior segment</option>
          <option value="other">Other</option>
        </select>
        <select className="rounded border px-3 py-2" value={form.laterality}
          onChange={(e) => setForm({ ...form, laterality: e.target.value })}>
          <option value="right">Right eye</option>
          <option value="left">Left eye</option>
          <option value="both">Both eyes</option>
          <option value="not_applicable">Not applicable</option>
        </select>
        <input className="rounded border px-3 py-2" placeholder="Test type (e.g. 24-2 SITA Fast)"
          value={form.test_type} onChange={(e) => setForm({ ...form, test_type: e.target.value })} />
        <input className="rounded border px-3 py-2" placeholder="Device / perimeter"
          value={form.device_name} onChange={(e) => setForm({ ...form, device_name: e.target.value })} />
        <input type="datetime-local" className="rounded border px-3 py-2"
          value={form.performed_at} onChange={(e) => setForm({ ...form, performed_at: e.target.value })} />
        <select className="rounded border px-3 py-2" value={form.reliability}
          onChange={(e) => setForm({ ...form, reliability: e.target.value })}>
          <option value="not_recorded">Reliability not recorded</option>
          <option value="reliable">Reliable</option>
          <option value="borderline">Borderline</option>
          <option value="unreliable">Unreliable</option>
        </select>
        <input className="rounded border px-3 py-2 md:col-span-2" placeholder="Reliability notes / indices"
          value={form.reliability_notes} onChange={(e) => setForm({ ...form, reliability_notes: e.target.value })} />
        <textarea className="rounded border px-3 py-2 md:col-span-2 lg:col-span-3" rows={2}
          placeholder="Optometrist interpretation (optional)"
          value={form.interpretation} onChange={(e) => setForm({ ...form, interpretation: e.target.value })} />
        <input id="ocular-investigation-file" type="file" accept=".pdf,.jpg,.jpeg,.png"
          className="rounded border bg-white px-3 py-2 md:col-span-2" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <button type="button" disabled={busy} onClick={upload}
          className="rounded bg-slate-950 px-4 py-2 font-semibold text-white disabled:opacity-50">
          Upload investigation
        </button>
      </div>

      <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div>
          <h3 className="font-semibold text-blue-950">Linked Fundus Photographs</h3>
          <p className="mt-1 text-sm text-blue-900">
            These images were uploaded once above. Uploading them does not
            activate the ocular AI review or create a charge.
          </p>
        </div>
        {fundusUploads.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {fundusUploads.map((upload) => (
              <a
                key={upload.id}
                href={upload.image_file}
                target="_blank"
                rel="noreferrer"
                className="rounded border border-blue-200 bg-white p-3 text-sm text-blue-800 underline"
              >
                {upload.eye_laterality.replaceAll("_", " ")} fundus photograph
                {upload.image_quality ? ` · ${upload.image_quality}` : ""}
              </a>
            ))}
          </div>
        ) : (
          <p className="text-sm text-blue-900">
            No fundus photographs have been uploaded for this encounter.
          </p>
        )}
      </div>

      <div className="space-y-3">
        {investigations.length === 0 ? <p className="text-sm text-gray-600">No ocular investigation files uploaded.</p> :
          investigations.map((item) => (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded border p-3 text-sm">
              <div>
                <p className="font-semibold">{item.investigation_id} · {item.investigation_type.replaceAll("_", " ")}</p>
                <p>{item.laterality} · {item.test_type || "Test type not recorded"} · {item.reliability}</p>
                <a className="text-blue-700 underline" href={item.file} target="_blank" rel="noreferrer">
                  Open {item.original_filename || "file"}
                </a>
              </div>
              <button type="button" disabled={busy} onClick={() => remove(item.id)}
                className="rounded border border-red-200 px-3 py-2 text-red-700">Delete</button>
            </div>
          ))}
      </div>

      <div className="border-t pt-6">
        <h2 className="text-xl font-semibold">Sentinel AI Clinical Review</h2>
        <p className="mt-1 text-sm text-gray-600">
          Complete the optometrist assessment first. AI output is advisory and
          cannot become the final clinical conclusion without clinician review.
        </p>
        <p className="mt-2 text-sm font-semibold">
          {aiPrice.free_review_available
            ? "This clinic has one free AI Clinical Review available."
            : `Fee: ${aiPrice.currency} ${Number(aiPrice.amount_due).toLocaleString()}`}
          {" "}· one review per encounter
        </p>
        <div className="mt-4 space-y-2 rounded border bg-slate-50 p-4 text-sm">
          <p className={consent.clinical_ai_review_granted ? "text-emerald-700" : "text-red-700"}>
            AI Clinical Review consent: {consent.clinical_ai_review_granted ? "granted" : "not granted"}
          </p>
          <p>
            Optional AI training consent: {consent.ai_training_granted ? "granted" : "not granted"}
            {" "}— this does not affect access to the clinical AI review.
          </p>
          <label className="flex items-start gap-2">
            <input type="checkbox" checked={privacyConfirmed}
              onChange={(e) => setPrivacyConfirmed(e.target.checked)} className="mt-1" />
            <span>
              I have checked every selected file and confirm it contains no visible
              patient name, date of birth, patient number, contact details, or
              other identifying label.
            </span>
          </label>
          <p className="text-xs text-gray-600">
            Sentinel removes direct identifiers from clinical text, replaces file
            names and internal references, and removes image metadata before
            sending the minimum necessary information to the approved AI provider.
          </p>
        </div>
        <button type="button" disabled={busy || !assessment?.completed_at || (investigations.length === 0 && fundusUploads.length === 0) || reviews.length > 0 || !consent.clinical_ai_review_granted || !privacyConfirmed}
          onClick={requestReview} className="mt-4 rounded bg-blue-700 px-4 py-2 font-semibold text-white disabled:opacity-50">
          {busy ? "Working..." : reviews.length ? "AI Review Already Used" : "Request AI Review"}
        </button>
        {!assessment?.completed_at ? <p className="mt-2 text-xs text-amber-800">Complete and lock the ocular assessment to enable AI review.</p> : null}

        <div className="mt-5 space-y-4">
          {reviews.map((review) => (
            <article key={review.id} className={`rounded-lg border p-4 ${review.expert_review_required ? "border-amber-400 bg-amber-50" : ""}`}>
              <div className="flex flex-wrap justify-between gap-2">
                <h3 className="font-semibold">{review.review_id}</h3>
                <span className="rounded bg-white px-2 py-1 text-xs font-semibold">{review.agreement_status.replaceAll("_", " ")}</span>
              </div>
              <p className="mt-2 text-xs">
                {review.payment_status === "free"
                  ? "Clinic free review"
                  : `Charge: ${review.fee_currency} ${Number(review.fee_amount).toLocaleString()} · ${review.payment_status}`}
              </p>
              {review.encounter_changed_since_review ? (
                <p className="mt-3 rounded bg-amber-100 p-3 text-sm font-semibold text-amber-900">
                  This encounter changed after its AI review. The AI assessment
                  relates only to the clinical information captured at {new Date(review.requested_at).toLocaleString()}.
                </p>
              ) : null}
              {review.status === "failed" ? <p className="mt-3 text-sm text-red-700">{review.error_message}</p> : (
                <div className="mt-3 space-y-3 text-sm">
                  <p><strong>Suspected conditions:</strong>{" "}
                    {review.suspected_conditions.map((item) => item.label).join(", ") || "None stated"}</p>
                  <p><strong>Supporting findings:</strong> {review.supporting_findings.join("; ") || "None stated"}</p>
                  <p><strong>Differentials:</strong> {review.differential_diagnoses.join("; ") || "None stated"}</p>
                  <p><strong>Suggested urgency:</strong> {review.suggested_urgency || "Not stated"}</p>
                  <p><strong>Suggested management:</strong> {review.suggested_management || "Not stated"}</p>
                  {review.disagreement_reasons.length ? <p><strong>Disagreement:</strong> {review.disagreement_reasons.join("; ")}</p> : null}
                  {review.expert_review_required ? <p className="font-semibold text-amber-900">Flagged for expert review.</p> : null}
                  <p className="rounded bg-white p-3 text-xs">
                    AI-assisted decision support may be incomplete or incorrect.
                    A qualified eye-care professional remains responsible for the final assessment.
                  </p>
                  {review.clinician_decision === "pending" ? (
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => decide(review, "accepted")} className="rounded border px-3 py-2">Accept</button>
                      <button onClick={() => decide(review, "modified")} className="rounded border px-3 py-2">Modify</button>
                      <button onClick={() => decide(review, "rejected")} className="rounded border px-3 py-2">Reject</button>
                    </div>
                  ) : <p><strong>Clinician decision:</strong> {review.clinician_decision} {review.clinician_decision_notes ? `— ${review.clinician_decision_notes}` : ""}</p>}
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
