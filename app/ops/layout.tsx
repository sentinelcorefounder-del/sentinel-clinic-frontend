import Link from "next/link";
import { redirect } from "next/navigation";
import { serverFetch } from "@/lib/server-api";

function canAccessOps(user: any) {
  const roles = user?.roles || [];

  return (
    user?.is_superuser ||
    roles.includes("ops_admin") ||
    roles.includes("sentinel_ops")
  );
}

export default async function OpsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user = null;

  try {
    user = await serverFetch("/api/auth/me/");
  } catch {
    redirect("/login");
  }

  if (!canAccessOps(user)) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex">
        <aside className="min-h-screen w-64 bg-slate-950 text-white p-6">
          <h2 className="text-xl font-bold mb-8">Sentinel Ops</h2>

          <nav className="space-y-3 text-sm">
            <Link href="/ops/dashboard" className="block hover:text-blue-300">
              Dashboard
            </Link>

            <Link href="/ops/referrals" className="block hover:text-blue-300">
              Referrals
            </Link>

            <Link href="/ops/patients" className="block hover:text-blue-300">
              Patients
            </Link>

            <Link href="/ops/hospitals" className="block hover:text-blue-300">
              Hospitals
            </Link>

            <Link href="/ops/clinics" className="block hover:text-blue-300">
              Clinics
            </Link>

            <Link href="/ops/payments" className="block hover:text-blue-300">
              Payments
            </Link>

            <Link href="/ops/notifications" className="block hover:text-blue-300">
              Notifications
            </Link>

            <Link href="/ops/audit" className="block hover:text-blue-300">
              Audit Logs
            </Link>

            <Link href="/ops/admin" className="block hover:text-blue-300">
              Admin
            </Link>

            <div className="border-t border-slate-700 my-5" />

            <Link href="/dashboard" className="block text-blue-300 hover:text-blue-200">
              Sentinel Clinic
            </Link>
          </nav>
        </aside>

        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}