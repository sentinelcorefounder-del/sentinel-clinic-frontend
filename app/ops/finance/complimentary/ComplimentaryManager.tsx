"use client";

import { useState } from "react";
import { financeWrite } from "@/lib/finance-api";
import type { FinancialRecord, FinanceCapabilities } from "@/types/finance";

type Request = { id: number; encounter_reference: string; gross_service_value: string; currency: string; status: string; reason: string; decision_reason: string; events: { id: number; actor: number; action: string; reason: string; created_at: string }[] };

export default function ComplimentaryManager({ items, records, capabilities }: { items: Request[]; records: FinancialRecord[]; capabilities: FinanceCapabilities }) {
  const [record, setRecord] = useState("");
  const [reason, setReason] = useState("");
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function act(path: string, body: object) {
    setBusy(true); setError("");
    try { await financeWrite(path, "POST", body); location.reload(); }
    catch (e) { setError(e instanceof Error ? e.message : "Request failed"); setBusy(false); }
  }
  return <div className="space-y-4">
    {capabilities.can_operate && <form className="space-y-3 rounded-xl border bg-white p-5" onSubmit={e => {
      e.preventDefault(); const requestKey = key || crypto.randomUUID(); setKey(requestKey);
      act("/api/finance/complimentary/", { financial_record: Number(record), reason, idempotency_key: requestKey });
    }}>
      <label className="block">Unpaid service<select required value={record} onChange={e => { setRecord(e.target.value); setKey(""); }} className="mt-1 block w-full rounded border p-2">
        <option value="">Select encounter</option>{records.map(r => <option key={r.id} value={r.id}>{r.encounter_id} · {r.patient_display} · {r.currency} {r.gross_amount}</option>)}
      </select></label>
      <label className="block">Reason<textarea required value={reason} onChange={e => { setReason(e.target.value); setKey(""); }} className="mt-1 block w-full rounded border p-2" /></label>
      <p className="text-sm text-slate-600">A separate finance approver must decide this request. Approved dispositions are final here; only pending requests can be cancelled.</p>
      <button disabled={busy} className="rounded bg-blue-700 px-4 py-2 text-white">Submit for approval</button>
    </form>}
    {error && <p role="alert" className="rounded bg-red-50 p-3 text-red-800">{error}</p>}
    {items.map(item => <article key={item.id} className="space-y-3 rounded-xl border bg-white p-5">
      <h2 className="font-bold">{item.encounter_reference} · {item.currency} {item.gross_service_value} standard value</h2>
      <p>{item.status} · {item.reason}</p>
      {item.status === "approved" && <p>Patient: 0 · Clinic: 0 · Treasury cash movement: 0 · Financially releasable</p>}
      {item.status === "submitted" && <div className="flex gap-3">
        {capabilities.can_approve && <><button disabled={busy} className="rounded bg-green-700 px-3 py-2 text-white" onClick={() => act(`/api/finance/complimentary/${item.id}/approve/`, {})}>Approve non-cash disposition</button>
          <button disabled={busy} onClick={() => { const reason = prompt("Rejection reason"); if (reason) act(`/api/finance/complimentary/${item.id}/reject/`, { reason }); }}>Reject</button></>}
        {capabilities.can_operate && <button disabled={busy} onClick={() => { const reason = prompt("Cancellation reason"); if (reason) act(`/api/finance/complimentary/${item.id}/cancel/`, { reason }); }}>Cancel request</button>}
      </div>}
      <details><summary>Audit history</summary>{item.events.map(event => <p key={event.id} className="text-sm">{event.created_at} · {event.action} · Actor {event.actor} · {event.reason}</p>)}</details>
    </article>)}
  </div>;
}
