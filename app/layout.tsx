import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import CurrentUserBar from "@/components/CurrentUserBar";
import AuthGate from "@/components/AuthGate";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sentinel Portal",
  description: "Sentinel diabetic eye screening portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-100 text-slate-950">
        <AuthGate>
          <CurrentUserBar />
          <div className="flex-1">{children}</div>
        </AuthGate>
      </body>
    </html>
  );
}