"use client";

import { useState } from "react";
import { downloadFinanceFile, financeWrite, financeWriteForm } from "@/lib/finance-api";
import type { FinanceCapabilities, FinanceWallet, FounderFundedExpense } from "@/types/finance";

const money=(value:string,currency="NGN")=>new Intl.NumberFormat("en-NG",{style:"currency",currency}).format(Number(value||0));
const categories=[
  ["salary_payroll","Salary / payroll"],["contractor","Contractor"],["hosting_software","Hosting / software"],
  ["field_operations","Field operations"],["marketing_administration","Marketing / administration"],
  ["equipment_supplies","Equipment / supplies"],["tax_professional_fees","Tax / professional fees"],
  ["founder_reimbursement","Founder reimbursement"],["internal_account_transfer","Internal account transfer"],
  ["other_operating_expense","Other approved operating expense"],
] as const;

export default function FounderExpenseManager({items,wallets,capabilities}:{items:FounderFundedExpense[];wallets:FinanceWallet[];capabilities:FinanceCapabilities}){
 const [busy,setBusy]=useState(false); const [error,setError]=useState(""); const [walletId,setWalletId]=useState(String(wallets[0]?.id||""));
 async function act(id:number,action:string,body:Record<string,unknown>={}){setBusy(true);setError("");try{await financeWrite(`/api/finance/founder-expenses/${id}/${action}/`,"POST",body);location.reload();}catch(e){setError(e instanceof Error?e.message:"Action failed.");setBusy(false);}}
 async function createTransfer(item:FounderFundedExpense){if(!walletId){setError("Select an eligible Sentinel treasury wallet first.");return;}setBusy(true);setError("");try{await financeWrite("/api/finance/treasury-transfers/","POST",{wallet:Number(walletId),amount:item.amount,category:"founder_reimbursement",purpose:`Reimbursement of ${item.expense_reference}: ${item.description}`,destination_label:item.supplier_payee,founder_expense:item.id,idempotency_key:crypto.randomUUID()});location.reload();}catch(e){setError(e instanceof Error?e.message:"Unable to create reimbursement transfer.");setBusy(false);}}
 return <div className="space-y-6">
  {capabilities.can_operate&&<form className="grid gap-3 rounded-2xl border bg-white p-6 md:grid-cols-2" onSubmit={async e=>{e.preventDefault();const d=new FormData(e.currentTarget);d.append("idempotency_key",crypto.randomUUID());setBusy(true);setError("");try{await financeWriteForm("/api/finance/founder-expenses/",d);location.reload();}catch(err){setError(err instanceof Error?err.message:"Unable to record founder expense.");setBusy(false);}}}>
   <h2 className="md:col-span-2 text-lg font-bold">Record founder-funded expense</h2>
   <label className="text-sm font-medium">Expense date<input required type="date" name="expense_date" className="mt-1 w-full rounded border p-2"/></label>
   <label className="text-sm font-medium">Category<select required name="category" className="mt-1 w-full rounded border p-2">{categories.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
   <label className="text-sm font-medium">Supplier / payee<input required name="supplier_payee" className="mt-1 w-full rounded border p-2"/></label>
   <label className="text-sm font-medium">Amount<input required name="amount" type="number" min="0.01" step="0.01" className="mt-1 w-full rounded border p-2"/></label>
   <label className="text-sm font-medium">Currency<input required name="currency" defaultValue="NGN" maxLength={3} className="mt-1 w-full rounded border p-2"/></label>
   <label className="text-sm font-medium">Funding treatment<select required name="funding_treatment" className="mt-1 w-full rounded border p-2"><option value="founder_contribution">Founder contribution — not repayable</option><option value="founder_reimbursable">Amount owed to founder — reimbursable</option></select></label>
   <label className="text-sm font-medium md:col-span-2">Description<textarea required name="description" className="mt-1 w-full rounded border p-2"/></label>
   <label className="text-sm font-medium md:col-span-2">Evidence<input required name="evidence" type="file" accept=".pdf,.png,.jpg,.jpeg" className="mt-1 w-full rounded border p-2"/></label>
   <button disabled={busy} className="rounded bg-blue-700 px-4 py-2 font-semibold text-white md:col-span-2">Record draft</button>
  </form>}
  {capabilities.can_operate&&<label className="block rounded-2xl border bg-white p-4 text-sm font-medium">Reimbursement wallet<select value={walletId} onChange={e=>setWalletId(e.target.value)} className="mt-1 w-full rounded border p-2" disabled={!wallets.length}><option value="">{wallets.length?"Select Sentinel wallet":"No eligible Sentinel treasury wallet"}</option>{wallets.map(w=><option key={w.id} value={w.id}>{w.organization_name} · {w.currency} · available {money(w.available_balance,w.currency)} · reserved {money(w.reserved_balance,w.currency)} · transferable {money(w.transferable_balance,w.currency)}</option>)}</select></label>}
  {error&&<p className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
  <section className="space-y-3">{items.map(item=><article key={item.id} className="rounded-2xl border bg-white p-5"><div className="flex flex-wrap justify-between gap-3"><div><h3 className="font-bold">{item.expense_reference} · {money(item.amount,item.currency)}</h3><p className="text-sm text-slate-600">{item.expense_date} · {item.supplier_payee} · {item.category}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase">{item.status}</span></div><p className="mt-3 text-sm">{item.description}</p><p className="mt-1 text-xs text-slate-500">{item.funding_treatment==="founder_contribution"?"Non-repayable founder contribution":"Reimbursable founder liability"}</p><div className="mt-3 flex flex-wrap gap-2">
   {item.status==="draft"&&capabilities.can_operate&&<button disabled={busy} onClick={()=>void act(item.id,"submit")} className="rounded border px-3 py-1.5 text-xs font-semibold">Submit</button>}
   {item.status==="submitted"&&capabilities.can_approve&&<><button disabled={busy} onClick={()=>void act(item.id,"approve")} className="rounded bg-green-700 px-3 py-1.5 text-xs font-semibold text-white">Approve</button><button disabled={busy} onClick={()=>{const r=prompt("Rejection reason");if(r)void act(item.id,"reject",{reason:r});}} className="rounded bg-red-700 px-3 py-1.5 text-xs font-semibold text-white">Reject</button></>}
   {item.status==="approved"&&item.funding_treatment==="founder_reimbursable"&&!item.reimbursement_transfer_id&&capabilities.can_operate&&<button disabled={busy||!wallets.length} onClick={()=>void createTransfer(item)} className="rounded bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white">Create full reimbursement transfer</button>}
   {item.evidence_available&&<button onClick={()=>void downloadFinanceFile(`/api/finance/founder-expenses/${item.id}/evidence/`,`${item.expense_reference}-evidence`)} className="rounded border px-3 py-1.5 text-xs font-semibold">Download evidence</button>}
  </div></article>)}{!items.length&&<p className="rounded-2xl border bg-white p-6 text-sm text-slate-600">No founder-funded expenses recorded.</p>}</section>
 </div>;
}
