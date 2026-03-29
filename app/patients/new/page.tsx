export default function NewPatientPage() {
  return (
    <main className="p-10 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Patient Creation Disabled</h1>

      <div className="rounded-lg border bg-white p-6 space-y-3">
        <p className="text-gray-700">
          Patient creation is handled by Sentinel Ops and the Baserow operations layer.
        </p>
        <p className="text-gray-600">
          Clinics should work only with patients already referred or assigned into the
          clinical portal.
        </p>
      </div>
    </main>
  );
}