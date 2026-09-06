export type ReferringHospitalSummary = {
  id: number;
  name: string;
  referral_id: string;
  referral_status: string;
};

export type Patient = {
  id: number;
  patient_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  sex: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  country: string;
  consent_status: string;
  sentinel_patient_id?: string;
  master_patient_id?: number | null;
  is_diabetic?: boolean;
  next_diabetic_recall_due_date?: string | null;
  diabetic_recall_status?: string;

  source_type: "clinic_direct" | "hospital_referral";
  referring_hospital_id?: number | null;
  referring_hospital_name: string;
  referral_id_display: string;
  referring_hospitals: ReferringHospitalSummary[];

  created_at: string;
  updated_at: string;
};
