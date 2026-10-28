import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/ui/Navbar";

export const metadata: Metadata = {
  title: {
    default: "ClinixAI — Chronic Disease Differential Diagnostic Platform",
    template: "%s | ClinixAI",
  },
  description:
    "Clinical AI differential diagnosis, symptom severity triage, and verified precautions across 41 chronic conditions.",
  keywords: [
    "disease prediction",
    "differential diagnosis",
    "symptom checker",
    "chronic disease",
    "clinical precautions",
    "healthcare AI",
  ],
  openGraph: {
    title: "ClinixAI",
    description: "Chronic Disease Differential Prediction Intelligence",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="w-full min-h-screen bg-[#FAFBFB] dark:bg-[#090D16] text-slate-900 dark:text-slate-100 antialiased overflow-x-hidden">
        <Navbar />
        <main className="w-full pt-16">{children}</main>
      </body>
    </html>
  );
}
