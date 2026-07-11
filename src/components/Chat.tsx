"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Shield, User, Terminal } from "lucide-react";
import clsx from "clsx";

interface Message {
  id: string;
  user: string;
  text: string;
  isHos: boolean;
  timestamp: Date;
}

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", user: "VoidWalker", text: "Rally at coords 554, 892. Attack in 5.", isHos: true, timestamp: new Date() },
    { id: "2", user: "Gamer99", text: "Incoming from the east side!", isHos: false, timestamp: new Date() },
    { id: "3", user: "CrimsonBlade", text: "Hold the line. We don't yield.", isHos: true, timestamp: new Date() },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [hasIdentity, setHasIdentity] = useState(false);
  const [identity, setIdentity] = useState({ name: "", isHos: false });
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || !hasIdentity) return;

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        user: identity.name,
        text: inputValue,
        isHos: identity.isHos,
        timestamp: new Date(),
      },
    ]);
    setInputValue("");

    // Simulate bot response
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          user: "HOS_COMMAND",
          text: "Message received. Standby for orders.",
          isHos: true,
          timestamp: new Date(),
        },
      ]);
    }, 2000);
  };

  const handleIdentitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (identity.name.trim()) setHasIdentity(true);
  };

  return (
    <section id="chat" className="relative w-full py-24 bg-void-black px-4 sm:px-6 flex justify-center">
      <div className="w-full max-w-4xl bg-void-black/80 backdrop-blur-xl border border-imperial-gold/20 rounded-sm overflow-hidden flex flex-col h-[600px] shadow-[0_0_30px_rgba(0,0,0,0.8)] relative z-10">

        {/* Header */}
        <div className="bg-gradient-to-r from-void-black via-blood-crimson/20 to-void-black border-b border-imperial-gold/20 p-4 flex items-center gap-4">
          <Terminal className="w-6 h-6 text-imperial-gold" />
          <div>
            <h3 className="font-cinzel text-xl text-white tracking-widest">Global Comms</h3>
            <p className="font-rajdhani text-ash-grey text-xs tracking-widest uppercase">Encrypted Channel 1895</p>
          </div>
        </div>

        {/* Identity Modal Overlay */}
        <AnimatePresence>
          {!hasIdentity && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 bg-void-black/90 backdrop-blur-md flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-[#111] border border-imperial-gold p-8 max-w-md w-full relative shadow-[0_0_30px_rgba(212,175,55,0.15)]"
                style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/dark-matter.png')" }}
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-void-black px-4">
                  <Shield className="w-10 h-10 text-imperial-gold" />
                </div>

                <h4 className="font-cinzel text-2xl text-center text-white mb-6 mt-4 tracking-widest">Identify Yourself</h4>

                <form onSubmit={handleIdentitySubmit} className="flex flex-col gap-6">
                  <div>
                    <label className="font-rajdhani text-ash-grey text-sm uppercase tracking-widest mb-2 block">Callsign (IGN)</label>
                    <input
                      type="text"
                      required
                      value={identity.name}
                      onChange={(e) => setIdentity({ ...identity, name: e.target.value })}
                      className="w-full bg-void-black border border-white/20 p-3 text-white font-rajdhani focus:outline-none focus:border-imperial-gold transition-colors"
                      placeholder="Enter your name..."
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isHos"
                      checked={identity.isHos}
                      onChange={(e) => setIdentity({ ...identity, isHos: e.target.checked })}
                      className="w-4 h-4 accent-blood-crimson"
                    />
                    <label htmlFor="isHos" className="font-rajdhani text-ash-grey text-sm uppercase tracking-widest cursor-pointer">
                      I am a member of HOS 1895
                    </label>
                  </div>

                  <button type="submit" className="w-full py-3 bg-blood-crimson hover:bg-blood-crimson-light text-white font-cinzel tracking-widest uppercase transition-colors">
                    Initialize Link
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-4" style={{ scrollbarWidth: 'thin' }}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="flex flex-col gap-1"
            >
              <div className="flex items-baseline gap-2">
                <span className={clsx(
                  "font-rajdhani font-bold tracking-wider text-sm sm:text-base",
                  msg.isHos ? "text-alliance-green [text-shadow:0_0_8px_rgba(57,255,20,0.5)]" : "text-rival-red [text-shadow:0_0_8px_rgba(255,46,46,0.5)]"
                )}>
                  {msg.isHos && "[HOS] "}{msg.user}
                </span>
                <span className="text-ash-grey/40 text-xs font-inter">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="font-inter text-ash-grey/90 text-sm sm:text-base pl-2 border-l border-white/10">{msg.text}</p>
            </motion.div>
          ))}

          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-ash-grey/50 font-rajdhani text-sm pl-2 mt-2"
            >
              HOS_COMMAND is typing
              <span className="flex gap-1">
                <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0 }} className="w-1.5 h-1.5 bg-ember-orange rounded-full" />
                <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }} className="w-1.5 h-1.5 bg-ember-orange rounded-full" />
                <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }} className="w-1.5 h-1.5 bg-ember-orange rounded-full" />
              </span>
            </motion.div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-void-black/90 border-t border-imperial-gold/20">
          <form onSubmit={handleSend} className="flex items-center gap-3">
            <User className={clsx(
              "w-6 h-6 hidden sm:block",
              identity.isHos ? "text-alliance-green" : "text-ash-grey"
            )} />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Transmit message..."
              disabled={!hasIdentity}
              className="flex-1 bg-white/5 border border-white/10 focus:border-imperial-gold px-4 py-3 text-white font-inter text-sm rounded-sm outline-none transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!hasIdentity || !inputValue.trim()}
              className="p-3 bg-blood-crimson hover:bg-blood-crimson-light text-white rounded-sm transition-colors disabled:opacity-50 disabled:hover:bg-blood-crimson"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
