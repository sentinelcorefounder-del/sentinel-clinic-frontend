import Link from "next/link";
import { serverFetch } from "@/lib/server-api";

type Props = { searchParams?: Promise<Record<string, string | string[] | undefined>> };
function valueOf(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] || "" : value || ""; }

export default async function OpsClinicsPage({ searchParams }: Props) {
  const params = (await searchParams) || {};
  const ordering = valueOf(params.ordering) || "name";
  const clinics = await serverFetch(`/api/ops/clinics/?ordering=${encodeURIComponent(ordering)}`);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-bold">Clinics</h1>
        <form className="flex items-center gap-2">
          <label className="text-sm font-medium">Sort
            <select name="ordering" defaultValue={ordering} className="ml-2 rounded border px-3 py-2 text-sm">
              <option value="name">Name A–Z</option><option value="-name">Name Z–A</option><option value="-created_at">Newest onboarded</option><option value="created_at">Oldest onboarded</option><option value="code">Clinic code A–Z</option>
            </select>
          </label>
          <button className="rounded bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Apply</button>
        </form>
      </div>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm"><thead className="bg-slate-100 text-left"><tr><th className="p-3">Code</th><th className="p-3">Clinic</th><th className="p-3">Email</th><th className="p-3">Onboarded</th><th className="p-3">Assigned Referrals</th><th className="p-3">Reports</th><th className="p-3">View</th></tr></thead>
          <tbody>{clinics.map((c: any) => <tr key={c.id} className="border-t"><td className="p-3">{c.code}</td><td className="p-3">{c.name}</td><td className="p-3">{c.contact_email || "-"}</td><td className="p-3">{c.created_at ? new Date(c.created_at).toLocaleDateString() : "-"}</td><td className="p-3">{c.assigned_referrals}</td><td className="p-3">{c.reports_count}</td><td className="p-3"><Link href={`/ops/clinics/${c.id}`} className="text-blue-600 underline">Open</Link></td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
