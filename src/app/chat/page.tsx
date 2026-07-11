"use client";

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Image as ImageIcon, Smile, Settings, User } from 'lucide-react';

interface ChatUser {
  name: string;
  server: string;
  alliance: string;
  country: string;
}

interface ChatMessage {
  id: string;
  user: ChatUser;
  text: string;
  timestamp: string;
}

export default function Chat() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [user, setUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [showWelcome, setShowWelcome] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [formName, setFormName] = useState("");
  const [formServer, setFormServer] = useState("");
  const [formAlliance, setFormAlliance] = useState("");
  const [formCountry, setFormCountry] = useState("");

  useEffect(() => {
    const savedUser = localStorage.getItem('hos_chat_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setShowWelcome(false);
      initSocket(JSON.parse(savedUser));
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  const initSocket = (userData: ChatUser) => {
    const newSocket = io(window.location.origin, {
        path: '/socket.io',
        transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      newSocket.emit('join', userData);
    });

    newSocket.on('receive_message', (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
      setTimeout(scrollToBottom, 100);
    });

    setSocket(newSocket);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formServer || !formAlliance) return;

    const newUser = {
      name: formName,
      server: formServer,
      alliance: formAlliance,
      country: formCountry || "Global",
    };

    localStorage.setItem('hos_chat_user', JSON.stringify(newUser));
    setUser(newUser);
    setShowWelcome(false);
    initSocket(newUser);
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !socket || !user) return;

    const msg = {
      user,
      text: inputText,
    };

    socket.emit('send_message', msg);
    setInputText("");
  };

  if (showWelcome) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md pt-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md glass-panel p-8 rounded-2xl border border-neon-green/30 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neon-green to-transparent"></div>

          <h2 className="text-3xl font-cyber font-bold text-center mb-2">IDENTIFICATION REQUIRED</h2>
          <p className="text-gray-400 text-center text-sm mb-8">Secure Alliance Communication Channel</p>

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-xs font-cyber text-neon-green mb-1 tracking-wider uppercase">In-Game Name</label>
              <input
                required
                value={formName}
                onChange={e => setFormName(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded px-4 py-2 focus:border-neon-green focus:outline-none transition-colors"
                placeholder="e.g. KingSlayer"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-cyber text-neon-green mb-1 tracking-wider uppercase">Server</label>
                <input
                  required
                  type="number"
                  value={formServer}
                  onChange={e => setFormServer(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded px-4 py-2 focus:border-neon-green focus:outline-none transition-colors"
                  placeholder="1895"
                />
              </div>
              <div>
                <label className="block text-xs font-cyber text-neon-green mb-1 tracking-wider uppercase">Alliance</label>
                <input
                  required
                  value={formAlliance}
                  onChange={e => setFormAlliance(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded px-4 py-2 focus:border-neon-green focus:outline-none transition-colors"
                  placeholder="HOS"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-cyber text-neon-green mb-1 tracking-wider uppercase">Country (Optional)</label>
              <input
                value={formCountry}
                onChange={e => setFormCountry(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded px-4 py-2 focus:border-neon-green focus:outline-none transition-colors"
                placeholder="US, UK, DE..."
              />
            </div>

            <button
              type="submit"
              className="w-full mt-6 bg-neon-green/10 hover:bg-neon-green/20 border border-neon-green text-neon-green font-bold font-cyber py-3 rounded transition-all hover:shadow-[0_0_15px_rgba(0,255,102,0.3)] tracking-widest"
            >
              INITIALIZE CONNECTION
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-4 px-4 max-w-6xl mx-auto h-screen flex flex-col">
      <div className="flex-1 glass-panel border border-white/10 rounded-xl overflow-hidden flex flex-col mb-2">
        {/* Chat Header */}
        <div className="bg-white/5 border-b border-white/10 p-4 flex justify-between items-center">
          <div>
            <h2 className="font-cyber font-bold text-xl flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse"></span>
              ALLIANCE COMMS
            </h2>
            <p className="text-xs text-gray-400">Server 1895 Encrypted Channel</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm border border-white/10 px-3 py-1 rounded bg-black/50">
              <User className="w-4 h-4 text-gray-400" />
              <span className="font-bold">{user?.name}</span>
              <span className="text-gray-500">[{user?.alliance}]</span>
            </div>
            <button className="text-gray-400 hover:text-white transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="text-center my-4">
            <span className="text-xs text-gray-500 bg-black/50 px-3 py-1 rounded-full border border-white/5">
              Connection Established. End-to-end encryption enabled.
            </span>
          </div>

          <AnimatePresence>
            {messages.map((msg) => {
              const isMe = msg.user.name === user?.name && msg.user.server === user?.server;
              const isHOS = msg.user.alliance.toUpperCase() === 'HOS';

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-3xl ${isMe ? 'ml-auto' : 'mr-auto'}`}
                >
                  <div className="flex items-baseline gap-2 mb-1 px-1">
                    <span className={`text-sm font-bold font-cyber ${isHOS ? 'text-neon-green glow-text' : 'text-red-400'}`}>
                      {msg.user.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      [{msg.user.alliance}] S{msg.user.server}
                    </span>
                    <span className="text-xs text-gray-600 ml-2">
                      {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>

                  <div className={`px-4 py-2 rounded-2xl max-w-md break-words ${
                    isMe
                      ? 'bg-neon-green/20 border border-neon-green/30 text-white rounded-tr-none'
                      : 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-black/40 border-t border-white/10">
          <form onSubmit={sendMessage} className="flex gap-2">
            <button type="button" className="p-3 text-gray-400 hover:text-white transition-colors bg-white/5 rounded-lg border border-white/10">
              <ImageIcon className="w-5 h-5" />
            </button>
            <button type="button" className="p-3 text-gray-400 hover:text-white transition-colors bg-white/5 rounded-lg border border-white/10">
              <Smile className="w-5 h-5" />
            </button>
            <input
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Transmit message..."
              className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 focus:border-neon-green focus:outline-none transition-colors text-white"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="px-6 bg-neon-green text-black font-bold rounded-lg hover:bg-neon-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline font-cyber uppercase tracking-wider text-sm">Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
