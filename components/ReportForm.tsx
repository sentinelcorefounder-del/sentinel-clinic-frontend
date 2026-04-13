"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createReport } from "@/lib/api";
import { getMe, hasAnyRole, type CurrentUser } from "@/lib/auth";

type Props = {
  encounterId: number;
  patientId: number;
  patientConsentStatus: string;
};

type CreatedReport = {
  id: number;
  report_id: string;
};

const ALLOWED_REPORT_ROLES = ["reviewer", "clinic_admin", "super_admin"];

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function ReportForm({
  encounterId,
  patientId,
  patientConsentStatus,
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
  const [message, setMessage] = useState("");

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

      // If marked ungradable, force retake outcome
      if (fieldName === "ungradable" && value === true) {
        next.urgency_outcome = "image_retake";
      }

      // If retake outcome chosen, force ungradable true
      if (fieldName === "urgency_outcome" && value === "image_retake") {
        next.ungradable = true;
      }

      // Optional: if user changes outcome away from image_retake,
      // do not auto-uncheck ungradable, let them decide manually.
      return next;
    });
  }

  function handleGeneratePdf() {
    if (!createdReport?.id) return;

    window.open(
      `${API_BASE}/api/reports/${createdReport.id}/pdf/`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setCreatedReport(null);

    const allowed = hasAnyRole(currentUser, ALLOWED_REPORT_ROLES);

    if (!allowed) {
      setMessage("You do not have permission to create reports.");
      setLoading(false);
      return;
    }

    try {
      const created = await createReport(formData);

      setCreatedReport({
        id: created.id,
        report_id: created.report_id,
      });

      setMessage("Report created successfully.");

      setFormData((prev) => ({
        ...prev,
        report_id: "",
        review_date: "",
        dr_grade: "",
        maculopathy_grade: "",
        recommendation: "",
        next_followup_interval: "",
        notes: "",
      }));

      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create report.";
      setMessage(message);
    } finally {
      setLoading(false);
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
        <p className="text-xs text-gray-500">
          Allowed roles: reviewer, clinic_admin, super_admin
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

        <input
          name="dr_grade"
          value={formData.dr_grade}
          onChange={handleChange}
          placeholder="DR Grade"
          className="w-full rounded border p-3"
        />

        <input
          name="maculopathy_grade"
          value={formData.maculopathy_grade}
          onChange={handleChange}
          placeholder="Maculopathy Grade"
          className="w-full rounded border p-3"
        />

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="ungradable"
            checked={formData.ungradable}
            onChange={handleChange}
          />
          Ungradable
        </label>

                <p className="text-xs text-gray-500">
          If no usable image is available, the report will be marked for image retake.
        </p>

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

        {message && <p className="text-sm">{message}</p>}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-black px-4 py-3 text-white"
          >
            {loading ? "Saving..." : "Create Report"}
          </button>

          {createdReport && (
            <button
              type="button"
              onClick={handleGeneratePdf}
              className="rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700"
            >
              Generate PDF
            </button>
          )}
        </div>

        {createdReport && (
          <p className="text-sm text-gray-600">
            PDF ready for report: {createdReport.report_id}
          </p>
        )}
      </form>
    </div>
  );
}