import type { Metadata } from "next";
import { Geist, Geist_Mono, DM_Mono, Rubik, Sora, Alex_Brush } from "next/font/google";
import "@/assets/css/globals.css";
import { AppProviders } from "@/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Datagotchi",
  description: "Datagotchi",
};

const dmMono = DM_Mono({
  weight: ["400"],
  style: ["normal", "italic"],
  subsets: ["latin"],
});

const alexBrush = Alex_Brush({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-alex-brush",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`light ${geistSans.variable} ${geistMono.variable} ${alexBrush.variable}`}>
      <body
        className={`bg-white text-gray-900 antialiased w-full min-h-screen overflow-x-hidden`}
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
