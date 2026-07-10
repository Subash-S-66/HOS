"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function SecretAdminLogin() {
  const [showModal, setShowModal] = useState(false);
  const [keys, setKeys] = useState<string[]>([]);

  // Konami code: up, up, down, down, left, right, left, right, b, a
  const konami = [
    "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
    "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
    "b", "a"
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys((prev) => {
        const newKeys = [...prev, e.key];
        if (newKeys.length > konami.length) {
          newKeys.shift();
        }
        return newKeys;
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (keys.join(",") === konami.join(",")) {
      setShowModal(true);
      setKeys([]);
    }
  }, [keys]);

  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin") { // Replace with secure auth later
      alert("Access Granted: Welcome Admin");
      setShowModal(false);
    } else {
      alert("Access Denied");
    }
  };

  return (
    <AnimatePresence>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="glass-panel p-8 rounded-xl border border-neon-red shadow-[0_0_20px_rgba(255,0,60,0.4)] max-w-sm w-full"
          >
            <h2 className="text-2xl font-bold text-neon-red mb-6 text-center tracking-widest text-glow">
              RESTRICTED ACCESS
            </h2>
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <input
                type="password"
                placeholder="ENTER PASSPHRASE"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/50 border border-gray-700 rounded px-4 py-2 text-white outline-none focus:border-neon-red transition-colors"
                autoFocus
              />
              <div className="flex gap-4 mt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  ABORT
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-neon-red/20 text-neon-red border border-neon-red py-2 rounded hover:bg-neon-red hover:text-white transition-all shadow-[0_0_10px_rgba(255,0,60,0.5)] hover:shadow-[0_0_20px_rgba(255,0,60,0.8)]"
                >
                  AUTHENTICATE
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
