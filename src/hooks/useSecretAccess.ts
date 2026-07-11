"use client";

import { useEffect, useState, useCallback } from 'react';

export function useSecretCode(secretSequence: string[], callback: () => void) {
  const [keySequence, setKeySequence] = useState<string[]>([]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      setKeySequence((prev) => {
        const newSequence = [...prev, key];

        // Keep only the last N keys, where N is the length of the secret sequence
        if (newSequence.length > secretSequence.length) {
          newSequence.shift();
        }

        // Check if the current sequence matches the secret sequence
        if (newSequence.join('') === secretSequence.join('').toLowerCase()) {
          callback();
          return []; // Reset sequence after match
        }

        return newSequence;
      });
    },
    [secretSequence, callback]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

export function useLogoClicks(targetClicks: number = 7, timeout: number = 3000, callback: () => void) {
  const [clicks, setClicks] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (clicks > 0) {
      if (clicks >= targetClicks) {
        callback();
        setClicks(0);
      } else {
        timer = setTimeout(() => {
          setClicks(0);
        }, timeout);
      }
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [clicks, targetClicks, timeout, callback]);

  const incrementClicks = () => setClicks((prev) => prev + 1);

  return { incrementClicks };
}
