import { ensureCsrf } from "@/lib/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const API_URL = `${API_BASE_URL}/api`;

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

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create report: ${res.status} ${text}`);
  }

  return res.json();
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