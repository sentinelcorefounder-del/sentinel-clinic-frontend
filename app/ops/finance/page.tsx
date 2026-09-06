import Link from "next/link";
import { serverFetch } from "@/lib/server-api";
import type { FinanceDashboardSummary, SentinelFinanceDashboard } from "@/types/finance";

const money=(v:string)=>new Intl.NumberFormat("en-NG",{style:"currency",currency:"NGN",maximumFractionDigits:2}).format(Number(v||0));

const groups = [
  { title: "Money in", items: [
    ["Funding approvals","Verify genuine bank-transfer funding before wallets are credited.","/ops/finance/funding"],
    ["Historical assessments","Reconcile pre-platform assessment charges and payments without creating new cash.","/ops/finance/historical"],
    ["Sponsorships","Fund approved encounters from genuine Sentinel treasury money.","/ops/finance/sponsorships"],
  ]},
  { title: "Money out", items: [
    ["Treasury payments","Approve and record salaries, contractors, operations and other treasury payments.","/ops/finance/transfers"],
    ["Settlements","Prepare, approve and evidence beneficiary payouts.","/ops/finance/settlements"],
    ["Founder expenses","Record founder-paid costs and controlled reimbursements.","/ops/finance/founder-expenses"],
  ]},
  { title: "Pricing & agreements", items: [
    ["Contracts & service pricing","Set organisation-specific prices for each assessment service and AI add-on.","/ops/finance/contracts"],
    ["Setup wizard","Onboard a hospital or clinic.","/ops/finance/setup"],
    ["Service allowances","Control temporary pre-funding authority.","/ops/finance/allowances"],
  ]},
  { title: "Controls & records", items: [
    ["Wallets","Review organisation wallets. Clinic and hospital wallets are separate from treasury.","/ops/finance/wallets"],
    ["Immutable ledger","Review every append-only wallet movement.","/ops/finance/ledger"],
    ["Corrections","Maker-checker refunds and reversals.","/ops/finance/corrections"],
    ["Reconciliation & audit","Investigate finance consistency and control history.","/ops/finance/reconciliation"],
    ["Billing & bank settings","Manage legal billing identity and transfer instructions.","/ops/finance/billing"],
  ]},
] as const;

export default async function OpsFinanceDashboard({ searchParams }: { searchParams: Promise<Record<string,string|string[]|undefined>> }){
  const raw=await searchParams; const q=new URLSearchParams();
  for(const key of ["date_from","date_to","payment_source"]){const value=raw[key];if(typeof value==="string"&&value.trim())q.set(key,value.trim())}
  const [summary,sentinel]:[FinanceDashboardSummary,SentinelFinanceDashboard]=await Promise.all([
    serverFetch("/api/finance/summary/"),
    serverFetch(`/api/finance/sentinel-dashboard/${q.size?`?${q.toString()}`:""}`),
  ]);
  return <div className="space-y-8">
    <div><h1 className="text-3xl font-bold">Finance</h1><p className="mt-1 text-slate-600">Treasury, partner finance, service pricing and controlled payments. Sentinel Clinic is a separate operational clinic and must not share this treasury balance.</p></div>

    <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-xl font-bold text-blue-950">Project Sentinel Treasury</h2><p className="mt-1 text-sm text-blue-900">Central Sentinel cash only. Clinic and hospital wallet balances are excluded.</p></div><Link href="/ops/finance/transfers" className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white">Manage treasury payments</Link></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[["Cash balance",sentinel.available_sentinel_funds],["Committed, not paid",sentinel.approved_transfer_commitments],["Available to spend",sentinel.transferable_surplus],["Pending funding attempts",sentinel.pending_unverified_funding],["Clinic payables",sentinel.clinic_payables],["Service-partner payables",sentinel.service_partner_payables]].map(([label,value])=><div key={label} className="rounded-xl bg-white p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-xl font-bold">{money(value)}</p></div>)}
      </div>
      <p className="mt-4 text-xs text-blue-900">Approved treasury payments are commitments; cash is debited only after payment is recorded with evidence.</p>
    </section>

    <section className="grid gap-4 md:grid-cols-3">{[["Active contracts",summary.active_contracts],["Financial records",summary.financial_records],["Awaiting payment",summary.awaiting_payment]].map(([label,value])=><div key={label} className="rounded-2xl border bg-white p-5 shadow-sm"><p className="text-sm text-slate-600">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p></div>)}</section>

    {groups.map(group=><section key={group.title}><h2 className="mb-3 text-lg font-bold">{group.title}</h2><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{group.items.map(([title,description,href])=><Link key={href} href={href} className="rounded-2xl border bg-white p-5 shadow-sm hover:border-blue-400"><h3 className="font-bold">{title}</h3><p className="mt-1 text-sm text-slate-600">{description}</p></Link>)}</div></section>)}
  </div>;
}
