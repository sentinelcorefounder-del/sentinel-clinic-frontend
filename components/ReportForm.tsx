"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createReport, getReportPdfUrl, submitReportToOps } from "@/lib/api";
import { getMe, hasAnyRole, type CurrentUser } from "@/lib/auth";

type Props = {
  encounterId: number;
  patientId: number;
  patientConsentStatus: string;
  onReportCreated?: () => Promise<void> | void;
};

type CreatedReport = {
  id: number;
  report_id: string;
  report_status?: string;
};

const ALLOWED_REPORT_ROLES = ["reviewer", "clinic_admin", "super_admin"];
const ALLOWED_SUBMIT_TO_OPS_ROLES = ["reviewer", "clinic_admin", "super_admin"];

const VA_OPTIONS = [
  "",
  "6/4",
  "6/5",
  "6/6",
  "6/7.5",
  "6/9",
  "6/12",
  "6/15",
  "6/18",
  "6/24",
  "6/36",
  "6/60",
  "CF",
  "HM",
  "PL",
  "NPL",
];

const DR_GRADE_OPTIONS = [
  { value: "", label: "Not Recorded" },
  { value: "R0", label: "R0 - No DR" },
  { value: "R1", label: "R1 - Background DR" },
  { value: "R2", label: "R2 - Pre-proliferative DR" },
  { value: "R3A", label: "R3A - Active proliferative DR" },
  { value: "R3S", label: "R3S - Stable treated proliferative DR" },
  { value: "U", label: "Ungradable" },
];

const MACULOPATHY_OPTIONS = [
  { value: "", label: "Not Recorded" },
  { value: "M0", label: "M0 - No maculopathy" },
  { value: "M1", label: "M1 - Maculopathy" },
  { value: "U", label: "Ungradable" },
];

export default function ReportForm({
  encounterId,
  patientId,
  patientConsentStatus,
  onReportCreated,
}: Props) {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [createdReport, setCreatedReport] = useState<CreatedReport | null>(null);

  const [formData, setFormData] = useState({
    report_id: "",
    encounter: encounterId,
    patient: patientId,
    review_date: "",

    left_unaided_va: "",
    left_corrected_va: "",
    left_dr_grade: "",
    left_maculopathy_grade: "",

    right_unaided_va: "",
    right_corrected_va: "",
    right_dr_grade: "",
    right_maculopathy_grade: "",

    dr_grade: "",
    maculopathy_grade: "",

    ungradable: false,
    urgency_outcome: "routine_followup",
    recommendation: "",
    next_followup_interval: "",
    report_status: "draft",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [submittingToOps, setSubmittingToOps] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");

  useEffect(() => {
    async function loadUser() {
      try {
        const me = await getMe();
        setCurrentUser(me);
      } catch {
        setCurrentUser(null);
      } finally {
        setAuthLoading(false);
      }
    }

    loadUser();
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const fieldName = e.target.name;
    const value =
      fieldName === "ungradable"
        ? (e.target as HTMLInputElement).checked
        : e.target.value;

    setFormData((prev) => {
      const next = {
        ...prev,
        [fieldName]: value,
      };

      if (fieldName === "ungradable" && value === true) {
        next.urgency_outcome = "image_retake";
        next.left_dr_grade = "U";
        next.left_maculopathy_grade = "U";
        next.right_dr_grade = "U";
        next.right_maculopathy_grade = "U";
      }

      if (fieldName === "urgency_outcome" && value === "image_retake") {
        next.ungradable = true;
      }

      return next;
    });
  }

  function handleGeneratePdf() {
    if (!createdReport?.id) return;

    window.open(
      getReportPdfUrl(createdReport.id),
      "_blank",
      "noopener,noreferrer"
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setMessageType("info");
    setCreatedReport(null);

    const allowed = hasAnyRole(currentUser, ALLOWED_REPORT_ROLES);

    if (!allowed) {
      setMessageType("error");
      setMessage("You do not have permission to create reports.");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        ...formData,

        // Legacy whole-report fields for backwards compatibility.
        dr_grade:
          formData.right_dr_grade ||
          formData.left_dr_grade ||
          formData.dr_grade ||
          "",
        maculopathy_grade:
          formData.right_maculopathy_grade ||
          formData.left_maculopathy_grade ||
          formData.maculopathy_grade ||
          "",
      };

      const created = await createReport(payload);

      setCreatedReport({
        id: created.id,
        report_id: created.report_id,
        report_status: created.report_status,
      });

      setMessageType("success");
      setMessage("Report created successfully.");

      setFormData((prev) => ({
        ...prev,
        report_id: "",
        review_date: "",

        left_unaided_va: "",
        left_corrected_va: "",
        left_dr_grade: "",
        left_maculopathy_grade: "",

        right_unaided_va: "",
        right_corrected_va: "",
        right_dr_grade: "",
        right_maculopathy_grade: "",

        dr_grade: "",
        maculopathy_grade: "",

        recommendation: "",
        next_followup_interval: "",
        notes: "",
        report_status: "draft",
        urgency_outcome: "routine_followup",
        ungradable: false,
      }));

      if (onReportCreated) {
        await onReportCreated();
      }

      router.refresh();
    } catch (error) {
      const nextMessage =
        error instanceof Error ? error.message : "Failed to create report.";
      setMessageType("error");
      setMessage(nextMessage);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitToOps() {
    if (!createdReport?.id) return;

    const allowed = hasAnyRole(currentUser, ALLOWED_SUBMIT_TO_OPS_ROLES);

    if (!allowed) {
      setMessageType("error");
      setMessage("You do not have permission to submit reports to Ops.");
      return;
    }

    try {
      setSubmittingToOps(true);
      setMessage("");
      setMessageType("info");

      const response = await submitReportToOps(createdReport.id);

      setCreatedReport((prev) =>
        prev
          ? {
              ...prev,
              report_status: response.report_status ?? "submitted_to_ops",
            }
          : prev
      );

      setMessageType("success");
      setMessage("Report submitted to Ops successfully.");

      if (onReportCreated) {
        await onReportCreated();
      }

      router.refresh();
    } catch (error) {
      const nextMessage =
        error instanceof Error ? error.message : "Failed to submit report to Ops.";
      setMessageType("error");
      setMessage(nextMessage);
    } finally {
      setSubmittingToOps(false);
    }
  }

  if (authLoading) {
    return (
      <div className="space-y-2 rounded-lg border p-4">
        <h2 className="text-xl font-semibold">Create Structured Report</h2>
        <p className="text-sm text-gray-600">Checking permissions...</p>
      </div>
    );
  }

  const allowed = hasAnyRole(currentUser, ALLOWED_REPORT_ROLES);

  if (!allowed) {
    return (
      <div className="space-y-2 rounded-lg border bg-gray-50 p-4">
        <h2 className="text-xl font-semibold">Create Structured Report</h2>
        <p className="text-sm text-gray-600">
          You do not have permission to create or update reports.
        </p>
      </div>
    );
  }

  const consentComplete =
    (patientConsentStatus || "").trim().toLowerCase() === "completed";

  if (!consentComplete) {
    return (
      <div className="space-y-2 rounded-lg border border-amber-300 bg-amber-50 p-4">
        <h2 className="text-xl font-semibold">Create Structured Report</h2>
        <p className="text-sm text-amber-800">
          Report creation is blocked until patient consent is completed.
        </p>
        <p className="text-xs text-amber-700">
          Current consent status: {patientConsentStatus || "pending"}
        </p>
      </div>
    );
  }

  const canSubmitCreatedReportToOps =
    !!createdReport &&
    hasAnyRole(currentUser, ALLOWED_SUBMIT_TO_OPS_ROLES) &&
    ["draft", "under_review", "signed_off", undefined].includes(
      createdReport.report_status as
        | "draft"
        | "under_review"
        | "signed_off"
        | undefined
    );

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-xl font-semibold">Create Structured Report</h2>

        <input
          name="report_id"
          value={formData.report_id}
          onChange={handleChange}
          placeholder="Report ID"
          className="w-full rounded border p-3"
          required
        />

        <input
          name="review_date"
          type="date"
          value={formData.review_date}
          onChange={handleChange}
          className="w-full rounded border p-3"
          required
        />

        <div className="rounded-lg border bg-slate-50 p-4">
          <h3 className="mb-3 font-semibold">Left Eye</h3>

          <div className="grid gap-3 md:grid-cols-2">
            <SelectField
              label="Left Unaided VA"
              name="left_unaided_va"
              value={formData.left_unaided_va}
              onChange={handleChange}
              options={VA_OPTIONS.map((v) => ({ value: v, label: v || "Not Recorded" }))}
            />

            <SelectField
              label="Left Corrected / Pinhole VA"
              name="left_corrected_va"
              value={formData.left_corrected_va}
              onChange={handleChange}
              options={VA_OPTIONS.map((v) => ({ value: v, label: v || "Not Recorded" }))}
            />

            <SelectField
              label="Left DR Grade"
              name="left_dr_grade"
              value={formData.left_dr_grade}
              onChange={handleChange}
              options={DR_GRADE_OPTIONS}
            />

            <SelectField
              label="Left Maculopathy Grade"
              name="left_maculopathy_grade"
              value={formData.left_maculopathy_grade}
              onChange={handleChange}
              options={MACULOPATHY_OPTIONS}
            />
          </div>
        </div>

        <div className="rounded-lg border bg-slate-50 p-4">
          <h3 className="mb-3 font-semibold">Right Eye</h3>

          <div className="grid gap-3 md:grid-cols-2">
            <SelectField
              label="Right Unaided VA"
              name="right_unaided_va"
              value={formData.right_unaided_va}
              onChange={handleChange}
              options={VA_OPTIONS.map((v) => ({ value: v, label: v || "Not Recorded" }))}
            />

            <SelectField
              label="Right Corrected / Pinhole VA"
              name="right_corrected_va"
              value={formData.right_corrected_va}
              onChange={handleChange}
              options={VA_OPTIONS.map((v) => ({ value: v, label: v || "Not Recorded" }))}
            />

            <SelectField
              label="Right DR Grade"
              name="right_dr_grade"
              value={formData.right_dr_grade}
              onChange={handleChange}
              options={DR_GRADE_OPTIONS}
            />

            <SelectField
              label="Right Maculopathy Grade"
              name="right_maculopathy_grade"
              value={formData.right_maculopathy_grade}
              onChange={handleChange}
              options={MACULOPATHY_OPTIONS}
            />
          </div>
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="ungradable"
            checked={formData.ungradable}
            onChange={handleChange}
          />
          Ungradable / image retake required
        </label>

        <select
          name="urgency_outcome"
          value={formData.urgency_outcome}
          onChange={handleChange}
          className="w-full rounded border p-3"
        >
          <option value="routine_followup">Routine Follow-up</option>
          <option value="early_review">Early Review</option>
          <option value="urgent_referral">Urgent Referral</option>
          <option value="ophthalmology_required">Ophthalmology Required</option>
          <option value="image_retake">Image Retake</option>
        </select>

        <input
          name="next_followup_interval"
          value={formData.next_followup_interval}
          onChange={handleChange}
          placeholder="Next Follow-up Interval"
          className="w-full rounded border p-3"
        />

        <select
          name="report_status"
          value={formData.report_status}
          onChange={handleChange}
          className="w-full rounded border p-3"
        >
          <option value="draft">Draft</option>
          <option value="under_review">Under Review</option>
          <option value="signed_off">Signed Off</option>
          <option value="issued">Issued</option>
        </select>

        <textarea
          name="recommendation"
          value={formData.recommendation}
          onChange={handleChange}
          placeholder="Recommendation"
          className="w-full rounded border p-3"
          rows={4}
        />

        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Notes"
          className="w-full rounded border p-3"
          rows={4}
        />

        {message ? (
          <div
            className={`rounded-lg border p-3 text-sm font-medium ${
              messageType === "error"
                ? "border-red-200 bg-red-50 text-red-800"
                : messageType === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-slate-200 bg-slate-50 text-slate-700"
            }`}
          >
            {message}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-black px-4 py-3 text-white disabled:opacity-50"
          >
            {loading ? "Saving..." : "Create Report"}
          </button>

          {createdReport ? (
            <button
              type="button"
              onClick={handleGeneratePdf}
              className="rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700"
            >
              Generate PDF
            </button>
          ) : null}

          {canSubmitCreatedReportToOps ? (
            <button
              type="button"
              onClick={handleSubmitToOps}
              disabled={submittingToOps}
              className="rounded-lg bg-emerald-600 px-4 py-3 text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {submittingToOps ? "Submitting..." : "Submit to Ops"}
            </button>
          ) : null}
        </div>

        {createdReport ? (
          <div className="space-y-1">
            <p className="text-sm text-gray-600">
              PDF ready for report: {createdReport.report_id}
            </p>
            {createdReport.report_status ? (
              <p className="text-xs text-gray-500">
                Current workflow status: {createdReport.report_status}
              </p>
            ) : null}
          </div>
        ) : null}
      </form>
    </div>
  );
}

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="space-y-1 text-sm">
      <span className="font-medium">{label}</span>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded border bg-white p-3"
      >
        {options.map((option) => (
          <option key={`${name}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
