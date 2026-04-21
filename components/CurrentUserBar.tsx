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

function BrandBlock({ user }: { user: CurrentUser | null }) {
  const isHospital = isHospitalUser(user);

  return (
    <Link href={isHospital ? "/hospital" : "/dashboard"} className="flex items-center gap-3">
      <img
        src="/sentinel-logo.png"
        alt="Sentinel logo"
        className="h-10 w-10 rounded object-contain"
      />
      <div>
        <p className="text-sm font-semibold text-slate-950 leading-tight">
          {isHospital ? "Sentinel Hospital" : "Sentinel Clinic"}
        </p>
        <p className="text-xs text-slate-700 leading-tight">
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
    <nav className="flex flex-wrap items-center gap-5 text-sm font-medium text-slate-800">
      <Link href="/" className="hover:text-slate-950 hover:underline">
        Home
      </Link>

      {hospital ? (
        <>
          <Link href="/hospital" className="hover:text-slate-950 hover:underline">
            Dashboard
          </Link>
          <Link href="/hospital/referrals/new" className="hover:text-slate-950 hover:underline">
            New Referral
          </Link>
          <Link href="/hospital/referrals" className="hover:text-slate-950 hover:underline">
            Referrals
          </Link>
          <Link href="/hospital/payouts" className="hover:text-slate-950 hover:underline">
            Payouts
          </Link>
        </>
      ) : null}

      {clinic ? (
        <>
          <Link href="/dashboard" className="hover:text-slate-950 hover:underline">
            Dashboard
          </Link>
          <Link href="/patients" className="hover:text-slate-950 hover:underline">
            Patients
          </Link>
          <Link href="/encounters" className="hover:text-slate-950 hover:underline">
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
    <header className="w-full border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-3">
        <div className="flex items-center gap-8">
          <BrandBlock user={user} />
          {!loading && user ? <Navigation user={user} /> : null}
        </div>

        <div className="flex items-center gap-4">
          {!loading && !user ? (
            <Link
              href="/login"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
            >
              Sign in
            </Link>
          ) : null}

          {!loading && user ? (
            <>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-950">{user.username}</p>
                <p className="text-xs text-slate-700">
                  {user.organization?.name || "No organization"}
                </p>
                <p className="text-xs text-slate-600">
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