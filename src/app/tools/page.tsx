"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import * as Icons from "react-icons/fa6";
import { ExternalLink, Wrench } from "lucide-react";
import { useSiteConfig } from "@/components/SiteProvider";
import { PageLoader } from "@/components/PageLoader";

export default function Page() {
  const { config } = useSiteConfig();
  const [loading, setLoading] = useState(true);

  const tools = config.tools
    .filter((tool) => tool.enabled && (tool.visible ?? true))
    .sort((a, b) => a.order - b.order);

  // Mark loading as false once tools have been populated from the API
  useEffect(() => {
    if (config.tools.length > 0) {
      setLoading(false);
    }
    // Also handle case where API returns but there are no tools configured
    const timer = setTimeout(() => setLoading(false), 4000);
    return () => clearTimeout(timer);
  }, [config.tools]);

  return (
    <section className="mx-auto min-h-screen w-full max-w-5xl px-4 py-20 sm:px-8">
      <div className="mb-8 text-center">
        <Wrench className="mx-auto mb-4 text-hos-red" />
        <h1 className="text-3xl font-bold uppercase tracking-[.2em] text-white sm:text-5xl">
          Command Tools
        </h1>
        <p className="mt-3 text-sm text-zinc-400">
          Alliance utilities curated by HOS leadership.
        </p>
      </div>

      {loading ? (
        <PageLoader label="Loading Command Tools..." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool, index) => {
            const Icon = Icons[tool.icon as keyof typeof Icons] as React.ComponentType<{
              className?: string;
            }>;
            return (
              <motion.a
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                key={tool.id}
                href={tool.link}
                target={tool.link.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                className="glass-panel group relative rounded-xl p-4 transition duration-200 hover:-translate-y-0.5"
                style={{
                  borderColor: `${tool.color}75`,
                  boxShadow: `inset 0 0 0 1px ${tool.color}20`,
                }}
              >
                <div className="pointer-events-none absolute inset-0 rounded-xl bg-linear-to-b from-white/3 to-transparent opacity-70" />
                <div className="relative mb-3 flex items-start justify-between">
                  <div
                    className="grid h-9 w-9 place-items-center rounded-lg bg-black/45"
                    style={{ color: tool.color }}
                  >
                    {Icon ? <Icon className="h-4 w-4" /> : <Wrench className="h-4 w-4" />}
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-zinc-500 transition-colors group-hover:text-white" />
                </div>
                <p
                  className="relative text-[10px] font-semibold uppercase tracking-[0.18em]"
                  style={{ color: tool.color }}
                >
                  {tool.category}
                </p>
                <h2 className="relative mt-1 text-base font-bold leading-tight text-white">
                  {tool.title}
                </h2>
                <p className="relative mt-1.5 line-clamp-2 text-xs leading-5 text-zinc-400">
                  {tool.description}
                </p>
              </motion.a>
            );
          })}
        </div>
      )}
    </section>
  );
}
