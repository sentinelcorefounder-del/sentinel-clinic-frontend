import type { PatientTimelineEvent } from "@/lib/api";

const categoryStyles: Record<string, string> = {
  registration: "border-slate-300 bg-slate-50",
  consent: "border-teal-300 bg-teal-50",
  encounter: "border-blue-300 bg-blue-50",
  imaging: "border-cyan-300 bg-cyan-50",
  ai: "border-violet-300 bg-violet-50",
  report: "border-amber-300 bg-amber-50",
  referral: "border-indigo-300 bg-indigo-50",
  payment: "border-emerald-300 bg-emerald-50",
  hospital: "border-rose-300 bg-rose-50",
  system: "border-slate-300 bg-slate-50",
};

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function pretty(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function PatientTimeline({
  events,
  emptyMessage = "No patient timeline events recorded yet.",
}: {
  events: PatientTimelineEvent[];
  emptyMessage?: string;
}) {
  if (!events?.length) {
    return (
      <section className="sentinel-card p-6">
        <h2 className="text-xl font-semibold">Patient Timeline</h2>
        <p className="mt-3 text-sm text-slate-500">{emptyMessage}</p>
      </section>
    );
  }

  return (
    <section className="sentinel-card p-6">
      <div className="mb-5">
        <h2 className="text-xl font-semibold">Patient Timeline</h2>
        <p className="mt-1 text-sm text-slate-600">
          Read-only chronological history across the patient journey.
        </p>
      </div>

      <div className="relative space-y-4 before:absolute before:bottom-3 before:left-[11px] before:top-3 before:w-px before:bg-slate-300">
        {events.map((event) => (
          <article key={event.id} className="relative pl-9">
            <span className="absolute left-0 top-4 z-10 h-[23px] w-[23px] rounded-full border-4 border-white bg-slate-900" />
            <div className={`rounded-xl border p-4 ${categoryStyles[event.category] || categoryStyles.system}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    {pretty(event.category)}
                  </p>
                  <h3 className="font-semibold text-slate-950">{event.title}</h3>
                </div>
                <time className="text-xs text-slate-600">{formatDateTime(event.occurred_at)}</time>
              </div>

              {event.description ? (
                <p className="mt-2 text-sm text-slate-700">{event.description}</p>
              ) : null}

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                <span>By: {event.actor_display || "System"}</span>
                {event.organization_display ? <span>Organisation: {event.organization_display}</span> : null}
                {event.encounter_id ? <span>Encounter: {event.encounter_id}</span> : null}
                {event.report_id ? <span>Report: {event.report_id}</span> : null}
                {event.referral_id ? <span>Referral: {event.referral_id}</span> : null}
                {event.payment_id ? <span>Payment: {event.payment_id}</span> : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
