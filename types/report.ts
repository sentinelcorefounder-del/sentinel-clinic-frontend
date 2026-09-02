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

    recall_months?: number | null;
  recall_due_date?: string | null;

  recall_status?:
    | "not_set"
    | "scheduled"
    | "due_soon"
    | "due"
    | "overdue"
    | "contacted"
    | "booked"
    | "completed"
    | "deferred";

  recall_contacted_at?: string | null;
  recall_booked_at?: string | null;
  recall_completed_at?: string | null;
  recall_note?: string;

  generated_clinical_summary?: string;
  final_clinical_summary?: string;
  clinical_summary_overridden?: boolean;
  report_layout?: "text_only" | "with_investigations";
  selected_fundus_upload_ids?: number[];
  selected_ocular_investigation_ids?: number[];
  attachment_captions?: Record<string, string>;

  distribution_status?:
    | "not_ready"
    | "awaiting_distribution"
    | "released_to_hospital"
    | "completed";

  hospital_released_at?: string | null;
  hospital_released_by?: number | null;
  patient_delivery_required?: boolean;
  patient_delivered_at?: string | null;
  lock_version: number;
  submitted_version?: number | null;
  issued_version?: number | null;
  clinical_responsibility?: {
    current_clinician: number;
    original_clinician: number;
    clinician_name: string;
    professional_role: string;
    registration_number: string;
    authority_used: "optometrist" | "reviewer";
    clinic_name: string;
    branch_name: string;
    accepted_at: string;
    takeover_reason?: string;
  } | null;
  versions?: Array<{
    id: number;
    version_number: number;
    checksum_sha256: string;
    editor_display: string;
    purpose: string;
    correction_note: string;
    created_at: string;
    pdf_generated_at?: string | null;
    legacy_pdf_unbound: boolean;
  }>;
  status_events?: Array<{
    id: number;
    event_type: string;
    note: string;
    correction_note?: string;
    authority_used?: string;
    source_version?: number | null;
    target_version?: number | null;
    actor_display: string;
    created_at: string;
  }>;
};

export type EyeHealthScreeningReport = {
  id: number;
  encounter: number;
  outcome: string;
  selected_advice: string[];
  advice: string;
  structured_findings: TargetedScreeningFindings;
  generated_suggestion: string;
  clinical_summary: string;
  right_visual_field_result: string;
  left_visual_field_result: string;
  right_fundus_result: string;
  left_fundus_result: string;
  selected_fundus_upload_ids: number[];
  selected_visual_field_investigation_ids: number[];
  status: "draft" | "finalized";
  previewed_at: string | null;
  lock_version: number;
  clean_pdf_ready: boolean;
  hospital_released_version?: number | null;
  hospital_released_at?: string | null;
  professional_defaults: null | {
    display_name: string;
    professional_role: string;
    registration_number: string;
    qualifications: string;
  };
  finalized_version_detail?: {
    version_number: number;
    checksum_sha256: string;
    attachment_manifest: Array<Record<string, unknown>>;
  } | null;
};

export type TargetedScreeningEyeFindings = {
  visual_field_reliability: string;
  visual_field_result: string;
  ght: string;
  cup_to_disc_ratio: string;
  vfi: string;
  other_machine_values: string;
};

export type TargetedScreeningFindings = {
  fundus_quality: string;
  optic_disc: string[];
  optic_disc_other: string;
  retinal_vessels: string[];
  retinal_vessels_other: string;
  retina_macula: string[];
  retina_macula_other: string;
  right: TargetedScreeningEyeFindings;
  left: TargetedScreeningEyeFindings;
  iop_interpretation: string;
  iop_other: string;
  visual_acuity_interpretation: string;
  visual_acuity_other: string;
  clinical_interpretation: string;
  clinical_other: string;
};
