"use client";

import { useEffect, useState } from "react";
import { getMe } from "@/lib/auth";

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
};

const emptyOpsUser = {
  username: "",
  email: "",
  first_name: "",
  last_name: "",
  temporary_password: "",
};

export default function OpsAdminPage() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [hospital, setHospital] = useState({ ...emptyOrg });
  const [clinic, setClinic] = useState({ ...emptyOrg });
  const [opsUser, setOpsUser] = useState({ ...emptyOpsUser });

  useEffect(() => {
    async function loadUser() {
      try {
        const me = await getMe();
        setCurrentUser(me);
      } catch {
        setCurrentUser(null);
      }
    }

    loadUser();
  }, []);

  async function createHospital() {
    try {
      setLoading("hospital");
      setMessage("");

      const data = await postJson("/api/ops/organizations/create/", {
        ...hospital,
        organization_type: "hospital",
      });

      setMessage(data.message || "Hospital created.");
      setHospital({ ...emptyOrg });
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading("");
    }
  }

  async function createClinic() {
    try {
      setLoading("clinic");
      setMessage("");

      const data = await postJson("/api/ops/organizations/create/", {
        ...clinic,
        organization_type: "clinic",
      });

      setMessage(data.message || "Clinic created.");
      setClinic({ ...emptyOrg });
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading("");
    }
  }

  async function createOpsUser() {
    try {
      setLoading("ops-user");
      setMessage("");

      const data = await postJson("/api/ops/users/create/", opsUser);

      setMessage(data.message || "Ops user created.");
      setOpsUser({ ...emptyOpsUser });
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading("");
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Ops Admin</h1>

      {message && (
        <div className="mb-6 bg-slate-100 border rounded p-4 text-sm">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <OrgForm
          title="Create Hospital"
          codeLabel="Hospital Code"
          codePlaceholder="HSP-002"
          data={hospital}
          setData={setHospital}
          loading={loading === "hospital"}
          buttonLabel="Create Hospital + Send Onboarding Email"
          onSubmit={createHospital}
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

        {currentUser?.is_superuser ? (
          <section className="bg-white rounded-xl shadow p-6">
            <h2 className="font-bold text-lg mb-4">Create Ops User</h2>

            <Input
              label="Username"
              placeholder="ops_admin_001"
              value={opsUser.username}
              onChange={(v) => setOpsUser({ ...opsUser, username: v })}
            />

            <Input
              label="Email"
              placeholder="ops@example.com"
              value={opsUser.email}
              onChange={(v) => setOpsUser({ ...opsUser, email: v })}
            />

            <Input
              label="First Name"
              placeholder="First name"
              value={opsUser.first_name}
              onChange={(v) => setOpsUser({ ...opsUser, first_name: v })}
            />

            <Input
              label="Last Name"
              placeholder="Last name"
              value={opsUser.last_name}
              onChange={(v) => setOpsUser({ ...opsUser, last_name: v })}
            />

            <Input
              label="Temporary Password"
              placeholder="Temp12345!"
              type="password"
              value={opsUser.temporary_password}
              onChange={(v) =>
                setOpsUser({ ...opsUser, temporary_password: v })
              }
            />

            <button
              onClick={createOpsUser}
              disabled={
                loading !== "" ||
                !opsUser.username ||
                !opsUser.email
              }
              className="w-full bg-purple-600 text-white rounded px-4 py-2 disabled:opacity-50"
            >
              {loading === "ops-user" ? "Creating..." : "Create Ops User"}
            </button>

            <p className="text-xs text-slate-500 mt-3">
              Only super admin can create Ops users.
            </p>
          </section>
        ) : (
          <section className="bg-white rounded-xl shadow p-6">
            <h2 className="font-bold text-lg mb-3">Ops User Management</h2>
            <p className="text-sm text-slate-600">
              Only super admin can create new Ops users.
            </p>
          </section>
        )}
      </div>
    </div>
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
}: {
  title: string;
  codeLabel: string;
  codePlaceholder: string;
  data: typeof emptyOrg;
  setData: (data: typeof emptyOrg) => void;
  loading: boolean;
  buttonLabel: string;
  onSubmit: () => void;
}) {
  return (
    <section className="bg-white rounded-xl shadow p-6">
      <h2 className="font-bold text-lg mb-4">{title}</h2>

      <Input
        label={codeLabel}
        placeholder={codePlaceholder}
        value={data.org_code}
        onChange={(v) => setData({ ...data, org_code: v })}
      />

      <Input
        label="Organisation Name"
        placeholder="Name"
        value={data.name}
        onChange={(v) => setData({ ...data, name: v })}
      />

      <Input
        label="Contact Email"
        placeholder="contact@example.com"
        value={data.contact_email}
        onChange={(v) => setData({ ...data, contact_email: v })}
      />

      <Input
        label="Phone"
        placeholder="+234..."
        value={data.phone}
        onChange={(v) => setData({ ...data, phone: v })}
      />

      <Textarea
        label="Address"
        placeholder="Address"
        value={data.address}
        onChange={(v) => setData({ ...data, address: v })}
      />

      <hr className="my-5" />

      <h3 className="font-semibold mb-3">Admin Account</h3>

      <Input
        label="Admin Username"
        placeholder="clinic_002_admin"
        value={data.admin_username}
        onChange={(v) => setData({ ...data, admin_username: v })}
      />

      <Input
        label="Admin Email"
        placeholder="admin@example.com"
        value={data.admin_email}
        onChange={(v) => setData({ ...data, admin_email: v })}
      />

      <Input
        label="Admin First Name"
        placeholder="First name"
        value={data.admin_first_name}
        onChange={(v) => setData({ ...data, admin_first_name: v })}
      />

      <Input
        label="Admin Last Name"
        placeholder="Last name"
        value={data.admin_last_name}
        onChange={(v) => setData({ ...data, admin_last_name: v })}
      />

      <Input
        label="Temporary Password"
        placeholder="Optional if using activation email"
        type="password"
        value={data.temporary_password}
        onChange={(v) => setData({ ...data, temporary_password: v })}
      />

      <button
        onClick={onSubmit}
        disabled={
          loading ||
          !data.org_code ||
          !data.name ||
          !data.admin_username ||
          !data.admin_email
        }
        className="w-full bg-slate-900 text-white rounded px-4 py-2 disabled:opacity-50"
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
    <label className="block mb-3">
      <span className="block text-sm font-medium mb-1">{label}</span>
      <input
        value={value}
        type={type}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded px-3 py-2"
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
    <label className="block mb-4">
      <span className="block text-sm font-medium mb-1">{label}</span>
      <textarea
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded px-3 py-2 min-h-20"
      />
    </label>
  );
}