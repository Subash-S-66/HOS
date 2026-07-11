"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Swords, Target, Crosshair, Skull } from 'lucide-react';

export default function WarReports() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/war-reports')
      .then(res => res.json())
      .then(data => {
        setReports(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load war reports", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 md:px-8 max-w-6xl mx-auto">
      <div className="text-center mb-16">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl sm:text-4xl md:text-6xl font-cyber font-bold text-white mb-4"
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

      {loading ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 border-4 border-neon-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-xl text-gray-400 font-cyber">DECRYPTING REPORTS...</h3>
        </div>
      ) : (
      <div className="grid lg:grid-cols-2 gap-8">
        {reports.map((report, i) => (
          <motion.div
            key={report._id || i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-panel border border-white/10 rounded-xl overflow-hidden group"
          >
            <div className="bg-white/5 border-b border-white/10 p-6 flex justify-between items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-neon-green/5 rounded-full blur-3xl group-hover:bg-neon-green/10 transition-colors"></div>

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <Swords className="text-neon-green w-5 h-5" />
                  <h2 className="text-xl font-bold font-cyber">{report.enemyAlliance}</h2>
                </div>
                <div className="text-sm text-gray-400">{new Date(report.battleDate).toLocaleDateString()}</div>
              </div>

              <div className="relative z-10 px-4 py-2 bg-neon-green/10 border border-neon-green/30 rounded text-neon-green font-bold uppercase tracking-widest text-sm">
                Victory
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="text-sm">
                  <span className="text-gray-500 block uppercase tracking-wider text-xs mb-1">Target</span>
                  <span className="font-bold text-red-400 font-cyber text-lg">{report.enemyAlliance}</span>
                </div>
              </div>

              <p className="text-gray-300 mb-8 border-l-2 border-white/20 pl-4 py-1 italic">
                "{report.battleSummary}"
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-black/40 p-4 rounded border border-white/5 text-center">
                  <Target className="w-5 h-5 text-green-500 mx-auto mb-2" />
                  <div className="text-xs text-gray-500 uppercase">Enemy Loss</div>
                  <div className="font-bold font-cyber text-green-400">{report.damageStats?.enemyPowerLost || 'N/A'}</div>
                </div>

                <div className="bg-black/40 p-4 rounded border border-white/5 text-center">
                  <Crosshair className="w-5 h-5 text-neon-green mx-auto mb-2" />
                  <div className="text-xs text-gray-500 uppercase">Kills</div>
                  <div className="font-bold font-cyber text-white">{report.kills?.toLocaleString() || 0}</div>
                </div>

                <div className="bg-black/40 p-4 rounded border border-white/5 text-center">
                  <Skull className="w-5 h-5 text-red-500 mx-auto mb-2" />
                  <div className="text-xs text-gray-500 uppercase">Our Loss</div>
                  <div className="font-bold font-cyber text-red-400">{report.damageStats?.powerLost || 'N/A'}</div>
                </div>

                <div className="bg-black/40 p-4 rounded border border-white/5 text-center">
                  <div className="text-gray-400 mx-auto mb-2 font-bold text-xl">+</div>
                  <div className="text-xs text-gray-500 uppercase">Wounded</div>
                  <div className="font-bold font-cyber text-yellow-500">{report.losses?.toLocaleString() || 0}</div>
                </div>
              </div>
            </div>

            <div className="bg-black/60 p-4 flex justify-between items-center border-t border-white/5">
              <button className="text-sm text-neon-green hover:text-white transition-colors">View Full Report</button>
              <button className="text-sm text-gray-400 hover:text-white transition-colors">Comments (0)</button>
            </div>
          </motion.div>
        ))}
      </div>
      )}
    </div>
  );
}
