"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Shield, X } from "lucide-react";
import { useState } from "react";
import { useSiteConfig } from "@/components/SiteProvider";

const links = [
  { title: "Home", href: "/" },
  { title: "Members", href: "https://svs.info/server/1895/alliance/hos", external: true },
  { title: "SVS History", href: "/svs-history" },
  { title: "Gallery", href: "/gallery" },
  { title: "Events", href: "/events" },
  { title: "Tools", href: "/tools" },
  { title: "Chat", href: "/chat" },
  { title: "Join HOS", href: "/join" },
] as const;

export default function SiteHeader() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  const { config } = useSiteConfig();
  const [menuOpen, setMenuOpen] = useState(false);
  const socialLinks = [
    { title: "YouTube", href: config.youtubeUrl },
    { title: "Discord", href: config.discordUrl },
  ].filter((link): link is { title: string; href: string } => Boolean(link.href));
  const allLinks = [...links, ...socialLinks];

  const navigationLinks = (mobile = false) => allLinks.map((link) => {
    const external = "external" in link ? Boolean(link.external) : link.href.startsWith("http");
    const active = !external && pathname === link.href;
    return <Link key={link.title} href={link.href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} onClick={() => setMenuOpen(false)} className={`${mobile ? "rounded-xl px-4 py-3 text-sm" : "rounded-lg px-3 py-2 text-xs"} shrink-0 font-bold uppercase tracking-wider transition hover:bg-white/10 hover:text-white ${active ? "bg-white/10 text-white" : "text-zinc-400"}`}>{link.title}</Link>;
  });

  return (
    <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-5">
      <div className="glass-panel mx-auto flex h-14 max-w-7xl items-center gap-3 rounded-2xl px-3 sm:h-16 sm:px-4">
        <Link href="/" aria-label="House of Spanking home" className="flex shrink-0 items-center gap-2" onClick={() => setMenuOpen(false)}>
          <Image src="/brand/hos-crest.png" alt="HOS crest" width={48} height={48} priority className="h-10 w-10 rounded-lg object-cover object-center sm:h-12 sm:w-12" />
          <span className="text-xs font-black tracking-[.18em] text-white sm:text-base xl:text-lg">HOS</span>
        </Link>

        <nav aria-label="Primary navigation" className="hidden min-w-0 flex-1 items-center justify-end gap-1 xl:flex">
          {navigationLinks()}
          <Link href="/admin/login" className="ml-1 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-black uppercase tracking-wider text-red-400 transition hover:bg-white/10 hover:text-red-300"><Shield size={15} />Admin</Link>
        </nav>

        <div className="ml-auto flex items-center gap-2 xl:hidden">
          <Link href="/admin/login" aria-label="Admin login" className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[11px] font-black uppercase tracking-wider text-red-400 transition hover:bg-white/10 hover:text-red-300"><Shield size={15} />Admin</Link>
          <button type="button" aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)} className="grid h-9 w-9 place-items-center rounded-lg border border-white/15 bg-black/30 text-white transition hover:bg-white/10">
            {menuOpen ? <X size={19} /> : <Menu size={21} />}
          </button>
        </div>
      </div>

      {menuOpen && <nav aria-label="Mobile navigation" className="glass-panel mx-auto mt-2 grid max-w-7xl grid-cols-2 gap-1 rounded-2xl p-2 shadow-2xl sm:grid-cols-3 xl:hidden">{navigationLinks(true)}</nav>}
    </header>
  );
}
