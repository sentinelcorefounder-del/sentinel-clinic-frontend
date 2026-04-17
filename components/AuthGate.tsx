"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getMe } from "@/lib/auth";

export default function AuthGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const publicPaths = ["/login", "/forgot-password", "/reset-password"];

      if (publicPaths.includes(pathname)) {
        setChecked(true);
        return;
      }

      try {
        const user = await getMe();

        if (!user) {
          window.location.href = `/login?next=${encodeURIComponent(pathname)}`;
          return;
        }

        if (user.must_change_password && pathname !== "/change-password") {
          window.location.href = "/change-password";
          return;
        }

        if (!user.must_change_password && pathname === "/change-password") {
          window.location.href = "/dashboard";
          return;
        }

        setChecked(true);
      } catch (error) {
        console.error("Auth check failed:", error);
        window.location.href = `/login?next=${encodeURIComponent(pathname)}`;
      }
    }

    checkAuth();
  }, [pathname]);

  const publicPaths = ["/login", "/forgot-password", "/reset-password"];

  if (!checked && !publicPaths.includes(pathname)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-gray-700">Loading...</p>
      </div>
    );
  }

  return <>{children}</>;
}