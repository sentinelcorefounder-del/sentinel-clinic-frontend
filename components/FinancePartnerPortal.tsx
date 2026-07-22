"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchMyBankTransfers, fetchMyFinance, financeWrite, financeWriteForm, initializeWalletTopUp } from "@/lib/finance-api";
import { getMe } from "@/lib/auth";
import type { BankTransferFunding, PartnerFinance } from "@/types/finance";

const money = (value: string | number | null | undefined, currency = "NGN") =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(value || 0));

const label = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (m) => m.toUpperCase());

export default function FinancePartnerPortal({ title }: { title: string }) {
  const [finance, setFinance] = useState<PartnerFinance | null>(null);
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [bankTransfers, setBankTransfers] = useState<BankTransferFunding[]>([]);

  useEffect(() => {
    Promise.all([fetchMyFinance(), getMe(), fetchMyBankTransfers()])
      .then(([data, user, transfers]) => {
        setFinance(data);
        setBankTransfers(transfers);
        setEmail(user?.email || user?.organization?.contact_email || "");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load finance information."))
      .finally(() => setLoading(false));
  }, []);

  const currentPrice = useMemo(() => finance?.active_pricing_rules?.[0] || null, [finance]);
  const lowBalance = Boolean(finance?.wallet && currentPrice && Number(finance.wallet.spendable_balance) < Number(currentPrice.gross_amount) * 5);

  function exportStatement() {
    if (!finance) return;
    const rows = [["Date","Type","Reference","Available delta","Reserved delta"], ...finance.recent_ledger.map((entry) => [entry.created_at, entry.entry_type, entry.reference || entry.description || "", entry.available_delta, entry.reserved_delta])];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll(`"`, `""`)}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `${finance.organization_name.replaceAll(" ", "-")}-wallet-statement.csv`; link.click(); URL.revokeObjectURL(url);
  }

  async function topUp(event: React.FormEvent) {
    event.preventDefault();
    if (!finance?.wallet) return;
    setError("");
    setSubmitting(true);
    try {
      const result = await initializeWalletTopUp({ walletId: finance.wallet.id, amount, email });
      window.location.assign(result.authorization_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start wallet top-up.");
      setSubmitting(false);
    }
  }

  async function requestBankTransfer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!finance?.wallet) return;
    const form = new FormData(event.currentTarget); setSubmitting(true); setError("");
    try { await financeWrite("/api/finance/bank-transfer-funding/", "POST", { wallet: finance.wallet.id, requested_amount: form.get("requested_amount"), notes: form.get("notes") || "" }); location.reload(); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to create bank-transfer request."); setSubmitting(false); }
  }

  async function uploadProof(id: number, file: File | null) {
    if (!file) return; const body = new FormData(); body.append("proof", file); setSubmitting(true); setError("");
    try { await financeWriteForm(`/api/finance/bank-transfer-funding/${id}/submit-proof/`, body); location.reload(); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to submit transfer proof."); setSubmitting(false); }
  }

  if (loading) return <main className="min-h-screen bg-slate-100 p-10"><p>Loading finance portal...</p></main>;
  if (error && !finance) return <main className="min-h-screen bg-slate-100 p-10"><p className="text-red-700">{error}</p></main>;
  if (!finance) return null;

  return (
    <main className="min-h-screen space-y-8 bg-slate-100 p-6 md:p-10">
      <div>
        <h1 className="text-3xl font-bold text-slate-950">{title}</h1>
        <p className="mt-1 text-slate-700">Wallet, agreed pricing and assessment charges for {finance.organization_name}.</p>
      </div>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div> : null}
      {lowBalance ? <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900">Your wallet balance is below the cost of five assessments. Please top up soon to avoid interrupted service.</div> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border bg-white p-5 shadow-sm"><p className="text-sm text-slate-600">Available balance</p><p className="mt-2 text-3xl font-bold">{money(finance.wallet?.available_balance, finance.wallet?.currency)}</p></div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm"><p className="text-sm text-slate-600">Reserved balance</p><p className="mt-2 text-3xl font-bold">{money(finance.wallet?.reserved_balance, finance.wallet?.currency)}</p></div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm"><p className="text-sm text-slate-600">Spendable balance</p><p className="mt-2 text-3xl font-bold">{money(finance.wallet?.spendable_balance, finance.wallet?.currency)}</p></div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm"><p className="text-sm text-slate-600">Agreed assessment charge</p><p className="mt-2 text-3xl font-bold">{currentPrice ? money(currentPrice.gross_amount, finance.active_contract?.currency) : "Not configured"}</p></div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Current agreement</h2>
          {finance.active_contract ? (
            <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-slate-500">Contract</dt><dd className="font-semibold">{finance.active_contract.name}</dd></div>
              <div><dt className="text-slate-500">Status</dt><dd className="font-semibold">{label(finance.active_contract.status)}</dd></div>
              <div><dt className="text-slate-500">Effective from</dt><dd className="font-semibold">{finance.active_contract.effective_from}</dd></div>
              <div><dt className="text-slate-500">Payment model</dt><dd className="font-semibold">{finance.active_contract.credit_allowed ? `${finance.active_contract.payment_terms_days}-day credit` : "Prefunded wallet"}</dd></div>
              <div className="col-span-2"><dt className="text-slate-500">Pricing rules</dt><dd className="mt-2 space-y-2">{finance.active_pricing_rules.map((rule) => <div key={rule.id} className="flex justify-between rounded-lg bg-slate-50 p-3"><span>{rule.name}</span><strong>{money(rule.gross_amount, finance.active_contract?.currency)}</strong></div>)}</dd></div>
            </dl>
          ) : <p className="mt-4 text-slate-600">No active finance contract has been configured.</p>}
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Top up wallet</h2>
          <p className="mt-1 text-sm text-slate-600">Enter any permitted amount. Your balance is credited only after Paystack verifies payment.</p>
          {finance.wallet ? (
            <form onSubmit={topUp} className="mt-5 space-y-4">
              <label className="block text-sm font-medium">Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2" /></label>
              <label className="block text-sm font-medium">Amount (NGN)<input type="number" required min="1000" step="100" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2" placeholder="50000" /></label>
              <button disabled={submitting} className="rounded-xl bg-blue-700 px-5 py-2.5 font-semibold text-white hover:bg-blue-800 disabled:opacity-50">{submitting ? "Opening Paystack..." : "Continue to Paystack"}</button>
            </form>
          ) : <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">A wallet has not yet been created for this organisation. Contact Sentinel Ops.</p>}
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold">Fund by bank transfer</h2>
        <p className="mt-1 text-sm text-slate-600">Create a funding reference, make the transfer using Sentinel&apos;s confirmed bank instructions, then upload evidence. Your wallet is credited only after separate verification and approval.</p>
        {finance.wallet ? <form onSubmit={requestBankTransfer} className="mt-5 grid gap-3 md:grid-cols-3"><input required name="requested_amount" type="number" min="1000" step="100" placeholder="Requested amount (NGN)" className="rounded-xl border px-3 py-2"/><input name="notes" placeholder="Payment note (optional)" className="rounded-xl border px-3 py-2"/><button disabled={submitting} className="rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white">Create transfer request</button></form> : null}
        <div className="mt-5 overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-left"><tr><th className="p-3">Reference</th><th className="p-3">Amount</th><th className="p-3">Status</th><th className="p-3">Evidence</th></tr></thead><tbody>{bankTransfers.length?bankTransfers.map(item=><tr key={item.id} className="border-t"><td className="p-3 font-mono text-xs">{item.request_reference}</td><td className="p-3">{money(item.requested_amount,item.currency)}</td><td className="p-3">{label(item.status)}</td><td className="p-3">{item.status==="awaiting_transfer"?<label className="cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-semibold">Upload proof<input type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={e=>uploadProof(item.id,e.target.files?.[0]||null)}/></label>:"Submitted"}</td></tr>):<tr><td colSpan={4} className="p-6 text-center text-slate-500">No bank-transfer requests.</td></tr>}</tbody></table></div>
      </section>

      <section className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5"><h2 className="text-xl font-bold">Recent wallet activity</h2><button type="button" onClick={exportStatement} className="rounded-xl border px-4 py-2 text-sm font-semibold">Download CSV statement</button></div>
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-left"><tr><th className="p-3">Date</th><th className="p-3">Type</th><th className="p-3">Reference</th><th className="p-3 text-right">Available</th><th className="p-3 text-right">Reserved</th></tr></thead><tbody>{finance.recent_ledger.length ? finance.recent_ledger.map((entry) => <tr key={entry.id} className="border-t"><td className="p-3">{new Date(entry.created_at).toLocaleString()}</td><td className="p-3">{label(entry.entry_type)}</td><td className="p-3">{entry.reference || entry.description || "—"}</td><td className="p-3 text-right">{money(entry.available_delta, entry.currency)}</td><td className="p-3 text-right">{money(entry.reserved_delta, entry.currency)}</td></tr>) : <tr><td colSpan={5} className="p-8 text-center text-slate-500">No wallet activity yet.</td></tr>}</tbody></table></div>
      </section>

      <section className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="border-b p-5"><h2 className="text-xl font-bold">Recent assessment charges</h2></div>
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-left"><tr><th className="p-3">Encounter</th><th className="p-3">Pricing rule</th><th className="p-3">Status</th><th className="p-3 text-right">Charge</th></tr></thead><tbody>{finance.recent_financial_records.length ? finance.recent_financial_records.map((record) => <tr key={record.id} className="border-t"><td className="p-3 font-medium">{record.encounter_id}</td><td className="p-3">{record.pricing_rule_name || "—"}</td><td className="p-3">{label(record.status)}</td><td className="p-3 text-right">{money(record.gross_amount, record.currency)}</td></tr>) : <tr><td colSpan={4} className="p-8 text-center text-slate-500">No assessment charges yet.</td></tr>}</tbody></table></div>
      </section>
    </main>
  );
}
