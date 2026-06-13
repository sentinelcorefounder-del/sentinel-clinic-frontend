"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  return parts.length === 2 ? parts.pop()?.split(";").shift() || "" : "";
}

async function postJson(path: string, body: any) {
  await fetch(`${API_URL}/api/auth/csrf/`, {
    credentials: "include",
  });

  const csrf = getCookie("csrftoken");

  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrf,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.detail || data?.error || "Request failed.");
  }

  return data;
}

const emptyOrg = {
  org_code: "",
  name: "",
  contact_email: "",
  phone: "",
  address: "",
  admin_username: "",
  admin_email: "",
  admin_first_name: "",
  admin_last_name: "",
  temporary_password: "",
  screening_fee_amount: "15000",
  hospital_commission_amount: "0",
  currency: "NGN",
};

const emptyOpsUser = {
  username: "",
  email: "",
  first_name: "",
  last_name: "",
  temporary_password: "",
};

export default function OpsAdminPage() {
  const [hospital, setHospital] = useState(emptyOrg);
  const [clinic, setClinic] = useState(emptyOrg);
  const [opsUser, setOpsUser] = useState(emptyOpsUser);

  const [loading, setLoading] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");

  function showSuccess(message: string) {
    setMessageType("success");
    setMessage(message);
  }

  function showError(error: unknown) {
    setMessageType("error");
    setMessage(error instanceof Error ? error.message : "Something went wrong.");
  }

  async function createHospital() {
    try {
      setLoading("hospital");
      setMessage("");

      await postJson("/api/ops/organizations/create/", {
        organization_type: "hospital",
        ...hospital,
        currency: hospital.currency.toUpperCase(),
      });

      showSuccess("Hospital created successfully and onboarding email sent.");
      setHospital(emptyOrg);
    } catch (err) {
      showError(err);
    } finally {
      setLoading("");
    }
  }

  async function createClinic() {
    try {
      setLoading("clinic");
      setMessage("");

      await postJson("/api/ops/organizations/create/", {
        organization_type: "clinic",
        ...clinic,
      });

      showSuccess("Clinic created successfully and onboarding email sent.");
      setClinic(emptyOrg);
    } catch (err) {
      showError(err);
    } finally {
      setLoading("");
    }
  }

  async function createOpsUser() {
    try {
      setLoading("ops-user");
      setMessage("");

      await postJson("/api/ops/users/create/", opsUser);

      showSuccess("Ops user created successfully and activation email sent.");
      setOpsUser(emptyOpsUser);
    } catch (err) {
      showError(err);
    } finally {
      setLoading("");
    }
  }

  return (
    <main className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold">Ops Admin</h1>
        <p className="mt-1 text-sm text-slate-600">
          Create hospitals, clinics, and Sentinel Ops users.
        </p>
      </div>

      {message ? (
        <div
          className={`rounded-lg border p-3 text-sm font-medium ${
            messageType === "error"
              ? "border-red-200 bg-red-50 text-red-800"
              : messageType === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-slate-200 bg-slate-50 text-slate-700"
          }`}
        >
          {message}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <OrgForm
          title="Create Hospital"
          codeLabel="Hospital Code"
          codePlaceholder="HSP-002"
          data={hospital}
          setData={setHospital}
          loading={loading === "hospital"}
          buttonLabel="Create Hospital + Send Onboarding Email"
          onSubmit={createHospital}
          showPricingFields
        />

        <OrgForm
          title="Create Clinic"
          codeLabel="Clinic Code"
          codePlaceholder="CLN-002"
          data={clinic}
          setData={setClinic}
          loading={loading === "clinic"}
          buttonLabel="Create Clinic + Send Onboarding Email"
          onSubmit={createClinic}
        />
      </div>

      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Create Ops User</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Username"
            value={opsUser.username}
            onChange={(v) => setOpsUser({ ...opsUser, username: v })}
            placeholder="ops.admin"
          />

          <Input
            label="Email"
            value={opsUser.email}
            onChange={(v) => setOpsUser({ ...opsUser, email: v })}
            placeholder="ops@example.com"
          />

          <Input
            label="First Name"
            value={opsUser.first_name}
            onChange={(v) => setOpsUser({ ...opsUser, first_name: v })}
          />

          <Input
            label="Last Name"
            value={opsUser.last_name}
            onChange={(v) => setOpsUser({ ...opsUser, last_name: v })}
          />

          <Input
            label="Temporary Password"
            value={opsUser.temporary_password}
            onChange={(v) => setOpsUser({ ...opsUser, temporary_password: v })}
            type="password"
          />
        </div>

        <button
          type="button"
          onClick={createOpsUser}
          disabled={loading === "ops-user"}
          className="mt-4 rounded-lg bg-slate-950 px-4 py-2 font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {loading === "ops-user" ? "Creating..." : "Create Ops User"}
        </button>
      </section>
    </main>
  );
}

function OrgForm({
  title,
  codeLabel,
  codePlaceholder,
  data,
  setData,
  loading,
  buttonLabel,
  onSubmit,
  showPricingFields = false,
}: {
  title: string;
  codeLabel: string;
  codePlaceholder: string;
  data: typeof emptyOrg;
  setData: (data: typeof emptyOrg) => void;
  loading: boolean;
  buttonLabel: string;
  onSubmit: () => void;
  showPricingFields?: boolean;
}) {
  return (
    <section className="rounded-xl border bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold">{title}</h2>

      <Input
        label={codeLabel}
        value={data.org_code}
        placeholder={codePlaceholder}
        onChange={(v) => setData({ ...data, org_code: v })}
      />

      <Input
        label="Name"
        value={data.name}
        onChange={(v) => setData({ ...data, name: v })}
      />

      <Input
        label="Contact Email"
        value={data.contact_email}
        onChange={(v) => setData({ ...data, contact_email: v })}
      />

      <Input
        label="Phone"
        value={data.phone}
        onChange={(v) => setData({ ...data, phone: v })}
      />

      <Textarea
        label="Address"
        value={data.address}
        onChange={(v) => setData({ ...data, address: v })}
      />

      {showPricingFields ? (
        <>
          <hr className="my-5" />

          <h3 className="mb-3 font-semibold">Hospital Payment Settings</h3>

          <Input
            label="Patient Screening Fee"
            placeholder="15000"
            type="number"
            value={data.screening_fee_amount}
            onChange={(v) => setData({ ...data, screening_fee_amount: v })}
          />

          <Input
            label="Hospital Commission"
            placeholder="0"
            type="number"
            value={data.hospital_commission_amount}
            onChange={(v) =>
              setData({ ...data, hospital_commission_amount: v })
            }
          />

          <Input
            label="Currency"
            placeholder="NGN"
            value={data.currency}
            onChange={(v) => setData({ ...data, currency: v.toUpperCase() })}
          />

          <p className="mb-3 rounded-lg bg-blue-50 p-3 text-xs text-blue-900">
            This fee will be used by default when Ops creates a payment for referrals from this hospital.
            Ops can still override the amount manually if needed.
          </p>
        </>
      ) : null}

      <hr className="my-5" />

      <h3 className="mb-3 font-semibold">Admin Account</h3>

      <Input
        label="Admin Username"
        value={data.admin_username}
        onChange={(v) => setData({ ...data, admin_username: v })}
      />

      <Input
        label="Admin Email"
        value={data.admin_email}
        onChange={(v) => setData({ ...data, admin_email: v })}
      />

      <Input
        label="Admin First Name"
        value={data.admin_first_name}
        onChange={(v) => setData({ ...data, admin_first_name: v })}
      />

      <Input
        label="Admin Last Name"
        value={data.admin_last_name}
        onChange={(v) => setData({ ...data, admin_last_name: v })}
      />

      <Input
        label="Temporary Password"
        type="password"
        value={data.temporary_password}
        onChange={(v) => setData({ ...data, temporary_password: v })}
      />

      <button
        type="button"
        onClick={onSubmit}
        disabled={loading}
        className="mt-2 rounded-lg bg-slate-950 px-4 py-2 font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {loading ? "Creating..." : buttonLabel}
      </button>
    </section>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <input
        value={value}
        type={type}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border px-3 py-2"
      />
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="mb-4 block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <textarea
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-20 w-full rounded border px-3 py-2"
      />
    </label>
  );
}
