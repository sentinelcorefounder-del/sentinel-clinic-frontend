"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchHospitalDashboardSummary } from "@/lib/api";

type HospitalDashboardSummary = {
  total_patients: number;
  total_referrals: number;
  submitted: number;
  clinic_matched: number;
  completed: number;
  cancelled: number;
  payout_pending: number;
  payout_approved: number;
  payout_paid: number;
};

function StatCard({
  title,
  value,
  href,
}: {
  title: string;
  value: number;
  href?: string;
}) {
  const content = (
    <>
      <p className="mb-2 text-sm font-medium text-slate-700">{title}</p>
      <p className="text-3xl font-bold text-slate-950">{value}</p>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-400 hover:shadow"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {content}
    </div>
  );
}

export default function HospitalDashboardPage() {
  const [summary, setSummary] = useState<HospitalDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSummary() {
      try {
        const data = await fetchHospitalDashboardSummary();
        setSummary(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load hospital dashboard.");
      } finally {
        setLoading(false);
      }
    }

    loadSummary();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 p-10">
        <p className="text-sm font-medium text-slate-700">Loading hospital dashboard...</p>
      </main>
    );
  }

  if (error || !summary) {
    return (
      <main className="min-h-screen bg-slate-100 p-10">
        <p className="text-sm font-medium text-red-700">
          {error || "Hospital dashboard unavailable."}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-10 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">Hospital Dashboard</h1>
          <p className="mt-1 text-slate-700">
            Lean referral tracking for your hospital
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            href="/hospital/referrals/new"
            className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-medium !text-white hover:bg-blue-800"
          >
            New Referral
          </Link>
          <Link
            href="/hospital/referrals"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
          >
            View Referrals
          </Link>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Patients"
          value={summary.total_patients}
          href="/hospital/patients"
        />
        <StatCard title="Total Referrals" value={summary.total_referrals} />
        <StatCard title="Submitted" value={summary.submitted} />
        <StatCard title="Clinic Matched" value={summary.clinic_matched} />
        <StatCard title="Completed" value={summary.completed} />
        <StatCard title="Cancelled" value={summary.cancelled} />
        <StatCard title="Payout Pending" value={summary.payout_pending} />
        <StatCard title="Payout Approved" value={summary.payout_approved} />
        <StatCard title="Payout Paid" value={summary.payout_paid} />
      </section>
    </main>
  );
}