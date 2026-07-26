"use client";

import OrganizationFinanceCard from "@/components/OrganizationFinanceCard";
import OrganizationBrandingEditor from "@/components/OrganizationBrandingEditor";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  updateOpsClinicCapabilities,
  type OrganizationCapabilityProfile,
} from "@/lib/api";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function pretty(value?: string | null) {
  if (!value) return "-";
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function OpsClinicDetailPage() {
  const params = useParams();
  const id = String(params.id);

  const [data, setData] = useState<any>(null);
  const [profile, setProfile] =
    useState<OrganizationCapabilityProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadClinic() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(
        `${API_BASE}/api/ops/clinics/${id}/`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const responseData = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          responseData.detail || "Failed to load clinic."
        );
      }

      setData(responseData);
      setProfile(
        responseData.clinic?.capability_profile || null
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load clinic."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClinic();
  }, [id]);

  function setField(
    field: keyof OrganizationCapabilityProfile,
    value: any
  ) {
    setProfile((current) =>
      current ? { ...current, [field]: value } : current
    );
  }

  function applyWorkflowPreset(
    mode: OrganizationCapabilityProfile["workflow_mode"]
  ) {
    setProfile((current) => {
      if (!current) return current;

      if (mode === "sentinel_managed") {
        return {
          ...current,
          workflow_mode: mode,
          can_issue_reports_directly: false,
          sentinel_review_policy: "mandatory",
        };
      }

      if (mode === "clinic_managed") {
        return {
          ...current,
          workflow_mode: mode,
          can_issue_reports_directly: true,
          sentinel_review_policy: "unavailable",
        };
      }

      return {
        ...current,
        workflow_mode: mode,
        can_issue_reports_directly: true,
        sentinel_review_policy: "optional",
      };
    });
  }

  async function saveCapabilities() {
    if (!profile) return;

    try {
      setSaving(true);
      setMessage("");
      setError("");

      const response = await updateOpsClinicCapabilities(
        id,
        {
          workflow_mode: profile.workflow_mode,
          referral_requirement:
            profile.referral_requirement,
          patient_ownership: profile.patient_ownership,
          can_create_direct_patients:
            profile.can_create_direct_patients,
          can_issue_reports_directly:
            profile.can_issue_reports_directly,
          electronic_signature_required:
            profile.electronic_signature_required,
          sentinel_review_policy:
            profile.sentinel_review_policy,
          default_payment_responsibility:
            profile.default_payment_responsibility,
          branding_policy: profile.branding_policy,
          default_programme: profile.default_programme,
          subscription_tier: profile.subscription_tier,
          ai_enabled: profile.ai_enabled,
          clinic_direct_screening_enabled:
            profile.clinic_direct_screening_enabled,
          ocular_diagnostics_enabled:
            profile.ocular_diagnostics_enabled,
          settings_notes: profile.settings_notes,
        }
      );

      setData(response);
      setProfile(
        response.clinic?.capability_profile || profile
      );
      setMessage("Clinic capabilities saved successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save clinic capabilities."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <main className="p-8">Loading clinic...</main>;
  }

  if (error && !data) {
    return (
      <main className="p-8 text-red-700">{error}</main>
    );
  }

  const clinic = data?.clinic;
  const patients = data?.patients || [];
  const referrals = data?.referrals || [];
  const reports = data?.reports || [];

  if (!clinic || !profile) {
    return (
      <main className="p-8">
        Clinic capability profile is unavailable.
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            {clinic.name}
          </h1>
          <p className="text-slate-500">{clinic.code}</p>
        </div>

        <Link
          href="/ops/clinics"
          className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold"
        >
          Back to Clinics
        </Link>
      </div>

      {message ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Box title="Clinic Information">
          <p>Email: {clinic.contact_email || "-"}</p>
          <p>Phone: {clinic.phone || "-"}</p>
          <p>Address: {clinic.address || "-"}</p>
        </Box>

        <Box title="Summary">
          <p>Patients: {patients.length}</p>
          <p>Referrals: {referrals.length}</p>
          <p>Reports: {reports.length}</p>
          <p>
            Workflow: {pretty(profile.workflow_mode)}
          </p>
        </Box>
      </div>

      <OrganizationFinanceCard organizationId={clinic.id} />
      <OrganizationBrandingEditor
        organization={clinic}
        onSaved={() => loadClinic()}
      />

      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-xl font-bold">
            Organisation Capability Profile
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            These settings control how Sentinel behaves for
            this clinic. Sprint 4.2 will use them to enable
            clinic-direct screening and report actions.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Select
            label="Workflow Mode"
            value={profile.workflow_mode}
            onChange={(value) =>
              applyWorkflowPreset(
                value as OrganizationCapabilityProfile["workflow_mode"]
              )
            }
            options={[
              ["sentinel_managed", "Sentinel Managed"],
              ["clinic_managed", "Clinic Managed"],
              ["hybrid", "Hybrid"],
            ]}
          />

          <Select
            label="Referral Requirement"
            value={profile.referral_requirement}
            onChange={(value) =>
              setField("referral_requirement", value)
            }
            options={[
              ["required", "Required"],
              ["optional", "Optional"],
              ["not_required", "Not Required"],
            ]}
          />

          <Select
            label="Patient Ownership"
            value={profile.patient_ownership}
            onChange={(value) =>
              setField("patient_ownership", value)
            }
            options={[
              ["hospital", "Hospital"],
              ["clinic", "Clinic"],
              ["shared", "Shared"],
            ]}
          />

          <Select
            label="Sentinel Review Policy"
            value={profile.sentinel_review_policy}
            onChange={(value) =>
              setField("sentinel_review_policy", value)
            }
            options={[
              ["mandatory", "Mandatory"],
              ["optional", "Optional"],
              ["unavailable", "Unavailable"],
            ]}
          />

          <Select
            label="Default Payment Responsibility"
            value={profile.default_payment_responsibility}
            onChange={(value) =>
              setField(
                "default_payment_responsibility",
                value
              )
            }
            options={[
              ["patient", "Patient"],
              ["clinic", "Clinic"],
              ["hospital", "Hospital"],
              ["programme", "Programme Sponsor"],
              ["waived", "Waived"],
            ]}
          />

          <Select
            label="Branding Policy"
            value={profile.branding_policy}
            onChange={(value) =>
              setField("branding_policy", value)
            }
            options={[
              ["sentinel_only", "Sentinel Only"],
              ["organization_only", "Clinic Only"],
              [
                "organization_and_sentinel",
                "Clinic + Sentinel",
              ],
              [
                "hospital_and_sentinel",
                "Hospital + Sentinel",
              ],
              [
                "hospital_clinic_sentinel",
                "Hospital + Clinic + Sentinel",
              ],
            ]}
          />

          <Select
            label="Subscription Tier"
            value={profile.subscription_tier}
            onChange={(value) =>
              setField("subscription_tier", value)
            }
            options={[
              ["pilot", "Pilot"],
              ["clinic_core", "Clinic Core"],
              ["managed_review", "Managed Review"],
              ["hybrid", "Hybrid"],
              ["enterprise", "Enterprise"],
            ]}
          />

          <Select
            label="Default Programme"
            value={profile.default_programme}
            onChange={(value) =>
              setField("default_programme", value)
            }
            options={[
              [
                "diabetic_screening",
                "Diabetic Screening",
              ],
              [
                "ocular_diagnostics",
                "Ocular Diagnostics",
              ],
            ]}
          />
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <Checkbox
            label="Clinic may create direct patients"
            checked={profile.can_create_direct_patients}
            onChange={(checked) =>
              setField(
                "can_create_direct_patients",
                checked
              )
            }
          />
          <Checkbox
            label="Clinic may issue reports directly"
            checked={profile.can_issue_reports_directly}
            onChange={(checked) =>
              setField(
                "can_issue_reports_directly",
                checked
              )
            }
          />
          <Checkbox
            label="Electronic signature required"
            checked={
              profile.electronic_signature_required
            }
            onChange={(checked) =>
              setField(
                "electronic_signature_required",
                checked
              )
            }
          />
          <Checkbox
            label="AI enabled"
            checked={profile.ai_enabled}
            onChange={(checked) =>
              setField("ai_enabled", checked)
            }
          />
          <Checkbox
            label="Clinic-direct diabetic screening enabled"
            checked={
              profile.clinic_direct_screening_enabled
            }
            onChange={(checked) =>
              setField(
                "clinic_direct_screening_enabled",
                checked
              )
            }
          />
          <Checkbox
            label="Ocular Diagnostics enabled"
            checked={
              profile.ocular_diagnostics_enabled
            }
            onChange={(checked) =>
              setField(
                "ocular_diagnostics_enabled",
                checked
              )
            }
          />
        </div>

        <label className="mt-5 block">
          <span className="mb-1 block text-sm font-medium">
            Ops Configuration Notes
          </span>
          <textarea
            value={profile.settings_notes || ""}
            onChange={(event) =>
              setField(
                "settings_notes",
                event.target.value
              )
            }
            rows={4}
            className="w-full rounded-xl border px-3 py-2"
            placeholder="Commercial agreement, review arrangement, exceptions or onboarding notes"
          />
        </label>

        <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          <strong>Current effective workflow:</strong>{" "}
          {pretty(profile.workflow_mode)}.{" "}
          {profile.can_issue_reports_directly
            ? "Direct clinic issue is permitted."
            : "Reports must be issued through Sentinel Ops."}{" "}
          Sentinel review is{" "}
          {pretty(profile.sentinel_review_policy)}.
        </div>

        <button
          type="button"
          onClick={saveCapabilities}
          disabled={saving}
          className="mt-5 rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {saving
            ? "Saving..."
            : "Save Capability Profile"}
        </button>
      </section>

      <Section title="Patients">
        <Table
          headers={["Patient ID", "Name", "Phone"]}
          rows={patients.map((patient: any) => [
            patient.patient_id,
            patient.name,
            patient.phone || "-",
          ])}
        />
      </Section>

      <Section title="Referrals">
        <Table
          headers={[
            "Referral ID",
            "Hospital",
            "Status",
          ]}
          rows={referrals.map((referral: any) => [
            referral.referral_id,
            referral.source_hospital_name,
            pretty(referral.referral_status),
          ])}
        />
      </Section>

      <Section title="Reports">
        <Table
          headers={[
            "Report ID",
            "Patient",
            "Status",
            "Outcome",
          ]}
          rows={reports.map((report: any) => [
            report.report_id,
            report.patient_name,
            pretty(report.report_status),
            pretty(report.urgency_outcome),
          ])}
        />
      </Section>
    </main>
  );
}

function Box({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <h2 className="mb-3 text-lg font-bold">{title}</h2>
      <div className="space-y-1 text-sm">{children}</div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6 rounded-xl bg-white p-6 shadow">
      <h2 className="mb-4 text-xl font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
}) {
  return (
    <label>
      <span className="mb-1 block text-sm font-medium">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-xl border px-3 py-2"
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-xl border bg-slate-50 p-3 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(event.target.checked)
        }
      />
      <span>{label}</span>
    </label>
  );
}

function Table({
  headers,
  rows,
}: {
  headers: string[];
  rows: React.ReactNode[][];
}) {
  if (!rows.length) {
    return (
      <p className="text-sm text-slate-500">No data</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-100 text-left">
          <tr>
            {headers.map((header) => (
              <th key={header} className="p-3">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-t">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="p-3">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
