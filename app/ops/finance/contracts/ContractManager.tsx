"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { financeWrite } from "@/lib/finance-api";
import type { PartnerContract, PricingRule } from "@/types/finance";

type Org = {
  id: number;
  name: string;
  organization_type: "clinic" | "hospital" | "sentinel";
  clinic_id: string;
};

const today = new Date().toISOString().slice(0, 10);

export default function ContractManager({
  organizations,
  contracts,
  rules,
}: {
  organizations: Org[];
  contracts: PartnerContract[];
  rules: PricingRule[];
}) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    organization: "",
    name: "Retinal Assessment Agreement",
    programme: "diabetic_screening",
    gross_amount: "15000",
    ai_review_amount: "4000",
    include_ai_review: false,
    effective_from: today,
    payment_responsibility: "hospital",
    equipment_owner_type: "sentinel",
  });

  const selectedOrg = useMemo(
    () => organizations.find((organization) => String(organization.id) === form.organization),
    [organizations, form.organization],
  );
  const isClinic = selectedOrg?.organization_type === "clinic";

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      const serviceType =
        form.programme === "ocular_diagnostics"
          ? "ocular_assessment"
          : form.programme === "combined_assessment"
            ? "combined_diabetic_eye_health"
            : form.programme === "eye_health_screening"
              ? "eye_health_screening"
              : "diabetic_retinal_assessment";
      const contract = await financeWrite("/api/finance/contracts/", "POST", {
        organization: Number(form.organization),
        name: form.name,
        programme: form.programme,
        status: "active",
        currency: "NGN",
        effective_from: form.effective_from,
        payment_terms_days: 0,
        credit_allowed: false,
        notes: "",
      });
      const pricingRules = [
        {
          name: `${form.name} assessment pricing`,
          service_type: serviceType,
          source_type: "",
          workflow_route: "",
          payment_responsibility: form.payment_responsibility,
          equipment_owner_type: form.equipment_owner_type,
          gross_amount: form.gross_amount,
          priority: 100,
          effective_from: form.effective_from,
          notes: "",
        },
      ];
      if (isClinic && form.programme !== "diabetic_screening") {
        pricingRules.push({
          name: `${form.name} AI review pricing`,
          service_type: "ocular_ai_review",
          source_type: "",
          workflow_route: "",
          payment_responsibility: "clinic",
          equipment_owner_type: "",
          gross_amount: form.ai_review_amount,
          priority: 100,
          effective_from: form.effective_from,
          notes: "Ops-approved AI Clinical Review price.",
        });
      }
      await financeWrite(
        `/api/finance/contracts/${contract.id}/revise-pricing/`,
        "POST",
        { pricing_rules: pricingRules },
      );
      setMessage("Contract created. Opening the contract details…");
      window.setTimeout(
        () => window.location.assign(`/ops/finance/contracts/${contract.id}`),
        500,
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save contract.");
    }
  }

  function selectOrganization(value: string) {
    const organization = organizations.find((item) => String(item.id) === value);
    setForm({
      ...form,
      organization: value,
      payment_responsibility:
        organization?.organization_type === "hospital" ? "hospital" : "clinic",
    });
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold">Create organisation agreement</h2>
        <p className="mt-1 text-sm text-slate-600">
          An overlapping active contract for the same organisation and programme will be rejected.
        </p>
        {error ? <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        {message ? <p className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-700">{message}</p> : null}
        <form onSubmit={submit} className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium">
            Organisation
            <select required value={form.organization} onChange={(event) => selectOrganization(event.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2">
              <option value="">Select</option>
              {organizations.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name} ({organization.organization_type})
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            Programme
            <select value={form.programme} onChange={(event) => setForm({ ...form, programme: event.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2">
              <option value="diabetic_screening">Diabetic screening</option>
              <option value="ocular_diagnostics">Ocular diagnostics</option>
              <option value="combined_assessment">Combined diabetic eye health assessment</option>
              <option value="eye_health_screening">Eye health assessment</option>
            </select>
          </label>
          <label className="text-sm font-medium">
            Agreement name
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2" />
          </label>
          <label className="text-sm font-medium">
            Assessment charge (NGN)
            <input required type="number" min="0" step="0.01" value={form.gross_amount} onChange={(event) => setForm({ ...form, gross_amount: event.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2" />
          </label>
          {isClinic ? (
            <div className="space-y-2 rounded-xl border p-3">
              <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={form.include_ai_review} onChange={(event) => setForm({ ...form, include_ai_review: event.target.checked })} />Add separate AI clinical-review price</label>
              {form.include_ai_review ? <label className="block text-sm font-medium">AI clinical-review add-on (NGN)<input required type="number" min="0" step="0.01" value={form.ai_review_amount} onChange={(event) => setForm({ ...form, ai_review_amount: event.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2" /></label> : null}
            </div>
          ) : null}
          <label className="text-sm font-medium">
            Effective from
            <input required type="date" value={form.effective_from} onChange={(event) => setForm({ ...form, effective_from: event.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2" />
          </label>
          <label className="text-sm font-medium">
            Payment responsibility
            <select value={form.payment_responsibility} onChange={(event) => setForm({ ...form, payment_responsibility: event.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2">
              <option value="hospital">Hospital</option>
              <option value="clinic">Clinic</option>
              <option value="patient">Patient</option>
              <option value="programme">Programme sponsor</option>
            </select>
          </label>
          <label className="text-sm font-medium">
            Equipment owner
            <select value={form.equipment_owner_type} onChange={(event) => setForm({ ...form, equipment_owner_type: event.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2">
              <option value="sentinel">Sentinel</option>
              <option value="hospital">Hospital</option>
              <option value="clinic">Clinic</option>
            </select>
          </label>
          <div className="md:col-span-2">
            <button className="rounded-xl bg-blue-700 px-5 py-2.5 font-semibold text-white">
              Create agreement
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-5">
          <h2 className="text-xl font-bold">Existing contracts</h2>
          <p className="mt-1 text-sm text-slate-600">Open a row to edit pricing, suspend, end, or review its history.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="p-3">Organisation</th>
                <th className="p-3">Contract</th>
                <th className="p-3">Programme</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Prices</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((contract) => {
                const contractRules = rules.filter((rule) => rule.contract === contract.id && rule.is_active);
                const current =
                  contract.status === "active" &&
                  contract.effective_from <= today &&
                  (!contract.effective_to || contract.effective_to >= today);
                return (
                  <tr key={contract.id} className="border-t">
                    <td className="p-3">{contract.organization_name}</td>
                    <td className="p-3 font-medium">{contract.name}</td>
                    <td className="p-3">{contract.programme.replaceAll("_", " ")}</td>
                    <td className="p-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${current ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-700"}`}>
                        {current ? "Current" : contract.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {contractRules.map((rule) => (
                        <div key={rule.id}>{rule.service_type.replaceAll("_", " ")}: ₦{Number(rule.gross_amount).toLocaleString()}</div>
                      ))}
                    </td>
                    <td className="p-3 text-right">
                      <Link href={`/ops/finance/contracts/${contract.id}`} className="font-semibold text-blue-700 hover:underline">
                        Open
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
