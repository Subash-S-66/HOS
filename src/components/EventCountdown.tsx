"use client";

import { useEffect, useState } from "react";

export function EventCountdown({ date, endsAt }: { date: string; endsAt?: string }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    const updateRemaining = () => {
      const now = new Date();
      const target = new Date(date);
      const diff = target.getTime() - now.getTime();

      if (diff <= 0) {
        const end = endsAt ? new Date(endsAt) : target;
        if (end.getTime() > now.getTime()) {
          const diffEnd = end.getTime() - now.getTime();
          const days = Math.floor(diffEnd / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diffEnd % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diffEnd % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diffEnd % (1000 * 60)) / 1000);

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
          if (seconds > 0 || (days === 0 && hours === 0 && minutes === 0)) {
            remainingString += `${seconds}s `;
          }
          setRemaining(`Event ongoing (${remainingString.trim()} remaining)`);
        } else {
          setRemaining("Event ended");
        }
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

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
      if (seconds > 0 || (days === 0 && hours === 0 && minutes === 0)) {
        remainingString += `${seconds}s `;
      }

      setRemaining(remainingString.trim() + " remaining");
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);
    return () => clearInterval(interval);
  }, [date, endsAt]);

  return <p className="mt-5 flex items-center gap-2 text-sm text-zinc-200">{remaining}</p>;
}

export function ParticipationCountdown({ closesAt }: { closesAt: Date }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    const updateRemaining = () => {
      const now = new Date();
      const diff = closesAt.getTime() - now.getTime();

      if (diff <= 0) {
        setRemaining("ended");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

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
      if (seconds > 0 || (days === 0 && hours === 0 && minutes === 0)) {
        remainingString += `${seconds}s `;
      }

      setRemaining(`ends in ${remainingString.trim()}`);
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);
    return () => clearInterval(interval);
  }, [closesAt]);

  return <span className="text-zinc-400 font-normal ml-1">({remaining})</span>;
}
