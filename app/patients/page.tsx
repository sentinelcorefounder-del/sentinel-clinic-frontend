import PatientsTable from "@/components/PatientsTable";

export default function PatientsPage() {
  return (
    <main className="min-h-screen bg-slate-100 p-10">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Patients</h1>
          <p className="mt-1 text-sm text-slate-700">
            View hospital-referred and clinic-direct patients, including their
            diabetic, ocular or combined clinical pathways.
          </p>
        </div>
      </div>

      <PatientsTable />
    </main>
  );
}
