"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CurrentUser } from "@/lib/auth";
import {
  acceptOnwardResponsibility, createOnwardReferral, fetchOnwardEligibility,
  fetchOnwardReferrals, fetchRegisteredHospitals, finalizeOnwardReferral,
  makeOnwardReferralAvailable, onwardDocumentUrl, onwardPreviewUrl,
  supersedeOnwardReferral, updateOnwardReferral,
} from "@/lib/onward-referrals-api";
import type { OnwardEligibility, OnwardReferral, RegisteredHospital } from "@/types/onward-referral";

const emptyDraft = {
  urgency: "routine", referral_reason: "", requested_specialist_action: "",
  relevant_history: "", pertinent_findings: "", professional_impression: "",
  management_provided: "", include_patient_phone: false,
  recipient_department: "Ophthalmology", recipient_organization: "",
  emergency_escalation_confirmed: false, emergency_escalation_method: "",
  emergency_escalation_note: "",
};

export default function OnwardReferralManager({ encounterId, encounterReference, patientPhone, user }: {
  encounterId: number; encounterReference: string; patientPhone?: string; user: CurrentUser | null;
}) {
  const [eligibility, setEligibility] = useState<OnwardEligibility | null>(null);
  const [referral, setReferral] = useState<OnwardReferral | null>(null);
  const [hospitals, setHospitals] = useState<RegisteredHospital[]>([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [sources, setSources] = useState<Array<"ocular" | "retinal">>([]);
  const [route, setRoute] = useState<OnwardReferral["route"]>("clinic_download");
  const [credentials, setCredentials] = useState({ clinician_name: "", professional_role: "", registration_number: "", reason: "" });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const version = referral?.current_version;
  const canAcceptResponsibility = Boolean(eligibility?.capabilities.can_accept_responsibility);
  const canAuthor = Boolean(referral?.capabilities.can_author || eligibility?.capabilities.can_author);
  const canAdministerRecipient = Boolean(referral?.capabilities.can_administer_recipient);
  const canDistribute = Boolean(referral?.capabilities.can_distribute);

  const load = useCallback(async () => {
    const [eligible, all] = await Promise.all([
      fetchOnwardEligibility(encounterId), fetchOnwardReferrals(),
    ]);
    setEligibility(eligible);
    setSources(eligible.eligible_sources);
    const current = all.find((item) => item.encounter_reference === encounterReference) || null;
    setReferral(current);
    if (current?.current_version) {
      const item = current.current_version;
      setRoute(current.route);
      setDraft({
        urgency: item.urgency, referral_reason: item.referral_reason,
        requested_specialist_action: item.requested_specialist_action,
        relevant_history: item.relevant_history, pertinent_findings: item.pertinent_findings,
        professional_impression: item.professional_impression,
        management_provided: item.management_provided,
        include_patient_phone: item.include_patient_phone,
        recipient_department: item.recipient_department,
        recipient_organization: item.recipient_organization ? String(item.recipient_organization) : "",
        emergency_escalation_confirmed: item.emergency_escalation_confirmed,
        emergency_escalation_method: item.emergency_escalation_method,
        emergency_escalation_note: item.emergency_escalation_note,
      });
    }
  }, [encounterId, encounterReference]);

  useEffect(() => { load().catch((error) => setMessage(error.message)); }, [load]);
  useEffect(() => {
    if (user && !user.is_superuser && user.organization?.organization_type === "clinic") {
      fetchRegisteredHospitals().then(setHospitals).catch(() => setHospitals([]));
    }
  }, [user]);

  const sourceLabel = useMemo(() => eligibility?.eligible_sources.join(" + ") || "none", [eligibility]);
  function change(name: keyof typeof draft, value: string | boolean) {
    setDraft((current) => ({ ...current, [name]: value }));
  }
  function draftUpdatePayload() {
    const payload: Record<string, unknown> = { ...draft };
    if (route === "clinic_download") delete payload.recipient_organization;
    else payload.recipient_organization = draft.recipient_organization || null;
    return payload;
  }
  async function act(work: () => Promise<unknown>, success: string) {
    try { setBusy(true); setMessage(""); await work(); await load(); setMessage(success); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Action failed."); }
    finally { setBusy(false); }
  }

  if (!eligibility) return <section className="rounded-xl border bg-white p-6">Loading onward-referral eligibility…</section>;
  return (
    <section className="space-y-5 rounded-xl border bg-white p-6">
      <div><h2 className="text-xl font-semibold">Onward ophthalmology referral</h2><p className="mt-1 text-sm text-slate-600">Separate signed care-escalation letter. It does not issue or release the assessment report.</p></div>
      {message ? <p className="rounded border bg-slate-50 p-3 text-sm">{message}</p> : null}
      <div className="grid gap-3 text-sm md:grid-cols-3"><p><b>Assessment completed:</b> {eligibility.encounter_completed ? "Yes" : "No"}</p><p><b>Eligible professional sources:</b> {sourceLabel}</p><p><b>Responsible clinician:</b> {eligibility.responsibility?.clinician_name || "Not accepted"}</p></div>

      {!eligibility.responsibility && canAcceptResponsibility ? <div className="space-y-3 rounded border border-amber-300 bg-amber-50 p-4"><p className="font-semibold">Explicit clinical responsibility required</p><div className="grid gap-3 md:grid-cols-2">
        {(["clinician_name", "professional_role", "registration_number", "reason"] as const).map((field) => <label key={field} className="text-sm"><span className="block font-medium">{field.replaceAll("_", " ")}</span><input className="mt-1 w-full rounded border px-3 py-2" value={credentials[field]} onChange={(event) => setCredentials({ ...credentials, [field]: event.target.value })} /></label>)}
      </div><button disabled={busy} className="rounded bg-slate-950 px-4 py-2 text-white" onClick={() => act(() => acceptOnwardResponsibility(encounterId, credentials), "Clinical responsibility accepted.")}>Accept responsibility</button></div> : null}

      {eligibility.responsibility && !referral && canAuthor ? <div className="space-y-4 border-t pt-5"><h3 className="font-semibold">Create draft</h3><div className="flex gap-4">{eligibility.eligible_sources.map((source) => <label key={source}><input type="checkbox" checked={sources.includes(source)} onChange={(event) => setSources((current) => event.target.checked ? [...current, source] : current.filter((item) => item !== source))} /> <span className="capitalize">{source}</span></label>)}</div><label className="block text-sm font-medium">Route<select className="mt-1 w-full rounded border px-3 py-2" value={route} onChange={(event) => setRoute(event.target.value as OnwardReferral["route"])}><option value="clinic_download">Protected clinic download</option><option value="originating_hospital">Originating hospital</option><option value="registered_hospital">Registered receiving hospital</option></select></label>{route === "registered_hospital" ? <HospitalSelect hospitals={hospitals} value={draft.recipient_organization} onChange={(value) => change("recipient_organization", value)} /> : null}<DraftFields draft={draft} change={change} patientPhone={patientPhone} />
        <button disabled={busy} className="rounded bg-slate-950 px-4 py-2 text-white" onClick={() => act(() => createOnwardReferral({ encounter: encounterId, clinical_sources: sources, route, ...draft, recipient_organization: draft.recipient_organization || null }), "Draft created.")}>Create onward-referral draft</button></div> : null}

      {referral && version ? <div className="space-y-4 border-t pt-5"><div><p className="font-mono font-semibold">{referral.referral_reference} · Version {version.version_number}</p><p className="text-sm capitalize">{version.status} · {version.urgency} · {referral.route.replaceAll("_", " ")}</p></div>{version.stale_source_warning ? <p className="rounded border border-amber-300 bg-amber-50 p-3 font-semibold text-amber-900">The professional source has changed or was returned. Create a superseding version before further distribution.</p> : null}{version.urgency === "emergency" ? <p className="rounded border border-red-400 bg-red-50 p-4 font-semibold text-red-900">This letter is not a substitute for immediate emergency escalation and does not guarantee receipt, acceptance, an appointment or treatment.</p> : null}
        {version.status === "draft" && canAuthor ? <><DraftFields draft={draft} change={change} patientPhone={patientPhone} />{referral.route === "registered_hospital" ? <HospitalSelect hospitals={hospitals} value={draft.recipient_organization} onChange={(value) => change("recipient_organization", value)} /> : null}<div className="flex flex-wrap gap-3"><button disabled={busy} className="rounded border px-4 py-2" onClick={() => act(() => updateOnwardReferral(referral.referral_uuid, draftUpdatePayload()), "Draft saved.")}>Save draft</button><a className="rounded border px-4 py-2" href={onwardPreviewUrl(referral.referral_uuid)} target="_blank" rel="noreferrer">Preview DRAFT PDF</a><button disabled={busy} className="rounded bg-slate-950 px-4 py-2 text-white" onClick={() => act(() => finalizeOnwardReferral(referral.referral_uuid), "Version finalized and signed.")}>Finalize and sign</button></div></> : null}
        {version.status === "draft" && canAdministerRecipient && !canAuthor ? <div className="space-y-3 rounded border bg-slate-50 p-4"><p className="font-semibold">Administrative recipient selection</p>{referral.route === "registered_hospital" ? <HospitalSelect hospitals={hospitals} value={draft.recipient_organization} onChange={(value) => change("recipient_organization", value)} /> : <p className="text-sm">Recipient: {version.recipient_name || "Protected clinic download"}</p>}<label className="block text-sm font-medium">Department/service<input className="mt-1 w-full rounded border px-3 py-2" value={draft.recipient_department} onChange={(event) => change("recipient_department", event.target.value)} /></label><button disabled={busy} className="rounded border px-4 py-2" onClick={() => act(() => updateOnwardReferral(referral.referral_uuid, referral.route === "registered_hospital" ? { recipient_organization: draft.recipient_organization || null, recipient_department: draft.recipient_department } : { recipient_department: draft.recipient_department }), "Recipient details saved.")}>Save recipient details</button><p className="text-xs text-slate-600">Clinical content, urgency and signature remain restricted to the responsible clinical professional.</p></div> : null}
        {version.document_path ? <div className="flex flex-wrap gap-3"><a className="rounded border px-4 py-2" href={onwardDocumentUrl(version.document_path)}>Download protected PDF</a>{version.status === "finalized" && canDistribute && referral.route !== "clinic_download" ? <button disabled={busy || version.stale_source_warning} className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50" onClick={() => act(() => makeOnwardReferralAvailable(referral.referral_uuid, version.version_number), "Finalized version made available in the hospital portal.")}>Make available to {version.recipient_name}</button> : null}{version.status === "finalized" && canAuthor ? <button disabled={busy} className="rounded border px-4 py-2" onClick={() => { const reason = window.prompt("Clinical amendment reason"); if (reason) act(() => supersedeOnwardReferral(referral.referral_uuid, reason), "Superseding draft created."); }}>Create correction version</button> : null}</div> : null}
      </div> : null}
    </section>
  );
}

function HospitalSelect({ hospitals, value, onChange }: { hospitals: RegisteredHospital[]; value: string; onChange: (value: string) => void }) {
  return <label className="block text-sm font-medium">Registered receiving hospital<select className="mt-1 w-full rounded border px-3 py-2" value={value} onChange={(event) => onChange(event.target.value)}><option value="">Select hospital</option>{hospitals.map((hospital) => <option key={hospital.id} value={hospital.id}>{hospital.name}</option>)}</select></label>;
}

function DraftFields({ draft, change, patientPhone }: { draft: typeof emptyDraft; change: (name: keyof typeof emptyDraft, value: string | boolean) => void; patientPhone?: string }) {
  return <div className="grid gap-3 md:grid-cols-2"><label className="text-sm font-medium">Urgency<select className="mt-1 w-full rounded border px-3 py-2" value={draft.urgency} onChange={(event) => change("urgency", event.target.value)}>{["emergency", "urgent", "expedited", "routine"].map((item) => <option key={item}>{item}</option>)}</select></label>{(["referral_reason", "requested_specialist_action", "relevant_history", "pertinent_findings", "professional_impression", "management_provided", "recipient_department"] as const).map((field) => <label key={field} className="text-sm font-medium">{field.replaceAll("_", " ")}<textarea className="mt-1 w-full rounded border px-3 py-2" rows={2} value={draft[field]} onChange={(event) => change(field, event.target.value)} /></label>)}<label className="text-sm"><input type="checkbox" checked={draft.include_patient_phone} disabled={!patientPhone} onChange={(event) => change("include_patient_phone", event.target.checked)} /> I confirm this displayed patient phone is verified and should be included: <b>{patientPhone || "not recorded"}</b></label>{draft.urgency === "emergency" ? <div className="space-y-3 rounded border border-red-300 bg-red-50 p-3 md:col-span-2"><label><input type="checkbox" checked={draft.emergency_escalation_confirmed} onChange={(event) => change("emergency_escalation_confirmed", event.target.checked)} /> Immediate escalation instructions were given or action was taken</label><input className="w-full rounded border px-3 py-2" placeholder="Escalation method" value={draft.emergency_escalation_method} onChange={(event) => change("emergency_escalation_method", event.target.value)} /><input className="w-full rounded border px-3 py-2" placeholder="Brief safe structured note" value={draft.emergency_escalation_note} onChange={(event) => change("emergency_escalation_note", event.target.value)} /></div> : null}</div>;
}
