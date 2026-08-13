const VALIDATION_STATUSES = new Set([400, 422]);
const MAX_MESSAGE_LENGTH = 300;
const MAX_MESSAGES = 10;

const FINANCE_FIELDS = [
  "legal_entity_name", "trading_name", "registered_address", "company_registration_number",
  "tax_identification_number", "finance_email", "finance_phone", "bank_name",
  "bank_account_name", "bank_account_number", "bank_branch_code", "currency",
  "transfer_instructions", "funding_request_prefix", "receipt_prefix", "is_active",
  "organization", "wallet", "contract", "name", "programme", "status", "notes",
  "credit_limit", "amount", "requested_amount", "received_amount", "proof",
  "bank_transaction_reference", "value_date", "reference", "external_reference",
  "idempotency_key", "description", "action_type", "reason", "decision_reason",
  "effective_from", "effective_to", "payment_terms_days", "credit_allowed",
  "service_type", "source_type", "workflow_route", "payment_responsibility",
  "equipment_owner_type", "min_monthly_volume", "max_monthly_volume", "gross_amount",
  "priority", "supersedes", "pricing_rules", "pricing_rule", "beneficiary_role",
  "beneficiary_organization", "beneficiary_source", "label", "calculation_type",
  "fixed_amount", "percentage", "monetary_limit", "patient_limit", "valid_from",
  "expires_at", "period_start", "period_end", "payment_evidence", "cancellation_reason",
  "related_entry",
] as const;

const DIAGNOSTIC_KEYS = new Set([
  "traceback", "trace", "stack", "stacktrace", "debug", "exception",
  "internal_error", "sql", "query",
]);

function safeMessage(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const message = value.trim();
  if (!message || message.length > MAX_MESSAGE_LENGTH || /[\r\n]/.test(message)) return null;
  if (/<(?:!doctype|html|body|head|script|style|pre|div|span|br|p)\b|<[^>]+>/i.test(message)) return null;
  if (/traceback \(most recent call last\)|file ".+", line \d+|\bat \S+\s*\(.+:\d+:\d+\)|\b(?:stacktrace|internal server error)\b/i.test(message)) return null;
  return message;
}

function safeMessages(value: unknown): string[] | null {
  const values = Array.isArray(value) ? value : [value];
  if (!values.length || values.length > MAX_MESSAGES) return null;
  const messages = values.map(safeMessage);
  if (messages.some((message) => message === null)) return null;
  return messages as string[];
}

function label(field: string) {
  return field.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}

export function financeErrorMessage(data: unknown, status: number): string {
  const fallback = `Finance request failed (${status})`;
  if (!data || typeof data !== "object" || Array.isArray(data)) return fallback;

  const payload = data as Record<string, unknown>;
  const messages: string[] = [];
  const detail = safeMessages(payload.detail);
  if (detail) messages.push(detail.join(" "));

  if (VALIDATION_STATUSES.has(status)) {
    const nonField = safeMessages(payload.non_field_errors);
    if (nonField) messages.push(nonField.join(" "));
    for (const field of FINANCE_FIELDS) {
      if (DIAGNOSTIC_KEYS.has(field) || !(field in payload)) continue;
      const fieldMessages = safeMessages(payload[field]);
      if (fieldMessages) messages.push(`${label(field)}: ${fieldMessages.join(" ")}`);
    }
  }

  const result = messages.join(" ");
  return result && result.length <= 800 ? result : fallback;
}

export { FINANCE_FIELDS };
