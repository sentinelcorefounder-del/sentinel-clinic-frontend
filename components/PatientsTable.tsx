"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  fetchClinicPatients,
  type PatientSourceFilter,
} from "@/lib/patients-api";
import type { Patient } from "@/types/patient";

type HospitalLabel = {
  id: number;
  name: string;
  patientCount: number;
};

export default function PatientsTable() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [source, setSource] =
    useState<PatientSourceFilter>("all");
  const [hospitalId, setHospitalId] =
    useState<number | null>(null);
  const [hospitalLabelsOpen, setHospitalLabelsOpen] =
    useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const hospitalLabels = useMemo<HospitalLabel[]>(() => {
    const counts = new Map<
      number,
      { name: string; patientIds: Set<number> }
    >();

    for (const patient of allPatients) {
      for (const hospital of patient.referring_hospitals || []) {
        const current = counts.get(hospital.id) || {
          name: hospital.name,
          patientIds: new Set<number>(),
        };

        current.patientIds.add(patient.id);
        counts.set(hospital.id, current);
      }
    }

    return Array.from(counts.entries())
      .map(([id, value]) => ({
        id,
        name: value.name,
        patientCount: value.patientIds.size,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allPatients]);

  async function loadPatients(
    nextSource = source,
    nextHospitalId = hospitalId
  ) {
    try {
      setLoading(true);
      setError("");

      const data = await fetchClinicPatients({
        search,
        source: nextSource,
        hospitalId:
          nextSource === "hospital_referral"
            ? nextHospitalId
            : null,
      });

      setPatients(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load patients."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadPatientLabels() {
    try {
      const data = await fetchClinicPatients();
      setAllPatients(data);
    } catch {
      setAllPatients([]);
    }
  }

  useEffect(() => {
    loadPatientLabels();
    loadPatients("all", null);
  }, []);

  async function chooseSource(
    nextSource: PatientSourceFilter
  ) {
    setSource(nextSource);
    setHospitalId(null);
    await loadPatients(nextSource, null);
  }

  async function chooseHospital(nextHospitalId: number) {
    setSource("hospital_referral");
    setHospitalId(nextHospitalId);
    await loadPatients("hospital_referral", nextHospitalId);
  }

  async function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    await loadPatients();
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[250px_minmax(0,1fr)]">
      <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <p className="px-3 pb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
          Patient source
        </p>

        <SourceButton
          active={source === "all"}
          label="All Patients"
          onClick={() => chooseSource("all")}
        />

        <SourceButton
          active={source === "clinic_direct"}
          label="Clinic Direct"
          onClick={() => chooseSource("clinic_direct")}
        />

        <button
          type="button"
          onClick={() =>
            setHospitalLabelsOpen((current) => !current)
          }
          className={`mt-1 flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-semibold ${
            source === "hospital_referral"
              ? "bg-blue-50 text-blue-900"
              : "text-slate-800 hover:bg-slate-100"
          }`}
        >
          <span>Hospital Referred</span>
          <span aria-hidden="true">
            {hospitalLabelsOpen ? "▼" : "▶"}
          </span>
        </button>

        {hospitalLabelsOpen ? (
          <div className="ml-3 mt-1 border-l border-slate-200 pl-2">
            <button
              type="button"
              onClick={() =>
                chooseSource("hospital_referral")
              }
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
                source === "hospital_referral" &&
                hospitalId === null
                  ? "bg-slate-900 font-semibold text-white"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span>All Hospitals</span>
            </button>

            {hospitalLabels.map((hospital) => (
              <button
                key={hospital.id}
                type="button"
                onClick={() => chooseHospital(hospital.id)}
                className={`mt-1 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
                  hospitalId === hospital.id
                    ? "bg-slate-900 font-semibold text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span className="truncate">{hospital.name}</span>
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                    hospitalId === hospital.id
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {hospital.patientCount}
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </aside>

      <div className="min-w-0 space-y-4">
        <form
          onSubmit={handleSearch}
          className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row"
        >
          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search patient, referral or hospital"
            className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 placeholder:text-slate-500 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <button className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800">
            Search
          </button>
        </form>

        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">
            {source === "clinic_direct"
              ? "Clinic Direct Patients"
              : source === "hospital_referral"
                ? hospitalId
                  ? hospitalLabels.find(
                      (hospital) =>
                        hospital.id === hospitalId
                    )?.name || "Hospital Referred Patients"
                  : "All Hospital Referred Patients"
                : "All Patients"}
          </p>
          <p className="mt-1 text-xs text-slate-600">
            {patients.length} patient
            {patients.length === 1 ? "" : "s"} shown
          </p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-700">
              Loading patients...
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-4 text-sm font-semibold text-slate-900">
                    Patient
                  </th>
                  <th className="p-4 text-sm font-semibold text-slate-900">
                    Source
                  </th>
                  <th className="p-4 text-sm font-semibold text-slate-900">
                    Referring Hospital
                  </th>
                  <th className="p-4 text-sm font-semibold text-slate-900">
                    Referral ID
                  </th>
                  <th className="p-4 text-sm font-semibold text-slate-900">
                    Phone
                  </th>
                  <th className="p-4 text-sm font-semibold text-slate-900">
                    City
                  </th>
                </tr>
              </thead>

              <tbody>
                {!patients.length ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-6 text-sm text-slate-700"
                    >
                      No patients found for this source.
                    </td>
                  </tr>
                ) : (
                  patients.map((patient) => (
                    <tr
                      key={patient.id}
                      className="border-t border-slate-200 hover:bg-slate-50"
                    >
                      <td className="p-4">
                        <Link
                          href={`/patients/${patient.id}`}
                          className="font-semibold text-blue-700 hover:text-blue-800 hover:underline"
                        >
                          {patient.first_name}{" "}
                          {patient.last_name}
                        </Link>
                        <p className="mt-1 text-xs text-slate-500">
                          {patient.patient_id}
                        </p>
                      </td>

                      <td className="p-4">
                        <SourceBadge
                          source={patient.source_type}
                        />
                      </td>

                      <td className="p-4 text-sm text-slate-900">
                        {patient.referring_hospital_name ||
                          "—"}
                      </td>

                      <td className="p-4 text-sm text-slate-900">
                        {patient.referral_id_display || "—"}
                      </td>

                      <td className="p-4 text-sm text-slate-900">
                        {patient.phone || "—"}
                      </td>

                      <td className="p-4 text-sm text-slate-900">
                        {patient.city || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function SourceButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mt-1 w-full rounded-xl px-3 py-2 text-left text-sm font-semibold ${
        active
          ? "bg-slate-900 text-white"
          : "text-slate-800 hover:bg-slate-100"
      }`}
    >
      {label}
    </button>
  );
}

function SourceBadge({
  source,
}: {
  source: Patient["source_type"];
}) {
  const hospital = source === "hospital_referral";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        hospital
          ? "bg-blue-100 text-blue-800"
          : "bg-emerald-100 text-emerald-800"
      }`}
    >
      {hospital ? "Hospital Referral" : "Clinic Direct"}
    </span>
  );
}
