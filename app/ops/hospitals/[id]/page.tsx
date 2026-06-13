"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type Props = {
  params: Promise<{ id: string }>;
};

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  return parts.length === 2 ? parts.pop()?.split(";").shift() || "" : "";
}

async function getCsrfHeaders() {
  await fetch(`${API_URL}/api/auth/csrf/`, {
    credentials: "include",
  });

  return {
    "Content-Type": "application/json",
    "X-CSRFToken": getCookie("csrftoken"),
  };
}

function formatMoney(currency: string, amount: string | number | null | undefined) {
  const value = Number(amount || 0);
  return `${currency || "NGN"} ${value.toLocaleString()}`;
}

export default function OpsHospitalDetailPage({ params }: Props) {
  const [id, setId] = useState("");
  const [hospital, setHospital] = useState<any>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: "",
    contact_email: "",
    phone: "",
    address: "",
    screening_fee_amount: "15000",
    hospital_commission_amount: "0",
    currency: "NGN",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");

  async function loadHospital(hospitalId: string) {
    const res = await fetch(`${API_URL}/api/ops/hospitals/${hospitalId}/`, {
      credentials: "include",
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data?.detail || `API error ${res.status}`);
    }

    setHospital(data.hospital);
    setReferrals(data.referrals || []);
    setPayments(data.payments || []);

    setForm({
      name: data.hospital?.name || "",
      contact_email: data.hospital?.contact_email || "",
      phone: data.hospital?.phone || "",
      address: data.hospital?.address || "",
      screening_fee_amount: String(data.hospital?.screening_fee_amount ?? "15000"),
      hospital_commission_amount: String(data.hospital?.hospital_commission_amount ?? "0"),
      currency: data.hospital?.currency || "NGN",
    });
  }

  useEffect(() => {
    async function run() {
      try {
        const resolved = await params;
        setId(resolved.id);
        await loadHospital(resolved.id);
      } catch (err) {
        setMessageType("error");
        setMessage(err instanceof Error ? err.message : "Failed to load hospital.");
      } finally {
        setLoading(false);
      }
    }

    run();
  }, [params]);

  async function saveHospital() {
    try {
      setSaving(true);
      setMessage("");
      setMessageType("info");

      const res = await fetch(`${API_URL}/api/ops/hospitals/${id}/`, {
        method: "PATCH",
        credentials: "include",
        headers: await getCsrfHeaders(),
        body: JSON.stringify({
          name: form.name,
          contact_email: form.contact_email,
          phone: form.phone,
          address: form.address,
          screening_fee_amount: form.screening_fee_amount,
          hospital_commission_amount: form.hospital_commission_amount,
          currency: form.currency.toUpperCase(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.detail || "Failed to update hospital charge.");
      }

      setHospital(data.hospital);
      setReferrals(data.referrals || []);
      setPayments(data.payments || []);
      setMessageType("success");
      setMessage("Hospital charge updated successfully.");
    } catch (err) {
      setMessageType("error");
      setMessage(err instanceof Error ? err.message : "Failed to update hospital charge.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading hospital...</p>;
  }

  if (!hospital) {
    return <p className="text-sm text-red-600">{message || "Hospital not found."}</p>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">{hospital.name}</h1>
      <p className="text-slate-500 mb-6">{hospital.code}</p>

      {message ? (
        <div
          className={`mb-6 rounded-lg border p-3 text-sm ${
            messageType === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {message}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Box title="Hospital Info">
          <p>Email: {hospital.contact_email || "-"}</p>
          <p>Phone: {hospital.phone || "-"}</p>
          <p>Address: {hospital.address || "-"}</p>
        </Box>

        <Box title="Summary">
          <p>Total Referrals: {referrals.length}</p>
          <p>Total Payments: {payments.length}</p>
          <p>Paid: {payments.filter((p: any) => p.status === "paid").length}</p>
        </Box>

        <Box title="Hospital Charge">
          <p>
            Patient Screening Fee:{" "}
            <strong>{formatMoney(hospital.currency, hospital.screening_fee_amount)}</strong>
          </p>
          <p>
            Hospital Commission:{" "}
            <strong>{formatMoney(hospital.currency, hospital.hospital_commission_amount)}</strong>
          </p>
          <p>Currency: {hospital.currency || "NGN"}</p>
        </Box>
      </div>

      <Section title="Edit Hospital Charge">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Hospital Name"
            value={form.name}
            onChange={(value) => setForm({ ...form, name: value })}
          />

          <Input
            label="Contact Email"
            value={form.contact_email}
            onChange={(value) => setForm({ ...form, contact_email: value })}
          />

          <Input
            label="Phone"
            value={form.phone}
            onChange={(value) => setForm({ ...form, phone: value })}
          />

          <Input
            label="Currency"
            value={form.currency}
            onChange={(value) => setForm({ ...form, currency: value.toUpperCase() })}
          />

          <Input
            label="Patient Screening Fee"
            type="number"
            value={form.screening_fee_amount}
            onChange={(value) => setForm({ ...form, screening_fee_amount: value })}
          />

          <Input
            label="Hospital Commission"
            type="number"
            value={form.hospital_commission_amount}
            onChange={(value) => setForm({ ...form, hospital_commission_amount: value })}
          />

          <label className="md:col-span-2">
            <span className="block text-sm font-medium mb-1">Address</span>
            <textarea
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full border rounded px-3 py-2 min-h-20"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={saveHospital}
          disabled={saving}
          className="mt-4 rounded bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Hospital Charge"}
        </button>
      </Section>

      <Section title="Referrals">
        <Table
          headers={["Referral ID", "Patient", "Clinic", "Status"]}
          rows={referrals.map((r: any) => [
            r.referral_id,
            r.patient_name,
            r.matched_clinic_name || "-",
            r.referral_status,
          ])}
        />
      </Section>

      <Section title="Payments">
        <Table
          headers={["Payment ID", "Patient", "Amount", "Status"]}
          rows={payments.map((p: any) => [
            p.payment_id,
            p.patient_name,
            `${p.currency} ${p.amount}`,
            p.status,
          ])}
        />
      </Section>
    </div>
  );
}

function Box({ title, children }: any) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="font-bold text-lg mb-3">{title}</h2>
      <div className="text-sm space-y-1">{children}</div>
    </div>
  );
}

function Section({ title, children }: any) {
  return (
    <section className="bg-white rounded-xl shadow p-6 mb-6">
      <h2 className="font-bold text-xl mb-4">{title}</h2>
      {children}
    </section>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label>
      <span className="block text-sm font-medium mb-1">{label}</span>
      <input
        value={value}
        type={type}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded px-3 py-2"
      />
    </label>
  );
}

function Table({ headers, rows }: any) {
  if (!rows.length) return <p className="text-sm text-slate-500">No data</p>;

  return (
    <table className="w-full text-sm">
      <thead className="bg-slate-100 text-left">
        <tr>
          {headers.map((h: string) => (
            <th key={h} className="p-3">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row: any[], i: number) => (
          <tr key={i} className="border-t">
            {row.map((cell, j) => (
              <td key={j} className="p-3">{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
