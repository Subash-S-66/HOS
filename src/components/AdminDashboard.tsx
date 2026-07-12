"use client";

import { useEffect, useMemo, useState } from "react";
import type { Icon as LucideIcon } from "lucide-react";
import {
  BarChart3,
  CalendarDays,
  FileImage,
  LayoutDashboard,
  Link2,
  LogOut,
  Menu,
  Palette,
  Settings,
  Shield,
  SlidersHorizontal,
  Users,
  Wrench,
  X,
} from "lucide-react";
import * as FaIcons from "react-icons/fa6";
import { useSiteConfig } from "@/components/SiteProvider";
import { api } from "@/lib/api";
import type { SiteConfig, Tool } from "@/lib/site-config";

type SectionName =
  | "Dashboard"
  | "Website Settings"
  | "Navigation"
  | "Theme"
  | "Tools"
  | "Gallery"
  | "Events"
  | "SVS History"
  | "Users"
  | "Applications"
  | "Analytics";

type RangeFilter = "today" | "3d" | "7d" | "30d";

type Summary = {
  range: RangeFilter;
  messages: number;
  newUsers: number;
  toolsAdded: number;
  onlineUsers: number;
  applications: number;
};

type ChatUser = {
  _id: string;
  gameName: string;
  serverNumber: string;
  allianceName: string;
  lastSeenAt?: string;
  createdAt?: string;
};

type AdminEvent = {
  _id: string;
  title: string;
  description: string;
  startsAt: string;
  date: string;
  hidden: boolean;
};

function parseDateTimeInTimezone(dateTimeStr: string, timeZone: string): Date {
  const [datePart, timePart] = dateTimeStr.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hours, minutes] = timePart.split(":").map(Number);
  
  const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes));
  
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false
  });
  
  const formattedParts = formatter.formatToParts(utcDate);
  const partValues: Record<string, string> = {};
  formattedParts.forEach(p => partValues[p.type] = p.value);
  
  const formattedUtc = Date.UTC(
    Number(partValues.year),
    Number(partValues.month) - 1,
    Number(partValues.day),
    Number(partValues.hour === "24" ? "00" : partValues.hour),
    Number(partValues.minute)
  );
  
  const offset = formattedUtc - utcDate.getTime();
  return new Date(utcDate.getTime() - offset);
}

function formatUtcToTimezone(utcDateString: string, timeZone: string): string {
  const date = new Date(utcDateString);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  
  const parts = formatter.formatToParts(date);
  const p: Record<string, string> = {};
  parts.forEach(part => p[part.type] = part.value);
  
  const hourStr = p.hour === "24" ? "00" : p.hour;
  return `${p.year}-${p.month}-${p.day}T${hourStr}:${p.minute}`;
}

const sections: Array<{ name: SectionName; icon: any }> = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Website Settings", icon: Settings },
  { name: "Navigation", icon: Link2 },
  { name: "Theme", icon: Palette },
  { name: "Tools", icon: Wrench },
  { name: "Gallery", icon: FileImage },
  { name: "Events", icon: CalendarDays },
  { name: "SVS History", icon: Shield },
  { name: "Users", icon: Users },
  { name: "Applications", icon: SlidersHorizontal },
  { name: "Analytics", icon: BarChart3 },
];

const toolIconOptions = [
  "FaWrench",
  "FaShieldHalved",
  "FaUsers",
  "FaCalendarDays",
  "FaBolt",
  "FaFire",
  "FaCompass",
  "FaScrewdriverWrench",
  "FaHammer",
  "FaSword",
  "FaTrophy",
  "FaChartLine",
  "FaMap",
  "FaGlobe",
  "FaRobot",
  "FaBook",
  "FaClipboardList",
  "FaRankingStar",
  "FaFlag",
  "FaStar",
  "FaBell",
  "FaRocket",
  "FaLink",
  "FaClock",
  "FaGem",
  "FaSkullCrossbones",
  "FaCrown",
  "FaTowerBroadcast",
] as const;

const input =
  "mt-1 w-full rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-sm text-zinc-200 outline-none transition focus:border-hos-red";

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-sm text-zinc-300">
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} className={input} />
    </label>
  );
}

function SectionActions({
  canSave,
  onSave,
  onReset,
  saveLabel = "Save section",
}: {
  canSave: boolean;
  onSave: () => void;
  onReset: () => void;
  saveLabel?: string;
}) {
  return (
    <div className="mt-4 flex items-center justify-end gap-2">
      <button
        onClick={onReset}
        className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition hover:bg-white/5"
      >
        Reset
      </button>
      <button
        onClick={onSave}
        disabled={!canSave}
        className="rounded-lg bg-hos-red px-3 py-1.5 text-xs font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saveLabel}
      </button>
    </div>
  );
}

const mergeSiteConfig = (current: SiteConfig, payload: Record<string, unknown>): SiteConfig => {
  const next = { ...current };

  if (typeof payload.title === "string") next.title = payload.title;
  if (typeof payload.banner === "string") next.banner = payload.banner;
  if (typeof payload.footer === "string") next.footer = payload.footer;
  if (typeof payload.youtubeUrl === "string") next.youtubeUrl = payload.youtubeUrl;
  if (typeof payload.discordUrl === "string") next.discordUrl = payload.discordUrl;
  if (typeof payload.primaryColor === "string") next.primaryColor = payload.primaryColor;
  if (typeof payload.galleryUploadsPer10Min === "number") {
    next.galleryUploadsPer10Min = payload.galleryUploadsPer10Min;
  }
  if (Array.isArray(payload.tools)) next.tools = payload.tools as Tool[];
  if (Array.isArray(payload.svsHistory)) {
    next.svsHistory = payload.svsHistory as Array<{ label: string; url: string; date: string }>;
  }

  return next;
};

const buildPayload = (section: SectionName, draft: SiteConfig): Record<string, unknown> | null => {
  if (section === "Dashboard") {
    return {
      title: draft.title,
      banner: draft.banner,
      footer: draft.footer,
      youtubeUrl: draft.youtubeUrl,
      discordUrl: draft.discordUrl,
      primaryColor: draft.primaryColor,
      galleryUploadsPer10Min: draft.galleryUploadsPer10Min,
      tools: draft.tools,
      svsHistory: draft.svsHistory,
    };
  }

  if (section === "Website Settings") {
    return {
      title: draft.title,
      banner: draft.banner,
      footer: draft.footer,
      youtubeUrl: draft.youtubeUrl,
      discordUrl: draft.discordUrl,
    };
  }

  if (section === "Theme") return { primaryColor: draft.primaryColor };
  if (section === "Tools") return { tools: draft.tools };
  if (section === "Gallery") return { galleryUploadsPer10Min: draft.galleryUploadsPer10Min };
  if (section === "SVS History") return { svsHistory: draft.svsHistory };
  return null;
};

const hasSectionChanges = (section: SectionName, config: SiteConfig, draft: SiteConfig) => {
  if (section === "Dashboard") return JSON.stringify(config) !== JSON.stringify(draft);

  if (section === "Website Settings") {
    return (
      config.title !== draft.title ||
      config.banner !== draft.banner ||
      config.footer !== draft.footer ||
      config.youtubeUrl !== draft.youtubeUrl ||
      config.discordUrl !== draft.discordUrl
    );
  }

  if (section === "Theme") return config.primaryColor !== draft.primaryColor;
  if (section === "Tools") return JSON.stringify(config.tools) !== JSON.stringify(draft.tools);
  if (section === "Gallery") return config.galleryUploadsPer10Min !== draft.galleryUploadsPer10Min;
  if (section === "SVS History") return JSON.stringify(config.svsHistory) !== JSON.stringify(draft.svsHistory);

  return false;
};

export default function AdminDashboard({ username }: { username: string }) {
  const { config, updateConfig, refreshConfig } = useSiteConfig();
  const [active, setActive] = useState<SectionName>("Dashboard");
  const [draft, setDraft] = useState<SiteConfig>(config);
  const [status, setStatus] = useState("");
  const [range, setRange] = useState<RangeFilter>("today");
  const [summary, setSummary] = useState<Summary>({
    range: "today",
    messages: 0,
    newUsers: 0,
    toolsAdded: 0,
    onlineUsers: 0,
    applications: 0,
  });
  const [users, setUsers] = useState<Array<ChatUser>>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [toolsEditMode, setToolsEditMode] = useState(false);
  const [svsEditMode, setSvsEditMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Event states
  const [events, setEvents] = useState<Array<AdminEvent>>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventHidden, setEventHidden] = useState(false);

  const loadEvents = async () => {
    setLoadingEvents(true);
    try {
      const data = await api<Array<AdminEvent>>("/events");
      setEvents(data);
    } catch {
      setStatus("Could not load events list.");
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingEventId(null);
    setEventTitle("");
    setEventDescription("");
    setEventDate("");
    setEventHidden(false);
    setShowCreateModal(true);
  };

  const handleOpenEditModal = (event: AdminEvent) => {
    setEditingEventId(event._id);
    setEventTitle(event.title);
    setEventDescription(event.description || "");
    setEventDate(formatUtcToTimezone(event.date, "America/New_York"));
    setEventHidden(event.hidden || false);
    setShowCreateModal(true);
  };

  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      await api(`/events/${id}`, {
        method: "DELETE",
      });
      setStatus("Event deleted successfully.");
      void loadEvents();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to delete event.");
    }
  };

  const handleEventSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!eventTitle || !eventDate) {
      setStatus("Please fill out Title and Date fields.");
      return;
    }
    const year = eventDate.split("-")[0];
    if (year.length !== 4) {
      setStatus("Please enter a valid 4-digit year.");
      return;
    }
    try {
      const payload = {
        title: eventTitle,
        description: eventDescription,
        date: parseDateTimeInTimezone(eventDate, "America/New_York").toISOString(),
        hidden: eventHidden,
      };

      if (editingEventId) {
        await api(`/events/${editingEventId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setStatus("Event updated successfully.");
      } else {
        await api("/events", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setStatus("Event created successfully.");
      }

      setShowCreateModal(false);
      void loadEvents();
      setEventTitle("");
      setEventDescription("");
      setEventDate("");
      setEventHidden(false);
      setEditingEventId(null);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to save event.");
    }
  };

  useEffect(() => {
    setDraft(config);
  }, [config]);

  const totalChanges = useMemo(() => JSON.stringify(draft) !== JSON.stringify(config), [draft, config]);

  const loadSummary = async (selectedRange: RangeFilter) => {
    setLoadingSummary(true);
    try {
      const data = await api<Summary>(`/analytics/summary?range=${selectedRange}`);
      setSummary(data);
    } catch {
      setStatus("Could not load analytics summary.");
    } finally {
      setLoadingSummary(false);
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const rows = await api<Array<ChatUser>>("/users");
      setUsers(rows);
    } catch {
      setStatus("Could not load user list.");
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    void loadSummary(range);
  }, [range]);

  useEffect(() => {
    if (active === "Users") {
      void loadUsers();
    } else if (active === "Events") {
      void loadEvents();
    }
  }, [active]);

  const saveSection = async (section: SectionName) => {
    const payload = buildPayload(section, draft);
    if (!payload) {
      setStatus(`${section} does not have persistent settings yet.`);
      return;
    }

    const hasChanges = hasSectionChanges(section, config, draft);
    if (!hasChanges) {
      setStatus(`No changes to save in ${section}.`);
      return;
    }

    if (!window.confirm(`Save ${section} changes to database?`)) return;

    try {
      await api<{ ok: boolean }>("/admin/config", {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      if (section === "Dashboard") {
        updateConfig(draft);
      } else {
        updateConfig(mergeSiteConfig(config, payload));
      }

      setStatus(`Saved ${section} changes to database.`);
      await refreshConfig();
      if (section === "SVS History") {
        setSvsEditMode(false);
      }
      if (section === "Dashboard" || section === "Analytics") {
        void loadSummary(range);
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : `Failed to save ${section}.`);
    }
  };

  const resetAll = () => {
    if (!window.confirm("Discard unsaved changes?")) return;
    setDraft(config);
    setStatus("Changes reset.");
  };

  const alterTool = (id: string, patch: Partial<Tool>) => {
    setDraft((current) => ({
      ...current,
      tools: current.tools.map((tool) => (tool.id === id ? { ...tool, ...patch } : tool)),
    }));
  };

  const addTool = () => {
    setDraft((current) => ({
      ...current,
      tools: [
        ...current.tools,
        {
          id: crypto.randomUUID(),
          title: "New tool",
          description: "Add a clear description.",
          icon: "FaWrench",
          color: current.primaryColor,
          category: "General",
          order: current.tools.length + 1,
          link: "/tools",
          enabled: true,
          visible: true,
        },
      ],
    }));
  };

  const removeTool = (id: string) => {
    setDraft((current) => ({
      ...current,
      tools: current.tools
        .filter((tool) => tool.id !== id)
        .sort((a, b) => a.order - b.order)
        .map((tool, index) => ({ ...tool, order: index + 1 })),
    }));
  };

  const moveTool = (id: string, direction: "up" | "down") => {
    setDraft((current) => {
      const sorted = [...current.tools].sort((a, b) => a.order - b.order);
      const index = sorted.findIndex((tool) => tool.id === id);
      if (index === -1) return current;

      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= sorted.length) return current;

      const swapped = [...sorted];
      [swapped[index], swapped[targetIndex]] = [swapped[targetIndex], swapped[index]];

      const normalized = swapped.map((tool, orderIndex) => ({ ...tool, order: orderIndex + 1 }));
      return { ...current, tools: normalized };
    });
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    location.assign("/");
  };

  return (
    <div className="min-h-screen bg-[#090505] p-3 sm:p-6">
      <div className="mx-auto flex max-w-7xl gap-4">
        <aside className="glass-panel sticky top-4 hidden h-[calc(100vh-2rem)] w-60 shrink-0 rounded-2xl p-3 lg:block">
          <div className="p-3">
            <p className="font-bold tracking-widest text-white">
              HOS <span className="text-hos-red">CONTROL</span>
            </p>
            <p className="mt-1 text-xs text-zinc-500">Signed in as {username}</p>
          </div>
          <nav className="mt-3 space-y-1">
            {sections.map(({ name, icon: Icon }) => (
              <button
                onClick={() => setActive(name)}
                key={name}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                  active === name
                    ? "bg-hos-red text-white"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={16} />
                {name}
              </button>
            ))}
          </nav>
          <button
            onClick={logout}
            className="absolute bottom-5 flex items-center gap-2 px-3 text-sm text-red-500 hover:text-red-400"
          >
            <LogOut size={15} />
            Logout
          </button>
        </aside>

        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/65 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        <aside
          className={`glass-panel fixed inset-y-3 left-3 z-50 w-64 rounded-2xl p-3 transition-transform duration-200 lg:hidden ${
            mobileMenuOpen ? "translate-x-0" : "translate-x-[-110%]"
          }`}
        >
          <div className="mb-2 flex items-center justify-between p-2">
            <p className="font-bold tracking-widest text-white">
              HOS <span className="text-hos-red">CONTROL</span>
            </p>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg border border-white/15 p-1.5 text-zinc-300"
            >
              <X size={16} />
            </button>
          </div>
          <p className="mb-3 px-2 text-xs text-zinc-500">Signed in as {username}</p>
          <nav className="space-y-1">
            {sections.map(({ name, icon: Icon }) => (
              <button
                onClick={() => {
                  setActive(name);
                  setMobileMenuOpen(false);
                }}
                key={name}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                  active === name
                    ? "bg-hos-red text-white"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={16} />
                {name}
              </button>
            ))}
          </nav>
          <button
            onClick={logout}
            className="absolute bottom-5 flex items-center gap-2 px-3 text-sm text-red-500 hover:text-red-400"
          >
            <LogOut size={15} />
            Logout
          </button>
        </aside>

        <main className="min-w-0 flex-1 space-y-4 pb-10 pt-2">
          <div className="flex items-center justify-between lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-black/35 px-3 py-2 text-sm font-bold text-zinc-100"
            >
              <Menu size={16} />
              Menu
            </button>
            <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">{active}</p>
          </div>

          {status ? (
            <div className="glass-panel mb-3 rounded-xl px-4 py-2 text-xs text-zinc-300">{status}</div>
          ) : null}

          {active === "Dashboard" && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {[
                ["Messages today", summary.messages],
                ["Online users", summary.onlineUsers],
                ["New users today", summary.newUsers],
                ["Tools added today", summary.toolsAdded],
                ["Applications today", summary.applications],
                ["Published tools", draft.tools.filter((tool) => tool.enabled && (tool.visible ?? true)).length],
              ].map(([label, value]) => (
                <div key={String(label)} className="glass-panel rounded-2xl p-5">
                  <p className="text-sm text-zinc-400">{label}</p>
                  <p className="mt-2 text-2xl font-bold text-white">{value}</p>
                </div>
              ))}
              <div className="glass-panel col-span-2 rounded-2xl p-5 sm:col-span-3">
                <h2 className="font-bold text-white">Global save control</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Save from here to persist all unsaved section edits (website, theme, tools, gallery, and SVS).
                </p>
                <SectionActions
                  canSave={hasSectionChanges("Dashboard", config, draft)}
                  onSave={() => void saveSection("Dashboard")}
                  onReset={resetAll}
                  saveLabel={loadingSummary ? "Refreshing..." : "Save all changes"}
                />
              </div>
            </div>
          )}

          {active === "Website Settings" && (
            <div className="glass-panel max-w-2xl rounded-2xl p-5">
              <div className="grid gap-4">
                <Field label="Website title" value={draft.title} onChange={(title) => setDraft((current) => ({ ...current, title }))} />
                <Field
                  label="Homepage banner (comma-separated)"
                  value={draft.banner}
                  onChange={(banner) => setDraft((current) => ({ ...current, banner }))}
                />
                <Field
                  label="Footer text"
                  value={draft.footer}
                  onChange={(footer) => setDraft((current) => ({ ...current, footer }))}
                />
                <Field
                  label="YouTube URL"
                  value={draft.youtubeUrl}
                  onChange={(youtubeUrl) => setDraft((current) => ({ ...current, youtubeUrl }))}
                />
                <Field
                  label="Discord URL"
                  value={draft.discordUrl}
                  onChange={(discordUrl) => setDraft((current) => ({ ...current, discordUrl }))}
                />
                <p className="text-xs text-zinc-500">Banner values are appended to default homepage messages.</p>
              </div>
              <SectionActions
                canSave={hasSectionChanges("Website Settings", config, draft)}
                onSave={() => void saveSection("Website Settings")}
                onReset={resetAll}
              />
            </div>
          )}

          {active === "Theme" && (
            <div className="glass-panel max-w-xl rounded-2xl p-5">
              <label className="text-sm text-zinc-300">
                Primary theme color
                <input
                  type="color"
                  value={draft.primaryColor}
                  onChange={(event) => setDraft((current) => ({ ...current, primaryColor: event.target.value }))}
                  className="mt-3 block h-12 w-full rounded-lg bg-transparent"
                />
              </label>
              <label className="mt-3 block text-xs text-zinc-400">
                Hex value
                <input
                  value={draft.primaryColor}
                  onChange={(event) => setDraft((current) => ({ ...current, primaryColor: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-xs text-zinc-300 outline-none"
                />
              </label>
              <div className="mt-3 flex items-center gap-2 text-xs">
                <span className="text-zinc-500">Preview:</span>
                <span
                  className="rounded-full px-2 py-1 font-bold"
                  style={{ backgroundColor: `${draft.primaryColor}20`, color: draft.primaryColor }}
                >
                  HOS Accent
                </span>
              </div>
              <SectionActions
                canSave={hasSectionChanges("Theme", config, draft)}
                onSave={() => void saveSection("Theme")}
                onReset={resetAll}
              />
            </div>
          )}

          {active === "Tools" && (
            <div className="space-y-4">
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setToolsEditMode((current) => !current)}
                  className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-bold text-zinc-200 transition hover:bg-white/10"
                >
                  {toolsEditMode ? "Stop editing" : "Edit tools"}
                </button>
                <button
                  onClick={() => void saveSection("Tools")}
                  disabled={!toolsEditMode || !hasSectionChanges("Tools", config, draft)}
                  className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Save tools section
                </button>
                <button
                  onClick={addTool}
                  disabled={!toolsEditMode}
                  className="rounded-lg bg-hos-red px-3 py-1.5 text-xs font-bold text-white transition hover:brightness-110"
                >
                  Add tool
                </button>
              </div>

              {[...draft.tools]
                .sort((a, b) => a.order - b.order)
                .map((tool) => {
                  const Icon = FaIcons[tool.icon as keyof typeof FaIcons] as
                    | React.ComponentType<{ className?: string }>
                    | undefined;

                  return (
                    <div key={tool.id} className="glass-panel rounded-xl p-4">
                      <div className="grid gap-3 md:grid-cols-[1.2fr_1.6fr_1.2fr_130px_auto]">
                        <div>
                          <input
                            value={tool.title}
                            onChange={(event) => alterTool(tool.id, { title: event.target.value })}
                            disabled={!toolsEditMode}
                            className="w-full bg-transparent text-sm font-bold text-white outline-none"
                          />
                          <input
                            value={tool.category}
                            onChange={(event) => alterTool(tool.id, { category: event.target.value })}
                            disabled={!toolsEditMode}
                            className="mt-1 w-full bg-transparent text-[11px] uppercase tracking-[0.14em] text-hos-red outline-none"
                          />
                        </div>

                        <input
                          value={tool.description}
                          onChange={(event) => alterTool(tool.id, { description: event.target.value })}
                          disabled={!toolsEditMode}
                          className="rounded bg-black/25 px-2 py-1 text-xs text-zinc-300 outline-none"
                          placeholder="Tool description"
                        />

                        <div className="space-y-2">
                          <input
                            value={tool.link}
                            onChange={(event) => alterTool(tool.id, { link: event.target.value })}
                            disabled={!toolsEditMode}
                            className="w-full rounded bg-black/25 px-2 py-1 text-xs text-zinc-300 outline-none"
                            placeholder="/tools or https://..."
                          />
                          <div className="rounded-lg border border-white/10 bg-black/25 p-2">
                            <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-400">Icon preview</p>
                            <div className="mt-2 grid grid-cols-7 gap-1">
                              {toolIconOptions.map((name) => {
                                const Picker = FaIcons[name as keyof typeof FaIcons] as
                                  | React.ComponentType<{ className?: string }>
                                  | undefined;
                                const selected = tool.icon === name;
                                return (
                                  <button
                                    key={name}
                                    onClick={() => alterTool(tool.id, { icon: name })}
                                    disabled={!toolsEditMode}
                                    title={name}
                                    className={`grid h-7 w-7 place-items-center rounded-md border text-xs transition ${
                                      selected
                                        ? "border-white/40 bg-white/10 text-white"
                                        : "border-white/10 text-zinc-400 hover:border-white/25 hover:text-white"
                                    }`}
                                  >
                                    {Picker ? <Picker className="h-3.5 w-3.5" /> : <Wrench className="h-3.5 w-3.5" />}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={tool.color}
                              onChange={(event) => alterTool(tool.id, { color: event.target.value })}
                              disabled={!toolsEditMode}
                              className="h-8 w-10 rounded border border-white/10 bg-transparent"
                            />
                            <input
                              value={tool.color}
                              onChange={(event) => alterTool(tool.id, { color: event.target.value })}
                              disabled={!toolsEditMode}
                              className="w-full rounded bg-black/25 px-2 py-1 text-xs text-zinc-300 outline-none"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={tool.order}
                              onChange={(event) => alterTool(tool.id, { order: Number(event.target.value) || 1 })}
                              disabled={!toolsEditMode}
                              className="w-14 rounded bg-black/25 px-2 py-1 text-xs text-zinc-300 outline-none"
                            />
                            <label className="flex items-center gap-1 text-[11px] text-zinc-400">
                              <input
                                type="checkbox"
                                checked={tool.enabled}
                                onChange={(event) => alterTool(tool.id, { enabled: event.target.checked })}
                                disabled={!toolsEditMode}
                              />
                              On
                            </label>
                            <label className="flex items-center gap-1 text-[11px] text-zinc-400">
                              <input
                                type="checkbox"
                                checked={tool.visible}
                                onChange={(event) => alterTool(tool.id, { visible: event.target.checked })}
                                disabled={!toolsEditMode}
                              />
                              Show
                            </label>
                          </div>
                        </div>

                        <div className="flex flex-col items-end justify-between gap-2">
                          <div className="grid h-10 w-10 place-items-center rounded-lg bg-black/45" style={{ color: tool.color }}>
                            {Icon ? <Icon className="h-5 w-5" /> : <Wrench className="h-5 w-5" />}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => moveTool(tool.id, "up")}
                              disabled={!toolsEditMode}
                              className="rounded border border-white/10 px-2 py-1 text-[11px] text-zinc-400"
                            >
                              Up
                            </button>
                            <button
                              onClick={() => moveTool(tool.id, "down")}
                              disabled={!toolsEditMode}
                              className="rounded border border-white/10 px-2 py-1 text-[11px] text-zinc-400"
                            >
                              Down
                            </button>
                            <button
                              onClick={() => removeTool(tool.id)}
                              disabled={!toolsEditMode}
                              className="rounded border border-red-900/60 px-2 py-1 text-[11px] text-red-300"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  onClick={() => setToolsEditMode((current) => !current)}
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition hover:bg-white/5"
                >
                  {toolsEditMode ? "Stop editing" : "Edit tools"}
                </button>
                <button
                  onClick={() => void saveSection("Tools")}
                  disabled={!toolsEditMode || !hasSectionChanges("Tools", config, draft)}
                  className="rounded-lg bg-hos-red px-3 py-1.5 text-xs font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Save tools section
                </button>
              </div>
            </div>
          )}

          {active === "Gallery" && (
            <div className="glass-panel max-w-xl rounded-2xl p-5">
              <h2 className="font-bold text-white">Gallery upload limits</h2>
              <p className="mt-2 text-sm text-zinc-400">
                Limit how many images one user can upload in a rolling 10-minute window.
              </p>
              <label className="mt-4 block text-sm text-zinc-300">
                Uploads per 10 minutes
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={draft.galleryUploadsPer10Min}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      galleryUploadsPer10Min: Math.max(1, Math.min(20, Number(event.target.value) || 1)),
                    }))
                  }
                  className={input}
                />
              </label>
              <SectionActions
                canSave={hasSectionChanges("Gallery", config, draft)}
                onSave={() => void saveSection("Gallery")}
                onReset={resetAll}
              />
            </div>
          )}

          {active === "SVS History" && (
            <div className="glass-panel space-y-2 rounded-xl p-4">
              <div className="mb-2 flex justify-end gap-2">
                <button
                  onClick={() => {
                    if (svsEditMode) {
                      if (hasSectionChanges("SVS History", config, draft)) {
                        setDraft((current) => ({
                          ...current,
                          svsHistory: config.svsHistory,
                        }));
                      }
                      setSvsEditMode(false);
                    } else {
                      setSvsEditMode(true);
                    }
                  }}
                  className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-bold text-zinc-200 transition hover:bg-white/10"
                >
                  {svsEditMode
                    ? hasSectionChanges("SVS History", config, draft)
                      ? "Discard"
                      : "Stop editing"
                    : "Edit SVS history"}
                </button>
                <button
                  onClick={() => void saveSection("SVS History")}
                  disabled={!svsEditMode || !hasSectionChanges("SVS History", config, draft)}
                  className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Save SVS history
                </button>
              </div>
              {draft.svsHistory.map((entry, index) => (
                <div key={index} className="grid gap-2 rounded-lg border border-white/5 bg-black/20 p-2 sm:grid-cols-[180px_1fr]">
                  <input
                    value={entry.label}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        svsHistory: current.svsHistory.map((item, i) =>
                          i === index ? { ...item, label: event.target.value } : item,
                        ),
                      }))
                    }
                    disabled={!svsEditMode}
                    className="bg-transparent text-sm font-semibold text-white outline-none"
                  />
                  <input
                    value={entry.url}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        svsHistory: current.svsHistory.map((item, i) =>
                          i === index ? { ...item, url: event.target.value } : item,
                        ),
                      }))
                    }
                    disabled={!svsEditMode}
                    className="rounded bg-black/25 px-2 py-1 text-xs text-zinc-300 outline-none"
                  />
                </div>
              ))}
            </div>
          )}

          {active === "Users" && (
            <div className="glass-panel rounded-2xl p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-bold text-white">Chat users</h2>
                <button
                  onClick={() => void loadUsers()}
                  className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-bold text-zinc-200 transition hover:bg-white/10"
                >
                  Refresh
                </button>
              </div>
              {loadingUsers ? (
                <p className="text-sm text-zinc-400">Loading users...</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="text-zinc-400">
                      <tr>
                        <th className="pb-2">Game Name</th>
                        <th className="pb-2">Server</th>
                        <th className="pb-2">Alliance</th>
                        <th className="pb-2">Last Seen</th>
                      </tr>
                    </thead>
                    <tbody className="text-zinc-200">
                      {users.map((user) => (
                        <tr key={user._id} className="border-t border-white/10">
                          <td className="py-2">{user.gameName}</td>
                          <td className="py-2">{user.serverNumber}</td>
                          <td className="py-2">{user.allianceName}</td>
                          <td className="py-2 text-xs text-zinc-400">
                            {user.lastSeenAt ? new Date(user.lastSeenAt).toLocaleString() : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!users.length && <p className="pt-3 text-sm text-zinc-500">No users found yet.</p>}
                </div>
              )}
            </div>
          )}

          {active === "Analytics" && (
            <div className="space-y-4">
              <div className="glass-panel rounded-2xl p-5">
                <h2 className="font-bold text-white">Analytics</h2>
                <p className="mt-1 text-sm text-zinc-400">Filter stats for today, 3 days, 7 days, or 30 days.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {([
                    ["Today", "today"],
                    ["3 Days", "3d"],
                    ["7 Days", "7d"],
                    ["30 Days", "30d"],
                  ] as const).map(([label, key]) => (
                    <button
                      key={key}
                      onClick={() => setRange(key)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                        range === key
                          ? "bg-hos-red text-white"
                          : "border border-white/20 text-zinc-300 hover:bg-white/10"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {[
                  ["Messages", summary.messages],
                  ["New Users", summary.newUsers],
                  ["Tools Added", summary.toolsAdded],
                  ["Online", summary.onlineUsers],
                  ["Applications", summary.applications],
                ].map(([label, value]) => (
                  <div key={String(label)} className="glass-panel rounded-2xl p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">{label}</p>
                    <p className="mt-2 text-2xl font-bold text-white">{value}</p>
                  </div>
                ))}
              </div>

              {loadingSummary && <p className="text-sm text-zinc-400">Refreshing analytics...</p>}
            </div>
          )}

          {active === "Events" && (
            <div className="space-y-4">
              <div className="glass-panel flex items-center justify-between rounded-2xl p-5">
                <div>
                  <h2 className="font-bold text-white">Events Management</h2>
                  <p className="mt-1 text-sm text-zinc-400">Schedule, update, or cancel alliance events.</p>
                </div>
                <button
                  onClick={handleOpenCreateModal}
                  className="rounded-lg bg-hos-red px-3 py-2 text-xs font-bold text-white transition hover:brightness-110"
                >
                  Create new event
                </button>
              </div>

              {loadingEvents ? (
                <p className="text-sm text-zinc-400">Loading events...</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {events.map((event) => {
                    const eventDateObj = new Date(event.date);
                    return (
                      <div key={event._id} className="glass-panel flex flex-col justify-between rounded-2xl p-5">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-hos-red">
                              {eventDateObj.toLocaleDateString("en-US", { timeZone: "America/New_York", weekday: "short", month: "short", day: "numeric" })}
                            </span>
                            {event.hidden && (
                              <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] uppercase font-bold text-zinc-400">
                                Hidden
                              </span>
                            )}
                          </div>
                          <h3 className="mt-2 text-lg font-bold text-white">{event.title}</h3>
                          <p className="mt-1 text-xs text-zinc-400 line-clamp-3">{event.description || "No description provided."}</p>
                          <p className="mt-3 text-xs text-zinc-300">
                            Time: {eventDateObj.toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit", timeZoneName: "short" })}
                          </p>
                        </div>
                        <div className="mt-4 flex items-center justify-end gap-2 border-t border-white/5 pt-3">
                          <button
                            onClick={() => handleOpenEditModal(event)}
                            className="rounded border border-white/10 px-2.5 py-1 text-xs font-semibold text-zinc-300 transition hover:bg-white/5"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(event._id)}
                            className="rounded border border-red-900/60 px-2.5 py-1 text-xs font-semibold text-red-300 transition hover:bg-red-950/20"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {!events.length && (
                    <p className="col-span-full py-12 text-center text-sm text-zinc-350">No events scheduled yet.</p>
                  )}
                </div>
              )}

              {/* Modal overlay */}
              {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
                  <div className="glass-panel w-full max-w-md rounded-2xl p-6 shadow-2xl">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <h3 className="text-lg font-bold text-white">
                        {editingEventId ? "Edit Event" : "Create New Event"}
                      </h3>
                      <button
                        onClick={() => setShowCreateModal(false)}
                        className="rounded-lg border border-white/15 p-1 text-zinc-400 hover:text-white"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <form onSubmit={handleEventSubmit} className="mt-4 space-y-4">
                      <div>
                        <Field label="Event Title" value={eventTitle} onChange={setEventTitle} />
                      </div>
                      <div>
                        <label className="text-sm text-zinc-300">
                          Event Description
                          <textarea
                            value={eventDescription}
                            onChange={(e) => setEventDescription(e.target.value)}
                            rows={3}
                            className="mt-1 w-full rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-sm text-zinc-200 outline-none transition focus:border-hos-red"
                            placeholder="Provide details about the event..."
                          />
                        </label>
                      </div>
                      <div>
                        <label className="text-sm text-zinc-300 block">
                          Event Date & Time (Local)
                          <input
                            type="datetime-local"
                            value={eventDate}
                            max="9999-12-31T23:59"
                            onChange={(e) => setEventDate(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-sm text-zinc-200 outline-none transition focus:border-hos-red"
                            required
                          />
                        </label>
                      </div>
                      <div className="flex items-center gap-2 py-1">
                        <input
                          type="checkbox"
                          id="event-hidden"
                          checked={eventHidden}
                          onChange={(e) => setEventHidden(e.target.checked)}
                          className="h-4 w-4 bg-transparent border-white/10 text-hos-red focus:ring-0 focus:ring-offset-0"
                        />
                        <label htmlFor="event-hidden" className="text-xs font-semibold text-zinc-300 select-none">
                          Hide event from alliance view
                        </label>
                      </div>
                      <div className="flex items-center justify-end gap-2 border-t border-white/10 pt-4">
                        <button
                          type="button"
                          onClick={() => setShowCreateModal(false)}
                          className="rounded-lg border border-white/10 px-4 py-2 text-xs font-bold text-zinc-300 hover:bg-white/5"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="rounded-lg bg-hos-red px-4 py-2 text-xs font-bold text-white hover:brightness-110"
                        >
                          {editingEventId ? "Save Changes" : "Save Event"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {["Navigation", "Applications"].includes(active) && (
            <div className="glass-panel rounded-2xl p-5">
              <h2 className="font-bold text-white">{active}</h2>
              <p className="mt-2 text-sm text-zinc-400">This module is not yet configured with persistent fields.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
