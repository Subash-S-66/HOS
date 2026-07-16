"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Clock, Users, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { EventCountdown, ParticipationCountdown } from "@/components/EventCountdown";
import { PageLoader } from "@/components/PageLoader";

type Event = {
  _id: string;
  title: string;
  description: string;
  date: string;
  startsAt?: string;
  endsAt?: string;
  votingEnabled?: boolean;
  participationOpensAt?: string;
  participationClosesAt?: string;
  votingEndsBeforeMinutes?: number;
  maxParticipants?: number | null;
  color?: string;
  participants?: Array<{ gameName: string }>;
};

type ParticipantProfile = { participantId: string; gameName: string };
const participantProfileKey = "hos-event-participant";
const participatingEventsKey = "hos-event-participation";

export default function Page() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [joinEvent, setJoinEvent] = useState<Event | null>(null);
  const [gameName, setGameName] = useState("");
  const [participatingEventIds, setParticipatingEventIds] = useState<string[]>([]);
  const [participationLoadingId, setParticipationLoadingId] = useState<string | null>(null);
  const [participationError, setParticipationError] = useState("");
  const [unjoinEvent, setUnjoinEvent] = useState<Event | null>(null);
  const [successAnimation, setSuccessAnimation] = useState<{ type: "join" | "leave"; title: string } | null>(null);

  const refreshEvents = async () => {
    try {
      const data = await api<Event[]>("/events");
      setEvents(data);
    } catch {
      // The existing event list remains visible if a background refresh fails.
    }
  };

  useEffect(() => {
    refreshEvents()
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => void refreshEvents(), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    try {
      const profile = JSON.parse(localStorage.getItem(participantProfileKey) || "null") as ParticipantProfile | null;
      if (profile?.participantId && profile.gameName) setGameName(profile.gameName);
      const ids = JSON.parse(localStorage.getItem(participatingEventsKey) || "[]");
      if (Array.isArray(ids)) setParticipatingEventIds(ids.filter((id): id is string => typeof id === "string"));
    } catch {
      localStorage.removeItem(participantProfileKey);
      localStorage.removeItem(participatingEventsKey);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const visibleEvents = events
    .filter((event) => !event.endsAt || new Date(event.endsAt).getTime() > now)
    .sort((a, b) => {
      const aTime = new Date(a.date || a.startsAt || "").getTime();
      const bTime = new Date(b.date || b.startsAt || "").getTime();
      return aTime - bTime;
    });

  const getProfile = (): ParticipantProfile => {
    const saved = JSON.parse(localStorage.getItem(participantProfileKey) || "null") as ParticipantProfile | null;
    if (saved?.participantId && saved.gameName) return saved;
    const profile = { participantId: crypto.randomUUID(), gameName: gameName.trim() };
    localStorage.setItem(participantProfileKey, JSON.stringify(profile));
    return profile;
  };

  const setParticipation = async (event: Event, action: "join" | "leave") => {
    setParticipationLoadingId(event._id);
    setParticipationError("");
    try {
      const profile = getProfile();
      const updated = await api<Event>(`/events/${event._id}/participation`, {
        method: "POST",
        body: JSON.stringify({ action, participantId: profile.participantId, gameName: profile.gameName }),
      });
      setEvents((current) => current.map((item) => item._id === updated._id ? updated : item));
      if (selectedEvent?._id === updated._id) setSelectedEvent(updated);
      setParticipatingEventIds((current) => {
        const next = action === "join" ? [...new Set([...current, event._id])] : current.filter((id) => id !== event._id);
        localStorage.setItem(participatingEventsKey, JSON.stringify(next));
        return next;
      });
      setJoinEvent(null);
      setSuccessAnimation({
        type: action,
        title: action === "join" ? "Participating!" : "Removed!"
      });
      setTimeout(() => {
        setSuccessAnimation(null);
      }, 1200);
    } catch (error) {
      setParticipationError(error instanceof Error ? error.message : "Unable to update participation.");
    } finally {
      setParticipationLoadingId(null);
    }
  };

  const handleParticipate = (event: Event) => {
    if (event.participationOpensAt && new Date(event.participationOpensAt).getTime() > Date.now()) {
      setParticipationError(`Participation opens ${new Date(event.participationOpensAt).toLocaleString()}.`);
      return;
    }
    if (participatingEventIds.includes(event._id)) {
      setUnjoinEvent(event);
      return;
    }
    if (gameName.trim()) {
      void setParticipation(event, "join");
      return;
    }
    setParticipationError("");
    setJoinEvent(event);
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl p-4 pt-20 sm:p-8 sm:pt-24">
      <div className="mb-9 text-center">
        <CalendarDays className="mx-auto text-neon-blue" />
        <h1 className="mt-3 text-3xl font-bold tracking-widest text-white">ALLIANCE EVENTS</h1>
        <p className="mt-2 text-sm text-zinc-400">Times automatically display in your local timezone.</p>
      </div>

      {loading ? (
        <PageLoader label="Accessing Alliance Events..." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visibleEvents.map((event) => {
            const start = new Date(event.date || event.startsAt || "");
            const closesAt = event.participationClosesAt ? new Date(event.participationClosesAt) : new Date(start.getTime() - (event.votingEndsBeforeMinutes || 0) * 60_000);
            const isClosed = now >= closesAt.getTime();
            const participationOpen = (!event.participationOpensAt || new Date(event.participationOpensAt).getTime() <= now) && !isClosed;
            return (
              <article
                key={event._id}
                onClick={() => event.votingEnabled && setSelectedEvent(event)}
                onMouseEnter={(e) => {
                  if (event.votingEnabled) {
                    e.currentTarget.style.borderColor = event.color || "#00f3ff";
                    e.currentTarget.style.boxShadow = `0 0 12px ${(event.color || "#00f3ff")}40`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (event.votingEnabled) {
                    e.currentTarget.style.borderColor = `${event.color || "#00f3ff"}40`;
                    e.currentTarget.style.boxShadow = "none";
                  }
                }}
                className={`glass-panel rounded-2xl p-6 transition-all duration-300 ${event.votingEnabled ? "cursor-pointer" : ""}`}
                style={{
                  borderColor: `${event.color || "#00f3ff"}40`,
                }}
              >
                <p className="text-xs font-bold" style={{ color: event.color || "#00f3ff" }}>
                  {start.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}
                </p>
                <h2 className="mt-2 text-xl font-bold text-white">{event.title}</h2>
                <p className="mt-2 text-sm text-zinc-400">{event.description}</p>
                <div className="mt-5">
                  <p className="flex items-center gap-2 text-sm text-zinc-200">
                    <Clock size={15} />
                    {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZoneName: "short" })}
                  </p>
                  <EventCountdown date={event.date || event.startsAt || ""} endsAt={event.endsAt} />
                </div>
                {event.votingEnabled && (
                  <>
                    <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                      <span className="flex items-center gap-1.5 text-xs text-zinc-300">
                        <Users size={15} />{" "}
                        {event.participants?.length || 0}
                        {event.maxParticipants ? ` / ${event.maxParticipants}` : ""}{" "}
                        participating
                      </span>
                      {!isClosed && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleParticipate(event); }}
                          disabled={participationLoadingId === event._id || !participationOpen || (event.maxParticipants !== null && event.maxParticipants !== undefined && event.maxParticipants > 0 && (event.participants?.length || 0) >= event.maxParticipants && !participatingEventIds.includes(event._id))}
                          style={{
                            backgroundColor: `${event.color || "#00f3ff"}15`,
                            color: event.color || "#00f3ff",
                            borderColor: `${event.color || "#00f3ff"}30`,
                          }}
                          onMouseEnter={(e) => {
                            const isFull = event.maxParticipants !== null && event.maxParticipants !== undefined && event.maxParticipants > 0 && (event.participants?.length || 0) >= event.maxParticipants && !participatingEventIds.includes(event._id);
                            if (participationOpen && participationLoadingId !== event._id && !isFull) {
                              e.currentTarget.style.backgroundColor = `${event.color || "#00f3ff"}25`;
                            }
                          }}
                          onMouseLeave={(e) => {
                            const isFull = event.maxParticipants !== null && event.maxParticipants !== undefined && event.maxParticipants > 0 && (event.participants?.length || 0) >= event.maxParticipants && !participatingEventIds.includes(event._id);
                            if (participationOpen && participationLoadingId !== event._id && !isFull) {
                              e.currentTarget.style.backgroundColor = `${event.color || "#00f3ff"}15`;
                            }
                          }}
                          className="rounded-lg border px-3 py-2 text-xs font-bold transition duration-200 disabled:opacity-50"
                        >
                          {participationLoadingId === event._id
                            ? "Saving..."
                            : !participationOpen
                              ? "Voting opens soon"
                              : participatingEventIds.includes(event._id)
                                ? "Unparticipate"
                                : (event.maxParticipants !== null && event.maxParticipants !== undefined && event.maxParticipants > 0 && (event.participants?.length || 0) >= event.maxParticipants)
                                  ? "Event Full"
                                  : "Participate"}
                        </button>
                      )}
                    </div>
                    {isClosed && <p className="mt-2 text-xs text-zinc-500">Participation closed {closesAt.toLocaleString()}.</p>}
                    {!participationOpen && !isClosed && event.participationOpensAt && <p className="mt-2 text-xs text-zinc-500">Participation opens {new Date(event.participationOpensAt).toLocaleString()}.</p>}
                    {participationOpen && (
                       <p className="mt-2 text-xs text-zinc-500">
                         Participation closes {closesAt.toLocaleString()} <ParticipationCountdown closesAt={closesAt} />.
                       </p>
                     )}
                  </>
                )}
              </article>
            );
          })}
          {!visibleEvents.length && (
            <p className="col-span-full py-12 text-center text-zinc-400">
              No upcoming events have been scheduled.
            </p>
          )}
        </div>
      )}

      <AnimatePresence>
        {joinEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-sm"
          >
            <motion.form
              initial={{ scale: 0.95, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 10, opacity: 0 }}
              onSubmit={(e) => { e.preventDefault(); if (gameName.trim()) void setParticipation(joinEvent, "join"); }}
              className="glass-panel w-full max-w-sm rounded-2xl p-5"
            >
              <h2 className="text-lg font-bold text-white">Participate in {joinEvent.title}</h2>
              <p className="mt-2 text-sm text-zinc-400">Enter your in-game name. It is saved only in this browser for future events.</p>
              <input autoFocus required maxLength={40} value={gameName} onChange={(e) => setGameName(e.target.value)} className="mt-4 w-full rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-white outline-none focus:border-neon-blue" placeholder="In-game name" />
              {participationError && <p className="mt-2 text-xs text-red-300">{participationError}</p>}
              <div className="mt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setJoinEvent(null)} className="rounded-lg px-3 py-2 text-xs text-zinc-350 hover:bg-white/5 transition">Cancel</button>
                <button disabled={participationLoadingId === joinEvent._id} className="rounded-lg bg-neon-blue px-3 py-2 text-xs font-bold text-black hover:brightness-110 transition disabled:opacity-50">
                  {participationLoadingId === joinEvent._id ? "Saving..." : "Participate"}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {unjoinEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 10, opacity: 0 }}
              className="glass-panel w-full max-w-sm rounded-2xl p-5"
            >
              <h2 className="text-lg font-bold text-white">Leave {unjoinEvent.title}?</h2>
              <p className="mt-2 text-sm text-zinc-400">Are you sure you want to remove your participation from this event?</p>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUnjoinEvent(null)}
                  className="rounded-lg px-3 py-1.5 text-xs text-zinc-400 hover:bg-white/5 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void setParticipation(unjoinEvent, "leave");
                    setUnjoinEvent(null);
                  }}
                  className="rounded-lg bg-hos-red px-3 py-1.5 text-xs font-bold text-white transition hover:brightness-110"
                >
                  Yes, Leave
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {successAnimation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-[2px]"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="flex flex-col items-center justify-center rounded-2xl bg-zinc-900/90 border border-white/10 px-8 py-6 shadow-2xl backdrop-blur-md"
            >
              {successAnimation.type === "join" ? (
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={3}
                    stroke="currentColor"
                    className="h-8 w-8"
                  >
                    <motion.path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
                    />
                  </svg>
                </div>
              ) : (
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={3}
                    stroke="currentColor"
                    className="h-8 w-8"
                  >
                    <motion.path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
                    />
                  </svg>
                </div>
              )}
              <motion.span
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-4 text-sm font-bold text-white uppercase tracking-wider"
              >
                {successAnimation.title}
              </motion.span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-sm"
            onClick={() => setSelectedEvent(null)}
          >
            <motion.section
              initial={{ scale: 0.95, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 10, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel w-full max-w-md rounded-2xl p-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Participants</h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    {selectedEvent.title} · {selectedEvent.participants?.length || 0}
                    {selectedEvent.maxParticipants ? ` / ${selectedEvent.maxParticipants}` : ""} joined
                  </p>
                </div>
                <button onClick={() => setSelectedEvent(null)} className="text-zinc-400 hover:text-white" aria-label="Close modal">
                  <X size={18} />
                </button>
              </div>
              <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
                {selectedEvent.participants?.length ? (
                  selectedEvent.participants.map((participant, index) => (
                    <p key={`${participant.gameName}-${index}`} className="rounded-lg bg-white/5 px-3 py-2 text-sm text-zinc-200">
                      {participant.gameName}
                    </p>
                  ))
                ) : (
                  <p className="text-sm text-zinc-400">No one has participated yet.</p>
                )}
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
