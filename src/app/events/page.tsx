"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, Users } from 'lucide-react';

export default function Events() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/events')
      .then(res => res.json())
      .then(data => {
        setEvents(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load events", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 md:px-8 max-w-5xl mx-auto">
      <div className="text-center mb-16">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl sm:text-4xl md:text-6xl font-cyber font-bold text-white mb-4"
        >
          DIRECTIVES & <span className="text-neon-green glow-text">OPERATIONS</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-gray-400 max-w-2xl mx-auto"
        >
          Upcoming tactical engagements and mandatory alliance events.
        </motion.p>
      </div>

      <div className="space-y-6">
        {loading ? (
           <div className="text-center py-20">
             <div className="w-16 h-16 border-4 border-neon-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
             <h3 className="text-xl text-gray-400 font-cyber">DECRYPTING DIRECTIVES...</h3>
           </div>
        ) : (
          events.map((event, i) => (
          <motion.div
            key={event._id || i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-panel border border-white/10 rounded-xl p-6 md:p-8 flex flex-col md:flex-row gap-8 hover:border-neon-green/30 transition-all group"
          >
            {/* Date Block */}
            <div className="flex-shrink-0 w-full md:w-48 bg-black/50 rounded-lg p-6 border border-white/5 flex flex-col items-center justify-center text-center">
              <CalendarIcon className="text-neon-green w-8 h-8 mb-2" />
              <div className="font-bold text-lg mb-1">{new Date(event.startDate).toLocaleDateString()}</div>
              <div className="text-sm text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {new Date(event.startDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </div>
            </div>

            {/* Event Info */}
            <div className="flex-grow">
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-2xl font-bold font-cyber group-hover:text-neon-green transition-colors">{event.title}</h2>
                <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-wider text-gray-300">
                  {event.type || 'Operation'}
                </span>
              </div>

              <p className="text-gray-400 mb-6">{event.description}</p>

              <div className="flex flex-wrap gap-6 items-center">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Users className="w-4 h-4 text-neon-green" />
                  <span className="font-bold">{event.participants?.length || 0}</span> Registered
                </div>

                <div className="flex-grow"></div>

                <button className={`px-6 py-2 rounded font-bold uppercase tracking-wider text-sm transition-all ${
                  event.status === 'registration' || event.status === 'upcoming'
                    ? 'bg-neon-green text-black hover:bg-neon-green/80 shadow-[0_0_15px_rgba(0,255,102,0.3)]'
                    : 'border border-neon-green text-neon-green hover:bg-neon-green/10'
                }`}>
                  {event.status === 'registration' || event.status === 'upcoming' ? 'Register Now' : 'View Details'}
                </button>
              </div>
            </div>
          </motion.div>
        )))}
      </div>
    </div>
  );
}
