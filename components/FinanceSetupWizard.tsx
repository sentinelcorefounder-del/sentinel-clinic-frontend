"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { financeWrite } from "@/lib/finance-api";

type Org = { id: number; name: string; organization_type: string };
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function FinanceSetupWizard() {
  const searchParams = useSearchParams();
  const initialOrganization = searchParams.get("organization") || "";
  const [organizations, setOrganizations] = useState<Org[]>([]);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    organization: initialOrganization,
    agreementName: "Retinal Assessment Agreement",
    amount: "15000",
    effectiveFrom: new Date().toISOString().slice(0, 10),
    paymentModel: "prefunded",
    paymentTermsDays: "30",
    creditLimit: "0",
    openingBalance: "0",
    paymentResponsibility: "hospital",
    equipmentOwner: "sentinel",
  });

  useEffect(() => {
    fetch(`${API_URL}/api/finance/organization-options/`, { credentials: "include", cache: "no-store" })
      .then(async (res) => { if (!res.ok) throw new Error("Unable to load organisations."); setOrganizations(await res.json()); })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load organisations."));
  }, []);

  const selected = useMemo(() => organizations.find((o) => String(o.id) === form.organization), [organizations, form.organization]);

  async function completeSetup() {
    setSaving(true); setError(""); setMessage("");
    try {
      const walletResponse = await fetch(`${API_URL}/api/finance/wallets/`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!walletResponse.ok) throw new Error("Unable to check the organisation wallet.");

      const walletPayload = await walletResponse.json();
      const wallets = Array.isArray(walletPayload) ? walletPayload : walletPayload.results || [];
      let wallet = wallets.find(
        (item: { organization: number | string; currency: string }) =>
          Number(item.organization) === Number(form.organization) && item.currency === "NGN",
      );
      const reusedWallet = Boolean(wallet);

      if (wallet) {
        wallet = await financeWrite(`/api/finance/wallets/${wallet.id}/`, "PATCH", {
          is_active: true,
          credit_limit: form.paymentModel === "credit" ? form.creditLimit : "0",
          notes: "Reviewed through Finance Setup Wizard",
        });
      } else {
        wallet = await financeWrite("/api/finance/wallets/", "POST", {
          organization: Number(form.organization),
          currency: "NGN",
          is_active: true,
          credit_limit: form.paymentModel === "credit" ? form.creditLimit : "0",
          notes: "Created through Finance Setup Wizard",
        });

        if (Number(form.openingBalance) > 0) {
          await financeWrite(`/api/finance/wallets/${wallet.id}/top-up/`, "POST", {
            amount: form.openingBalance,
            idempotency_key: `opening-${wallet.id}`,
            reference: "OPENING-BALANCE",
            description: "Opening balance entered during finance setup",
          });
        }
      }

      const contract = await financeWrite("/api/finance/contracts/", "POST", {
        organization: Number(form.organization), name: form.agreementName, programme: "diabetic_screening", status: "active",
        currency: "NGN", effective_from: form.effectiveFrom, payment_terms_days: form.paymentModel === "credit" ? Number(form.paymentTermsDays) : 0,
        credit_allowed: form.paymentModel === "credit", notes: "Created through Finance Setup Wizard",
      });
      await financeWrite("/api/finance/pricing-rules/", "POST", {
        contract: contract.id, name: `${form.agreementName} pricing`, is_active: true, service_type: "retinal_assessment",
        source_type: "", workflow_route: "", payment_responsibility: form.paymentResponsibility,
        equipment_owner_type: form.equipmentOwner, gross_amount: form.amount, priority: 100,
        effective_from: form.effectiveFrom, notes: "Created through Finance Setup Wizard",
      });

      setMessage(
        `Finance setup completed for ${selected?.name || "organisation"}. ${
          reusedWallet ? "The existing NGN wallet was reused; no opening balance was added again." : "A new NGN wallet was created."
        }`,
      );
      setStep(4);
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to complete finance setup."); }
    finally { setSaving(false); }
  }

  return <div className="space-y-6">
    <div><h1 className="text-3xl font-bold">Finance setup wizard</h1><p className="mt-1 text-slate-600">Create the agreement, negotiated assessment price and wallet in one guided flow.</p></div>
    <div className="grid grid-cols-4 gap-2">{["Organisation", "Agreement", "Wallet", "Complete"].map((label, index)=><div key={label} className={`rounded-xl px-3 py-2 text-center text-sm font-semibold ${step >= index+1 ? "bg-blue-700 text-white" : "bg-slate-200 text-slate-600"}`}>{index+1}. {label}</div>)}</div>
    {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
    {message ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{message}</div> : null}
    <section className="rounded-2xl border bg-white p-6 shadow-sm">
      {step===1 ? <div className="space-y-4"><h2 className="text-xl font-bold">Select organisation</h2><label className="block text-sm font-medium">Hospital or clinic<select value={form.organization} onChange={e=>setForm({...form,organization:e.target.value})} className="mt-1 w-full rounded-xl border px-3 py-2"><option value="">Select organisation</option>{organizations.map(o=><option key={o.id} value={o.id}>{o.name} ({o.organization_type})</option>)}</select></label><button disabled={!form.organization} onClick={()=>setStep(2)} className="rounded-xl bg-blue-700 px-5 py-2.5 font-semibold text-white disabled:opacity-40">Continue</button></div> : null}
      {step===2 ? <div className="grid gap-4 md:grid-cols-2"><h2 className="md:col-span-2 text-xl font-bold">Agreement and negotiated price</h2><Field label="Agreement name" value={form.agreementName} onChange={v=>setForm({...form,agreementName:v})}/><Field label="Charge per assessment (NGN)" type="number" value={form.amount} onChange={v=>setForm({...form,amount:v})}/><Field label="Effective from" type="date" value={form.effectiveFrom} onChange={v=>setForm({...form,effectiveFrom:v})}/><Select label="Payment responsibility" value={form.paymentResponsibility} onChange={v=>setForm({...form,paymentResponsibility:v})} options={[['hospital','Hospital'],['clinic','Clinic'],['patient','Patient'],['programme','Programme sponsor']]}/><Select label="Equipment owner" value={form.equipmentOwner} onChange={v=>setForm({...form,equipmentOwner:v})} options={[['sentinel','Sentinel'],['hospital','Hospital'],['clinic','Clinic']]}/><div className="md:col-span-2 flex gap-2"><button onClick={()=>setStep(1)} className="rounded-xl border px-5 py-2.5 font-semibold">Back</button><button onClick={()=>setStep(3)} className="rounded-xl bg-blue-700 px-5 py-2.5 font-semibold text-white">Continue</button></div></div> : null}
      {step===3 ? <div className="grid gap-4 md:grid-cols-2"><h2 className="md:col-span-2 text-xl font-bold">Wallet and payment model</h2><Select label="Payment model" value={form.paymentModel} onChange={v=>setForm({...form,paymentModel:v})} options={[['prefunded','Prefunded wallet'],['credit','Approved credit']]}/>{form.paymentModel==='credit'?<><Field label="Payment terms (days)" type="number" value={form.paymentTermsDays} onChange={v=>setForm({...form,paymentTermsDays:v})}/><Field label="Credit limit (NGN)" type="number" value={form.creditLimit} onChange={v=>setForm({...form,creditLimit:v})}/></>:null}<div><Field label="Opening wallet balance (new wallets only)" type="number" value={form.openingBalance} onChange={v=>setForm({...form,openingBalance:v})}/><p className="mt-1 text-xs text-slate-500">This is ignored when the organisation already has an NGN wallet.</p></div><div className="md:col-span-2 rounded-xl bg-slate-50 p-4 text-sm"><p><strong>Organisation:</strong> {selected?.name}</p><p><strong>Assessment charge:</strong> ₦{Number(form.amount||0).toLocaleString()}</p><p><strong>Model:</strong> {form.paymentModel==='credit'?'Approved credit':'Prefunded wallet'}</p></div><div className="md:col-span-2 flex gap-2"><button onClick={()=>setStep(2)} className="rounded-xl border px-5 py-2.5 font-semibold">Back</button><button disabled={saving} onClick={completeSetup} className="rounded-xl bg-blue-700 px-5 py-2.5 font-semibold text-white disabled:opacity-50">{saving?'Creating setup…':'Complete setup'}</button></div></div> : null}
      {step===4 ? <div className="space-y-4 text-center"><h2 className="text-2xl font-bold">Finance setup complete</h2><p className="text-slate-600">The organisation now has an active contract, negotiated pricing rule and wallet.</p><div className="flex justify-center gap-3"><a href="/ops/finance" className="rounded-xl border px-5 py-2.5 font-semibold">Finance dashboard</a><button onClick={()=>{setStep(1);setMessage("");setForm({...form,organization:"",openingBalance:"0"});}} className="rounded-xl bg-blue-700 px-5 py-2.5 font-semibold text-white">Set up another</button></div></div> : null}
    </section>
  </div>;
}

function Field({label,value,onChange,type="text"}:{label:string;value:string;onChange:(v:string)=>void;type?:string}){return <label className="text-sm font-medium">{label}<input required type={type} value={value} onChange={e=>onChange(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2"/></label>}
function Select({label,value,onChange,options}:{label:string;value:string;onChange:(v:string)=>void;options:[string,string][]}){return <label className="text-sm font-medium">{label}<select value={value} onChange={e=>onChange(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2">{options.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>}
