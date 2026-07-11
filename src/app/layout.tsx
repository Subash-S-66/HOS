import type { Metadata } from "next";
import { Cinzel, Rajdhani, Inter } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  weight: ["400", "700", "900"],
});

const rajdhani = Rajdhani({
  subsets: ["latin"],
  variable: "--font-rajdhani",
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "HOUSE OF SPANKING - Server 1895",
  description: "Alliance Headquarters",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cinzel.variable} ${rajdhani.variable} ${inter.variable} antialiased scroll-smooth`}>
      <body className="bg-void-black text-ash-grey font-inter selection:bg-blood-crimson/50 selection:text-white overflow-x-hidden relative cursor-none sm:cursor-auto min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
