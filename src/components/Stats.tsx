"use client";

import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Users, Crosshair, Trophy, Flame } from "lucide-react";

const stats = [
  { id: 1, label: "Active Members", value: 100, suffix: "/100", icon: Users },
  { id: 2, label: "Total Kills", value: 45.2, suffix: "M", icon: Crosshair },
  { id: 3, label: "Server Rank", value: 1, suffix: "st", icon: Trophy },
  { id: 4, label: "Alliance Power", value: 8.5, suffix: "B", icon: Flame },
];

function AnimatedCounter({ value, suffix, duration = 2 }: { value: number; suffix: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const nodeRef = useRef(null);
  const inView = useInView(nodeRef, { once: true, margin: "-100px" });

  useEffect(() => {
    if (inView) {
      let startTime: number;
      const animateCount = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = (timestamp - startTime) / (duration * 1000);

        if (progress < 1) {
          setCount(value * progress);
          requestAnimationFrame(animateCount);
        } else {
          setCount(value);
        }
      };
      requestAnimationFrame(animateCount);
    }
  }, [value, duration, inView]);

  return (
    <span ref={nodeRef} className="font-cinzel text-5xl md:text-6xl text-white font-bold drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]">
      {Number.isInteger(value) ? Math.floor(count) : count.toFixed(1)}{suffix}
    </span>
  );
}

export function Stats() {
  return (
    <section id="stats" className="relative w-full py-24 bg-void-black px-6 overflow-hidden">
      {/* Torn Edge Top */}
      <div className="absolute top-0 left-0 w-full overflow-hidden leading-none rotate-180">
        <svg className="relative block w-[calc(100%+1.3px)] h-[30px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M1200 120L0 16.48 0 0 1200 0 1200 120z" className="fill-void-black border-t border-imperial-gold/20" style={{ fill: '#0A0A0C' }}></path>
        </svg>
      </div>

      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20 mix-blend-overlay" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blood-crimson/5 to-transparent pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.id}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                className="flex flex-col items-center text-center group"
              >
                <div className="w-16 h-16 rounded-full bg-white/5 border border-imperial-gold/30 flex items-center justify-center mb-6 group-hover:border-blood-crimson group-hover:bg-blood-crimson/10 transition-colors duration-500 relative">
                  <div className="absolute inset-0 rounded-full bg-imperial-gold/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <Icon className="w-8 h-8 text-imperial-gold group-hover:text-blood-crimson-light transition-colors relative z-10" />
                </div>

                <AnimatedCounter value={stat.value} suffix={stat.suffix} />

                <p className="mt-4 font-rajdhani text-ash-grey tracking-widest uppercase text-sm font-semibold">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
