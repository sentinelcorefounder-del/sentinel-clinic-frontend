"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { getMe, isHospitalUser, isClinicUser } from "@/lib/auth";

export default function AuthGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);
  const redirectingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      const publicPaths = ["/login", "/forgot-password", "/reset-password"];

      if (publicPaths.includes(pathname)) {
        if (!cancelled) setChecked(true);
        return;
      }

      try {
        const user = await getMe();

        if (cancelled) return;

        if (!user) {
          if (!redirectingRef.current) {
            redirectingRef.current = true;
            window.location.replace(`/login?next=${encodeURIComponent(pathname)}`);
          }
          return;
        }

        if (user.must_change_password && pathname !== "/change-password") {
          if (!redirectingRef.current) {
            redirectingRef.current = true;
            window.location.replace("/change-password");
          }
          return;
        }

        if (!user.must_change_password && pathname === "/change-password") {
          if (!redirectingRef.current) {
            redirectingRef.current = true;
            window.location.replace(isHospitalUser(user) ? "/hospital" : "/dashboard");
          }
          return;
        }

        const hospitalRoute =
          pathname === "/hospital" || pathname.startsWith("/hospital/");

        const clinicRoute =
          pathname === "/dashboard" ||
          pathname.startsWith("/dashboard/") ||
          pathname === "/patients" ||
          pathname.startsWith("/patients/") ||
          pathname === "/encounters" ||
          pathname.startsWith("/encounters/");

        if (hospitalRoute && !isHospitalUser(user) && !user.is_superuser) {
          if (!redirectingRef.current) {
            redirectingRef.current = true;
            window.location.replace(isClinicUser(user) ? "/dashboard" : "/");
          }
          return;
        }

        if (clinicRoute && !isClinicUser(user) && !user.is_superuser) {
          if (!redirectingRef.current) {
            redirectingRef.current = true;
            window.location.replace(isHospitalUser(user) ? "/hospital" : "/");
          }
          return;
        }

        setChecked(true);
      } catch (error) {
        console.error("Auth check failed:", error);
        if (!redirectingRef.current) {
          redirectingRef.current = true;
          window.location.replace(`/login?next=${encodeURIComponent(pathname)}`);
        }
      }
    }

    redirectingRef.current = false;
    setChecked(false);
    checkAuth();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const publicPaths = ["/login", "/forgot-password", "/reset-password"];

  if (!checked && !publicPaths.includes(pathname)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-sm font-medium text-slate-700">Loading...</p>
      </div>
    );
  }

  return <>{children}</>;
}