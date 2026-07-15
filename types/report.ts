export type ReportFormat =
  | "clinician"
  | "patient"
  | "hospital"
  | "ops";

export type StructuredReport = {
  id: number;
  report_id: string;
  encounter: number;
  patient: number;
  review_date: string;

  dr_grade: string;
  maculopathy_grade: string;

  left_unaided_va: string;
  left_corrected_va: string;
  left_dr_grade: string;
  left_maculopathy_grade: string;

  right_unaided_va: string;
  right_corrected_va: string;
  right_dr_grade: string;
  right_maculopathy_grade: string;

  ungradable: boolean;
  urgency_outcome: string;
  recommendation: string;
  next_followup_interval: string;
  report_status: string;
  notes: string;

  submitted_to_ops_at?: string | null;
  submitted_to_ops_by?: number | null;
  submitted_to_ops_by_display?: string;

  ops_reviewed_at?: string | null;
  ops_reviewed_by?: number | null;
  ops_reviewed_by_display?: string;
  ops_review_note?: string;

  return_reason?: string;
  resubmission_count?: number;
  issued_at?: string | null;
  hospital_viewed_at?: string | null;
  hospital_downloaded_at?: string | null;

  payout_email_sent_at?: string | null;
  report_owner?: "clinic" | "sentinel";
  workflow_route?: "clinic_managed" | "sentinel_managed";
  source_type?: "clinic_direct" | "hospital_referral";
  signed_by?: number | null;
  signed_by_display?: string;
  signed_at?: string | null;
  signer_name?: string;
  signer_role?: string;
  signer_registration_number?: string;
  issued_by?: number | null;
  issued_by_display?: string;
  sentinel_archive_received_at?: string | null;

  created_at: string;
  updated_at: string;
};