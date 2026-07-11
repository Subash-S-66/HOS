"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Image as ImageIcon } from 'lucide-react';

export default function Gallery() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/gallery')
      .then(res => res.json())
      .then(data => {
        setItems(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load gallery items", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl sm:text-4xl md:text-6xl font-cyber font-bold text-white mb-4"
        >
          HOS <span className="text-neon-green glow-text">ARCHIVES</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-gray-400 max-w-2xl mx-auto"
        >
          Visual records of our greatest achievements and moments.
        </motion.p>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap justify-center gap-4 mb-12">
        {['All', 'Battles', 'Events', 'Memes', 'Achievements'].map((category, i) => (
          <button
            key={i}
            className={`px-6 py-2 rounded-full border text-sm font-bold uppercase tracking-wider transition-all ${
              i === 0
                ? 'bg-neon-green text-black border-neon-green shadow-[0_0_15px_rgba(0,255,102,0.4)]'
                : 'glass-panel border-white/10 text-gray-400 hover:text-white hover:border-neon-green/50'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 border-4 border-neon-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-xl text-gray-400 font-cyber">DECRYPTING ARCHIVES...</h3>
        </div>
      ) : (
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
        {items.map((item, i) => (
          <motion.div
            key={item._id || i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`relative group rounded-xl overflow-hidden glass-panel border border-white/10 hover:border-neon-green/50 transition-colors break-inside-avoid ${
              i % 3 === 0 ? 'h-96' : i % 2 === 0 ? 'h-64' : 'h-80'
            }`}
          >
            <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
              {item.url ? (
                <img src={item.url} alt={item.title} className="w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" />
              ) : (
                <ImageIcon className="w-12 h-12 text-gray-700" />
              )}
            </div>

            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-6 text-center">
              {item.type === 'video' ? (
                <div className="w-12 h-12 rounded-full bg-neon-green/20 flex items-center justify-center mb-3">
                  <Play className="w-5 h-5 text-neon-green ml-1" />
                </div>
              ) : null}
              <h3 className="text-white font-bold font-cyber mb-1">{item.title}</h3>
              <p className="text-gray-300 text-sm">{item.category}</p>
            </div>
          </motion.div>
        ))}
      </div>
      )}
    </div>
  );
}
