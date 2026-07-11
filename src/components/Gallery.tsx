"use client";

import { motion } from "framer-motion";
import { Image as ImageIcon } from "lucide-react";

const galleryItems = [
  { id: 1, title: "Server Conquest", desc: "Victory at Capitol" },
  { id: 2, title: "Alliance Mobilization", desc: "The Gathering" },
  { id: 3, title: "Rival Defeat", desc: "Fallen Fortress" },
  { id: 4, title: "Emperor's Crowning", desc: "Ascension" },
];

export function Gallery() {
  return (
    <section id="gallery" className="relative w-full py-32 bg-void-black px-6">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blood-crimson/50 to-transparent" />

      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="font-cinzel text-4xl md:text-5xl text-white tracking-widest uppercase mb-4 flex items-center justify-center gap-4">
            <span className="w-12 h-px bg-blood-crimson/50" />
            War Archives
            <span className="w-12 h-px bg-blood-crimson/50" />
          </h2>
          <p className="font-rajdhani text-blood-crimson-light text-xl tracking-[0.2em] uppercase">Chronicles of 1895</p>
        </motion.div>

        <div className="flex overflow-x-auto pb-10 gap-8 snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {galleryItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: index * 0.15 }}
              className="min-w-[80vw] md:min-w-[400px] snap-center group cursor-pointer"
            >
              <div className="relative h-64 md:h-80 w-full bg-white/5 border border-white/10 group-hover:border-blood-crimson overflow-hidden transition-all duration-500 shadow-[0_0_0_rgba(196,30,30,0)] group-hover:shadow-[0_0_20px_rgba(196,30,30,0.4)]">
                {/* Fallback image placeholder */}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-void-black z-0 group-hover:scale-105 transition-transform duration-700">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-30 mix-blend-overlay" />
                  <ImageIcon className="w-16 h-16 text-white/10 mb-4" />
                  <span className="font-rajdhani text-white/20 tracking-widest uppercase">Encrypted Visual</span>
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-void-black via-void-black/20 to-transparent opacity-80 z-10" />

                <div className="absolute bottom-0 left-0 w-full p-6 z-20 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <h3 className="font-cinzel text-xl text-white tracking-wider mb-1">{item.title}</h3>
                  <p className="font-rajdhani text-imperial-gold text-sm tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">{item.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Torn Edge Bottom */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
        <svg className="relative block w-[calc(100%+1.3px)] h-[30px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M1200 120L0 16.48 0 0 1200 0 1200 120z" className="fill-void-black border-b border-blood-crimson/20" style={{ fill: '#0A0A0C' }}></path>
        </svg>
      </div>
    </section>
  );
}
