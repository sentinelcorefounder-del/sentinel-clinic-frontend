/* eslint-disable @typescript-eslint/no-explicit-any */
import { ensureCsrf } from "@/lib/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const API_URL = `${API_BASE_URL}/api`;

function formatApiError(responseData: any, fallback: string): string {
  if (!responseData) return fallback;

  if (typeof responseData === "string") return responseData;

  if (responseData.detail) {
    return Array.isArray(responseData.detail)
      ? responseData.detail.join(", ")
      : String(responseData.detail);
  }

  if (responseData.non_field_errors?.length) {
    return responseData.non_field_errors.join(", ");
  }

  if (typeof responseData === "object") {
    const fieldMessages = Object.entries(responseData)
      .map(([field, value]) => {
        const label = field
          .replaceAll("_", " ")
          .replace(/\b\w/g, (char) => char.toUpperCase());

        if (Array.isArray(value)) {
          return `${label}: ${value.join(", ")}`;
        }

        if (typeof value === "string") {
          return `${label}: ${value}`;
        }

        if (value && typeof value === "object") {
          return `${label}: ${JSON.stringify(value)}`;
        }

        return "";
      })
      .filter(Boolean);

    if (fieldMessages.length) {
      return fieldMessages.join(" | ");
    }
  }

  return fallback;
}


async function getCsrfHeaders(includeJson = true): Promise<Record<string, string>> {
  const { csrfToken } = await ensureCsrf();

  if (includeJson) {
    return {
      "Content-Type": "application/json",
      "X-CSRFToken": csrfToken,
    };
  }

  return {
    "X-CSRFToken": csrfToken,
  };
}

export async function fetchPatients() {
  const res = await fetch(`${API_URL}/patients/`, {
    cache: "no-store",
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch patients: ${res.status} ${text}`);
  }

  return res.json();
}

export async function createPatient(data: any) {
  const res = await fetch(`${API_URL}/patients/`, {
    method: "POST",
    credentials: "include",
    headers: await getCsrfHeaders(true),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create patient: ${res.status} ${text}`);
  }

  return res.json();
}

export async function fetchPatientById(id: string) {
  const res = await fetch(`${API_URL}/patients/${id}/`, {
    cache: "no-store",
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch patient: ${res.status} ${text}`);
  }

  return res.json();
}

export async function updatePatient(id: string, data: any) {
  const res = await fetch(`${API_URL}/patients/${id}/`, {
    method: "PATCH",
    credentials: "include",
    headers: await getCsrfHeaders(true),
    body: JSON.stringify(data),
  });

  const responseData = await res.json().catch(() => ({}));

  if (!res.ok) {
    const detail =
      responseData?.detail ||
      responseData?.non_field_errors?.[0] ||
      responseData?.consent_status?.[0] ||
      "Failed to update patient.";
    throw new Error(detail);
  }

  return responseData;
}

export async function searchPatients(search: string) {
  const res = await fetch(
    `${API_URL}/patients/?search=${encodeURIComponent(search)}`,
    {
      cache: "no-store",
      credentials: "include",
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to search patients: ${res.status} ${text}`);
  }

  return res.json();
}

export async function fetchPatientEncounters(id: string) {
  const res = await fetch(`${API_URL}/encounters/patient/${id}/`, {
    cache: "no-store",
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch patient encounters: ${res.status} ${text}`);
  }

  return res.json();
}

export async function fetchPatientReports(id: string) {
  const res = await fetch(`${API_URL}/reports/patient/${id}/`, {
    cache: "no-store",
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch patient reports: ${res.status} ${text}`);
  }

  return res.json();
}

export async function fetchPatientConsents(id: string) {
  const res = await fetch(`${API_URL}/consents/patient/${id}/`, {
    cache: "no-store",
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch patient consents: ${res.status} ${text}`);
  }

  return res.json();
}

export async function fetchEncounters() {
  const res = await fetch(`${API_URL}/encounters/`, {
    cache: "no-store",
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch encounters: ${res.status} ${text}`);
  }

  return res.json();
}

export async function createEncounter(data: any) {
  const res = await fetch(`${API_URL}/encounters/`, {
    method: "POST",
    credentials: "include",
    headers: await getCsrfHeaders(true),
    body: JSON.stringify(data),
  });

  const responseData = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      formatApiError(
        responseData,
        "Failed to create encounter."
      )
    );
  }

  return responseData;
}

export async function fetchPatientActiveReferrals(
  patientId: string | number
) {
  const res = await fetch(
    `${API_URL}/encounters/patient/${patientId}/active-referrals/`,
    {
      cache: "no-store",
      credentials: "include",
    }
  );

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      formatApiError(
        data,
        "Failed to check active referrals."
      )
    );
  }

  return data;
}

export async function fetchEncounterById(id: string) {
  const res = await fetch(`${API_URL}/encounters/${id}/`, {
    cache: "no-store",
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch encounter: ${res.status} ${text}`);
  }

  return res.json();
}

export async function updateEncounter(id: string | number, data: any) {
  const res = await fetch(`${API_URL}/encounters/${id}/`, {
    method: "PATCH",
    credentials: "include",
    headers: await getCsrfHeaders(true),
    body: JSON.stringify(data),
  });

  const responseData = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(formatApiError(responseData, "Failed to update encounter."));
  }

  return responseData;
}

export async function correctEncounterServicePackage(id: string | number, data: {
  service_package: string; reason: string; diabetic_confirmed?: boolean;
}) {
  const res = await fetch(`${API_URL}/encounters/${id}/service-package/`, {
    method: "POST", credentials: "include", headers: await getCsrfHeaders(true),
    body: JSON.stringify(data),
  });
  const responseData = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(formatApiError(responseData, "Failed to correct service package."));
  return responseData;
}

export async function correctEncounterAssessmentLocation(id: string | number, data: {
  location_type: string; site_name: string; address?: string; reason: string;
}) {
  const res = await fetch(`${API_URL}/encounters/${id}/assessment-location/`, {
    method: "POST", credentials: "include", headers: await getCsrfHeaders(true),
    body: JSON.stringify(data),
  });
  const responseData = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(formatApiError(responseData, "Failed to correct assessment location."));
  return responseData;
}

export async function fetchEyeHealthReport(encounterId: string | number) {
  const res = await fetch(`${API_URL}/reports/eye-health/encounter/${encounterId}/`, {
    cache: "no-store", credentials: "include",
  });
  if (res.status === 404) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(formatApiError(data, "Failed to load targeted screening report."));
  return data as import("@/types/report").EyeHealthScreeningReport;
}

export async function saveEyeHealthReport(encounterId: string | number, data: Record<string, unknown>, expectedVersion?: number) {
  const res = await fetch(`${API_URL}/reports/eye-health/encounter/${encounterId}/`, {
    method: "POST", credentials: "include", headers: await getCsrfHeaders(true),
    body: JSON.stringify({ ...data, ...(expectedVersion === undefined ? {} : { expected_version: expectedVersion }) }),
  });
  const responseData = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(formatApiError(responseData, "Failed to save targeted screening report."));
  return responseData as import("@/types/report").EyeHealthScreeningReport;
}

export async function previewEyeHealthReport(reportId: number, reportFormat: "patient" | "clinician") {
  const res = await fetch(`${API_URL}/reports/eye-health/${reportId}/preview/`, {
    method: "POST", credentials: "include", headers: await getCsrfHeaders(true),
    body: JSON.stringify({ report_format: reportFormat }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(formatApiError(data, "Failed to preview targeted screening report."));
  }
  return res.blob();
}

export async function finalizeEyeHealthReport(reportId: number, expectedVersion: number) {
  const res = await fetch(`${API_URL}/reports/eye-health/${reportId}/finalize/`, {
    method: "POST", credentials: "include", headers: await getCsrfHeaders(true),
    body: JSON.stringify({ expected_version: expectedVersion, signoff_confirmed: true }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(formatApiError(data, "Failed to finalize targeted screening report."));
  return data as import("@/types/report").EyeHealthScreeningReport;
}

export async function startEyeHealthReportCorrection(reportId: number, reason: string) {
  const res = await fetch(`${API_URL}/reports/eye-health/${reportId}/correction/`, {
    method: "POST", credentials: "include", headers: await getCsrfHeaders(true),
    body: JSON.stringify({ reason }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(formatApiError(data, "Failed to start report correction."));
  return data as import("@/types/report").EyeHealthScreeningReport;
}

export async function updateOcularAssessment(
  encounterId: string | number,
  data: any
) {
  const res = await fetch(
    `${API_URL}/encounters/${encounterId}/ocular-assessment/`,
    {
      method: "PATCH",
      credentials: "include",
      headers: await getCsrfHeaders(true),
      body: JSON.stringify(data),
    }
  );
  const responseData = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      formatApiError(responseData, "Failed to save ocular assessment.")
    );
  }
  return responseData;
}

export function getOcularAssessmentPdfUrl(encounterId: string | number) {
  return `${API_URL}/encounters/${encounterId}/ocular-assessment/pdf/`;
}

export async function fetchOcularInvestigations(encounterId: string | number) {
  const res = await fetch(
    `${API_URL}/encounters/${encounterId}/ocular-investigations/`,
    { cache: "no-store", credentials: "include" }
  );
  const data = await res.json().catch(() => ([]));
  if (!res.ok) throw new Error(formatApiError(data, "Failed to load investigations."));
  return data;
}

export async function createOcularInvestigation(
  encounterId: string | number,
  formData: FormData
) {
  const res = await fetch(
    `${API_URL}/encounters/${encounterId}/ocular-investigations/`,
    {
      method: "POST",
      credentials: "include",
      headers: await getCsrfHeaders(false),
      body: formData,
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(formatApiError(data, "Failed to upload investigation."));
  return data;
}

export async function deleteOcularInvestigation(id: string | number) {
  const res = await fetch(
    `${API_URL}/encounters/ocular-investigations/${id}/`,
    {
      method: "DELETE",
      credentials: "include",
      headers: await getCsrfHeaders(false),
    }
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(formatApiError(data, "Failed to delete investigation."));
  }
}

export async function fetchOcularAIReviews(encounterId: string | number) {
  const res = await fetch(
    `${API_URL}/encounters/${encounterId}/ocular-ai-reviews/`,
    { cache: "no-store", credentials: "include" }
  );
  const data = await res.json().catch(() => ({
    reviews: [],
    pricing: { amount: "0.00", currency: "NGN", one_review_per_encounter: true },
  }));
  if (!res.ok) throw new Error(formatApiError(data, "Failed to load AI reviews."));
  return data;
}

export async function requestOcularAIReview(
  encounterId: string | number,
  privacyConfirmed: boolean
) {
  const res = await fetch(
    `${API_URL}/encounters/${encounterId}/ocular-ai-reviews/`,
    {
      method: "POST",
      credentials: "include",
      headers: await getCsrfHeaders(true),
      body: JSON.stringify({ privacy_confirmed: privacyConfirmed }),
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(formatApiError(data, "Sentinel AI review failed."));
  return data;
}

export async function decideOcularAIReview(
  reviewId: string | number,
  decision: "accepted" | "modified" | "rejected",
  notes: string
) {
  const res = await fetch(
    `${API_URL}/encounters/ocular-ai-reviews/${reviewId}/decision/`,
    {
      method: "POST",
      credentials: "include",
      headers: await getCsrfHeaders(true),
      body: JSON.stringify({ decision, notes }),
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(formatApiError(data, "Failed to record clinician decision."));
  return data;
}


export async function filterEncounters(params: {
  search?: string;
  status?: string;
  date?: string;
}) {
  const query = new URLSearchParams();

  if (params.search) query.append("search", params.search);
  if (params.status) query.append("status", params.status);
  if (params.date) query.append("date", params.date);

  const res = await fetch(`${API_URL}/encounters/?${query.toString()}`, {
    cache: "no-store",
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to filter encounters: ${res.status} ${text}`);
  }

  return res.json();
}

export async function fetchEncounterUploads(id: string) {
  const res = await fetch(`${API_URL}/uploads/encounter/${id}/`, {
    cache: "no-store",
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch encounter uploads: ${res.status} ${text}`);
  }

  return res.json();
}

export async function createImageUpload(formData: FormData) {
  const res = await fetch(`${API_URL}/uploads/`, {
    method: "POST",
    credentials: "include",
    headers: await getCsrfHeaders(false),
    body: formData,
  });

  const responseData = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(formatApiError(responseData, "Failed to upload image."));
  }

  return responseData;
}

export async function createMobileTransfer(encounterId: number) {
  const res = await fetch(`${API_URL}/uploads/mobile-transfer/encounter/${encounterId}/`, {
    method: "POST",
    credentials: "include",
    headers: await getCsrfHeaders(true),
    body: JSON.stringify({}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(formatApiError(data, "Failed to start mobile transfer."));
  return data;
}

export async function fetchMobileTransfer(sessionId: string) {
  const res = await fetch(`${API_URL}/uploads/mobile-transfer/${sessionId}/`, {
    cache: "no-store",
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(formatApiError(data, "Failed to check mobile transfer."));
  return data;
}

export async function reviewMobileTransferImage(
  sessionId: string,
  imageId: number,
  data: Record<string, unknown>,
) {
  const res = await fetch(`${API_URL}/uploads/mobile-transfer/${sessionId}/images/${imageId}/review/`, {
    method: "POST",
    credentials: "include",
    headers: await getCsrfHeaders(true),
    body: JSON.stringify(data),
  });
  const responseData = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(formatApiError(responseData, "Failed to review image."));
  return responseData;
}

export async function fetchPublicMobileTransfer(token: string) {
  const res = await fetch(`${API_URL}/uploads/mobile-transfer/public/${encodeURIComponent(token)}/`, {
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(formatApiError(data, "This transfer link is unavailable."));
  return data;
}

export async function uploadPublicMobileTransfer(token: string, formData: FormData) {
  const res = await fetch(`${API_URL}/uploads/mobile-transfer/public/${encodeURIComponent(token)}/`, {
    method: "POST",
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(formatApiError(data, "Image transfer failed."));
  return data;
}

export async function deleteImageUpload(uploadId: string | number) {
  const res = await fetch(`${API_URL}/uploads/${uploadId}/`, {
    method: "DELETE",
    credentials: "include",
    headers: await getCsrfHeaders(false),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to delete image: ${res.status} ${text}`);
  }

  return true;
}

export async function fetchEncounterReports(id: string) {
  const res = await fetch(`${API_URL}/reports/encounter/${id}/`, {
    cache: "no-store",
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch encounter reports: ${res.status} ${text}`);
  }

  const reports = await res.json();
  if (!Array.isArray(reports) || reports.length > 1) {
    throw new Error("The encounter report state is inconsistent. No report was selected.");
  }
  return reports as import("@/types/report").StructuredReport[];
}

export async function createReport(data: any) {
  const res = await fetch(`${API_URL}/reports/`, {
    method: "POST",
    credentials: "include",
    headers: await getCsrfHeaders(true),
    body: JSON.stringify(data),
  });

  const responseData = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(formatApiError(responseData, "Failed to create report."));
  }

  return responseData;
}

export async function submitReportToOps(reportId: string | number, expectedVersion: number, resubmissionNote = "") {
  const res = await fetch(`${API_URL}/reports/${reportId}/submit-to-ops/`, {
    method: "POST",
    credentials: "include",
    headers: await getCsrfHeaders(true),
    body: JSON.stringify({ expected_version: expectedVersion, resubmission_note: resubmissionNote }),
  });

  const responseData = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(formatApiError(responseData, "Failed to submit report to Ops."));
  }

  return responseData;
}

export type ReportFormat =
  | "clinician"
  | "patient"
  | "hospital"
  | "ops";

export function getReportPdfUrl(
  reportId: string | number,
  format: ReportFormat = "clinician"
) {
  return `${API_URL}/reports/${reportId}/pdf/?report_format=${encodeURIComponent(
    format
  )}`;
}

export async function fetchEncounterConsents(id: string) {
  const res = await fetch(`${API_URL}/consents/encounter/${id}/`, {
    cache: "no-store",
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch encounter consents: ${res.status} ${text}`);
  }

  return res.json();
}

export async function createConsent(data: any) {
  const res = await fetch(`${API_URL}/consents/`, {
    method: "POST",
    credentials: "include",
    headers: await getCsrfHeaders(true),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create consent: ${res.status} ${text}`);
  }

  return res.json();
}

export async function fetchDashboardSummary() {
  const res = await fetch(`${API_URL}/dashboard/summary/`, {
    cache: "no-store",
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch dashboard summary: ${res.status} ${text}`);
  }

  return res.json();
}

export async function fetchHospitalDashboardSummary() {
  const res = await fetch(`${API_URL}/referrals/hospital/dashboard/`, {
    cache: "no-store",
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch hospital dashboard summary: ${res.status} ${text}`);
  }

  return res.json();
}

export async function fetchHospitalReferrals() {
  const res = await fetch(`${API_URL}/referrals/hospital/referrals/`, {
    cache: "no-store",
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch hospital referrals: ${res.status} ${text}`);
  }

  return res.json();
}

export async function fetchHospitalReferralById(id: string) {
  const res = await fetch(`${API_URL}/referrals/hospital/referrals/${id}/`, {
    cache: "no-store",
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch hospital referral: ${res.status} ${text}`);
  }

  return res.json();
}

export async function fetchHospitalPayouts() {
  const res = await fetch(`${API_URL}/referrals/hospital/payouts/`, {
    cache: "no-store",
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch hospital payouts: ${res.status} ${text}`);
  }

  return res.json();
}

export async function fetchHospitalSubmissions() {
  const res = await fetch(`${API_URL}/referrals/hospital/submissions/`, {
    cache: "no-store",
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch hospital submissions: ${res.status} ${text}`);
  }

  return res.json();
}

export async function submitHospitalReferral(data: {
  patient_id: string;
  first_name: string;
  last_name: string;
  dob: string;
  patient_sex: string;
  hospital_mrn?: string;
  diabetes_type: string;
  reason_for_referral: string;
  phone_number?: string;
  email?: string;
  notes?: string;
}) {
  const res = await fetch(`${API_URL}/referrals/hospital/submit/`, {
    method: "POST",
    credentials: "include",
    headers: await getCsrfHeaders(true),
    body: JSON.stringify(data),
  });

  const responseData = await res.json().catch(() => ({}));

  if (!res.ok) {
    const detail =
      responseData?.detail ||
      responseData?.error ||
      "Failed to submit hospital referral.";
    throw new Error(detail);
  }

  return responseData;
}

export async function fetchPatientUploads(id: string | number) {
  const res = await fetch(`${API_URL}/uploads/patient/${id}/`, {
    cache: "no-store",
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch patient uploads: ${res.status} ${text}`);
  }

  return res.json();
}

export type BulkImportSession = {
  id: number;
  session_reference: string;
  service_date: string;
  organization: string;
  branch: string;
  branch_id: number;
  status: string;
};

export type BulkImportItem = {
  item_id: string;
  source_index: number;
  detected_format: string;
  width?: number;
  height?: number;
  decision: "unresolved" | "left" | "right" | "rejected" | "invalid" | "skipped";
  safe_issue_code: string;
  preview_path: string;
};

export type BulkImportGroup = {
  group_id: string;
  source_index: number;
  mrn: string;
  assessment_date?: string;
  status: string;
  safe_issue_code: string;
  encounter?: { id: number; encounter_id: string; patient_name: string; sentinel_patient_id: string } | null;
  items: BulkImportItem[];
};

export type BulkImport = {
  import_id: string;
  status: string;
  image_count: number;
  skipped_count: number;
  groups: BulkImportGroup[];
};

export async function fetchBulkImportSessions() {
  const response = await fetch(`${API_URL}/uploads/bulk-imports/sessions/`, { credentials: "include", cache: "no-store" });
  const data = await response.json().catch(() => []);
  if (!response.ok) throw new Error(formatApiError(data, "Failed to load assessment sessions."));
  return data as BulkImportSession[];
}

export async function createBulkImageImport(session: BulkImportSession, archive: File) {
  const body = new FormData();
  body.append("service_session", String(session.id));
  body.append("branch", String(session.branch_id));
  body.append("archive", archive);
  body.append("idempotency_key", crypto.randomUUID());
  const response = await fetch(`${API_URL}/uploads/bulk-imports/`, { method: "POST", credentials: "include", headers: await getCsrfHeaders(false), body });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(formatApiError(data, "Failed to inspect the Remidio archive."));
  return data as BulkImport;
}

export async function resolveBulkImportGroup(importId: string, groupId: string, encounter: number | undefined, decisions: Record<string, string>) {
  const response = await fetch(`${API_URL}/uploads/bulk-imports/${importId}/groups/${groupId}/`, { method: "PATCH", credentials: "include", headers: await getCsrfHeaders(true), body: JSON.stringify({ encounter, decisions }) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(formatApiError(data, "Failed to save import decisions."));
  return data as BulkImport;
}

export async function searchBulkImportEncounters(importId: string, search: string) {
  const response = await fetch(`${API_URL}/uploads/bulk-imports/${importId}/encounters/?search=${encodeURIComponent(search)}`, { credentials: "include", cache: "no-store" });
  const data = await response.json().catch(() => []);
  if (!response.ok) throw new Error(formatApiError(data, "Failed to search eligible encounters."));
  return data as Array<{ id: number; encounter_id: string; patient_name: string; sentinel_patient_id: string }>;
}

export async function confirmBulkImageImport(importId: string) {
  const response = await fetch(`${API_URL}/uploads/bulk-imports/${importId}/confirm/`, { method: "POST", credentials: "include", headers: await getCsrfHeaders(true), body: "{}" });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(formatApiError(data, "Failed to confirm image attachments."));
  return data as BulkImport;
}

export function bulkImportPreviewUrl(path: string) {
  return path ? `${API_BASE_URL}${path}` : "";
}


export async function updateReport(reportId: string | number, data: any) {
  const res = await fetch(`${API_URL}/reports/${reportId}/`, {
    method: "PATCH",
    credentials: "include",
    headers: await getCsrfHeaders(true),
    body: JSON.stringify(data),
  });
  const responseData = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(formatApiError(responseData, "Failed to update report."));
  }
  return responseData;
}

export async function fetchOpsReport(reportId: string | number) {
  const res = await fetch(`${API_URL}/ops/reports/${reportId}/`, {
    cache: "no-store",
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(formatApiError(data, "Failed to load Ops report."));
  return data;
}

export async function returnOpsReport(reportId: string | number, reason: string, expectedVersion: number, submittedVersion: number) {
  const res = await fetch(`${API_URL}/ops/reports/${reportId}/return/`, {
    method: "POST",
    credentials: "include",
    headers: await getCsrfHeaders(true),
    body: JSON.stringify({ reason, expected_version: expectedVersion, submitted_version: submittedVersion }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(formatApiError(data, "Failed to return report."));
  return data;
}

export type OpsReportSignature = {
  signer_name: string;
  signer_role: string;
  signer_registration_number: string;
};

export async function approveAndIssueOpsReport(
  reportId: string | number,
  note: string,
  signature: OpsReportSignature,
  expectedVersion: number,
  submittedVersion: number
) {
  const res = await fetch(
    `${API_URL}/ops/reports/${reportId}/approve/`,
    {
      method: "POST",
      credentials: "include",
      headers: await getCsrfHeaders(true),
      body: JSON.stringify({
        note,
        signer_name: signature.signer_name,
        signer_role: signature.signer_role,
        signer_registration_number:
          signature.signer_registration_number,
        expected_version: expectedVersion,
        submitted_version: submittedVersion,
      }),
    }
  );

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      formatApiError(
        data,
        "Failed to approve, sign and issue report."
      )
    );
  }

  return data;
}

export async function rejectOpsReport(reportId: string | number, note: string, expectedVersion: number, submittedVersion: number) {
  const res = await fetch(`${API_URL}/ops/reports/${reportId}/reject/`, {
    method: "POST",
    credentials: "include",
    headers: await getCsrfHeaders(true),
    body: JSON.stringify({ note, expected_version: expectedVersion, submitted_version: submittedVersion }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(formatApiError(data, "Failed to reject report."));
  return data;
}


export async function fetchClinicReports(params?: { search?: string; status?: string }) {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.status) query.set("status", params.status);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const res = await fetch(`${API_URL}/reports/clinic/${suffix}`, {
    cache: "no-store",
    credentials: "include",
  });
  const data = await res.json().catch(() => []);
  if (!res.ok) throw new Error(formatApiError(data, "Failed to load clinic reports."));
  return data;
}

export async function fetchHospitalReports(search = "") {
  const suffix = search ? `?search=${encodeURIComponent(search)}` : "";
  const res = await fetch(`${API_URL}/referrals/hospital/reports/${suffix}`, {
    cache: "no-store",
    credentials: "include",
  });
  const data = await res.json().catch(() => []);
  if (!res.ok) throw new Error(formatApiError(data, "Failed to load hospital reports."));
  return data;
}

export async function fetchHospitalReportById(id: string | number) {
  const res = await fetch(`${API_URL}/referrals/hospital/reports/${id}/`, {
    cache: "no-store",
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(formatApiError(data, "Failed to load hospital report."));
  return data;
}


export type PatientTimelineEvent = {
  id: number;
  category: string;
  event_type: string;
  title: string;
  description: string;
  source_type: string;
  source_id: string;
  encounter_id: string;
  report_id: string;
  referral_id: string;
  payment_id: string;
  actor_display: string;
  organization_display: string;
  visibility: string;
  metadata: Record<string, unknown>;
  occurred_at: string;
};

export async function fetchPatientTimeline(
  patientId: string | number,
  portal: "clinic" | "ops" | "hospital" = "clinic"
) {
  const res = await fetch(
    `${API_URL}/audit/patients/${patientId}/timeline/?portal=${portal}`,
    {
      cache: "no-store",
      credentials: "include",
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(formatApiError(data, "Failed to load patient timeline."));
  }
  return data;
}


export type HospitalPatientListItem = {
  patient_pk: number;
  patient_id: string;
  sentinel_patient_id?: string;
  patient_name: string;
  date_of_birth?: string;
  sex?: string;
  phone?: string;
  email?: string;
  hospital_mrn: string;
  referral_pk: number;
  referral_id: string;
  referral_status: string;
  clinic_name: string;
  payment_status: string;
  report_pk?: number | null;
  report_id: string;
  report_status: string;
  report_ready: boolean;
  latest_activity: string;
};

export async function fetchHospitalPatients(params?: {
  search?: string;
  status?: string;
}) {
  const query = new URLSearchParams();

  if (params?.search) query.set("search", params.search);
  if (params?.status && params.status !== "all") {
    query.set("status", params.status);
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";
  const res = await fetch(
    `${API_URL}/referrals/hospital/patients/${suffix}`,
    {
      cache: "no-store",
      credentials: "include",
    }
  );

  const data = await res.json().catch(() => []);

  if (!res.ok) {
    throw new Error(
      formatApiError(data, "Failed to load hospital patients.")
    );
  }

  return data as HospitalPatientListItem[];
}

export async function fetchHospitalPatientById(
  patientId: string | number
) {
  const res = await fetch(
    `${API_URL}/referrals/hospital/patients/${patientId}/`,
    {
      cache: "no-store",
      credentials: "include",
    }
  );

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      formatApiError(data, "Failed to load hospital patient.")
    );
  }

  return data;
}



export type OrganizationCapabilityProfile = {
  id: number;
  organization: number;
  organization_name: string;
  organization_code: string;
  organization_type: string;
  workflow_mode:
    | "sentinel_managed"
    | "clinic_managed"
    | "hybrid";
  referral_requirement:
    | "required"
    | "optional"
    | "not_required";
  patient_ownership: "hospital" | "clinic" | "shared";
  can_create_direct_patients: boolean;
  can_issue_reports_directly: boolean;
  electronic_signature_required: boolean;
  sentinel_review_policy:
    | "mandatory"
    | "optional"
    | "unavailable";
  default_payment_responsibility:
    | "patient"
    | "clinic"
    | "hospital"
    | "programme"
    | "waived";
  branding_policy:
    | "sentinel_only"
    | "organization_only"
    | "organization_and_sentinel"
    | "hospital_and_sentinel"
    | "hospital_clinic_sentinel";
  default_programme: "diabetic_screening" | "ocular_diagnostics";
  subscription_tier:
    | "pilot"
    | "clinic_core"
    | "managed_review"
    | "hybrid"
    | "enterprise";
  ai_enabled: boolean;
  clinic_direct_screening_enabled: boolean;
  ocular_diagnostics_enabled: boolean;
  feature_flags: Record<string, unknown>;
  settings_notes: string;
  created_at: string;
  updated_at: string;
};

export async function fetchMyOrganizationCapabilities() {
  const res = await fetch(
    `${API_URL}/organizations/me/capabilities/`,
    {
      cache: "no-store",
      credentials: "include",
    }
  );

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      formatApiError(
        data,
        "Failed to load organization capabilities."
      )
    );
  }

  return data as OrganizationCapabilityProfile;
}

export async function updateOpsClinicCapabilities(
  clinicId: string | number,
  data: Partial<OrganizationCapabilityProfile>
) {
  const res = await fetch(
    `${API_URL}/ops/clinics/${clinicId}/`,
    {
      method: "PATCH",
      credentials: "include",
      headers: await getCsrfHeaders(true),
      body: JSON.stringify(data),
    }
  );

  const responseData = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      formatApiError(
        responseData,
        "Failed to update clinic capabilities."
      )
    );
  }

  return responseData;
}


export async function createClinicDirectPatient(data: any) {
  const res = await fetch(`${API_URL}/patients/clinic-direct/`, {
    method: "POST", credentials: "include", headers: await getCsrfHeaders(true), body: JSON.stringify(data),
  });
  const responseData = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(formatApiError(responseData, "Failed to create clinic-direct patient."));
  return responseData;
}


export async function clinicIssueReport(reportId: string | number, signature: { signer_name: string; signer_role: string; signer_registration_number: string; }, expectedVersion: number) {
  const res = await fetch(`${API_URL}/reports/${reportId}/clinic-issue/`, { method: "POST", credentials: "include", headers: await getCsrfHeaders(true), body: JSON.stringify({ ...signature, expected_version: expectedVersion }) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(formatApiError(data, "Failed to sign and issue report."));
  return data;
}


export type DistributionQueueItem = {
  kind: "diabetic" | "targeted";
  id: number;
  report_id: string;
  patient_id: string;
  sentinel_patient_id?: string | null;
  patient_name: string;
  clinic_name: string;
  source_type: string;
  workflow_route: string;
  referral_id: string;
  source_hospital_name: string;
  has_hospital_recipient: boolean;
  report_status: string;
  distribution_status: string;
  patient_delivery_required: boolean;
  issued_at: string;
  hospital_released_at: string;
  pdf_url: string;
  lock_version: number;
};

export async function fetchDistributionQueue(params?: {
  status?: string;
  search?: string;
}) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.search) query.set("search", params.search);
  const suffix = query.toString() ? `?${query.toString()}` : "";

  const res = await fetch(`${API_URL}/ops/distribution/${suffix}`, {
    cache: "no-store",
    credentials: "include",
  });
  const data = await res.json().catch(() => []);
  if (!res.ok) {
    throw new Error(
      formatApiError(data, "Failed to load Distribution Centre.")
    );
  }
  return data as DistributionQueueItem[];
}

export async function releaseReportToHospital(
  reportId: string | number,
  expectedVersion: number,
  kind: "diabetic" | "targeted" = "diabetic"
) {
  const res = await fetch(
    kind === "targeted"
      ? `${API_URL}/reports/eye-health/${reportId}/release-hospital/`
      : `${API_URL}/ops/distribution/${reportId}/release-hospital/`,
    {
      method: "POST",
      credentials: "include",
      headers: await getCsrfHeaders(true),
      body: JSON.stringify({ expected_version: expectedVersion }),
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(formatApiError(data, "Failed to release report."));
  }
  return data;
}

export async function markPatientDeliveryRequired(
  reportId: string | number
) {
  const res = await fetch(
    `${API_URL}/ops/distribution/${reportId}/patient-required/`,
    {
      method: "POST",
      credentials: "include",
      headers: await getCsrfHeaders(true),
      body: JSON.stringify({}),
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      formatApiError(data, "Failed to mark patient delivery.")
    );
  }
  return data;
}


export type RecallQueueItem = {
  id: number;
  report_id: string;
  patient_id: string;
  sentinel_patient_id?: string | null;
  patient_name: string;
  patient_email: string;
  clinic_name: string;
  recall_months: number;
  recall_due_date: string;
  recall_status: string;
  recall_note: string;
};

export async function fetchRecallQueue(
  statusFilter = "all"
) {
  const res = await fetch(
    `${API_URL}/reports/recalls/?status=${encodeURIComponent(
      statusFilter
    )}`,
    {
      cache: "no-store",
      credentials: "include",
    }
  );
  const data = await res.json().catch(() => []);
  if (!res.ok) {
    throw new Error(
      formatApiError(data, "Failed to load recall queue.")
    );
  }
  return data as RecallQueueItem[];
}

export async function runRecallAction(
  reportId: number | string,
  action:
    | "contacted"
    | "booked"
    | "completed"
    | "deferred"
    | "send_email",
  note = ""
) {
  const res = await fetch(
    `${API_URL}/reports/recalls/${reportId}/action/`,
    {
      method: "POST",
      credentials: "include",
      headers: await getCsrfHeaders(true),
      body: JSON.stringify({ action, note }),
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      formatApiError(data, "Failed to update recall.")
    );
  }
  return data;
}

export type PatientReportDelivery = {
  id: number;
  report: number;
  report_id_display: string;
  patient: number;
  patient_name: string;
  recipient: string;
  include_images: boolean;
  consent_confirmed: boolean;
  status: string;
  failure_reason: string;
  sent_at?: string | null;
  created_at: string;
};

export async function fetchPatientDeliveries(
  statusFilter = ""
) {
  const suffix = statusFilter
    ? `?status=${encodeURIComponent(statusFilter)}`
    : "";
  const res = await fetch(
    `${API_URL}/reports/patient-deliveries/${suffix}`,
    {
      cache: "no-store",
      credentials: "include",
    }
  );
  const data = await res.json().catch(() => []);
  if (!res.ok) {
    throw new Error(
      formatApiError(
        data,
        "Failed to load patient deliveries."
      )
    );
  }
  return data as PatientReportDelivery[];
}

export async function createPatientDelivery(data: {
  report: number | string;
  recipient: string;
  include_images?: boolean;
  consent_confirmed: boolean;
}) {
  const res = await fetch(
    `${API_URL}/reports/patient-deliveries/`,
    {
      method: "POST",
      credentials: "include",
      headers: await getCsrfHeaders(true),
      body: JSON.stringify(data),
    }
  );
  const responseData = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      formatApiError(
        responseData,
        "Failed to create patient delivery."
      )
    );
  }
  return responseData as PatientReportDelivery;
}

export async function sendPatientDelivery(
  deliveryId: number | string
) {
  const res = await fetch(
    `${API_URL}/reports/patient-deliveries/${deliveryId}/send/`,
    {
      method: "POST",
      credentials: "include",
      headers: await getCsrfHeaders(true),
      body: JSON.stringify({}),
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      formatApiError(data, "Failed to send patient report.")
    );
  }
  return data as PatientReportDelivery;
}

export type HistoricalAccessRequest = {
  id: number;
  master_patient: number;
  master_patient_display: string;
  patient_name: string;
  requesting_organization: number;
  requesting_organization_name: string;
  requested_by_display: string;
  purpose: string;
  consent_reference: string;
  consent_record?: number | null;
  include_reports: boolean;
  include_images: boolean;
  status: string;
  reviewed_by_display: string;
  reviewed_at?: string | null;
  review_note: string;
  expires_at?: string | null;
  revoked_at?: string | null;
  is_currently_active: boolean;
  created_at: string;
};

export async function requestHistoricalAccess(data: {
  patient: number | string;
  purpose: string;
  consent_reference?: string;
  consent_record?: number | string | null;
  include_reports?: boolean;
  include_images?: boolean;
}) {
  const res = await fetch(
    `${API_URL}/patients/historical-access/`,
    {
      method: "POST",
      credentials: "include",
      headers: await getCsrfHeaders(true),
      body: JSON.stringify(data),
    }
  );

  const responseData = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      formatApiError(
        responseData,
        "Failed to request historical access."
      )
    );
  }

  return responseData as HistoricalAccessRequest;
}

export async function fetchClinicHistoricalAccessRequests() {
  const res = await fetch(
    `${API_URL}/patients/historical-access/`,
    {
      cache: "no-store",
      credentials: "include",
    }
  );

  const data = await res.json().catch(() => []);

  if (!res.ok) {
    throw new Error(
      formatApiError(
        data,
        "Failed to load historical access requests."
      )
    );
  }

  return data as HistoricalAccessRequest[];
}

export async function fetchHistoricalRecords(
  requestId: number | string
) {
  const res = await fetch(
    `${API_URL}/patients/historical-access/${requestId}/records/`,
    {
      cache: "no-store",
      credentials: "include",
    }
  );

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      formatApiError(
        data,
        "Failed to load historical records."
      )
    );
  }

  return data;
}

export async function fetchOpsIdentityReviews() {
  const res = await fetch(
    `${API_URL}/ops/identity-reviews/`,
    {
      cache: "no-store",
      credentials: "include",
    }
  );

  const data = await res.json().catch(() => []);

  if (!res.ok) {
    throw new Error(
      formatApiError(
        data,
        "Failed to load identity reviews."
      )
    );
  }

  return data;
}

export async function decideOpsIdentityReview(
  reviewId: number | string,
  decision: "link" | "keep_separate",
  note = ""
) {
  const res = await fetch(
    `${API_URL}/ops/identity-reviews/${reviewId}/decision/`,
    {
      method: "POST",
      credentials: "include",
      headers: await getCsrfHeaders(true),
      body: JSON.stringify({
        decision,
        note,
      }),
    }
  );

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      formatApiError(
        data,
        "Failed to complete identity review."
      )
    );
  }

  return data;
}

export async function fetchOpsHistoricalAccessRequests(
  statusFilter = "pending"
) {
  const res = await fetch(
    `${API_URL}/ops/historical-access/?status=${encodeURIComponent(
      statusFilter
    )}`,
    {
      cache: "no-store",
      credentials: "include",
    }
  );

  const data = await res.json().catch(() => []);

  if (!res.ok) {
    throw new Error(
      formatApiError(
        data,
        "Failed to load historical access requests."
      )
    );
  }

  return data as HistoricalAccessRequest[];
}

export async function decideOpsHistoricalAccess(
  requestId: number | string,
  decision: "approve" | "reject" | "revoke",
  options?: {
    note?: string;
    days?: number;
  }
) {
  const res = await fetch(
    `${API_URL}/ops/historical-access/${requestId}/decision/`,
    {
      method: "POST",
      credentials: "include",
      headers: await getCsrfHeaders(true),
      body: JSON.stringify({
        decision,
        note: options?.note || "",
        days: options?.days || 30,
      }),
    }
  );

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      formatApiError(
        data,
        "Failed to update historical access."
      )
    );
  }

  return data as HistoricalAccessRequest;
}
