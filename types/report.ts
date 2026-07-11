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

  created_at: string;
  updated_at: string;
};