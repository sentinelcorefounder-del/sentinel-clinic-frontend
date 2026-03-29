export type DashboardSummary = {
  total_patients: number;
  total_encounters: number;
  total_uploads: number;
  total_reports: number;
  total_consents: number;
  encounters_pending_review: number;
  completed_encounters: number;
  recent_encounters: {
    id: number;
    encounter_id: string;
    encounter_date: string;
    screening_status: string;
    patient_id?: string;
    patient_name?: string;
  }[];
};