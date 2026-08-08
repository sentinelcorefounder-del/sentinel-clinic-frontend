"use client";

import { use, useEffect, useState } from "react";
import { fetchPublicMobileTransfer, uploadPublicMobileTransfer } from "@/lib/api";

export default function MobileTransferUploadPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [transfer, setTransfer] = useState<any>(null);
  const [files, setFiles] = useState<FileList | null>(null);
  const [message, setMessage] = useState("Checking secure transfer…");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchPublicMobileTransfer(token)
      .then((data) => { setTransfer(data); setMessage(""); })
      .catch((error) => setMessage(error instanceof Error ? error.message : "Transfer unavailable."));
  }, [token]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!files?.length) return setMessage("Select at least one Remidio image.");
    setBusy(true);
    setMessage("Uploading securely…");
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("images", file));
    try {
      const data = await uploadPublicMobileTransfer(token, formData);
      setMessage(`${data.images.length} image(s) transferred. Return to the Sentinel computer for review.`);
      setFiles(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Transfer failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-slate-50 p-5">
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold">Sentinel Remidio Transfer</h1>
        {transfer ? (
          <>
            <div className="my-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm">
              <p><strong>Confirm before selecting images</strong></p>
              <p>Patient: {transfer.patient_display}</p>
              <p>Date of birth: {transfer.patient_date_of_birth}</p>
              <p>Encounter: {transfer.encounter_id}</p>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <input type="file" accept="image/jpeg,image/png" multiple onChange={(event) => setFiles(event.target.files)} className="w-full rounded border p-3" />
              <p className="text-xs text-slate-600">JPG or PNG only, up to 15 MB each. Images remain pending until reviewed on the Sentinel computer.</p>
              <button disabled={busy} className="w-full rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white disabled:opacity-50">
                {busy ? "Transferring…" : "Transfer selected images"}
              </button>
            </form>
          </>
        ) : null}
        {message ? <p className="mt-4 rounded bg-slate-100 p-3 text-sm">{message}</p> : null}
      </div>
    </main>
  );
}
