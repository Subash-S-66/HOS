"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, X, Send, Bot } from "lucide-react";

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ id: string; text: string; isBot: boolean }[]>([
    { id: "0", text: "Identify yourself. Are you friend or foe of 1895?", isBot: true },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { id: Date.now().toString(), text: input, isBot: false }]);
    setInput("");

    // Simple bot logic
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), text: "Transmission received. The Vanguard will review your intel.", isBot: true },
      ]);
    }, 1000);
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {!isOpen && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              onClick={() => setIsOpen(true)}
              className="relative group p-4 bg-void-black border-2 border-imperial-gold rounded-full shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:shadow-[0_0_25px_rgba(212,175,55,0.6)] transition-shadow duration-300"
            >
              <div className="absolute inset-0 rounded-full animate-pulse-glow opacity-50 pointer-events-none" />
              <Shield className="w-8 h-8 text-imperial-gold group-hover:scale-110 transition-transform" />
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9, originX: 1, originY: 1 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="absolute bottom-0 right-0 w-[350px] sm:w-[400px] h-[500px] bg-void-black/95 backdrop-blur-xl border border-imperial-gold/30 flex flex-col shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-void-black via-imperial-gold/10 to-void-black p-4 flex items-center justify-between border-b border-imperial-gold/20">
                <div className="flex items-center gap-3">
                  <Bot className="w-6 h-6 text-imperial-gold" />
                  <span className="font-cinzel text-white tracking-widest font-bold">HOS ORACLE</span>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-ash-grey hover:text-blood-crimson transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4" style={{ scrollbarWidth: 'thin' }}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.isBot ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 text-sm font-inter ${
                        msg.isBot
                          ? "bg-white/5 border border-imperial-gold/30 text-ash-grey rounded-tr-xl rounded-br-xl rounded-bl-xl"
                          : "bg-blood-crimson/20 border border-blood-crimson/30 text-white rounded-tl-xl rounded-bl-xl rounded-tr-xl"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-imperial-gold/20 bg-void-black">
                <form onSubmit={handleSend} className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask the Oracle..."
                    className="flex-1 bg-white/5 border border-white/10 focus:border-imperial-gold px-3 py-2 text-white font-inter text-sm outline-none transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className="p-2 bg-imperial-gold/20 hover:bg-imperial-gold/40 border border-imperial-gold/50 text-imperial-gold transition-colors disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
