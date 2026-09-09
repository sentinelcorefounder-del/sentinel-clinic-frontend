"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { createClinicStaff, fetchClinicStaff, updateClinicStaff, type ClinicStaffMember, type ClinicStaffPayload } from "@/lib/staff-api";

const ROLE_LABELS: Record<string, string> = {
  clinic_admin: "Clinic administrator",
  clinic_screener: "Clinic screener / technician",
  optometrist: "Optometrist",
  reviewer: "Qualified retinal reviewer",
  clinic_owner_optometrist: "Clinic owner optometrist",
};

export default function ClinicStaffManager({ organizationId, mode = "clinic" }: { organizationId: number | string; mode?: "clinic" | "ops" }) {
  const [data, setData] = useState<ClinicStaffPayload | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | "new" | null>(null);
  const [form, setForm] = useState({ username: "", email: "", first_name: "", last_name: "", roles: [] as string[], all_branch_access: true, branch_ids: [] as number[] });

  const load = useCallback(async () => {
    const payload = await fetchClinicStaff(organizationId);
    setData(payload);
  }, [organizationId]);

  useEffect(() => { load().catch((err) => setError(err instanceof Error ? err.message : "Unable to load clinic staff.")); }, [load]);

  function toggleRole(current: string[], role: string) { return current.includes(role) ? current.filter((item) => item !== role) : [...current, role]; }

  async function create(event: FormEvent) {
    event.preventDefault(); setBusyId("new"); setMessage(""); setError("");
    try {
      await createClinicStaff(organizationId, form);
      setForm({ username: "", email: "", first_name: "", last_name: "", roles: [], all_branch_access: true, branch_ids: [] });
      setMessage("Staff account created. An activation email has been requested for the staff member.");
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to add staff."); }
    finally { setBusyId(null); }
  }

  async function save(member: ClinicStaffMember, patch: Record<string, unknown>) {
    setBusyId(member.id); setMessage(""); setError("");
    try { await updateClinicStaff(organizationId, member.id, patch); setMessage(`${member.username} updated.`); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to update staff member."); }
    finally { setBusyId(null); }
  }

  if (!data) return <section className="rounded-2xl border bg-white p-5">Loading staff and permissions...</section>;

  const assignable = data.assignable_roles.filter((role) => mode === "ops" || role !== "clinic_owner_optometrist");

  return (
    <section className="space-y-5 rounded-2xl border bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-xl font-bold">Staff & Permissions</h2>
        <p className="mt-1 text-sm text-slate-600">Assign clinic roles and branch access. Clinical authority requires an explicit Optometrist or Reviewer role; clinic administration alone does not grant clinical authority.</p>
      </div>
      {message ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</div> : null}
      {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div> : null}

      <div className="space-y-4">
        {data.staff.map((member) => <StaffCard key={member.id} member={member} data={data} assignableRoles={assignable} busy={busyId === member.id} canVerify={mode === "ops" && data.can_verify_profiles} onSave={(patch) => save(member, patch)} />)}
        {!data.staff.length ? <p className="text-sm text-slate-500">No staff accounts are linked to this clinic.</p> : null}
      </div>

      <form onSubmit={create} className="space-y-4 rounded-xl border bg-slate-50 p-4">
        <div><h3 className="font-semibold">Add clinic staff</h3><p className="text-xs text-slate-600">Creates a new account linked only to {data.organization.name}.</p></div>
        <div className="grid gap-3 md:grid-cols-2">
          <input required className="rounded border p-3" placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <input required type="email" className="rounded border p-3" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="rounded border p-3" placeholder="First name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
          <input className="rounded border p-3" placeholder="Last name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
        </div>
        <RoleCheckboxes roles={assignable} selected={form.roles} onChange={(role) => setForm({ ...form, roles: toggleRole(form.roles, role) })} />
        <BranchSelector data={data} all={form.all_branch_access} selected={form.branch_ids} onAll={(value) => setForm({ ...form, all_branch_access: value, branch_ids: value ? [] : form.branch_ids })} onToggle={(id) => setForm({ ...form, branch_ids: form.branch_ids.includes(id) ? form.branch_ids.filter((value) => value !== id) : [...form.branch_ids, id] })} />
        <button disabled={busyId === "new"} className="rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white disabled:opacity-50">{busyId === "new" ? "Adding..." : "Add staff member"}</button>
      </form>
    </section>
  );
}

function StaffCard({ member, data, assignableRoles, busy, canVerify, onSave }: { member: ClinicStaffMember; data: ClinicStaffPayload; assignableRoles: string[]; busy: boolean; canVerify: boolean; onSave: (patch: Record<string, unknown>) => void }) {
  const [roles, setRoles] = useState(member.roles);
  const [all, setAll] = useState(member.all_branch_access);
  const [branchIds, setBranchIds] = useState(member.branch_ids);
  useEffect(() => { setRoles(member.roles); setAll(member.all_branch_access); setBranchIds(member.branch_ids); }, [member]);
  const clinicalRole = roles.some((role) => ["optometrist", "reviewer", "clinic_owner_optometrist"].includes(role));

  return <div className="rounded-xl border p-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="font-semibold">{[member.first_name, member.last_name].filter(Boolean).join(" ") || member.username}</p><p className="text-sm text-slate-600">{member.username} · {member.email || "No email"}</p></div>
      <span className={`rounded-full px-2 py-1 text-xs ${member.is_active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{member.is_active ? "Active" : "Inactive"}</span>
    </div>
    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      <div><p className="mb-2 text-sm font-semibold">Roles</p><RoleCheckboxes roles={assignableRoles} selected={roles} onChange={(role) => setRoles(roles.includes(role) ? roles.filter((item) => item !== role) : [...roles, role])} /></div>
      <div><p className="mb-2 text-sm font-semibold">Branch access</p><BranchSelector data={data} all={all} selected={branchIds} onAll={(value) => { setAll(value); if (value) setBranchIds([]); }} onToggle={(id) => setBranchIds(branchIds.includes(id) ? branchIds.filter((value) => value !== id) : [...branchIds, id])} /></div>
    </div>
    {clinicalRole ? <div className="mt-4 rounded-lg border bg-slate-50 p-3 text-sm"><strong>Professional profile:</strong> {member.clinical_profile ? `${member.clinical_profile.display_name} · ${member.clinical_profile.registration_number}` : "Not completed"}<br/><span className={member.clinical_profile?.is_verified ? "text-emerald-700" : "text-amber-700"}>{member.clinical_profile?.is_verified ? "Verified for clinical sign-off" : "Verification required before clinical sign-off"}</span>{canVerify && member.clinical_profile ? <div className="mt-2"><button type="button" onClick={() => onSave({ clinical_profile_verified: !member.clinical_profile?.is_verified })} className="rounded border bg-white px-3 py-1.5 text-xs font-semibold">{member.clinical_profile.is_verified ? "Remove verification" : "Verify professional profile"}</button></div> : null}</div> : null}
    <div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={() => onSave({ roles, all_branch_access: all, branch_ids: all ? [] : branchIds })} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Saving..." : "Save roles & access"}</button><button type="button" disabled={busy} onClick={() => onSave({ is_active: !member.is_active })} className="rounded-lg border px-4 py-2 text-sm font-semibold">{member.is_active ? "Deactivate" : "Reactivate"}</button></div>
  </div>;
}

function RoleCheckboxes({ roles, selected, onChange }: { roles: string[]; selected: string[]; onChange: (role: string) => void }) {
  return <div className="flex flex-wrap gap-2">{roles.map((role) => <label key={role} className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm"><input type="checkbox" checked={selected.includes(role)} onChange={() => onChange(role)} />{ROLE_LABELS[role] || role}</label>)}</div>;
}

function BranchSelector({ data, all, selected, onAll, onToggle }: { data: ClinicStaffPayload; all: boolean; selected: number[]; onAll: (value: boolean) => void; onToggle: (id: number) => void }) {
  return <div className="space-y-2 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={all} onChange={(e) => onAll(e.target.checked)} />All active clinic branches</label>{!all ? <div className="ml-5 space-y-1">{data.branches.map((branch) => <label key={branch.id} className="flex items-center gap-2"><input type="checkbox" checked={selected.includes(branch.id)} onChange={() => onToggle(branch.id)} />{branch.name} ({branch.branch_code})</label>)}</div> : null}</div>;
}
