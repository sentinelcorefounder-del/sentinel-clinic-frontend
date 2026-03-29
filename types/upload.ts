export type ImageUpload = {
  id: number;
  image_upload_id: string;
  encounter: number;
  patient: number;
  eye_laterality: string;
  image_type: string;
  image_file: string;
  image_quality: string;
  gradable: boolean;
  retake_required: boolean;
  uploaded_at: string;
};