"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchDashboardSummary } from "@/lib/api";
import { DashboardSummary } from "@/types/dashboard";

function StatCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="border rounded-xl p-5 bg-white shadow-sm">
      <p className="text-sm text-gray-500 mb-2">{title}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSummary() {
      try {
        const data = await fetchDashboardSummary();
        setSummary(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load dashboard.");
      } finally {
        setLoading(false);
      }
    }

    loadSummary();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen p-10 bg-gray-50">
        <p className="text-sm text-gray-700">Loading dashboard...</p>
      </main>
    );
  }

  if (error || !summary) {
    return (
      <main className="min-h-screen p-10 bg-gray-50">
        <p className="text-sm text-red-600">
          {error || "Dashboard unavailable."}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-10 bg-gray-50">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Sentinel Dashboard</h1>
          <p className="text-gray-600 mt-1">Clinic operations overview</p>
        </div>

        <div className="flex gap-3">
          <Link
            href="/patients"
            className="rounded-lg bg-black text-white px-4 py-2"
          >
            Patients
          </Link>
          <Link
            href="/encounters"
            className="rounded-lg border px-4 py-2"
          >
            Encounters
          </Link>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard title="Total Patients" value={summary.total_patients} />
        <StatCard title="Total Encounters" value={summary.total_encounters} />
        <StatCard title="Total Uploads" value={summary.total_uploads} />
        <StatCard title="Total Reports" value={summary.total_reports} />
        <StatCard title="Total Consents" value={summary.total_consents} />
        <StatCard
          title="Encounters Pending Review"
          value={summary.encounters_pending_review}
        />
        <StatCard
          title="Completed Encounters"
          value={summary.completed_encounters}
        />
      </section>
    </main>
  );
}