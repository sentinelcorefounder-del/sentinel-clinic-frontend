"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { FinanceWallet, PartnerContract, PricingRule } from "@/types/finance";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const money = (value: string | number | null | undefined, currency = "NGN") =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency }).format(Number(value || 0));

export default function OrganizationFinanceCard({ organizationId }: { organizationId: number | string }) {
  const [wallets, setWallets] = useState<FinanceWallet[]>([]);
  const [contracts, setContracts] = useState<PartnerContract[]>([]);
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/finance/wallets/`, { credentials: "include", cache: "no-store" }),
      fetch(`${API_URL}/api/finance/contracts/`, { credentials: "include", cache: "no-store" }),
      fetch(`${API_URL}/api/finance/pricing-rules/`, { credentials: "include", cache: "no-store" }),
    ])
      .then(async ([walletRes, contractRes, ruleRes]) => {
        if (!walletRes.ok || !contractRes.ok || !ruleRes.ok) throw new Error("Unable to load organisation finance setup.");
        setWallets(await walletRes.json());
        setContracts(await contractRes.json());
        setRules(await ruleRes.json());
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load finance setup."))
      .finally(() => setLoading(false));
  }, []);

  const wallet = useMemo(() => wallets.find((item) => Number(item.organization) === Number(organizationId)) || null, [wallets, organizationId]);
  const contract = useMemo(() => contracts.find((item) => Number(item.organization) === Number(organizationId) && item.status === "active") || null, [contracts, organizationId]);
  const price = useMemo(() => rules.find((item) => item.contract === contract?.id && item.is_active) || null, [rules, contract]);
  const lowBalance = wallet && price ? Number(wallet.spendable_balance) < Number(price.gross_amount) * 5 : false;

  return (
    <section className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="text-xl font-bold">Finance setup</h2><p className="mt-1 text-sm text-slate-600">Contract, negotiated charge and wallet status.</p></div>
        <Link href={`/ops/finance/setup?organization=${organizationId}`} className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white">{contract || wallet ? "Review setup" : "Set up finance"}</Link>
      </div>
      {loading ? <p className="mt-5 text-sm text-slate-500">Loading finance status…</p> : null}
      {error ? <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      {!loading && !error ? (
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Agreed charge</p><p className="mt-2 text-2xl font-bold">{price ? money(price.gross_amount, contract?.currency) : "Not configured"}</p></div>
          <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Spendable wallet</p><p className="mt-2 text-2xl font-bold">{wallet ? money(wallet.spendable_balance, wallet.currency) : "No wallet"}</p></div>
          <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payment model</p><p className="mt-2 text-lg font-bold">{contract ? (contract.credit_allowed ? `${contract.payment_terms_days}-day credit` : "Prefunded wallet") : "Not configured"}</p></div>
        </div>
      ) : null}
      {lowBalance ? <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-900">Low balance: fewer than five assessments remain at the current negotiated price.</div> : null}
    </section>
  );
}
