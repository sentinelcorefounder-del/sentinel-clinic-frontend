import Link from "next/link";
import { serverFetch } from "@/lib/server-api";
import type { FinanceDashboardSummary } from "@/types/finance";

const money = (value: string) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(Number(value || 0));

export default async function OpsFinanceDashboard() {
  const summary: FinanceDashboardSummary = await serverFetch("/api/finance/summary/");
  const cards = [
    ["Active contracts", summary.active_contracts], ["Active pricing rules", summary.pricing_rules],
    ["Organisation wallets", summary.wallets], ["Financial records", summary.financial_records],
    ["Awaiting payment", summary.awaiting_payment], ["Captured assessments", summary.captured],
  ];
  return <div className="space-y-8">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-bold">Finance</h1><p className="mt-1 text-slate-600">Contracts, negotiated pricing, wallets, ledger and settlements.</p></div><div className="flex flex-wrap gap-2"><Link href="/ops/finance/contracts" className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white">Manage pricing</Link><Link href="/ops/finance/wallets" className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold">Wallets</Link></div></div>
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{cards.map(([title, value]) => <div key={String(title)} className="rounded-2xl border bg-white p-5 shadow-sm"><p className="text-sm text-slate-600">{title}</p><p className="mt-2 text-3xl font-bold">{value}</p></div>)}</section>
    <section className="grid gap-4 md:grid-cols-2"><div className="rounded-2xl border bg-white p-6 shadow-sm"><p className="text-sm text-slate-600">Total available wallet balance</p><p className="mt-2 text-3xl font-bold">{money(summary.wallet_available)}</p></div><div className="rounded-2xl border bg-white p-6 shadow-sm"><p className="text-sm text-slate-600">Total reserved wallet balance</p><p className="mt-2 text-3xl font-bold">{money(summary.wallet_reserved)}</p></div></section>
    <section className="grid gap-4 md:grid-cols-3"><Link href="/ops/finance/contracts" className="rounded-2xl border bg-white p-6 shadow-sm hover:border-blue-400"><h2 className="font-bold">Contracts & pricing</h2><p className="mt-1 text-sm text-slate-600">Set hospital and clinic-specific assessment charges.</p></Link><Link href="/ops/finance/ledger" className="rounded-2xl border bg-white p-6 shadow-sm hover:border-blue-400"><h2 className="font-bold">Immutable ledger</h2><p className="mt-1 text-sm text-slate-600">Review top-ups, reservations, captures and refunds.</p></Link><Link href="/ops/finance/settlements" className="rounded-2xl border bg-white p-6 shadow-sm hover:border-blue-400"><h2 className="font-bold">Settlements</h2><p className="mt-1 text-sm text-slate-600">Create, approve and mark beneficiary settlements paid.</p></Link></section>
  </div>;
}
