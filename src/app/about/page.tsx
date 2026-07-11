"use client";

import { motion } from 'framer-motion';
import { Shield, Target, Users, Zap, Swords, Trophy } from 'lucide-react';

const timelineEvents = [
  {
    year: "2023",
    title: "The Founding",
    description: "House of Spanking was forged in the fires of Server 1895. A small group of elite warriors banded together with a single vision: total dominance.",
    icon: Shield
  },
  {
    year: "Early 2024",
    title: "The First Great War",
    description: "Against overwhelming odds, HOS defended the server capital against a coalition of three rival alliances, establishing our reputation as an immovable force.",
    icon: Swords
  },
  {
    year: "Mid 2024",
    title: "Server Unification",
    description: "Through strategic diplomacy and sheer military might, Server 1895 was unified under the banner of HOS.",
    icon: Users
  },
  {
    year: "Present",
    title: "The Golden Age",
    description: "Now standing as the undisputed rulers of Server 1895, HOS continues to grow in power, preparing for cross-server conquest.",
    icon: Trophy
  }
];

export default function About() {
  return (
    <div className="min-h-screen pt-32 pb-20 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-20">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl sm:text-5xl md:text-7xl font-cyber font-bold text-white mb-6"
        >
          OUR <span className="text-neon-green glow-text">LEGACY</span>
        </motion.h1>
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="w-32 h-1 bg-neon-green mx-auto glow-box"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-12 items-center mb-32">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="glass-panel p-8 rounded-2xl border border-neon-green/20"
        >
          <h2 className="text-3xl font-cyber font-bold text-neon-green mb-6">THE ALLIANCE PHILOSOPHY</h2>
          <p className="text-gray-300 text-lg leading-relaxed mb-6">
            We are not just a collection of players; we are a family. In House of Spanking, every member matters. From the newest recruit to the seasoned R4s, our strength lies in our unity and coordinated execution.
          </p>
          <p className="text-gray-300 text-lg leading-relaxed">
            We believe in loyalty, tactical superiority, and relentless aggression when challenged. We do not start every war, but we finish them all.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-6">
          {[
            { title: "Loyalty", icon: Shield, desc: "Never leave a brother behind" },
            { title: "Precision", icon: Target, desc: "Calculated tactical strikes" },
            { title: "Unity", icon: Users, desc: "One mind, one purpose" },
            { title: "Power", icon: Zap, desc: "Overwhelming force" }
          ].map((val, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-panel p-6 rounded-xl border border-white/5 flex flex-col items-center text-center hover:border-neon-green/50 transition-colors"
            >
              <val.icon className="text-neon-green w-10 h-10 mb-4" />
              <h3 className="text-xl font-bold font-cyber mb-2">{val.title}</h3>
              <p className="text-sm text-gray-400">{val.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="relative">
        <h2 className="text-4xl font-cyber font-bold text-center mb-16">CHRONICLES OF SERVER 1895</h2>

        {/* Timeline Line */}
        <div className="absolute left-1/2 top-24 bottom-0 w-px bg-gradient-to-b from-neon-green/50 via-neon-green/20 to-transparent -translate-x-1/2 hidden md:block"></div>

        <div className="space-y-20 relative">
          {timelineEvents.map((event, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className={`flex flex-col md:flex-row items-center gap-8 ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}
            >
              <div className="flex-1 w-full md:text-right">
                {index % 2 === 0 ? (
                  <div className="glass-panel p-8 rounded-xl border border-neon-green/20 hover:border-neon-green/50 transition-colors">
                    <span className="text-neon-green font-cyber font-bold text-xl block mb-2">{event.year}</span>
                    <h3 className="text-2xl font-bold mb-4">{event.title}</h3>
                    <p className="text-gray-400">{event.description}</p>
                  </div>
                ) : (
                  <div className="hidden md:block"></div>
                )}
              </div>

              <div className="relative z-10 w-16 h-16 rounded-full bg-black border-2 border-neon-green flex items-center justify-center glow-box">
                <event.icon className="text-neon-green w-6 h-6" />
              </div>

              <div className="flex-1 w-full">
                {index % 2 !== 0 ? (
                  <div className="glass-panel p-8 rounded-xl border border-neon-green/20 hover:border-neon-green/50 transition-colors">
                    <span className="text-neon-green font-cyber font-bold text-xl block mb-2">{event.year}</span>
                    <h3 className="text-2xl font-bold mb-4">{event.title}</h3>
                    <p className="text-gray-400">{event.description}</p>
                  </div>
                ) : (
                  <div className="hidden md:block"></div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
