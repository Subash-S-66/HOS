"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Zap, Crosshair, HeartHandshake } from 'lucide-react';

const categories = [
  { id: 'power', name: 'Power', icon: Zap },
  { id: 'kills', name: 'Kills', icon: Crosshair },
  { id: 'donations', name: 'Donations', icon: HeartHandshake },
];

export default function Leaderboards() {
  const [activeCategory, setActiveCategory] = useState<'power' | 'kills' | 'donations'>('power');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboards?category=${activeCategory}`)
      .then(res => res.json())
      .then(resData => {
        setData(resData);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load leaderboards", err);
        setLoading(false);
      });
  }, [activeCategory]);

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 md:px-8 max-w-5xl mx-auto">
      <div className="text-center mb-16">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl sm:text-4xl md:text-6xl font-cyber font-bold text-white mb-4"
        >
          HALL OF <span className="text-neon-green glow-text">FAME</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-gray-400 max-w-2xl mx-auto"
        >
          The most elite and dedicated members of House of Spanking.
        </motion.p>
      </div>

      {/* Categories */}
      <div className="flex justify-center gap-4 mb-12 flex-wrap">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold font-cyber uppercase tracking-wider transition-all duration-300 ${
                isActive
                  ? 'bg-neon-green/10 border-neon-green text-neon-green shadow-[0_0_20px_rgba(0,255,102,0.2)]'
                  : 'bg-black/50 border-white/10 text-gray-400 hover:border-white/30 hover:text-white'
              } border`}
            >
              <cat.icon className={`w-5 h-5 ${isActive ? 'text-neon-green' : 'text-gray-500'}`} />
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Leaderboard Table */}
      <motion.div
        key={activeCategory}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="glass-panel border border-white/10 rounded-2xl overflow-hidden"
      >
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 bg-white/5 text-gray-400 uppercase tracking-widest text-xs font-bold">
          <div className="col-span-2 md:col-span-1 text-center">Rank</div>
          <div className="col-span-6 md:col-span-8">Member</div>
          <div className="col-span-4 md:col-span-3 text-right pr-4">Score</div>
        </div>

        <div className="divide-y divide-white/5">
          {loading ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 border-4 border-neon-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-xl text-gray-400 font-cyber">CALCULATING RANKS...</h3>
            </div>
          ) : (
            data.map((row, i) => (
            <div
              key={row.rank}
              className={`grid grid-cols-12 gap-4 p-4 items-center transition-colors hover:bg-white/5 ${
                i === 0 ? 'bg-gradient-to-r from-neon-green/5 to-transparent' : ''
              }`}
            >
              <div className="col-span-2 md:col-span-1 flex justify-center">
                {i === 0 ? (
                  <Trophy className="w-6 h-6 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" />
                ) : i === 1 ? (
                  <Trophy className="w-6 h-6 text-gray-300" />
                ) : i === 2 ? (
                  <Trophy className="w-6 h-6 text-amber-600" />
                ) : (
                  <span className="font-cyber text-gray-500 text-lg">{row.rank}</span>
                )}
              </div>

              <div className="col-span-6 md:col-span-8 flex items-center gap-3">
                <div className={`w-10 h-10 rounded border flex items-center justify-center font-cyber font-bold ${
                  i === 0 ? 'border-neon-green bg-black text-neon-green shadow-[0_0_10px_rgba(0,255,102,0.2)]' : 'border-white/10 bg-black text-gray-400'
                }`}>
                  {row.name.charAt(0)}
                </div>
                <span className={`font-bold font-cyber text-lg ${i === 0 ? 'text-white text-shadow-sm' : 'text-gray-300'}`}>
                  {row.name}
                </span>
              </div>

              <div className="col-span-4 md:col-span-3 text-right pr-4">
                <span className={`font-bold font-cyber text-xl ${
                  activeCategory === 'power' ? 'text-blue-400' :
                  activeCategory === 'kills' ? 'text-red-400' :
                  'text-neon-green'
                }`}>
                  {typeof row.value === 'number' ? row.value.toLocaleString() : row.value}
                </span>
              </div>
            </div>
          )))}
        </div>
      </motion.div>
    </div>
  );
}
