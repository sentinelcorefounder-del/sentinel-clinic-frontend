import { ensureCsrf } from "@/lib/auth";
import type {
  OnwardEligibility,
  OnwardReferral,
  OnwardResponsibility,
  RegisteredHospital,
} from "@/types/onward-referral";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const ROOT = `${API_BASE}/api/onward-referrals`;

function safeMessage(value: unknown, fallback: string) {
  if (!value || typeof value !== "object") return fallback;
  const detail = (value as { detail?: unknown }).detail;
  const messages = typeof detail === "string" ? [detail] : Array.isArray(detail) ? detail : [];
  const safe = messages.filter(
    (item): item is string =>
      typeof item === "string" && item.length <= 400 &&
      !/[<>\r\n]/.test(item) && !/(traceback|stacktrace|exception|internal_error)/i.test(item)
  );
  return safe.length ? safe.join(" ") : fallback;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const method = options?.method || "GET";
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (method !== "GET") {
    const { csrfToken } = await ensureCsrf();
    headers["X-CSRFToken"] = csrfToken;
  }
  const response = await fetch(`${ROOT}${path}`, {
    ...options, headers: { ...headers, ...(options?.headers || {}) },
    credentials: "include", cache: "no-store",
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new Error(safeMessage(data, `Onward-referral request failed (${response.status}).`));
  return data as T;
}

export const fetchOnwardEligibility = (encounterId: number) =>
  request<OnwardEligibility>(`/encounters/${encounterId}/eligibility/`);
export const fetchOnwardResponsibility = (encounterId: number) =>
  request<OnwardResponsibility | null>(`/encounters/${encounterId}/responsibility/`);
export const acceptOnwardResponsibility = (encounterId: number, data: Record<string, string>) =>
  request<OnwardResponsibility>(`/encounters/${encounterId}/responsibility/`, { method: "POST", body: JSON.stringify(data) });
export const fetchOnwardReferrals = () => request<OnwardReferral[]>("/");
export const fetchOnwardReferral = (uuid: string) => request<OnwardReferral>(`/${uuid}/`);
export const fetchRegisteredHospitals = () => request<RegisteredHospital[]>("/registered-hospitals/");
export const createOnwardReferral = (data: Record<string, unknown>) =>
  request<OnwardReferral>("/", { method: "POST", body: JSON.stringify(data) });
export const updateOnwardReferral = (uuid: string, data: Record<string, unknown>) =>
  request<OnwardReferral>(`/${uuid}/`, { method: "PATCH", body: JSON.stringify(data) });
export const finalizeOnwardReferral = (uuid: string) =>
  request<OnwardReferral>(`/${uuid}/finalize/`, { method: "POST", body: "{}" });
export const supersedeOnwardReferral = (uuid: string, reason: string) =>
  request<OnwardReferral>(`/${uuid}/supersede/`, { method: "POST", body: JSON.stringify({ reason }) });
export const makeOnwardReferralAvailable = (uuid: string, version: number) =>
  request<{ state: string; granted_at: string }>(`/${uuid}/availability/`, {
    method: "POST", body: JSON.stringify({ idempotency_key: `portal-${uuid}-v${version}` }),
  });
export const onwardDocumentUrl = (path: string) => `${API_BASE}${path}`;
export const onwardPreviewUrl = (uuid: string) => `${ROOT}/${uuid}/preview/`;
