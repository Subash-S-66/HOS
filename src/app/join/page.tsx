"use client";

import { FormEvent, useState } from "react";
import { api } from "@/lib/api";
import { useSiteConfig } from "@/components/SiteProvider";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Loader2 } from "lucide-react";

const fields = [
  ["Player Name", "playerName", true],
  ["Current/Old Server", "server", false],
  ["Current/Old Alliance", "alliance", false],
  ["Current/Old Power", "power", false],
  ["Discord URL", "discord", false],
  ["Email", "email", true],
] as const;

export default function Page() {
  const { config } = useSiteConfig();

  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showFailure, setShowFailure] = useState(false);
  const [errorText, setErrorText] = useState("");

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setErrorText("");

    const formElement = e.currentTarget;
    const form = new FormData(formElement);

    try {
      await api("/applications", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(form)),
      });
      formElement.reset(); // Only reset on success
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2500); // Disappears in 2.5s
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unable to submit application.";
      setErrorText(msg);
      setShowFailure(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-3xl place-items-center p-4 pt-20 sm:p-8">
      <form onSubmit={submit} className="glass-panel w-full rounded-2xl p-6 sm:p-8 relative">
        <p className="text-xs font-bold tracking-[.25em] text-neon-blue">RECRUITMENT</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Join House Of Spanking</h1>
        <p className="mt-2 text-sm text-zinc-400">Tell our leadership a little about your Evony account.</p>
        
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {fields.map(([label, name, required]) => (
            <label key={name} className="text-sm text-zinc-300">
              {label}
              {required && (
                <span style={{ color: config.primaryColor }}> *</span>
              )}
              <input
                name={name}
                type={name === "email" ? "email" : "text"}
                required={required}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 outline-none focus:border-neon-blue"
              />
            </label>
          ))}
        </div>

        <label className="mt-4 block text-sm text-zinc-300">
          Message
          <span style={{ color: config.primaryColor }}> *</span>
          <textarea
            name="message"
            required
            maxLength={2000}
            className="mt-1 min-h-28 w-full rounded-lg border border-white/10 bg-black/30 p-3 outline-none focus:border-neon-blue"
          />
        </label>

        <button
          disabled={loading}
          style={{ backgroundColor: `${config.primaryColor}20`, borderColor: config.primaryColor }}
          className="mt-6 rounded-lg px-5 py-3 font-bold text-white border transition hover:bg-white/10 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin h-4 w-4" />
              Submitting...
            </>
          ) : (
            "Submit application"
          )}
        </button>
      </form>

      {/* Success Animation Pop-up */}
      <AnimatePresence>
        {showSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel w-full max-w-sm rounded-2xl p-8 shadow-2xl border border-green-500/40 text-center bg-zinc-950/95"
            >
              {/* Glowing green check icon with spring animation */}
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 10, stiffness: 100 }}
                >
                  <Check size={36} className="stroke-[3]" />
                </motion.div>
              </div>
              <h3 className="mt-5 text-xl font-black tracking-wide text-white">Application Sent!</h3>
              <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
                Thank you! HOS leadership will review your account details and respond within 24 hours.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Failure Animation Pop-up */}
      <AnimatePresence>
        {showFailure && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel w-full max-w-sm rounded-2xl p-8 shadow-2xl border border-red-500/40 text-center bg-zinc-950/95"
            >
              {/* Glowing red X icon with spring animation */}
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                <motion.div
                  initial={{ rotate: -90, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: "spring", damping: 10, stiffness: 100 }}
                >
                  <X size={36} className="stroke-[3]" />
                </motion.div>
              </div>
              <h3 className="mt-5 text-xl font-black tracking-wide text-white">Submission Failed</h3>
              <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
                {errorText || "We were unable to deliver your application. Please try again."}
              </p>
              <button
                type="button"
                onClick={() => setShowFailure(false)}
                style={{ backgroundColor: `${config.primaryColor}20`, borderColor: config.primaryColor }}
                className="mt-5 w-full rounded-lg py-2.5 text-xs font-bold text-white border hover:bg-white/10 transition active:scale-95"
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
