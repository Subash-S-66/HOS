"use client";

import { motion } from "framer-motion";
import { ExternalLink, Swords } from "lucide-react";
import { useSiteConfig } from "@/components/SiteProvider";
import { PageLoader } from "@/components/PageLoader";

const formatDate = (date: string) => date ? new Intl.DateTimeFormat("en-US", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(date)) : "Date unavailable";

export default function SvsHistoryPage() {
  const { config, isLoading } = useSiteConfig();
  if (isLoading) return <PageLoader label="Loading SVS history..." />;
  return <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-24 sm:px-8"><div className="mb-10 text-center"><Swords className="mx-auto mb-4 text-hos-red" /><h1 className="text-3xl font-bold uppercase tracking-[.2em] text-white sm:text-5xl">SVS History</h1><p className="mt-3 text-sm text-zinc-400">Last SVS: {formatDate(config.svsHistory[0]?.date || "")} · Updates every 14 days on Monday</p></div><div className="grid gap-3 sm:grid-cols-2">{config.svsHistory.map((entry, index) => <motion.a initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .04 }} key={entry.url} href={entry.url} target="_blank" rel="noreferrer" className="glass-panel group flex items-center justify-between rounded-xl p-5 transition hover:-translate-y-1 hover:border-hos-red hover:shadow-[0_0_28px_rgba(139,0,0,.28)]"><span><span className="block font-semibold tracking-wide text-zinc-100">{entry.label}</span><span className="mt-1 block text-xs text-zinc-500">{formatDate(entry.date)}</span></span><ExternalLink className="h-4 w-4 text-hos-red transition group-hover:text-white" /></motion.a>)}</div></section>;
}
