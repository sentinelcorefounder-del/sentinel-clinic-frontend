import { ensureCsrf, getCookie } from "@/lib/auth";
import type { BankTransferFunding, PartnerFinance } from "@/types/finance";
import { financeErrorMessage } from "@/lib/finance-error";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

async function parseResponse(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(financeErrorMessage(data, res.status));
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

function safeDownloadFilename(value: string | null, fallback: string) {
  const candidate = (value || "").split(/[\\/]/).pop()?.replace(/[^A-Za-z0-9._ -]/g, "_").trim();
  return candidate && candidate !== "." && candidate !== ".." ? candidate : fallback;
}

function responseFilename(res: Response, fallback: string) {
  const disposition = res.headers.get("Content-Disposition") || "";
  const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const quoted = disposition.match(/filename="([^"]+)"/i)?.[1];
  const plain = disposition.match(/filename=([^;]+)/i)?.[1]?.trim();
  let supplied = encoded || quoted || plain || "";
  try { supplied = decodeURIComponent(supplied); } catch { supplied = ""; }
  return safeDownloadFilename(supplied, fallback);
}

export async function downloadFinanceFile(path: string, fallbackFilename: string) {
  const res = await fetch(`${API_URL}${path}`, { credentials: "include", cache: "no-store" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(financeErrorMessage(data, res.status));
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = responseFilename(res, safeDownloadFilename(fallbackFilename, "finance-evidence"));
    link.click();
    link.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function downloadFinancePdf(path: string, filename: string) {
  return downloadFinanceFile(path, filename);
}
