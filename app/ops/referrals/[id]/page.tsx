import { serverFetch } from "@/lib/server-api";
import OpsReferralActions from "./OpsReferralActions";

export default async function OpsReferralDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const referral = await serverFetch(`/api/ops/referrals/${id}/`);
  const clinics = await serverFetch("/api/ops/clinics/");

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">{referral.referral_id}</h1>
      <p className="text-slate-500 mb-6">{referral.patient_name}</p>

      <OpsReferralActions referral={referral} clinics={clinics} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Box title="Patient">
          <p>Name: {referral.patient_name}</p>
          <p>DOB: {referral.dob || "-"}</p>
          <p>Sex: {referral.patient_sex || "-"}</p>
          <p>Phone: {referral.phone_number || "-"}</p>
          <p>Email: {referral.email || "-"}</p>
        </Box>

        <Box title="Referral">
          <p>Hospital: {referral.source_hospital_name || "-"}</p>
          <p>Clinic: {referral.matched_clinic_name || "-"}</p>
          <p>Status: {referral.referral_status || "-"}</p>
          <p>Payment: {referral.payment_status || "-"}</p>

          {referral.payment_link ? (
            <p>
              Payment Link:{" "}
              <a
                href={referral.payment_link}
                target="_blank"
                className="text-blue-600 underline"
              >
                Open Payment Link
              </a>
            </p>
          ) : null}
        </Box>

        <Box title="Reason for Referral">
          <p>{referral.reason_for_referral || "-"}</p>
        </Box>

        <Box title="Notes">
          <p className="whitespace-pre-wrap">{referral.notes || "-"}</p>
        </Box>
      </div>
    </div>
  );
}

function Box({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="font-bold text-lg mb-3">{title}</h2>
      <div className="space-y-1 text-sm">{children}</div>
    </div>
  );
}