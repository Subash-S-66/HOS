"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Tilt from "react-parallax-tilt";
import { Swords, Shield, Globe, Crosshair, Flame, Trophy } from "lucide-react";
import type { LinkItem } from "@/app/admin/page";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Globe,
  Swords,
  Shield,
  Crosshair,
  Flame,
  Trophy,
};

export function DynamicLinks() {
  const [items, setItems] = useState<LinkItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let initialItems: LinkItem[] = [];
    try {
      const saved = localStorage.getItem("hos_admin_links");
      if (saved) {
        initialItems = JSON.parse(saved);
      }
    } catch (error) {
      console.error("Failed to parse admin links from local storage", error);
    }

    // Defer the state updates to avoid the synchronous effect warning
    const timeoutId = setTimeout(() => {
      setItems(initialItems);
      setIsLoaded(true);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, []);

  if (!isLoaded || items.length === 0) return null;

  return (
    <section id="links" className="relative w-full py-32 bg-void-black px-6">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-imperial-gold/50 to-transparent" />

      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="font-cinzel text-4xl md:text-5xl text-white tracking-widest uppercase mb-4 flex items-center justify-center gap-4">
            <span className="w-12 h-px bg-imperial-gold/50" />
            Alliance Network
            <span className="w-12 h-px bg-imperial-gold/50" />
          </h2>
          <p className="font-rajdhani text-imperial-gold text-xl tracking-[0.2em] uppercase">Official Channels & Intel</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {items.map((item, index) => {
            const IconComponent = iconMap[item.iconName] || Globe;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
              >
                <Tilt
                  tiltMaxAngleX={6}
                  tiltMaxAngleY={6}
                  scale={1.02}
                  transitionSpeed={2500}
                  className="relative group p-1 rounded-sm overflow-hidden bg-void-black border border-white/10 hover:border-imperial-gold/50 transition-colors duration-500 h-full flex flex-col"
                >
                  {/* Glow Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blood-crimson/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div
                    className="relative h-64 w-full overflow-hidden bg-white/5 flex items-center justify-center bg-cover bg-center"
                    style={{ backgroundImage: `url(${item.imageUrl})` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-void-black via-void-black/50 to-transparent z-10" />
                    <IconComponent className="w-20 h-20 text-white/50 group-hover:scale-110 group-hover:text-imperial-gold transition-all duration-700 relative z-20 drop-shadow-[0_0_15px_rgba(0,0,0,0.8)]" />
                  </div>

                  <div className="relative z-20 p-8 flex-1 flex flex-col items-center text-center bg-void-black">
                    <h3 className="font-cinzel text-2xl text-white tracking-wider mb-6 flex-1">{item.title}</h3>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-8 py-3 w-full border border-imperial-gold/30 bg-imperial-gold/10 hover:bg-imperial-gold hover:text-void-black text-imperial-gold font-cinzel text-sm uppercase tracking-widest transition-all duration-300 font-bold"
                    >
                      Access Data
                    </a>
                  </div>
                </Tilt>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
