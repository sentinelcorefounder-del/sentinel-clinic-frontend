import Link from "next/link";
import EncountersTable from "@/components/EncountersTable";

export default function EncountersPage() {
  return (
    <main className="p-10">
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Screening Encounters</h1>
          <p className="text-sm text-gray-600 mt-1">
            Create and manage screening encounters for patients already assigned
            through Sentinel Ops.
          </p>
        </div>

        <Link
          href="/encounters/new"
          className="rounded-lg bg-black text-white px-4 py-2"
        >
          Create Encounter
        </Link>
      </div>

      <EncountersTable />
    </main>
  );
}