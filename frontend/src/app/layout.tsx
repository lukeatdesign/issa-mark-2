import type { Metadata } from "next";
import { Lora, DM_Sans } from "next/font/google";
import "./globals.css";

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Wayfarer — Thailand Work Immigration Assistant",
  description:
    "Your intelligent guide to working legally in Thailand — for workers, professionals, and digital nomads.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${lora.variable} ${dmSans.variable}`}>
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
