"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Shield, Zap, Target, Star } from 'lucide-react';

export default function Members() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/members')
      .then(res => res.json())
      .then(data => {
        setMembers(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load members", err);
        setLoading(false);
      });
  }, []);

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.inGameName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "All" || member.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl sm:text-4xl md:text-5xl font-cyber font-bold text-white mb-4"
          >
            ALLIANCE <span className="text-neon-green glow-text">ROSTER</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 max-w-xl"
          >
            The elite warriors who make up the strongest family on Server 1895.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full md:w-auto flex flex-col sm:flex-row gap-4"
        >
          <div className="relative glass-panel rounded-lg flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-neon-green transition-colors"
            />
          </div>

          <div className="relative glass-panel rounded-lg">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="appearance-none bg-transparent border border-white/10 rounded-lg pl-10 pr-10 py-2 text-white focus:outline-none focus:border-neon-green transition-colors"
            >
              <option value="All" className="bg-black">All Roles</option>
              <option value="R5" className="bg-black">R5 (Leader)</option>
              <option value="R4" className="bg-black">R4 (Officer)</option>
              <option value="R3" className="bg-black">R3 (Veteran)</option>
              <option value="R2" className="bg-black">R2 (Member)</option>
              <option value="R1" className="bg-black">R1 (Recruit)</option>
            </select>
          </div>
        </motion.div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 border-4 border-neon-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-xl text-gray-400 font-cyber">DECRYPTING ROSTER DATA...</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredMembers.map((member, index) => (
          <motion.div
            key={member._id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="glass-panel border border-white/10 rounded-xl overflow-hidden hover:border-neon-green/50 transition-all duration-300 group"
          >
            <div className="h-24 bg-gradient-to-r from-gray-900 to-black relative">
              <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 backdrop-blur rounded text-xs font-bold font-cyber border border-white/10">
                {member.country}
              </div>
              <div className="absolute -bottom-10 left-6">
                <div className="w-20 h-20 rounded-lg bg-black border-2 border-neon-green p-1 group-hover:glow-box transition-all">
                  <div className="w-full h-full bg-gray-800 rounded flex items-center justify-center">
                    <span className="font-cyber font-bold text-2xl text-gray-500">{member.inGameName.charAt(0)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-14 pb-6 px-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-white font-cyber truncate">{member.inGameName}</h3>
                  <p className="text-neon-green text-sm flex items-center gap-1">
                    {member.role === 'R5' && <Star className="w-3 h-3 fill-neon-green" />}
                    {member.role} • {member.rank}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                  <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                    <Zap className="w-3 h-3 text-yellow-500" /> Power
                  </div>
                  <div className="font-cyber font-bold">{member.power}</div>
                </div>
                <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                  <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                    <Target className="w-3 h-3 text-red-500" /> Kills
                  </div>
                  <div className="font-cyber font-bold">{member.kills}</div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      )}

      {!loading && filteredMembers.length === 0 && (
        <div className="text-center py-20">
          <Shield className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl text-gray-400">No members found matching your criteria.</h3>
        </div>
      )}
    </div>
  );
}
