"use client";

import { useState } from "react";
import { financeWrite } from "@/lib/finance-api";
import type { FinanceCapabilities, FinancialRecord } from "@/types/finance";

type Org = { id:number; name:string; organization_type:string };

const services = [
  ["diabetic_retinal_assessment","Diabetic retinal assessment"],
  ["combined_diabetic_eye_health","Combined diabetic eye health assessment"],
  ["eye_health_screening","Eye health assessment"],
  ["ocular_assessment","Comprehensive ocular assessment"],
  ["ocular_ai_review","Ocular AI clinical review"],
] as const;

export default function HistoricalFinanceManager({records,organizations,capabilities}:{records:FinancialRecord[];organizations:Org[];capabilities:FinanceCapabilities}){
  const [busy,setBusy]=useState(false); const [error,setError]=useState("");
  async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();const d=new FormData(e.currentTarget);setBusy(true);setError("");try{await financeWrite("/api/finance/historical-assessments/","POST",{encounter:Number(d.get("encounter")),service_code:d.get("service_code"),assessment_date:d.get("assessment_date"),payment_state:d.get("payment_state"),amount:d.get("amount"),amount_paid:d.get("amount_paid")||"0",collecting_organization:d.get("collecting_organization")?Number(d.get("collecting_organization")):null,payment_method:d.get("payment_method")||"",payment_reference:d.get("payment_reference")||"",source_note:d.get("source_note"),idempotency_key:crypto.randomUUID()});location.reload()}catch(c){setError(c instanceof Error?c.message:"Unable to record historical finance.");setBusy(false)}}
  if(!capabilities.can_operate)return <p className="rounded-xl border bg-white p-5 text-sm text-slate-600">You have read-only finance access.</p>;
  return <form onSubmit={submit} className="grid gap-4 rounded-2xl border bg-white p-6 md:grid-cols-2">
    <div className="md:col-span-2"><h2 className="text-lg font-bold">Record historical assessment finance</h2><p className="mt-1 text-sm text-slate-600">Use only after the historical clinical encounter/report exists. This records what happened historically; it does not create a new payment today.</p></div>
    {error&&<p className="md:col-span-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <label className="text-sm font-medium">Encounter<select required name="encounter" className="mt-1 w-full rounded-lg border p-2"><option value="">Select encounter</option>{records.map(r=><option key={r.id} value={r.encounter}>{r.encounter_id} · {r.patient_display} · {r.organization_name}</option>)}</select></label>
    <label className="text-sm font-medium">Service<select required name="service_code" className="mt-1 w-full rounded-lg border p-2">{services.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
    <label className="text-sm font-medium">Assessment date<input required name="assessment_date" type="date" className="mt-1 w-full rounded-lg border p-2" /></label>
    <label className="text-sm font-medium">Historical payment state<select required name="payment_state" className="mt-1 w-full rounded-lg border p-2"><option value="historical_paid">Already paid historically</option><option value="historical_unpaid">Still unpaid</option><option value="historical_unknown">Unknown</option></select></label>
    <label className="text-sm font-medium">Historical charge (NGN)<input required name="amount" type="number" min="0" step="0.01" className="mt-1 w-full rounded-lg border p-2" /></label>
    <label className="text-sm font-medium">Amount actually paid (NGN)<input name="amount_paid" type="number" min="0" step="0.01" defaultValue="0" className="mt-1 w-full rounded-lg border p-2" /></label>
    <label className="text-sm font-medium">Who collected the money?<select name="collecting_organization" className="mt-1 w-full rounded-lg border p-2"><option value="">Not known / none</option>{organizations.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select></label>
    <label className="text-sm font-medium">Payment method<input name="payment_method" placeholder="cash, bank transfer, POS…" className="mt-1 w-full rounded-lg border p-2" /></label>
    <label className="text-sm font-medium">Historical payment reference<input name="payment_reference" className="mt-1 w-full rounded-lg border p-2" /></label>
    <label className="text-sm font-medium md:col-span-2">Source / reconciliation note<textarea required name="source_note" className="mt-1 w-full rounded-lg border p-2" placeholder="Explain the source of this historical financial record." /></label>
    <button disabled={busy} className="rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white md:col-span-2">{busy?"Recording…":"Record historical finance"}</button>
  </form>;
}
