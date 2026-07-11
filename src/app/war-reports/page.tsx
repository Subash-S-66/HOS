"use client";

import { motion } from 'framer-motion';
import { Swords, Target, Crosshair, Skull } from 'lucide-react';

const mockReports = [
  {
    id: 1,
    title: "SVS Assault: Server 1894",
    date: "Oct 24, 2024",
    result: "Victory",
    enemy: "[WAR] WarLords",
    summary: "Coordinated strike on enemy throne level 35. Complete annihilation of defending forces.",
    stats: {
      powerLost: "1.2B",
      enemyPowerLost: "8.5B",
      kills: "145M",
      wounded: "12M"
    }
  },
  {
    id: 2,
    title: "Battlefield Defense",
    date: "Oct 20, 2024",
    result: "Victory",
    enemy: "[DOM] Dominators",
    summary: "Successfully held all major points. Enemy forces depleted by zero hour.",
    stats: {
      powerLost: "500M",
      enemyPowerLost: "2.1B",
      kills: "85M",
      wounded: "5M"
    }
  }
];

export default function WarReports() {
  return (
    <div className="min-h-screen pt-32 pb-20 px-4 md:px-8 max-w-6xl mx-auto">
      <div className="text-center mb-16">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-6xl font-cyber font-bold text-white mb-4"
        >
          WAR <span className="text-neon-green glow-text">REPORTS</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-gray-400 max-w-2xl mx-auto"
        >
          Declassified records of our military campaigns and tactical engagements.
        </motion.p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {mockReports.map((report, i) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-panel border border-white/10 rounded-xl overflow-hidden group"
          >
            {/* Header */}
            <div className="bg-white/5 border-b border-white/10 p-6 flex justify-between items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-neon-green/5 rounded-full blur-3xl group-hover:bg-neon-green/10 transition-colors"></div>

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <Swords className="text-neon-green w-5 h-5" />
                  <h2 className="text-xl font-bold font-cyber">{report.title}</h2>
                </div>
                <div className="text-sm text-gray-400">{report.date}</div>
              </div>

              <div className="relative z-10 px-4 py-2 bg-neon-green/10 border border-neon-green/30 rounded text-neon-green font-bold uppercase tracking-widest text-sm">
                {report.result}
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="text-sm">
                  <span className="text-gray-500 block uppercase tracking-wider text-xs mb-1">Target</span>
                  <span className="font-bold text-red-400 font-cyber text-lg">{report.enemy}</span>
                </div>
              </div>

              <p className="text-gray-300 mb-8 border-l-2 border-white/20 pl-4 py-1 italic">
                "{report.summary}"
              </p>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-black/40 p-4 rounded border border-white/5 text-center">
                  <Target className="w-5 h-5 text-green-500 mx-auto mb-2" />
                  <div className="text-xs text-gray-500 uppercase">Enemy Loss</div>
                  <div className="font-bold font-cyber text-green-400">{report.stats.enemyPowerLost}</div>
                </div>

                <div className="bg-black/40 p-4 rounded border border-white/5 text-center">
                  <Crosshair className="w-5 h-5 text-neon-green mx-auto mb-2" />
                  <div className="text-xs text-gray-500 uppercase">Kills</div>
                  <div className="font-bold font-cyber text-white">{report.stats.kills}</div>
                </div>

                <div className="bg-black/40 p-4 rounded border border-white/5 text-center">
                  <Skull className="w-5 h-5 text-red-500 mx-auto mb-2" />
                  <div className="text-xs text-gray-500 uppercase">Our Loss</div>
                  <div className="font-bold font-cyber text-red-400">{report.stats.powerLost}</div>
                </div>

                <div className="bg-black/40 p-4 rounded border border-white/5 text-center">
                  <div className="text-gray-400 mx-auto mb-2 font-bold text-xl">+</div>
                  <div className="text-xs text-gray-500 uppercase">Wounded</div>
                  <div className="font-bold font-cyber text-yellow-500">{report.stats.wounded}</div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-black/60 p-4 flex justify-between items-center border-t border-white/5">
              <button className="text-sm text-neon-green hover:text-white transition-colors">View Full Report</button>
              <button className="text-sm text-gray-400 hover:text-white transition-colors">Comments (12)</button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
