import { cookies } from "next/headers";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const API_URL = `${API_BASE_URL}/api`;

export type CurrentUser = {
  id: number;
  username: string;
  email: string;
  is_staff: boolean;
  is_superuser: boolean;
  roles: string[];
};

async function getServerHeaders() {
  const cookieStore = await cookies();
  return {
    Cookie: cookieStore.toString(),
  };
}

async function fetchServerJson(path: string) {
  const res = await fetch(`${API_URL}${path}`, {
    cache: "no-store",
    headers: await getServerHeaders(),
  });

  if (res.status === 401 || res.status === 403) {
    const text = await res.text();
    throw new Error(`Unauthorized: ${res.status} ${text}`);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Request failed: ${res.status} ${text}`);
  }

  return res.json();
}

export async function fetchCurrentUserServer(): Promise<CurrentUser | null> {
  const res = await fetch(`${API_URL}/auth/me/`, {
    cache: "no-store",
    headers: await getServerHeaders(),
  });

  if (res.status === 401 || res.status === 403) {
    return null;
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch current user: ${res.status} ${text}`);
  }

  return res.json();
}

export async function fetchDashboardSummaryServer() {
  return fetchServerJson("/dashboard/summary/");
}

export async function fetchPatientByIdServer(id: string) {
  return fetchServerJson(`/patients/${id}/`);
}

export async function fetchPatientEncountersServer(id: string) {
  return fetchServerJson(`/encounters/patient/${id}/`);
}

export async function fetchPatientReportsServer(id: string) {
  return fetchServerJson(`/reports/patient/${id}/`);
}

export async function fetchPatientConsentsServer(id: string) {
  return fetchServerJson(`/consents/patient/${id}/`);
}

export async function fetchEncounterByIdServer(id: string) {
  return fetchServerJson(`/encounters/${id}/`);
}

export async function fetchEncounterUploadsServer(id: string) {
  return fetchServerJson(`/uploads/encounter/${id}/`);
}

export async function fetchEncounterReportsServer(id: string) {
  return fetchServerJson(`/reports/encounter/${id}/`);
}

export async function fetchEncounterConsentsServer(id: string) {
  return fetchServerJson(`/consents/encounter/${id}/`);
}