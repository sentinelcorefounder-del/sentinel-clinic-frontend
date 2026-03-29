export type StructuredReport = {
  id: number;
  report_id: string;
  encounter: number;
  patient: number;
  review_date: string;
  dr_grade: string;
  maculopathy_grade: string;
  ungradable: boolean;
  urgency_outcome: string;
  recommendation: string;
  next_followup_interval: string;
  report_status: string;
  notes: string;
  created_at: string;
  updated_at: string;
};