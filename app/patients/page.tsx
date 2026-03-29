import PatientsTable from "@/components/PatientsTable";

export default function PatientsPage() {
  return (
    <main className="p-10">
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Patients</h1>
          <p className="text-sm text-gray-600 mt-1">
            Patient records are managed by Sentinel Ops. Clinics can view and work
            on assigned patients here.
          </p>
        </div>
      </div>

      <PatientsTable />
    </main>
  );
}