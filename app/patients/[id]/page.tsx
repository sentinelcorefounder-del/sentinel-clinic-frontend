"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  fetchPatientById,
  fetchPatientConsents,
  fetchPatientEncounters,
  fetchPatientReports,
  fetchPatientUploads,
  getReportPdfUrl,
} from "@/lib/api";
import type { ImageUpload } from "@/types/upload";

type Patient = {
  id: number;
  patient_id: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  sex?: string;
  phone?: string;
  email?: string;
  consent_status?: string;
  assigned_clinic?: number | null;
  referral_id?: string;
};

type Encounter = {
  id: number;
  encounter_id: string;
  encounter_date: string;
  screening_status: string;
  encounter_type: string;
};

type Report = {
  id: number;
  report_id: string;
  review_date: string;
  report_status: string;
  left_dr_grade?: string;
  right_dr_grade?: string;
  left_maculopathy_grade?: string;
  right_maculopathy_grade?: string;
  urgency_outcome?: string;
};

type Consent = {
  id: number;
  consent_id: string;
  consent_type: string;
  consent_status: string;
  consent_date: string;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

function pretty(value?: string | null) {
  if (!value) return "-";
  return value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function resolveFileUrl(fileUrl?: string | null) {
  if (!fileUrl) return "";
  return fileUrl.startsWith("http") ? fileUrl : `${API_BASE_URL}${fileUrl}`;
}

export default function PatientDetailPage() {
  const params = useParams();
  const id = String(params.id);

  const [patient, setPatient] = useState<Patient | null>(null);
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [consents, setConsents] = useState<Consent[]>([]);
  const [uploads, setUploads] = useState<ImageUpload[]>([]);
  const [selectedUploadIds, setSelectedUploadIds] = useState<number[]>([]);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUploads, setViewerUploads] = useState<ImageUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");

        const [patientData, encounterData, reportData, consentData, uploadData] =
          await Promise.all([
            fetchPatientById(id),
            fetchPatientEncounters(id),
            fetchPatientReports(id),
            fetchPatientConsents(id),
            fetchPatientUploads(id),
          ]);

        setPatient(patientData);
        setEncounters(encounterData);
        setReports(reportData);
        setConsents(consentData);
        setUploads(uploadData);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to load patient details.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  const groupedUploads = useMemo(() => {
    return uploads.reduce<Record<string, ImageUpload[]>>((acc, upload) => {
      const dateKey = formatDate(upload.uploaded_at);
      acc[dateKey] = acc[dateKey] || [];
      acc[dateKey].push(upload);
      return acc;
    }, {});
  }, [uploads]);

  function toggleSelected(uploadId: number) {
    setSelectedUploadIds((current) =>
      current.includes(uploadId)
        ? current.filter((id) => id !== uploadId)
        : [...current, uploadId]
    );
  }

  function openViewerFromUpload(upload: ImageUpload) {
    const selected = uploads.filter((item) => selectedUploadIds.includes(item.id));

    if (selected.length > 0 && selectedUploadIds.includes(upload.id)) {
      setViewerUploads(selected);
    } else {
      setViewerUploads([upload]);
    }

    setViewerOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function clearSelection() {
    setSelectedUploadIds([]);
  }

  if (loading) return <main className="p-10">Loading patient...</main>;
  if (error) return <main className="p-10 text-red-600">{error}</main>;
  if (!patient) return <main className="p-10">Patient not found.</main>;

  return (
    <main className="sentinel-page space-y-8">
      {viewerOpen && (
        <section className="fixed inset-x-4 top-4 z-50 max-h-[92vh] overflow-auto rounded-2xl border bg-white p-4 shadow-2xl">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Selected Patient Images</h2>
              <p className="text-sm text-gray-600">
                {viewerUploads.length} image{viewerUploads.length === 1 ? "" : "s"} selected for review.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setViewerOpen(false)}
              className="rounded-full border px-4 py-2 text-sm font-semibold hover:bg-gray-100"
              aria-label="Close image viewer"
            >
              ✕ Close
            </button>
          </div>

          <div className={`grid gap-4 ${viewerUploads.length === 1 ? "grid-cols-1" : "md:grid-cols-2"}`}>
            {viewerUploads.map((upload) => (
              <div key={upload.id} className="rounded-xl border bg-gray-50 p-3">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="font-semibold">{pretty(upload.eye_laterality)} Eye</span>
                  <span>{formatDate(upload.uploaded_at)}</span>
                </div>
                <img
                  src={resolveFileUrl(upload.image_file)}
                  alt={`${upload.eye_laterality} eye retinal image`}
                  className="max-h-[72vh] w-full rounded-lg object-contain"
                />
                <div className="mt-2 text-xs text-gray-600">
                  <p>Image ID: {upload.image_upload_id}</p>
                  <p>Encounter: {upload.encounter_display || upload.encounter}</p>
                  <p>Quality: {pretty(upload.image_quality)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {patient.first_name} {patient.last_name}
          </h1>
          <p className="text-sm text-gray-600">{patient.patient_id}</p>
        </div>

        <Link
          href={`/encounters/new?patientId=${patient.id}`}
          className="sentinel-primary-button"
        >
          Create Encounter
        </Link>
      </div>

      <section className="sentinel-card grid gap-4 p-6 md:grid-cols-3">
        <Info label="DOB" value={patient.date_of_birth || "-"} />
        <Info label="Sex" value={pretty(patient.sex)} />
        <Info label="Phone" value={patient.phone || "-"} />
        <Info label="Email" value={patient.email || "-"} />
        <Info label="Consent" value={pretty(patient.consent_status)} />
        <Info label="Referral ID" value={patient.referral_id || "-"} />
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Patient Image Timeline</h2>
            <p className="text-sm text-gray-600">
              Select any images, then double-click one selected image to open them together at the top of the page.
            </p>
          </div>

          {selectedUploadIds.length > 0 && (
            <button
              type="button"
              onClick={clearSelection}
              className="sentinel-secondary-button text-sm"
            >
              Clear selection ({selectedUploadIds.length})
            </button>
          )}
        </div>

        {uploads.length === 0 ? (
          <div className="sentinel-card p-5 text-sm text-slate-600">
            No images uploaded for this patient yet.
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedUploads).map(([date, items]) => (
              <div key={date} className="sentinel-card p-5">
                <h3 className="mb-3 font-semibold">{date}</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {items.map((upload) => (
                    <ImageCard
                      key={upload.id}
                      upload={upload}
                      selected={selectedUploadIds.includes(upload.id)}
                      onToggle={() => toggleSelected(upload.id)}
                      onDoubleClick={() => openViewerFromUpload(upload)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <HistoryTable
          title="Encounters"
          rows={encounters.map((encounter) => [
            encounter.encounter_date,
            <Link
              key={`encounter-${encounter.id}`}
              href={`/encounters/${encounter.id}`}
              className="font-semibold text-blue-700 underline"
            >
              {encounter.encounter_id}
            </Link>,
            pretty(encounter.screening_status),
            pretty(encounter.encounter_type),
          ])}
        />

        <HistoryTable
          title="Reports"
          rows={reports.map((report) => [
            report.review_date,
            <a
              key={`report-${report.id}`}
              href={getReportPdfUrl(report.id)}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-blue-700 underline"
            >
              {report.report_id}
            </a>,
            `R: ${pretty(report.right_dr_grade)} / L: ${pretty(report.left_dr_grade)}`,
            pretty(report.report_status),
          ])}
        />

        <HistoryTable
          title="Consents"
          rows={consents.map((consent) => [
            consent.consent_date,
            pretty(consent.consent_type),
            pretty(consent.consent_status),
            consent.consent_id,
          ])}
        />
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function ImageCard({
  upload,
  selected,
  onToggle,
  onDoubleClick,
}: {
  upload: ImageUpload;
  selected: boolean;
  onToggle: () => void;
  onDoubleClick: () => void;
}) {
  return (
    <div
      onDoubleClick={onDoubleClick}
      className={`overflow-hidden rounded-lg border bg-white transition ${
        selected ? "ring-2 ring-black" : "hover:shadow"
      }`}
      title="Click to select. Double-click to open selected images."
    >
      <div className="flex items-center gap-2 border-b bg-gray-50 p-2">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          onClick={(event) => event.stopPropagation()}
        />
        <button
          type="button"
          onClick={onToggle}
          className="text-left text-sm font-semibold"
        >
          {pretty(upload.eye_laterality)} Eye — {formatDate(upload.uploaded_at)}
        </button>
      </div>

      <button type="button" onClick={onToggle} className="block w-full">
        <img
          src={resolveFileUrl(upload.image_file)}
          alt={`${upload.eye_laterality} eye image`}
          className="h-56 w-full object-cover"
        />
      </button>

      <div className="space-y-1 p-3 text-sm">
        <p>Image ID: {upload.image_upload_id}</p>
        <p>Encounter: {upload.encounter_display || upload.encounter}</p>
        <p>Quality: {pretty(upload.image_quality)}</p>
        {upload.ai_analysis ? (
          <p className="text-blue-700">
            AI: {pretty(upload.ai_analysis.prediction)}{" "}
            {upload.ai_analysis.confidence !== null && upload.ai_analysis.confidence !== undefined
              ? `(${Number(upload.ai_analysis.confidence).toFixed(2)})`
              : ""}
          </p>
        ) : (
          <p className="text-amber-700">AI pending/not shown</p>
        )}
        {upload.dataset_label ? (
          <p className="text-emerald-700">Dataset: {upload.dataset_label.label_id}</p>
        ) : (
          <p className="text-amber-700">Dataset pending / AI consent not granted</p>
        )}
      </div>
    </div>
  );
}

function HistoryTable({
  title,
  rows,
}: {
  title: string;
  rows: React.ReactNode[][];
}) {
  return (
    <div className="sentinel-card p-5">
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-500">No records yet.</p>
      ) : (
        <div className="space-y-2 text-sm">
          {rows.map((row, index) => (
            <div key={index} className="rounded border bg-gray-50 p-2">
              {row.map((cell, cellIndex) => (
                <div key={cellIndex}>{cell}</div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
