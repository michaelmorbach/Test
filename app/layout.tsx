import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RVI Vertriebspartner-Portal",
  description: "Vermittler-Plattform für RVI Wohnimmobilien",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className="h-full">
      <body className={`${geist.className} antialiased h-full`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
