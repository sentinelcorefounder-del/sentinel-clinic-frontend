import { redirect } from "next/navigation";
import { serverFetch } from "@/lib/server-api";

export default async function InternalFinanceLayout({ children }: { children: React.ReactNode }) {
  const user = await serverFetch("/api/auth/me/");
  const allowed = user?.is_internal_sentinel_staff === true &&
    user?.roles?.includes("finance_admin");
  if (!allowed) redirect("/ops/finance");
  return children;
}
