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

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create encounter: ${res.status} ${text}`);
  }

  return res.json();
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

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to upload image: ${res.status} ${text}`);
  }

  return res.json();
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

  return res.json();
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

export async function submitReportToOps(reportId: string | number) {
  const res = await fetch(`${API_URL}/reports/${reportId}/submit-to-ops/`, {
    method: "POST",
    credentials: "include",
    headers: await getCsrfHeaders(true),
    body: JSON.stringify({}),
  });

  const responseData = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(formatApiError(responseData, "Failed to submit report to Ops."));
  }

  return responseData;
}

export function getReportPdfUrl(reportId: string | number) {
  return `${API_URL}/reports/${reportId}/pdf/`;
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

export async function returnOpsReport(reportId: string | number, reason: string) {
  const res = await fetch(`${API_URL}/ops/reports/${reportId}/return/`, {
    method: "POST",
    credentials: "include",
    headers: await getCsrfHeaders(true),
    body: JSON.stringify({ reason }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(formatApiError(data, "Failed to return report."));
  return data;
}

export async function approveAndIssueOpsReport(reportId: string | number, note = "") {
  const res = await fetch(`${API_URL}/ops/reports/${reportId}/approve/`, {
    method: "POST",
    credentials: "include",
    headers: await getCsrfHeaders(true),
    body: JSON.stringify({ note }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(formatApiError(data, "Failed to issue report."));
  return data;
}

export async function rejectOpsReport(reportId: string | number, note: string) {
  const res = await fetch(`${API_URL}/ops/reports/${reportId}/reject/`, {
    method: "POST",
    credentials: "include",
    headers: await getCsrfHeaders(true),
    body: JSON.stringify({ note }),
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
