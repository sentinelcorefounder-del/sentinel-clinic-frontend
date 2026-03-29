import { cookies } from "next/headers";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const API_URL = `${API_BASE_URL}/api`;

export async function fetchDashboardSummaryServer() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const res = await fetch(`${API_URL}/dashboard/summary/`, {
    cache: "no-store",
    headers: {
      Cookie: cookieHeader,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch dashboard summary: ${res.status} ${text}`);
  }

  return res.json();
}