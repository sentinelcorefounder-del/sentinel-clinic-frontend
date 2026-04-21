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
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="mb-2 text-sm font-medium text-slate-700">{title}</p>
      <p className="text-3xl font-bold text-slate-950">{value}</p>
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
      <main className="min-h-screen bg-slate-100 p-10">
        <p className="text-sm font-medium text-slate-700">Loading dashboard...</p>
      </main>
    );
  }

  if (error || !summary) {
    return (
      <main className="min-h-screen bg-slate-100 p-10">
        <p className="text-sm font-medium text-red-700">
          {error || "Dashboard unavailable."}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">Clinic Dashboard</h1>
          <p className="mt-1 text-slate-700">Clinic operations overview</p>
        </div>

        <div className="flex gap-3">
          <Link
            href="/patients"
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium !text-white hover:bg-slate-800"
          >
            Patients
          </Link>
          <Link
            href="/encounters"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
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