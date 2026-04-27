"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getMe,
  isHospitalUser,
  isClinicUser,
  type CurrentUser,
} from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

function navClass() {
  return "rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950";
}

function BrandBlock({ user }: { user: CurrentUser | null }) {
  const isHospital = isHospitalUser(user);

  return (
    <Link
      href={isHospital ? "/hospital" : "/dashboard"}
      className="group flex items-center gap-4"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition group-hover:shadow-md">
        <img
          src="/sentinel-logo.png"
          alt="Sentinel logo"
          className="h-13 w-13 rounded-xl object-contain"
        />
      </div>

      <div className="leading-tight">
        <p className="text-lg font-extrabold tracking-tight text-slate-950">
          {isHospital ? "Sentinel Hospital" : "Sentinel Clinic"}
        </p>
        <p className="text-sm font-semibold text-slate-600">
          {isHospital ? "Referral Tracking Portal" : "Diabetic Eye Portal"}
        </p>
      </div>
    </Link>
  );
}

function Navigation({ user }: { user: CurrentUser }) {
  const hospital = isHospitalUser(user);
  const clinic = isClinicUser(user);

  return (
    <nav className="hidden items-center gap-1 lg:flex">
      <Link href="/" className={navClass()}>
        Home
      </Link>

      {hospital ? (
        <>
          <Link href="/hospital" className={navClass()}>
            Dashboard
          </Link>
          <Link href="/hospital/referrals/new" className={navClass()}>
            New Referral
          </Link>
          <Link href="/hospital/referrals" className={navClass()}>
            Referrals
          </Link>
          <Link href="/hospital/payouts" className={navClass()}>
            Payouts
          </Link>
        </>
      ) : null}

      {clinic ? (
        <>
          <Link href="/dashboard" className={navClass()}>
            Dashboard
          </Link>
          <Link href="/patients" className={navClass()}>
            Patients
          </Link>
          <Link href="/encounters" className={navClass()}>
            Encounters
          </Link>
        </>
      ) : null}
    </nav>
  );
}

export default function CurrentUserBar() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const me = await getMe();
        setUser(me);
      } catch (error) {
        console.error("Failed to load current user:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur">
      <div className="flex min-h-[96px] w-full items-center justify-between gap-8 px-10 py-5 lg:px-16">
        <div className="flex min-w-0 items-center gap-10">
          <BrandBlock user={user} />
          {!loading && user ? <Navigation user={user} /> : null}
        </div>

        <div className="flex shrink-0 items-center gap-4">
          {!loading && !user ? (
            <Link
              href="/login"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-slate-50"
            >
              Sign in
            </Link>
          ) : null}

          {!loading && user ? (
            <>
              <div className="hidden text-right sm:block">
                <p className="text-sm font-extrabold text-slate-950">
                  {user.username}
                </p>
                <p className="max-w-[180px] truncate text-xs font-medium text-slate-600">
                  {user.organization?.name || "No organization"}
                </p>
                <p className="max-w-[180px] truncate text-xs font-semibold text-indigo-700">
                  {user.roles?.length ? user.roles.join(", ") : "No role assigned"}
                </p>
              </div>

              <LogoutButton />
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
