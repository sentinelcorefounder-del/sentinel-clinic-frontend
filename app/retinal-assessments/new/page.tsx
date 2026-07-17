"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  createClinicDirectPatient,
  createEncounter,
  fetchMyOrganizationCapabilities,
  fetchPatientActiveReferrals,
  fetchPatients,
  type OrganizationCapabilityProfile,
} from "@/lib/api";
import type {
  ActiveHospitalReferral,
  ActiveReferralResponse,
  EncounterSourceType,
  EncounterWorkflowRoute,
} from "@/types/encounter";

type PatientMode = "existing" | "new";

type NewPatientForm = {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  sex: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  country: string;
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function encounterId() {
  return `ENC-${Date.now().toString().slice(-10)}`;
}

function pretty(value?: string) {
  return (value || "-")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function NewRetinalAssessmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientIdFromUrl = searchParams.get("patientId");

  const [profile, setProfile] =
    useState<OrganizationCapabilityProfile | null>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [mode, setMode] = useState<PatientMode>("existing");
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [activeReferrals, setActiveReferrals] =
    useState<ActiveHospitalReferral[]>([]);
  const [overrideAllowed, setOverrideAllowed] = useState(false);
  const [sourceType, setSourceType] =
    useState<EncounterSourceType>("clinic_direct");
  const [selectedReferralId, setSelectedReferralId] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [workflowRoute, setWorkflowRoute] =
    useState<EncounterWorkflowRoute>("clinic_managed");

  const [assessmentDate, setAssessmentDate] = useState(today());
  const [diabetesDuration, setDiabetesDuration] = useState("");
  const [symptomsNotes, setSymptomsNotes] = useState("");
  const [clinicalNotes, setClinicalNotes] = useState("");

  const [newPatient, setNewPatient] = useState<NewPatientForm>({
    first_name: "",
    last_name: "",
    date_of_birth: "",
    sex: "female",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    country: "Nigeria",
  });

  const [loading, setLoading] = useState(true);
  const [checkingReferrals, setCheckingReferrals] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [capability, patientData] = await Promise.all([
          fetchMyOrganizationCapabilities(),
          fetchPatients(),
        ]);
        setProfile(capability);
        setPatients(patientData);
        setWorkflowRoute(
          capability.workflow_mode === "sentinel_managed"
            ? "sentinel_managed"
            : "clinic_managed"
        );
        if (patientIdFromUrl) {
          setMode("existing");
          setSelectedPatientId(patientIdFromUrl);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load assessment form."
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [patientIdFromUrl]);

  useEffect(() => {
    async function checkReferrals() {
      setActiveReferrals([]);
      setSelectedReferralId("");
      setOverrideReason("");
      setOverrideAllowed(false);

      if (mode !== "existing" || !selectedPatientId) {
        setSourceType("clinic_direct");
        return;
      }

      try {
        setCheckingReferrals(true);
        const data = (await fetchPatientActiveReferrals(
          selectedPatientId
        )) as ActiveReferralResponse;
        setActiveReferrals(data.active_referrals || []);
        setOverrideAllowed(data.clinic_direct_override_allowed);

        if (data.active_referrals.length === 1) {
          setSourceType("hospital_referral");
          setSelectedReferralId(
            String(data.active_referrals[0].id)
          );
        } else if (data.active_referrals.length > 1) {
          setSourceType("hospital_referral");
        } else {
          setSourceType("clinic_direct");
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to check active referrals."
        );
      } finally {
        setCheckingReferrals(false);
      }
    }
    checkReferrals();
  }, [mode, selectedPatientId]);

  function updateNewPatient(
    field: keyof NewPatientForm,
    value: string
  ) {
    setNewPatient((current) => ({ ...current, [field]: value }));
  }

  async function submit() {
    try {
      setSaving(true);
      setError("");

      if (!profile) {
        throw new Error("Clinic capability profile is unavailable.");
      }

      let patientId = selectedPatientId;

      if (mode === "new") {
        if (
          !newPatient.first_name.trim() ||
          !newPatient.last_name.trim() ||
          !newPatient.date_of_birth
        ) {
          throw new Error(
            "First name, last name and date of birth are required."
          );
        }
        const created = await createClinicDirectPatient(newPatient);
        patientId = String(created.id);
      }

      if (!patientId) {
        throw new Error("Select or create a patient.");
      }

      if (
        sourceType === "hospital_referral" &&
        !selectedReferralId
      ) {
        throw new Error(
          "Select the exact hospital referral for this assessment."
        );
      }

      if (
        sourceType === "clinic_direct" &&
        activeReferrals.length > 0 &&
        !overrideReason.trim()
      ) {
        throw new Error(
          "Enter a reason for creating a separate clinic-direct episode."
        );
      }

      const route: EncounterWorkflowRoute =
        sourceType === "hospital_referral"
          ? "sentinel_managed"
          : profile.workflow_mode === "hybrid"
            ? workflowRoute
            : profile.workflow_mode === "sentinel_managed"
              ? "sentinel_managed"
              : "clinic_managed";

      const created = await createEncounter({
        encounter_id: encounterId(),
        patient: Number(patientId),
        encounter_date: assessmentDate,
        encounter_type: "retinal_assessment",
        programme: "diabetic_screening",
        source_type: sourceType,
        hospital_referral:
          sourceType === "hospital_referral"
            ? Number(selectedReferralId)
            : null,
        source_override_reason:
          sourceType === "clinic_direct"
            ? overrideReason.trim()
            : "",
        workflow_route: route,
        payment_responsibility:
          sourceType === "hospital_referral"
            ? "hospital"
            : profile.default_payment_responsibility,
        diabetes_duration: diabetesDuration,
        symptoms_notes: symptomsNotes,
        clinical_notes: clinicalNotes,
      });

      router.push(`/encounters/${created.id}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create assessment."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <main className="p-10">Loading...</main>;

  return (
    <main className="sentinel-page max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          New Diabetic Retinal Assessment
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Select the patient and the exact source of today&apos;s
          assessment.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">1. Patient</h2>
        <div className="mb-4 flex gap-3">
          <button
            type="button"
            onClick={() => setMode("existing")}
            className={`rounded-xl border px-4 py-2 ${
              mode === "existing"
                ? "bg-slate-950 text-white"
                : "bg-white"
            }`}
          >
            Existing Sentinel Patient
          </button>
          <button
            type="button"
            onClick={() => setMode("new")}
            className={`rounded-xl border px-4 py-2 ${
              mode === "new"
                ? "bg-slate-950 text-white"
                : "bg-white"
            }`}
          >
            Patient Not Found
          </button>
        </div>

        {mode === "existing" ? (
          <select
            value={selectedPatientId}
            onChange={(event) =>
              setSelectedPatientId(event.target.value)
            }
            className="w-full rounded-xl border p-3"
          >
            <option value="">Select patient</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.patient_id} — {patient.first_name}{" "}
                {patient.last_name}
              </option>
            ))}
          </select>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {[
              ["first_name", "First name"],
              ["last_name", "Last name"],
              ["date_of_birth", "Date of birth"],
              ["phone", "Phone"],
              ["email", "Email"],
              ["address", "Address"],
              ["city", "City"],
              ["state", "State"],
              ["country", "Country"],
            ].map(([field, label]) => (
              <label key={field}>
                <span className="mb-1 block text-sm font-medium">
                  {label}
                </span>
                <input
                  type={
                    field === "date_of_birth"
                      ? "date"
                      : field === "email"
                        ? "email"
                        : "text"
                  }
                  value={(newPatient as any)[field]}
                  onChange={(event) =>
                    updateNewPatient(
                      field as keyof NewPatientForm,
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border p-3"
                />
              </label>
            ))}
            <label>
              <span className="mb-1 block text-sm font-medium">
                Sex
              </span>
              <select
                value={newPatient.sex}
                onChange={(event) =>
                  updateNewPatient("sex", event.target.value)
                }
                className="w-full rounded-xl border p-3"
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </label>
          </div>
        )}
      </section>

      {mode === "existing" && selectedPatientId ? (
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">
            2. Assessment Pathway
          </h2>

          {checkingReferrals ? (
            <p className="mt-3 text-sm">Checking referrals...</p>
          ) : activeReferrals.length ? (
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
                Active referral
                {activeReferrals.length === 1 ? "" : "s"} found.
                Continue under the correct referral.
              </div>

              {activeReferrals.map((referral) => (
                <label
                  key={referral.id}
                  className="block rounded-xl border p-4"
                >
                  <div className="flex gap-3">
                    <input
                      type="radio"
                      checked={
                        sourceType === "hospital_referral" &&
                        selectedReferralId === String(referral.id)
                      }
                      onChange={() => {
                        setSourceType("hospital_referral");
                        setSelectedReferralId(
                          String(referral.id)
                        );
                        setOverrideReason("");
                      }}
                    />
                    <div>
                      <p className="font-semibold">
                        {referral.source_hospital_name}
                      </p>
                      <p className="text-sm text-slate-600">
                        {referral.referral_id} ·{" "}
                        {pretty(referral.referral_status)}
                      </p>
                    </div>
                  </div>
                </label>
              ))}

              <label className="block rounded-xl border border-amber-300 bg-amber-50 p-4">
                <div className="flex gap-3">
                  <input
                    type="radio"
                    checked={sourceType === "clinic_direct"}
                    disabled={!overrideAllowed}
                    onChange={() => {
                      setSourceType("clinic_direct");
                      setSelectedReferralId("");
                    }}
                  />
                  <div>
                    <p className="font-semibold">
                      Separate clinic-direct episode
                    </p>
                    <p className="text-sm">
                      Requires an authorised override and reason.
                    </p>
                  </div>
                </div>
                {sourceType === "clinic_direct" ? (
                  <textarea
                    value={overrideReason}
                    onChange={(event) =>
                      setOverrideReason(event.target.value)
                    }
                    rows={3}
                    placeholder="Mandatory override reason"
                    className="mt-3 w-full rounded-xl border bg-white p-3"
                  />
                ) : null}
              </label>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
              No active hospital referral found. This will be a
              clinic-direct episode.
            </div>
          )}
        </section>
      ) : null}

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">
          3. Assessment Setup
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label>
            <span className="mb-1 block text-sm font-medium">
              Assessment date
            </span>
            <input
              type="date"
              value={assessmentDate}
              onChange={(event) =>
                setAssessmentDate(event.target.value)
              }
              className="w-full rounded-xl border p-3"
            />
          </label>
          <label>
            <span className="mb-1 block text-sm font-medium">
              Diabetes duration
            </span>
            <input
              value={diabetesDuration}
              onChange={(event) =>
                setDiabetesDuration(event.target.value)
              }
              className="w-full rounded-xl border p-3"
            />
          </label>
        </div>

        {sourceType === "hospital_referral" ? (
          <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm">
            Hospital referrals use Sentinel Managed workflow.
          </div>
        ) : profile?.workflow_mode === "hybrid" ? (
          <select
            value={workflowRoute}
            onChange={(event) =>
              setWorkflowRoute(
                event.target.value as EncounterWorkflowRoute
              )
            }
            className="mt-4 w-full rounded-xl border p-3"
          >
            <option value="clinic_managed">
              Clinic Managed
            </option>
            <option value="sentinel_managed">
              Sentinel Managed
            </option>
          </select>
        ) : null}

        <textarea
          value={symptomsNotes}
          onChange={(event) =>
            setSymptomsNotes(event.target.value)
          }
          placeholder="Symptoms / intake notes"
          rows={3}
          className="mt-4 w-full rounded-xl border p-3"
        />
        <textarea
          value={clinicalNotes}
          onChange={(event) =>
            setClinicalNotes(event.target.value)
          }
          placeholder="Clinical notes"
          rows={3}
          className="mt-4 w-full rounded-xl border p-3"
        />
      </section>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.push("/retinal-assessments")}
          className="rounded-xl border px-5 py-3"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={saving || checkingReferrals}
          className="rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white disabled:opacity-50"
        >
          {saving
            ? "Creating..."
            : "Create Assessment and Open Record"}
        </button>
      </div>
    </main>
  );
}
