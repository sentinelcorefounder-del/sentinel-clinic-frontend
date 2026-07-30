"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type Branch = {
  id: number;
  branch_code: string;
  name: string;
  address: string;
  contact_email: string;
  phone: string;
  is_head_office: boolean;
  is_active: boolean;
  inherits_branding: boolean;
  inherits_contract: boolean;
  inherits_wallet: boolean;
};

function csrfToken() {
  return document.cookie
    .split("; ")
    .find((part) => part.startsWith("csrftoken="))
    ?.split("=")
    .slice(1)
    .join("=") || "";
}

export default function OrganizationBranchManager({
  organizationId,
}: {
  organizationId: number | string;
}) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [form, setForm] = useState({
    branch_code: "",
    name: "",
    address: "",
    contact_email: "",
    phone: "",
  });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch(
      `${API_URL}/api/organizations/${organizationId}/branches/`,
      { credentials: "include", cache: "no-store" }
    );
    const data = await response.json().catch(() => []);
    if (!response.ok) throw new Error(data.detail || "Unable to load branches.");
    setBranches(Array.isArray(data) ? data : data.results || []);
  }, [organizationId]);

  useEffect(() => {
    load().catch((error) =>
      setMessage(error instanceof Error ? error.message : "Unable to load branches.")
    );
  }, [load]);

  async function createBranch(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await fetch(`${API_URL}/api/auth/csrf/`, { credentials: "include" });
      const response = await fetch(
        `${API_URL}/api/organizations/${organizationId}/branches/`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken(),
          },
          body: JSON.stringify(form),
        }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const detail = data.detail || Object.values(data).flat().join(" ");
        throw new Error(String(detail || "Unable to create branch."));
      }
      setForm({ branch_code: "", name: "", address: "", contact_email: "", phone: "" });
      setMessage("Branch created successfully.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create branch.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border bg-white p-5 shadow-sm">
      <h2 className="text-xl font-bold">Branches and locations</h2>
      <p className="mt-1 text-sm text-slate-600">
        Branches remain under this organisation. Branding, contracts and wallets
        inherit from the parent unless an approved override is configured.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {branches.map((branch) => (
          <div key={branch.id} className="rounded-xl border p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{branch.name}</p>
                <p className="text-xs text-slate-500">{branch.branch_code}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">
                {branch.is_head_office ? "Head office" : branch.is_active ? "Active" : "Inactive"}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-600">{branch.address || "No address recorded"}</p>
          </div>
        ))}
      </div>
      <form onSubmit={createBranch} className="mt-5 grid gap-3 md:grid-cols-2">
        <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Branch name" className="rounded border p-3" />
        <input required value={form.branch_code} onChange={(e) => setForm({ ...form, branch_code: e.target.value })} placeholder="Branch code (e.g. IKEJA)" className="rounded border p-3" />
        <input value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} placeholder="Branch email" className="rounded border p-3" />
        <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Branch phone" className="rounded border p-3" />
        <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Branch address" className="rounded border p-3 md:col-span-2" />
        <div className="md:col-span-2">
          {message ? <p className="mb-3 text-sm">{message}</p> : null}
          <button disabled={saving} className="rounded bg-blue-700 px-4 py-2 font-semibold text-white disabled:opacity-50">
            {saving ? "Creating..." : "Add branch"}
          </button>
        </div>
      </form>
    </section>
  );
}
