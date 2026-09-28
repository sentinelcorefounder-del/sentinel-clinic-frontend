import { serverFetch } from "@/lib/server-api";
import ComplimentaryManager from "./ComplimentaryManager";

export default async function ComplimentaryPage() {
  const [items, records, capabilities] = await Promise.all([
    serverFetch("/api/finance/complimentary/"),
    serverFetch("/api/finance/complimentary/eligible-records/"),
    serverFetch("/api/finance/capabilities/"),
  ]);
  return <div className="space-y-6"><h1 className="text-3xl font-bold">Complimentary services</h1>
    <p>Approve a non-cash service while retaining its standard value. Patient and clinic amounts become zero. Treasury cash does not move.</p>
    <ComplimentaryManager items={items} records={records} capabilities={capabilities} />
  </div>;
}
