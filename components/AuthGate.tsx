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
      if (pathname === "/login") {
        setChecked(true);
        return;
      }

      try {
        const user = await getMe();

        if (!user) {
          window.location.href = `/login?next=${encodeURIComponent(pathname)}`;
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

  if (!checked && pathname !== "/login") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-gray-700">Loading...</p>
      </div>
    );
  }

  return <>{children}</>;
}