"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  approveAndIssueOpsReport,
  fetchOpsReport,
  rejectOpsReport,
  returnOpsReport,
} from "@/lib/api";
import ReportFormatMenu from "@/components/ReportFormatMenu";

export default function OpsReportReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [id, setId] = useState("");
  const [report, setReport] = useState<any>(null);
  const [note, setNote] = useState("");
  const [signature, setSignature] = useState({
    signer_name: "",
    signer_role: "",
    signer_registration_number: "",
  });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function load(reportId: string) {
    const data = await fetchOpsReport(reportId);
    setReport(data);
  }

  useEffect(() => {
    params.then(({ id }) => {
      setId(id);
      load(id).catch((error) =>
        setMessage(
          error instanceof Error ? error.message : "Failed to load report."
        )
      );
    });
  }, [params]);

  async function act(kind: "return" | "issue" | "reject") {
    try {
      setBusy(true);
      setMessage("");

      if (kind === "return") {
        await returnOpsReport(id, note);
      }

      if (kind === "issue") {
        if (
          !signature.signer_name.trim() ||
          !signature.signer_role.trim() ||
          !signature.signer_registration_number.trim()
        ) {
          throw new Error(
            "Clinician name, professional role and registration number are required."
          );
        }

        const confirmed = window.confirm(
          [
            "Approve, sign and issue this report?",
            "",
            "After issue:",
            "• The report will become read-only.",
            "• The electronic signature will be permanently recorded.",
            "• The final PDF will show the Sentinel reviewer's details.",
            "",
            "Continue?",
          ].join("\n")
        );

        if (!confirmed) {
          return;
        }

        await approveAndIssueOpsReport(id, note, signature);
      }

      if (kind === "reject") {
        await rejectOpsReport(id, note);
      }

      await load(id);
      setNote("");

      if (kind === "issue") {
        setSignature({
          signer_name: "",
          signer_role: "",
          signer_registration_number: "",
        });
      }

      setMessage(
        kind === "return"
          ? "Report returned to clinic."
          : kind === "issue"
            ? "Report approved and issued."
            : "Report rejected."
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Report action failed."
      );
    } finally {
      setBusy(false);
    }
  }

  if (!report) {
    return <main className="p-8">{message || "Loading report..."}</main>;
  }

  const canReview = report.report_status === "submitted_to_ops";
  const canIssue = ["submitted_to_ops", "ops_rejected"].includes(
    report.report_status || ""
  );

  const issueDisabled =
    busy ||
    !canIssue ||
    !signature.signer_name.trim() ||
    !signature.signer_role.trim() ||
    !signature.signer_registration_number.trim();

  return (
    <main className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Report Review</h1>
          <p className="text-slate-500">{report.report_id}</p>
        </div>

        <Link href="/ops/reports" className="rounded border bg-white px-4 py-2">
          Back to Queue
        </Link>
      </div>

      {message ? (
        <div className="rounded border bg-white p-3 text-sm">
          {message}
        </div>
      ) : null}

      {report.report_status === "issued" ? (
        <section className="rounded-xl border border-emerald-300 bg-emerald-50 p-5 text-emerald-950 shadow-sm">
          <h2 className="text-lg font-bold">
            Report Issued by Sentinel
          </h2>
          <p className="mt-1 text-sm">
            This report has been electronically signed and is now
            read-only.
          </p>

          <div className="mt-4 grid gap-2 text-sm md:grid-cols-2">
            <p>
              <strong>Clinician:</strong>{" "}
              {report.signer_name ||
                report.signed_by_display ||
                "-"}
            </p>
            <p>
              <strong>Professional role:</strong>{" "}
              {report.signer_role || "-"}
            </p>
            <p>
              <strong>Registration number:</strong>{" "}
              {report.signer_registration_number || "-"}
            </p>
            <p>
              <strong>Issued:</strong>{" "}
              {report.signed_at || report.issued_at || "-"}
            </p>
          </div>
        </section>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Patient">
          <p>{report.patient_name}</p>
          <p>Sentinel ID: {report.sentinel_patient_id || report.patient?.sentinel_patient_id || "Identity pending"}</p>
          <p>Local ID: {report.patient_id_display}</p>
          <p>Encounter: {report.encounter_id_display}</p>
        </Card>

        <Card title="Referral">
          <p>Hospital: {report.referral?.source_hospital_name || "-"}</p>
          <p>
            Clinic: {report.referral?.matched_clinic_name || report.clinic_name || "-"}
          </p>
          <p>
            Payment: {report.referral?.payment_status || report.payment_status || "-"}
          </p>
        </Card>

        <Card title="Status">
          <p>{String(report.report_status).replaceAll("_", " ")}</p>
          <p>Submitted: {report.submitted_to_ops_at || "-"}</p>
          <p>Resubmissions: {report.resubmission_count || 0}</p>
        </Card>
      </div>

      <section className="rounded-xl bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-bold">Clinical Report</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <Eye title="Left Eye" dr={report.left_dr_grade} mac={report.left_maculopathy_grade} />
          <Eye title="Right Eye" dr={report.right_dr_grade} mac={report.right_maculopathy_grade} />
        </div>

        <div className="mt-4 space-y-2 text-sm">
          <p><strong>Outcome:</strong> {report.urgency_outcome || "-"}</p>
          <p><strong>Recommendation:</strong> {report.recommendation || "-"}</p>
          <p><strong>Notes:</strong> {report.notes || "-"}</p>
          <p><strong>Return reason:</strong> {report.return_reason || "-"}</p>
        </div>

<div className="mt-4"><ReportFormatMenu reportId={report.id} role="ops" /></div>
      </section>

      <section className="rounded-xl bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-bold">Fundus Images</h2>

        {!report.images?.length ? (
          <p>No images found.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {report.images.map((image: any) => (
              <a
                key={image.id}
                href={image.url}
                target="_blank"
                rel="noreferrer"
                className="rounded border p-3"
              >
                <img
                  src={image.url}
                  alt={`${image.eye_laterality} fundus`}
                  className="w-full rounded"
                />
                <p className="mt-2 text-sm">
                  {image.eye_laterality} eye · {image.image_quality}
                </p>
                <p className="text-sm">
                  AI: {image.ai_prediction || "Not available"}
                </p>
              </a>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-bold">Review Action</h2>

        {!canReview && !canIssue ? (
          <div className="mb-4 rounded-lg border border-slate-300 bg-slate-100 p-3 text-sm text-slate-700">
            This report is currently{" "}
            <strong>{String(report.report_status).replaceAll("_", " ")}</strong>.
            Review actions are no longer available.
          </div>
        ) : null}

        {canIssue ? (
          <div className="mb-5 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <h3 className="font-semibold text-blue-950">
              Clinical Sign-off
            </h3>

            <p className="mt-1 text-sm text-blue-900">
              The Sentinel clinician reviewing this report must enter
              their professional details before final issue.
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <input
                type="text"
                value={signature.signer_name}
                onChange={(event) =>
                  setSignature((current) => ({
                    ...current,
                    signer_name: event.target.value,
                  }))
                }
                placeholder="Clinician full name"
                className="rounded border bg-white px-3 py-2"
                disabled={busy}
              />

              <input
                type="text"
                value={signature.signer_role}
                onChange={(event) =>
                  setSignature((current) => ({
                    ...current,
                    signer_role: event.target.value,
                  }))
                }
                placeholder="Professional role"
                className="rounded border bg-white px-3 py-2"
                disabled={busy}
              />

              <input
                type="text"
                value={signature.signer_registration_number}
                onChange={(event) =>
                  setSignature((current) => ({
                    ...current,
                    signer_registration_number:
                      event.target.value,
                  }))
                }
                placeholder="Registration number"
                className="rounded border bg-white px-3 py-2"
                disabled={busy}
              />
            </div>
          </div>
        ) : null}

        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={4}
          placeholder="Reviewer note or required correction"
          className="w-full rounded border px-3 py-2"
          disabled={busy || (!canReview && !canIssue)}
        />

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3" style={{ display: "grid" }}>
          <button
            type="button"
            disabled={busy || !canReview || !note.trim()}
            onClick={() => act("return")}
            style={{
              display: "block",
              backgroundColor: "#d97706",
              color: "#ffffff",
              border: "2px solid #92400e",
              borderRadius: "8px",
              padding: "12px 18px",
              fontWeight: 700,
              cursor: busy || !canReview || !note.trim() ? "not-allowed" : "pointer",
              opacity: busy || !canReview || !note.trim() ? 0.45 : 1,
            }}
          >
            Return to Clinic
          </button>

          <button
            type="button"
            disabled={busy || !canReview || !note.trim()}
            onClick={() => act("reject")}
            style={{
              display: "block",
              backgroundColor: "#b91c1c",
              color: "#ffffff",
              border: "2px solid #7f1d1d",
              borderRadius: "8px",
              padding: "12px 18px",
              fontWeight: 700,
              cursor: busy || !canReview || !note.trim() ? "not-allowed" : "pointer",
              opacity: busy || !canReview || !note.trim() ? 0.45 : 1,
            }}
          >
            Reject Report
          </button>

          <button
            type="button"
            disabled={issueDisabled}
            onClick={() => act("issue")}
            style={{
              display: "block",
              backgroundColor: "#047857",
              color: "#ffffff",
              border: "2px solid #064e3b",
              borderRadius: "8px",
              padding: "12px 18px",
              fontWeight: 700,
              cursor: issueDisabled ? "not-allowed" : "pointer",
              opacity: issueDisabled ? 0.45 : 1,
            }}
          >
            {busy ? "Processing..." : "Approve, Sign and Issue"}
          </button>
        </div>
      </section>

      <section className="rounded-xl bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-bold">Report Timeline</h2>

        {!report.status_events?.length ? (
          <p>No timeline entries yet.</p>
        ) : (
          <div className="space-y-3">
            {report.status_events.map((event: any) => (
              <div key={event.id} className="rounded border p-3 text-sm">
                <p className="font-semibold">
                  {String(event.event_type).replaceAll("_", " ")}
                </p>
                <p>{event.actor_display} · {event.created_at}</p>
                {event.note ? (
                  <p className="mt-1 text-slate-600">{event.note}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-white p-5 shadow">
      <h2 className="mb-2 font-bold">{title}</h2>
      <div className="space-y-1 text-sm">{children}</div>
    </div>
  );
}

function Eye({
  title,
  dr,
  mac,
}: {
  title: string;
  dr?: string;
  mac?: string;
}) {
  return (
    <div className="rounded border bg-slate-50 p-4">
      <h3 className="font-bold">{title}</h3>
      <p>DR: {dr || "-"}</p>
      <p>Maculopathy: {mac || "-"}</p>
    </div>
  );
}