export type EncounterSourceType =
  | "hospital_referral"
  | "clinic_direct";

export type EncounterWorkflowRoute =
  | "sentinel_managed"
  | "clinic_managed";

export type ActiveHospitalReferral = {
  id: number;
  referral_id: string;
  referral_status: string;
  referral_date: string;
  reason_for_referral: string;
  hospital_mrn: string;
  source_hospital_id: number | null;
  source_hospital_name: string;
};

export type ActiveReferralResponse = {
  patient_id: number;
  sentinel_patient_id: string;
  active_referrals: ActiveHospitalReferral[];
  clinic_direct_override_allowed: boolean;
};

export type Encounter = {
  id: number;
  encounter_id: string;
  patient: number;
  encounter_date: string;
  encounter_type: string;
  programme: string;
  source_type: EncounterSourceType;
  workflow_route: EncounterWorkflowRoute;
  payment_responsibility: string;
  originating_organization?: number | null;
  originating_organization_name?: string;
  hospital_referral?: number | null;
  source_hospital_name?: string;
  source_override_reason?: string;
  source_overridden_by?: number | null;
  source_overridden_at?: string | null;
  screening_status: string;
  diabetes_duration?: string;
  symptoms_notes?: string;
  clinical_notes?: string;
  created_at?: string;
  updated_at?: string;
};
