"use client";

import { useMemo, useState } from "react";
import { financeWrite } from "@/lib/finance-api";
import type { EncounterSponsorship, FinanceCapabilities, FinanceWallet, FinancialRecord } from "@/types/finance";

const money = (value: string) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(Number(value || 0));

export default function SponsorshipManager({ items, records, wallets, capabilities }: {
  items: EncounterSponsorship[]; records: FinancialRecord[]; wallets: FinanceWallet[]; capabilities: FinanceCapabilities;
}) {
  const [recordId, setRecordId] = useState("");
  const [walletId, setWalletId] = useState(String(wallets[0]?.id || ""));
  const [category, setCategory] = useState("complimentary_client_service");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const selected = useMemo(() => records.find(item => String(item.id) === recordId), [records, recordId]);

  async function create() {
    if (!selected || !walletId || !reason.trim()) return setError("Select an encounter, Sentinel wallet and reason.");
    setBusy(true); setError("");
    try {
      await financeWrite("/api/finance/sponsorships/", "POST", {
        encounter: selected.encounter, sponsor_wallet: Number(walletId), category,
        reason: reason.trim(), idempotency_key: crypto.randomUUID(),
      });
      location.reload();
    } catch (value) { setError(value instanceof Error ? value.message : "Unable to create sponsorship."); setBusy(false); }
  }

  async function act(id: number, action: string, body: Record<string, unknown> = {}) {
    setBusy(true); setError("");
    try { await financeWrite(`/api/finance/sponsorships/${id}/${action}/`, "POST", body); location.reload(); }
    catch (value) { setError(value instanceof Error ? value.message : "Action failed."); setBusy(false); }
  }

  return <div className="space-y-6">
    {capabilities.can_operate && <section className="rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold">New Sentinel sponsorship</h2>
      <p className="mt-1 text-sm text-slate-600">Patient due is ₦0. The approved standard price and every contractual allocation remain visible and funded from genuine Sentinel money.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="text-sm font-medium">Encounter<select value={recordId} onChange={event => setRecordId(event.target.value)} className="mt-1 w-full rounded-lg border p-2"><option value="">Select an uncaptured encounter</option>{records.filter(record => !record.captured_at).map(record => <option key={record.id} value={record.id}>{record.encounter_id} · {record.patient_display} · {record.organization_name} · {money(record.gross_amount)}</option>)}</select></label>
        <label className="text-sm font-medium">Sentinel wallet<select value={walletId} onChange={event => setWalletId(event.target.value)} className="mt-1 w-full rounded-lg border p-2">{wallets.map(wallet => <option key={wallet.id} value={wallet.id}>{wallet.organization_name} · available {money(wallet.available_balance)}</option>)}</select></label>
        <label className="text-sm font-medium">Category<select value={category} onChange={event => setCategory(event.target.value)} className="mt-1 w-full rounded-lg border p-2"><option value="complimentary_client_service">Complimentary client service</option><option value="approved_promotional_screening">Approved promotional screening</option><option value="hardship_support">Hardship support</option><option value="approved_programme_sponsorship">Approved programme sponsorship</option><option value="correction_replacement">Correction / replacement</option></select></label>
        <label className="text-sm font-medium">Reason<textarea value={reason} onChange={event => setReason(event.target.value)} className="mt-1 w-full rounded-lg border p-2" /></label>
      </div>
      {selected && <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm"><p><strong>Patient:</strong> {selected.patient_display} · <strong>Encounter:</strong> {selected.encounter_id}</p><p className="mt-1"><strong>Organisation / branch:</strong> {selected.organization_name}{selected.branch_name ? ` / ${selected.branch_name}` : ""}{selected.service_session_reference ? ` · Session ${selected.service_session_reference}` : ""}</p><p className="mt-1"><strong>Standard service value:</strong> {money(selected.gross_amount)} · <strong>Patient due:</strong> ₦0.00</p><p className="mt-1"><strong>Path:</strong> {selected.payment_responsibility} · <strong>Clinical status:</strong> {selected.clinical_status}</p><ul className="mt-2 list-disc pl-5">{selected.allocations?.map((allocation, index) => <li key={index}>{allocation.label || allocation.beneficiary_role}: {money(allocation.amount)}</li>)}</ul></div>}
      <button disabled={busy} onClick={create} className="mt-4 rounded-xl bg-blue-700 px-4 py-2 font-semibold text-white disabled:opacity-50">Create draft</button>
    </section>}
    {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    <section className="space-y-3">{items.map(item => <article key={item.id} className="rounded-2xl border bg-white p-5 shadow-sm"><div className="flex flex-wrap justify-between gap-3"><div><h3 className="font-bold">{item.sponsorship_reference} · {item.encounter_reference}</h3><p className="text-sm text-slate-600">{item.patient_display} · {item.organization_name}{item.branch_name ? ` / ${item.branch_name}` : ""}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase">{item.status}</span></div><p className="mt-3 text-sm"><strong>Sentinel sponsored:</strong> {money(item.gross_service_value)} · <strong>Patient paid:</strong> {money(item.patient_amount)}</p><p className="mt-1 text-sm text-slate-600">{item.reason}</p><div className="mt-3 flex flex-wrap gap-2">{item.status === "draft" && capabilities.can_operate && <button disabled={busy} onClick={() => act(item.id, "submit")} className="rounded border px-3 py-1.5 text-xs font-semibold">Submit</button>}{item.status === "submitted" && capabilities.can_approve && <><button disabled={busy} onClick={() => act(item.id, "approve")} className="rounded bg-green-700 px-3 py-1.5 text-xs font-semibold text-white">Approve & reserve</button><button disabled={busy} onClick={() => { const value = prompt("Rejection reason"); if (value) act(item.id, "reject", { reason: value }); }} className="rounded bg-red-700 px-3 py-1.5 text-xs font-semibold text-white">Reject</button></>}{item.status === "approved" && capabilities.can_operate && <button disabled={busy} onClick={() => act(item.id, "capture")} className="rounded bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white">Capture sponsorship</button>}{["draft", "submitted", "approved"].includes(item.status) && capabilities.can_operate && <button disabled={busy} onClick={() => { const value = prompt("Cancellation reason"); if (value) act(item.id, "cancel", { reason: value }); }} className="rounded border px-3 py-1.5 text-xs font-semibold">Cancel</button>}</div></article>)}{!items.length && <p className="rounded-2xl border bg-white p-6 text-sm text-slate-600">No sponsorship requests yet.</p>}</section>
  </div>;
}
