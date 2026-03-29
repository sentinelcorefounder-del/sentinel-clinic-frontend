export type ConsentRecord = {
  id: number;
  consent_id: string;
  patient: number;
  encounter: number | null;
  consent_type: string;
  consent_status: string;
  consent_date: string;
  captured_by: string;
  expiry_date: string | null;
  withdrawal_date: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
};