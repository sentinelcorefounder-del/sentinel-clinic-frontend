import { serverFetch } from "@/lib/server-api";
import type { EncounterSponsorship, FinanceCapabilities, FinanceWallet, FinancialRecord } from "@/types/finance";
import SponsorshipManager from "./SponsorshipManager";

export default async function SponsorshipsPage() {
  const [items, records, allWallets, capabilities]: [EncounterSponsorship[], FinancialRecord[], FinanceWallet[], FinanceCapabilities] = await Promise.all([
    serverFetch("/api/finance/sponsorships/"), serverFetch("/api/finance/financial-records/"),
    serverFetch("/api/finance/wallets/"), serverFetch("/api/finance/capabilities/"),
  ]);
  const wallets = allWallets.filter(wallet => wallet.organization_type === "sentinel" && wallet.is_active);
  return <div className="space-y-6"><div><h1 className="text-3xl font-bold">Sponsorship requests</h1><p className="mt-1 text-slate-600">Controlled, maker–checker Sentinel funding for identified encounters. This never represents patient payment or a bank transfer.</p></div><SponsorshipManager items={items} records={records} wallets={wallets} capabilities={capabilities} /></div>;
}
