import Link from "next/link";
import { redirect } from "next/navigation";
import { serverFetch } from "@/lib/server-api";
import OpsGlobalSearch from "@/components/OpsGlobalSearch";

type OpsUser = {
  is_superuser?: boolean;
  roles?: string[];
  organization?: { organization_type?: string } | null;
};

function canAccessOps(user: OpsUser | null) {
  const roles = user?.roles || [];
  return user?.is_superuser || [
    "ops_admin", "sentinel_ops", "finance_viewer", "finance_operator",
    "finance_approver", "finance_admin", "finance_tester",
  ].some((role) => roles.includes(role));
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
      ["Finance", "/ops/finance"],
      ["Contracts & Pricing", "/ops/finance/contracts"],
      ["Wallets", "/ops/finance/wallets"],
      ["Ledger", "/ops/finance/ledger"],
      ["Settlements", "/ops/finance/settlements"],
      ["Funding approvals", "/ops/finance/funding"],
      ["Allowances", "/ops/finance/allowances"],
      ["Corrections", "/ops/finance/corrections"],
      ["Reconciliation", "/ops/finance/reconciliation"],
      ["Finance audit", "/ops/finance/audit"],
      ["Internal finance foundation", "/ops/finance/internal/sessions"],
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
  const roles = user?.roles || [];
  const canAccessInternalFinance = user?.is_internal_sentinel_staff === true &&
    roles.includes("finance_admin");
  const isCoreOps = user?.is_superuser || roles.includes("ops_admin") || roles.includes("sentinel_ops");
  const roleSections = isCoreOps
    ? navSections
    : navSections.filter((section) => section.title === "Organisations & Finance").map((section) => ({
        ...section,
        links: section.links.filter(([, href]) => href.startsWith("/ops/finance")),
      }));
  const visibleSections = roleSections.map((section) => ({
    ...section,
    links: section.links.filter(([, href]) =>
      href !== "/ops/finance/internal/sessions" || canAccessInternalFinance
    ),
  }));

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex">
        <aside className="min-h-screen w-72 shrink-0 bg-slate-950 p-6 text-white">
          <h2 className="mb-8 text-xl font-bold">Sentinel Ops</h2>
          <nav className="space-y-6 text-sm">
            {visibleSections.map((section) => (
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
