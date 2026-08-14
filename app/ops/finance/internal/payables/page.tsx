import { serverFetch } from "@/lib/server-api";
import PayablesManager from "./PayablesManager";
import type {
  ServicePartnerAdjustment, ServicePartnerCorrection, ServicePartnerEarning,
  ServicePartnerPayableSummary, ServicePartnerSettlement,
} from "@/types/finance";

export default async function ServicePartnerPayablesPage() {
  const [earnings, summary, settlements, adjustments, corrections, user] = await Promise.all([
    serverFetch("/api/finance/internal/service-partner-payables/"),
    serverFetch("/api/finance/internal/service-partner-payables/summary/"),
    serverFetch("/api/finance/internal/service-partner-payables/settlements/"),
    serverFetch("/api/finance/internal/service-partner-payables/adjustments/"),
    serverFetch("/api/finance/internal/service-partner-payables/corrections/"),
    serverFetch("/api/auth/me/"),
  ]) as [ServicePartnerEarning[], ServicePartnerPayableSummary[], ServicePartnerSettlement[], ServicePartnerAdjustment[], ServicePartnerCorrection[], { roles?: string[] }];
  const roles = user.roles || [];
  return <PayablesManager earnings={earnings} summary={summary} settlements={settlements} adjustments={adjustments} corrections={corrections}
    canPrepare={roles.includes("finance_operator")} canApprove={roles.includes("finance_approver")} />;
}
