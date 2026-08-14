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
  organization_type: "clinic" | "hospital" | "sentinel";
  name: string;
  programme: string;
  status: string;
  currency: string;
  effective_from: string;
  effective_to: string | null;
  payment_terms_days: number;
  credit_allowed: boolean;
  notes: string;
  pricing_rules?: PricingRule[];
  has_financial_history?: boolean;
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
  notes: string;
  version: number;
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

export type FinanceCapabilities = {
  can_view: boolean;
  can_operate: boolean;
  can_verify: boolean;
  can_approve: boolean;
  can_administer: boolean;
  can_request_corrections: boolean;
  can_decide_corrections: boolean;
  can_prepare_settlements: boolean;
  can_approve_settlements: boolean;
  can_mark_settlements_paid: boolean;
  can_configure_pricing: boolean;
  internal_finance: {
    can_administer: boolean;
    can_operate: boolean;
    can_approve: boolean;
    can_manage_service_partners: boolean;
    can_manage_service_sessions: boolean;
  };
};

export type ServicePartner = {
  id: number;
  clinic_id: string;
  name: string;
  contact_email: string;
  address: string;
  phone: string;
  currency: string;
  is_active: boolean;
};

export type AssessmentServiceSession = {
  id: number;
  session_reference: string;
  service_date: string;
  location_type: "mobile" | "hospital" | "clinic";
  participating_organization: number;
  participating_organization_name: string;
  service_branch: number | null;
  service_branch_name: string | null;
  provider_type: "sentinel" | "service_partner";
  service_partner: number | null;
  service_partner_name: string | null;
  sentinel_arranged_transport: boolean;
  camera_team_rate: string;
  logistics_allocation_rate: string;
  currency: string;
  status: "draft" | "active" | "completed" | "cancelled";
  notes: string;
  configuration_version: number;
  linked_encounter_count: number;
};

export type FinanceActionRequest = {
  id: number;
  organization_name: string;
  action_type: string;
  amount: string;
  currency: string;
  status: string;
  reason: string;
  external_reference: string;
  requested_by_username: string;
  decided_by_username: string | null;
  decision_reason: string;
  created_at: string;
  evidence_available: boolean;
};

export type SettlementBatch = {
  id: number;
  beneficiary_organization_name: string;
  period_start: string;
  period_end: string;
  status: string;
  total_amount: string;
  currency: string;
  external_reference: string;
  payment_evidence_available: boolean;
};

export type BankTransferFunding = {
  id: number;
  organization_name: string;
  request_reference: string;
  requested_amount: string;
  received_amount: string | null;
  currency: string;
  status: string;
  bank_transaction_reference: string;
  value_date: string | null;
  created_at: string;
  receipt_reference: string | null;
  proof_available: boolean;
  billing_snapshot: {
    legal_entity_name?: string;
    trading_name?: string;
    bank_name?: string;
    bank_account_name?: string;
    bank_account_number?: string;
    bank_branch_code?: string;
    transfer_instructions?: string;
  };
};

export type BillingProfile = {
  id: number;
  legal_entity_name: string;
  trading_name: string;
  registered_address: string;
  company_registration_number: string;
  tax_identification_number: string;
  finance_email: string;
  finance_phone: string;
  bank_name: string;
  bank_account_name: string;
  bank_account_number: string;
  bank_branch_code: string;
  currency: string;
  transfer_instructions: string;
  funding_request_prefix: string;
  receipt_prefix: string;
  is_active: boolean;
  is_complete: boolean;
};
