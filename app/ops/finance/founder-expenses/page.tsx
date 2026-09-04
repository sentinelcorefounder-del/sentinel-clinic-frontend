import { serverFetch } from "@/lib/server-api";
import type { FinanceCapabilities, FinanceWallet, FounderFundedExpense } from "@/types/finance";
import FounderExpenseManager from "./FounderExpenseManager";

export default async function FounderExpensesPage() {
  const [items, wallets, capabilities]: [FounderFundedExpense[], FinanceWallet[], FinanceCapabilities] = await Promise.all([
    serverFetch("/api/finance/founder-expenses/"),
    serverFetch("/api/finance/wallets/sentinel-treasury/"),
    serverFetch("/api/finance/capabilities/"),
  ]);
  return <div className="space-y-6"><div><h1 className="text-3xl font-bold">Founder-funded expenses</h1><p className="mt-1 text-slate-600">Record costs paid personally on Sentinel’s behalf without changing wallet balances. Reimbursement requires a separately approved treasury transfer.</p></div><FounderExpenseManager items={items} wallets={wallets} capabilities={capabilities} /></div>;
}
