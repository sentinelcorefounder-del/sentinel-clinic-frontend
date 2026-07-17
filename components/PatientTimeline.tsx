"use client";

import { useMemo, useState } from "react";
import type { PatientTimelineEvent } from "@/lib/api";

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "Unknown date";
  return date.toLocaleDateString(undefined, { day: "2-digit", month: "long", year: "numeric" });
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function pretty(value?: string | null) {
  if (!value) return "";
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function eventStyle(event: PatientTimelineEvent) {
  const value = `${event.event_type || ""} ${event.title || ""}`.toLowerCase();
  if (value.includes("recall")) return { icon: "R", badge: "bg-red-100 text-red-800", border: "border-l-red-500" };
  if (value.includes("report")) return { icon: "RP", badge: "bg-emerald-100 text-emerald-800", border: "border-l-emerald-500" };
  if (value.includes("image") || value.includes("fundus")) return { icon: "IMG", badge: "bg-violet-100 text-violet-800", border: "border-l-violet-500" };
  if (value.includes("ai") || value.includes("analysis")) return { icon: "AI", badge: "bg-amber-100 text-amber-800", border: "border-l-amber-500" };
  if (value.includes("referral")) return { icon: "RF", badge: "bg-green-100 text-green-800", border: "border-l-green-500" };
  if (value.includes("historical") || value.includes("access")) return { icon: "HA", badge: "bg-slate-200 text-slate-800", border: "border-l-slate-500" };
  return { icon: "EN", badge: "bg-blue-100 text-blue-800", border: "border-l-blue-500" };
}

type Props = { events: PatientTimelineEvent[]; title?: string; newestOpenByDefault?: boolean };

export default function PatientTimeline({ events, title = "Patient Timeline", newestOpenByDefault = false }: Props) {
  const groups = useMemo(() => {
    const grouped = new Map<string, PatientTimelineEvent[]>();
    [...events]
      .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())
      .forEach((event) => {
        const date = new Date(event.occurred_at);
        const key = Number.isNaN(date.getTime()) ? event.occurred_at || "unknown" : date.toISOString().slice(0, 10);
        grouped.set(key, [...(grouped.get(key) || []), event]);
      });
    return Array.from(grouped.entries());
  }, [events]);

  const [openDates, setOpenDates] = useState<Set<string>>(() => newestOpenByDefault && groups[0] ? new Set([groups[0][0]]) : new Set());

  function toggle(key: string) {
    setOpenDates((current) => {
      const next = new Set(current);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  if (!events.length) return <section className="sentinel-card p-6"><h2 className="text-xl font-semibold">{title}</h2><p className="mt-2 text-sm text-slate-500">No timeline activity yet.</p></section>;

  return (
    <section className="sentinel-card p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-xl font-semibold">{title}</h2><p className="text-sm text-slate-600">Clinical and operational activity, grouped by date.</p></div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setOpenDates(new Set(groups.map(([key]) => key)))} className="rounded-lg border bg-white px-3 py-2 text-xs font-semibold">Expand all</button>
          <button type="button" onClick={() => setOpenDates(new Set())} className="rounded-lg border bg-white px-3 py-2 text-xs font-semibold">Collapse all</button>
        </div>
      </div>
      <div className="space-y-3">
        {groups.map(([key, dateEvents]) => {
          const isOpen = openDates.has(key);
          const summary = dateEvents.slice(0, 2).map((event) => event.title || pretty(event.event_type)).filter(Boolean).join(" • ");
          return (
            <div key={key} className="overflow-hidden rounded-xl border bg-white">
              <button type="button" onClick={() => toggle(key)} className="flex w-full items-center justify-between gap-4 p-4 text-left hover:bg-slate-50" aria-expanded={isOpen}>
                <div className="min-w-0"><p className="font-semibold text-slate-950">{isOpen ? "▼" : "▶"} {formatDate(dateEvents[0].occurred_at)}</p><p className="mt-1 truncate text-sm text-slate-600">{summary || `${dateEvents.length} timeline events`}{dateEvents.length > 2 ? ` • +${dateEvents.length - 2} more` : ""}</p></div>
                <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{dateEvents.length}</span>
              </button>
              {isOpen ? <div className="border-t bg-slate-50 p-4"><ol className="space-y-3">
                {[...dateEvents].sort((a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime()).map((event) => {
                  const style = eventStyle(event);
                  return <li key={event.id} className={`rounded-lg border border-l-4 bg-white p-4 ${style.border}`}>
                    <div className="flex flex-wrap items-start justify-between gap-2"><div className="flex gap-3"><span className={`flex h-9 min-w-9 items-center justify-center rounded-full px-2 text-[10px] font-bold ${style.badge}`}>{style.icon}</span><div><p className="font-semibold">{event.title || pretty(event.event_type)}</p>{event.description ? <p className="mt-1 text-sm text-slate-600">{event.description}</p> : null}</div></div><span className="text-xs font-medium text-slate-500">{formatTime(event.occurred_at)}</span></div>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">{event.organization_display ? <span>{event.organization_display}</span> : null}{event.actor_display ? <span>By {event.actor_display}</span> : null}{event.encounter_id ? <span>Encounter {event.encounter_id}</span> : null}{event.report_id ? <span>Report {event.report_id}</span> : null}{event.referral_id ? <span>Referral {event.referral_id}</span> : null}</div>
                  </li>;
                })}
              </ol></div> : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
