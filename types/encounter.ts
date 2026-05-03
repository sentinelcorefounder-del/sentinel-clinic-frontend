export type Encounter = {
  id: number;
  encounter_id: string;
  patient: number;
  encounter_date: string;
  encounter_type: string;
  screening_status: string;
  diabetes_duration?: string;
  symptoms_notes?: string;
  clinical_notes?: string;
  iop_before_dilation_left?: string;
  iop_before_dilation_right?: string;
  iop_after_dilation_left?: string;
  iop_after_dilation_right?: string;
  dilation_drops_used?: string;
  dilation_notes?: string;
  created_at?: string;
  updated_at?: string;
};
