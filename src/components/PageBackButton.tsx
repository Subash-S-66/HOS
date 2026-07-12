"use client";

import { ArrowLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

export default function PageBackButton() {
  const pathname = usePathname();
  const router = useRouter();
  if (pathname === "/" || pathname.startsWith("/admin")) return null;
  const goBack = () => window.history.length > 1 ? router.back() : router.push("/");
  return <button type="button" onClick={goBack} className="fixed left-3 top-20 z-30 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-xs font-bold text-zinc-200 backdrop-blur transition hover:border-white/25 hover:bg-white/10 hover:text-white sm:left-5 sm:top-24 md:hidden" aria-label="Go back"><ArrowLeft size={17} />Back</button>;
}
