"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Loading() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const beginLoading = () => {
      setProgress(0);
      setLoading(true);
    };
    window.addEventListener("hos:login", beginLoading);
    return () => window.removeEventListener("hos:login", beginLoading);
  }, []);

  useEffect(() => {
    if (!loading) return;
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(timer);
          setTimeout(() => setLoading(false), 250);
          return 100;
        }
        return prev + Math.floor(Math.random() * 15) + 5;
      });
    }, 200);

    return () => clearInterval(timer);
  }, [loading]);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black"
        >
          {/* Logo & Energy Lines */}
          <div className="relative flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-6xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-neon-blue via-neon-purple to-neon-blue text-glow mb-8"
            >
              HOS
            </motion.div>

            {/* Glowing Loading Bar */}
            <div className="w-64 h-1 bg-gray-900 rounded-full overflow-hidden relative box-glow">
              <motion.div
                className="absolute top-0 left-0 h-full bg-neon-blue shadow-[0_0_10px_#00f3ff]"
                style={{ width: `${progress}%` }}
                layout
                transition={{ duration: 0.2 }}
              />
            </div>

            {/* Percentage */}
            <div className="mt-4 font-mono text-neon-blue text-sm tracking-widest">
              SYSTEM INITIALIZING... {Math.min(progress, 100)}%
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
