import Link from "next/link";
import EncountersTable from "@/components/EncountersTable";

export default function EncountersPage() {
  return (
    <main className="min-h-screen bg-slate-100 p-10">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Screening Encounters</h1>
          <p className="mt-1 text-sm text-slate-700">
            Create and manage screening encounters for patients already assigned
            through Sentinel Ops.
          </p>
        </div>

        <Link
          href="/encounters/new"
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium !text-white hover:bg-slate-800"
        >
          Create Encounter
        </Link>
      </div>

      <EncountersTable />
    </main>
  );
}