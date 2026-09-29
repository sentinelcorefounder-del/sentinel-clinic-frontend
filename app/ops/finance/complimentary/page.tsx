import { serverFetch } from "@/lib/server-api";
import type { FinanceCapabilities, FinancialRecord } from "@/types/finance";
import ComplimentaryManager from "./ComplimentaryManager";

export default async function ComplimentaryPage() {
  const [items, capabilities]: [unknown[], FinanceCapabilities] = await Promise.all([
    serverFetch("/api/finance/complimentary/"),
    serverFetch("/api/finance/capabilities/"),
  ]);

  let records: FinancialRecord[] = [];

  if (capabilities.can_operate) {
    records = await serverFetch("/api/finance/complimentary/eligible-records/");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Complimentary services</h1>
      <p>
        Approve a non-cash service while retaining its standard value. Patient
        and clinic amounts become zero. Treasury cash does not move.
      </p>
      <ComplimentaryManager
        items={items as Parameters<typeof ComplimentaryManager>[0]["items"]}
        records={records}
        capabilities={capabilities}
      />
    </div>
  );
}