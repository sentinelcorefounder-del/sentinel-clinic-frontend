export default function FinanceNotice({ children, tone = "info" }: { children: React.ReactNode; tone?: "info" | "warning" }) {
  const style = tone === "warning" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-blue-200 bg-blue-50 text-blue-900";
  return <div className={`rounded-xl border p-4 text-sm ${style}`}>{children}</div>;
}
