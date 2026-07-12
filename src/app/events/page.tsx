"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Clock } from "lucide-react";
import { api } from "@/lib/api";
import { EventCountdown } from "@/components/EventCountdown";
import { PageLoader } from "@/components/PageLoader";

type Event = {
  _id: string;
  title: string;
  description: string;
  date: string;
};

export default function Page() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Event[]>("/events")
      .then(setEvents)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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
          {events.map((event) => {
            const start = new Date(event.date);
            return (
              <article key={event._id} className="glass-panel rounded-2xl p-6">
                <p className="text-xs font-bold text-neon-blue">
                  {start.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}
                </p>
                <h2 className="mt-2 text-xl font-bold text-white">{event.title}</h2>
                <p className="mt-2 text-sm text-zinc-400">{event.description}</p>
                <div className="mt-5">
                  <p className="flex items-center gap-2 text-sm text-zinc-200">
                    <Clock size={15} />
                    {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZoneName: "short" })}
                  </p>
                  <EventCountdown date={event.date} />
                </div>
              </article>
            );
          })}
          {!events.length && (
            <p className="col-span-full py-12 text-center text-zinc-400">
              No upcoming events have been scheduled.
            </p>
          )}
        </div>
      )}
    </main>
  );
}
