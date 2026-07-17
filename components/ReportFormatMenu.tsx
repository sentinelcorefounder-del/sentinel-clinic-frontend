"use client";

import { getReportPdfUrl, type ReportFormat } from "@/lib/api";

type Role = "clinic" | "hospital" | "ops";

type Props = {
  reportId: string | number;
  role: Role;
  disabled?: boolean;
  className?: string;
};

const OPTIONS: Record<Role, Array<{ value: ReportFormat; label: string }>> = {
  clinic: [
    { value: "clinician", label: "Clinician Report" },
    { value: "patient", label: "Patient Report" },
  ],
  hospital: [
    { value: "hospital", label: "Hospital Summary" },
    { value: "clinician", label: "Clinician Report" },
    { value: "patient", label: "Patient Report" },
  ],
  ops: [
    { value: "clinician", label: "Clinician Report" },
    { value: "patient", label: "Patient Report" },
    { value: "hospital", label: "Hospital Summary" },
    { value: "ops", label: "Ops / Audit Report" },
  ],
};

export default function ReportFormatMenu({ reportId, role, disabled, className = "" }: Props) {
  function openFormat(value: string) {
    if (!value) return;
    window.open(getReportPdfUrl(reportId, value as ReportFormat), "_blank", "noopener,noreferrer");
  }

  return (
    <select
      aria-label="Open report format"
      disabled={disabled}
      defaultValue=""
      onChange={(event) => {
        openFormat(event.target.value);
        event.currentTarget.value = "";
      }}
      className={`rounded-lg border bg-white px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      <option value="" disabled>View report format…</option>
      {OPTIONS[role].map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  );
}
