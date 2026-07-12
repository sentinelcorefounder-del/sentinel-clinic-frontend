import { redirect } from "next/navigation";

export default async function LegacyEncounterCreationPage({
  searchParams,
}: {
  searchParams: Promise<{ patientId?: string }>;
}) {
  const { patientId } = await searchParams;

  const destination = patientId
    ? `/retinal-assessments/new?patientId=${encodeURIComponent(patientId)}`
    : "/retinal-assessments/new";

  redirect(destination);
}