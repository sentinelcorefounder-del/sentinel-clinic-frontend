export type FinanceWallet = {
  id: number;
  organization: number;
  organization_name: string;
  currency: string;
  is_active: boolean;
  credit_limit: string;
  available_balance: string;
  reserved_balance: string;
  spendable_balance: string;
  notes: string;
};

export type PartnerContract = {
  id: number;
  organization: number;
  organization_name: string;
  name: string;
  programme: string;
  status: string;
  currency: string;
  effective_from: string;
  effective_to: string | null;
  payment_terms_days: number;
  credit_allowed: boolean;
  notes: string;
};

export type PricingRule = {
  id: number;
  contract: number;
  name: string;
  is_active: boolean;
  service_type: string;
  source_type: string;
  workflow_route: string;
  payment_responsibility: string;
  equipment_owner_type: string;
  min_monthly_volume: number | null;
  max_monthly_volume: number | null;
  gross_amount: string;
  priority: number;
  effective_from: string;
  effective_to: string | null;
};

export type LedgerEntry = {
  id: number;
  organization_name: string;
  entry_type: string;
  available_delta: string;
  reserved_delta: string;
  currency: string;
  reference: string;
  description: string;
  created_at: string;
  financial_record: number | null;
};

export type FinancialRecord = {
  id: number;
  encounter_id: string;
  organization_name: string;
  contract_name: string | null;
  pricing_rule_name: string | null;
  status: string;
  currency: string;
  gross_amount: string;
  outstanding_amount: string;
  created_at: string;
};

export type PartnerFinance = {
  organization_id: number;
  organization_name: string;
  organization_type: "clinic" | "hospital" | "sentinel";
  wallet: FinanceWallet | null;
  active_contract: PartnerContract | null;
  active_pricing_rules: PricingRule[];
  recent_ledger: LedgerEntry[];
  recent_financial_records: FinancialRecord[];
};

export type FinanceDashboardSummary = {
  contracts: number;
  active_contracts: number;
  pricing_rules: number;
  wallets: number;
  wallet_available: string;
  wallet_reserved: string;
  financial_records: number;
  awaiting_payment: number;
  captured: number;
  settlements: Record<string, string>;
};
