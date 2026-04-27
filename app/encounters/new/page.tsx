"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createEncounter, fetchPatients } from "@/lib/api";

type PatientOption = {
  id: number;
  patient_id: string;
  first_name: string;
  last_name: string;
};

function NewEncounterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPatientId = Number(searchParams.get("patientId") || 0);

  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [formData, setFormData] = useState({
    encounter_id: "",
    patient: preselectedPatientId,
    encounter_date: "",
    encounter_type: "diabetic_eye_screening",
    screening_status: "scheduled",
    diabetes_duration: "",
    symptoms_notes: "",
    clinical_notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPatients() {
      try {
        const data = await fetchPatients();
        setPatients(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load patients.");
      } finally {
        setPatientsLoading(false);
      }
    }
    loadPatients();
  }, []);

  useEffect(() => {
    if (preselectedPatientId) {
      setFormData((prev) => ({ ...prev, patient: preselectedPatientId }));
    }
  }, [preselectedPatientId]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const value = e.target.name === "patient" ? Number(e.target.value) : e.target.value;
    setFormData((prev) => ({ ...prev, [e.target.name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!formData.patient) {
      setError("Please select a patient.");
      setLoading(false);
      return;
    }

    try {
      const createdEncounter = await createEncounter(formData);
      router.push(`/encounters/${createdEncounter.id}`);
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Failed to create encounter");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="p-10 max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">Add Screening Encounter</h1>
      <p className="text-sm text-gray-600 mb-6">
        Encounters must be linked to an existing patient from Sentinel Ops. Visual acuity is captured in the structured report, not here.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="encounter_id" placeholder="Encounter ID" value={formData.encounter_id} onChange={handleChange} className="w-full border rounded p-3" required />

        <select name="patient" value={formData.patient} onChange={handleChange} className="w-full border rounded p-3" required disabled={patientsLoading || !!preselectedPatientId}>
          <option value={0}>{patientsLoading ? "Loading patients..." : "Select patient"}</option>
          {patients.map((patient) => (
            <option key={patient.id} value={patient.id}>{patient.patient_id} - {patient.first_name} {patient.last_name}</option>
          ))}
        </select>

        <input name="encounter_date" type="date" value={formData.encounter_date} onChange={handleChange} className="w-full border rounded p-3" required />

        <select name="encounter_type" value={formData.encounter_type} onChange={handleChange} className="w-full border rounded p-3">
          <option value="diabetic_eye_screening">Diabetic Eye Screening</option>
        </select>

        <select name="screening_status" value={formData.screening_status} onChange={handleChange} className="w-full border rounded p-3">
          <option value="scheduled">Scheduled</option>
          <option value="in_progress">In Progress</option>
          <option value="images_uploaded">Images Uploaded</option>
          <option value="under_review">Under Review</option>
          <option value="report_ready">Report Ready</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <input name="diabetes_duration" placeholder="Diabetes Duration" value={formData.diabetes_duration} onChange={handleChange} className="w-full border rounded p-3" />
        <textarea name="symptoms_notes" placeholder="Symptoms Notes" value={formData.symptoms_notes} onChange={handleChange} className="w-full border rounded p-3" />
        <textarea name="clinical_notes" placeholder="Clinical Notes" value={formData.clinical_notes} onChange={handleChange} className="w-full border rounded p-3" />

        {error && <p className="text-red-600">{error}</p>}

        <button type="submit" disabled={loading || patientsLoading} className="rounded-lg bg-black text-white px-4 py-3">
          {loading ? "Saving..." : "Create Encounter"}
        </button>
      </form>
    </main>
  );
}

export default function NewEncounterPage() {
  return (
    <Suspense fallback={<div className="p-10">Loading...</div>}>
      <NewEncounterPageContent />
    </Suspense>
  );
}
