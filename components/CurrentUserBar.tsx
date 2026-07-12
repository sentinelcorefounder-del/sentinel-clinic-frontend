"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  getMe,
  isHospitalUser,
  type CurrentUser,
} from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";
import OpsNotificationBell from "@/components/OpsNotificationBell";

function canAccessOps(user: CurrentUser | null) {
  if (!user) return false;

  return (
    user.is_superuser ||
    user.roles?.includes("ops_admin") ||
    user.roles?.includes("sentinel_ops")
  );
}

function getMode(pathname: string): "ops" | "hospital" | "clinic" {
  if (pathname.startsWith("/ops")) return "ops";
  if (pathname.startsWith("/hospital")) return "hospital";
  return "clinic";
}

function BrandBlock({ mode }: { mode: "ops" | "hospital" | "clinic" }) {
  const href =
    mode === "ops" ? "/ops/dashboard" : mode === "hospital" ? "/hospital" : "/dashboard";

  const subtitle =
    mode === "ops"
      ? "Operations Portal"
      : mode === "hospital"
        ? "Referral Tracking Portal"
        : "Clinic Portal";

  return (
    <Link href={href} className="flex items-center gap-3">
      <img
        src="/sentinel-logo.png"
        alt="Sentinel logo"
        className="h-10 w-10 rounded object-contain"
      />
      <div>
        <p className="text-sm font-semibold text-slate-950 leading-tight">
          Sentinel
        </p>
        <p className="text-xs text-slate-700 leading-tight">{subtitle}</p>
      </div>
    </Link>
  );
}

function OpsNav() {
  return (
    <nav className="flex flex-wrap items-center gap-5 text-sm font-medium text-slate-800">
      <Link href="/ops/dashboard" className="hover:text-slate-950 hover:underline">
        Ops Dashboard
      </Link>
      <Link href="/ops/referrals" className="hover:text-slate-950 hover:underline">
        Referrals
      </Link>
      <Link href="/ops/patients" className="hover:text-slate-950 hover:underline">
        Patients
      </Link>
      <Link href="/ops/hospitals" className="hover:text-slate-950 hover:underline">
        Hospitals
      </Link>
      <Link href="/ops/clinics" className="hover:text-slate-950 hover:underline">
        Clinics
      </Link>
      <Link href="/ops/payments" className="hover:text-slate-950 hover:underline">
        Payments
      </Link>
      <Link href="/ops/notifications" className="hover:text-slate-950 hover:underline">
        Notifications
      </Link>
      <Link href="/ops/audit" className="hover:text-slate-950 hover:underline">
        Audit Logs
      </Link>
      <Link href="/ops/admin" className="hover:text-slate-950 hover:underline">
        Admin
      </Link>
      <Link href="/dashboard" className="text-blue-700 hover:underline">
        Sentinel Clinic
      </Link>
    </nav>
  );
}

function ClinicNav({ user }: { user: CurrentUser }) {
  const isOps = canAccessOps(user);

  return (
    <nav className="flex flex-wrap items-center gap-5 text-sm font-medium text-slate-800">
      <Link href="/dashboard" className="hover:text-slate-950 hover:underline">
        Clinic Dashboard
      </Link>
      <Link href="/patients" className="hover:text-slate-950 hover:underline">
        Clinic Patients
      </Link>
      <Link href="/encounters" className="hover:text-slate-950 hover:underline">
        Encounters
      </Link>
      <Link href="/reports" className="hover:text-slate-950 hover:underline">
        Reports
      </Link>

      {isOps ? (
        <Link
          href="/ops/dashboard"
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Back to Ops
        </Link>
      ) : null}
    </nav>
  );
}

function HospitalNav() {
  return (
    <nav className="flex flex-wrap items-center gap-5 text-sm font-medium text-slate-800">
      <Link href="/hospital" className="hover:text-slate-950 hover:underline">
        Hospital Dashboard
      </Link>
      <Link href="/hospital/patients" className="hover:text-slate-950 hover:underline">
        Patients
      </Link>
      <Link href="/hospital/referrals/new" className="hover:text-slate-950 hover:underline">
        New Referral
      </Link>
      <Link href="/hospital/referrals" className="hover:text-slate-950 hover:underline">
        Referrals
      </Link>
      <Link href="/hospital/reports" className="hover:text-slate-950 hover:underline">
        Reports
      </Link>
      <Link href="/hospital/payouts" className="hover:text-slate-950 hover:underline">
        Payouts
      </Link>
    </nav>
  );
}

function Navigation({
  user,
  mode,
}: {
  user: CurrentUser;
  mode: "ops" | "hospital" | "clinic";
}) {
  if (mode === "ops") return <OpsNav />;
  if (mode === "hospital") return <HospitalNav />;
  return <ClinicNav user={user} />;
}

export default function CurrentUserBar() {
  const pathname = usePathname();
  const mode = getMode(pathname);

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

  const isOps = canAccessOps(user);
  const isHospital = isHospitalUser(user);

  return (
    <header className="w-full border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-3">
        <div className="flex items-center gap-8">
          <BrandBlock mode={mode} />
          {!loading && user ? <Navigation user={user} mode={mode} /> : null}
        </div>

        <div className="flex items-center gap-4">
          {!loading && isOps && mode === "ops" ? <OpsNotificationBell /> : null}

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
                <p className="text-sm font-semibold text-slate-950">
                  {user.username}
                </p>
                <p className="text-xs text-slate-700">
                  {mode === "ops"
                    ? "Sentinel Ops"
                    : mode === "hospital"
                      ? user.organization?.name || "Hospital Portal"
                      : user.organization?.name || "Clinic Portal"}
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