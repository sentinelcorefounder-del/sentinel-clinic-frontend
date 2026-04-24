"use client";

import { useEffect, useState } from "react";
import { createImageUpload } from "@/lib/api";
import { getMe, hasAnyRole, type CurrentUser } from "@/lib/auth";

type Props = {
  encounterId: number;
  patientId: number;
  onUploadSuccess?: () => Promise<void> | void;
};

const ALLOWED_UPLOAD_ROLES = ["clinic_screener", "clinic_admin", "super_admin"];

export default function ImageUploadForm({
  encounterId,
  patientId,
  onUploadSuccess,
}: Props) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [imageUploadId, setImageUploadId] = useState("");
  const [eyeLaterality, setEyeLaterality] = useState("left");
  const [imageType, setImageType] = useState("fundus");
  const [imageQuality, setImageQuality] = useState("good");
  const [gradable, setGradable] = useState(true);
  const [retakeRequired, setRetakeRequired] = useState(false);
  const [file, setFile] = useState<File | null>(null);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const allowed = hasAnyRole(currentUser, ALLOWED_UPLOAD_ROLES);
    if (!allowed) {
      setMessage("You do not have permission to upload images.");
      return;
    }

    if (!file) {
      setMessage("Please select an image file.");
      return;
    }

    setLoading(true);
    setMessage("Uploading image and running AI analysis...");

    try {
      const formData = new FormData();
      formData.append("image_upload_id", imageUploadId);
      formData.append("encounter", String(encounterId));
      formData.append("patient", String(patientId));
      formData.append("eye_laterality", eyeLaterality);
      formData.append("image_type", imageType);
      formData.append("image_quality", imageQuality);
      formData.append("gradable", String(gradable));
      formData.append("retake_required", String(retakeRequired));
      formData.append("image_file", file);

      await createImageUpload(formData);

      setMessage("Upload successful. AI suggestion is now available below.");
      setImageUploadId("");
      setFile(null);

      if (onUploadSuccess) {
        await onUploadSuccess();
      }
    } catch (error) {
      console.error(error);
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return (
      <div className="space-y-2 rounded-lg border p-4">
        <h2 className="text-xl font-semibold">Upload Retinal Image</h2>
        <p className="text-sm text-gray-600">Checking permissions...</p>
      </div>
    );
  }

  const allowed = hasAnyRole(currentUser, ALLOWED_UPLOAD_ROLES);

  if (!allowed) {
    return (
      <div className="space-y-2 rounded-lg border bg-gray-50 p-4">
        <h2 className="text-xl font-semibold">Upload Retinal Image</h2>
        <p className="text-sm text-gray-600">
          You do not have permission to upload retinal images.
        </p>
        <p className="text-xs text-gray-500">
          Allowed roles: clinic_screener, clinic_admin, super_admin
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border p-4">
      <h2 className="text-xl font-semibold">Upload Retinal Image</h2>

      <input
        value={imageUploadId}
        onChange={(e) => setImageUploadId(e.target.value)}
        placeholder="Image Upload ID"
        className="w-full rounded border p-3"
        required
      />

      <select
        value={eyeLaterality}
        onChange={(e) => setEyeLaterality(e.target.value)}
        className="w-full rounded border p-3"
      >
        <option value="left">Left</option>
        <option value="right">Right</option>
      </select>

      <select
        value={imageType}
        onChange={(e) => setImageType(e.target.value)}
        className="w-full rounded border p-3"
      >
        <option value="fundus">Fundus</option>
        <option value="oct">OCT</option>
        <option value="other">Other</option>
      </select>

      <select
        value={imageQuality}
        onChange={(e) => setImageQuality(e.target.value)}
        className="w-full rounded border p-3"
      >
        <option value="good">Good</option>
        <option value="acceptable">Acceptable</option>
        <option value="poor">Poor</option>
        <option value="ungradable">Ungradable</option>
      </select>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={gradable}
          onChange={(e) => setGradable(e.target.checked)}
        />
        Gradable
      </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={retakeRequired}
          onChange={(e) => setRetakeRequired(e.target.checked)}
        />
        Retake Required
      </label>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="w-full rounded border p-3"
        required
      />

      {message && <p className="text-sm text-gray-700">{message}</p>}

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-black px-4 py-3 text-white disabled:opacity-50"
      >
        {loading ? "Uploading & analyzing..." : "Upload Image"}
      </button>
    </form>
  );
}