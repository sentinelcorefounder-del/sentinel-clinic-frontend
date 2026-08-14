import { redirect } from "next/navigation";
import Link from "next/link";
import { serverFetch } from "@/lib/server-api";

export default async function InternalFinanceLayout({ children }: { children: React.ReactNode }) {
  const user = await serverFetch("/api/auth/me/");
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  const allowed = user?.is_internal_sentinel_staff === true &&
    ["finance_admin", "finance_operator", "finance_approver"].some(role => roles.includes(role));
  if (!allowed) redirect("/ops/finance");
  return <div className="space-y-6"><nav className="flex flex-wrap gap-2 text-sm font-semibold"><Link href="/ops/finance/internal/payables" className="rounded-xl border bg-white px-4 py-2">Partner payables</Link>{roles.includes("finance_admin") && <Link href="/ops/finance/internal/sessions" className="rounded-xl border bg-white px-4 py-2">Partners & sessions</Link>}</nav>{children}</div>;
}
