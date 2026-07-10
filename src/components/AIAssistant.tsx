"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send } from "lucide-react";

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([
    { role: "ai", content: "Greetings, Commander. I am HOS AI. How can I assist you with alliance operations today?" }
  ]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setChatHistory([...chatHistory, { role: "user", content: message }]);
    const currentMessage = message;
    setMessage("");

    // Simulate AI typing delay
    setTimeout(() => {
      setChatHistory(prev => [
        ...prev,
        { role: "ai", content: `I have received your query regarding "${currentMessage}". The databanks are currently being updated, but HOS continues to dominate Server 1895.` }
      ]);
    }, 1000);
  };

  return (
    <>
      {/* Floating Holographic Orb (Trigger) */}
      <motion.button
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-6 right-6 z-40 w-16 h-16 rounded-full flex items-center justify-center bg-neon-purple/20 border-2 border-neon-purple shadow-[0_0_20px_#bc13fe] group overflow-hidden"
      >
        {/* Animated rings */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute inset-[-2px] border-[3px] border-transparent border-t-neon-blue border-b-neon-blue rounded-full opacity-70"
        />
        <MessageSquare className="w-8 h-8 text-neon-purple group-hover:text-white transition-colors relative z-10" />
      </motion.button>

      {/* Chatbot Interface */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 right-6 w-80 md:w-96 h-[500px] z-50 glass-panel rounded-2xl border border-neon-purple flex flex-col overflow-hidden shadow-[0_0_30px_rgba(188,19,254,0.3)]"
          >
            {/* Header */}
            <div className="p-4 border-b border-neon-purple/30 bg-black/40 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-neon-green shadow-[0_0_10px_#39ff14] animate-pulse" />
                <span className="font-bold text-neon-purple tracking-widest">HOS AI</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] p-3 rounded-xl ${
                    msg.role === "user"
                      ? "bg-neon-blue/20 border border-neon-blue/50 text-white rounded-br-none"
                      : "bg-black/60 border border-neon-purple/50 text-gray-200 rounded-bl-none"
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 border-t border-neon-purple/30 bg-black/40 flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask HOS AI..."
                className="flex-1 bg-black/50 border border-gray-700 rounded-lg px-4 py-2 text-white outline-none focus:border-neon-purple transition-colors"
              />
              <button
                type="submit"
                className="p-2 bg-neon-purple/20 text-neon-purple rounded-lg hover:bg-neon-purple hover:text-white transition-all border border-neon-purple"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
