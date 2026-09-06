export type PatientSourceFilter =
  | "all"
  | "clinic_direct"
  | "hospital_referral";

export type PatientQuery = {
  search?: string;
  source?: PatientSourceFilter;
  hospitalId?: number | string | null;
  diabetic?: "all" | "yes" | "no";
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const API_URL = `${API_BASE_URL}/api`;

export async function fetchClinicPatients(
  params: PatientQuery = {}
) {
  const query = new URLSearchParams();

  if (params.search?.trim()) {
    query.set("search", params.search.trim());
  }

  if (params.source && params.source !== "all") {
    query.set("source", params.source);
  }

  if (params.hospitalId) {
    query.set("hospital_id", String(params.hospitalId));
  }

  if (params.diabetic && params.diabetic !== "all") {
    query.set("diabetic", params.diabetic);
  }

  const suffix = query.toString()
    ? `?${query.toString()}`
    : "";

  const response = await fetch(
    `${API_URL}/patients/${suffix}`,
    {
      cache: "no-store",
      credentials: "include",
    }
  );

  const data = await response.json().catch(() => []);

  if (!response.ok) {
    throw new Error(
      data?.detail || "Failed to load clinic patients."
    );
  }

  return data;
}
