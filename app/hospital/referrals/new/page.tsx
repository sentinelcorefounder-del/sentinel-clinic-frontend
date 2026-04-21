"use client";

import Link from "next/link";
import { useState } from "react";
import { submitHospitalReferral } from "@/lib/api";

export default function HospitalNewReferralPage() {
  const [form, setForm] = useState({
    patient_id: "",
    first_name: "",
    last_name: "",
    dob: "",
    patient_sex: "female",
    hospital_mrn: "",
    diabetes_type: "type_2",
    reason_for_referral: "",
    phone_number: "",
    email: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  function updateField(name: string, value: string) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage("");
    setError("");

    try {
      const result = await submitHospitalReferral(form);
      setSuccessMessage(
        `Referral submitted successfully. Submission ID: ${result.submission_id}`
      );

      setForm({
        patient_id: "",
        first_name: "",
        last_name: "",
        dob: "",
        patient_sex: "female",
        hospital_mrn: "",
        diabetes_type: "type_2",
        reason_for_referral: "",
        phone_number: "",
        email: "",
        notes: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-10">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">
            New Hospital Referral
          </h1>
          <p className="mt-1 text-sm text-slate-700">
            Submit a new patient referral into Sentinel Ops intake.
          </p>
        </div>

        <Link
          href="/hospital"
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
        >
          Back to Dashboard
        </Link>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-950">
            Patient Identity
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-800">
                Patient ID *
              </label>
              <input
                value={form.patient_id}
                onChange={(e) => updateField("patient_id", e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-950"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-800">
                Hospital MRN / Local Patient Number
              </label>
              <input
                value={form.hospital_mrn}
                onChange={(e) => updateField("hospital_mrn", e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-950"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-800">
                First Name *
              </label>
              <input
                value={form.first_name}
                onChange={(e) => updateField("first_name", e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-950"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-800">
                Last Name *
              </label>
              <input
                value={form.last_name}
                onChange={(e) => updateField("last_name", e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-950"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-800">
                DOB *
              </label>
              <input
                type="date"
                value={form.dob}
                onChange={(e) => updateField("dob", e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-950"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-800">
                Patient Sex *
              </label>
              <select
                value={form.patient_sex}
                onChange={(e) => updateField("patient_sex", e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-950"
                required
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-950">
            Clinical Referral Details
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-800">
                Diabetes Type *
              </label>
              <select
                value={form.diabetes_type}
                onChange={(e) => updateField("diabetes_type", e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-950"
                required
              >
                <option value="type_1">Type 1</option>
                <option value="type_2">Type 2</option>
                <option value="other">Other</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-800">
                Reason for Referral *
              </label>
              <textarea
                value={form.reason_for_referral}
                onChange={(e) =>
                  updateField("reason_for_referral", e.target.value)
                }
                rows={4}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-950"
                required
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-950">
            Contact Details
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-800">
                Phone Number
              </label>
              <input
                value={form.phone_number}
                onChange={(e) => updateField("phone_number", e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-950"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-800">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-950"
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-950">
            Additional Notes
          </h2>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-800">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-950"
            />
          </div>
        </section>

        {successMessage ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            {successMessage}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
            {error}
          </div>
        ) : null}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-medium !text-white hover:bg-blue-800 disabled:opacity-60"
          >
            {loading ? "Submitting..." : "Submit Referral"}
          </button>

          <Link
            href="/hospital/referrals"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
          >
            View Referrals
          </Link>
        </div>
      </form>
    </main>
  );
}