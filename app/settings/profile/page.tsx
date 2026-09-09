"use client";

import { FormEvent, useEffect, useState } from "react";
import { fetchClinicalProfile, saveClinicalProfile, type ClinicalProfile } from "@/lib/staff-api";

const emptyProfile: Omit<ClinicalProfile, "is_verified"> = {
  display_name: "",
  professional_role: "",
  registration_number: "",
  registration_body: "",
  qualifications: "",
  signature_name: "",
};

export default function ProfessionalProfilePage() {
  const [form, setForm] = useState(emptyProfile);
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchClinicalProfile()
      .then(({ clinical_profile }) => {
        if (clinical_profile) {
          setForm({
            display_name: clinical_profile.display_name || "",
            professional_role: clinical_profile.professional_role || "",
            registration_number: clinical_profile.registration_number || "",
            registration_body: clinical_profile.registration_body || "",
            qualifications: clinical_profile.qualifications || "",
            signature_name: clinical_profile.signature_name || "",
          });
          setVerified(Boolean(clinical_profile.is_verified));
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load professional profile."))
      .finally(() => setLoading(false));
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true); setMessage(""); setError("");
    try {
      const { clinical_profile } = await saveClinicalProfile(form);
      setVerified(Boolean(clinical_profile.is_verified));
      setMessage(clinical_profile.is_verified ? "Professional profile saved." : "Professional profile saved. Sentinel verification is required before clinical sign-off.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save professional profile.");
    } finally { setSaving(false); }
  }

  if (loading) return <main className="p-8">Loading professional profile...</main>;

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-950">Professional Profile</h1>
        <p className="mt-2 text-slate-600">These details are used when you take clinical responsibility and sign a clinical report. Completing this profile does not grant a clinical role.</p>
      </div>

      <div className={`rounded-xl border p-4 text-sm ${verified ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
        <strong>{verified ? "Verified professional profile" : "Verification required"}</strong>
        <p className="mt-1">{verified ? "Your current professional details are verified for clinical sign-off." : "An authorised Sentinel Ops reviewer must verify your professional details before you can finalize reports."}</p>
      </div>

      {verified ? <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Changing any professional credential will reset verification and require re-verification.</div> : null}
      {message ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{message}</div> : null}
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div> : null}

      <form onSubmit={submit} className="grid gap-4 rounded-2xl border bg-white p-6 shadow-sm md:grid-cols-2">
        <Field label="Professional / display name" required value={form.display_name} onChange={(value) => setForm({ ...form, display_name: value })} />
        <Field label="Professional role / title" required value={form.professional_role} onChange={(value) => setForm({ ...form, professional_role: value })} placeholder="Optometrist" />
        <Field label="Registration number" required value={form.registration_number} onChange={(value) => setForm({ ...form, registration_number: value })} />
        <Field label="Registration body" value={form.registration_body} onChange={(value) => setForm({ ...form, registration_body: value })} placeholder="e.g. ODORBN / GOC" />
        <Field label="Qualifications" value={form.qualifications} onChange={(value) => setForm({ ...form, qualifications: value })} placeholder="e.g. OD, BSc Optom" />
        <Field label="Signature name" value={form.signature_name} onChange={(value) => setForm({ ...form, signature_name: value })} placeholder="Name to show at sign-off" />
        <div className="md:col-span-2">
          <button disabled={saving} className="rounded-xl bg-slate-900 px-5 py-2.5 font-semibold text-white disabled:opacity-50">{saving ? "Saving..." : "Save professional profile"}</button>
        </div>
      </form>
    </main>
  );
}

function Field({ label, value, onChange, required = false, placeholder = "" }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; placeholder?: string }) {
  return <label className="space-y-1 text-sm font-medium text-slate-800"><span>{label}</span><input required={required} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-slate-300 p-3 font-normal" /></label>;
}
