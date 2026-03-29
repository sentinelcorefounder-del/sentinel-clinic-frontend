import Link from "next/link";
import { fetchCurrentUserServer } from "@/lib/server-auth";
import LogoutButton from "@/components/LogoutButton";

export default async function CurrentUserBar() {
  const user = await fetchCurrentUserServer();

  if (!user) {
    return null;
  }

  return (
    <header className="w-full border-b border-gray-300 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-3">
            <img
            src="/sentinel-logo.png"
            alt="Sentinel logo"
            className="h-10 w-10 rounded object-contain"
            />
            <div>
              <p className="text-sm font-semibold text-gray-900 leading-tight">
                Sentinel Clinic
              </p>
              <p className="text-xs text-gray-700 leading-tight">
                Diabetic Eye Portal
              </p>
            </div>
          </Link>

          <nav className="flex items-center gap-5 text-sm font-medium text-gray-800">
            <Link href="/dashboard" className="hover:text-black hover:underline">
              Dashboard
            </Link>
            <Link href="/patients" className="hover:text-black hover:underline">
              Patients
            </Link>
            <Link href="/encounters" className="hover:text-black hover:underline">
              Encounters
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900">{user.username}</p>
            <p className="text-xs text-gray-700">
              {user.roles?.length ? user.roles.join(", ") : "No role assigned"}
            </p>
          </div>

          <LogoutButton />
        </div>
      </div>
    </header>
  );
}