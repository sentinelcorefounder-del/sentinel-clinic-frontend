"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  fetchHospitalPatientById,
  fetchPatientTimeline,
  type PatientTimelineEvent,
} from "@/lib/api";
import PatientTimeline from "@/components/PatientTimeline";
import ReportFormatMenu from "@/components/ReportFormatMenu";

function pretty(value?: string | null) {
  if (!value) return "-";
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

export default function HospitalPatientDetailPage() {
  const params = useParams();
  const id = String(params.id);

  const [data, setData] = useState<any>(null);
  const [timeline, setTimeline] = useState<PatientTimelineEvent[]>([]);
  const [selectedImages, setSelectedImages] = useState<number[]>([]);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");

        const [patientData, timelineData] = await Promise.all([
          fetchHospitalPatientById(id),
          fetchPatientTimeline(id, "hospital"),
        ]);

        setData(patientData);
        setTimeline(timelineData.events || []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load hospital patient."
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  const chosenImages = useMemo(
    () =>
      (data?.uploads || []).filter((image: any) =>
        selectedImages.includes(image.id)
      ),
    [data, selectedImages]
  );

  function toggleImage(imageId: number) {
    setSelectedImages((current) =>
      current.includes(imageId)
        ? current.filter((id) => id !== imageId)
        : [...current, imageId]
    );
  }

  if (loading) {
    return <main className="p-10">Loading patient...</main>;
  }

  if (error || !data?.patient) {
    return (
      <main className="p-10 text-red-700">
        {error || "Patient not found."}
      </main>
    );
  }

  const patient = data.patient;
  const referrals = data.referrals || [];
  const encounters = data.encounters || [];
  const reports = data.reports || [];
  const uploads = data.uploads || [];

  return (
    <main className="sentinel-page space-y-8">
      {viewerOpen && chosenImages.length ? (
        <section className="fixed inset-4 z-50 overflow-auto rounded-2xl border bg-white p-5 shadow-2xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Selected Fundus Images</h2>
              <p className="text-sm text-slate-600">
                {chosenImages.length} image
                {chosenImages.length === 1 ? "" : "s"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setViewerOpen(false)}
              className="rounded-xl border px-4 py-2 font-semibold"
            >
              Close
            </button>
          </div>

          <div
            className={`grid gap-4 ${
              chosenImages.length === 1 ? "grid-cols-1" : "md:grid-cols-2"
            }`}
          >
            {chosenImages.map((image: any) => (
              <div key={image.id} className="rounded-xl border bg-slate-50 p-3">
                <img
                  src={image.image_file}
                  alt={`${image.eye_laterality} eye fundus`}
                  className="max-h-[75vh] w-full rounded object-contain"
                />
                <p className="mt-2 text-sm font-semibold">
                  {pretty(image.eye_laterality)} Eye
                </p>
                <p className="text-xs text-slate-600">
                  Encounter: {image.encounter_display}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {patient.first_name} {patient.last_name}
          </h1>
          <p className="text-sm text-slate-600">Local ID: {patient.patient_id}</p>
          <p className="mt-1 text-sm font-semibold text-blue-800">Sentinel Patient ID: {patient.sentinel_patient_id || "Identity pending"}</p>
        </div>

        <Link
          href="/hospital/patients"
          className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold"
        >
          Back to Patients
        </Link>
      </div>

      <section className="sentinel-card grid gap-4 p-6 md:grid-cols-3">
        <Info label="Sentinel Patient ID" value={patient.sentinel_patient_id || "Identity pending"} />
        <Info label="Date of birth" value={formatDate(patient.date_of_birth)} />
        <Info label="Sex" value={pretty(patient.sex)} />
        <Info label="Phone" value={patient.phone || "-"} />
        <Info label="Email" value={patient.email || "-"} />
        <Info label="Consent" value={pretty(patient.consent_status)} />
        <Info label="Referral ID" value={patient.referral_id || "-"} />
      </section>

      <PatientTimeline events={timeline} />

      <section className="sentinel-card p-6">
        <h2 className="mb-4 text-xl font-semibold">Referrals</h2>
        <SimpleTable
          headers={[
            "Referral",
            "Hospital MRN",
            "Clinic",
            "Status",
            "Payment",
            "Report",
          ]}
          rows={referrals.map((referral: any) => [
            referral.referral_id,
            referral.hospital_mrn || "-",
            referral.clinic_name || "Not assigned",
            pretty(referral.referral_status),
            pretty(referral.payment_status),
            pretty(referral.report_status),
          ])}
        />
      </section>

      <section className="sentinel-card p-6">
        <h2 className="mb-4 text-xl font-semibold">Issued Reports</h2>
        <SimpleTable
          headers={[
            "Report",
            "Review Date",
            "Status",
            "Outcome",
            "Issued",
            "PDF",
          ]}
          rows={reports.map((report: any) => [
            report.report_id,
            formatDate(report.review_date),
            pretty(report.report_status),
            pretty(report.urgency_outcome),
            formatDate(report.issued_at),
            <ReportFormatMenu key={`pdf-${report.id}`} reportId={report.id} role="hospital" />,
          ])}
        />
      </section>

      <section className="sentinel-card p-6">
        <h2 className="mb-4 text-xl font-semibold">Encounters</h2>
        <SimpleTable
          headers={["Encounter", "Date", "Type", "Status"]}
          rows={encounters.map((encounter: any) => [
            encounter.encounter_id,
            formatDate(encounter.encounter_date),
            pretty(encounter.encounter_type),
            pretty(encounter.screening_status),
          ])}
        />
      </section>

      <section className="sentinel-card p-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Fundus Images</h2>
            <p className="text-sm text-slate-600">
              Images are available only from reports issued to your hospital.
            </p>
          </div>

          {selectedImages.length ? (
            <button
              type="button"
              onClick={() => setViewerOpen(true)}
              className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
            >
              Open Selected ({selectedImages.length})
            </button>
          ) : null}
        </div>

        {!uploads.length ? (
          <p className="text-sm text-slate-500">
            No issued-report images are available.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {uploads.map((image: any) => {
              const selected = selectedImages.includes(image.id);

              return (
                <article
                  key={image.id}
                  className={`overflow-hidden rounded-xl border bg-white ${
                    selected ? "ring-2 ring-slate-950" : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleImage(image.id)}
                    className="block w-full text-left"
                  >
                    <img
                      src={image.image_file}
                      alt={`${image.eye_laterality} eye fundus`}
                      className="h-56 w-full object-cover"
                    />
                    <div className="space-y-1 p-3 text-sm">
                      <p className="font-semibold">
                        {pretty(image.eye_laterality)} Eye
                      </p>
                      <p>Encounter: {image.encounter_display}</p>
                      <p>Quality: {pretty(image.image_quality)}</p>
                      <p>Uploaded: {formatDate(image.uploaded_at)}</p>
                      {image.ai_analysis ? (
                        <p className="text-blue-700">
                          AI: {pretty(image.ai_analysis.prediction)}
                        </p>
                      ) : null}
                    </div>
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="font-medium text-slate-950">{value}</p>
    </div>
  );
}

function SimpleTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: React.ReactNode[][];
}) {
  if (!rows.length) {
    return <p className="text-sm text-slate-500">No records found.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-100">
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
