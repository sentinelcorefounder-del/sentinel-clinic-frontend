"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchHospitalReportById } from "@/lib/api";
import ReportFormatMenu from "@/components/ReportFormatMenu";

export default function HospitalReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    params.then(({ id }) => fetchHospitalReportById(id).then(setReport).catch((e) => setError(e.message)));
  }, [params]);

  if (error) return <main className="p-10 text-red-700">{error}</main>;
  if (!report) return <main className="p-10">Loading report...</main>;

  return (
    <main className="sentinel-page space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div><h1 className="text-2xl font-bold">Issued Report</h1><p className="text-slate-600">{report.report_id}</p></div>
        <Link href="/hospital/reports" className="rounded border bg-white px-4 py-2">Back to Reports</Link>
      </div>
      <section className="grid gap-4 rounded-xl border bg-white p-6 md:grid-cols-3">
        <Info label="Patient" value={report.patient_name} />
        <Info label="Sentinel Patient ID" value={report.sentinel_patient_id || report.patient?.sentinel_patient_id || "Identity pending"} />
        <Info label="Local Patient ID" value={report.patient_id} />
        <Info label="Referral ID" value={report.referral_id} />
        <Info label="Clinic" value={report.clinic_name || "-"} />
        <Info label="Review date" value={report.review_date || "-"} />
        <Info label="Issued" value={report.issued_at || "-"} />
      </section>
      <section className="rounded-xl border bg-white p-6">
        <h2 className="mb-4 text-xl font-semibold">Clinical Summary</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded border bg-slate-50 p-4"><strong>Left Eye</strong><p>DR: {report.left_dr_grade || "-"}</p><p>Maculopathy: {report.left_maculopathy_grade || "-"}</p></div>
          <div className="rounded border bg-slate-50 p-4"><strong>Right Eye</strong><p>DR: {report.right_dr_grade || "-"}</p><p>Maculopathy: {report.right_maculopathy_grade || "-"}</p></div>
        </div>
        <p className="mt-4"><strong>Outcome:</strong> {report.urgency_outcome?.replaceAll("_", " ") || "-"}</p>
        <p className="mt-2"><strong>Recommendation:</strong> {report.recommendation || "-"}</p>
        <p className="mt-2"><strong>Follow-up:</strong> {report.next_followup_interval || "-"}</p>
        <div className="mt-5"><ReportFormatMenu reportId={report.id} role="hospital" /></div>
      </section>
      <section className="rounded-xl border bg-white p-6">
        <h2 className="mb-4 text-xl font-semibold">Fundus Images</h2>
        {!report.images?.length ? <p>No images available.</p> : <div className="grid gap-4 md:grid-cols-2">{report.images.map((img: any) => <a key={img.id} href={img.url} target="_blank" rel="noreferrer" className="rounded border p-3"><img src={img.url} alt={`${img.eye_laterality} fundus`} className="w-full rounded" /><p className="mt-2 text-sm">{img.eye_laterality} eye · {img.image_quality}</p></a>)}</div>}
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs uppercase text-slate-500">{label}</p><p className="font-medium">{value}</p></div>;
}
