"use client";

import { useState } from "react";
import { financeWrite } from "@/lib/finance-api";
import type { AssessmentServiceSession, ServicePartner } from "@/types/finance";

type OrganizationOption = { id: number; name: string; organization_type: string; branches: Array<{ id: number; name: string }> };

export default function InternalFinanceFoundationManager({ sessions, partners, organizations, canAdminPartners }: {
  sessions: AssessmentServiceSession[];
  partners: ServicePartner[];
  organizations: OrganizationOption[];
  canAdminPartners: boolean;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(path: string, method: "POST" | "PATCH", body: unknown) {
    setBusy(true);
    setError("");
    try {
      await financeWrite(path, method, body);
      window.location.reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The internal-finance action failed.");
      setBusy(false);
    }
  }

  return <div className="space-y-8">
    <header>
      <h1 className="text-3xl font-bold">Service delivery foundation</h1>
      <p className="mt-1 text-slate-600">Configure non-login service partners and prospective assessment sessions. This area does not post earnings or balances.</p>
    </header>
    {error ? <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}

    <section className="grid gap-5 lg:grid-cols-2">
      {canAdminPartners ? <form className="space-y-3 rounded-2xl border bg-white p-5" onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        void submit("/api/finance/internal/service-partners/", "POST", {
          clinic_id: data.get("clinic_id"), name: data.get("name"),
          contact_email: data.get("contact_email"), currency: "NGN", is_active: true,
        });
      }}>
        <h2 className="text-lg font-bold">Create service partner</h2>
        <input required name="clinic_id" placeholder="Partner code" className="w-full rounded border p-2" />
        <input required name="name" placeholder="Legal/display name" className="w-full rounded border p-2" />
        <input name="contact_email" type="email" placeholder="Finance contact email (optional)" className="w-full rounded border p-2" />
        <button disabled={busy} className="rounded bg-blue-700 px-4 py-2 font-semibold text-white">Create non-login partner</button>
      </form> : <div className="rounded-2xl border bg-slate-50 p-5 text-sm text-slate-600">Service-partner creation remains restricted to internal finance administrators.</div>}

      <form className="space-y-3 rounded-2xl border bg-white p-5" onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const providerType = String(data.get("provider_type"));
        void submit("/api/finance/internal/service-sessions/", "POST", {
          service_date: data.get("service_date"), location_type: data.get("location_type"),
          participating_organization: Number(data.get("participating_organization")),
          service_branch: data.get("service_branch") ? Number(data.get("service_branch")) : null,
          provider_type: providerType,
          service_partner: providerType === "service_partner" ? Number(data.get("service_partner")) : null,
          sentinel_arranged_transport: data.get("sentinel_arranged_transport") === "on",
          camera_team_rate: data.get("camera_team_rate"),
          logistics_allocation_rate: data.get("logistics_allocation_rate"), currency: "NGN",
          notes: data.get("notes"),
        });
      }}>
        <h2 className="text-lg font-bold">Create draft session</h2>
        <input required type="date" name="service_date" className="w-full rounded border p-2" />
        <select required name="location_type" className="w-full rounded border p-2"><option value="mobile">Mobile</option><option value="hospital">Hospital</option><option value="clinic">Clinic</option></select>
        <select required name="participating_organization" className="w-full rounded border p-2"><option value="">Participating clinic or hospital</option>{organizations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <select name="service_branch" className="w-full rounded border p-2"><option value="">No branch</option>{organizations.flatMap((item) => item.branches.map((branch) => <option key={branch.id} value={branch.id}>{item.name} — {branch.name}</option>))}</select>
        <select required name="provider_type" className="w-full rounded border p-2"><option value="sentinel">Sentinel camera/team</option><option value="service_partner">Service-partner camera/team</option></select>
        <select name="service_partner" className="w-full rounded border p-2"><option value="">No service partner</option>{partners.filter((item) => item.is_active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <div className="grid grid-cols-2 gap-3"><input required name="camera_team_rate" defaultValue="5000.00" className="rounded border p-2" /><input required name="logistics_allocation_rate" defaultValue="2500.00" className="rounded border p-2" /></div>
        <label className="flex gap-2 text-sm"><input type="checkbox" name="sentinel_arranged_transport" /> Sentinel-arranged transport</label>
        <textarea name="notes" placeholder="Notes" className="w-full rounded border p-2" />
        <button disabled={busy} className="rounded bg-blue-700 px-4 py-2 font-semibold text-white">Create draft session</button>
      </form>
    </section>

    <section className="rounded-2xl border bg-white p-5">
      <h2 className="mb-3 text-lg font-bold">Configured service partners</h2>
      <div className="space-y-2">{partners.length ? partners.map((partner) => <div key={partner.id} className="flex flex-wrap items-center justify-between gap-3 rounded border p-3">
        <div><p className="font-semibold">{partner.name}</p><p className="font-mono text-xs text-slate-600">{partner.clinic_id} · {partner.is_active ? "Active" : "Inactive"}</p></div>
        {partner.is_active && canAdminPartners ? <button disabled={busy} onClick={() => void submit(`/api/finance/internal/service-partners/${partner.id}/`, "PATCH", { is_active: false })} className="rounded bg-slate-700 px-3 py-1 text-sm text-white">Deactivate</button> : null}
      </div>) : <p className="text-sm text-slate-500">No service partners configured.</p>}</div>
    </section>

    <section className="overflow-x-auto rounded-2xl border bg-white">
      <table className="w-full text-sm"><thead className="bg-slate-50 text-left"><tr><th className="p-3">Session</th><th className="p-3">Date/location</th><th className="p-3">Provider</th><th className="p-3">Terms</th><th className="p-3">Status</th><th className="p-3">Encounters</th><th className="p-3">Actions</th></tr></thead>
        <tbody>{sessions.map((session) => <tr key={session.id} className="border-t align-top">
          <td className="p-3"><p className="font-mono text-xs">{session.session_reference}</p><p>{session.participating_organization_name}</p></td>
          <td className="p-3">{session.service_date}<br />{session.location_type}</td>
          <td className="p-3">{session.provider_type === "sentinel" ? "Sentinel" : session.service_partner_name}</td>
          <td className="p-3">Camera/team ₦{session.camera_team_rate}<br />Logistics ₦{session.logistics_allocation_rate}<br />Transport {session.sentinel_arranged_transport ? "Yes" : "No"}</td>
          <td className="p-3">{session.status} · v{session.configuration_version}</td>
          <td className="p-3">{session.linked_encounter_count}</td>
          <td className="space-y-2 p-3">
            {session.status === "draft" ? <button disabled={busy} onClick={() => {
              const cameraRate = window.prompt("Camera/team rate", session.camera_team_rate);
              const logisticsRate = window.prompt("Configured logistics rate", session.logistics_allocation_rate);
              if (cameraRate && logisticsRate) void submit(`/api/finance/internal/service-sessions/${session.id}/`, "PATCH", { camera_team_rate: cameraRate, logistics_allocation_rate: logisticsRate });
            }} className="block rounded border px-3 py-1">Edit draft rates</button> : null}
            {session.status === "draft" ? <button disabled={busy} onClick={() => void submit(`/api/finance/internal/service-sessions/${session.id}/activate/`, "POST", {})} className="block rounded bg-green-700 px-3 py-1 text-white">Activate</button> : null}
            {session.status === "active" ? <button disabled={busy} onClick={() => void submit(`/api/finance/internal/service-sessions/${session.id}/complete/`, "POST", {})} className="block rounded bg-blue-700 px-3 py-1 text-white">Complete</button> : null}
            {["draft", "active"].includes(session.status) ? <button disabled={busy} onClick={() => { const reason = window.prompt("Cancellation reason"); if (reason) void submit(`/api/finance/internal/service-sessions/${session.id}/cancel/`, "POST", { reason }); }} className="block rounded bg-slate-700 px-3 py-1 text-white">Cancel</button> : null}
          </td>
        </tr>)}</tbody>
      </table>
    </section>
    <p className="text-sm text-slate-600">Encounters will be associated prospectively through the appropriate authorised encounter workflow in a later release.</p>
  </div>;
}
