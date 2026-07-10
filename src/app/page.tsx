"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, MessageSquare, Image as ImageIcon, Calendar, Swords, Trophy, Wrench, UserPlus } from "lucide-react";
import SecretAdminLogin from "@/components/SecretAdminLogin";
import AIAssistant from "@/components/AIAssistant";

const messages = [
  "House of Spanking",
  "Server 1895",
  "Power Through Unity",
  "One Family",
  "One Goal",
  "One Victory",
];

const navItems = [
  { title: "Members", icon: Users, href: "/members", color: "from-blue-500 to-cyan-400" },
  { title: "Alliance Chat", icon: MessageSquare, href: "/chat", color: "from-green-500 to-emerald-400" },
  { title: "Gallery", icon: ImageIcon, href: "/gallery", color: "from-purple-500 to-pink-500" },
  { title: "Events", icon: Calendar, href: "/events", color: "from-yellow-500 to-orange-500" },
  { title: "War Reports", icon: Swords, href: "/war", color: "from-red-500 to-rose-500" },
  { title: "Leaderboard", icon: Trophy, href: "/leaderboard", color: "from-amber-400 to-yellow-600" },
  { title: "Tools", icon: Wrench, href: "/tools", color: "from-gray-400 to-gray-600" },
  { title: "Join Us", icon: UserPlus, href: "/join", color: "from-indigo-500 to-violet-500" },
];

export default function Home() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 w-full max-w-7xl mx-auto min-h-screen relative overflow-hidden">

      {/* Secret Admin Entry Point */}
      <SecretAdminLogin />

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 1 }}
        className="text-center mb-16 relative z-10"
      >
        <motion.div
          className="w-32 h-32 md:w-48 md:h-48 mx-auto mb-8 relative cursor-pointer group"
          whileHover={{ scale: 1.05 }}
        >
          <div className="absolute inset-0 bg-neon-blue rounded-full opacity-20 blur-xl group-hover:opacity-40 transition-opacity duration-500" />
          <div className="w-full h-full border-2 border-neon-blue rounded-full flex items-center justify-center bg-black/50 backdrop-blur-sm box-glow">
            <span className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-neon-blue to-white text-glow">
              HOS
            </span>
          </div>
        </motion.div>

        <div className="h-20 flex items-center justify-center overflow-hidden">
          <motion.h1
            key={msgIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-5xl font-bold tracking-wider uppercase text-glow text-white"
          >
            {messages[msgIndex]}
          </motion.h1>
        </div>
      </motion.div>

      {/* Holographic Navigation Grid */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 w-full z-10"
      >
        {navItems.map((item, i) => (
          <Link href={item.href} key={i} className="block group">
            <motion.div
              whileHover={{ y: -5, scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              className="glass-panel p-6 rounded-xl flex flex-col items-center justify-center gap-4 relative overflow-hidden h-full min-h-[140px]"
            >
              {/* Hover gradient background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

              <item.icon className="w-8 h-8 text-gray-400 group-hover:text-white transition-colors duration-300 relative z-10" />
              <span className="text-sm md:text-base font-semibold tracking-wide text-gray-300 group-hover:text-white transition-colors duration-300 relative z-10">
                {item.title}
              </span>

              {/* Corner tech accents */}
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-neon-blue/50" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-neon-blue/50" />
            </motion.div>
          </Link>
        ))}
      </motion.div>

      {/* AI Assistant */}
      <AIAssistant />
    </div>
  );
}
