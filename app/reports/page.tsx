"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ReportFormatMenu from "@/components/ReportFormatMenu";
import { fetchClinicReports } from "@/lib/api";

function pretty(value?: string | null){return (value||"-").replaceAll("_"," ").replace(/\b\w/g,(c)=>c.toUpperCase());}
export default function ClinicReportsPage(){
  const [reports,setReports]=useState<any[]>([]); const [search,setSearch]=useState(""); const [status,setStatus]=useState("all"); const [loading,setLoading]=useState(true); const [error,setError]=useState("");
  async function load(){try{setLoading(true);setError("");setReports(await fetchClinicReports({search,status}));}catch(e){setError(e instanceof Error?e.message:"Failed to load reports.");}finally{setLoading(false);}}
  useEffect(()=>{load();},[]);
  return <main className="sentinel-page min-h-screen">
    <div className="mb-6"><h1 className="text-2xl font-bold">Clinic Reports</h1><p className="mt-1 text-sm text-slate-600">Create, edit, submit and track reports for your clinic.</p></div>
    <form onSubmit={(e)=>{e.preventDefault();load();}} className="mb-6 grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-4"><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Patient, Sentinel ID, report or encounter" className="rounded border px-3 py-2 md:col-span-2"/><select value={status} onChange={(e)=>setStatus(e.target.value)} className="rounded border px-3 py-2"><option value="all">All statuses</option><option value="under_review">Under review</option><option value="submitted_to_ops">Submitted to Ops</option><option value="returned_to_clinic">Returned to clinic</option><option value="ops_rejected">Rejected</option><option value="issued">Issued</option></select><button className="rounded bg-slate-950 px-4 py-2 font-semibold text-white">Apply Filters</button></form>
    {error?<p className="mb-4 text-red-700">{error}</p>:null}
    {loading?<p>Loading reports...</p>:<div className="overflow-x-auto rounded-xl border bg-white"><table className="w-full text-left text-sm"><thead className="bg-slate-100"><tr><th className="p-3">Report</th><th className="p-3">Patient</th><th className="p-3">Encounter</th><th className="p-3">Status</th><th className="p-3">Ops note</th><th className="p-3">Actions</th></tr></thead><tbody>
      {!reports.length?<tr><td colSpan={6} className="p-5 text-slate-500">No reports found.</td></tr>:reports.map((r)=><tr key={r.id} className="border-t align-top"><td className="p-3 font-semibold">{r.report_id}</td><td className="p-3"><p className="font-medium">{r.patient_name||`Patient ${r.patient}`}</p><p className="mt-1 font-mono text-xs text-slate-500">{r.sentinel_patient_id||r.patient_id||r.patient}</p></td><td className="p-3">{r.encounter}</td><td className="p-3">{pretty(r.report_status)}</td><td className="p-3">{r.return_reason||r.ops_review_note||"-"}</td><td className="p-3"><div className="flex flex-wrap items-start gap-2"><Link href={`/encounters/${r.encounter}`} className="rounded bg-slate-950 px-3 py-2 text-xs font-semibold text-white">Open / Edit</Link><ReportFormatMenu reportId={r.id} role="clinic"/></div></td></tr>)}
    </tbody></table></div>}
  </main>;
}
