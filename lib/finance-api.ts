import { ensureCsrf, getCookie } from "@/lib/auth";
import type { BankTransferFunding, PartnerFinance } from "@/types/finance";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

async function parseResponse(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = Array.isArray(data?.detail) ? data.detail.join(" ") : data?.detail;
    throw new Error(detail || `Finance request failed (${res.status})`);
  }
  return data;
}

export async function fetchMyFinance(): Promise<PartnerFinance> {
  const res = await fetch(`${API_URL}/api/finance/me/`, {
    credentials: "include",
    cache: "no-store",
  });
  return parseResponse(res);
}

export async function fetchMyBankTransfers(): Promise<BankTransferFunding[]> {
  const res = await fetch(`${API_URL}/api/finance/bank-transfer-funding/`, {
    credentials: "include", cache: "no-store",
  });
  return parseResponse(res);
}

export async function initializeWalletTopUp(input: {
  walletId: number;
  amount: string;
  email: string;
}) {
  await ensureCsrf();
  const csrfToken = getCookie("csrftoken") || "";
  const res = await fetch(`${API_URL}/api/payments/initialize/`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrfToken,
    },
    body: JSON.stringify({
      purpose: "wallet_top_up",
      wallet_id: input.walletId,
      amount: input.amount,
      email: input.email,
      metadata: { initiated_from: "partner_finance_portal" },
    }),
  });
  return parseResponse(res);
}

export async function financeWrite(path: string, method: "POST" | "PATCH" | "DELETE", body?: unknown) {
  await ensureCsrf();
  const csrfToken = getCookie("csrftoken") || "";
  const res = await fetch(`${API_URL}${path}`, {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json", "X-CSRFToken": csrfToken },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return parseResponse(res);
}

export async function financeWriteForm(path: string, body: FormData) {
  await ensureCsrf();
  const csrfToken = getCookie("csrftoken") || "";
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "X-CSRFToken": csrfToken },
    body,
  });
  return parseResponse(res);
}
