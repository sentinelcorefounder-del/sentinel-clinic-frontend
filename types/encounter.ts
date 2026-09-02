export type EncounterSourceType =
  | "hospital_referral"
  | "clinic_direct";

export type EncounterWorkflowRoute =
  | "sentinel_managed"
  | "clinic_managed";

export type AssessmentProgramme =
  | "diabetic_screening"
  | "eye_health_screening"
  | "ocular_diagnostics"
  | "combined_assessment";

export type ServicePackage =
  | "diabetic_retinal_assessment"
  | "eye_health_screening"
  | "combined_diabetic_eye_health"
  | "comprehensive_ocular_assessment";

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
  programme: AssessmentProgramme;
  service_package: ServicePackage | null;
  service_package_locked?: boolean;
  targeted_screening_report_status?: "not_started" | "draft" | "previewed" | "finalized";
  assessment_location_snapshot: {
    location_type?: string;
    site_name?: string;
    address?: string;
    branch_id?: number | null;
    branch_code?: string;
    branch_name?: string;
  };
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
  ocular_assessment?: OcularDiagnosticAssessment | null;
};

export type OcularDiagnosticAssessment = {
  id: number;
  encounter: number;
  fundus_photography_performed: boolean;
  visual_field_performed: boolean;
  tonometry_performed: boolean;
  visual_acuity_performed: boolean;
  anterior_eye_assessment_performed: boolean;
  presenting_complaint: string;
  ocular_history: string;
  anterior_eye_findings: string;
  fundus_findings: string;
  visual_field_summary: string;
  tonometry_summary: string;
  impression: string;
  management_plan: string;
  management_outcome: string;
  report_layout: "text_only" | "with_investigations";
  selected_fundus_upload_ids: number[];
  selected_ocular_investigation_ids: number[];
  attachment_captions: Record<string, string>;
  completed_at?: string | null;
  completed_by_display?: string;
};

export type OcularInvestigation = {
  id: number;
  investigation_id: string;
  encounter: number;
  investigation_type: string;
  laterality: string;
  test_type: string;
  device_name: string;
  performed_at?: string | null;
  reliability: string;
  reliability_notes: string;
  interpretation: string;
  file: string;
  original_filename: string;
  uploaded_by_display: string;
  uploaded_at: string;
};

export type OcularAIReview = {
  id: number;
  review_id: string;
  status: "pending" | "completed" | "failed";
  provider: string;
  fee_amount: string;
  fee_currency: string;
  payment_status: "pending" | "charged" | "refunded" | "free" | "free_failed";
  model_version: string;
  clinician_impression_snapshot: string;
  clinician_management_snapshot: string;
  suspected_conditions: Array<{
    label: string;
    certainty?: string;
    eye?: string;
  }>;
  supporting_findings: string[];
  differential_diagnoses: string[];
  suggested_urgency: string;
  suggested_management: string;
  limitations: string[];
  agreement_status: string;
  disagreement_reasons: string[];
  expert_review_required: boolean;
  error_message: string;
  clinician_decision: string;
  clinician_decision_notes: string;
  requested_by_display: string;
  decided_by_display: string;
  decided_at?: string | null;
  requested_at: string;
  completed_at?: string | null;
  encounter_changed_since_review: boolean;
  clinical_ai_consent?: number | null;
  training_consent?: number | null;
  consent_checked_at?: string | null;
  privacy_verified_at?: string | null;
  deidentified_review_reference?: string;
  transmitted_data_manifest?: Record<string, unknown>;
};

export type OcularAIReviewList = {
  reviews: OcularAIReview[];
  pricing: {
    amount: string;
    currency: string;
    one_review_per_encounter: boolean;
    free_review_available: boolean;
    amount_due: string;
    pricing_source: "contract" | "default";
  };
  consent: {
    clinical_ai_review_granted: boolean;
    ai_training_granted: boolean;
    ai_training_optional: boolean;
  };
};
