const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type UserOrganization = {
  id: number;
  name: string;
  clinic_id: string;
  organization_type: "clinic" | "hospital" | "sentinel" | "service_partner";
  contact_email: string;
  is_active: boolean;
};

export type CurrentUser = {
  id: number;
  username: string;
  email: string;
  is_staff: boolean;
  is_superuser: boolean;
  is_internal_sentinel_staff: boolean;
  must_change_password: boolean;
  roles: string[];
  organization: UserOrganization | null;
};

export async function ensureCsrf() {
  const res = await fetch(`${API_BASE}/api/auth/csrf/`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Failed to initialize CSRF");
  }

  const data = await res.json().catch(() => ({}));

  return {
    csrfToken: data.csrfToken || getCookie("csrftoken") || "",
  };
}

export function getCookie(name: string) {
  if (typeof document === "undefined") return null;

  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

export async function login(username: string, password: string) {
  const { csrfToken } = await ensureCsrf();

  const res = await fetch(`${API_BASE}/api/auth/login/`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrfToken,
    },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || data.error || "Login failed");

  return data as CurrentUser;
}

export async function getMe() {
  const res = await fetch(`${API_BASE}/api/auth/me/`, {
    method: "GET",
    credentials: "include",
  });

  if (res.status === 401 || res.status === 403) {
    return null;
  }

  if (!res.ok) {
    throw new Error("Failed to load current user");
  }

  return (await res.json()) as CurrentUser;
}

export async function logout() {
  const { csrfToken } = await ensureCsrf();

  const res = await fetch(`${API_BASE}/api/auth/logout/`, {
    method: "POST",
    credentials: "include",
    headers: {
      "X-CSRFToken": csrfToken,
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || data.error || "Logout failed");

  return data;
}

export function hasAnyRole(
  user: CurrentUser | null,
  allowedRoles: string[]
) {
  if (!user) return false;

  if (user.is_superuser) return true;

  return user.roles?.some((role) => allowedRoles.includes(role)) ?? false;
}

export function isHospitalUser(user: CurrentUser | null) {
  if (!user) return false;
  if (user.is_superuser) return false;
  return (
    user.organization?.organization_type === "hospital" ||
    hasAnyRole(user, ["hospital_admin"])
  );
}

export function isClinicUser(user: CurrentUser | null) {
  if (!user) return false;
  if (user.is_superuser) return true;
  return user.organization?.organization_type === "clinic";
}
