"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { financeWrite } from "@/lib/finance-api";
import type { PartnerContract, PricingRule } from "@/types/finance";

const today = new Date().toISOString().slice(0, 10);

export default function ContractDetailManager({
  initialContract,
}: {
  initialContract: PartnerContract;
}) {
  const [contract, setContract] = useState(initialContract);
  const activeRules = useMemo(
    () => (contract.pricing_rules || []).filter((rule) => rule.is_active),
    [contract],
  );
  const assessmentRule = activeRules.find((rule) => rule.service_type !== "ocular_ai_review");
  const aiRule = activeRules.find((rule) => rule.service_type === "ocular_ai_review");
  const [form, setForm] = useState({
    name: contract.name,
    effective_from: contract.effective_from,
    effective_to: contract.effective_to || "",
    notes: contract.notes || "",
    assessment_amount: assessmentRule?.gross_amount || "0",
    ai_review_amount: aiRule?.gross_amount || "4000",
    pricing_effective_from: today,
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const isClinic = contract.organization_type === "clinic";
  // AI clinical review is a clinic-only price. It must remain editable even
  // when the parent contract also covers diabetic/retinal assessment.
  const supportsAI = isClinic;

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      const updated = await financeWrite(`/api/finance/contracts/${contract.id}/`, "PATCH", {
        name: form.name,
        effective_from: form.effective_from,
        effective_to: form.effective_to || null,
        notes: form.notes,
      });
      const pricingRules = [
        {
          name: assessmentRule?.name || `${form.name} assessment pricing`,
          service_type: assessmentRule?.service_type || "retinal_assessment",
          source_type: assessmentRule?.source_type || "",
          workflow_route: assessmentRule?.workflow_route || "",
          payment_responsibility:
            assessmentRule?.payment_responsibility ||
            (contract.organization_type === "hospital" ? "hospital" : "clinic"),
          equipment_owner_type: assessmentRule?.equipment_owner_type || "sentinel",
          gross_amount: form.assessment_amount,
          priority: assessmentRule?.priority || 100,
          effective_from: form.pricing_effective_from,
          notes: assessmentRule?.notes || "",
        },
      ];
      if (supportsAI) {
        pricingRules.push({
          name: aiRule?.name || `${form.name} AI review pricing`,
          service_type: "ocular_ai_review",
          source_type: "",
          workflow_route: "",
          payment_responsibility: "clinic",
          equipment_owner_type: "",
          gross_amount: form.ai_review_amount,
          priority: aiRule?.priority || 100,
          effective_from: form.pricing_effective_from,
          notes: "Ops-approved AI Clinical Review price.",
        });
      }
      const repriced = await financeWrite(
        `/api/finance/contracts/${contract.id}/revise-pricing/`,
        "POST",
        { pricing_rules: pricingRules },
      );
      setContract({ ...updated, pricing_rules: repriced.pricing_rules });
      setMessage("Contract and pricing saved. Historical prices remain preserved.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save contract.");
    }
  }

  async function changeStatus(action: "suspend" | "end") {
    setError("");
    setMessage("");
    try {
      const updated = await financeWrite(
        `/api/finance/contracts/${contract.id}/${action}/`,
        "POST",
        action === "end" ? { effective_to: today } : {},
      );
      setContract(updated);
      setMessage(action === "suspend" ? "Contract suspended." : "Contract ended.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to change contract status.");
    }
  }

  async function deleteDraft() {
    setError("");
    try {
      await financeWrite(`/api/finance/contracts/${contract.id}/`, "DELETE");
      window.location.assign("/ops/finance/contracts");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to delete draft.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/ops/finance/contracts" className="text-sm font-semibold text-blue-700 hover:underline">← Contracts & pricing</Link>
        <h1 className="mt-3 text-3xl font-bold">{contract.name}</h1>
        <p className="mt-1 text-slate-600">
          {contract.organization_name} · {contract.organization_type} · {contract.programme.replaceAll("_", " ")}
        </p>
      </div>
      {error ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{message}</p> : null}

      <form onSubmit={save} className="grid gap-5 rounded-2xl border bg-white p-6 shadow-sm md:grid-cols-2">
        <label className="text-sm font-medium">Agreement name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2" /></label>
        <label className="text-sm font-medium">Status<input readOnly value={contract.status} className="mt-1 w-full rounded-xl border bg-slate-50 px-3 py-2 capitalize" /></label>
        <label className="text-sm font-medium">Effective from<input type="date" value={form.effective_from} onChange={(event) => setForm({ ...form, effective_from: event.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2" /></label>
        <label className="text-sm font-medium">Effective to<input type="date" value={form.effective_to} onChange={(event) => setForm({ ...form, effective_to: event.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2" /></label>
        <label className="text-sm font-medium">Assessment/service charge (NGN)<input type="number" min="0" step="0.01" value={form.assessment_amount} onChange={(event) => setForm({ ...form, assessment_amount: event.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2" /></label>
        {supportsAI ? (
          <label className="text-sm font-medium">AI clinical-review charge (NGN)<input type="number" min="0" step="0.01" value={form.ai_review_amount} onChange={(event) => setForm({ ...form, ai_review_amount: event.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2" /></label>
        ) : null}
        {contract.organization_type === "hospital" ? (
          <p className="md:col-span-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
            Hospital contracts exclude clinic AI-review pricing, free-review entitlement, and clinic wallet AI charges.
          </p>
        ) : null}
        <label className="text-sm font-medium">New pricing effective from<input required type="date" value={form.pricing_effective_from} onChange={(event) => setForm({ ...form, pricing_effective_from: event.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2" /></label>
        <label className="text-sm font-medium md:col-span-2">Notes<textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} rows={3} className="mt-1 w-full rounded-xl border px-3 py-2" /></label>
        <div className="flex flex-wrap gap-3 md:col-span-2">
          <button className="rounded-xl bg-blue-700 px-5 py-2.5 font-semibold text-white">Save changes</button>
          {contract.status === "active" ? (
            <>
              <button type="button" onClick={() => changeStatus("suspend")} className="rounded-xl border border-amber-300 bg-amber-50 px-5 py-2.5 font-semibold text-amber-900">Suspend</button>
              <button type="button" onClick={() => changeStatus("end")} className="rounded-xl border border-slate-300 px-5 py-2.5 font-semibold text-slate-800">End today</button>
            </>
          ) : null}
          {contract.status === "draft" && !contract.has_financial_history ? (
            <button type="button" onClick={deleteDraft} className="rounded-xl border border-red-300 bg-red-50 px-5 py-2.5 font-semibold text-red-800">
              Delete unused draft
            </button>
          ) : null}
        </div>
      </form>

      <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-5"><h2 className="text-xl font-bold">Pricing history</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left"><tr><th className="p-3">Service</th><th className="p-3">Version</th><th className="p-3">Period</th><th className="p-3">Status</th><th className="p-3 text-right">Charge</th></tr></thead>
            <tbody>
              {(contract.pricing_rules || []).map((rule: PricingRule) => (
                <tr key={rule.id} className="border-t">
                  <td className="p-3">{rule.service_type.replaceAll("_", " ")}</td>
                  <td className="p-3">{rule.version}</td>
                  <td className="p-3">{rule.effective_from} – {rule.effective_to || "open"}</td>
                  <td className="p-3">{rule.is_active ? "Current" : "Historical"}</td>
                  <td className="p-3 text-right font-semibold">₦{Number(rule.gross_amount).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
