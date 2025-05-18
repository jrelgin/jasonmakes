import type { Metadata } from "next";
import { Geist_Mono, Instrument_Sans } from "next/font/google";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import Navigation from "../components/Navigation";

// Load Apoc Normal Bold font from local file
const apocFont = localFont({
  src: "../../public/fonts/ApocNormal-Bold.woff2",
  weight: "700",
  style: "normal",
  variable: "--font-apoc",
  display: "swap",
});

// Load Instrument Sans with specific styles
const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],  // Regular, Semi-bold, Bold
  style: ["normal", "italic"],    // Normal and Italic styles
  variable: "--font-instrument",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jason Makes | Design & Development",
  description: "Jason Elgin's portfolio featuring articles and case studies about design and development",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${apocFont.variable} ${instrumentSans.variable} ${geistMono.variable} antialiased`}
      >
        <Navigation />
        <main className="container mx-auto px-4">
          {children}
        </main>
        <Analytics />
      </body>
    </html>
  );
}
