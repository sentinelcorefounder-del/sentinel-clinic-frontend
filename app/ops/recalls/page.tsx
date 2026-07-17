"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fetchRecallQueue, runRecallAction, type RecallQueueItem } from "@/lib/api";

function pretty(value?: string | null) {
  return (value || "-").replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString();
}
function statusClass(status?: string) {
  const s=(status||"").toLowerCase();
  if (["completed"].includes(s)) return "bg-emerald-100 text-emerald-800";
  if (["overdue"].includes(s)) return "bg-red-100 text-red-800";
  if (["due","due_soon"].includes(s)) return "bg-amber-100 text-amber-800";
  if (["booked","contacted"].includes(s)) return "bg-blue-100 text-blue-800";
  return "bg-slate-100 text-slate-700";
}

export default function OpsRecallsPage() {
  const [items,setItems]=useState<RecallQueueItem[]>([]);
  const [filter,setFilter]=useState("all");
  const [search,setSearch]=useState("");
  const [loading,setLoading]=useState(true);
  const [busyId,setBusyId]=useState<number|null>(null);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");

  async function load(){
    try { setLoading(true); setError(""); setItems(await fetchRecallQueue(filter)); }
    catch(err){ setError(err instanceof Error ? err.message : "Failed to load recalls."); }
    finally { setLoading(false); }
  }
  useEffect(()=>{ load(); },[filter]);

  const visibleItems=useMemo(()=>{
    const q=search.trim().toLowerCase();
    if(!q) return items;
    return items.filter((item)=>[item.patient_name,item.patient_id,item.sentinel_patient_id,item.patient_email,item.clinic_name,item.report_id].some((v)=>String(v||"").toLowerCase().includes(q)));
  },[items,search]);

  const counts=useMemo(()=>({
    total:items.length,
    overdue:items.filter((i)=>i.recall_status==="overdue").length,
    due:items.filter((i)=>i.recall_status==="due").length,
    booked:items.filter((i)=>i.recall_status==="booked").length,
  }),[items]);

  async function act(item:RecallQueueItem,action:"contacted"|"booked"|"completed"|"deferred"|"send_email"){
    const note=window.prompt("Optional note:",item.recall_note||"")||"";
    try { setBusyId(item.id); setError(""); setMessage(""); await runRecallAction(item.id,action,note); setMessage(`${item.patient_name}: recall ${action.replaceAll("_"," ")}.`); await load(); }
    catch(err){ setError(err instanceof Error ? err.message : "Recall action failed."); }
    finally { setBusyId(null); }
  }

  return <main className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="text-3xl font-bold">Recall Centre</h1><p className="mt-1 text-slate-600">Track, contact and close follow-up recalls from one operational queue.</p></div>
    </div>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[['Queue',counts.total],['Overdue',counts.overdue],['Due today',counts.due],['Booked',counts.booked]].map(([label,value])=><div key={String(label)} className="rounded-xl border bg-white p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div>)}
    </section>

    <section className="grid gap-3 rounded-xl border bg-white p-4 shadow-sm md:grid-cols-[1fr_220px]">
      <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search patient, Sentinel ID, email, clinic or report" className="rounded-xl border px-3 py-2" />
      <select value={filter} onChange={(e)=>setFilter(e.target.value)} className="rounded-xl border px-3 py-2">
        <option value="all">All recalls</option><option value="due_soon">Due soon</option><option value="due">Due today</option><option value="overdue">Overdue</option><option value="contacted">Contacted</option><option value="booked">Booked</option><option value="completed">Completed</option>
      </select>
    </section>

    {message?<div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</div>:null}
    {error?<div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>:null}

    <section className="overflow-x-auto rounded-xl border bg-white shadow-sm">
      {loading?<p className="p-6">Loading recalls...</p>:<table className="w-full text-left text-sm">
        <thead className="bg-slate-100"><tr><th className="p-3">Patient</th><th className="p-3">Report</th><th className="p-3">Clinic / Contact</th><th className="p-3">Due</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr></thead>
        <tbody>{!visibleItems.length?<tr><td colSpan={6} className="p-6 text-slate-500">No recalls found.</td></tr>:visibleItems.map((item)=><tr key={item.id} className="border-t align-top">
          <td className="p-3"><p className="font-semibold">{item.patient_name}</p><p className="mt-1 font-mono text-xs text-slate-500">{item.sentinel_patient_id||item.patient_id}</p><Link href={`/ops/patients/${item.patient_id}`} className="mt-2 inline-block text-xs font-semibold text-blue-700 underline">Open patient</Link></td>
          <td className="p-3"><p className="font-medium">{item.report_id}</p><p className="mt-1 text-xs text-slate-500">{item.recall_months ? `${item.recall_months} month interval` : "Interval not recorded"}</p></td>
          <td className="p-3"><p>{item.clinic_name||"—"}</p><p className="mt-1 text-xs text-slate-500">{item.patient_email||"No email recorded"}</p></td>
          <td className="p-3">{formatDate(item.recall_due_date)}</td>
          <td className="p-3"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClass(item.recall_status)}`}>{pretty(item.recall_status)}</span>{item.recall_note?<p className="mt-2 max-w-xs text-xs text-slate-500">{item.recall_note}</p>:null}</td>
          <td className="p-3"><div className="flex min-w-[330px] flex-wrap gap-2">
            <button disabled={busyId===item.id||!item.patient_email} title={!item.patient_email?"No patient email recorded":""} onClick={()=>act(item,"send_email")} className="rounded bg-blue-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">Email</button>
            {([['contacted','Contacted'],['booked','Booked'],['completed','Completed'],['deferred','Deferred']] as const).map(([action,label])=><button key={action} disabled={busyId===item.id} onClick={()=>act(item,action)} className="rounded border px-3 py-2 text-xs font-semibold disabled:opacity-40">{label}</button>)}
          </div></td>
        </tr>)}</tbody>
      </table>}
    </section>
  </main>;
}
