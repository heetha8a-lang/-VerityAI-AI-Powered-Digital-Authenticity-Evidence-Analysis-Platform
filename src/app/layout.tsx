import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-jakarta",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-dm-sans",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VerityAI — Trust What You See. Verify What You Read.",
  description:
    "AI-Powered Digital Authenticity & Evidence Analysis Platform — Verify Information. Understand Evidence. Build Trust.",
  openGraph: {
    title: "VerityAI — Trust What You See. Verify What You Read.",
    description:
      "AI-Powered Digital Authenticity & Evidence Analysis Platform — Verify Information. Understand Evidence. Build Trust.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VerityAI — Trust What You See. Verify What You Read.",
    description:
      "AI-Powered Digital Authenticity & Evidence Analysis Platform — Verify Information. Understand Evidence. Build Trust.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${dmSans.variable} ${jetbrains.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen antialiased bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        {children}
        <Toaster position="bottom-right" richColors closeButton />
      </body>
    </html>
  );
}
