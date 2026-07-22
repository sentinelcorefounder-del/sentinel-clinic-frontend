"use client";
import { useState } from "react";
import { financeWrite } from "@/lib/finance-api";
import type { BankTransferFunding, FinanceCapabilities } from "@/types/finance";

export default function FundingActions({ item, capabilities }: { item: BankTransferFunding; capabilities: FinanceCapabilities }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function act(action: string, body: Record<string, unknown>) {
    setBusy(true); setError("");
    try { await financeWrite(`/api/finance/bank-transfer-funding/${item.id}/${action}/`, "POST", body); location.reload(); }
    catch (e) { setError(e instanceof Error ? e.message : "Action failed."); setBusy(false); }
  }
  if (item.status === "proof_submitted" && capabilities.can_operate) return <div className="space-y-2"><button disabled={busy} onClick={() => act("verify", { received_amount: prompt("Verified amount", item.requested_amount), bank_transaction_reference: prompt("Bank transaction reference"), value_date: prompt("Value date (YYYY-MM-DD)"), notes: prompt("Verification notes") || "" })} className="rounded bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white">Verify</button>{error && <p className="text-xs text-red-700">{error}</p>}</div>;
  if (item.status === "verified" && capabilities.can_approve) return <div className="flex flex-wrap gap-2"><button disabled={busy} onClick={() => act("approve", {})} className="rounded bg-green-700 px-3 py-1.5 text-xs font-semibold text-white">Approve credit</button><button disabled={busy} onClick={() => { const reason = prompt("Rejection reason"); if (reason) act("reject", { reason }); }} className="rounded bg-red-700 px-3 py-1.5 text-xs font-semibold text-white">Reject</button>{error && <p className="w-full text-xs text-red-700">{error}</p>}</div>;
  return <span className="text-xs text-slate-500">No action available</span>;
}
