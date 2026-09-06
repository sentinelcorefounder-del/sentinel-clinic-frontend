"use client";

import { useState } from "react";
import { downloadFinanceFile, financeWrite, financeWriteForm } from "@/lib/finance-api";
import type { FinanceCapabilities, FinanceWallet, TreasuryTransfer } from "@/types/finance";

const money = (value: string) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(Number(value || 0));

export default function TreasuryTransferManager({ items, wallets, capabilities }: {
  items: TreasuryTransfer[]; wallets: FinanceWallet[]; capabilities: FinanceCapabilities;
}) {
  const [walletId, setWalletId] = useState(String(wallets[0]?.id || ""));
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("other_operating_expense");
  const [purpose, setPurpose] = useState("");
  const [destination, setDestination] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function create() {
    if (!walletId || !amount || !category || !purpose.trim() || !destination.trim()) {
      setError("Sentinel wallet, amount, category, purpose and destination label are required.");
      return;
    }
    setBusy(true); setError("");
    try {
      await financeWrite("/api/finance/treasury-transfers/", "POST", {
        wallet: Number(walletId), amount, category, purpose: purpose.trim(),
        destination_label: destination.trim(), idempotency_key: crypto.randomUUID(),
      });
      location.reload();
    } catch (value) { setError(value instanceof Error ? value.message : "Unable to create transfer draft."); setBusy(false); }
  }

  async function act(id: number, action: string, body: Record<string, unknown> = {}) {
    setBusy(true); setError("");
    try { await financeWrite(`/api/finance/treasury-transfers/${id}/${action}/`, "POST", body); location.reload(); }
    catch (value) { setError(value instanceof Error ? value.message : "Action failed."); setBusy(false); }
  }

  async function execute(item: TreasuryTransfer) {
    const executionDate = prompt("Execution date (YYYY-MM-DD)", new Date().toISOString().slice(0, 10));
    if (!executionDate) return;
    const reference = prompt("External bank/payment reference");
    if (!reference) return;
    const input = document.createElement("input");
    input.type = "file"; input.accept = ".pdf,.png,.jpg,.jpeg";
    input.onchange = async () => {
      const evidence = input.files?.[0];
      if (!evidence) return;
      setBusy(true); setError("");
      const form = new FormData(); form.append("execution_date", executionDate); form.append("external_reference", reference); form.append("evidence", evidence);
      try { await financeWriteForm(`/api/finance/treasury-transfers/${item.id}/execute/`, form); location.reload(); }
      catch (value) { setError(value instanceof Error ? value.message : "Unable to record execution."); setBusy(false); }
    };
    document.body.appendChild(input); input.click();
  }

  return <div className="space-y-6">
    {capabilities.can_operate && <section className="rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold">New transfer draft</h2>
      <p className="mt-1 text-sm text-slate-600">This register records an independently executed transfer. Approval never initiates banking.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="text-sm font-medium">Sentinel wallet<select value={walletId} onChange={event => setWalletId(event.target.value)} className="mt-1 w-full rounded-lg border p-2" disabled={!wallets.length}><option value="">{wallets.length ? "Select Sentinel wallet" : "No eligible Sentinel treasury wallet"}</option>{wallets.map(wallet => <option key={wallet.id} value={wallet.id}>{wallet.organization_name} · {wallet.currency} · available {money(wallet.available_balance)} · reserved {money(wallet.reserved_balance)} · transferable {money(wallet.transferable_balance)}</option>)}</select></label>
        <label className="text-sm font-medium">Category<select value={category} onChange={event => setCategory(event.target.value)} className="mt-1 w-full rounded-lg border p-2"><option value="salary_payroll">Salary / payroll</option><option value="contractor">Contractor</option><option value="hosting_software">Hosting / software</option><option value="field_operations">Field operations</option><option value="marketing_administration">Marketing / administration</option><option value="equipment_supplies">Equipment / supplies</option><option value="tax_professional_fees">Tax / professional fees</option><option value="founder_reimbursement">Founder reimbursement</option><option value="internal_account_transfer">Internal account transfer</option><option value="other_operating_expense">Other approved operating expense</option></select></label>
        <label className="text-sm font-medium">Amount<input value={amount} onChange={event => setAmount(event.target.value)} type="number" min="0.01" step="0.01" className="mt-1 w-full rounded-lg border p-2" /></label>
        <label className="text-sm font-medium">Purpose<textarea value={purpose} onChange={event => setPurpose(event.target.value)} className="mt-1 w-full rounded-lg border p-2" /></label>
        <label className="text-sm font-medium">Destination label<input value={destination} onChange={event => setDestination(event.target.value)} className="mt-1 w-full rounded-lg border p-2" placeholder="Reviewed destination name only" /></label>
      </div>
      <button disabled={busy} onClick={create} className="mt-4 rounded-xl bg-blue-700 px-4 py-2 font-semibold text-white disabled:opacity-50">Create draft</button>
    </section>}
    {!wallets.length && capabilities.can_operate && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">No eligible Sentinel treasury wallet was returned. No wallet or balance will be created automatically; verify the existing funded Sentinel wallet designation.</p>}
    {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    <section className="space-y-3">{items.map(item => <article key={item.id} className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex flex-wrap justify-between gap-3"><div><h3 className="font-bold">{item.transfer_reference} · {money(item.amount)}</h3><p className="text-sm text-slate-600">{item.wallet_name} → {item.destination_label}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase">{item.status}</span></div>
      <p className="mt-3 text-sm">{item.purpose}</p>{item.external_reference && <p className="mt-1 text-sm text-slate-600">Execution reference: {item.external_reference}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {item.status === "draft" && capabilities.can_operate && <button disabled={busy} onClick={() => act(item.id, "submit")} className="rounded border px-3 py-1.5 text-xs font-semibold">Submit</button>}
        {item.status === "submitted" && capabilities.can_approve && <><button disabled={busy} onClick={() => act(item.id, "approve")} className="rounded bg-green-700 px-3 py-1.5 text-xs font-semibold text-white">Approve</button><button disabled={busy} onClick={() => { const value = prompt("Rejection reason"); if (value) act(item.id, "reject", { reason: value }); }} className="rounded bg-red-700 px-3 py-1.5 text-xs font-semibold text-white">Reject</button></>}
        {item.status === "approved" && capabilities.can_operate && <button disabled={busy} onClick={() => execute(item)} className="rounded bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white">Record execution</button>}
        {["draft", "submitted", "approved"].includes(item.status) && capabilities.can_operate && <button disabled={busy} onClick={() => { const value = prompt("Cancellation reason"); if (value) act(item.id, "cancel", { reason: value }); }} className="rounded border px-3 py-1.5 text-xs font-semibold">Cancel</button>}
        {item.status === "executed" && capabilities.can_approve && <button disabled={busy} onClick={() => { const value = prompt("Reversal reason"); if (value) act(item.id, "reverse", { reason: value }); }} className="rounded border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-800">Record reversal</button>}
        {item.evidence_available && <button disabled={busy} onClick={() => downloadFinanceFile(`/api/finance/treasury-transfers/${item.id}/evidence/`, `${item.transfer_reference}-evidence`)} className="rounded border px-3 py-1.5 text-xs font-semibold">Download evidence</button>}
      </div>
    </article>)}{!items.length && <p className="rounded-2xl border bg-white p-6 text-sm text-slate-600">No treasury transfers recorded.</p>}</section>
  </div>;
}
