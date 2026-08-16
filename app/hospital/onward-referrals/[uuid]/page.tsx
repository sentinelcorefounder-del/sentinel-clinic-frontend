"use client";

import { useEffect, useState } from "react";
import { fetchOnwardReferral, onwardDocumentUrl } from "@/lib/onward-referrals-api";
import type { OnwardReferral } from "@/types/onward-referral";

export default function HospitalOnwardReferralDetail({ params }: { params: Promise<{ uuid: string }> }) {
  const [item, setItem] = useState<OnwardReferral | null>(null);
  const [message, setMessage] = useState("");
  useEffect(() => { params.then(({ uuid }) => fetchOnwardReferral(uuid)).then(setItem).catch((error) => setMessage(error.message)); }, [params]);
  if (message) return <main className="sentinel-page"><p className="text-red-700">{message}</p></main>;
  if (!item?.current_version) return <main className="sentinel-page"><p>Loading onward referral…</p></main>;
  const version = item.current_version;
  return <main className="sentinel-page min-h-screen"><div className="rounded-xl border bg-white p-6"><h1 className="font-mono text-xl font-bold">{item.referral_reference} · Version {version.version_number}</h1><p className="mt-2 text-lg">{item.patient_name}</p><div className="mt-5 grid gap-3 text-sm md:grid-cols-2"><p><b>Clinic:</b> {item.clinic_name}</p><p><b>Assessment:</b> {item.encounter_reference}</p><p><b>Urgency:</b> <span className="capitalize">{version.urgency}</span></p><p><b>Status:</b> <span className="capitalize">{version.status}</span></p><p><b>Reason:</b> {version.referral_reason}</p><p><b>Requested action:</b> {version.requested_specialist_action}</p></div>{version.status === "superseded" ? <p className="mt-5 rounded border border-amber-300 bg-amber-50 p-3 font-semibold text-amber-900">This version has been superseded. Check the portal for the latest explicitly available version.</p> : null}{version.urgency === "emergency" ? <p className="mt-5 rounded border border-red-400 bg-red-50 p-4 font-semibold text-red-900">This letter is not a substitute for immediate emergency escalation and does not guarantee receipt, acceptance, an appointment or treatment.</p> : null}<a className="mt-6 inline-block rounded bg-slate-950 px-4 py-2 font-semibold text-white" href={onwardDocumentUrl(version.document_path)}>Download protected referral PDF</a><p className="mt-3 text-xs text-slate-500">Opening or downloading this letter does not record clinical acceptance, booking or treatment.</p></div></main>;
}
