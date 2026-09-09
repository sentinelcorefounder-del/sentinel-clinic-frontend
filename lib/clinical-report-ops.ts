const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function cookie(name: string) {
  if (typeof document === "undefined") return "";
  return document.cookie.split("; ").find((part) => part.startsWith(`${name}=`))?.split("=").slice(1).join("=") || "";
}
async function headers() {
  await fetch(`${API_BASE}/api/auth/csrf/`, { credentials: "include" });
  return { "Content-Type": "application/json", "X-CSRFToken": decodeURIComponent(cookie("csrftoken")) };
}
async function json(response: Response, fallback: string) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || data.error || fallback);
  return data;
}
export async function fetchOpsEyeHealthReport(id: string | number) {
  return json(await fetch(`${API_BASE}/api/ops/clinical-reports/eye-health/${id}/`, { credentials: "include", cache: "no-store" }), "Unable to load targeted report.");
}
export async function reviewOpsEyeHealthReport(id: string | number, decision: "approve" | "return", note: string) {
  const path = decision === "approve" ? "ops-approve" : "ops-return";
  const body = decision === "approve" ? { note } : { reason: note };
  return json(await fetch(`${API_BASE}/api/reports/eye-health/${id}/${path}/`, { method: "POST", credentials: "include", headers: await headers(), body: JSON.stringify(body) }), "Unable to complete Ops review.");
}
export async function fetchOpsOcularReport(encounterId: string | number) {
  return json(await fetch(`${API_BASE}/api/ops/clinical-reports/ocular/${encounterId}/`, { credentials: "include", cache: "no-store" }), "Unable to load ocular report.");
}
export async function reviewOpsOcularReport(encounterId: string | number, decision: "approve" | "return", note: string) {
  return json(await fetch(`${API_BASE}/api/encounters/${encounterId}/ocular-assessment/ops-review/`, { method: "POST", credentials: "include", headers: await headers(), body: JSON.stringify({ decision, note }) }), "Unable to complete Ops review.");
}
