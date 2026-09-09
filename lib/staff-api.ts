const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type ClinicalProfile = {
  display_name: string;
  professional_role: string;
  registration_number: string;
  registration_body: string;
  qualifications: string;
  signature_name: string;
  is_verified: boolean;
  verified_at?: string | null;
  updated_at?: string | null;
};

export type StaffBranch = { id: number; name: string; branch_code: string };

export type ClinicStaffMember = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  roles: string[];
  all_branch_access: boolean;
  branch_ids: number[];
  branches: StaffBranch[];
  clinical_profile: ClinicalProfile | null;
};

export type ClinicStaffPayload = {
  organization: { id: number; name: string; clinic_id: string };
  assignable_roles: string[];
  can_verify_profiles: boolean;
  branches: StaffBranch[];
  staff: ClinicStaffMember[];
};

function cookie(name: string) {
  if (typeof document === "undefined") return "";
  return document.cookie.split("; ").find((part) => part.startsWith(`${name}=`))?.split("=").slice(1).join("=") || "";
}

async function csrfHeaders() {
  await fetch(`${API_BASE}/api/auth/csrf/`, { credentials: "include" });
  return { "Content-Type": "application/json", "X-CSRFToken": decodeURIComponent(cookie("csrftoken")) };
}

async function bodyOrError(response: Response, fallback: string) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || data.error || fallback);
  return data;
}

export async function fetchClinicalProfile() {
  const response = await fetch(`${API_BASE}/api/auth/clinical-profile/`, { credentials: "include", cache: "no-store" });
  return bodyOrError(response, "Unable to load professional profile.") as Promise<{ clinical_profile: ClinicalProfile | null }>;
}

export async function saveClinicalProfile(payload: Partial<ClinicalProfile>) {
  const response = await fetch(`${API_BASE}/api/auth/clinical-profile/`, {
    method: "PATCH",
    credentials: "include",
    headers: await csrfHeaders(),
    body: JSON.stringify(payload),
  });
  return bodyOrError(response, "Unable to save professional profile.") as Promise<{ clinical_profile: ClinicalProfile }>;
}

export async function fetchClinicStaff(organizationId: number | string) {
  const response = await fetch(`${API_BASE}/api/organizations/${organizationId}/staff/`, { credentials: "include", cache: "no-store" });
  return bodyOrError(response, "Unable to load clinic staff.") as Promise<ClinicStaffPayload>;
}

export async function createClinicStaff(organizationId: number | string, payload: Record<string, unknown>) {
  const response = await fetch(`${API_BASE}/api/organizations/${organizationId}/staff/`, {
    method: "POST",
    credentials: "include",
    headers: await csrfHeaders(),
    body: JSON.stringify(payload),
  });
  return bodyOrError(response, "Unable to add clinic staff.");
}

export async function updateClinicStaff(organizationId: number | string, userId: number, payload: Record<string, unknown>) {
  const response = await fetch(`${API_BASE}/api/organizations/${organizationId}/staff/${userId}/`, {
    method: "PATCH",
    credentials: "include",
    headers: await csrfHeaders(),
    body: JSON.stringify(payload),
  });
  return bodyOrError(response, "Unable to update clinic staff.");
}
