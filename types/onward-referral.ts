export type OnwardResponsibility = {
  username: string;
  clinician_name: string;
  professional_role: string;
  registration_number: string;
  accepted_at: string;
  takeover_reason: string;
};

export type OnwardReferralVersion = {
  version_number: number;
  status: "draft" | "finalized" | "superseded" | "voided";
  urgency: "emergency" | "urgent" | "expedited" | "routine";
  referral_reason: string;
  requested_specialist_action: string;
  relevant_history: string;
  pertinent_findings: string;
  professional_impression: string;
  management_provided: string;
  include_patient_phone: boolean;
  recipient_organization: number | null;
  recipient_name: string;
  recipient_department: string;
  emergency_escalation_confirmed: boolean;
  emergency_escalation_method: string;
  emergency_escalation_note: string;
  finalized_at: string | null;
  amendment_reason: string;
  void_reason: string;
  stale_source_warning: boolean;
  document_path: string;
};

export type OnwardReferral = {
  referral_uuid: string;
  referral_reference: string;
  patient_name: string;
  encounter_reference: string;
  clinic_name: string;
  branch_name: string;
  inbound_referral_reference: string;
  clinical_sources: Array<"ocular" | "retinal">;
  route: "originating_hospital" | "registered_hospital" | "clinic_download";
  lifecycle: "draft" | "finalized" | "superseded" | "voided";
  responsibility?: OnwardResponsibility | null;
  current_version: OnwardReferralVersion | null;
  versions: OnwardReferralVersion[];
  created_at: string;
  updated_at: string;
};

export type OnwardEligibility = {
  eligible: boolean;
  encounter_completed: boolean;
  eligible_sources: Array<"ocular" | "retinal">;
  responsibility: OnwardResponsibility | null;
};

export type RegisteredHospital = { id: number; name: string; clinic_id: string };
