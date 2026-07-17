import Link from "next/link";
import { redirect } from "next/navigation";
import { serverFetch } from "@/lib/server-api";
import OpsGlobalSearch from "@/components/OpsGlobalSearch";

function canAccessOps(user: any) {
  const roles = user?.roles || [];
  return user?.is_superuser || roles.includes("ops_admin") || roles.includes("sentinel_ops");
}

const navSections = [
  {
    title: "Core Operations",
    links: [
      ["Dashboard", "/ops/dashboard"],
      ["Global Search", "/ops/search"],
      ["Patient Registry", "/ops/patients"],
      ["Referrals", "/ops/referrals"],
      ["Reports", "/ops/reports"],
    ],
  },
  {
    title: "Patient Governance",
    links: [
      ["Master Patients", "/ops/master-patients"],
      ["Historical Access", "/ops/historical-access"],
      ["Distribution Centre", "/ops/distribution"],
      ["Patient Delivery", "/ops/patient-delivery"],
      ["Recall Centre", "/ops/recalls"],
    ],
  },
  {
    title: "Organisations & Finance",
    links: [
      ["Hospitals", "/ops/hospitals"],
      ["Clinics", "/ops/clinics"],
      ["Payments", "/ops/payments"],
    ],
  },
  {
    title: "Administration",
    links: [
      ["Notifications", "/ops/notifications"],
      ["Audit Logs", "/ops/audit"],
      ["Admin", "/ops/admin"],
    ],
  },
];

export default async function OpsLayout({ children }: { children: React.ReactNode }) {
  let user = null;
  try { user = await serverFetch("/api/auth/me/"); } catch { redirect("/login"); }
  if (!canAccessOps(user)) redirect("/");

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex">
        <aside className="min-h-screen w-72 shrink-0 bg-slate-950 p-6 text-white">
          <h2 className="mb-8 text-xl font-bold">Sentinel Ops</h2>
          <nav className="space-y-6 text-sm">
            {navSections.map((section) => (
              <section key={section.title}>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">{section.title}</p>
                <div className="space-y-2">
                  {section.links.map(([label, href]) => (
                    <Link key={href} href={href} className="block rounded-lg px-2 py-1.5 hover:bg-slate-800 hover:text-blue-300">{label}</Link>
                  ))}
                </div>
              </section>
            ))}
            <div className="border-t border-slate-700 pt-5">
              <Link href="/dashboard" className="block rounded-lg px-2 py-1.5 text-blue-300 hover:bg-slate-800 hover:text-blue-200">Sentinel Clinic</Link>
            </div>
          </nav>
        </aside>
        <div className="min-w-0 flex-1">
          <OpsGlobalSearch />
          <main className="p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
