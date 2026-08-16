"use client";

import { useEffect, useState } from "react";
import { fetchOnwardReferrals, onwardDocumentUrl } from "@/lib/onward-referrals-api";
import type { OnwardReferral } from "@/types/onward-referral";

export default function ClinicOnwardReferralsPage() {
  const [items, setItems] = useState<OnwardReferral[]>([]);
  const [message, setMessage] = useState("");
  useEffect(() => { fetchOnwardReferrals().then(setItems).catch((error) => setMessage(error.message)); }, []);
  return <main className="sentinel-page min-h-screen"><h1 className="text-2xl font-bold">Onward ophthalmology referrals</h1><p className="mt-1 text-sm text-slate-600">Clinic care-escalation letters, kept separate from assessment-report release.</p>{message ? <p className="mt-5 text-red-700">{message}</p> : null}<div className="mt-6 overflow-x-auto rounded-xl border bg-white"><table className="w-full text-left text-sm"><thead className="bg-slate-100"><tr><th className="p-3">Referral</th><th className="p-3">Patient</th><th className="p-3">Assessment</th><th className="p-3">Route</th><th className="p-3">Status</th><th className="p-3">Document</th></tr></thead><tbody>{items.length ? items.map((item) => <tr key={item.referral_uuid} className="border-t"><td className="p-3 font-mono">{item.referral_reference} · Version {item.current_version?.version_number}</td><td className="p-3">{item.patient_name}</td><td className="p-3">{item.encounter_reference}</td><td className="p-3 capitalize">{item.route.replaceAll("_", " ")}</td><td className="p-3 capitalize">{item.current_version?.status}</td><td className="p-3">{item.current_version?.document_path ? <a className="underline" href={onwardDocumentUrl(item.current_version.document_path)}>Protected download</a> : "Draft"}</td></tr>) : <tr><td colSpan={6} className="p-5 text-slate-500">No onward referrals found.</td></tr>}</tbody></table></div></main>;
}
