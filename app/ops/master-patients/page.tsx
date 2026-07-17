"use client";

import { useEffect, useMemo, useState } from "react";
import { decideOpsIdentityReview, fetchOpsIdentityReviews } from "@/lib/api";

export default function OpsMasterPatientsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError("");
      setReviews(await fetchOpsIdentityReviews());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load identity reviews.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return reviews;
    return reviews.filter((review) => [
      review.candidate_patient_name,
      review.candidate_patient_id,
      review.possible_master_patient_display,
      ...(review.match_reasons || []),
    ].some((value) => String(value || "").toLowerCase().includes(term)));
  }, [reviews, search]);

  async function decide(review: any, decision: "link" | "keep_separate") {
    const note = window.prompt(
      decision === "link" ? "Reason for linking these records:" : "Reason for keeping these records separate:"
    ) || "";
    if (!note.trim()) return;

    try {
      setBusyId(review.id);
      setMessage("");
      setError("");
      await decideOpsIdentityReview(review.id, decision, note);
      setMessage("Identity review completed.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete identity review.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Sentinel Master Patient Identity</p>
        <h1 className="mt-1 text-3xl font-bold">Master Patient Index</h1>
        <p className="mt-1 text-slate-600">
          Review possible duplicates before linking local patient records to a permanent Sentinel Patient ID.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Pending identity reviews</p>
          <p className="mt-1 text-2xl font-bold">{reviews.length}</p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Identifier format</p>
          <p className="mt-1 font-mono text-lg font-bold">SNT-PAT-00000000</p>
        </div>
      </div>

      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search patient name, local ID or Sentinel Patient ID"
        className="w-full rounded-xl border bg-white px-4 py-3 shadow-sm"
      />

      {message ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</div> : null}
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div> : null}

      <section className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        {loading ? <p className="p-6">Loading identity reviews...</p> : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-3">Candidate local record</th>
                <th className="p-3">Possible Sentinel identity</th>
                <th className="p-3">Match</th>
                <th className="p-3">Reasons</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!filtered.length ? (
                <tr><td colSpan={5} className="p-6 text-slate-500">No possible duplicates match this view.</td></tr>
              ) : filtered.map((review) => (
                <tr key={review.id} className="border-t align-top">
                  <td className="p-3">
                    <p className="font-semibold">{review.candidate_patient_name}</p>
                    <p className="mt-1 text-xs text-slate-500">Local patient ID</p>
                    <p className="font-mono text-xs text-slate-700">{review.candidate_patient_id}</p>
                  </td>
                  <td className="p-3">
                    <p className="text-xs text-slate-500">Sentinel Patient ID</p>
                    <p className="mt-1 font-mono font-semibold text-blue-800">{review.possible_master_patient_display}</p>
                  </td>
                  <td className="p-3">
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">{review.match_score}%</span>
                  </td>
                  <td className="p-3">{(review.match_reasons || []).join(", ") || "—"}</td>
                  <td className="p-3">
                    <div className="flex min-w-[220px] gap-2">
                      <button type="button" disabled={busyId === review.id} onClick={() => decide(review, "link")} className="rounded bg-emerald-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Link records</button>
                      <button type="button" disabled={busyId === review.id} onClick={() => decide(review, "keep_separate")} className="rounded border px-3 py-2 text-xs font-semibold disabled:opacity-50">Keep separate</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
