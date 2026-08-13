"use client";

import { useState } from "react";
import { financeWrite } from "@/lib/finance-api";
import type { BillingProfile } from "@/types/finance";

const empty: Omit<BillingProfile, "id" | "is_complete"> = {
  legal_entity_name: "Afriophthalmics", trading_name: "Sentinel", registered_address: "",
  company_registration_number: "", tax_identification_number: "", finance_email: "",
  finance_phone: "", bank_name: "", bank_account_name: "", bank_account_number: "",
  bank_branch_code: "", currency: "NGN", transfer_instructions: "",
  funding_request_prefix: "SEN-BT", receipt_prefix: "SEN-RCPT", is_active: true,
};

export default function BillingProfileForm({ initial }: { initial: BillingProfile | null }) {
  const [form, setForm] = useState(initial || empty);
  const [savedProfile, setSavedProfile] = useState<BillingProfile | null>(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const set = (key: keyof typeof empty, value: string | boolean) => setForm({ ...form, [key]: value });
  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      const path = savedProfile ? `/api/finance/billing-profile/${savedProfile.id}/` : "/api/finance/billing-profile/";
      const saved = await financeWrite(path, savedProfile ? "PATCH" : "POST", form) as BillingProfile;
      setSavedProfile(saved);
      setForm(saved);
      setMessage("Billing and bank settings saved. New funding requests will use these details.");
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to save settings."); }
    finally { setBusy(false); }
  }
  const input = (label: string, key: keyof typeof empty, required = false) => <label className="block text-sm font-medium">{label}<input required={required} value={String(form[key] ?? "")} onChange={e=>set(key,e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2"/></label>;
  return <form onSubmit={save} className="space-y-6 rounded-2xl border bg-white p-6 shadow-sm">
    {message?<p className="rounded-xl bg-green-50 p-4 text-sm text-green-800">{message}</p>:null}
    {error?<p className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p>:null}
    <section><h2 className="text-xl font-bold">Legal entity</h2><div className="mt-4 grid gap-4 md:grid-cols-2">{input("Legal entity name","legal_entity_name",true)}{input("Trading name","trading_name",true)}<label className="block text-sm font-medium md:col-span-2">Registered address<textarea value={form.registered_address} onChange={e=>set("registered_address",e.target.value)} rows={3} className="mt-1 w-full rounded-xl border px-3 py-2"/></label>{input("Company registration number","company_registration_number")}{input("Tax identification number (when confirmed)","tax_identification_number")}{input("Finance email","finance_email")}{input("Finance phone","finance_phone")}</div></section>
    <section><h2 className="text-xl font-bold">Bank account</h2><div className="mt-4 grid gap-4 md:grid-cols-2">{input("Bank name","bank_name",true)}{input("Account name","bank_account_name",true)}{input("Account number","bank_account_number",true)}{input("Branch / bank code (optional)","bank_branch_code")}{input("Currency","currency",true)}<label className="block text-sm font-medium md:col-span-2">Transfer instructions<textarea value={form.transfer_instructions} onChange={e=>set("transfer_instructions",e.target.value)} rows={3} className="mt-1 w-full rounded-xl border px-3 py-2"/></label></div></section>
    <section><h2 className="text-xl font-bold">Document numbering</h2><div className="mt-4 grid gap-4 md:grid-cols-2">{input("Funding request prefix","funding_request_prefix",true)}{input("Receipt prefix","receipt_prefix",true)}</div></section>
    <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={form.is_active} onChange={e=>set("is_active",e.target.checked)}/>Use this active profile for new bank-transfer requests</label>
    <button disabled={busy} className="rounded-xl bg-blue-700 px-5 py-2.5 font-semibold text-white disabled:opacity-50">{busy?"Saving…":"Save billing settings"}</button>
  </form>;
}
