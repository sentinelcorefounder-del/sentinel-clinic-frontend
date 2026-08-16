"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchOnwardReferrals } from "@/lib/onward-referrals-api";
import type { OnwardReferral } from "@/types/onward-referral";

export default function HospitalOnwardReferralsPage() {
  const [items, setItems] = useState<OnwardReferral[]>([]);
  const [message, setMessage] = useState("");
  useEffect(() => { fetchOnwardReferrals().then(setItems).catch((error) => setMessage(error.message)); }, []);
  return <main className="sentinel-page min-h-screen"><h1 className="text-2xl font-bold">Onward ophthalmology referrals</h1><p className="mt-1 text-sm text-slate-600">Only letters explicitly made available to your hospital appear here. This does not grant access to unrelated reports or history.</p>{message ? <p className="mt-5 text-red-700">{message}</p> : null}<div className="mt-6 space-y-3">{items.length ? items.map((item) => <Link key={item.referral_uuid} href={`/hospital/onward-referrals/${item.referral_uuid}`} className="block rounded-xl border bg-white p-5 hover:bg-slate-50"><p className="font-mono font-semibold">{item.referral_reference} · Version {item.current_version?.version_number}</p><p className="mt-1">{item.patient_name} · {item.clinic_name}</p><p className="mt-1 text-sm capitalize text-slate-600">{item.current_version?.urgency} · {item.current_version?.status}</p></Link>) : <p className="rounded-xl border bg-white p-5 text-slate-500">No onward referrals are available.</p>}</div></main>;
}
