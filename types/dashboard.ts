export type DashboardSummary = {
  totals: {
    patients: number;
    encounters: number;
    uploads: number;
    reports: number;
    consents: number;
  };
  recent_encounters: {
    id: number;
    encounter_id: string;
    encounter_date: string;
    screening_status: string;
    patient_id?: string;
    patient_name?: string;
  }[];
};