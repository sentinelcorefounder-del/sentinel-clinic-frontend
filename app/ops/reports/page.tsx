import Link from "next/link";
import { serverFetch } from "@/lib/server-api";
import ReportFormatMenu from "@/components/ReportFormatMenu";

type Props = {
  searchParams?: Promise<
    Record<string, string | string[] | undefined>
  >;
};

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function buildQuery(params: Record<string, string>) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

function badgeClass(status: string) {
  const normalized = (status || "").toLowerCase();

  if (
    ["issued", "paid", "ops_approved"].includes(normalized)
  ) {
    return "bg-emerald-100 text-emerald-800";
  }

  if (
    ["submitted_to_ops", "pending", "under_review"].includes(
      normalized
    )
  ) {
    return "bg-amber-100 text-amber-800";
  }

  if (
    ["ops_rejected", "returned_to_clinic", "failed", "exception"].includes(
      normalized
    )
  ) {
    return "bg-red-100 text-red-800";
  }

  return "bg-slate-100 text-slate-700";
}

function Badge({ value }: { value: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${badgeClass(
        value
      )}`}
    >
      {(value || "-").replaceAll("_", " ")}
    </span>
  );
}

export default async function OpsReportsPage({
  searchParams,
}: Props) {
  const params = (await searchParams) || {};

  const status = valueOf(params.status) || "submitted_to_ops";
  const search = valueOf(params.search);
  const hospital = valueOf(params.hospital);
  const clinic = valueOf(params.clinic);

  const reports = await serverFetch(
    `/api/ops/reports/approval-queue/${buildQuery({
      status,
      search,
      hospital,
      clinic,
    })}`
  );

  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold">
        Ops Reports Queue
      </h1>

      <p className="mb-6 text-slate-500">
        Clinic-submitted reports appear here for Sentinel Ops
        review and issue.
      </p>

      <form className="mb-6 grid grid-cols-1 gap-3 rounded-xl bg-white p-4 shadow md:grid-cols-5">
        <input
          name="search"
          defaultValue={search}
          placeholder="Search patient, report, referral"
          className="rounded border px-3 py-2 text-sm md:col-span-2"
        />

        <select
          name="status"
          defaultValue={status}
          className="rounded border px-3 py-2 text-sm"
        >
          <option value="submitted_to_ops">
            Submitted to Ops
          </option>
          <option value="returned_to_clinic">
            Returned to Clinic
          </option>
          <option value="issued">Issued</option>
          <option value="ops_rejected">Rejected</option>
          <option value="under_review">Under Review</option>
          <option value="all">All Statuses</option>
        </select>

        <input
          name="hospital"
          defaultValue={hospital}
          placeholder="Hospital name or code"
          className="rounded border px-3 py-2 text-sm"
        />

        <input
          name="clinic"
          defaultValue={clinic}
          placeholder="Clinic name or code"
          className="rounded border px-3 py-2 text-sm"
        />

        <button className="rounded bg-slate-950 px-4 py-2 text-sm font-semibold text-white md:col-span-5">
          Apply Filters
        </button>
      </form>

      <section className="rounded-xl bg-white p-6 shadow">
        {reports.length === 0 ? (
          <p className="text-sm text-slate-500">
            No reports found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-left">
                <tr>
                  <th className="p-3">Report ID</th>
                  <th className="p-3">Patient</th>
                  <th className="p-3">Hospital</th>
                  <th className="p-3">Clinic</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3">Submitted</th>
                  <th className="p-3">Review</th>
                  <th className="p-3">PDF</th>
                </tr>
              </thead>

              <tbody>
                {reports.map((report: any) => (
                  <tr key={report.id} className="border-t">
                    <td className="p-3 font-medium">
                      {report.report_id}
                    </td>

                    <td className="p-3">
                      <Link
                        href={`/ops/patients/${report.patient}`}
                        className="text-blue-700 underline"
                      >
                        {report.patient_name || "Open patient"}
                      </Link>
                      <div className="mt-1 font-mono text-xs text-slate-500">{report.sentinel_patient_id || report.patient_id || report.patient}</div>
                    </td>

                    <td className="p-3">
                      {report.source_hospital_name || "-"}
                    </td>

                    <td className="p-3">
                      {report.clinic_name || "-"}
                    </td>

                    <td className="p-3">
                      <Badge value={report.report_status} />
                    </td>

                    <td className="p-3">
                      <Badge
                        value={
                          report.payment_status || "not_created"
                        }
                      />
                    </td>

                    <td className="p-3">
                      {report.submitted_to_ops_at || "-"}
                    </td>

                    <td className="p-3">
                      <Link
                        href={`/ops/reports/${report.id}`}
                        className="inline-flex rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold !text-white hover:bg-slate-800"
                      >
                        Open Review
                      </Link>
                    </td>

                    <td className="p-3"><ReportFormatMenu reportId={report.id} role="ops" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}