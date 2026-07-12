"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";

export default function SecretAdminLogin() {
  return <Link href="/admin/login" aria-label="Admin login"><motion.span whileHover={{ scale: 1.1 }} className="fixed bottom-4 left-4 z-40 grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-black/40 text-white/25 backdrop-blur transition-colors hover:border-hos-red/60 hover:text-hos-red"><LockKeyhole size={13} /></motion.span></Link>;
}
