"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Shield } from "lucide-react";

export function LoadingScreen() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  if (!loading) return null;

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.5, delay: 1 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-void-black"
    >
      <motion.div
        animate={{ scale: [0.9, 1.1, 1], opacity: [0.5, 1, 0.8] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        className="flex flex-col items-center gap-4"
      >
        <div className="relative">
          <div className="absolute inset-0 animate-pulse-glow rounded-full blur-xl opacity-50" />
          <Shield className="w-24 h-24 text-imperial-gold relative z-10" />
        </div>
        <h2 className="font-cinzel text-imperial-gold text-2xl tracking-widest uppercase">
          Initializing
        </h2>
      </motion.div>
    </motion.div>
  );
}
