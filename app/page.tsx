"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getMe, isClinicUser, isHospitalUser, type CurrentUser } from "@/lib/auth";

export default function HomePage() {
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

  const showClinicCard = !loading && user ? isClinicUser(user) : false;
  const showHospitalCard = !loading && user ? isHospitalUser(user) : false;

  return (
    <main className="min-h-screen bg-slate-100 px-8 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="mb-3 text-4xl font-bold tracking-tight text-slate-950">
            Sentinel Portal
          </h1>
          <p className="max-w-2xl text-base text-slate-700">
            Unified access for Sentinel clinic workflows and hospital referral
            tracking.
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-slate-700">
            Loading portal access...
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {showClinicCard ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-2 text-xl font-semibold text-slate-950">
                  Clinic workflow
                </h2>
                <p className="mb-5 text-sm leading-6 text-slate-700">
                  Manage assigned patients, screening encounters, uploads, consent,
                  and structured reports.
                </p>
                <div className="flex gap-3">
                  <Link
                    href="/patients"
                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium !text-white hover:bg-slate-800"
                  >
                    View Patients
                  </Link>
                  <Link
                    href="/encounters"
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
                  >
                    View Encounters
                  </Link>
                </div>
              </div>
            ) : null}

            {showHospitalCard ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-2 text-xl font-semibold text-slate-950">
                  Hospital tracking
                </h2>
                <p className="mb-5 text-sm leading-6 text-slate-700">
                  Track referrals, matched clinics, appointment progress, no-shows,
                  report readiness, and payout status.
                </p>
                <div className="flex gap-3">
                  <Link
                    href="/hospital"
                    className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-medium !text-white hover:bg-blue-800"
                  >
                    Hospital Dashboard
                  </Link>
                  <Link
                    href="/hospital/referrals"
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
                  >
                    Hospital Referrals
                  </Link>
                </div>
              </div>
            ) : null}

            {!showClinicCard && !showHospitalCard ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-slate-700">
                No portal role is assigned to this account yet.
              </div>
            ) : null}
          </div>
        )}
      </div>
    </main>
  );
}