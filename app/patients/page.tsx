import PatientsTable from "@/components/PatientsTable";

export default function PatientsPage() {
  return (
    <main className="min-h-screen bg-slate-100 p-10">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Patients</h1>
          <p className="mt-1 text-sm text-slate-700">
            Patient records are managed by Sentinel Ops. Clinics can view and work
            on assigned patients here.
          </p>
        </div>
      </div>

      <PatientsTable />
    </main>
  );
}