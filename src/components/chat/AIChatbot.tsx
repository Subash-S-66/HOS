"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Terminal } from 'lucide-react';

interface ChatMsg {
  role: 'bot' | 'user';
  text: string;
}

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: 'bot', text: 'Initializing HOS Tactical AI... Online. How can I assist you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsTyping(true);

    try {
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userText })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: 'bot', text: data.response }]);
      } else {
        setMessages(prev => [...prev, { role: 'bot', text: "Systems offline. Unable to connect to main AI core." }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: "Communication error. Connection lost." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-8 left-8 z-50 w-14 h-14 bg-black border border-neon-green rounded-full flex items-center justify-center text-neon-green hover:bg-neon-green/10 hover:scale-110 transition-all shadow-[0_0_20px_rgba(0,255,102,0.3)] group"
          >
            <Bot className="w-7 h-7 group-hover:animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-8 left-8 z-50 w-80 sm:w-96 h-[500px] glass-panel border border-neon-green/30 rounded-2xl flex flex-col overflow-hidden shadow-[0_0_30px_rgba(0,255,102,0.15)]"
          >
            <div className="bg-black/60 border-b border-white/10 p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Terminal className="text-neon-green w-5 h-5" />
                <h3 className="font-cyber font-bold text-white text-sm tracking-wider">H.O.S. A.I. SYSTEM</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/40">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-lg p-3 text-sm ${
                    msg.role === 'user'
                      ? 'bg-neon-green/20 border border-neon-green/30 text-white rounded-tr-none'
                      : 'bg-white/5 border border-white/10 text-gray-300 rounded-tl-none font-mono text-xs'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 rounded-lg p-3 rounded-tl-none">
                    <span className="flex gap-1">
                      <span className="w-2 h-2 bg-neon-green rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-neon-green rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                      <span className="w-2 h-2 bg-neon-green rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 bg-black/60 border-t border-white/10">
              <form onSubmit={handleSend} className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question..."
                  className="flex-1 bg-black/50 border border-white/10 rounded px-3 py-2 text-sm focus:border-neon-green focus:outline-none transition-colors text-white"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="bg-neon-green/20 border border-neon-green text-neon-green p-2 rounded hover:bg-neon-green hover:text-black transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
