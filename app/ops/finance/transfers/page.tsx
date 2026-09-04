import { serverFetch } from "@/lib/server-api";
import type { FinanceCapabilities, FinanceWallet, TreasuryTransfer } from "@/types/finance";
import TreasuryTransferManager from "./TreasuryTransferManager";

export default async function TreasuryTransfersPage() {
  const [items, wallets, capabilities]: [TreasuryTransfer[], FinanceWallet[], FinanceCapabilities] = await Promise.all([
    serverFetch("/api/finance/treasury-transfers/"), serverFetch("/api/finance/wallets/sentinel-treasury/"),
    serverFetch("/api/finance/capabilities/"),
  ]);
  return <div className="space-y-6"><div><h1 className="text-3xl font-bold">Treasury transfer register</h1><p className="mt-1 text-slate-600">Maker–checker approval and evidence for manual transfers from genuine Sentinel funds. Sentinel does not initiate banking from this screen.</p></div><TreasuryTransferManager items={items} wallets={wallets} capabilities={capabilities} /></div>;
}
