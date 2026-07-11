"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Shield, Save, X } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export interface LinkItem {
  id: string;
  title: string;
  url: string;
  imageUrl: string;
  iconName: string;
}

const defaultItems: LinkItem[] = [
  { id: "1", title: "Official Forum", url: "#", imageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=800", iconName: "Swords" },
  { id: "2", title: "War Archives", url: "#", imageUrl: "https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?auto=format&fit=crop&q=80&w=800", iconName: "Shield" },
];

export default function AdminPage() {
  const [items, setItems] = useState<LinkItem[]>(defaultItems);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<LinkItem, "id">>({ title: "", url: "", imageUrl: "", iconName: "Globe" });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let initialItems = defaultItems;
    try {
      const saved = localStorage.getItem("hos_admin_links");
      if (saved) {
        initialItems = JSON.parse(saved);
      } else {
        localStorage.setItem("hos_admin_links", JSON.stringify(defaultItems));
      }
    } catch (error) {
      console.error("Failed to parse admin links from local storage", error);
    }

    // Defer the state updates to avoid the synchronous effect warning
    const timeoutId = setTimeout(() => {
      setItems(initialItems);
      setIsLoaded(true);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, []);

  const saveToStorage = (newItems: LinkItem[]) => {
    setItems(newItems);
    localStorage.setItem("hos_admin_links", JSON.stringify(newItems));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      const updated = items.map(item => item.id === editingId ? { ...formData, id: editingId } : item);
      saveToStorage(updated);
      setEditingId(null);
    } else {
      const newItem = { ...formData, id: Date.now().toString() };
      saveToStorage([...items, newItem]);
    }
    setFormData({ title: "", url: "", imageUrl: "", iconName: "Globe" });
  };

  const handleEdit = (item: LinkItem) => {
    setEditingId(item.id);
    setFormData({ title: item.title, url: item.url, imageUrl: item.imageUrl, iconName: item.iconName });
  };

  const handleDelete = (id: string) => {
    saveToStorage(items.filter(item => item.id !== id));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ title: "", url: "", imageUrl: "", iconName: "Globe" });
  };

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-void-black text-ash-grey p-8 font-inter selection:bg-blood-crimson selection:text-white pt-24">
      <div className="max-w-4xl mx-auto relative z-10">

        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <Shield className="w-10 h-10 text-imperial-gold" />
            <div>
              <h1 className="font-cinzel text-3xl text-white tracking-widest">Command Center</h1>
              <p className="font-rajdhani text-imperial-gold tracking-widest uppercase text-sm">Manage Alliance Links</p>
            </div>
          </div>
          <Link href="/" className="px-6 py-2 border border-white/20 hover:border-imperial-gold text-white font-cinzel text-sm transition-colors uppercase tracking-wider">
            Return to HQ
          </Link>
        </div>

        {/* Form */}
        <div className="bg-white/5 border border-white/10 p-6 mb-12">
          <h2 className="font-cinzel text-xl text-white mb-6 uppercase tracking-wider">
            {editingId ? "Edit Transmission Link" : "Create New Link"}
          </h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-rajdhani text-xs uppercase tracking-widest mb-2">Title</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-void-black border border-white/20 p-3 text-white focus:outline-none focus:border-imperial-gold" />
              </div>
              <div>
                <label className="block font-rajdhani text-xs uppercase tracking-widest mb-2">Target URL</label>
                <input required type="text" value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} className="w-full bg-void-black border border-white/20 p-3 text-white focus:outline-none focus:border-imperial-gold" />
              </div>
              <div>
                <label className="block font-rajdhani text-xs uppercase tracking-widest mb-2">Background Image URL</label>
                <input required type="text" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} className="w-full bg-void-black border border-white/20 p-3 text-white focus:outline-none focus:border-imperial-gold" />
              </div>
              <div>
                <label className="block font-rajdhani text-xs uppercase tracking-widest mb-2">Icon Name (lucide-react)</label>
                <select value={formData.iconName} onChange={e => setFormData({...formData, iconName: e.target.value})} className="w-full bg-void-black border border-white/20 p-3 text-white focus:outline-none focus:border-imperial-gold">
                  <option value="Globe">Globe</option>
                  <option value="Swords">Swords</option>
                  <option value="Shield">Shield</option>
                  <option value="Crosshair">Crosshair</option>
                  <option value="Flame">Flame</option>
                  <option value="Trophy">Trophy</option>
                </select>
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button type="submit" className="flex items-center gap-2 px-6 py-3 bg-blood-crimson hover:bg-blood-crimson-light text-white font-cinzel text-sm uppercase tracking-wider transition-colors">
                {editingId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {editingId ? "Save Changes" : "Add Link"}
              </button>
              {editingId && (
                <button type="button" onClick={cancelEdit} className="flex items-center gap-2 px-6 py-3 border border-white/20 hover:border-white text-white font-cinzel text-sm uppercase tracking-wider transition-colors">
                  <X className="w-4 h-4" /> Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* List */}
        <div className="space-y-4">
          <h2 className="font-cinzel text-xl text-white mb-6 uppercase tracking-wider">Active Links</h2>
          <AnimatePresence>
            {items.map(item => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="flex items-center justify-between bg-void-black border border-white/10 p-4 hover:border-imperial-gold/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/5 bg-cover bg-center" style={{ backgroundImage: `url(${item.imageUrl})` }} />
                  <div>
                    <h3 className="font-cinzel text-white text-lg">{item.title}</h3>
                    <p className="font-inter text-xs text-ash-grey/50 truncate max-w-xs">{item.url}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-white/5 border border-white/10 text-xs font-rajdhani uppercase tracking-widest hidden sm:block">Icon: {item.iconName}</span>
                  <button onClick={() => handleEdit(item)} className="p-2 text-imperial-gold hover:text-imperial-gold-light hover:bg-white/5 transition-colors">
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-2 text-blood-crimson hover:text-blood-crimson-light hover:bg-white/5 transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {items.length === 0 && (
            <p className="text-center font-rajdhani text-ash-grey/50 uppercase tracking-widest py-10">No active links found.</p>
          )}
        </div>

      </div>
    </div>
  );
}
