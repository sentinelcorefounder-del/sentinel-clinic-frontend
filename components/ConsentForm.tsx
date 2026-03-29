"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createConsent } from "@/lib/api";
import { getMe, hasAnyRole, type CurrentUser } from "@/lib/auth";

type Props = {
  encounterId: number;
  patientId: number;
};

type ConsentStatus = "granted" | "declined" | "withdrawn" | "expired" | "";

const ALLOWED_CONSENT_ROLES = ["clinic_screener", "clinic_admin", "super_admin"];

export default function ConsentForm({ encounterId, patientId }: Props) {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [consentDate, setConsentDate] = useState("");
  const [capturedBy, setCapturedBy] = useState("");
  const [notes, setNotes] = useState("");

  const [careDelivery, setCareDelivery] = useState<ConsentStatus>("granted");
  const [dataSharing, setDataSharing] = useState<ConsentStatus>("");
  const [aiTraining, setAiTraining] = useState<ConsentStatus>("");
  const [researchUse, setResearchUse] = useState<ConsentStatus>("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadUser() {
      try {
        const me = await getMe();
        setCurrentUser(me);
      } catch {
        setCurrentUser(null);
      } finally {
        setAuthLoading(false);
      }
    }

    loadUser();
  }, []);

  function buildConsentPayload(
    consentId: string,
    consentType: string,
    consentStatus: ConsentStatus
  ) {
    return {
      consent_id: consentId,
      patient: patientId,
      encounter: encounterId,
      consent_type: consentType,
      consent_status: consentStatus,
      consent_date: consentDate,
      captured_by: capturedBy,
      expiry_date: null,
      withdrawal_date: consentStatus === "withdrawn" ? consentDate : null,
      notes,
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const allowed = hasAnyRole(currentUser, ALLOWED_CONSENT_ROLES);
    if (!allowed) {
      setMessage("You do not have permission to record consents.");
      setLoading(false);
      return;
    }

    try {
      if (!consentDate) {
        setMessage("Consent date is required.");
        setLoading(false);
        return;
      }

      const consentEntries = [
        { type: "care_delivery", status: careDelivery },
        { type: "data_sharing", status: dataSharing },
        { type: "ai_training", status: aiTraining },
        { type: "research_use", status: researchUse },
      ].filter((item) => item.status !== "");

      if (consentEntries.length === 0) {
        setMessage("Please select at least one consent status.");
        setLoading(false);
        return;
      }

      const now = Date.now();

      const consentTypeCodeMap: Record<string, string> = {
        care_delivery: "CD",
        data_sharing: "DS",
        ai_training: "AI",
        research_use: "RU",
      };

      for (let i = 0; i < consentEntries.length; i++) {
        const entry = consentEntries[i];
        const shortCode = consentTypeCodeMap[entry.type] || "OT";
        const consentId = `CNS-${shortCode}-${String(now).slice(-6)}-${i + 1}`;

        await createConsent(
          buildConsentPayload(consentId, entry.type, entry.status)
        );
      }

      setMessage("Consent records saved successfully.");

      setCareDelivery("granted");
      setDataSharing("");
      setAiTraining("");
      setResearchUse("");
      setConsentDate("");
      setCapturedBy("");
      setNotes("");

      router.refresh();
    } catch (error) {
      console.error(error);
      setMessage("Failed to save consent records. Check browser console.");
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return (
      <div className="space-y-2 border rounded-lg p-4">
        <h2 className="text-xl font-semibold">Record Consents</h2>
        <p className="text-sm text-gray-600">Checking permissions...</p>
      </div>
    );
  }

  const allowed = hasAnyRole(currentUser, ALLOWED_CONSENT_ROLES);

  if (!allowed) {
    return (
      <div className="space-y-2 border rounded-lg p-4 bg-gray-50">
        <h2 className="text-xl font-semibold">Record Consents</h2>
        <p className="text-sm text-gray-600">
          You do not have permission to record consent entries.
        </p>
        <p className="text-xs text-gray-500">
          Allowed roles: clinic_screener, clinic_admin, super_admin
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border rounded-lg p-4">
      <h2 className="text-xl font-semibold">Record Consents</h2>

      <input
        type="date"
        value={consentDate}
        onChange={(e) => setConsentDate(e.target.value)}
        className="w-full border rounded p-3"
        required
      />

      <input
        value={capturedBy}
        onChange={(e) => setCapturedBy(e.target.value)}
        placeholder="Captured By"
        className="w-full border rounded p-3"
      />

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes"
        className="w-full border rounded p-3"
      />

      <div className="grid gap-4 md:grid-cols-2">
        <ConsentSelect
          label="Care Delivery"
          value={careDelivery}
          onChange={setCareDelivery}
        />
        <ConsentSelect
          label="Data Sharing"
          value={dataSharing}
          onChange={setDataSharing}
        />
        <ConsentSelect
          label="AI Training"
          value={aiTraining}
          onChange={setAiTraining}
        />
        <ConsentSelect
          label="Research Use"
          value={researchUse}
          onChange={setResearchUse}
        />
      </div>

      {message && <p className="text-sm">{message}</p>}

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-black text-white px-4 py-3"
      >
        {loading ? "Saving..." : "Save Consents"}
      </button>
    </form>
  );
}

function ConsentSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: ConsentStatus;
  onChange: (value: ConsentStatus) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="block font-medium">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as ConsentStatus)}
        className="w-full border rounded p-3"
      >
        <option value="">Not recorded</option>
        <option value="granted">Granted</option>
        <option value="declined">Declined</option>
        <option value="withdrawn">Withdrawn</option>
        <option value="expired">Expired</option>
      </select>
    </div>
  );
}