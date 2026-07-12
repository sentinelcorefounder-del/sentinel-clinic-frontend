"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  fetchHospitalPatients,
  type HospitalPatientListItem,
} from "@/lib/api";

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

function statusClass(status?: string) {
  const normalized = (status || "").toLowerCase();

  if (
    normalized === "completed" ||
    normalized === "report_issued" ||
    normalized === "issued" ||
    normalized === "paid"
  ) {
    return "border-emerald-200 bg-emerald-100 text-emerald-800";
  }

  if (
    normalized === "submitted_to_ops" ||
    normalized === "pending"
  ) {
    return "border-amber-200 bg-amber-100 text-amber-800";
  }

  if (
    normalized === "returned_to_clinic" ||
    normalized === "ops_rejected" ||
    normalized === "cancelled"
  ) {
    return "border-red-200 bg-red-100 text-red-800";
  }

  return "border-slate-200 bg-slate-100 text-slate-800";
}

export default function HospitalPatientsPage() {
  const [patients, setPatients] = useState<HospitalPatientListItem[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadPatients() {
    try {
      setLoading(true);
      setError("");
      const data = await fetchHospitalPatients({ search, status });
      setPatients(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load hospital patients."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPatients();
  }, []);

  return (
    <main className="sentinel-page min-h-screen">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">
            Hospital Patients
          </h1>
          <p className="mt-1 text-sm text-slate-700">
            Patients linked to referrals submitted by your hospital.
          </p>
        </div>

        <Link
          href="/hospital/referrals/new"
          className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold !text-white hover:bg-slate-800"
        >
          New Referral
        </Link>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          loadPatients();
        }}
        className="mb-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4"
      >
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Patient, Sentinel ID, MRN or referral"
          className="rounded-xl border border-slate-300 px-3 py-2 md:col-span-2"
        />

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="rounded-xl border border-slate-300 px-3 py-2"
        >
          <option value="all">All statuses</option>
          <option value="submitted">Awaiting clinic</option>
          <option value="clinic_matched">Clinic matched</option>
          <option value="in_clinic">In clinic</option>
          <option value="submitted_to_ops">Awaiting Ops review</option>
          <option value="returned_to_clinic">Returned for correction</option>
          <option value="report_ready">Report ready</option>
          <option value="completed">Completed</option>
        </select>

        <button className="rounded-xl bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800">
          Apply Filters
        </button>
      </form>

      {error ? (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-4">Patient</th>
              <th className="p-4">Sentinel ID</th>
              <th className="p-4">Hospital MRN</th>
              <th className="p-4">Referral</th>
              <th className="p-4">Clinic</th>
              <th className="p-4">Referral Status</th>
              <th className="p-4">Report</th>
              <th className="p-4">Payment</th>
              <th className="p-4">Last Activity</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="p-6 text-slate-600">
                  Loading patients...
                </td>
              </tr>
            ) : patients.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-6 text-slate-600">
                  No patients found.
                </td>
              </tr>
            ) : (
              patients.map((patient) => (
                <tr
                  key={patient.patient_pk}
                  className="border-t border-slate-200 hover:bg-slate-50"
                >
                  <td className="p-4 font-semibold text-slate-950">
                    {patient.patient_name}
                  </td>
                  <td className="p-4">{patient.patient_id}</td>
                  <td className="p-4">{patient.hospital_mrn || "-"}</td>
                  <td className="p-4">{patient.referral_id}</td>
                  <td className="p-4">{patient.clinic_name || "Not assigned"}</td>
                  <td className="p-4">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(
                        patient.referral_status
                      )}`}
                    >
                      {pretty(patient.referral_status)}
                    </span>
                  </td>
                  <td className="p-4">
                    <div>{patient.report_id || "-"}</div>
                    <div className="text-xs text-slate-500">
                      {pretty(patient.report_status)}
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(
                        patient.payment_status
                      )}`}
                    >
                      {pretty(patient.payment_status)}
                    </span>
                  </td>
                  <td className="p-4">
                    {formatDate(patient.latest_activity)}
                  </td>
                  <td className="p-4">
                    <Link
                      href={`/hospital/patients/${patient.patient_pk}`}
                      className="inline-flex rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold !text-white hover:bg-slate-800"
                    >
                      View Patient
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
