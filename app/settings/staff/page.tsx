"use client";

import { useEffect, useState } from "react";
import { getMe, type CurrentUser } from "@/lib/auth";
import ClinicStaffManager from "@/components/ClinicStaffManager";

export default function ClinicStaffSettingsPage() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { getMe().then(setUser).finally(() => setLoading(false)); }, []);
  if (loading) return <main className="p-8">Loading staff permissions...</main>;
  const canManage = Boolean(user?.organization?.organization_type === "clinic" && user.roles?.some((role) => ["clinic_admin", "clinic_owner_optometrist"].includes(role)));
  if (!user?.organization || !canManage) return <main className="p-8"><div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">Clinic staff management is available only to an explicitly assigned clinic administrator/owner for their own clinic.</div></main>;
  return <main className="mx-auto max-w-6xl space-y-6 p-8"><div><h1 className="text-3xl font-bold">Clinic Staff & Permissions</h1><p className="mt-2 text-slate-600">Manage staff roles and branch access for {user.organization.name}.</p></div><ClinicStaffManager organizationId={user.organization.id} /></main>;
}
