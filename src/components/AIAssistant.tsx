"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  "About HOS": "House of Spanking (HOS) is a top alliance on Server 1895. We work together to win events, guide server strategies, and coordinate attack and defense plans during Server vs Server (SvS) wars. Our goal is absolute victory and fun!",
  "Home Page": "Our home page is the main dashboard for our alliance. Here you can find out about HOS, see our current server milestones, look at featured players, and easily access all other sections of our site.",
  "Chat Room": "Our Chat room is where alliance members can talk in real-time. It's a secure place to chat about game tactics, share coordinates, or just hang out and get to know fellow commanders.",
  "Events": "The Events page lists all our scheduled alliance events, matches, and rallies. It has automatic countdown timers so you know exactly when an event starts, no matter what timezone you live in.",
  "Gallery": "The Gallery is where members share screenshots. You can upload and view images of epic battle reports, base designs, and fun community moments.",
  "Join Us": "The Join Us page is our recruitment form. If you want to join HOS, just fill in your details (like player name, server, and power level) here, and our leaders will review it.",
  "Members": "The Members page lists our active roster. You can see who is in the alliance, check their server and rank, and see when they were last online.",
  "SVS History": "The SVS History page is our archive of Server vs. Server campaigns. You can check out past scores, see how our server performed, and access links to old battle records.",
  "Tools": "The Tools page is a helpful collection of calculators. We build tools here to help players optimize resource use, plan troop training, and calculate power upgrades.",
  "Youtube": "Check out our official YouTube channel! We stream our battlefield fights and Server vs Server (SvS) matches here."
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

  const chatEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch historical assistant messages
  useEffect(() => {
    if (!sessionId) return;

    api<Array<AssistantRow>>(`/assistant/messages?sessionId=${encodeURIComponent(sessionId)}&limit=80`)
      .then((items) => {
        if (!items.length) return;
        setChatHistory(items.map((item) => ({ role: item.role, content: item.content })));
      })
      .catch(() => {});
  }, [sessionId]);

  // 2. Scroll to bottom whenever history updates or chat opens
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isOpen]);

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
        : `I have received your query regarding "${text}". The databanks are currently being updated, try using quick messages for now.`;

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
        aria-label="Open AI Assistant"
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
              <button onClick={() => setIsOpen(false)} className="text-gray-400 transition-colors hover:text-white" aria-label="Close AI Assistant">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable messages container */}
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
              <div ref={chatEndRef} />
            </div>

            {/* Quick action default questions - scroll horizontally on mobile/tablet, wrap on desktop */}
            <div
              className="flex flex-nowrap overflow-x-auto gap-1.5 px-4 py-2 border-t border-neon-purple/10 bg-black/20 md:flex-wrap md:overflow-y-auto md:max-h-[96px]"
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
                aria-label="Send message"
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
