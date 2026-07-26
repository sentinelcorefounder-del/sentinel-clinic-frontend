"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function cookie(name: string) {
  return document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${name}=`))
    ?.split("=")
    .slice(1)
    .join("=") || "";
}

export default function OrganizationBrandingEditor({
  organization,
  onSaved,
}: {
  organization: any;
  onSaved?: (organization: any) => void;
}) {
  const [form, setForm] = useState({
    name: organization.name || "",
    address: organization.address || "",
    contact_email: organization.contact_email || "",
    phone: organization.phone || "",
    report_footer_note: organization.report_footer_note || "",
    branding_policy:
      organization.capability_profile?.branding_policy ||
      "organization_and_sentinel",
  });
  const [logo, setLogo] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await fetch(`${API_URL}/api/auth/csrf/`, { credentials: "include" });
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => body.append(key, value));
      if (logo) body.append("logo", logo);
      const response = await fetch(`${API_URL}/api/organizations/${organization.id}/`, {
        method: "PATCH",
        credentials: "include",
        headers: { "X-CSRFToken": cookie("csrftoken") },
        body,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || "Unable to save report branding.");
      setMessage("Report branding saved.");
      onSaved?.(data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save report branding.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="rounded-2xl border bg-white p-5 shadow-sm">
      <h2 className="text-xl font-bold">Patient Report Branding</h2>
      <p className="mt-1 text-sm text-slate-600">
        The selected policy controls the report header. Diabetic and combined reports
        always retain a small “Powered by Sentinel” acknowledgement.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="text-sm font-medium text-slate-700 md:col-span-2">
          Report branding policy
          <select
            value={form.branding_policy}
            onChange={(e) =>
              setForm({ ...form, branding_policy: e.target.value })
            }
            className="mt-1 w-full rounded border p-3"
          >
            <option value="organization_only">Organisation only (white label)</option>
            <option value="organization_and_sentinel">Organisation + Sentinel</option>
            <option value="sentinel_only">Sentinel only</option>
            <option value="hospital_and_sentinel">Hospital + Sentinel</option>
            <option value="hospital_clinic_sentinel">
              Hospital + clinic + Sentinel
            </option>
          </select>
        </label>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Organisation name" className="rounded border p-3" />
        <input value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} placeholder="Email" className="rounded border p-3" />
        <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" className="rounded border p-3" />
        <input type="file" accept="image/png,image/jpeg" onChange={(e) => setLogo(e.target.files?.[0] || null)} className="rounded border p-3" />
        <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Address" className="rounded border p-3 md:col-span-2" />
        <textarea value={form.report_footer_note} onChange={(e) => setForm({ ...form, report_footer_note: e.target.value })} placeholder="Optional report footer" className="rounded border p-3 md:col-span-2" />
      </div>
      {organization.logo ? <img src={organization.logo} alt="Current logo" className="mt-3 max-h-20 max-w-60 object-contain" /> : null}
      {message ? <p className="mt-3 text-sm">{message}</p> : null}
      <button disabled={saving} className="mt-4 rounded bg-blue-700 px-4 py-2 font-semibold text-white disabled:opacity-50">
        {saving ? "Saving..." : "Save report branding"}
      </button>
    </form>
  );
}
