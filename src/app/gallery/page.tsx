"use client";

import Image from "next/image";
import { ChangeEvent, useEffect, useState } from "react";
import { X, Download, Loader2, CheckCircle2, Trash2, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api, apiUrl } from "@/lib/api";

type Item = {
  _id: string;
  imageUrl: string;
  uploader: string;
  description: string;
  likes: number;
};

const MAX_GALLERY_IMAGE_BYTES = 15 * 1024 * 1024;

export default function Page() {
  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState<Item | null>(null);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Modal image loading state
  const [imageLoading, setImageLoading] = useState(true);

  // Admin delete verification states
  const [showDeletePrompt, setShowDeletePrompt] = useState(false);
  const [adminUser, setAdminUser] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);

  useEffect(() => {
    api<Item[]>("/gallery")
      .then(setItems)
      .catch(() => {});
  }, []);

  const upload = async (e: ChangeEvent<HTMLInputElement>) => {
    const image = e.target.files?.[0];
    if (!image || !apiUrl) return;

    setMessage("");

    if (!image.type.startsWith("image/")) {
      setMessage("Videos and documents are not supported. Please upload an image file only.");
      e.target.value = "";
      return;
    }

    if (image.size > MAX_GALLERY_IMAGE_BYTES) {
      setMessage("Image is too large. Please choose an image no larger than 15 MB.");
      e.target.value = "";
      return;
    }

    setUploading(true);

    const uploader = localStorage.getItem("hos-chat-profile");
    const form = new FormData();
    form.append("image", image);
    form.append("uploader", uploader ? JSON.parse(uploader).gameName : "HOS visitor");

    try {
      const response = await fetch(`${apiUrl}/gallery`, {
        method: "POST",
        body: form,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        if (response.status === 413) {
          throw new Error("Image is too large. Please choose an image no larger than 15 MB.");
        }
        if (response.status === 429) {
          throw new Error(payload?.error || "You have uploaded several images recently. Please wait a few minutes and try again.");
        }
        if (response.status === 422 || response.status === 415) {
          throw new Error("We couldn’t use that file. Please choose a different image and try again.");
        }
        throw new Error("We couldn’t upload your image right now. Please try again in a moment.");
      }

      const item = await response.json();
      setItems((old) => [item, ...old]);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      setMessage(
        error instanceof TypeError
          ? "We couldn’t connect to the upload service. Please check your connection and try again."
          : error instanceof Error
            ? error.message
            : "We couldn’t upload your image right now. Please try again in a moment.",
      );
    } finally {
      setUploading(false);
    }
  };

  const downloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Failed to download image, opening in tab", error);
      window.open(url, "_blank");
    }
  };

  const handleDeleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleting(true);
    setDeleteError("");

    try {
      // 1. Authenticate with admin login API
      const loginRes = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: adminUser, password: adminPass }),
      });

      if (!loginRes.ok) {
        throw new Error("Invalid admin username or password.");
      }

      const { token } = await loginRes.json();

      // 2. Call delete API with the admin token
      const deleteRes = await fetch(`${apiUrl}/gallery/${selected?._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!deleteRes.ok) {
        const errData = await deleteRes.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to delete image.");
      }

      // 3. Update items list, close overlays and clear fields
      setItems((old) => old.filter((item) => item._id !== selected?._id));
      setShowDeletePrompt(false);
      setSelected(null);
      setAdminUser("");
      setAdminPass("");
      setShowDeleteSuccess(true);
      setTimeout(() => setShowDeleteSuccess(false), 2000);

      // 4. Show success notification
      setMessage("Image deleted successfully.");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl p-4 pt-20 sm:p-8 sm:pt-24">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-[.25em] text-neon-blue">IMAGES</p>
          <h1 className="mt-2 text-3xl font-bold text-white">HOS Gallery</h1>
        </div>
        <label
          className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-bold transition flex items-center gap-2 ${
            uploading
              ? "bg-zinc-800 text-zinc-400 border border-zinc-700 cursor-not-allowed"
              : "bg-neon-blue/20 text-neon-blue ring-1 ring-neon-blue/50 hover:bg-neon-blue/30"
          }`}
        >
          {uploading ? (
            <>
              <Loader2 className="animate-spin h-4 w-4 text-neon-blue" />
              Uploading...
            </>
          ) : (
            "Upload image"
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={upload}
            disabled={uploading}
          />
        </label>
      </header>

      <p className="-mt-5 mb-4 text-xs text-zinc-400">All image formats · maximum 15 MB</p>

      {message && <p className="mb-4 text-sm text-red-400 font-semibold">{message}</p>}

      <section className="columns-2 gap-3 md:columns-3">
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item._id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              transition={{ duration: 0.2 }}
              className="mb-3 break-inside-avoid"
            >
              <button
                onClick={() => {
                  setSelected(item);
                  setImageLoading(true);
                }}
                className="block w-full overflow-hidden rounded-xl border border-white/10 text-left bg-black/25"
              >
                <Image
                  src={item.imageUrl}
                  alt={item.description || `Upload by ${item.uploader}`}
                  width={900}
                  height={700}
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="h-auto w-full transition hover:scale-105"
                />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </section>

      {selected && (
        <div
          role="dialog"
          className="fixed inset-0 z-50 grid place-items-center bg-black/85 p-4"
          onClick={() => setSelected(null)}
        >
          <button
            onClick={() => setSelected(null)}
            className="absolute right-5 top-5 text-white hover:text-zinc-300"
          >
            <X />
          </button>
          <div className="max-h-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="relative flex items-center justify-center min-h-[200px] w-full bg-black/40 rounded-xl overflow-hidden">
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="animate-spin h-8 w-8 text-neon-blue" />
                </div>
              )}
              <Image
                src={selected.imageUrl}
                alt={selected.description || "Gallery image"}
                width={1600}
                height={1200}
                onLoad={() => setImageLoading(false)}
                className={`max-h-[80vh] w-auto rounded-xl object-contain transition-opacity duration-300 ${
                  imageLoading ? "opacity-0" : "opacity-100"
                }`}
              />
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div>
                <p className="text-sm text-white font-bold">{selected.description}</p>
                <p className="text-xs text-zinc-400">Uploaded by {selected.uploader}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadImage(selected.imageUrl, `hos-gallery-${selected._id}.png`)}
                  className="rounded-lg bg-neon-blue/20 border border-neon-blue/50 px-3.5 py-2 text-xs font-bold text-neon-blue transition hover:bg-neon-blue hover:text-black flex items-center gap-1.5"
                >
                  <Download size={14} />
                  Download
                </button>
                <button
                  onClick={() => setShowDeletePrompt(true)}
                  className="rounded-lg bg-red-950/20 border border-red-500/50 px-3.5 py-2 text-xs font-bold text-red-500 transition hover:bg-red-500 hover:text-white flex items-center gap-1.5"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Pop-up with checkmark animation */}
      <AnimatePresence>
        {showSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="glass-panel flex flex-col items-center gap-3 rounded-2xl bg-zinc-950/90 p-6 shadow-2xl border border-neon-blue/30 backdrop-blur-md min-w-[200px]"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 10 }}
                className="text-neon-blue"
              >
                <CheckCircle2 size={48} className="stroke-[1.5]" />
              </motion.div>
              <p className="text-sm font-bold text-white tracking-wide">Upload Complete!</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Deletion Success Pop-up */}
      <AnimatePresence>
        {showDeleteSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="glass-panel flex flex-col items-center gap-3 rounded-2xl bg-zinc-950/90 p-6 shadow-2xl border border-red-500/30 backdrop-blur-md min-w-[200px]"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 10 }}
                className="text-red-500"
              >
                <CheckCircle2 size={48} className="stroke-[1.5]" />
              </motion.div>
              <p className="text-sm font-bold text-white tracking-wide">Delete Complete!</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Uploading Overlay */}
      <AnimatePresence>
        {uploading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -15 }}
              className="glass-panel flex flex-col items-center gap-4 rounded-2xl bg-zinc-950/90 p-8 shadow-2xl border border-neon-blue/30 backdrop-blur-md min-w-[240px]"
            >
              <div className="relative flex h-16 w-16 items-center justify-center">
                <Loader2 className="animate-spin h-10 w-10 text-neon-blue" />
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 rounded-full border border-neon-blue/20"
                />
              </div>
              <p className="text-sm font-bold text-white tracking-wider animate-pulse">Uploading Image...</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Deleting Overlay */}
      <AnimatePresence>
        {deleting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -15 }}
              className="glass-panel flex flex-col items-center gap-4 rounded-2xl bg-zinc-950/90 p-8 shadow-2xl border border-red-500/30 backdrop-blur-md min-w-[240px]"
            >
              <div className="relative flex h-16 w-16 items-center justify-center">
                <Loader2 className="animate-spin h-10 w-10 text-red-500" />
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 rounded-full border border-red-500/20"
                />
              </div>
              <p className="text-sm font-bold text-white tracking-wider animate-pulse">Deleting Image...</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Verification overlay prompt to delete */}
      <AnimatePresence>
        {showDeletePrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="glass-panel w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-red-500/30"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertTriangle className="text-red-500" size={18} />
                Admin Verification
              </h3>
              <p className="mt-2 text-xs text-zinc-400">
                Enter your administrator credentials to confirm deleting this image.
              </p>
              <form onSubmit={handleDeleteSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="text-xs text-zinc-400 block">Admin Username</label>
                  <input
                    type="text"
                    value={adminUser}
                    onChange={(e) => setAdminUser(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-sm text-zinc-200 outline-none transition focus:border-red-500"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block">Password</label>
                  <input
                    type="password"
                    value={adminPass}
                    onChange={(e) => setAdminPass(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-sm text-zinc-200 outline-none transition focus:border-red-500"
                    required
                  />
                </div>
                {deleteError && <p className="text-xs text-red-500 font-semibold">{deleteError}</p>}
                <div className="flex items-center justify-end gap-2 border-t border-white/10 pt-4">
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={() => {
                      setShowDeletePrompt(false);
                      setDeleteError("");
                      setAdminUser("");
                      setAdminPass("");
                    }}
                    className="rounded-lg border border-white/10 px-4 py-2 text-xs font-bold text-zinc-300 hover:bg-white/5 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={deleting}
                    className="rounded-lg bg-red-600 hover:bg-red-700 px-4 py-2 text-xs font-bold text-white flex items-center justify-center gap-1.5 disabled:opacity-50 min-w-[110px]"
                  >
                    {deleting ? (
                      <>
                        <Loader2 className="animate-spin h-3.5 w-3.5" />
                        Deleting...
                      </>
                    ) : (
                      "Delete Image"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
