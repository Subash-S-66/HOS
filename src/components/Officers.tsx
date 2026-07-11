"use client";

import { motion } from "framer-motion";
import Tilt from "react-parallax-tilt";
import { Swords } from "lucide-react";

const officers = [
  { name: "VoidWalker", role: "Alliance Leader", power: "1.2B" },
  { name: "CrimsonBlade", role: "Warlord", power: "950M" },
  { name: "AshBringer", role: "Diplomat", power: "880M" },
];

export function Officers() {
  return (
    <section id="officers" className="relative w-full py-32 bg-void-black px-6">
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
            Leadership
            <span className="w-12 h-px bg-imperial-gold/50" />
          </h2>
          <p className="font-rajdhani text-imperial-gold text-xl tracking-[0.2em] uppercase">The Vanguard of 1895</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {officers.map((officer, index) => (
            <motion.div
              key={officer.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
            >
              <Tilt
                tiltMaxAngleX={6}
                tiltMaxAngleY={6}
                scale={1.02}
                transitionSpeed={2500}
                className="relative group p-1 rounded-sm overflow-hidden bg-void-black border border-white/10 hover:border-imperial-gold/50 transition-colors duration-500"
              >
                {/* Glow Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blood-crimson/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative h-96 w-full overflow-hidden bg-white/5 flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-t from-void-black via-transparent to-transparent z-10" />
                  <Swords className="w-24 h-24 text-ash-grey/20 group-hover:scale-110 transition-transform duration-700" />
                </div>

                <div className="relative z-20 p-6 -mt-16 text-center">
                  <h3 className="font-cinzel text-2xl text-white tracking-wider mb-1">{officer.name}</h3>
                  <p className="font-rajdhani text-blood-crimson-light text-sm tracking-[0.2em] uppercase mb-4 font-bold">{officer.role}</p>
                  <div className="inline-block px-4 py-1 border border-imperial-gold/30 bg-imperial-gold/10">
                    <span className="font-rajdhani text-imperial-gold text-lg font-semibold">PWR: {officer.power}</span>
                  </div>
                </div>
              </Tilt>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
