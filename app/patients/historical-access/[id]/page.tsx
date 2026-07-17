"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import HistoricalRecordsAccordion from "@/components/HistoricalRecordsAccordion";
import { fetchHistoricalRecords } from "@/lib/api";

export default function HistoricalRecordsPage() {
  const params = useParams();
  const id = String(params.id);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        setData(await fetchHistoricalRecords(id));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load historical records.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <main className="p-10">Loading historical records...</main>;
  if (error) return <main className="p-10 text-red-700">{error}</main>;
  if (!data) return <main className="p-10">Records unavailable.</main>;

  return (
    <main className="sentinel-page space-y-6">
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Read-only historical access</p>
        <h1 className="mt-1 text-2xl font-bold">{data.master_patient.name}</h1>
        <div className="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-1 font-mono text-sm font-semibold text-slate-800">
          {data.master_patient.sentinel_patient_id}
        </div>
        <p className="mt-3 text-xs text-amber-700">
          Every access is auditable and may expire or be revoked. Only records included in the approved scope are shown.
        </p>
      </div>

      <HistoricalRecordsAccordion reports={data.reports || []} images={data.images || []} />
    </main>
  );
}
