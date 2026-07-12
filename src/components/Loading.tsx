"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

const WELCOME_LOADER_KEY = "hos:welcome-loader-seen";

export default function Loading() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [liteMode, setLiteMode] = useState(false);

  useEffect(() => {
    const deviceNavigator = navigator as Navigator & { deviceMemory?: number };
    const isSmallScreen = window.matchMedia("(max-width: 640px)").matches;
    const hasLimitedHardware = (deviceNavigator.hardwareConcurrency ?? 8) <= 4 || (deviceNavigator.deviceMemory ?? 8) <= 2;

    if (isSmallScreen || hasLimitedHardware) {
      const timer = window.setTimeout(() => setLiteMode(true), 0);
      return () => window.clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(WELCOME_LOADER_KEY)) return;

      // Save before animating so refreshes or route changes never replay the intro.
      window.localStorage.setItem(WELCOME_LOADER_KEY, "true");
    } catch {
      // Some older/private browsers restrict storage. The welcome screen still works.
    }
    const showTimer = window.setTimeout(() => setLoading(true), 0);
    return () => window.clearTimeout(showTimer);
  }, []);

  useEffect(() => {
    if (!loading) return;
    const startedAt = performance.now();
    const duration = 2200;
    const tickMs = 50;
    let timerId = 0;

    const updateProgress = () => {
      const now = performance.now();
      const elapsed = Math.min(now - startedAt, duration);
      const completion = elapsed / duration;
      // Accelerates quickly, then settles into a deliberate final reveal.
      const nextProgress = Math.min(100, Math.round((1 - Math.pow(1 - completion, 2.2)) * 100));
      setProgress(nextProgress);

      if (completion < 1) {
        timerId = window.setTimeout(updateProgress, tickMs);
      } else {
        window.setTimeout(() => setLoading(false), 350);
      }
    };

    timerId = window.setTimeout(updateProgress, tickMs);
    return () => window.clearTimeout(timerId);
  }, [loading]);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#020508] px-6"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgb(var(--theme-rgb)_/_0.26),transparent_25%),radial-gradient(ellipse_at_bottom,#0b1d2d_0%,transparent_52%),linear-gradient(135deg,#020508_0%,#071018_50%,#020508_100%)]" />
          {!liteMode && <>
            <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgb(var(--theme-rgb)_/_0.1)_1px,transparent_1px),linear-gradient(90deg,rgb(var(--theme-rgb)_/_0.1)_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(circle_at_center,black,transparent_68%)]" />
            <motion.div
              aria-hidden="true"
              animate={{ y: ["-10vh", "110vh"] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 right-0 top-0 h-px bg-neon-blue/70 shadow-[0_0_16px_rgb(var(--theme-rgb)_/_0.8)] will-change-transform"
            />
            <motion.div
              aria-hidden="true"
              animate={{ rotate: 360 }}
              transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
              className="absolute h-[29rem] w-[29rem] rounded-full border border-neon-blue/10 border-t-neon-blue/55 will-change-transform"
            />
            <motion.div
              aria-hidden="true"
              animate={{ rotate: -360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              className="absolute h-[21rem] w-[21rem] rounded-full border border-dashed border-neon-purple/25 will-change-transform"
            >
              <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-neon-purple shadow-[0_0_12px_#bc13fe]" />
              <span className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-neon-blue shadow-[0_0_12px_rgb(var(--theme-rgb))]" />
            </motion.div>
          </>}

          <div className="relative flex w-full max-w-sm flex-col items-center">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="mb-5 font-mono text-[10px] font-semibold tracking-[0.42em] text-neon-blue/80"
            >
              SERVER 1895 // ONLINE
            </motion.p>
            <motion.div className="relative mb-5 grid h-28 w-28 place-items-center sm:h-32 sm:w-32">
              {!liteMode && <>
                <motion.div
                  aria-hidden="true"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border border-neon-blue/30 border-t-neon-blue will-change-transform"
                />
                <motion.div
                  aria-hidden="true"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-2 rounded-full border border-dashed border-neon-purple/50 will-change-transform"
                />
              </>}
              <div className="relative h-20 w-20 overflow-hidden rounded-full border border-white/20 bg-black/40 p-1 shadow-[0_0_25px_rgb(var(--theme-rgb)_/_0.38)] sm:h-24 sm:w-24">
                <Image src="/brand/hos-crest.png" alt="House of Spanking crest" fill sizes="96px" className="object-cover" priority />
              </div>
            </motion.div>
            <motion.div
              initial={{ scale: 0.75, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="mb-7 text-5xl font-black tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-neon-blue via-white to-neon-purple sm:text-6xl"
            >
              HOS
            </motion.div>

            <div className="w-full rounded-full border border-neon-blue/20 bg-black/55 p-1 shadow-[0_0_32px_rgb(var(--theme-rgb)_/_0.16)]">
              <motion.div
                className="h-1.5 rounded-full bg-gradient-to-r from-neon-blue via-white to-neon-purple shadow-[0_0_16px_rgb(var(--theme-rgb)_/_0.9)]"
                style={{ width: `${progress}%` }}
                transition={{ ease: "easeOut", duration: 0.12 }}
              />
            </div>

            <div className="mt-4 flex w-full items-center justify-between font-mono text-[11px] font-semibold tracking-[0.18em] text-zinc-400">
              <span>{progress < 35 ? "LINKING ALLIANCE" : progress < 75 ? "SYNCING WAR ROOM" : "HQ READY"}</span>
              <span className="text-neon-blue">{progress.toString().padStart(3, "0")}%</span>
            </div>
            <div className="mt-6 flex w-full items-center justify-between border-t border-white/10 pt-3 font-mono text-[9px] tracking-[0.16em] text-zinc-500">
              <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-neon-green shadow-[0_0_8px_#39ff14]" />COMMS</span>
              <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-neon-green shadow-[0_0_8px_#39ff14]" />TERRITORY</span>
              <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-neon-green shadow-[0_0_8px_#39ff14]" />MEMBERS</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
