import { serverFetch } from "@/lib/server-api";
import InternalFinanceFoundationManager from "./InternalFinanceFoundationManager";
import type { AssessmentServiceSession, ServicePartner } from "@/types/finance";
import { redirect } from "next/navigation";

export default async function InternalFinanceSessionsPage() {
  const user = await serverFetch("/api/auth/me/");
  if (!user?.roles?.some((role: string) => ["finance_admin", "finance_operator"].includes(role))) redirect("/ops/finance/internal/payables");
  const [sessions, partners, organizations] = await Promise.all([
    serverFetch("/api/finance/internal/service-sessions/"),
    serverFetch("/api/finance/internal/service-partners/"),
    serverFetch("/api/finance/organization-options/"),
  ]) as [AssessmentServiceSession[], ServicePartner[], Array<{ id: number; name: string; organization_type: string; branches: Array<{ id: number; name: string }> }>];
  return <InternalFinanceFoundationManager sessions={sessions} partners={partners} organizations={organizations} canAdminPartners={user.roles.includes("finance_admin")} />;
}
