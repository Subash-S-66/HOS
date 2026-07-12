"use client";

import { usePathname } from "next/navigation";
import { useSiteConfig } from "@/components/SiteProvider";

export default function SiteFooter() {
  const pathname = usePathname();
  const { config } = useSiteConfig();

  if (pathname !== "/") return null;

  return (
    <footer className="relative z-10 px-4 pb-6 pt-2 sm:px-8">
      <div className="glass-panel mx-auto max-w-7xl rounded-2xl px-4 py-3 text-center text-xs text-zinc-300 sm:text-sm">
        {config.footer}
      </div>
    </footer>
  );
}
