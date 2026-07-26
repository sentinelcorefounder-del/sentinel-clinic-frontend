"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createConsent } from "@/lib/api";
import { getMe, hasAnyRole, type CurrentUser } from "@/lib/auth";

type Props = { encounterId: number; patientId: number; onConsentSaved?: () => void | Promise<void> };
type ConsentStatus = "granted" | "declined" | "withdrawn" | "expired" | "";
const ALLOWED_CONSENT_ROLES = ["clinic_screener", "clinic_admin", "super_admin"];

export default function ConsentForm({ encounterId, patientId, onConsentSaved }: Props) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [consentDate, setConsentDate] = useState("");
  const [capturedBy, setCapturedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [careDelivery, setCareDelivery] = useState<ConsentStatus>("granted");
  const [dataSharing, setDataSharing] = useState<ConsentStatus>("");
  const [aiClinicalReview, setAiClinicalReview] = useState<ConsentStatus>("");
  const [aiTraining, setAiTraining] = useState<ConsentStatus>("");
  const [researchUse, setResearchUse] = useState<ConsentStatus>("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    getMe().then(setCurrentUser).catch(() => setCurrentUser(null)).finally(() => setAuthLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setMessage("");
    if (!hasAnyRole(currentUser, ALLOWED_CONSENT_ROLES)) {
      setMessage("You do not have permission to record consents."); setLoading(false); return;
    }
    if (!consentDate) { setMessage("Consent date is required."); setLoading(false); return; }
    const entries = [
      { type: "care_delivery", status: careDelivery, code: "CD" },
      { type: "data_sharing", status: dataSharing, code: "DS" },
      { type: "ai_clinical_review", status: aiClinicalReview, code: "AC" },
      { type: "ai_training", status: aiTraining, code: "AI" },
      { type: "research_use", status: researchUse, code: "RU" },
    ].filter((item) => item.status !== "");
    if (!entries.length) { setMessage("Please select at least one consent status."); setLoading(false); return; }
    try {
      const now = Date.now();
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        await createConsent({
          consent_id: `CNS-${entry.code}-${String(now).slice(-6)}-${i + 1}`,
          patient: patientId, encounter: encounterId, consent_type: entry.type,
          consent_status: entry.status, consent_date: consentDate, captured_by: capturedBy,
          expiry_date: null, withdrawal_date: entry.status === "withdrawn" ? consentDate : null, notes,
        });
      }
      if (onConsentSaved) await onConsentSaved();
      setMessage("Consent records saved successfully.");
      setCareDelivery("granted"); setDataSharing(""); setAiClinicalReview("");
      setAiTraining(""); setResearchUse(""); setConsentDate(""); setCapturedBy(""); setNotes("");
      router.refresh();
    } catch {
      setMessage("Failed to save consent records.");
    } finally { setLoading(false); }
  }

  if (authLoading) return <div className="rounded-lg border p-4">Checking consent permissions...</div>;
  if (!hasAnyRole(currentUser, ALLOWED_CONSENT_ROLES)) {
    return <div className="rounded-lg border bg-gray-50 p-4">You do not have permission to record consent entries.</div>;
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border p-4">
      <h2 className="text-xl font-semibold">Record Consents</h2>
      <input type="date" value={consentDate} onChange={(e) => setConsentDate(e.target.value)} className="w-full rounded border p-3" required />
      <input value={capturedBy} onChange={(e) => setCapturedBy(e.target.value)} placeholder="Captured By" className="w-full rounded border p-3" />
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" className="w-full rounded border p-3" />
      <div className="grid gap-4 md:grid-cols-2">
        <ConsentSelect label="Care Delivery" value={careDelivery} onChange={setCareDelivery} />
        <ConsentSelect label="Data Sharing" value={dataSharing} onChange={setDataSharing} />
        <ConsentSelect label="AI Clinical Review" value={aiClinicalReview} onChange={setAiClinicalReview} />
        <ConsentSelect label="AI Training (optional)" value={aiTraining} onChange={setAiTraining} />
        <ConsentSelect label="Research Use (optional)" value={researchUse} onChange={setResearchUse} />
      </div>
      <p className="text-xs text-gray-600">AI Clinical Review allows one de-identified external AI review. AI Training is separate and optional; refusal does not affect care or eligibility for the clinical review.</p>
      {message && <p className="text-sm">{message}</p>}
      <button type="submit" disabled={loading} className="rounded-lg bg-black px-4 py-3 text-white">{loading ? "Saving..." : "Save Consents"}</button>
    </form>
  );
}

function ConsentSelect({ label, value, onChange }: { label: string; value: ConsentStatus; onChange: (value: ConsentStatus) => void }) {
  return <div className="space-y-2"><label className="block font-medium">{label}</label><select value={value} onChange={(e) => onChange(e.target.value as ConsentStatus)} className="w-full rounded border p-3"><option value="">Not recorded</option><option value="granted">Granted</option><option value="declined">Declined</option><option value="withdrawn">Withdrawn</option><option value="expired">Expired</option></select></div>;
}
