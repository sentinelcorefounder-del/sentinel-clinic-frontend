"use client";

import { useEffect, useState } from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  createClinicDirectPatient,
  createEncounter,
  fetchMyOrganizationCapabilities,
  fetchPatients,
  type OrganizationCapabilityProfile,
} from "@/lib/api";

type PatientMode = "existing" | "new";

type WorkflowRoute =
  | "clinic_managed"
  | "sentinel_managed";

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

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function generateAssessmentId(): string {
  return `ENC-${Date.now().toString().slice(-10)}`;
}

export default function NewRetinalAssessmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const patientIdFromUrl =
    searchParams.get("patientId");

  const [profile, setProfile] =
    useState<OrganizationCapabilityProfile | null>(
      null
    );

  const [patients, setPatients] = useState<any[]>(
    []
  );

  const [mode, setMode] =
    useState<PatientMode>("existing");

  const [selectedPatientId, setSelectedPatientId] =
    useState("");

  const [workflowRoute, setWorkflowRoute] =
    useState<WorkflowRoute>("clinic_managed");

  const [assessmentDate, setAssessmentDate] =
    useState(today());

  const [
    diabetesDuration,
    setDiabetesDuration,
  ] = useState("");

  const [symptomsNotes, setSymptomsNotes] =
    useState("");

  const [clinicalNotes, setClinicalNotes] =
    useState("");

  const [newPatient, setNewPatient] =
    useState<NewPatientForm>({
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

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPage() {
      try {
        setLoading(true);
        setError("");

        const [
          capabilityProfile,
          patientData,
        ] = await Promise.all([
          fetchMyOrganizationCapabilities(),
          fetchPatients(),
        ]);

        setProfile(capabilityProfile);
        setPatients(patientData);

        if (
          capabilityProfile.workflow_mode ===
          "sentinel_managed"
        ) {
          setWorkflowRoute(
            "sentinel_managed"
          );
        }

        if (
          capabilityProfile.workflow_mode ===
          "clinic_managed"
        ) {
          setWorkflowRoute(
            "clinic_managed"
          );
        }

        if (patientIdFromUrl) {
          setMode("existing");
          setSelectedPatientId(
            patientIdFromUrl
          );
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load the retinal assessment form."
        );
      } finally {
        setLoading(false);
      }
    }

    loadPage();
  }, [patientIdFromUrl]);

  function updateNewPatientField(
    field: keyof NewPatientForm,
    value: string
  ) {
    setNewPatient((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function createAssessment() {
    try {
      setSaving(true);
      setError("");

      if (!profile) {
        throw new Error(
          "Clinic capability profile is unavailable."
        );
      }

      let patientId =
        selectedPatientId;

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

        const createdPatient =
          await createClinicDirectPatient(
            newPatient
          );

        patientId = String(
          createdPatient.id
        );
      }

      if (!patientId) {
        throw new Error(
          "Select an existing patient or create a new patient."
        );
      }

      const effectiveWorkflowRoute:
        WorkflowRoute =
        profile.workflow_mode === "hybrid"
          ? workflowRoute
          : profile.workflow_mode ===
              "sentinel_managed"
            ? "sentinel_managed"
            : "clinic_managed";

      const assessment =
        await createEncounter({
          encounter_id:
            generateAssessmentId(),

          patient: Number(patientId),

          encounter_date:
            assessmentDate,

          encounter_type:
            "retinal_assessment",

          // Stable internal database value.
          // This is not shown to users.
          programme:
            "diabetic_screening",

          source_type:
            "clinic_direct",

          workflow_route:
            effectiveWorkflowRoute,

          payment_responsibility:
            profile.default_payment_responsibility,

          diabetes_duration:
            diabetesDuration,

          symptoms_notes:
            symptomsNotes,

          clinical_notes:
            clinicalNotes,
        });

      router.push(
        `/encounters/${assessment.id}`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create the retinal assessment."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="p-10">
        Loading retinal assessment form...
      </main>
    );
  }

  if (
    !profile?.clinic_direct_screening_enabled
  ) {
    return (
      <main className="p-10">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
          Clinic-direct retinal assessment
          is not enabled for this clinic.
          Ask Sentinel Ops to update the
          clinic capability profile.
        </div>
      </main>
    );
  }

  if (
    !profile.can_create_direct_patients
  ) {
    return (
      <main className="p-10">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
          This clinic is not permitted to
          create clinic-direct patient
          records.
        </div>
      </main>
    );
  }

  return (
    <main className="sentinel-page max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          New Diabetic Retinal Assessment
        </h1>

        <p className="mt-1 text-sm text-slate-600">
          Create a clinic-owned diabetic
          retinal assessment without a
          hospital referral.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">
          Patient
        </h2>

        <div className="mb-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() =>
              setMode("existing")
            }
            className={`rounded-xl border px-4 py-2 text-sm font-semibold ${
              mode === "existing"
                ? "bg-slate-950 text-white"
                : "bg-white text-slate-950"
            }`}
          >
            Existing Patient
          </button>

          <button
            type="button"
            onClick={() =>
              setMode("new")
            }
            className={`rounded-xl border px-4 py-2 text-sm font-semibold ${
              mode === "new"
                ? "bg-slate-950 text-white"
                : "bg-white text-slate-950"
            }`}
          >
            New Patient
          </button>
        </div>

        {mode === "existing" ? (
          <label className="block">
            <span className="mb-1 block text-sm font-medium">
              Select Patient
            </span>

            <select
              value={selectedPatientId}
              onChange={(event) =>
                setSelectedPatientId(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
            >
              <option value="">
                Select patient
              </option>

              {patients.map((patient) => (
                <option
                  key={patient.id}
                  value={patient.id}
                >
                  {patient.patient_id} —{" "}
                  {patient.first_name}{" "}
                  {patient.last_name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="First Name"
              value={
                newPatient.first_name
              }
              onChange={(value) =>
                updateNewPatientField(
                  "first_name",
                  value
                )
              }
              required
            />

            <Input
              label="Last Name"
              value={
                newPatient.last_name
              }
              onChange={(value) =>
                updateNewPatientField(
                  "last_name",
                  value
                )
              }
              required
            />

            <Input
              label="Date of Birth"
              type="date"
              value={
                newPatient.date_of_birth
              }
              onChange={(value) =>
                updateNewPatientField(
                  "date_of_birth",
                  value
                )
              }
              required
            />

            <label>
              <span className="mb-1 block text-sm font-medium">
                Sex
              </span>

              <select
                value={newPatient.sex}
                onChange={(event) =>
                  updateNewPatientField(
                    "sex",
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              >
                <option value="female">
                  Female
                </option>
                <option value="male">
                  Male
                </option>
                <option value="other">
                  Other
                </option>
              </select>
            </label>

            <Input
              label="Phone"
              value={newPatient.phone}
              onChange={(value) =>
                updateNewPatientField(
                  "phone",
                  value
                )
              }
            />

            <Input
              label="Email"
              type="email"
              value={newPatient.email}
              onChange={(value) =>
                updateNewPatientField(
                  "email",
                  value
                )
              }
            />

            <Input
              label="Address"
              value={newPatient.address}
              onChange={(value) =>
                updateNewPatientField(
                  "address",
                  value
                )
              }
            />

            <Input
              label="City"
              value={newPatient.city}
              onChange={(value) =>
                updateNewPatientField(
                  "city",
                  value
                )
              }
            />

            <Input
              label="State"
              value={newPatient.state}
              onChange={(value) =>
                updateNewPatientField(
                  "state",
                  value
                )
              }
            />

            <Input
              label="Country"
              value={newPatient.country}
              onChange={(value) =>
                updateNewPatientField(
                  "country",
                  value
                )
              }
            />
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">
          Assessment Setup
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Assessment Date"
            type="date"
            value={assessmentDate}
            onChange={
              setAssessmentDate
            }
            required
          />

          <Input
            label="Diabetes Duration"
            value={diabetesDuration}
            onChange={
              setDiabetesDuration
            }
            placeholder="e.g. 8 years"
          />
        </div>

        {profile.workflow_mode ===
        "hybrid" ? (
          <label className="mt-4 block">
            <span className="mb-1 block text-sm font-medium">
              Workflow for this assessment
            </span>

            <select
              value={workflowRoute}
              onChange={(event) =>
                setWorkflowRoute(
                  event.target
                    .value as WorkflowRoute
                )
              }
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
            >
              <option value="clinic_managed">
                Clinic Managed
              </option>

              <option value="sentinel_managed">
                Sentinel Managed
              </option>
            </select>
          </label>
        ) : (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
            Workflow:{" "}
            <strong>
              {profile.workflow_mode
                .replaceAll("_", " ")
                .replace(
                  /\b\w/g,
                  (letter) =>
                    letter.toUpperCase()
                )}
            </strong>
          </div>
        )}

        <label className="mt-4 block">
          <span className="mb-1 block text-sm font-medium">
            Symptoms / Intake Notes
          </span>

          <textarea
            value={symptomsNotes}
            onChange={(event) =>
              setSymptomsNotes(
                event.target.value
              )
            }
            rows={4}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="mt-4 block">
          <span className="mb-1 block text-sm font-medium">
            Clinical Notes
          </span>

          <textarea
            value={clinicalNotes}
            onChange={(event) =>
              setClinicalNotes(
                event.target.value
              )
            }
            rows={4}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
          />
        </label>
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() =>
            router.push(
              "/retinal-assessments"
            )
          }
          className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={createAssessment}
          disabled={saving}
          className="rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white disabled:opacity-50"
        >
          {saving
            ? "Creating Assessment..."
            : "Create Assessment and Open Record"}
        </button>
      </div>
    </main>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label>
      <span className="mb-1 block text-sm font-medium">
        {label}
        {required ? " *" : ""}
      </span>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        required={required}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-xl border border-slate-300 px-3 py-2"
      />
    </label>
  );
}