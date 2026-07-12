"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Send, Users, Loader2, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api, socketUrl } from "@/lib/api";

type Profile = {
  gameName: string;
  serverNumber: string;
  allianceName: string;
};

type ChatMessage = {
  _id: string;
  content: string;
  createdAt: string;
  user: Profile;
};

const profileKey = "hos-chat-profile";

const EMOJIS = [
  "😊", "😂", "🤣", "👍", "🔥", "💯", "🎉", "❤️", "😍", "⚔️",
  "🛡️", "👑", "💪", "💀", "👀", "🙌", "👏", "🚀", "💥", "😎",
  "🤔", "😮", "😢", "😡", "😜", "👋", "🍻", "🍕", "🎮", "👾"
];

function color(user: Profile) {
  return user.serverNumber === "1895"
    ? user.allianceName.toLowerCase() === "hos"
      ? "text-neon-green"
      : "text-neon-blue"
    : "text-neon-red";
}

function formatRelativeTime(dateString: string, now: Date) {
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 10) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  return `${diffDay}d ago`;
}

export default function Page() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [online, setOnline] = useState(0);
  const [typing, setTyping] = useState("");

  // Pagination states
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Time state for relative updates
  const [now, setNow] = useState(new Date());

  // Emoji picker state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Validation error state
  const [validationError, setValidationError] = useState("");

  const socket = useRef<Socket | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLDivElement>(null);
  const hasLoadedInitial = useRef(false);

  // 1. Update relative time stamps every 15 seconds
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(timer);
  }, []);

  // 2. Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiButtonRef.current && !emojiButtonRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 3. Load profile and first 50 messages
  useEffect(() => {
    const value = localStorage.getItem(profileKey);
    if (value) {
      try {
        setProfile(JSON.parse(value));
      } catch {
        localStorage.removeItem(profileKey);
      }
    }

    // Fetch initial 50 messages
    api<ChatMessage[]>("/messages?limit=50&skip=0")
      .then((items) => {
        setMessages(items.reverse());
        if (items.length < 50) {
          setHasMore(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load initial messages", err);
      });
  }, []);

  // 4. Setup socket listeners
  useEffect(() => {
    if (!profile || !socketUrl) return;

    const instance = io(socketUrl, { transports: ["websocket"] });
    socket.current = instance;

    const emitProfile = () => {
      instance.emit("profile", profile, (res: { ok: boolean; error?: string }) => {
        if (res && !res.ok) {
          localStorage.removeItem(profileKey);
          setProfile(null);
          if (res.error) {
            setValidationError(res.error);
          }
        }
      });
    };

    if (instance.connected) {
      emitProfile();
    }
    instance.on("connect", emitProfile);

    instance.on("online-users", setOnline);

    instance.on("typing", (event: { name: string; typing: boolean }) => {
      setTyping(event.typing ? `${event.name} is typing…` : "");
    });

    return () => {
      instance.disconnect();
    };
  }, [profile]);

  // 5. Handle incoming socket messages and scroll correctly
  useEffect(() => {
    if (!socket.current) return;

    const handleNewMessage = (message: ChatMessage) => {
      setMessages((current) => {
        const nextList = [...current, message];
        if (nextList.length > 500) {
          return nextList.slice(-500);
        }
        return nextList;
      });

      // Scroll to bottom if user is close to bottom
      setTimeout(() => {
        const container = containerRef.current;
        if (container) {
          const isNearBottom =
            container.scrollHeight - container.clientHeight - container.scrollTop < 250;
          if (isNearBottom) {
            container.scrollTop = container.scrollHeight;
          }
        }
      }, 50);
    };

    socket.current.on("message", handleNewMessage);
    return () => {
      socket.current?.off("message", handleNewMessage);
    };
  }, [profile]);

  // 6. Scroll to bottom on initial loaded batch
  useEffect(() => {
    if (profile && messages.length > 0 && !hasLoadedInitial.current) {
      const container = containerRef.current;
      if (container) {
        container.scrollTop = container.scrollHeight;
        setTimeout(() => {
          hasLoadedInitial.current = true;
        }, 300);
      }
    }
  }, [messages, profile]);

  // 7. Pagination scroll trigger function
  const loadMore = async () => {
    if (!hasLoadedInitial.current || !hasMore || loadingMore || messages.length >= 500) return;
    setLoadingMore(true);

    const container = containerRef.current;
    const prevScrollHeight = container ? container.scrollHeight : 0;
    const prevScrollTop = container ? container.scrollTop : 0;

    try {
      const skip = messages.length;
      const limit = Math.min(50, 500 - messages.length);
      const oldItems = await api<ChatMessage[]>(`/messages?limit=${limit}&skip=${skip}`);

      if (oldItems.length === 0) {
        setHasMore(false);
        setLoadingMore(false);
        return;
      }

      if (oldItems.length < 50 || (messages.length + oldItems.length) >= 500) {
        setHasMore(false);
      }

      setMessages((current) => [...oldItems.reverse(), ...current]);

      // Maintain scroll position after prepending items to prevent screen jump
      setTimeout(() => {
        if (container) {
          const heightDiff = container.scrollHeight - prevScrollHeight;
          container.scrollTop = prevScrollTop + heightDiff;
        }
        setLoadingMore(false);
      }, 50);
    } catch (error) {
      console.error("Failed to load more messages", error);
      setLoadingMore(false);
    }
  };

  const handleScroll = () => {
    const container = containerRef.current;
    if (container && hasLoadedInitial.current && container.scrollTop <= 15) {
      void loadMore();
    }
  };

  const saveProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const gameName = String(form.get("gameName")).trim();
    const serverNumber = String(form.get("serverNumber")).trim();
    const allianceName = String(form.get("allianceName")).trim();

    if (!gameName || !serverNumber || !allianceName) return;

    // Validate server number is a number with a maximum of 4 digits
    if (!/^\d{1,4}$/.test(serverNumber)) {
      setValidationError("Server number must be a number with a maximum of 4 digits.");
      return;
    }

    // Validate alliance name is exactly 3 letters
    if (!/^[a-zA-Z]{3}$/.test(allianceName)) {
      setValidationError("Alliance name must be exactly 3 letters (e.g. 'HOS').");
      return;
    }

    const next = { gameName, serverNumber, allianceName };
    localStorage.setItem(profileKey, JSON.stringify(next));
    setProfile(next);
  };

  const send = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.trim()) return;
    socket.current?.emit("message", draft.trim(), (result: { ok: boolean; error?: string }) => {
      if (!result.ok) {
        if (result.error === "Profile required" || result.error === "Invalid profile") {
          localStorage.removeItem(profileKey);
          setProfile(null);
        }
        setValidationError(result.error || "Message could not be sent.");
      }
    });
    setDraft("");
  };

  if (!profile) {
    return (
      <main className="grid min-h-screen place-items-center p-4">
        <form onSubmit={saveProfile} className="glass-panel w-full max-w-md rounded-2xl p-6">
          <h1 className="text-2xl font-bold text-white">Join alliance chat</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Your profile and chat activity are saved to alliance records.
          </p>
          {[
            ["Game Name", "gameName"],
            ["Server Number", "serverNumber"],
            ["Alliance Name", "allianceName"],
          ].map(([label, name]) => (
            <label key={name} className="mt-4 block text-sm text-zinc-300">
              {label}
              <input
                name={name}
                required
                maxLength={name === "serverNumber" ? 4 : name === "allianceName" ? 3 : 40}
                placeholder={
                  name === "serverNumber"
                    ? "e.g. 1895"
                    : name === "allianceName"
                    ? "e.g. HOS"
                    : "e.g. Commander"
                }
                pattern={name === "serverNumber" ? "\\d{1,4}" : name === "allianceName" ? "[A-Za-z]{3}" : undefined}
                title={
                  name === "serverNumber"
                    ? "Must be a number with at most 4 digits"
                    : name === "allianceName"
                    ? "Must be exactly 3 letters"
                    : undefined
                }
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 outline-none focus:border-neon-blue"
              />
            </label>
          ))}
          <button className="mt-6 w-full rounded-lg bg-neon-blue/20 py-3 font-bold text-neon-blue ring-1 ring-neon-blue/50 hover:bg-neon-blue hover:text-black">
            Enter chat
          </button>
        </form>

        {/* Dynamic pop-up modal for validation errors */}
        <AnimatePresence>
          {validationError && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-panel w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-red-500/40 text-center"
              >
                <AlertTriangle className="mx-auto text-red-500 mb-3 stroke-[1.5]" size={40} />
                <h3 className="text-lg font-bold text-white">System Warning</h3>
                <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
                  {validationError}
                </p>
                <button
                  type="button"
                  onClick={() => setValidationError("")}
                  className="mt-5 w-full rounded-lg bg-red-600 hover:bg-red-700 py-2.5 text-sm font-bold text-white transition active:scale-95"
                >
                  Dismiss
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col p-4 pt-20 sm:p-8 sm:pt-24">
      <header className="glass-panel flex items-center justify-between rounded-t-2xl px-5 py-4">
        <div>
          <h1 className="font-bold tracking-widest text-white">HOS CHAT</h1>
          <p className="text-xs text-zinc-400">Server 1895 communications</p>
        </div>
        <span className="flex items-center gap-2 text-sm text-neon-green">
          <Users size={15} />
          {online} online
        </span>
      </header>

      <section className="glass-panel flex min-h-0 flex-1 flex-col rounded-b-2xl">
        {/* Scrollable messages container */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="min-h-[55vh] max-h-[65vh] flex-1 space-y-4 overflow-y-auto p-5 scroll-smooth"
        >
          {loadingMore && (
            <div className="flex justify-center py-2">
              <Loader2 className="animate-spin h-5 w-5 text-neon-blue" />
            </div>
          )}
          
          {messages.map((message) => (
            <article key={message._id}>
              <div className="flex items-baseline gap-2">
                <strong className={color(message.user)}>{message.user.gameName}</strong>
                <span className="text-xs text-zinc-500">
                  [{message.user.allianceName.slice(0, 3).toUpperCase()}] ·{" "}
                  {formatRelativeTime(message.createdAt, now)}
                </span>
              </div>
              <p className="mt-1 break-words text-sm text-zinc-200">{message.content}</p>
            </article>
          ))}
        </div>

        <p className="h-5 px-5 text-xs text-zinc-500">{typing}</p>
        
        <form onSubmit={send} className="flex gap-2 border-t border-white/10 p-3 relative">
          <div ref={emojiButtonRef} className="relative flex items-center">
            <button
              type="button"
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              className="rounded px-2 text-lg hover:bg-white/5 transition h-full flex items-center justify-center"
            >
              😊
            </button>
            
            {showEmojiPicker && (
              <div className="absolute bottom-12 left-0 z-50 w-64 rounded-xl border border-white/10 bg-zinc-950/95 p-3 shadow-2xl backdrop-blur-md">
                <div className="grid grid-cols-6 gap-2">
                  {EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        setDraft((prev) => prev + emoji);
                      }}
                      className="text-xl p-1 hover:bg-white/10 rounded transition active:scale-90"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <input
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              socket.current?.emit("typing", true);
              if (typingTimer.current) clearTimeout(typingTimer.current);
              typingTimer.current = setTimeout(() => socket.current?.emit("typing", false), 800);
            }}
            maxLength={1000}
            placeholder="Message the alliance…"
            className="min-w-0 flex-1 rounded-lg bg-black/30 px-3 py-2 outline-none focus:ring-1 focus:ring-neon-blue"
          />
          <button className="rounded-lg bg-neon-blue/20 p-2 text-neon-blue ring-1 ring-neon-blue/50">
            <Send size={18} />
          </button>
        </form>
      </section>

      {/* Dynamic pop-up modal for validation errors in chat view */}
      <AnimatePresence>
        {validationError && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-red-500/40 text-center"
            >
              <AlertTriangle className="mx-auto text-red-500 mb-3 stroke-[1.5]" size={40} />
              <h3 className="text-lg font-bold text-white">System Warning</h3>
              <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
                {validationError}
              </p>
              <button
                type="button"
                onClick={() => setValidationError("")}
                className="mt-5 w-full rounded-lg bg-red-600 hover:bg-red-700 py-2.5 text-sm font-bold text-white transition active:scale-95"
              >
                Dismiss
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
