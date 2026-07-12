import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ThreeBackground from "@/components/ThreeBackground";
import Loading from "@/components/Loading";
import { SiteProvider } from "@/components/SiteProvider";
import SiteHeader from "@/components/SiteHeader";
import PageBackButton from "@/components/PageBackButton";
import SiteFooter from "@/components/SiteFooter";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "House of Spanking (HOS) | Server 1895",
  description: "Digital Headquarters for the House of Spanking Evony Alliance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground relative selection:bg-hos-red selection:text-white">
        {/* Global 3D Background */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <ThreeBackground />
        </div>

        {/* Main Content Layer */}
        <SiteProvider>
          <Loading />
          <SiteHeader />
          <PageBackButton />
          <main className="relative z-10 flex-1 flex flex-col">{children}</main>
          <SiteFooter />
        </SiteProvider>
      </body>
    </html>
  );
}
