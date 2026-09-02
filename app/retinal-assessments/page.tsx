"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { fetchEncounters, fetchMyOrganizationCapabilities, type OrganizationCapabilityProfile } from "@/lib/api";
import type { AssessmentProgramme, Encounter } from "@/types/encounter";

type PathwayFilter = "all" | AssessmentProgramme;

const pathwayDetails: Record<
  AssessmentProgramme,
  { label: string; classes: string }
> = {
  diabetic_screening: {
    label: "Diabetic",
    classes: "bg-blue-100 text-blue-800",
  },
  eye_health_screening: {
    label: "Targeted retinal / glaucoma risk",
    classes: "bg-cyan-100 text-cyan-800",
  },
  ocular_diagnostics: {
    label: "Ocular",
    classes: "bg-emerald-100 text-emerald-800",
  },
  combined_assessment: {
    label: "Combined",
    classes: "bg-violet-100 text-violet-800",
  },
};

function pretty(value?: string) {
  return value
    ? value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
    : "—";
}

function PathwayBadge({ programme }: { programme: AssessmentProgramme }) {
  const details = pathwayDetails[programme] || {
    label: pretty(programme),
    classes: "bg-slate-100 text-slate-800",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${details.classes}`}>
      {details.label}
    </span>
  );
}

export default function RetinalAssessmentsPage() {
  const [rows, setRows] = useState<Encounter[]>([]);
  const [profile, setProfile] = useState<OrganizationCapabilityProfile | null>(null);
  const [source, setSource] = useState("all");
  const [pathway, setPathway] = useState<PathwayFilter>("all");
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([fetchEncounters(), fetchMyOrganizationCapabilities()])
      .then(([encounters, capability]) => {
        setRows(encounters);
        setProfile(capability);
      })
      .catch((err) => setError(err.message));
  }, []);

  const filtered = useMemo(
    () =>
      rows.filter(
        (row) =>
          (source === "all" || row.source_type === source) &&
          (pathway === "all" || row.programme === pathway)
      ),
    [rows, source, pathway]
  );

  return (
    <main className="sentinel-page space-y-6">
      <div className="flex justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Retinal Assessments</h1>
          <p className="text-sm text-slate-600">
            Diabetic, ocular and combined assessments in one clinical workspace.
          </p>
        </div>
        {profile?.can_create_direct_patients &&
        (profile?.clinic_direct_screening_enabled ||
          profile?.ocular_diagnostics_enabled) ? (
          <Link
            href="/retinal-assessments/new"
            className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
          >
            New Assessment
          </Link>
        ) : null}
      </div>

      {error ? <p className="text-red-700">{error}</p> : null}

      <div className="flex flex-wrap gap-3 rounded-2xl border bg-white p-4">
        <label className="text-sm font-medium text-slate-700">
          <span className="mb-1 block">Source</span>
          <select
            value={source}
            onChange={(event) => setSource(event.target.value)}
            className="rounded-xl border px-3 py-2"
          >
            <option value="all">All sources</option>
            <option value="clinic_direct">Clinic Direct</option>
            <option value="hospital_referral">Hospital Referral</option>
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          <span className="mb-1 block">Assessment pathway</span>
          <select
            value={pathway}
            onChange={(event) => setPathway(event.target.value as PathwayFilter)}
            className="rounded-xl border px-3 py-2"
          >
            <option value="all">All pathways</option>
            <option value="diabetic_screening">Diabetic</option>
            <option value="ocular_diagnostics">Ocular</option>
            <option value="combined_assessment">Combined</option>
          </select>
        </label>
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100">
            <tr>
              {[
                "Encounter",
                "Patient",
                "Pathway",
                "Source",
                "Hospital",
                "Workflow",
                "Payment",
                "Status",
                "Action",
              ].map((heading) => (
                <th key={heading} className="p-4">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!filtered.length ? (
              <tr>
                <td colSpan={9} className="p-6 text-slate-600">
                  No assessments match the selected filters.
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="p-4 font-semibold">{row.encounter_id}</td>
                  <td className="p-4">{row.patient}</td>
                  <td className="p-4">
                    <PathwayBadge programme={row.programme} />
                  </td>
                  <td className="p-4">{pretty(row.source_type)}</td>
                  <td className="p-4">{row.source_hospital_name || "—"}</td>
                  <td className="p-4">{pretty(row.workflow_route)}</td>
                  <td className="p-4">{pretty(row.payment_responsibility)}</td>
                  <td className="p-4">{pretty(row.screening_status)}</td>
                  <td className="p-4">
                    <Link
                      className="text-blue-700 underline"
                      href={`/encounters/${row.id}`}
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
