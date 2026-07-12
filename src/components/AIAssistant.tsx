"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send } from "lucide-react";
import { api } from "@/lib/api";

type ChatItem = {
  role: "user" | "ai";
  content: string;
};

type AssistantRow = {
  _id: string;
  role: "user" | "ai";
  content: string;
};

const QA_DATABASE = {
  "About HOS": "House of Spanking (HOS) is a premier, dominating alliance on Server 1895. Built for absolute victory, HOS oversees server-wide operations, guides command strategies, and coordinates defensive and offensive operations during critical events like Server-vs-Server (SvS) battles.",
  "Home Page": "The Landing Page (/) serves as the main command terminal for the alliance. It introduces HOS, spotlights featured recruits and activities, displays current server milestones, and links out to all tactical alliance databases.",
  "Chat Room": "The Chat Page (/chat) is a real-time communications terminal. Utilizing WebSockets, it allows all registered commanders to chat securely and instantaneously about tactics, alerts, and coordinates.",
  "Events": "The Events Page (/events) lists scheduled alliance matches, campaigns, and rallies. It features dynamic countdown timers synced to UTC, helping players coordinate times accurately across global timezones.",
  "Gallery": "The Gallery Page (/gallery) is our historical visual archive. Commanders upload and share screenshots of epic battles, war reports, base architectures, and memorable community moments.",
  "Join Us": "The Join Page (/join) hosts our recruitment portal. Prospective members submit details about their power metrics and servers, which are saved in the system database for recruiter review.",
  "Leaderboard": "The Leaderboard Page (/leaderboard) ranks alliance members based on performance metrics, power levels, contributions, and historical battle rankings to foster competitive growth.",
  "Members": "The Members Page (/members) lists the active alliance roster. It shows commander IDs, server numbers, ranks, and tracks their 'last seen online' status to manage activity levels.",
  "SVS History": "The SVS History Page (/svs-history) archives Server vs. Server campaigns. It records scores, outcomes, and provides historical battle log links for Server 1895.",
  "Tools": "The Tools Page (/tools) is a utility hub. It features specialized calculators and tools designed to optimize resource usage, troop training ratios, and battle power scaling.",
  "War Planner": "The War Page (/war) represents our tactical battle map. Roster leaders post target coordinates, squad paths, and strategic plans to outline clear operations instructions."
};

const initialMessage: ChatItem = {
  role: "ai",
  content: "Greetings, Commander. I am HOS AI. Underneath are some quick links to learn about our alliance pages. How can I assist you with alliance operations today?",
};

const sessionKey = "hos-ai-session-id";

const getSessionId = () => {
  if (typeof window === "undefined") return "";
  const existing = window.localStorage.getItem(sessionKey);
  if (existing) return existing;
  const created = `hos-${crypto.randomUUID()}`;
  window.localStorage.setItem(sessionKey, created);
  return created;
};

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatItem[]>([initialMessage]);
  const [sessionId] = useState(getSessionId);

  useEffect(() => {
    if (!sessionId) return;

    api<Array<AssistantRow>>(`/assistant/messages?sessionId=${encodeURIComponent(sessionId)}&limit=80`)
      .then((items) => {
        if (!items.length) return;
        setChatHistory(items.map((item) => ({ role: item.role, content: item.content })));
      })
      .catch(() => {});
  }, [sessionId]);

  const persist = (entry: ChatItem) => {
    if (!sessionId) return;
    void api("/assistant/messages", {
      method: "POST",
      body: JSON.stringify({
        sessionId,
        role: entry.role,
        content: entry.content,
      }),
    }).catch(() => {});
  };

  const askQuestion = (question: keyof typeof QA_DATABASE) => {
    const userEntry: ChatItem = { role: "user", content: question };
    setChatHistory((current) => [...current, userEntry]);
    persist(userEntry);

    window.setTimeout(() => {
      const answer = QA_DATABASE[question];
      const aiEntry: ChatItem = { role: "ai", content: answer };
      setChatHistory((current) => [...current, aiEntry]);
      persist(aiEntry);
    }, 600);
  };

  const handleSend = (event: React.FormEvent) => {
    event.preventDefault();
    const text = message.trim();
    if (!text) return;

    const userEntry: ChatItem = { role: "user", content: text };
    setChatHistory((current) => [...current, userEntry]);
    persist(userEntry);
    setMessage("");

    window.setTimeout(() => {
      const matchedKey = Object.keys(QA_DATABASE).find(
        (key) => key.toLowerCase() === text.toLowerCase() || text.toLowerCase().includes(key.toLowerCase())
      );
      const reply = matchedKey
        ? QA_DATABASE[matchedKey as keyof typeof QA_DATABASE]
        : `I have received your query regarding "${text}". The databanks are currently being updated, but HOS continues to dominate Server 1895.`;

      const aiEntry: ChatItem = { role: "ai", content: reply };
      setChatHistory((current) => [...current, aiEntry]);
      persist(aiEntry);
    }, 700);
  };

  const renderedHistory = useMemo(() => chatHistory.slice(-120), [chatHistory]);

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-6 right-6 z-40 h-16 w-16 overflow-hidden rounded-full border-2 border-neon-purple bg-neon-purple/20 shadow-[0_0_20px_#bc13fe]"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute -inset-0.5 rounded-full border-[3px] border-transparent border-b-neon-blue border-t-neon-blue opacity-70"
        />
        <MessageSquare className="relative z-10 mx-auto h-8 w-8 text-neon-purple transition-colors group-hover:text-white" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="glass-panel fixed bottom-24 right-4 z-50 flex h-[min(500px,calc(100vh-8rem))] w-[calc(100vw-2rem)] max-w-96 flex-col overflow-hidden rounded-2xl border border-neon-purple shadow-[0_0_30px_rgba(188,19,254,0.3)] sm:right-6"
          >
            <div className="flex items-center justify-between border-b border-neon-purple/30 bg-black/40 p-4">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 animate-pulse rounded-full bg-neon-green shadow-[0_0_10px_#39ff14]" />
                <span className="font-bold tracking-widest text-neon-purple">HOS AI</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 transition-colors hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
              {renderedHistory.map((msg, index) => (
                <div key={`${msg.role}-${index}`} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-xl p-3 ${
                      msg.role === "user"
                        ? "rounded-br-none border border-neon-blue/50 bg-neon-blue/20 text-white"
                        : "rounded-bl-none border border-neon-purple/50 bg-black/60 text-gray-200"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick action default questions */}
            <div 
              className="flex gap-1.5 overflow-x-auto px-4 py-2 border-t border-neon-purple/10 bg-black/20"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {Object.keys(QA_DATABASE).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => askQuestion(key as keyof typeof QA_DATABASE)}
                  className="flex-shrink-0 rounded-full border border-neon-purple/30 bg-neon-purple/5 px-3 py-1 text-[11px] font-semibold text-neon-purple transition hover:bg-neon-purple/20 hover:text-white"
                >
                  {key}
                </button>
              ))}
            </div>

            <form onSubmit={handleSend} className="flex gap-2 border-t border-neon-purple/30 bg-black/40 p-4">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask HOS AI..."
                className="flex-1 rounded-lg border border-gray-700 bg-black/50 px-4 py-2 text-white outline-none transition-colors focus:border-neon-purple"
                maxLength={2000}
              />
              <button
                type="submit"
                className="rounded-lg border border-neon-purple bg-neon-purple/20 p-2 text-neon-purple transition-all hover:bg-neon-purple hover:text-white"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
