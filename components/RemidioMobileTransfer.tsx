"use client";

import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  createMobileTransfer,
  fetchMobileTransfer,
  reviewMobileTransferImage,
} from "@/lib/api";

type PendingImage = {
  id: number;
  original_filename: string;
  image_url: string;
  status: "pending" | "confirmed" | "rejected";
};

type Props = {
  encounterId: number;
  onConfirmed?: () => Promise<void> | void;
};

export default function RemidioMobileTransfer({ encounterId, onConfirmed }: Props) {
  const [session, setSession] = useState<any>(null);
  const [images, setImages] = useState<PendingImage[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [reviews, setReviews] = useState<Record<number, { eye: string; quality: string }>>({});

  const uploadUrl = useMemo(() => {
    if (!session?.token || typeof window === "undefined") return "";
    return `${window.location.origin}/mobile-transfer/${session.token}`;
  }, [session]);

  useEffect(() => {
    if (!session?.session_id) return;
    const refresh = async () => {
      try {
        const data = await fetchMobileTransfer(session.session_id);
        setImages(data.images || []);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Could not refresh transfer.");
      }
    };
    refresh();
    const timer = window.setInterval(refresh, 3000);
    return () => window.clearInterval(timer);
  }, [session?.session_id]);

  async function startTransfer() {
    setBusy(true);
    setMessage("");
    try {
      const data = await createMobileTransfer(encounterId);
      setSession(data);
      setImages([]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not start transfer.");
    } finally {
      setBusy(false);
    }
  }

  async function review(image: PendingImage, action: "confirm" | "reject") {
    const choice = reviews[image.id] || { eye: "left", quality: "good" };
    setBusy(true);
    setMessage("");
    try {
      await reviewMobileTransferImage(session.session_id, image.id, {
        action,
        eye_laterality: choice.eye,
        image_quality: choice.quality,
        gradable: choice.quality !== "ungradable",
        retake_required: choice.quality === "poor" || choice.quality === "ungradable",
      });
      const data = await fetchMobileTransfer(session.session_id);
      setImages(data.images || []);
      if (action === "confirm" && onConfirmed) await onConfirmed();
      setMessage(action === "confirm" ? "Image attached to the encounter." : "Image rejected.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Review failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
      <div>
        <h2 className="text-xl font-semibold">Import from Remidio iPhone</h2>
        <p className="mt-1 text-sm text-slate-700">
          Start a secure 10-minute transfer, scan the QR code on the iPhone, then review each image before attaching it.
        </p>
      </div>
      {!session ? (
        <button type="button" onClick={startTransfer} disabled={busy} className="rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white disabled:opacity-50">
          {busy ? "Starting..." : "Start camera transfer"}
        </button>
      ) : (
        <>
          <div className="flex flex-col gap-4 rounded bg-white p-4 md:flex-row md:items-center">
            {uploadUrl ? <QRCodeSVG value={uploadUrl} size={180} level="M" /> : null}
            <div className="text-sm text-slate-700">
              <p><strong>Patient:</strong> {session.patient_display}</p>
              <p><strong>Date of birth:</strong> {session.patient_date_of_birth}</p>
              <p><strong>Encounter:</strong> {session.encounter_id}</p>
              <p className="mt-2">Scan this code with the Remidio iPhone camera. The QR code contains only a secure one-time token.</p>
              <button type="button" onClick={startTransfer} disabled={busy} className="mt-3 rounded border px-3 py-2">Generate a new code</button>
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="font-semibold">Pending review ({images.filter((item) => item.status === "pending").length})</h3>
            {!images.length ? <p className="text-sm text-slate-600">Waiting for images from the iPhone…</p> : null}
            {images.map((image) => {
              const choice = reviews[image.id] || { eye: "left", quality: "good" };
              return (
                <div key={image.id} className="rounded border bg-white p-3">
                  <img src={image.image_url} alt="Pending retinal image" className="mb-3 max-h-72 w-full rounded object-contain" />
                  <p className="mb-2 text-sm">{image.original_filename} · {image.status}</p>
                  {image.status === "pending" ? (
                    <div className="flex flex-wrap gap-2">
                      <select value={choice.eye} onChange={(e) => setReviews({ ...reviews, [image.id]: { ...choice, eye: e.target.value } })} className="rounded border p-2">
                        <option value="left">Left eye</option><option value="right">Right eye</option>
                      </select>
                      <select value={choice.quality} onChange={(e) => setReviews({ ...reviews, [image.id]: { ...choice, quality: e.target.value } })} className="rounded border p-2">
                        <option value="good">Good</option><option value="acceptable">Acceptable</option><option value="poor">Poor</option><option value="ungradable">Ungradable</option>
                      </select>
                      <button type="button" disabled={busy} onClick={() => review(image, "confirm")} className="rounded bg-emerald-700 px-3 py-2 text-white">Confirm and attach</button>
                      <button type="button" disabled={busy} onClick={() => review(image, "reject")} className="rounded border border-red-300 px-3 py-2 text-red-700">Reject</button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </>
      )}
      {message ? <p className="rounded bg-white p-3 text-sm">{message}</p> : null}
    </section>
  );
}
