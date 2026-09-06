import { serverFetch } from "@/lib/server-api";
import type { FinanceCapabilities, FinancialRecord } from "@/types/finance";
import HistoricalFinanceManager from "./HistoricalFinanceManager";

export default async function Page(){
  const [records,organizations,capabilities]:[FinancialRecord[],Array<{id:number;name:string;organization_type:string}>,FinanceCapabilities]=await Promise.all([
    serverFetch("/api/finance/financial-records/"),serverFetch("/api/finance/organization-options/"),serverFetch("/api/finance/capabilities/")
  ]);
  return <div className="space-y-6"><div><h1 className="text-3xl font-bold">Historical assessment finance</h1><p className="mt-1 text-slate-600">Reconcile assessments performed before or outside Sentinel without pretending the money was received today.</p></div><HistoricalFinanceManager records={records} organizations={organizations} capabilities={capabilities}/></div>;
}
