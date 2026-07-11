import type { Metadata } from "next";
import { Inter, Orbitron } from "next/font/google";
import "./globals.css";
import LayoutClient from "@/components/layout/LayoutClient";
import AuthProvider from "@/components/providers/AuthProvider";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
});

export const metadata: Metadata = {
  title: "House of Spanking | Server 1895",
  description: "The official alliance website for House of Spanking (HOS) on Server 1895. The Strongest Family.",
  keywords: ["Evony", "Alliance", "HOS", "House of Spanking", "Server 1895"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${orbitron.variable} antialiased text-white bg-black`}>
        <AuthProvider>
          <LayoutClient>
            {children}
          </LayoutClient>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
