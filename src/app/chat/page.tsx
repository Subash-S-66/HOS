"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Send, Loader2, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { PageLoader } from "@/components/PageLoader";

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
const POLL_INTERVAL = 2500;

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
  const [sending, setSending] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Pagination states
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Time state for relative updates
  const [now, setNow] = useState(new Date());

  // Emoji picker state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Validation error state
  const [validationError, setValidationError] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLDivElement>(null);
  const hasLoadedInitial = useRef(false);
  const lastPollTimestamp = useRef<string | null>(null);

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
        const reversed = items.reverse();
        setMessages(reversed);
        if (reversed.length > 0) {
          lastPollTimestamp.current = reversed[reversed.length - 1].createdAt;
        }
        if (items.length < 50) {
          setHasMore(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load initial messages", err);
      })
      .finally(() => setInitialLoading(false));
  }, []);

  // 4. Register profile with server via REST
  useEffect(() => {
    if (!profile) return;

    api("/chat/register", {
      method: "POST",
      body: JSON.stringify(profile),
    }).catch((err) => {
      if (err.message && err.message !== "Request failed") {
        localStorage.removeItem(profileKey);
        setProfile(null);
        setValidationError(err.message);
      }
    });
  }, [profile]);

  // 5. Poll for new messages every POLL_INTERVAL ms
  useEffect(() => {
    if (!profile) return;

    const pollMessages = async () => {
      const after = lastPollTimestamp.current;
      if (!after) return;

      try {
        const newMessages = await api<ChatMessage[]>(`/messages/poll?after=${encodeURIComponent(after)}`);
        if (newMessages.length > 0) {
          setMessages((current) => {
            const existingIds = new Set(current.map((m) => m._id));
            const unique = newMessages.filter((m) => !existingIds.has(m._id));
            if (unique.length === 0) return current;

            const nextList = [...current, ...unique];
            // Update the poll timestamp to the latest message
            lastPollTimestamp.current = unique[unique.length - 1].createdAt;
            return nextList.length > 500 ? nextList.slice(-500) : nextList;
          });

          // Auto-scroll if near bottom
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
        }
      } catch {
        // Silently retry on next poll
      }
    };

    const interval = setInterval(pollMessages, POLL_INTERVAL);
    return () => clearInterval(interval);
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

  const send = async (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || !profile || sending) return;

    setSending(true);
    setDraft("");

    try {
      const message = await api<ChatMessage>("/chat/message", {
        method: "POST",
        body: JSON.stringify({ ...profile, content: text }),
      });

      // Optimistically add the message to the list
      setMessages((current) => {
        const nextList = [...current, message];
        lastPollTimestamp.current = message.createdAt;
        return nextList.length > 500 ? nextList.slice(-500) : nextList;
      });

      // Scroll to bottom
      setTimeout(() => {
        const container = containerRef.current;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      }, 50);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Message could not be sent.";
      if (errorMsg === "Profile required" || errorMsg === "Invalid profile") {
        localStorage.removeItem(profileKey);
        setProfile(null);
      }
      setValidationError(errorMsg);
      setDraft(text); // Restore draft on failure
    } finally {
      setSending(false);
    }
  };

  if (initialLoading) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-4xl p-4 pt-20 sm:p-8 sm:pt-24">
        <PageLoader label="Connecting to Alliance Chat..." />
      </main>
    );
  }

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
        <span className="flex items-center gap-2 text-xs text-zinc-500">
          <span className="inline-block h-2 w-2 rounded-full bg-neon-green animate-pulse" />
          Live
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
            onChange={(e) => setDraft(e.target.value)}
            maxLength={1000}
            placeholder="Message the alliance…"
            className="min-w-0 flex-1 rounded-lg bg-black/30 px-3 py-2 outline-none focus:ring-1 focus:ring-neon-blue"
          />
          <button
            disabled={sending}
            className="rounded-lg bg-neon-blue/20 p-2 text-neon-blue ring-1 ring-neon-blue/50 disabled:opacity-50"
          >
            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
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
