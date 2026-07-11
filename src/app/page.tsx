"use client";

import { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Volume2, VolumeX, Shield, Swords, Trophy, Users } from 'lucide-react';
import gsap from 'gsap';

export default function Home() {
  const [typingText, setTypingText] = useState("");
  const [textIndex, setTextIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const logoRef = useRef<HTMLDivElement>(null);

  const messages = [
    "Welcome to House of Spanking",
    "Server 1895",
    "Strength Through Unity",
    "The Strongest Family"
  ];

  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 200]);
  const y2 = useTransform(scrollY, [0, 1000], [0, -100]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  useEffect(() => {
    let currentText = messages[textIndex];
    let currentCharIndex = 0;
    let isDeleting = false;
    let typingSpeed = 100;

    const type = () => {
      if (!isDeleting && currentCharIndex <= currentText.length) {
        setTypingText(currentText.substring(0, currentCharIndex));
        currentCharIndex++;
        typingSpeed = 100;
      } else if (isDeleting && currentCharIndex >= 0) {
        setTypingText(currentText.substring(0, currentCharIndex));
        currentCharIndex--;
        typingSpeed = 50;
      }

      if (currentCharIndex === currentText.length + 1) {
        isDeleting = true;
        typingSpeed = 2000; // Pause at end
      } else if (currentCharIndex === -1) {
        isDeleting = false;
        setTextIndex((prev) => (prev + 1) % messages.length);
        currentText = messages[(textIndex + 1) % messages.length];
        typingSpeed = 500; // Pause before new word
      }

      setTimeout(type, typingSpeed);
    };

    const timer = setTimeout(type, 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textIndex]);

  useEffect(() => {
    if (logoRef.current) {
      gsap.to(logoRef.current, {
        y: -10,
        rotationX: 10,
        rotationY: -10,
        duration: 2,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut"
      });
    }

    audioRef.current = new Audio('https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=cinematic-time-lapse-115652.mp3');
    audioRef.current.loop = true;
    audioRef.current.volume = 0.3;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.play().catch(e => console.log("Audio play failed:", e));
      } else {
        audioRef.current.pause();
      }
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Audio Control */}
      <button
        onClick={toggleMute}
        className="fixed bottom-8 right-8 z-50 p-4 rounded-full glass-panel border border-neon-green/30 text-neon-green hover:bg-neon-green/10 hover:scale-110 transition-all duration-300"
      >
        {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
      </button>

      {/* Hero Section */}
      <motion.div
        style={{ y: y1, opacity }}
        className="flex flex-col items-center justify-center min-h-screen w-full relative z-10 px-4"
      >
        <motion.div
          ref={logoRef}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, type: "spring", bounce: 0.4 }}
          className="relative mb-8"
        >
          <div className="absolute inset-0 bg-neon-green blur-[100px] opacity-20 rounded-full"></div>
          <h1 className="text-7xl md:text-9xl font-cyber font-bold text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-200 to-gray-500 tracking-tighter filter drop-shadow-[0_0_15px_rgba(0,255,102,0.5)]">
            HOS
          </h1>
        </motion.div>

        <div className="h-12 md:h-16 flex items-center justify-center mb-12">
          <p className="text-2xl md:text-4xl font-cyber text-neon-green glow-text tracking-widest uppercase">
            {typingText}
            <span className="animate-pulse">_</span>
          </p>
        </div>

        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl"
        >
          {[
            { title: "Explore", href: "/about", icon: Shield, desc: "Discover our legacy" },
            { title: "Alliance Chat", href: "/chat", icon: Users, desc: "Connect with brothers", primary: true },
            { title: "War Reports", href: "/war-reports", icon: Swords, desc: "Witness our glory" },
            { title: "Leaderboards", href: "/leaderboards", icon: Trophy, desc: "See the champions" }
          ].map((btn, i) => (
            <Link
              key={i}
              href={btn.href}
              className={`group relative p-6 rounded-xl glass-panel border overflow-hidden flex flex-col items-center justify-center gap-3 transition-all duration-500 hover:-translate-y-2 ${
                btn.primary
                  ? 'border-neon-green bg-neon-green/5 hover:bg-neon-green/20 hover:shadow-[0_0_30px_rgba(0,255,102,0.3)]'
                  : 'border-white/10 hover:border-neon-green/50 hover:bg-white/5'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-neon-green/0 to-neon-green/0 group-hover:from-neon-green/10 group-hover:to-transparent transition-all duration-500"></div>
              <btn.icon size={32} className={`${btn.primary ? 'text-neon-green' : 'text-gray-400 group-hover:text-neon-green'} transition-colors duration-300`} />
              <h3 className={`font-cyber text-xl font-bold uppercase tracking-widest ${btn.primary ? 'text-neon-green glow-text' : 'text-white'}`}>
                {btn.title}
              </h3>
              <p className="text-gray-400 text-sm group-hover:text-gray-300">{btn.desc}</p>
            </Link>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        style={{ opacity }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-xs uppercase tracking-widest text-gray-500 font-cyber">Scroll Sequence</span>
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-px h-16 bg-gradient-to-b from-neon-green to-transparent"
        />
      </motion.div>

      {/* Stats Section Parallax */}
      <div className="min-h-screen w-full relative z-10 bg-black/50 backdrop-blur-md border-t border-white/5 py-24 flex flex-col items-center">
        <motion.div style={{ y: y2 }} className="max-w-6xl w-full px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-cyber font-bold text-white mb-4">DOMINANCE BY THE NUMBERS</h2>
            <div className="w-24 h-1 bg-neon-green mx-auto glow-box"></div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "Total Members", value: "128" },
              { label: "Server Rank", value: "#1" },
              { label: "Alliance Power", value: "850B+" },
              { label: "Victories", value: "9,999+" }
            ].map((stat, i) => (
              <div key={i} className="glass-panel p-8 rounded-lg border border-white/5 text-center group hover:border-neon-green/50 transition-colors duration-300">
                <div className="text-4xl md:text-5xl font-bold text-neon-green font-cyber mb-2 group-hover:glow-text">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-400 uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
