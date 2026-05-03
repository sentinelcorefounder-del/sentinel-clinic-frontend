import Link from "next/link";

export default function OpsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        <aside className="w-64 min-h-screen bg-slate-900 text-white p-6">
          <h1 className="text-xl font-bold mb-8">Sentinel Ops</h1>

          <nav className="space-y-3">
            <Link href="/ops/dashboard" className="block hover:text-blue-300">
              Dashboard
            </Link>
            <Link href="/ops/referrals" className="block hover:text-blue-300">
              Referrals
            </Link>
            <Link href="/ops/payments" className="block hover:text-blue-300">
              Payments
            </Link>
            <Link href="/ops/approvals" className="block hover:text-blue-300">
              Report Approvals
            </Link>
            <Link href="/ops/admin" className="block hover:text-blue-300">
            Admin
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
            <Link href="/dashboard" className="block hover:text-blue-300">
            Sentinel Clinic
            </Link>
            <Link href="/ops/audit" className="block hover:text-blue-300">
            Audit Logs
            </Link>
          </nav>
        </aside>

        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}