import Link from "next/link";

export default function OpsGlobalSearch({ defaultValue = "" }: { defaultValue?: string }) {
  return (
    <div className="border-b border-slate-200 bg-white px-8 py-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <form action="/ops/search" method="get" className="flex min-w-[280px] flex-1 items-center gap-2">
          <label htmlFor="ops-global-search" className="sr-only">Global search</label>
          <input
            id="ops-global-search"
            name="q"
            defaultValue={defaultValue}
            placeholder="Search Sentinel ID, patient, referral, report or encounter"
            className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
          <button
            type="submit"
            className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Search
          </button>
        </form>
        <Link
          href="/ops/search"
          className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Search Centre
        </Link>
      </div>
    </div>
  );
}
