"use client";

import { useMemo, useState } from "react";
import ReportFormatMenu from "@/components/ReportFormatMenu";

type HistoricalReport = {
  id: number;
  report_id: string;
  issued_at?: string | null;
  pdf_url?: string;
  patient_pdf_url?: string;
  encounter?: number | null;
};

type HistoricalImage = {
  id: number;
  image_file: string;
  eye_laterality?: string;
  uploaded_at?: string | null;
  image_quality?: string;
  encounter?: number | null;
};

type HistoricalGroup = {
  key: string;
  date: string;
  reports: HistoricalReport[];
  images: HistoricalImage[];
};

type Props = {
  reports?: HistoricalReport[];
  images?: HistoricalImage[];
};

function dateKey(value?: string | null) {
  if (!value) return "Unknown date";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toISOString().slice(0, 10);
}

function displayDate(value: string) {
  if (value === "Unknown date") return value;
  const parsed = new Date(`${value}T00:00:00`);
  return parsed.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function HistoricalRecordsAccordion({ reports = [], images = [] }: Props) {
  const groups = useMemo<HistoricalGroup[]>(() => {
    const map = new Map<string, HistoricalGroup>();

    function ensure(key: string) {
      if (!map.has(key)) {
        map.set(key, { key, date: key, reports: [], images: [] });
      }
      return map.get(key)!;
    }

    reports.forEach((report) => {
      ensure(dateKey(report.issued_at)).reports.push(report);
    });

    images.forEach((image) => {
      ensure(dateKey(image.uploaded_at)).images.push(image);
    });

    return Array.from(map.values()).sort((a, b) => {
      if (a.date === "Unknown date") return 1;
      if (b.date === "Unknown date") return -1;
      return b.date.localeCompare(a.date);
    });
  }, [reports, images]);

  const [open, setOpen] = useState<Set<string>>(() => {
    const first = groups[0]?.key;
    return new Set(first ? [first] : []);
  });

  function toggle(key: string) {
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  if (!groups.length) {
    return (
      <div className="rounded-xl border border-dashed bg-white p-6 text-sm text-slate-500">
        No historical reports or retinal images are available in the approved scope.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-600">
          {groups.length} dated record group{groups.length === 1 ? "" : "s"}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setOpen(new Set(groups.map((group) => group.key)))}
            className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-slate-700"
          >
            Expand all
          </button>
          <button
            type="button"
            onClick={() => setOpen(new Set())}
            className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-slate-700"
          >
            Collapse all
          </button>
        </div>
      </div>

      {groups.map((group) => {
        const expanded = open.has(group.key);
        return (
          <section key={group.key} className="overflow-hidden rounded-xl border bg-white shadow-sm">
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => toggle(group.key)}
              className="flex w-full items-center justify-between gap-4 p-4 text-left hover:bg-slate-50"
            >
              <div>
                <p className="font-semibold text-slate-950">{displayDate(group.date)}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {group.reports.length} report{group.reports.length === 1 ? "" : "s"} · {group.images.length} image{group.images.length === 1 ? "" : "s"}
                </p>
              </div>
              <span className="text-xl text-slate-500" aria-hidden="true">
                {expanded ? "⌄" : "›"}
              </span>
            </button>

            {expanded ? (
              <div className="space-y-5 border-t bg-slate-50/50 p-4">
                {group.reports.length ? (
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Reports</h3>
                    <div className="mt-2 grid gap-3 lg:grid-cols-2">
                      {group.reports.map((report) => (
                        <article key={report.id} className="rounded-xl border bg-white p-4">
                          <p className="font-semibold text-slate-950">{report.report_id}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            Issued {report.issued_at ? new Date(report.issued_at).toLocaleString() : "date unavailable"}
                          </p>
                          <div className="mt-3">
                            <ReportFormatMenu reportId={report.id} role="clinic" />
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                ) : null}

                {group.images.length ? (
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Retinal images</h3>
                    <div className="mt-2 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {group.images.map((image) => (
                        <article key={image.id} className="overflow-hidden rounded-xl border bg-white">
                          <img
                            src={image.image_file}
                            alt={`${image.eye_laterality || "Retinal"} image`}
                            className="h-56 w-full bg-slate-950/5 object-contain"
                          />
                          <div className="p-3 text-sm">
                            <p className="font-semibold">{image.eye_laterality || "Unknown"} eye</p>
                            <p className="mt-1 text-xs text-slate-500">Quality: {image.image_quality || "Not recorded"}</p>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
