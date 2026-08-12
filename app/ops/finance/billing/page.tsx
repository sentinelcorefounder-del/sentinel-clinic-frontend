import { serverFetch } from "@/lib/server-api";
import type { BillingProfile } from "@/types/finance";
import BillingProfileForm from "./BillingProfileForm";

export default async function BillingSettingsPage() {
  const profiles: BillingProfile[] = await serverFetch("/api/finance/billing-profile/");
  const active = profiles.find(item => item.is_active) || profiles[0] || null;
  return <div className="space-y-6"><div><h1 className="text-3xl font-bold">Billing and bank settings</h1><p className="mt-1 text-slate-600">Configure the Afriophthalmics legal identity and bank instructions shown on Sentinel funding requests and receipts.</p></div><div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Changes apply only to new funding requests. Existing documents keep the details that were shown when they were created.</div><BillingProfileForm initial={active}/></div>;
}
