import Link from "next/link";
import { serverFetch } from "@/lib/server-api";

type Props = { searchParams?: Promise<Record<string, string | string[] | undefined>> };
type QueueRow = {
  kind: "diabetic" | "eye_health" | "ocular";
  id: number;
  encounter_id: number;
  encounter_reference: string;
  patient_id: number;
  patient_reference: string;
  patient_name: string;
  clinic_name: string;
  hospital_name: string;
  status: string;
  submitted_at?: string | null;
  signer_snapshot?: Record<string, unknown>;
};

function valueOf(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] || "" : value || ""; }
function badgeClass(status: string) {
  const value = (status || "").toLowerCase();
  if (["issued", "approved", "ops_approved"].includes(value)) return "bg-emerald-100 text-emerald-800";
  if (["submitted_to_ops", "awaiting_ops", "pending", "under_review"].includes(value)) return "bg-amber-100 text-amber-800";
  if (["ops_rejected", "returned_to_clinic", "rejected"].includes(value)) return "bg-red-100 text-red-800";
  return "bg-slate-100 text-slate-700";
}
function label(value: string) { return (value || "-").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function reviewHref(row: QueueRow) {
  if (row.kind === "eye_health") return `/ops/reports/eye-health/${row.id}`;
  if (row.kind === "ocular") return `/ops/reports/ocular/${row.encounter_id}`;
  return `/ops/reports/${row.id}`;
}

export default async function OpsReportsPage({ searchParams }: Props) {
  const params = (await searchParams) || {};
  const status = valueOf(params.status) || "awaiting_ops";
  const search = valueOf(params.search);
  const ordering = valueOf(params.ordering) || "-submitted_at";
  const qs = new URLSearchParams(); qs.set("status", status); qs.set("ordering", ordering); if (search) qs.set("search", search);
  const reports = await serverFetch(`/api/ops/clinical-reports/?${qs.toString()}`) as QueueRow[];

  return <div className="space-y-6">
    <div><h1 className="text-3xl font-bold">Ops Clinical Reports Queue</h1><p className="mt-1 text-slate-600">One review queue across diabetic retinal, retinal/glaucoma-risk, combined report components and comprehensive ocular reports.</p></div>
    <form className="grid gap-3 rounded-xl bg-white p-4 shadow md:grid-cols-5">
      <input name="search" defaultValue={search} placeholder="Patient, encounter or report" className="rounded border px-3 py-2 text-sm md:col-span-2" />
      <select name="status" defaultValue={status} className="rounded border px-3 py-2 text-sm"><option value="awaiting_ops">Awaiting Ops review</option><option value="issued">Issued</option><option value="returned_to_clinic">Returned to clinic</option><option value="all">All statuses</option></select>
      <select name="ordering" defaultValue={ordering} className="rounded border px-3 py-2 text-sm"><option value="-submitted_at">Newest submitted</option><option value="submitted_at">Oldest submitted</option><option value="name">Patient A–Z</option><option value="-name">Patient Z–A</option><option value="clinic">Clinic A–Z</option><option value="status">Status A–Z</option></select>
      <button className="rounded bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Apply filters</button>
    </form>
    <section className="overflow-hidden rounded-xl bg-white shadow">
      {!reports.length ? <p className="p-6 text-sm text-slate-500">No clinical reports found.</p> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-100 text-left"><tr><th className="p-3">Portfolio</th><th className="p-3">Patient</th><th className="p-3">Encounter</th><th className="p-3">Hospital</th><th className="p-3">Clinic</th><th className="p-3">Status</th><th className="p-3">Submitted</th><th className="p-3">Review</th></tr></thead><tbody>{reports.map((row) => <tr key={`${row.kind}-${row.id}`} className="border-t"><td className="p-3 font-medium">{row.kind === "diabetic" ? "Diabetic retinal" : row.kind === "eye_health" ? "Retinal / glaucoma-risk assessment" : "Comprehensive ocular"}</td><td className="p-3"><Link href={`/ops/patients/${row.patient_id}`} className="text-blue-700 underline">{row.patient_name}</Link><div className="text-xs text-slate-500">{row.patient_reference}</div></td><td className="p-3">{row.encounter_reference}</td><td className="p-3">{row.hospital_name || "-"}</td><td className="p-3">{row.clinic_name || "-"}</td><td className="p-3"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${badgeClass(row.status)}`}>{label(row.status)}</span></td><td className="p-3">{row.submitted_at ? new Date(row.submitted_at).toLocaleString() : "-"}</td><td className="p-3"><Link href={reviewHref(row)} className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold !text-white">Open review</Link></td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}
