"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Shield, ChevronDown } from "lucide-react";
import EmberParticles from "./EmberParticles";
import { MagneticButton } from "./MagneticButton";

export function Hero() {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 200]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  const titleText = "HOUSE OF SPANKING";
  const titleLetters = titleText.split("");

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.5 },
    },
  };

  const letterVariants: import("framer-motion").Variants = {
    // Avoid filter: blur() on bg-clip-text as it breaks in many browsers
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
  };

  return (
    <section className="relative h-screen w-full overflow-hidden bg-void-black flex items-center justify-center pt-20">
      {/* Canvas Particle Effect */}
      <EmberParticles />

      {/* Vignette Overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,#0A0A0C_80%)]" />

      {/* Main Content */}
      <motion.div style={{ y: y1 }} className="relative z-10 flex flex-col items-center text-center px-4 w-full">
        {/* Animated Crest */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="mb-8 relative"
        >
          <div className="absolute inset-0 animate-pulse-glow rounded-full blur-xl opacity-40" />
          <Shield className="w-20 h-20 md:w-32 md:h-32 text-imperial-gold relative z-10 drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]" />
        </motion.div>

        {/* Title Reveal */}
        <motion.h1
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="font-cinzel font-bold tracking-[0.1em] flex flex-wrap justify-center mb-4"
          style={{
            fontSize: "clamp(2.5rem, 8vw, 8rem)",
            lineHeight: 1.1,
          }}
        >
          {titleLetters.map((letter, index) => (
            <motion.span
              key={index}
              variants={letterVariants}
              className="text-transparent bg-clip-text bg-gradient-to-r from-imperial-gold via-white to-imperial-gold bg-[length:200%_auto] inline-block drop-shadow-[0_0_10px_rgba(212,175,55,0.2)]"
              style={{
                animation: "gradient-shift 8s linear infinite",
              }}
            >
              {letter === " " ? "\u00A0" : letter}
            </motion.span>
          ))}
        </motion.h1>

        {/* Subtitle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="overflow-hidden mb-12"
        >
          <motion.p
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.5, delay: 1, ease: "linear" }}
            className="font-rajdhani text-imperial-gold text-xl md:text-3xl tracking-[0.3em] uppercase whitespace-nowrap overflow-hidden border-r-2 border-imperial-gold pr-2 animate-[blink_1s_step-end_infinite]"
          >
            SERVER 1895
          </motion.p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 2 }}
          className="flex flex-col sm:flex-row gap-6 w-full max-w-md mx-auto justify-center"
        >
          <MagneticButton className="relative group overflow-hidden px-8 py-4 bg-transparent border border-imperial-gold text-imperial-gold font-cinzel tracking-wider uppercase text-sm font-bold transition-all duration-300 w-full sm:w-auto">
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-blood-crimson to-blood-crimson-light translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0" />
            <span className="relative z-10 group-hover:text-white transition-colors duration-300">Join the Alliance</span>
            <span className="absolute inset-0 rounded-none shadow-[0_0_15px_rgba(212,175,55,0)] group-hover:shadow-[0_0_20px_rgba(196,30,30,0.6)] transition-shadow duration-300 pointer-events-none" />
          </MagneticButton>

          <MagneticButton className="relative group overflow-hidden px-8 py-4 bg-white/5 border border-white/10 backdrop-blur-sm text-ash-grey hover:text-white font-cinzel tracking-wider uppercase text-sm font-bold transition-all w-full sm:w-auto hover:border-white/30 hover:bg-white/10">
            View Chat
          </MagneticButton>
        </motion.div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        style={{ opacity }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 2.5 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-ash-grey/50 font-rajdhani uppercase tracking-widest text-xs">Descend</span>
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="w-6 h-6 text-imperial-gold/50" />
        </motion.div>
      </motion.div>
    </section>
  );
}
