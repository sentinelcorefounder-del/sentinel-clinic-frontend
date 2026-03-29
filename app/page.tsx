import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen p-10">
      <h1 className="text-3xl font-bold mb-6">Sentinel Clinic Portal</h1>
      <p className="mb-6 text-gray-600">
        MVP frontend for patients and screening encounters.
      </p>

      <div className="flex gap-4">
        <Link
          href="/patients"
          className="rounded-lg bg-black text-white px-4 py-2"
        >
          View Patients
        </Link>

        <Link
          href="/encounters"
          className="rounded-lg border px-4 py-2"
        >
          View Encounters
        </Link>
      </div>
    </main>
  );
}