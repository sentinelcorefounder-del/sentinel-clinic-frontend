"use client";
/* eslint-disable @next/next/no-img-element -- protected authenticated previews must not use the image optimizer */

import { useEffect, useState } from "react";
import {
  bulkImportPreviewUrl,
  confirmBulkImageImport,
  createBulkImageImport,
  fetchBulkImportSessions,
  resolveBulkImportGroup,
  searchBulkImportEncounters,
  type BulkImport,
  type BulkImportSession,
} from "@/lib/api";

export default function RemidioBulkImport() {
  const [sessions, setSessions] = useState<BulkImportSession[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [archive, setArchive] = useState<File | null>(null);
  const [current, setCurrent] = useState<BulkImport | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [queries, setQueries] = useState<Record<string, string>>({});
  const [matches, setMatches] = useState<Record<string, Array<{ id: number; encounter_id: string; patient_name: string; sentinel_patient_id: string }>>>({});

  useEffect(() => { void fetchBulkImportSessions().then(setSessions).catch((value) => setError(value instanceof Error ? value.message : "Failed to load sessions.")); }, []);
  const selected = sessions.find((item) => String(item.id) === sessionId);

  async function upload() {
    if (!selected || !archive) return;
    setBusy(true); setError("");
    try { setCurrent(await createBulkImageImport(selected, archive)); }
    catch (value) { setError(value instanceof Error ? value.message : "Import failed."); }
    finally { setBusy(false); }
  }

  async function decide(groupId: string, itemId: string, decision: string) {
    if (!current) return;
    setBusy(true); setError("");
    try { setCurrent(await resolveBulkImportGroup(current.import_id, groupId, undefined, { [itemId]: decision })); }
    catch (value) { setError(value instanceof Error ? value.message : "Decision failed."); }
    finally { setBusy(false); }
  }

  async function search(groupId: string) {
    if (!current) return;
    setBusy(true); setError("");
    try {
      const results = await searchBulkImportEncounters(current.import_id, queries[groupId] || "");
      setMatches((value) => ({ ...value, [groupId]: results }));
    }
    catch (value) { setError(value instanceof Error ? value.message : "Search failed."); }
    finally { setBusy(false); }
  }

  async function chooseEncounter(groupId: string, encounter: number) {
    if (!current) return;
    setBusy(true); setError("");
    try { setCurrent(await resolveBulkImportGroup(current.import_id, groupId, encounter, {})); }
    catch (value) { setError(value instanceof Error ? value.message : "Encounter resolution failed."); }
    finally { setBusy(false); }
  }

  async function confirm() {
    if (!current || !window.confirm("Attach every selected image to the shown encounters?")) return;
    setBusy(true); setError("");
    try { setCurrent(await confirmBulkImageImport(current.import_id)); }
    catch (value) { setError(value instanceof Error ? value.message : "Confirmation failed."); }
    finally { setBusy(false); }
  }

  return <div className="space-y-6">
    <div><h1 className="text-3xl font-bold">Bulk Remidio fundus import</h1><p className="mt-1 text-slate-600">Preview and explicitly assign every image before anything is attached.</p></div>
    {error ? <p className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}
    {!current ? <section className="rounded-2xl border bg-white p-6 shadow-sm">
      <label className="block text-sm font-semibold">Assessment session/day<select className="mt-2 block w-full rounded border p-2" value={sessionId} onChange={(event) => setSessionId(event.target.value)}><option value="">Select a session</option>{sessions.map((item) => <option key={item.id} value={item.id}>{item.session_reference} · {item.service_date} · {item.organization} · {item.branch}</option>)}</select></label>
      <label className="mt-4 block text-sm font-semibold">Remidio ZIP<input className="mt-2 block w-full" type="file" accept=".zip,application/zip" onChange={(event) => setArchive(event.target.files?.[0] || null)} /></label>
      <button disabled={busy || !selected || !archive} onClick={() => void upload()} className="mt-5 rounded bg-blue-700 px-4 py-2 font-semibold text-white disabled:opacity-50">Inspect archive</button>
    </section> : <>
      <div className="rounded border bg-blue-50 p-4 text-sm">{current.image_count} image(s); {current.skipped_count} unsupported non-image file(s) skipped. Status: {current.status}.</div>
      {current.groups.map((group) => <section key={group.group_id} className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="mb-4"><h2 className="font-bold">Package {group.source_index}</h2><p className="text-sm">MRN: <span className="font-mono">{group.mrn || "Unresolved"}</span> · Date: {group.assessment_date || "Invalid"}</p><p className="text-sm">Encounter: {group.encounter ? `${group.encounter.encounter_id} · ${group.encounter.patient_name} · ${group.encounter.sentinel_patient_id || "Master ID unavailable"}` : "Manual encounter resolution required"}</p>{group.safe_issue_code ? <p className="text-sm text-amber-700">{group.safe_issue_code.replaceAll("_", " ")}</p> : null}<div className="mt-3 flex flex-wrap gap-2"><input value={queries[group.group_id] || ""} onChange={(event) => setQueries((value) => ({ ...value, [group.group_id]: event.target.value }))} placeholder="Search eligible encounter / ID / MRN" className="min-w-64 rounded border px-3 py-1.5 text-sm"/><button disabled={busy} onClick={() => void search(group.group_id)} className="rounded border px-3 py-1.5 text-sm">Search session</button>{matches[group.group_id]?.length ? <select defaultValue="" onChange={(event) => { if (event.target.value) void chooseEncounter(group.group_id, Number(event.target.value)); }} className="rounded border px-3 py-1.5 text-sm"><option value="">Select exact encounter</option>{matches[group.group_id].map((row) => <option key={row.id} value={row.id}>{row.encounter_id} · {row.patient_name} · {row.sentinel_patient_id}</option>)}</select> : null}</div></div>
        <div className="grid gap-4 md:grid-cols-2">{group.items.map((item) => <article key={item.item_id} className="rounded border p-3">{item.preview_path ? <img src={bulkImportPreviewUrl(item.preview_path)} alt={`Protected staged fundus image ${item.source_index}`} className="mb-3 max-h-72 w-full rounded bg-black object-contain" /> : <div className="mb-3 rounded bg-slate-100 p-8 text-center text-sm">Skipped non-image item</div>}<p className="text-xs text-slate-500">Item {item.source_index} · {item.width || "?"}×{item.height || "?"}</p>{item.preview_path ? <div className="mt-3 flex gap-2">{["right", "left", "rejected"].map((choice) => <button key={choice} disabled={busy} onClick={() => void decide(group.group_id, item.item_id, choice)} className={`rounded border px-3 py-1 text-sm ${item.decision === choice ? "bg-blue-700 text-white" : "bg-white"}`}>{choice}</button>)}</div> : null}</article>)}</div>
      </section>)}
      {current.status === "preview" ? <button disabled={busy} onClick={() => void confirm()} className="rounded bg-green-700 px-5 py-3 font-semibold text-white disabled:opacity-50">Confirm resolved attachments</button> : null}
    </>}
  </div>;
}
