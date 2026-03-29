"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createReport } from "@/lib/api";
import { getMe, hasAnyRole, type CurrentUser } from "@/lib/auth";

type Props = {
  encounterId: number;
  patientId: number;
};

const ALLOWED_REPORT_ROLES = ["reviewer", "clinic_admin", "super_admin"];

export default function ReportForm({ encounterId, patientId }: Props) {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

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
    const value =
      e.target.name === "ungradable"
        ? (e.target as HTMLInputElement).checked
        : e.target.value;

    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const allowed = hasAnyRole(currentUser, ALLOWED_REPORT_ROLES);

    if (!allowed) {
      setMessage("You do not have permission to create reports.");
      setLoading(false);
      return;
    }

    try {
      await createReport(formData);
      setMessage("Report created successfully.");
      setFormData({
        ...formData,
        report_id: "",
        review_date: "",
        dr_grade: "",
        maculopathy_grade: "",
        recommendation: "",
        next_followup_interval: "",
        notes: "",
      });

      router.refresh();
    } catch {
      setMessage("Failed to create report.");
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return (
      <div className="space-y-2 border rounded-lg p-4">
        <h2 className="text-xl font-semibold">Create Structured Report</h2>
        <p className="text-sm text-gray-600">Checking permissions...</p>
      </div>
    );
  }

  const allowed = hasAnyRole(currentUser, ALLOWED_REPORT_ROLES);

  if (!allowed) {
    return (
      <div className="space-y-2 border rounded-lg p-4 bg-gray-50">
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border rounded-lg p-4">
      <h2 className="text-xl font-semibold">Create Structured Report</h2>

      <input
        name="report_id"
        value={formData.report_id}
        onChange={handleChange}
        placeholder="Report ID"
        className="w-full border rounded p-3"
        required
      />

      <input
        name="review_date"
        type="date"
        value={formData.review_date}
        onChange={handleChange}
        className="w-full border rounded p-3"
        required
      />

      <input
        name="dr_grade"
        value={formData.dr_grade}
        onChange={handleChange}
        placeholder="DR Grade"
        className="w-full border rounded p-3"
      />

      <input
        name="maculopathy_grade"
        value={formData.maculopathy_grade}
        onChange={handleChange}
        placeholder="Maculopathy Grade"
        className="w-full border rounded p-3"
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

      <select
        name="urgency_outcome"
        value={formData.urgency_outcome}
        onChange={handleChange}
        className="w-full border rounded p-3"
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
        className="w-full border rounded p-3"
      />

      <select
        name="report_status"
        value={formData.report_status}
        onChange={handleChange}
        className="w-full border rounded p-3"
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
        className="w-full border rounded p-3"
      />

      <textarea
        name="notes"
        value={formData.notes}
        onChange={handleChange}
        placeholder="Notes"
        className="w-full border rounded p-3"
      />

      {message && <p className="text-sm">{message}</p>}

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-black text-white px-4 py-3"
      >
        {loading ? "Saving..." : "Create Report"}
      </button>
    </form>
  );
}