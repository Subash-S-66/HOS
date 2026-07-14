"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, WifiOff, X, XCircle } from "lucide-react";

type Toast = { id: number; message: string; kind: "error" | "success" | "offline" };
const toastEvent = "hos:toast";

function notify(message: string, kind: Toast["kind"] = "error") {
  window.dispatchEvent(new CustomEvent<Pick<Toast, "message" | "kind">>(toastEvent, { detail: { message, kind } }));
}

export default function GlobalNotifications() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    let nextId = 0;
    const show = (event: Event) => {
      const detail = (event as CustomEvent<Pick<Toast, "message" | "kind">>).detail;
      if (!detail?.message) return;
      setToasts((current) => current.some((toast) => toast.message === detail.message)
        ? current
        : [...current.slice(-3), { id: ++nextId, message: detail.message, kind: detail.kind || "error" }]);
    };
    const remove = (id: number) => setToasts((current) => current.filter((toast) => toast.id !== id));
    const originalFetch = window.fetch.bind(window);

    window.fetch = (async (...args: Parameters<typeof fetch>) => {
      try {
        const response = await originalFetch(...args);
        if (!response.ok) {
          let message = response.status >= 500
            ? "The server is unavailable. Please try again shortly."
            : "The request could not be completed.";
          try {
            const body = await response.clone().json();
            message = body.error || body.message || message;
          } catch {
            // Some responses intentionally have no JSON body.
          }
          notify(message, "error");
        }
        return response;
      } catch (error) {
        notify("Unable to reach the server. Check your connection and try again.", "offline");
        throw error;
      }
    }) as typeof fetch;

    const offline = () => notify("You are offline. Some features will be unavailable until you reconnect.", "offline");
    const online = () => notify("Connection restored.", "success");
    const unexpectedError = () => notify("Something unexpected went wrong. Please try again.", "error");
    const unhandledRejection = () => notify("Something unexpected went wrong. Please try again.", "error");
    window.addEventListener(toastEvent, show);
    window.addEventListener("offline", offline);
    window.addEventListener("online", online);
    window.addEventListener("error", unexpectedError);
    window.addEventListener("unhandledrejection", unhandledRejection);

    return () => {
      window.fetch = originalFetch;
      window.removeEventListener(toastEvent, show);
      window.removeEventListener("offline", offline);
      window.removeEventListener("online", online);
      window.removeEventListener("error", unexpectedError);
      window.removeEventListener("unhandledrejection", unhandledRejection);
    };
  }, []);

  useEffect(() => {
    if (!toasts.length) return;
    const timer = window.setTimeout(() => setToasts((current) => current.slice(1)), 4500);
    return () => window.clearTimeout(timer);
  }, [toasts]);

  return (
    <div aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2">
      {toasts.map((toast) => {
        const Icon = toast.kind === "success" ? CheckCircle2 : toast.kind === "offline" ? WifiOff : XCircle;
        const color = toast.kind === "success" ? "text-emerald-300" : toast.kind === "offline" ? "text-amber-300" : "text-red-300";
        return (
          <div key={toast.id} role="status" className="pointer-events-auto glass-panel flex items-start gap-3 rounded-xl border border-white/15 px-4 py-3 text-sm text-zinc-100 shadow-2xl">
            <Icon size={18} className={`mt-0.5 shrink-0 ${color}`} />
            <p className="flex-1">{toast.message}</p>
            <button type="button" onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))} className="text-zinc-400 transition hover:text-white" aria-label="Dismiss notification"><X size={16} /></button>
          </div>
        );
      })}
    </div>
  );
}
