"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  approveAndIssueOpsReport,
  fetchOpsReport,
  rejectOpsReport,
  returnOpsReport,
} from "@/lib/api";

export default function OpsReportReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [id, setId] = useState("");
  const [report, setReport] = useState<any>(null);
  const [note, setNote] = useState("");
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
        await approveAndIssueOpsReport(id, note);
      }

      if (kind === "reject") {
        await rejectOpsReport(id, note);
      }

      await load(id);
      setNote("");

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
        <div className="rounded border bg-white p-3 text-sm">{message}</div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Patient">
          <p>{report.patient_name}</p>
          <p>{report.patient_id_display}</p>
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

        {report.report_pdf_url ? (
          <a
            href={report.report_pdf_url}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-block text-blue-700 underline"
          >
            Open Clinical PDF
          </a>
        ) : null}
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

        {!canReview ? (
          <div className="mb-4 rounded-lg border border-slate-300 bg-slate-100 p-3 text-sm text-slate-700">
            This report is currently{" "}
            <strong>{String(report.report_status).replaceAll("_", " ")}</strong>.
            Review actions are available only while a report is submitted to Ops.
          </div>
        ) : null}

        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={4}
          placeholder="Reviewer note or required correction"
          className="w-full rounded border px-3 py-2"
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
            disabled={busy || !canIssue}
            onClick={() => act("issue")}
            style={{
              display: "block",
              backgroundColor: "#047857",
              color: "#ffffff",
              border: "2px solid #064e3b",
              borderRadius: "8px",
              padding: "12px 18px",
              fontWeight: 700,
              cursor: busy || !canIssue ? "not-allowed" : "pointer",
              opacity: busy || !canIssue ? 0.45 : 1,
            }}
          >
            Approve and Issue
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