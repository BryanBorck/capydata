import type { Metadata } from "next";
import { Geist, Geist_Mono, DM_Mono, Rubik, Sora } from "next/font/google";
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

const sora = Sora({ subsets: ["latin"] });
const dmMono = DM_Mono({
  weight: ["400"],
  style: ["normal", "italic"],
  subsets: ["latin"],
});
const rubik = Rubik({
  subsets: ["latin"],
  variable: "--font-rubik",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`light ${rubik.variable}`}>
      <body
        className={`${sora.className} ${dmMono.className} bg-white text-gray-900 antialiased`}
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
