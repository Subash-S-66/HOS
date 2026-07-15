import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ThreeBackground from "@/components/ThreeBackground";
import Loading from "@/components/Loading";
import { SiteProvider } from "@/components/SiteProvider";
import SiteHeader from "@/components/SiteHeader";
import PageBackButton from "@/components/PageBackButton";
import SiteFooter from "@/components/SiteFooter";
import GlobalNotifications from "@/components/GlobalNotifications";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.evonyhos1895.me";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: "HOS | House of Spanking — Evony Server 1895",
    template: "%s | HOS Evony Server 1895",
  },

  description:
    "Official headquarters of House of Spanking (HOS) — the premier alliance on Evony: The King's Return, Server 1895. Join our community, track alliance events, browse the gallery, and stay connected with the strongest alliance on Server 1895.",

  keywords: [
    // Primary brand terms
    "HOS",
    "House of Spanking",
    "House of Spanking Evony",
    // Server-specific
    "Evony Server 1895",
    "Server 1895 HOS",
    "Server 1895 Evony",
    "evony server 1895 alliance",
    "Evony alliance 1895",
    "1895 Evony",
    // Game context
    "Evony The King's Return alliance",
    "Evony HOS alliance",
    "HOS alliance Evony",
    "HOS Evony",
    // Action terms people search for
    "join Evony Server 1895",
    "best alliance Evony 1895",
    "Evony 1895 events",
    "evony 1895 battlefield",
    "evony 1895 SVS",
    "evony alliance headquarters",
  ],

  authors: [{ name: "HOS Leadership", url: SITE_URL }],
  creator: "House of Spanking (HOS)",
  publisher: "House of Spanking (HOS)",
  category: "Gaming",

  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "HOS — Evony Server 1895",
    title: "House of Spanking (HOS) | Official Evony Server 1895 Alliance HQ",
    description:
      "Official HQ of House of Spanking (HOS) — the dominant alliance on Evony Server 1895. Track events, join the alliance, browse our gallery, and connect with our community.",
    images: [
      {
        url: `${SITE_URL}/brand/og-banner.png`,
        width: 1200,
        height: 630,
        alt: "House of Spanking (HOS) — Official Alliance Headquarters on Evony Server 1895",
      },
      {
        url: `${SITE_URL}/brand/hos-crest.png`,
        width: 512,
        height: 512,
        alt: "HOS Alliance Crest — House of Spanking Evony Server 1895",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "HOS | House of Spanking — Evony Server 1895",
    description:
      "Official HQ of House of Spanking — the dominant Evony alliance on Server 1895. Events, gallery, tools & community.",
    images: [`${SITE_URL}/brand/og-banner.png`],
  },

  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  alternates: {
    canonical: SITE_URL,
  },

  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/brand/hos-crest.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/brand/hos-crest.png", sizes: "512x512", type: "image/png" }],
    shortcut: "/favicon.ico",
  },

  verification: {
    // Add your Google Search Console verification token here once you set it up:
    // google: "YOUR_GOOGLE_VERIFICATION_TOKEN",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // JSON-LD: WebSite schema — enables Google Sitelinks Search Box
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "House of Spanking (HOS) — Evony Server 1895",
    alternateName: ["HOS", "HOS Evony 1895", "evonyhos1895"],
    url: SITE_URL,
    description:
      "Official headquarters of House of Spanking (HOS), the premier alliance on Evony Server 1895.",
    publisher: {
      "@type": "Organization",
      name: "House of Spanking (HOS)",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/brand/hos-crest.png`,
        width: 512,
        height: 512,
      },
    },
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/events?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <head>
        {/* JSON-LD: WebSite schema for Google Sitelinks */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        {/* Preconnect to external resources for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://res.cloudinary.com" />
        {/* Theme color for mobile browsers */}
        <meta name="theme-color" content="#dc2626" />
        <meta name="color-scheme" content="dark" />
        {/* Geo tags to help local/game server discovery */}
        <meta name="application-name" content="HOS — Evony Server 1895" />
      </head>
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
          <GlobalNotifications />
        </SiteProvider>
      </body>
    </html>
  );
}
