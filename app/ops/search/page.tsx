import Link from "next/link";
import { serverFetch } from "@/lib/server-api";

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function text(value: unknown, fallback = "—") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

async function safeFetch(path: string) {
  try {
    const result = await serverFetch(path);
    return Array.isArray(result) ? result : result?.results || [];
  } catch {
    return [];
  }
}

export default async function OpsSearchPage({ searchParams }: Props) {
  const params = (await searchParams) || {};
  const query = valueOf(params.q).trim();

  const encoded = encodeURIComponent(query);
  const [patients, reports] = query
    ? await Promise.all([
        safeFetch(`/api/ops/patients/?search=${encoded}`),
        safeFetch(`/api/ops/reports/approval-queue/?status=all&search=${encoded}`),
      ])
    : [[], []];

  const total = patients.length + reports.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Global Search</h1>
        <p className="mt-1 text-slate-600">
          Find records using a Sentinel Patient ID, local patient ID, patient name, referral ID or report ID.
        </p>
      </div>

      <form action="/ops/search" method="get" className="flex flex-col gap-3 rounded-2xl border bg-white p-5 shadow-sm sm:flex-row">
        <input
          autoFocus
          name="q"
          defaultValue={query}
          placeholder="Example: SNT-PAT-00001234, REF-1024 or RPT-2048"
          className="min-w-0 flex-1 rounded-xl border px-4 py-3"
        />
        <button className="rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-slate-800">
          Search Sentinel
        </button>
      </form>

      {!query ? (
        <section className="rounded-2xl border border-dashed bg-white p-8 text-center text-slate-500">
          Enter an identifier or patient name to begin.
        </section>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-950">{total}</span> result{total === 1 ? "" : "s"} for “{query}”
            </p>
            <div className="flex gap-2 text-sm">
              <Link href={`/ops/patients?search=${encoded}`} className="rounded-lg border bg-white px-3 py-2 font-semibold text-blue-700">Open patient registry</Link>
              <Link href={`/ops/reports?status=all&search=${encoded}`} className="rounded-lg border bg-white px-3 py-2 font-semibold text-blue-700">Open reports queue</Link>
            </div>
          </div>

          <section className="rounded-2xl border bg-white shadow-sm">
            <div className="border-b px-5 py-4">
              <h2 className="text-lg font-bold">Patients and Referrals</h2>
              <p className="text-sm text-slate-500">Matches from the global Ops patient registry.</p>
            </div>
            {!patients.length ? (
              <p className="p-6 text-sm text-slate-500">No matching patients or referrals.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr><th className="p-3">Patient</th><th className="p-3">Sentinel ID</th><th className="p-3">Hospital</th><th className="p-3">Clinic</th><th className="p-3">Referral</th><th className="p-3">Open</th></tr>
                  </thead>
                  <tbody>
                    {patients.slice(0, 25).map((patient: any) => (
                      <tr key={patient.id} className="border-t align-top">
                        <td className="p-3"><p className="font-semibold">{text(patient.name || patient.patient_name)}</p><p className="text-xs text-slate-500">{text(patient.patient_id, "")}</p></td>
                        <td className="p-3 font-mono text-xs">{text(patient.sentinel_patient_id, "Not assigned")}</td>
                        <td className="p-3">{text(patient.source_hospital)}</td>
                        <td className="p-3">{text(patient.assigned_clinic)}</td>
                        <td className="p-3">{text(patient.referral_id || patient.referral_status)}</td>
                        <td className="p-3"><Link href={`/ops/patients/${patient.id}`} className="font-semibold text-blue-700 underline">Open patient</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-2xl border bg-white shadow-sm">
            <div className="border-b px-5 py-4">
              <h2 className="text-lg font-bold">Reports</h2>
              <p className="text-sm text-slate-500">Matches from all Sentinel Ops report statuses.</p>
            </div>
            {!reports.length ? (
              <p className="p-6 text-sm text-slate-500">No matching reports.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr><th className="p-3">Report</th><th className="p-3">Patient</th><th className="p-3">Sentinel ID</th><th className="p-3">Hospital</th><th className="p-3">Clinic</th><th className="p-3">Status</th><th className="p-3">Open</th></tr>
                  </thead>
                  <tbody>
                    {reports.slice(0, 25).map((report: any) => (
                      <tr key={report.id} className="border-t align-top">
                        <td className="p-3 font-semibold">{text(report.report_id || report.id)}</td>
                        <td className="p-3">{text(report.patient_name)}</td>
                        <td className="p-3 font-mono text-xs">{text(report.sentinel_patient_id || report.patient_id, "Not assigned")}</td>
                        <td className="p-3">{text(report.source_hospital_name)}</td>
                        <td className="p-3">{text(report.clinic_name)}</td>
                        <td className="p-3 capitalize">{text(report.report_status).replaceAll("_", " ")}</td>
                        <td className="p-3"><Link href={`/ops/reports/${report.id}`} className="font-semibold text-blue-700 underline">Open report</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
