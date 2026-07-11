"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, MapPin, Mail, Bug, MessageSquare } from 'lucide-react';

export default function Contact() {
  const [formType, setFormType] = useState<'feedback' | 'bug'>('feedback');

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 md:px-8 max-w-6xl mx-auto">
      <div className="text-center mb-16">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-6xl font-cyber font-bold text-white mb-4"
        >
          COMMUNICATION <span className="text-neon-green glow-text">HUB</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-gray-400 max-w-2xl mx-auto"
        >
          Establish a secure connection with the alliance leadership.
        </motion.p>
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-panel p-8 rounded-xl border border-white/10"
          >
            <h2 className="text-2xl font-cyber font-bold mb-6 text-neon-green">Official Channels</h2>

            <div className="space-y-6">
              <a href="#" className="flex items-center gap-4 text-gray-300 hover:text-white group">
                <div className="w-12 h-12 rounded bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-[#5865F2] group-hover:bg-[#5865F2]/10 transition-colors">
                  <MessageSquare className="w-6 h-6 group-hover:text-[#5865F2]" />
                </div>
                <div>
                  <div className="font-bold">Discord Server</div>
                  <div className="text-sm text-gray-500">Join the official HOS community</div>
                </div>
              </a>

              <a href="#" className="flex items-center gap-4 text-gray-300 hover:text-white group">
                <div className="w-12 h-12 rounded bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-red-500 group-hover:bg-red-500/10 transition-colors">
                  <Mail className="w-6 h-6 group-hover:text-red-500" />
                </div>
                <div>
                  <div className="font-bold">YouTube Channel</div>
                  <div className="text-sm text-gray-500">Watch our latest war reports</div>
                </div>
              </a>

              <div className="flex items-center gap-4 text-gray-300">
                <div className="w-12 h-12 rounded bg-white/5 border border-white/10 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-neon-green" />
                </div>
                <div>
                  <div className="font-bold">Location</div>
                  <div className="text-sm text-gray-500">Server 1895 Capital</div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-panel p-2 rounded-xl border border-white/10 h-64 relative overflow-hidden"
          >
             <div className="absolute inset-0 flex items-center justify-center text-gray-500 font-cyber flex-col">
               <MapPin className="w-10 h-10 mb-2 opacity-50" />
               MAP DATA ENCRYPTED
             </div>
             <div className="absolute inset-0 bg-black/50 cyber-grid opacity-30"></div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-panel p-8 rounded-xl border border-white/10"
        >
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setFormType('feedback')}
              className={`flex-1 py-3 rounded-lg font-cyber font-bold text-sm tracking-wider uppercase transition-all ${
                formType === 'feedback'
                  ? 'bg-neon-green text-black shadow-[0_0_15px_rgba(0,255,102,0.3)]'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              Feedback
            </button>
            <button
              onClick={() => setFormType('bug')}
              className={`flex-1 py-3 rounded-lg font-cyber font-bold text-sm tracking-wider uppercase transition-all ${
                formType === 'bug'
                  ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)] border border-red-400'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              Report Bug
            </button>
          </div>

          <form className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-cyber text-gray-400 mb-2 uppercase tracking-wider">In-Game Name</label>
                <input
                  type="text"
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neon-green transition-colors"
                  placeholder="Your username"
                />
              </div>
              <div>
                <label className="block text-xs font-cyber text-gray-400 mb-2 uppercase tracking-wider">Email (Optional)</label>
                <input
                  type="email"
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neon-green transition-colors"
                  placeholder="For replies"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-cyber text-gray-400 mb-2 uppercase tracking-wider">Subject</label>
              <input
                type="text"
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neon-green transition-colors"
                placeholder={formType === 'bug' ? "What is the issue?" : "What is your feedback?"}
              />
            </div>

            <div>
              <label className="block text-xs font-cyber text-gray-400 mb-2 uppercase tracking-wider">Message</label>
              <textarea
                rows={5}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neon-green transition-colors resize-none"
                placeholder="Detailed description..."
              ></textarea>
            </div>

            <button
              type="button"
              className={`w-full py-4 rounded-lg font-cyber font-bold tracking-widest uppercase flex items-center justify-center gap-2 transition-all ${
                formType === 'bug'
                  ? 'bg-red-500/10 text-red-500 border border-red-500 hover:bg-red-500/20'
                  : 'bg-neon-green/10 text-neon-green border border-neon-green hover:bg-neon-green/20 hover:shadow-[0_0_20px_rgba(0,255,102,0.2)]'
              }`}
            >
              <Send className="w-5 h-5" />
              Transmit Data
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
