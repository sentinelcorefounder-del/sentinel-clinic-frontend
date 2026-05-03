"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || "";
  return "";
}

async function getCsrfToken() {
  await fetch(`${API_URL}/api/auth/csrf/`, {
    credentials: "include",
  });

  return getCookie("csrftoken");
}

async function postJson(path: string, body: any = {}) {
  const csrf = await getCsrfToken();

  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrf,
    },
    body: JSON.stringify(body),
  });

  let data: any = {};

  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    throw new Error(
      data.detail ||
        data.message ||
        "Something went wrong. Please try again or contact Ops support."
    );
  }

  return data;
}

export default function OpsReferralActions({
  referral,
  clinics,
}: {
  referral: any;
  clinics: any[];
}) {
  const [loading, setLoading] = useState("");
  const [message, setMessage] = useState("");
  const [selectedClinicId, setSelectedClinicId] = useState(
    referral.matched_clinic ? String(referral.matched_clinic) : ""
  );

  const hasPayment = Boolean(referral.payment_id);
  const paymentStatus = referral.payment_status || "";
  const isPaid = paymentStatus === "paid";
  const hasPaymentLink = Boolean(referral.payment_link);

  async function runAction(actionName: string, path: string, body: any = {}) {
    try {
      setLoading(actionName);
      setMessage("");

      const data = await postJson(path, body);

      setMessage(data.message || "Action completed.");
      window.location.reload();
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading("");
    }
  }

  return (
    <div className="bg-white rounded-xl shadow p-6 mb-6">
      <h2 className="font-bold text-lg mb-4">Ops Actions</h2>

      <div className="flex flex-wrap gap-3 mb-4">
        {!hasPayment && (
          <button
            onClick={() =>
              runAction(
                "create-payment",
                `/api/ops/referrals/${referral.id}/create-payment/`,
                {
                  amount: "15000",
                  patient_email: referral.email,
                }
              )
            }
            disabled={loading !== ""}
            className="px-4 py-2 rounded bg-slate-900 text-white disabled:opacity-50"
          >
            {loading === "create-payment" ? "Creating..." : "Create Payment"}
          </button>
        )}

        {hasPayment && !hasPaymentLink && !isPaid && (
          <button
            onClick={() =>
              runAction(
                "initialize-payment",
                `/api/ops/payments/${referral.payment_id}/initialize/`
              )
            }
            disabled={loading !== ""}
            className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
          >
            {loading === "initialize-payment"
              ? "Initializing..."
              : "Initialize Link"}
          </button>
        )}

        {hasPayment && !isPaid && (
          <button
            onClick={() =>
              runAction(
                "verify-payment",
                `/api/ops/payments/${referral.payment_id}/verify/`
              )
            }
            disabled={loading !== ""}
            className="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-50"
          >
            {loading === "verify-payment" ? "Verifying..." : "Verify Payment"}
          </button>
        )}

        {isPaid && (
          <span className="px-4 py-2 rounded bg-green-100 text-green-700 font-medium">
            Payment Paid
          </span>
        )}

        {hasPaymentLink && (
          <a
            href={referral.payment_link}
            target="_blank"
            className="px-4 py-2 rounded border border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
          >
            Open Payment Link
          </a>
        )}
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={selectedClinicId}
          onChange={(e) => setSelectedClinicId(e.target.value)}
          className="border rounded px-3 py-2 min-w-64"
        >
          <option value="">Select clinic</option>
          {clinics.map((clinic) => (
            <option key={clinic.id} value={clinic.id}>
              {clinic.name} {clinic.code ? `(${clinic.code})` : ""}
            </option>
          ))}
        </select>

        <button
          onClick={() =>
            runAction(
              "assign-clinic",
              `/api/ops/referrals/${referral.id}/assign-clinic/`,
              {
                clinic_id: selectedClinicId,
              }
            )
          }
          disabled={loading !== "" || !selectedClinicId}
          className="px-4 py-2 rounded bg-purple-600 text-white disabled:opacity-50"
        >
          {loading === "assign-clinic" ? "Assigning..." : "Assign Clinic"}
        </button>
      </div>

      {clinics.length === 0 ? (
        <p className="mt-3 text-sm text-red-700">
          No clinics found. Create a clinic from Ops Admin first.
        </p>
      ) : null}

      {message && (
        <p className="mt-4 text-sm bg-slate-100 rounded p-3">{message}</p>
      )}
    </div>
  );
}