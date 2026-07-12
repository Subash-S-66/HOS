"use client";

import { useEffect, useState } from "react";

export function EventCountdown({ date }: { date: string }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const target = new Date(date);
      const diff = target.getTime() - now.getTime();

      if (diff <= 0) {
        setRemaining("Event started");
        clearInterval(interval);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      let remainingString = "";
      if (days > 0) {
        remainingString += `${days}d `;
      }
      if (hours > 0) {
        remainingString += `${hours}h `;
      }
      if (minutes > 0) {
        remainingString += `${minutes}m `;
      }

      setRemaining(remainingString.trim() + " remaining");
    }, 1000);

    return () => clearInterval(interval);
  }, [date]);

  return <p className="mt-5 flex items-center gap-2 text-sm text-zinc-200">{remaining}</p>;
}
