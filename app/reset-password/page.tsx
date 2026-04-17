"use client";

import { Suspense } from "react";
import ResetPasswordContent from "./ResetPasswordContent";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}