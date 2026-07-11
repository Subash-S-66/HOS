"use client";

import { ReactNode } from 'react';
import Navbar from './Navbar';
import CustomCursor from './CustomCursor';
import ThreeBackground from '../three/ThreeBackground';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import AIChatbot from '../chat/AIChatbot';

interface LayoutClientProps {
  children: ReactNode;
}

export default function LayoutClient({ children }: LayoutClientProps) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');

  return (
    <>
      <CustomCursor />
      {!isAdmin && <ThreeBackground />}
      {!isAdmin && <Navbar />}
      {!isAdmin && <AIChatbot />}

      <AnimatePresence mode="wait">
        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className={!isAdmin ? "pt-24 min-h-screen" : "min-h-screen"}
        >
          {children}
        </motion.main>
      </AnimatePresence>
    </>
  );
}
