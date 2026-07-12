"use client";

import { motion } from "framer-motion";

interface PageLoaderProps {
  label?: string;
}

export function PageLoader({ label = "Loading Alliance Systems..." }: PageLoaderProps) {
  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center py-20">
      <div className="relative flex items-center justify-center">
        {/* Glow behind the spinner */}
        <div className="absolute h-20 w-20 rounded-full bg-neon-blue/20 blur-xl animate-pulse" />
        
        {/* Outer rotating ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          className="h-16 w-16 rounded-full border-2 border-transparent border-t-neon-blue border-r-neon-blue/30"
        />

        {/* Center glowing dot */}
        <div className="absolute h-3 w-3 rounded-full bg-neon-blue shadow-[0_0_15px_var(--color-neon-blue)]" />
      </div>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6 text-sm font-semibold tracking-[0.2em] text-zinc-300 uppercase select-none"
      >
        {label}
      </motion.p>
      
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: 120 }}
        transition={{ duration: 1, ease: "easeInOut", delay: 0.1 }}
        className="mt-3 h-0.5 rounded-full bg-linear-to-r from-transparent via-neon-blue to-transparent shadow-[0_0_8px_var(--color-neon-blue)]"
      />
    </div>
  );
}
