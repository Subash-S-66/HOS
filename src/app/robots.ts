import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.evonyhos1895.me";
  return {
    rules: [
      // Allow all well-behaved crawlers on public content
      {
        userAgent: "*",
        allow: [
          "/",
          "/events",
          "/gallery",
          "/tools",
          "/join",
          "/members",
          "/svs-history",
          "/leaderboard",
          "/war",
          "/chat",
          "/brand/",
        ],
        // Do NOT list /admin here — confirming it exists helps attackers.
        // /admin is fully auth-protected by JWT; security-by-auth, not by obscurity.
        // /api routes are server-side only and not meaningful to index.
        disallow: [
          "/api/",
          "/_next/",
          "/loading-preview",
        ],
      },
      // Block known bad bots explicitly
      { userAgent: "AhrefsBot", disallow: "/" },
      { userAgent: "SemrushBot", disallow: "/" },
      { userAgent: "MJ12bot", disallow: "/" },
      { userAgent: "DotBot", disallow: "/" },
      { userAgent: "PetalBot", disallow: "/" },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
