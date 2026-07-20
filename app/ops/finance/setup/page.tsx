import { Suspense } from "react";
import FinanceSetupWizard from "@/components/FinanceSetupWizard";
export default function FinanceSetupPage(){return <Suspense fallback={<p>Loading setup wizard…</p>}><FinanceSetupWizard/></Suspense>}
