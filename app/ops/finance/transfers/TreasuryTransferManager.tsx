"use client";

import { useState } from "react";
import { downloadFinanceFile, financeWrite, financeWriteForm } from "@/lib/finance-api";
import type { FinanceCapabilities, FinanceWallet, TreasuryTransfer } from "@/types/finance";

const money = (value: string | number | null | undefined, currency = "NGN") =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(value || 0));

export default function TreasuryTransferManager({ items, wallets, capabilities }: { items: TreasuryTransfer[]; wallets: FinanceWallet[]; capabilities: FinanceCapabilities }) {
  const [walletId, setWalletId] = useState(String(wallets[0]?.id || ""));
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("other_operating_expense");
  const [purpose, setPurpose] = useState("");
  const [destination, setDestination] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [executionTarget, setExecutionTarget] = useState<TreasuryTransfer | null>(null);
  const [executionDate, setExecutionDate] = useState(new Date().toISOString().slice(0, 10));
  const [executionReference, setExecutionReference] = useState("");
  const [executionEvidence, setExecutionEvidence] = useState<File | null>(null);

  async function create() {
    if (!walletId || !amount || !category || !purpose.trim() || !destination.trim()) {
      setError("Treasury wallet, amount, category, purpose and destination are required."); return;
    }
    setBusy(true); setError("");
    try {
      await financeWrite("/api/finance/treasury-transfers/", "POST", {
        wallet: Number(walletId), amount, category, purpose: purpose.trim(), destination_label: destination.trim(), idempotency_key: crypto.randomUUID(),
      });
      location.reload();
    } catch (value) { setError(value instanceof Error ? value.message : "Unable to create transfer draft."); setBusy(false); }
  }

  async function act(id: number, action: string, body: Record<string, unknown> = {}) {
    setBusy(true); setError("");
    try { await financeWrite(`/api/finance/treasury-transfers/${id}/${action}/`, "POST", body); location.reload(); }
    catch (value) { setError(value instanceof Error ? value.message : "Action failed."); setBusy(false); }
  }

  async function recordPayment(event: React.FormEvent) {
    event.preventDefault();
    if (!executionTarget || !executionDate || !executionReference.trim() || !executionEvidence) {
      setError("Execution date, bank/payment reference and payment evidence are required."); return;
    }
    const form = new FormData();
    form.append("execution_date", executionDate);
    form.append("external_reference", executionReference.trim());
    form.append("evidence", executionEvidence);
    setBusy(true); setError("");
    try { await financeWriteForm(`/api/finance/treasury-transfers/${executionTarget.id}/execute/`, form); location.reload(); }
    catch (value) { setError(value instanceof Error ? value.message : "Unable to record payment."); setBusy(false); }
  }

  return <div className="space-y-6">
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950"><strong>Treasury only.</strong> These payments change Project Sentinel Treasury. They do not change Sentinel Clinic or partner clinic wallets.</div>
    {capabilities.can_operate && <section className="rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold">New treasury payment</h2>
      <p className="mt-1 text-sm text-slate-600">Create, submit and approve the payment first. Cash leaves treasury only when payment is recorded with evidence.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="text-sm font-medium">Treasury wallet<select value={walletId} onChange={e=>setWalletId(e.target.value)} className="mt-1 w-full rounded-lg border p-2" disabled={!wallets.length}><option value="">{wallets.length?"Select treasury wallet":"No treasury wallet configured"}</option>{wallets.map(w=><option key={w.id} value={w.id}>{w.organization_name} · available {money(w.available_balance)} · transferable {money(w.transferable_balance)}</option>)}</select></label>
        <label className="text-sm font-medium">Category<select value={category} onChange={e=>setCategory(e.target.value)} className="mt-1 w-full rounded-lg border p-2"><option value="salary_payroll">Salary / payroll</option><option value="contractor">Contractor</option><option value="hosting_software">Hosting / software</option><option value="field_operations">Field operations</option><option value="marketing_administration">Marketing / administration</option><option value="equipment_supplies">Equipment / supplies</option><option value="tax_professional_fees">Tax / professional fees</option><option value="founder_reimbursement">Founder reimbursement</option><option value="internal_account_transfer">Internal account transfer</option><option value="other_operating_expense">Other operating expense</option></select></label>
        <label className="text-sm font-medium">Amount<input value={amount} onChange={e=>setAmount(e.target.value)} type="number" min="0.01" step="0.01" className="mt-1 w-full rounded-lg border p-2" /></label>
        <label className="text-sm font-medium">Destination<input value={destination} onChange={e=>setDestination(e.target.value)} className="mt-1 w-full rounded-lg border p-2" /></label>
        <label className="text-sm font-medium md:col-span-2">Purpose<textarea value={purpose} onChange={e=>setPurpose(e.target.value)} className="mt-1 w-full rounded-lg border p-2" /></label>
      </div>
      <button disabled={busy} onClick={create} className="mt-4 rounded-xl bg-blue-700 px-4 py-2 font-semibold text-white disabled:opacity-50">Create draft</button>
    </section>}
    {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    <section className="space-y-3">{items.map(item=><article key={item.id} className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex flex-wrap justify-between gap-3"><div><h3 className="font-bold">{item.transfer_reference} · {money(item.amount)}</h3><p className="text-sm text-slate-600">{item.wallet_name} → {item.destination_label}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase">{item.status}</span></div>
      <p className="mt-3 text-sm">{item.purpose}</p>{item.external_reference&&<p className="mt-1 text-sm text-slate-600">Payment reference: {item.external_reference}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {item.status==="draft"&&capabilities.can_operate&&<button disabled={busy} onClick={()=>act(item.id,"submit")} className="rounded border px-3 py-1.5 text-xs font-semibold">Submit for approval</button>}
        {item.status==="submitted"&&capabilities.can_approve&&<><button disabled={busy} onClick={()=>act(item.id,"approve")} className="rounded bg-green-700 px-3 py-1.5 text-xs font-semibold text-white">Approve</button><button disabled={busy} onClick={()=>{const value=prompt("Rejection reason");if(value)act(item.id,"reject",{reason:value})}} className="rounded bg-red-700 px-3 py-1.5 text-xs font-semibold text-white">Reject</button></>}
        {item.status==="approved"&&capabilities.can_operate&&<button disabled={busy} onClick={()=>{setExecutionTarget(item);setExecutionDate(new Date().toISOString().slice(0,10));setExecutionReference("");setExecutionEvidence(null)}} className="rounded bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white">Record payment</button>}
        {["draft","submitted","approved"].includes(item.status)&&capabilities.can_operate&&<button disabled={busy} onClick={()=>{const value=prompt("Cancellation reason");if(value)act(item.id,"cancel",{reason:value})}} className="rounded border px-3 py-1.5 text-xs font-semibold">Cancel</button>}
        {item.status==="executed"&&capabilities.can_approve&&<button disabled={busy} onClick={()=>{const value=prompt("Reversal reason");if(value)act(item.id,"reverse",{reason:value})}} className="rounded border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-800">Record reversal</button>}
        {item.evidence_available&&<button disabled={busy} onClick={()=>downloadFinanceFile(`/api/finance/treasury-transfers/${item.id}/evidence/`,`${item.transfer_reference}-evidence`)} className="rounded border px-3 py-1.5 text-xs font-semibold">Payment evidence</button>}
      </div>
    </article>)}{!items.length&&<p className="rounded-2xl border bg-white p-6 text-sm text-slate-600">No treasury payments recorded.</p>}</section>

    {executionTarget && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <form onSubmit={recordPayment} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-bold">Record payment</h2><p className="mt-1 text-sm text-slate-600">{executionTarget.transfer_reference} · {money(executionTarget.amount)} · {executionTarget.destination_label}</p>
        <div className="mt-5 space-y-4">
          <label className="block text-sm font-medium">Execution date<input required type="date" value={executionDate} onChange={e=>setExecutionDate(e.target.value)} className="mt-1 w-full rounded-lg border p-2" /></label>
          <label className="block text-sm font-medium">Bank/payment reference<input required value={executionReference} onChange={e=>setExecutionReference(e.target.value)} className="mt-1 w-full rounded-lg border p-2" placeholder="Bank transaction reference" /></label>
          <label className="block text-sm font-medium">Payment evidence<input required type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={e=>setExecutionEvidence(e.target.files?.[0]||null)} className="mt-1 block w-full rounded-lg border p-2" />{executionEvidence?<span className="mt-1 block text-xs text-slate-600">Selected: {executionEvidence.name}</span>:null}</label>
        </div>
        <div className="mt-6 flex justify-end gap-2"><button type="button" disabled={busy} onClick={()=>setExecutionTarget(null)} className="rounded-lg border px-4 py-2 font-semibold">Cancel</button><button disabled={busy} className="rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white">{busy?"Recording…":"Confirm payment"}</button></div>
      </form>
    </div>}
  </div>;
}
