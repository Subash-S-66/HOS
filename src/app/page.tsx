"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Users, MessageSquare, Image as ImageIcon, Calendar, History, Wrench, UserPlus, Video, Gamepad2 } from "lucide-react";
import SecretAdminLogin from "@/components/SecretAdminLogin";
import AIAssistant from "../components/AIAssistant";
import { useSiteConfig } from "@/components/SiteProvider";
import type { LucideIcon } from "lucide-react";

const defaultMessages = [
  "House of Spanking",
  "Server 1895",
  "Power Through Unity",
  "One Family",
  "One Goal",
  "One Victory",
];

export default function Home() {
  const [msgIndex, setMsgIndex] = useState(0);
  const { config } = useSiteConfig();
  const messages = [
    ...defaultMessages,
    ...config.banner
      .split(",")
      .map((value) => value.trim())
      .filter((value) => value.length > 0),
  ].filter((value, index, all) => all.indexOf(value) === index);
  const navItems: { title: string; icon: LucideIcon; href: string; external?: boolean; unavailable?: boolean }[] = [
    { title: "Tools", icon: Wrench, href: "/tools" },
    { title: "Events", icon: Calendar, href: "/events" },
    { title: "Chat", icon: MessageSquare, href: "/chat" },
    { title: "Gallery", icon: ImageIcon, href: "/gallery" },
    { title: "YouTube", icon: Video, href: config.youtubeUrl || "#", external: Boolean(config.youtubeUrl), unavailable: !config.youtubeUrl },
    { title: "Join HOS", icon: UserPlus, href: "/join" },
    { title: "Members", icon: Users, href: "https://svs.info/server/1895/alliance/hos", external: true },
    { title: "SVS History", icon: History, href: "/svs-history" },
    { title: "Discord", icon: Gamepad2, href: config.discordUrl || "#", external: Boolean(config.discordUrl), unavailable: !config.discordUrl },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % Math.max(messages.length, 1));
    }, msgIndex === 0 ? 5000 : 3500);
    return () => clearInterval(interval);
  }, [messages.length, msgIndex]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 pb-4 pt-20 sm:px-8 sm:pb-6 sm:pt-24 w-full max-w-7xl mx-auto min-h-screen relative overflow-hidden">

      {/* Secret Admin Entry Point */}
      <SecretAdminLogin />

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.35 }}
        className="relative z-10 mb-7 text-center sm:mb-10"
      >
        <motion.div
          className="relative mx-auto mb-3 h-24 w-24 cursor-pointer group sm:mb-5 sm:h-36 sm:w-36 md:h-44 md:w-44"
          whileHover={{ scale: 1.05 }}
        >
          <div className="h-full w-full overflow-hidden rounded-full border-2 border-neon-blue box-glow"><Image src="/brand/hos-crest.png" alt="House of Spanking crest" width={192} height={192} priority className="h-full w-full object-cover" /></div>
        </motion.div>

        <div className="flex min-h-16 items-center justify-center overflow-hidden py-2 sm:min-h-20 sm:py-3 md:py-4">
          <motion.h1
            key={msgIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-5xl font-bold tracking-wider uppercase text-glow text-white"
          >
            {msgIndex === 0 ? (
              <>House of <span className="text-neon-red">Spanking</span></>
            ) : messages[msgIndex]}
          </motion.h1>
        </div>
      </motion.div>

      {/* Holographic Navigation Grid */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.16, duration: 0.35 }}
        className="z-10 grid w-full grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-4 md:gap-4"
      >
        {navItems.map((item, i) => (
          <Link href={item.href} target={item.external ? "_blank" : undefined} rel={item.external ? "noreferrer" : undefined} aria-disabled={item.unavailable} key={i} className={`block group ${item.unavailable ? "pointer-events-none opacity-45" : ""}`}>
            <motion.div
              whileHover={{ y: -5, scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              className="glass-panel relative flex h-full min-h-29 flex-col items-center justify-center gap-2.5 overflow-hidden rounded-xl p-4 sm:min-h-32 sm:gap-3 sm:p-5"
            >
              {/* Hover gradient background */}
              <div className="absolute inset-0 bg-linear-to-br from-hos-red/30 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

              <item.icon className="relative z-10 h-7 w-7 text-gray-400 transition-colors duration-300 group-hover:text-white sm:h-8 sm:w-8" />
              <span className="relative z-10 text-sm font-semibold tracking-wide text-gray-300 transition-colors duration-300 group-hover:text-white md:text-base">
                {item.title}
              </span>

              {/* Corner tech accents */}
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-hos-red/70" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-hos-red/70" />
            </motion.div>
          </Link>
        ))}
      </motion.div>

      {/* AI Assistant */}
      <AIAssistant />
    </div>
  );
}
