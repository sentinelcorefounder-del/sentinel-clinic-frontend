import FinanceNotice from "@/components/FinanceNotice";
import { serverFetch } from "@/lib/server-api";
import type { FinanceCapabilities, SettlementBatch } from "@/types/finance";
import SettlementActions from "./SettlementActions";
import SettlementCreator from "./SettlementCreator";

type OrganizationOption = { id: number; name: string };

const money = (value: string, currency = "NGN") =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency }).format(Number(value || 0));

export default async function SettlementsPage() {
  const [batches, capabilities, organizations]: [
    SettlementBatch[], FinanceCapabilities, OrganizationOption[],
  ] = await Promise.all([
    serverFetch("/api/finance/settlements/"),
    serverFetch("/api/finance/capabilities/"),
    serverFetch("/api/finance/organization-options/"),
  ]);

  return <div className="space-y-6">
    <div><h1 className="text-3xl font-bold">Settlements</h1><p className="mt-1 text-slate-600">Review, approve and record payment of beneficiary settlements.</p></div>
    <FinanceNotice tone="warning">The preparer cannot approve the same batch. Marking a batch paid requires evidence and a unique external payment reference.</FinanceNotice>
    <SettlementCreator organizations={organizations} capabilities={capabilities}/>
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm"><table className="w-full text-sm">
      <thead className="bg-slate-50 text-left"><tr><th className="p-3">Beneficiary</th><th className="p-3">Period</th><th className="p-3">Status</th><th className="p-3 text-right">Amount</th><th className="p-3">Reference</th><th className="p-3">Action</th></tr></thead>
      <tbody>{batches.length ? batches.map((batch) => <tr key={batch.id} className="border-t">
        <td className="p-3 font-medium">{batch.beneficiary_organization_name}</td><td className="p-3">{batch.period_start} – {batch.period_end}</td><td className="p-3">{batch.status}</td><td className="p-3 text-right font-semibold">{money(batch.total_amount, batch.currency)}</td><td className="p-3">{batch.external_reference || "—"}</td>
        <td className="p-3"><SettlementActions id={batch.id} status={batch.status} evidenceAvailable={batch.payment_evidence_available} capabilities={capabilities}/></td>
      </tr>) : <tr><td colSpan={6} className="p-8 text-center text-slate-500">No settlement batches yet.</td></tr>}</tbody>
    </table></div>
  </div>;
}
