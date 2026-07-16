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
  AlertTriangle,
  Info,
  Clock,
} from "lucide-react";
import * as FaIcons from "react-icons/fa6";
import { motion, AnimatePresence } from "framer-motion";
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
  votingEnabled?: boolean;
  votingStartsBeforeDays?: number;
  votingEndsBeforeMinutes?: number;
  createDelayDays?: number;
  maxParticipants?: number | null;
  recurrenceDays?: number | null;
  endsAt?: string;
  color?: string;
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

const slotsConfig = [
  { slot: 1, startHour: 3, startMin: 0, endHour: 5, endMin: 0, crossMidnight: false },
  { slot: 2, startHour: 7, startMin: 0, endHour: 9, endMin: 0, crossMidnight: false },
  { slot: 3, startHour: 9, startMin: 0, endHour: 11, endMin: 0, crossMidnight: false },
  { slot: 4, startHour: 11, startMin: 0, endHour: 13, endMin: 0, crossMidnight: false },
  { slot: 5, startHour: 13, startMin: 0, endHour: 15, endMin: 0, crossMidnight: false },
  { slot: 6, startHour: 15, startMin: 0, endHour: 17, endMin: 0, crossMidnight: false },
  { slot: 7, startHour: 17, startMin: 0, endHour: 19, endMin: 0, crossMidnight: false },
  { slot: 8, startHour: 19, startMin: 0, endHour: 21, endMin: 0, crossMidnight: false },
  { slot: 9, startHour: 21, startMin: 0, endHour: 23, endMin: 0, crossMidnight: false },
  { slot: 10, startHour: 23, startMin: 0, endHour: 1, endMin: 0, crossMidnight: true }
];

const nextDayStr = (dateStr: string): string => {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + 1));
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getSlotTimes = (baseDateStr: string, slotNum: number) => {
  const config = slotsConfig[slotNum - 1];
  const startStr = `${baseDateStr}T${String(config.startHour).padStart(2, "0")}:${String(config.startMin).padStart(2, "0")}`;
  let endStr = "";
  if (config.crossMidnight) {
    const nextDay = nextDayStr(baseDateStr);
    endStr = `${nextDay}T${String(config.endHour).padStart(2, "0")}:${String(config.endMin).padStart(2, "0")}`;
  } else {
    endStr = `${baseDateStr}T${String(config.endHour).padStart(2, "0")}:${String(config.endMin).padStart(2, "0")}`;
  }
  return {
    startText: `${baseDateStr} ${String(config.startHour).padStart(2, "0")}:${String(config.startMin).padStart(2, "0")}:00`,
    endText: `${config.crossMidnight ? nextDayStr(baseDateStr) : baseDateStr} ${String(config.endHour).padStart(2, "0")}:${String(config.endMin).padStart(2, "0")}:00`,
    startDateLocal: startStr,
    endDateLocal: endStr
  };
};

const getTodayEstString = (): string => {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
    const parts = formatter.formatToParts(new Date());
    const p: Record<string, string> = {};
    parts.forEach(part => p[part.type] = part.value);
    return `${p.year}-${p.month}-${p.day}`;
  } catch {
    return new Date().toISOString().split("T")[0];
  }
};

const getNextWednesdayOrSaturdayEstString = (): string => {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
    const parts = formatter.formatToParts(new Date());
    const p: Record<string, string> = {};
    parts.forEach(part => p[part.type] = part.value);
    
    const year = Number(p.year);
    const month = Number(p.month);
    const day = Number(p.day);
    
    const nyDate = new Date(Date.UTC(year, month - 1, day));
    
    for (let i = 0; i < 8; i++) {
      const checkDate = new Date(nyDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dayOfWeek = checkDate.getUTCDay();
      if (dayOfWeek === 3 || dayOfWeek === 6) {
        const y = checkDate.getUTCFullYear();
        const m = String(checkDate.getUTCMonth() + 1).padStart(2, "0");
        const d = String(checkDate.getUTCDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
      }
    }
    return `${p.year}-${p.month}-${p.day}`;
  } catch {
    const now = new Date();
    for (let i = 0; i < 8; i++) {
      const checkDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      const dayOfWeek = checkDate.getDay();
      if (dayOfWeek === 3 || dayOfWeek === 6) {
        const y = checkDate.getFullYear();
        const m = String(checkDate.getMonth() + 1).padStart(2, "0");
        const d = String(checkDate.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
      }
    }
    return now.toISOString().split("T")[0];
  }
};

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
  "FaUsersGear",
  "FaPeopleGroup",
  "FaCalendarDays",
  "FaBolt",
  "FaFire",
  "FaCompass",
  "FaScrewdriverWrench",
  "FaHammer",
  "FaSwords",
  "FaHelmetBattle",
  "FaCrosshairs",
  "FaSkullCrossbones",
  "FaSkull",
  "FaBomb",
  "FaExplosion",
  "FaChessKnight",
  "FaChessRook",
  "FaChessKing",
  "FaChessQueen",
  "FaChess",
  "FaTrophy",
  "FaCrown",
  "FaMedal",
  "FaChartLine",
  "FaMap",
  "FaGlobe",
  "FaRobot",
  "FaBook",
  "FaClipboardList",
  "FaRankingStar",
  "FaFlag",
  "FaFlagCheckered",
  "FaStar",
  "FaBell",
  "FaRocket",
  "FaLink",
  "FaClock",
  "FaGem",
  "FaTowerBroadcast",
  "FaHandshake",
  "FaBullhorn",
] as const;

const input =
  "mt-1 w-full rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-sm text-zinc-200 outline-none transition focus:border-hos-red";

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="text-sm text-zinc-300">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={input}
      />
    </label>
  );
}

function SectionActions({
  canSave,
  onSave,
  onReset,
  saveLabel = "Save section",
  primaryColor,
}: {
  canSave: boolean;
  onSave: () => void;
  onReset: () => void;
  saveLabel?: string;
  primaryColor?: string;
}) {
  return (
    <div className="mt-4 flex items-center justify-end gap-2">
      <button
        onClick={onReset}
        className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition hover:bg-white/5"
      >
        Reset
      </button>
      <button
        onClick={onSave}
        disabled={!canSave}
        style={primaryColor ? { backgroundColor: primaryColor } : undefined}
        className="rounded-lg px-3 py-1.5 text-xs font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
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
  if (typeof payload.recruitmentEmailSenderName === "string") {
    next.recruitmentEmailSenderName = payload.recruitmentEmailSenderName;
  }
  if (typeof payload.recruitmentEmailReceiver === "string") {
    next.recruitmentEmailReceiver = payload.recruitmentEmailReceiver;
  }
  if (typeof payload.recruitmentEmailLimitPer30Min === "number") {
    next.recruitmentEmailLimitPer30Min = payload.recruitmentEmailLimitPer30Min;
  }
  if (typeof payload.chatMessagesLimitPerMin === "number") {
    next.chatMessagesLimitPerMin = payload.chatMessagesLimitPerMin;
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
      recruitmentEmailSenderName: draft.recruitmentEmailSenderName,
      recruitmentEmailReceiver: draft.recruitmentEmailReceiver,
      recruitmentEmailLimitPer30Min: draft.recruitmentEmailLimitPer30Min,
      chatMessagesLimitPerMin: draft.chatMessagesLimitPerMin,
    };
  }

  if (section === "Website Settings") {
    return {
      title: draft.title,
      banner: draft.banner,
      footer: draft.footer,
      youtubeUrl: draft.youtubeUrl,
      discordUrl: draft.discordUrl,
      recruitmentEmailSenderName: draft.recruitmentEmailSenderName,
      recruitmentEmailReceiver: draft.recruitmentEmailReceiver,
      recruitmentEmailLimitPer30Min: draft.recruitmentEmailLimitPer30Min,
      chatMessagesLimitPerMin: draft.chatMessagesLimitPerMin,
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
      config.discordUrl !== draft.discordUrl ||
      config.recruitmentEmailSenderName !== draft.recruitmentEmailSenderName ||
      config.recruitmentEmailReceiver !== draft.recruitmentEmailReceiver ||
      config.recruitmentEmailLimitPer30Min !== draft.recruitmentEmailLimitPer30Min ||
      config.chatMessagesLimitPerMin !== draft.chatMessagesLimitPerMin
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

  // Auto-clear status message after 3 seconds
  useEffect(() => {
    if (!status) return;
    const timer = setTimeout(() => {
      setStatus("");
    }, 3000);
    return () => clearTimeout(timer);
  }, [status]);

  const [range, setRange] = useState<RangeFilter>("today");

  // Confirmation Modal state
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const showConfirm = ({
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    isDestructive = false,
    onConfirm,
  }: {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void | Promise<void>;
  }) => {
    setConfirmState({
      isOpen: true,
      title,
      message,
      confirmLabel,
      cancelLabel,
      isDestructive,
      onConfirm: () => {
        void Promise.resolve(onConfirm()).catch(() => {});
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };
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
  const [editingToolIds, setEditingToolIds] = useState<string[]>([]);
  const [svsEditMode, setSvsEditMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [successAnimation, setSuccessAnimation] = useState<{ type: "create" | "update" | "delete"; title: string } | null>(null);
  const [iconPickerTarget, setIconPickerTarget] = useState<{ type: "create" | "edit"; id?: string } | null>(null);

  // Event states
  const [events, setEvents] = useState<Array<AdminEvent>>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventHidden, setEventHidden] = useState(false);
  const [eventVotingEnabled, setEventVotingEnabled] = useState(false);
  const [eventRecurrenceDays, setEventRecurrenceDays] = useState<number | null>(null);
  const [eventVotingStartsBeforeDays, setEventVotingStartsBeforeDays] = useState(-1);
  const [eventDurationMinutes, setEventDurationMinutes] = useState<string>("60");
  const [savingEvent, setSavingEvent] = useState(false);
  const [eventColor, setEventColor] = useState("#00f3ff");
  const [eventRepeatEnabled, setEventRepeatEnabled] = useState(false);
  const [showRepeatConfigModal, setShowRepeatConfigModal] = useState(false);
  const [showVotingConfigModal, setShowVotingConfigModal] = useState(false);
  const [isNewVotingConfig, setIsNewVotingConfig] = useState(false);
  const [tempRecurrenceOption, setTempRecurrenceOption] = useState<string>("7");
  const [tempRecurrenceDays, setTempRecurrenceDays] = useState<number>(7);
  const [eventCreateDelayDays, setEventCreateDelayDays] = useState(0);
  const [tempCreateDelayOption, setTempCreateDelayOption] = useState<string>("0");
  const [tempCreateDelayDays, setTempCreateDelayDays] = useState<number>(2);
  const [tempVotingStartsBeforeOption, setTempVotingStartsBeforeOption] = useState<string>("always");
  const [tempVotingStartsBeforeDays, setTempVotingStartsBeforeDays] = useState<number>(1);
  const [eventMaxParticipantsEnabled, setEventMaxParticipantsEnabled] = useState(false);
  const [eventMaxParticipantsLimit, setEventMaxParticipantsLimit] = useState(20);
  const [eventVotingEndsBeforeMinutes, setEventVotingEndsBeforeMinutes] = useState(0);
  const [tempVotingEndsBeforeOption, setTempVotingEndsBeforeOption] = useState<string>("0");
  const [tempVotingEndsBeforeHours, setTempVotingEndsBeforeHours] = useState<number>(1);
  const [tempVotingEndsBeforeMins, setTempVotingEndsBeforeMins] = useState<number>(0);

  // Battlefield Event states
  const [activeEventTab, setActiveEventTab] = useState<"battlefield" | "regular">("battlefield");
  const [battlefieldBaseDate, setBattlefieldBaseDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<number>(1);
  const [bfRepeatEnabled, setBfRepeatEnabled] = useState(true);
  const [bfRepeatOption, setBfRepeatOption] = useState<"7" | "custom">("7");
  const [bfRepeatDays, setBfRepeatDays] = useState(7);

  // Tool creation modal states
  const [showToolModal, setShowToolModal] = useState(false);
  const [toolTitle, setToolTitle] = useState("");
  const [toolDescription, setToolDescription] = useState("");
  const [toolCategory, setToolCategory] = useState("General");
  const [toolIcon, setToolIcon] = useState("FaWrench");
  const [toolColor, setToolColor] = useState(config.primaryColor || "#00f3ff");
  const [toolOrder, setToolOrder] = useState(1);
  const [toolLink, setToolLink] = useState("/tools");
  const [toolVisible, setToolVisible] = useState(true);

  const handleOpenToolModal = () => {
    setToolTitle("");
    setToolDescription("");
    setToolCategory("General");
    setToolIcon("FaWrench");
    setToolColor(draft.primaryColor || "#00f3ff");
    setToolOrder(draft.tools.length + 1);
    setToolLink("/tools");
    setToolVisible(true);
    setShowToolModal(true);
  };

  const handleToolSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!toolTitle.trim()) {
      setStatus("Please fill out the Tool Name.");
      return;
    }
    const newTool = {
      id: crypto.randomUUID(),
      title: toolTitle.trim(),
      description: toolDescription.trim(),
      icon: toolIcon,
      color: toolColor,
      category: toolCategory.trim() || "General",
      order: Number(toolOrder) || draft.tools.length + 1,
      link: toolLink.trim() || "/tools",
      enabled: true,
      visible: toolVisible,
    };
    const updatedTools = [...draft.tools, newTool];

    try {
      await api<{ ok: boolean }>("/admin/config", {
        method: "PUT",
        body: JSON.stringify({ tools: updatedTools }),
      });
      setDraft((current) => ({
        ...current,
        tools: updatedTools,
      }));
      updateConfig(mergeSiteConfig(config, { tools: updatedTools }));
      setShowToolModal(false);
      setSuccessAnimation({ type: "create", title: "Tool Created!" });
      setTimeout(() => setSuccessAnimation(null), 1200);
      setStatus(`Created and saved tool "${toolTitle.trim()}" successfully.`);
      await refreshConfig();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to automatically save new tool.");
    }
  };

  const loadEvents = async () => {
    setLoadingEvents(true);
    try {
      const data = await api<Array<AdminEvent>>("/events");
      const sorted = [...data].sort((a, b) => b._id.localeCompare(a._id));
      setEvents(sorted);
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
    setEventVotingEnabled(false);
    setEventRecurrenceDays(null);
    setEventVotingStartsBeforeDays(-1);
    setEventVotingEndsBeforeMinutes(0);
    setEventCreateDelayDays(0);
    setEventMaxParticipantsEnabled(false);
    setEventMaxParticipantsLimit(20);
    setEventDurationMinutes("60");
    setEventColor(draft.primaryColor || "#00f3ff");
    setEventRepeatEnabled(false);
    setActiveEventTab("battlefield");
    setBattlefieldBaseDate(getNextWednesdayOrSaturdayEstString());
    setSelectedSlot(1);
    setBfRepeatEnabled(true);
    setBfRepeatOption("7");
    setBfRepeatDays(7);
    setShowCreateModal(true);
  };

  const handleOpenEditModal = (event: AdminEvent) => {
    setEditingEventId(event._id);
    setEventDescription(event.description || "");
    setEventHidden(event.hidden || false);
    setEventColor(event.color || draft.primaryColor || "#00f3ff");

    const battlefieldMatch = event.title.match(/\s*\(Slot (\d+)\)$/);
    if (battlefieldMatch) {
      const slotNum = Number(battlefieldMatch[1]);
      setActiveEventTab("battlefield");
      setEventTitle(event.title.replace(/\s*\(Slot \d+\)$/, ""));
      setSelectedSlot(slotNum);
      
      const edtDateStr = formatUtcToTimezone(event.date, "America/New_York");
      const baseDate = edtDateStr.split("T")[0];
      setBattlefieldBaseDate(baseDate);
      
      const hasRepeat = event.recurrenceDays != null && event.recurrenceDays > 0;
      setBfRepeatEnabled(hasRepeat);
      if (hasRepeat) {
        setBfRepeatDays(event.recurrenceDays ?? 7);
        if (event.recurrenceDays === 7) {
          setBfRepeatOption("7");
        } else {
          setBfRepeatOption("custom");
        }
      } else {
        setBfRepeatOption("7");
      }
      
      setEventDate(edtDateStr);
      setEventVotingEnabled(true);
      setEventVotingStartsBeforeDays(-1);
      const config = slotsConfig[slotNum - 1];
      setEventVotingEndsBeforeMinutes(config ? (config.startHour - 2) * 60 : 0);
      setEventCreateDelayDays(event.createDelayDays || 0);
      setEventMaxParticipantsEnabled(false);
      setEventMaxParticipantsLimit(20);
      setEventDurationMinutes("120");
      setEventRecurrenceDays(event.recurrenceDays || null);
      setEventRepeatEnabled(hasRepeat);
    } else {
      setActiveEventTab("regular");
      setEventTitle(event.title);
      setEventDate(formatUtcToTimezone(event.date, "America/New_York"));
      setEventVotingEnabled(event.votingEnabled || false);
      setEventRecurrenceDays(event.recurrenceDays || null);
      setEventVotingStartsBeforeDays(event.votingStartsBeforeDays === undefined || event.votingStartsBeforeDays === null || event.votingStartsBeforeDays === 0 ? -1 : event.votingStartsBeforeDays);
      setEventVotingEndsBeforeMinutes(event.votingEndsBeforeMinutes || 0);
      setEventCreateDelayDays(event.createDelayDays || 0);
      setEventMaxParticipantsEnabled(event.maxParticipants !== null && event.maxParticipants !== undefined && event.maxParticipants > 0);
      setEventMaxParticipantsLimit(event.maxParticipants || 20);
      if (event.createDelayDays && event.createDelayDays > 0) {
        setTempCreateDelayOption("custom");
        setTempCreateDelayDays(event.createDelayDays);
      } else {
        setTempCreateDelayOption("0");
        setTempCreateDelayDays(2);
      }
      const duration = event.endsAt && event.startsAt
        ? Math.max(1, Math.round((new Date(event.endsAt).getTime() - new Date(event.startsAt).getTime()) / 60_000))
        : 60;
      setEventDurationMinutes(String(duration));
      setEventRepeatEnabled(event.recurrenceDays !== null && event.recurrenceDays !== undefined && event.recurrenceDays > 0);
    }
    setShowCreateModal(true);
  };

  const handleDeleteEvent = (id: string) => {
    showConfirm({
      title: "Delete Event",
      message: "Are you sure you want to delete this event? This action cannot be undone.",
      confirmLabel: "Delete",
      isDestructive: true,
      onConfirm: async () => {
        try {
          await api(`/events/${id}`, {
            method: "DELETE",
          });
           setSuccessAnimation({ type: "delete", title: "Event Deleted!" });
          setTimeout(() => setSuccessAnimation(null), 1200);
          setStatus("Event deleted successfully.");
          void loadEvents();
        } catch (error) {
          setStatus(error instanceof Error ? error.message : "Failed to delete event.");
        }
      },
    });
  };

  const handleEventSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    let titleToSubmit = eventTitle;
    let dateToSubmit = eventDate;
    let durationToSubmit = Number(eventDurationMinutes);
    let votingEnabledToSubmit = eventVotingEnabled;
    let recurrenceDaysToSubmit = eventRecurrenceDays;
    let votingStartsBeforeDaysToSubmit = eventVotingStartsBeforeDays;
    let votingEndsBeforeMinutesToSubmit = eventVotingEndsBeforeMinutes;

    if (activeEventTab === "battlefield") {
      if (!eventTitle || !battlefieldBaseDate) {
        setStatus("Please fill out Title and Base Date fields.");
        return;
      }
      const config = slotsConfig[selectedSlot - 1];
      const times = getSlotTimes(battlefieldBaseDate, selectedSlot);
      titleToSubmit = `${eventTitle.trim()} (Slot ${selectedSlot})`;
      dateToSubmit = times.startDateLocal;
      durationToSubmit = 120;
      votingEnabledToSubmit = true;
      votingStartsBeforeDaysToSubmit = -1;
      votingEndsBeforeMinutesToSubmit = (config.startHour - 2) * 60;
      recurrenceDaysToSubmit = bfRepeatEnabled ? bfRepeatDays : null;
    }

    if (!titleToSubmit || !dateToSubmit) {
      setStatus("Please fill out Title and Date fields.");
      return;
    }
    if (activeEventTab === "regular") {
      const dur = Number(durationToSubmit);
      if (!durationToSubmit || isNaN(dur) || dur < 1) {
        setStatus("Please enter a valid duration (at least 1 minute).");
        return;
      }
      durationToSubmit = dur;
    }
    const year = dateToSubmit.split("-")[0];
    if (year.length !== 4) {
      setStatus("Please enter a valid 4-digit year.");
      return;
    }
    setSavingEvent(true);
    try {
      const payload = {
        title: titleToSubmit,
        description: eventDescription,
        date: parseDateTimeInTimezone(dateToSubmit, "America/New_York").toISOString(),
        hidden: eventHidden,
        durationMinutes: durationToSubmit,
        votingEnabled: votingEnabledToSubmit,
        recurrenceDays: recurrenceDaysToSubmit,
        votingStartsBeforeDays: votingStartsBeforeDaysToSubmit,
        votingEndsBeforeMinutes: votingEndsBeforeMinutesToSubmit,
        createDelayDays: eventCreateDelayDays,
        maxParticipants: eventMaxParticipantsEnabled ? eventMaxParticipantsLimit : null,
        color: eventColor,
      };

      if (editingEventId) {
        await api(`/events/${editingEventId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setSuccessAnimation({ type: "update", title: "Event Saved!" });
        setTimeout(() => setSuccessAnimation(null), 1200);
        setStatus("Event updated successfully.");
      } else {
        await api("/events", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setSuccessAnimation({ type: "create", title: "Event Created!" });
        setTimeout(() => setSuccessAnimation(null), 1200);
        setStatus("Event created successfully.");
      }

      setShowCreateModal(false);
      void loadEvents();
      setEventTitle("");
      setEventDescription("");
      setEventDate("");
      setEventHidden(false);
      setEventVotingEnabled(false);
      setEventRecurrenceDays(null);
      setEventVotingStartsBeforeDays(-1);
      setEventVotingEndsBeforeMinutes(0);
      setEventCreateDelayDays(0);
      setEventMaxParticipantsEnabled(false);
      setEventMaxParticipantsLimit(20);
      setEventDurationMinutes("60");
      setEventColor(draft.primaryColor || "#00f3ff");
      setEventRepeatEnabled(false);
      setEditingEventId(null);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to save event.");
    } finally {
      setSavingEvent(false);
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

  const saveSection = (section: SectionName) => {
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

    showConfirm({
      title: `Save ${section} Changes`,
      message: `Are you sure you want to save your ${section} changes to the database?`,
      confirmLabel: "Save",
      onConfirm: async () => {
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

           setSuccessAnimation({ type: "update", title: `${section} Saved!` });
          setTimeout(() => setSuccessAnimation(null), 1200);
          setStatus(`Saved ${section} changes to database.`);
          await refreshConfig();
          if (section === "SVS History") {
            setSvsEditMode(false);
          }
          if (section === "Tools") {
            setToolsEditMode(false);
            setEditingToolIds([]);
          }
          if (section === "Dashboard" || section === "Analytics") {
            void loadSummary(range);
          }
        } catch (error) {
          setStatus(error instanceof Error ? error.message : `Failed to save ${section}.`);
        }
      },
    });
  };

  const resetAll = () => {
    showConfirm({
      title: "Discard Changes",
      message: "Are you sure you want to discard all unsaved changes?",
      confirmLabel: "Discard",
      isDestructive: true,
      onConfirm: () => {
        setDraft(config);
        setToolsEditMode(false);
        setEditingToolIds([]);
        setStatus("Changes reset.");
      },
    });
  };

  const alterTool = (id: string, patch: Partial<Tool>) => {
    setDraft((current) => ({
      ...current,
      tools: current.tools.map((tool) => (tool.id === id ? { ...tool, ...patch } : tool)),
    }));
  };

  const discardToolChanges = (id: string) => {
    const tool = draft.tools.find((t) => t.id === id);
    const original = config.tools.find((t) => t.id === id);
    const toolTitle = tool ? tool.title : "this tool";

    showConfirm({
      title: "Discard Tool Changes",
      message: `Are you sure you want to discard your unsaved changes for "${toolTitle}"?`,
      confirmLabel: "Discard",
      isDestructive: true,
      onConfirm: () => {
        if (original) {
          setDraft((current) => ({
            ...current,
            tools: current.tools.map((t) => (t.id === id ? original : t)),
          }));
        } else {
          setDraft((current) => ({
            ...current,
            tools: current.tools.filter((t) => t.id !== id),
          }));
        }
        setEditingToolIds((prev) => prev.filter((item) => item !== id));
      },
    });
  };

  const removeTool = (id: string) => {
    const tool = draft.tools.find((t) => t.id === id);
    const toolTitle = tool ? tool.title : "this tool";

    showConfirm({
      title: "Delete Tool",
      message: `Are you sure you want to delete "${toolTitle}"?`,
      confirmLabel: "Delete",
      isDestructive: true,
      onConfirm: async () => {
        const updatedTools = draft.tools
          .filter((t) => t.id !== id)
          .sort((a, b) => a.order - b.order)
          .map((t, index) => ({ ...t, order: index + 1 }));

        try {
          await api<{ ok: boolean }>("/admin/config", {
            method: "PUT",
            body: JSON.stringify({ tools: updatedTools }),
          });
          setDraft((current) => ({
            ...current,
            tools: updatedTools,
          }));
          setEditingToolIds((prev) => prev.filter((item) => item !== id));
          updateConfig(mergeSiteConfig(config, { tools: updatedTools }));
           setSuccessAnimation({ type: "delete", title: "Tool Deleted!" });
          setTimeout(() => setSuccessAnimation(null), 1200);
          setStatus(`Deleted and saved tool "${toolTitle}" successfully.`);
          await refreshConfig();
        } catch (error) {
          setStatus(error instanceof Error ? error.message : "Failed to delete tool.");
        }
      },
    });
  };

  const isToolEdited = (tool: Tool) => {
    const original = config.tools.find((t) => t.id === tool.id);
    if (!original) return true;
    return (
      original.title !== tool.title ||
      original.description !== tool.description ||
      original.icon !== tool.icon ||
      original.color !== tool.color ||
      original.category !== tool.category ||
      original.order !== tool.order ||
      original.link !== tool.link ||
      original.enabled !== tool.enabled ||
      original.visible !== tool.visible
    );
  };

  const saveSingleTool = async (toolToSave: Tool) => {
    const updatedTools = draft.tools.map((t) => t.id === toolToSave.id ? toolToSave : t);
    try {
      await api<{ ok: boolean }>("/admin/config", {
        method: "PUT",
        body: JSON.stringify({ tools: updatedTools }),
      });
      updateConfig(mergeSiteConfig(config, { tools: updatedTools }));
       setSuccessAnimation({ type: "update", title: "Tool Saved!" });
      setTimeout(() => setSuccessAnimation(null), 1200);
      setStatus(`Saved changes to "${toolToSave.title}" successfully.`);
      setEditingToolIds((prev) => prev.filter((id) => id !== toolToSave.id));
      await refreshConfig();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to save tool changes.");
    }
  };

  const moveTool = (id: string, direction: "up" | "down") => {
    const tool = draft.tools.find((t) => t.id === id);
    const toolTitle = tool ? tool.title : "this tool";

    showConfirm({
      title: `Move Tool ${direction === "up" ? "Up" : "Down"}`,
      message: `Are you sure you want to move "${toolTitle}" ${direction}?`,
      confirmLabel: "Move",
      onConfirm: async () => {
        const sorted = [...draft.tools].sort((a, b) => a.order - b.order);
        const index = sorted.findIndex((t) => t.id === id);
        if (index === -1) return;

        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= sorted.length) return;

        const swapped = [...sorted];
        [swapped[index], swapped[targetIndex]] = [swapped[targetIndex], swapped[index]];

        const normalized = swapped.map((t, orderIndex) => ({ ...t, order: orderIndex + 1 }));

        try {
          await api<{ ok: boolean }>("/admin/config", {
            method: "PUT",
            body: JSON.stringify({ tools: normalized }),
          });
          setDraft((current) => ({
            ...current,
            tools: normalized,
          }));
          updateConfig(mergeSiteConfig(config, { tools: normalized }));
          setSuccessAnimation({ type: "update", title: "Order Updated!" });
          setTimeout(() => setSuccessAnimation(null), 1200);
          setStatus(`Moved tool "${toolTitle}" ${direction} successfully.`);
          await refreshConfig();
        } catch (error) {
          setStatus(error instanceof Error ? error.message : "Failed to move tool.");
        }
      },
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
                style={active === name ? { backgroundColor: draft.primaryColor } : undefined}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                  active === name
                    ? "text-white"
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
                style={active === name ? { backgroundColor: draft.primaryColor } : undefined}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                  active === name
                    ? "text-white"
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

          <AnimatePresence>
            {status ? (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="glass-panel mb-3 rounded-xl px-4 py-2 text-xs text-zinc-300"
              >
                {status}
              </motion.div>
            ) : null}
          </AnimatePresence>

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
                  primaryColor={draft.primaryColor}
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
                <div className="border-t border-white/10 my-1 pt-4" />
                <h3 className="text-sm font-bold text-white tracking-wide">Recruitment Email Settings</h3>
                <Field
                  label="Email Sender Name"
                  value={draft.recruitmentEmailSenderName || ""}
                  onChange={(recruitmentEmailSenderName) => setDraft((current) => ({ ...current, recruitmentEmailSenderName }))}
                  placeholder="e.g. HOS Recruitment"
                />
                <Field
                  label="Recruitment Application Receiver Email"
                  value={draft.recruitmentEmailReceiver || ""}
                  onChange={(recruitmentEmailReceiver) => setDraft((current) => ({ ...current, recruitmentEmailReceiver }))}
                  placeholder="e.g. leadership@domain.com (Leave empty to use env default)"
                />
                <label className="text-sm text-zinc-300 block mt-4">
                  Recruitment Submission Limit (Applications per 30 min)
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={draft.recruitmentEmailLimitPer30Min || 2}
                    onChange={(e) => {
                      const val = Math.max(1, Math.min(20, Number(e.target.value) || 1));
                      setDraft((current) => ({ ...current, recruitmentEmailLimitPer30Min: val }));
                    }}
                    className={input}
                  />
                </label>
                <label className="text-sm text-zinc-300 block mt-4">
                  Chat Message Send Limit (Messages per minute)
                  <input
                    type="number"
                    min={5}
                    max={120}
                    value={draft.chatMessagesLimitPerMin || 30}
                    onChange={(e) => {
                      const val = Math.max(5, Math.min(120, Number(e.target.value) || 5));
                      setDraft((current) => ({ ...current, chatMessagesLimitPerMin: val }));
                    }}
                    className={input}
                  />
                </label>
                <p className="text-xs text-zinc-500 mt-2">Banner values are appended to default homepage messages.</p>
              </div>
              <SectionActions
                canSave={hasSectionChanges("Website Settings", config, draft)}
                onSave={() => void saveSection("Website Settings")}
                onReset={resetAll}
                primaryColor={draft.primaryColor}
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
                primaryColor={draft.primaryColor}
              />
            </div>
          )}

          {active === "Tools" && (
            <motion.div layout className="space-y-4">
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setToolsEditMode((current) => !current)}
                  style={{ borderColor: `${draft.primaryColor}50`, color: draft.primaryColor }}
                  className="rounded-lg border px-3 py-1.5 text-xs font-bold transition hover:bg-white/10"
                >
                  {toolsEditMode ? "Stop editing" : "Edit tools"}
                </button>
                <button
                  onClick={() => void saveSection("Tools")}
                  disabled={!toolsEditMode || !hasSectionChanges("Tools", config, draft)}
                  style={{ backgroundColor: draft.primaryColor }}
                  className="rounded-lg px-3 py-1.5 text-xs font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Save tools section
                </button>
                <button
                  onClick={handleOpenToolModal}
                  style={{ backgroundColor: draft.primaryColor }}
                  className="rounded-lg px-3 py-1.5 text-xs font-bold text-white transition hover:brightness-110"
                >
                  Add tool
                </button>
              </div>

              <AnimatePresence mode="popLayout">
                {[...draft.tools]
                  .sort((a, b) => a.order - b.order)
                  .map((tool) => {
                    const Icon = FaIcons[tool.icon as keyof typeof FaIcons] as
                      | React.ComponentType<{ className?: string }>
                      | undefined;
                    const isEditable = toolsEditMode || editingToolIds.includes(tool.id);

                    return (
                      <motion.div
                        key={tool.id}
                        layout
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.25 }}
                        className="glass-panel rounded-xl p-4"
                      >
                      <div className="grid gap-3 md:grid-cols-[1.2fr_1.6fr_1.2fr_130px_auto]">
                        <div>
                          <input
                            value={tool.title}
                            onChange={(event) => alterTool(tool.id, { title: event.target.value })}
                            disabled={!isEditable}
                            className="w-full bg-transparent text-sm font-bold text-white outline-none"
                          />
                          <input
                            value={tool.category}
                            onChange={(event) => alterTool(tool.id, { category: event.target.value })}
                            disabled={!isEditable}
                            className="mt-1 w-full bg-transparent text-[11px] uppercase tracking-[0.14em] text-hos-red outline-none"
                          />
                        </div>

                        <textarea
                          value={tool.description}
                          onChange={(event) => alterTool(tool.id, { description: event.target.value })}
                          disabled={!isEditable}
                          rows={3}
                          className="w-full rounded bg-black/25 px-2 py-1 text-xs text-zinc-300 outline-none resize-y"
                          placeholder="Tool description"
                        />

                        <div className="space-y-2">
                          <input
                            value={tool.link}
                            onChange={(event) => alterTool(tool.id, { link: event.target.value })}
                            disabled={!isEditable}
                            className="w-full rounded bg-black/25 px-2 py-1 text-xs text-zinc-300 outline-none"
                            placeholder="/tools or https://..."
                          />
                          <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/25 p-2 flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <div className="grid h-7 w-7 place-items-center rounded bg-black/45" style={{ color: tool.color }}>
                                {Icon ? <Icon className="h-4 w-4" /> : <Wrench className="h-4 w-4" />}
                              </div>
                              <span className="text-[10px] font-mono text-zinc-300 truncate max-w-[80px]" title={tool.icon}>{tool.icon}</span>
                            </div>
                            <button
                              type="button"
                              disabled={!isEditable}
                              onClick={() => setIconPickerTarget({ type: "edit", id: tool.id })}
                              className="rounded border border-white/10 px-2 py-1 text-[10px] font-bold text-zinc-300 transition hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Change Icon
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={tool.color}
                              onChange={(event) => alterTool(tool.id, { color: event.target.value })}
                              disabled={!isEditable}
                              className="h-8 w-10 rounded border border-white/10 bg-transparent"
                            />
                            <input
                              value={tool.color}
                              onChange={(event) => alterTool(tool.id, { color: event.target.value })}
                              disabled={!isEditable}
                              className="w-full rounded bg-black/25 px-2 py-1 text-xs text-zinc-300 outline-none"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={tool.order}
                              onChange={(event) => alterTool(tool.id, { order: Number(event.target.value) || 1 })}
                              disabled={!isEditable}
                              className="w-14 rounded bg-black/25 px-2 py-1 text-xs text-zinc-300 outline-none"
                            />
                            <button
                              type="button"
                              disabled={!isEditable}
                              onClick={() => alterTool(tool.id, { visible: !tool.visible })}
                              style={tool.visible ? { backgroundColor: `${draft.primaryColor}20`, borderColor: draft.primaryColor, color: draft.primaryColor } : undefined}
                              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition border ${
                                tool.visible
                                  ? "border-neon-blue/40 text-neon-blue bg-neon-blue/10"
                                  : "border-white/10 bg-black/25 text-zinc-500 hover:border-white/20"
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {tool.visible ? "Shown" : "Hidden"}
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-col items-end justify-between gap-2">
                          <div className="grid h-10 w-10 place-items-center rounded-lg bg-black/45" style={{ color: tool.color }}>
                            {Icon ? <Icon className="h-5 w-5" /> : <Wrench className="h-5 w-5" />}
                          </div>
                          <div className="flex items-center gap-1">
                            {isEditable && isToolEdited(tool) && (
                              <button
                                onClick={() => void saveSingleTool(tool)}
                                style={{ backgroundColor: draft.primaryColor }}
                                className="rounded px-2.5 py-1 text-[11px] font-bold text-white transition hover:brightness-110 active:scale-95 animate-pulse"
                              >
                                Save
                              </button>
                            )}
                            {!toolsEditMode && (
                              editingToolIds.includes(tool.id) ? (
                                <button
                                  type="button"
                                  onClick={() => discardToolChanges(tool.id)}
                                  className="rounded border border-amber-500/40 px-2 py-1 text-[11px] text-amber-400 transition hover:bg-amber-500/10"
                                >
                                  Discard
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setEditingToolIds((prev) => [...prev, tool.id])}
                                  className="rounded border border-white/10 px-2 py-1 text-[11px] text-zinc-300 transition hover:bg-white/5"
                                >
                                  Edit
                                </button>
                              )
                            )}
                            <button
                              type="button"
                              onClick={() => moveTool(tool.id, "up")}
                              disabled={tool.order === 1}
                              className="rounded border border-white/10 px-2 py-1 text-[11px] text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed transition hover:bg-white/5"
                            >
                              Up
                            </button>
                            <button
                              type="button"
                              onClick={() => moveTool(tool.id, "down")}
                              disabled={tool.order === draft.tools.length}
                              className="rounded border border-white/10 px-2 py-1 text-[11px] text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed transition hover:bg-white/5"
                            >
                              Down
                            </button>
                            <button
                              type="button"
                              onClick={() => removeTool(tool.id)}
                              className="rounded border border-red-900/60 px-2 py-1 text-[11px] text-red-300 transition hover:bg-red-950/20"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                      </motion.div>
                    );
                  })}
              </AnimatePresence>

              <AnimatePresence>
                {showToolModal && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 15 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 15 }}
                      transition={{ type: "spring", duration: 0.3 }}
                      className="glass-panel w-full max-w-md rounded-2xl p-6 shadow-2xl"
                    >
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <h3 className="text-lg font-bold text-white">Create New Tool</h3>
                      <button
                        onClick={() => setShowToolModal(false)}
                        className="rounded-lg border border-white/15 p-1 text-zinc-400 hover:text-white"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <form onSubmit={handleToolSubmit} className="mt-4 space-y-4">
                      <div>
                        <Field label="Tool Name" value={toolTitle} onChange={setToolTitle} />
                      </div>
                      <div>
                        <label className="text-sm text-zinc-300">
                          Description
                          <textarea
                            value={toolDescription}
                            onChange={(e) => setToolDescription(e.target.value)}
                            rows={2}
                            className="mt-1 w-full rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-sm text-zinc-200 outline-none transition focus:border-hos-red"
                            placeholder="Provide details about the tool..."
                          />
                        </label>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Category" value={toolCategory} onChange={setToolCategory} />
                        <Field label="Link / URL" value={toolLink} onChange={setToolLink} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <label className="text-sm text-zinc-300">
                          Display Order
                          <input
                            type="number"
                            min={1}
                            value={toolOrder}
                            onChange={(e) => setToolOrder(Number(e.target.value) || 1)}
                            className="mt-1 w-full rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-sm text-zinc-200 outline-none transition focus:border-hos-red"
                          />
                        </label>
                        <label className="text-sm text-zinc-300">
                          Theme Accent Color
                          <div className="flex items-center gap-2 mt-1">
                            <input
                              type="color"
                              value={toolColor}
                              onChange={(e) => setToolColor(e.target.value)}
                              className="h-9 w-12 rounded border border-white/10 bg-transparent animate-none"
                            />
                            <input
                              value={toolColor}
                              onChange={(e) => setToolColor(e.target.value)}
                              className="w-full rounded-lg border border-white/10 bg-black/35 px-2 py-2 text-xs text-zinc-300 outline-none"
                            />
                          </div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/25 p-3 mt-1">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-semibold text-zinc-300">Selected Icon:</span>
                          <div className="grid h-9 w-9 place-items-center rounded bg-black/45" style={{ color: toolColor }}>
                            {(() => {
                              const SelectedIcon = FaIcons[toolIcon as keyof typeof FaIcons] as
                                | React.ComponentType<{ className?: string }>
                                | undefined;
                              return SelectedIcon ? <SelectedIcon className="h-5 w-5" /> : <Wrench className="h-5 w-5" />;
                            })()}
                          </div>
                          <span className="text-xs font-mono text-zinc-200">{toolIcon}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIconPickerTarget({ type: "create" })}
                          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-bold text-zinc-300 transition hover:bg-white/5"
                        >
                          Change Icon
                        </button>
                      </div>
                      <div className="flex items-center gap-2 py-1">
                        <input
                          type="checkbox"
                          id="tool-visible"
                          checked={toolVisible}
                          onChange={(e) => setToolVisible(e.target.checked)}
                          className="h-4 w-4 bg-transparent border-white/10 text-hos-red focus:ring-0 focus:ring-offset-0"
                        />
                        <label htmlFor="tool-visible" className="text-xs font-semibold text-zinc-300 select-none">
                          Show this tool on website homepage
                        </label>
                      </div>
                      <div className="flex items-center justify-end gap-2 border-t border-white/10 pt-4">
                        <button
                          type="button"
                          onClick={() => setShowToolModal(false)}
                          className="rounded-lg border border-white/10 px-4 py-2 text-xs font-bold text-zinc-300 hover:bg-white/5"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          style={{ backgroundColor: draft.primaryColor }}
                          className="rounded-lg px-4 py-2 text-xs font-bold text-white hover:brightness-110"
                        >
                          Create Tool
                        </button>
                      </div>
                    </form>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
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
                primaryColor={draft.primaryColor}
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
                        showConfirm({
                          title: "Discard SVS History Changes",
                          message: "Are you sure you want to discard your unsaved SVS History changes?",
                          confirmLabel: "Discard",
                          isDestructive: true,
                          onConfirm: () => {
                            setDraft((current) => ({
                              ...current,
                              svsHistory: config.svsHistory,
                            }));
                            setSvsEditMode(false);
                          },
                        });
                      } else {
                        setSvsEditMode(false);
                      }
                    } else {
                      setSvsEditMode(true);
                    }
                  }}
                  style={{ borderColor: `${draft.primaryColor}50`, color: draft.primaryColor }}
                  className="rounded-lg border px-3 py-1.5 text-xs font-bold transition hover:bg-white/10"
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
                  style={{ backgroundColor: draft.primaryColor }}
                  className="rounded-lg px-3 py-1.5 text-xs font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
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
                      style={range === key ? { backgroundColor: draft.primaryColor } : undefined}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                        range === key
                          ? "text-white"
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
                  style={{ backgroundColor: draft.primaryColor }}
                  className="rounded-lg px-3 py-2 text-xs font-bold text-white transition hover:brightness-110"
                >
                  Create new event
                </button>
              </div>

              {loadingEvents ? (
                <p className="text-sm text-zinc-400">Loading events...</p>
              ) : (
                <motion.div layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <AnimatePresence mode="popLayout">
                    {events.map((event) => {
                      const eventDateObj = new Date(event.date);
                      return (
                        <motion.div
                          key={event._id}
                          layout
                          initial={{ opacity: 0, scale: 0.9, y: 15 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: -15 }}
                          transition={{ duration: 0.25 }}
                          className="glass-panel flex flex-col justify-between rounded-2xl p-5"
                        >
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
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  {!events.length && (
                    <motion.p layout className="col-span-full py-12 text-center text-sm text-zinc-350">No events scheduled yet.</motion.p>
                  )}
                </motion.div>
              )}

              {/* Modal overlay */}
              <AnimatePresence>
                {showCreateModal && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 15 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 15 }}
                      transition={{ type: "spring", duration: 0.3 }}
                      className="glass-panel w-full max-w-md rounded-2xl p-6 shadow-2xl"
                    >
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

                    <div className="flex border-b border-white/10 mt-3 mb-1">
                      <button
                        type="button"
                        disabled={!!editingEventId}
                        onClick={() => setActiveEventTab("battlefield")}
                        className={`flex-1 pb-2.5 text-center text-sm font-semibold transition-colors duration-200 relative ${
                          activeEventTab === "battlefield" ? "text-white" : "text-zinc-400 hover:text-zinc-200"
                        } ${editingEventId ? "cursor-not-allowed opacity-70" : ""}`}
                      >
                        Battlefield Event
                        {activeEventTab === "battlefield" && (
                          <motion.div
                            layoutId="event-tab-underline"
                            className="absolute bottom-0 left-0 right-0 h-0.5"
                            style={{ backgroundColor: draft.primaryColor }}
                            transition={{ type: "spring", stiffness: 500, damping: 40 }}
                          />
                        )}
                      </button>
                      <button
                        type="button"
                        disabled={!!editingEventId}
                        onClick={() => setActiveEventTab("regular")}
                        className={`flex-1 pb-2.5 text-center text-sm font-semibold transition-colors duration-200 relative ${
                          activeEventTab === "regular" ? "text-white" : "text-zinc-400 hover:text-zinc-200"
                        } ${editingEventId ? "cursor-not-allowed opacity-70" : ""}`}
                      >
                        Regular Event
                        {activeEventTab === "regular" && (
                          <motion.div
                            layoutId="event-tab-underline"
                            className="absolute bottom-0 left-0 right-0 h-0.5"
                            style={{ backgroundColor: draft.primaryColor }}
                            transition={{ type: "spring", stiffness: 500, damping: 40 }}
                          />
                        )}
                      </button>
                    </div>

                    <form id="event-form" onSubmit={handleEventSubmit} className="mt-4 max-h-[65vh] overflow-y-auto pr-1">
                      <AnimatePresence mode="wait" initial={false}>
                        {activeEventTab === "battlefield" ? (
                          <motion.div
                            key="battlefield"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.16, ease: "easeOut" }}
                            className="space-y-4"
                          >
                            <div>
                              <Field label="Event Title" value={eventTitle} onChange={setEventTitle} placeholder="e.g. Battle of Gaugamela" />
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
                            <label className="text-xs text-zinc-300 block mb-1">
                              Base Date (EDT)
                            </label>
                            <input
                              type="date"
                              value={battlefieldBaseDate}
                              onChange={(e) => setBattlefieldBaseDate(e.target.value)}
                              className="w-full rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-xs text-zinc-200 outline-none transition focus:border-hos-red"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs text-zinc-300 block">
                              Select Time Slot (EDT)
                            </label>
                            <div className="grid grid-cols-1 gap-2 max-h-[220px] overflow-y-auto pr-1 border border-white/5 rounded-lg p-2 bg-black/15">
                              {slotsConfig.map((config) => {
                                const times = getSlotTimes(battlefieldBaseDate || getTodayEstString(), config.slot);
                                const isSelected = selectedSlot === config.slot;
                                return (
                                  <button
                                    key={config.slot}
                                    type="button"
                                    onClick={() => setSelectedSlot(config.slot)}
                                    className={`flex items-center gap-3 w-full text-left rounded-lg border px-3 py-2 transition ${
                                      isSelected
                                        ? "border-white bg-white/10"
                                        : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/5"
                                    }`}
                                  >
                                    <div className="relative flex items-center justify-center w-6 h-6 shrink-0">
                                      <div
                                        className={`absolute rotate-45 w-4.5 h-4.5 border transition ${
                                          isSelected ? "border-white bg-white/20" : "border-zinc-500 bg-transparent"
                                        }`}
                                      />
                                      <span className={`z-10 text-[10px] font-bold ${isSelected ? "text-white" : "text-zinc-400"}`}>
                                        {config.slot}
                                      </span>
                                    </div>
                                    
                                    <div className="text-[11px] font-mono tracking-tight text-zinc-300 flex-1">
                                      {times.startText} <span className="text-zinc-500">~</span> {times.endText}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div>
                            <label className="text-xs text-zinc-300 block">Event Theme Color</label>
                            <div className="mt-1 flex items-center gap-2">
                              <input
                                type="color"
                                value={eventColor}
                                onChange={(e) => setEventColor(e.target.value)}
                                className="h-9 w-12 rounded border border-white/10 bg-transparent cursor-pointer"
                              />
                              <input
                                value={eventColor}
                                onChange={(e) => setEventColor(e.target.value)}
                                className="w-full rounded-lg border border-white/10 bg-black/35 px-2 py-2 text-xs text-zinc-300 outline-none"
                              />
                            </div>
                          </div>

                          <div className="border-t border-white/5 pt-3 space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-zinc-300">Repeat event</span>
                              <button
                                type="button"
                                role="switch"
                                aria-checked={bfRepeatEnabled}
                                onClick={() => setBfRepeatEnabled(!bfRepeatEnabled)}
                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                                  bfRepeatEnabled ? 'bg-hos-red' : 'bg-white/15'
                                }`}
                              >
                                <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200 ${
                                  bfRepeatEnabled ? 'translate-x-4' : 'translate-x-0'
                                }`} />
                              </button>
                            </div>

                            {bfRepeatEnabled && (
                              <div className="space-y-3 pl-3 border-l border-white/10 animate-in slide-in-from-top-1 duration-200">
                                <div className="flex items-center gap-3">
                                  <label className="flex items-center gap-1.5 text-xs text-zinc-300 cursor-pointer select-none">
                                    <input
                                      type="radio"
                                      name="bfRepeatType"
                                      checked={bfRepeatOption === "7"}
                                      onChange={() => {
                                        setBfRepeatOption("7");
                                        setBfRepeatDays(7);
                                      }}
                                      className="accent-hos-red"
                                    />
                                    Every 7 days
                                  </label>
                                  <label className="flex items-center gap-1.5 text-xs text-zinc-300 cursor-pointer select-none">
                                    <input
                                      type="radio"
                                      name="bfRepeatType"
                                      checked={bfRepeatOption === "custom"}
                                      onChange={() => setBfRepeatOption("custom")}
                                      className="accent-hos-red"
                                    />
                                    Custom
                                  </label>
                                </div>

                                {bfRepeatOption === "custom" && (
                                  <div className="flex items-center gap-2 animate-in slide-in-from-top-1 duration-200">
                                    <span className="text-xs text-zinc-400">Repeat every</span>
                                    <input
                                      type="number"
                                      min={1}
                                      max={365}
                                      value={bfRepeatDays}
                                      onChange={(e) => setBfRepeatDays(Math.max(1, Math.min(365, Number(e.target.value) || 7)))}
                                      className="w-16 rounded-lg border border-white/10 bg-black/35 px-2 py-1 text-xs text-zinc-200 outline-none focus:border-hos-red"
                                    />
                                    <span className="text-xs text-zinc-400">days</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="glass-panel p-3 rounded-xl border border-white/10 bg-white/5 flex items-start gap-2.5">
                            <Info size={16} className="text-zinc-400 mt-0.5 shrink-0" />
                            <div className="text-[11px] text-zinc-400 leading-normal">
                              <p className="font-semibold text-zinc-300">Participation & Voting Settings:</p>
                              <ul className="list-disc list-inside mt-0.5 space-y-0.5 pl-0.5">
                                <li>Voting starts immediately when event is created.</li>
                                <li>Voting closes at <span className="text-zinc-200 font-semibold">02:00 AM EDT</span>before event starts.</li>
                                <li>Event duration is set to <span className="text-zinc-200 font-semibold">2 hours</span>.</li>
                              </ul>
                            </div>
                          </div>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="regular"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.16, ease: "easeOut" }}
                            className="space-y-4"
                          >
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
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-zinc-300 block">
                                Event Date & Time (EDT)
                                <input
                                  type="datetime-local"
                                  value={eventDate}
                                  max="9999-12-31T23:59"
                                  onChange={(e) => setEventDate(e.target.value)}
                                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/35 px-2 py-1.5 text-xs text-zinc-200 outline-none transition focus:border-hos-red"
                                  required
                                />
                              </label>
                            </div>
                            <div>
                              <label className="text-xs text-zinc-300 block">
                                Show as ongoing for (minutes)
                                <input
                                  type="number"
                                  min={1}
                                  value={eventDurationMinutes}
                                  onChange={(e) => setEventDurationMinutes(e.target.value)}
                                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/35 px-2 py-1.5 text-xs text-zinc-200 outline-none transition focus:border-hos-red"
                                  required
                                />
                              </label>
                            </div>
                          </div>
                          <div className="text-[10px] text-zinc-400 space-y-0.5 leading-tight">
                            <p>* Please schedule using Eastern Time (EST / EDT, GMT-4).</p>
                            <p>* After it starts, this event stays visible until this duration has passed.</p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                            <div>
                              <label className="text-sm text-zinc-300 block">Event Theme Color</label>
                              <div className="mt-1 flex items-center gap-2">
                                <input
                                  type="color"
                                  value={eventColor}
                                  onChange={(e) => setEventColor(e.target.value)}
                                  className="h-9 w-12 rounded border border-white/10 bg-transparent cursor-pointer"
                                />
                                <input
                                  value={eventColor}
                                  onChange={(e) => setEventColor(e.target.value)}
                                  className="w-full rounded-lg border border-white/10 bg-black/35 px-2 py-2 text-xs text-zinc-300 outline-none"
                                />
                              </div>
                            </div>
                            <div className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/35 px-3 py-2 h-[38px]">
                              <label htmlFor="event-hidden" className="text-xs font-semibold text-zinc-300 select-none">
                                Hide this event
                              </label>
                              <button
                                type="button"
                                id="event-hidden"
                                role="switch"
                                aria-checked={eventHidden}
                                onClick={() => setEventHidden(!eventHidden)}
                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                                  eventHidden ? 'bg-hos-red' : 'bg-white/15'
                                }`}
                              >
                                <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200 ${
                                  eventHidden ? 'translate-x-4' : 'translate-x-0'
                                }`} />
                              </button>
                            </div>
                          </div>

                          <div className="border-t border-white/5 pt-3 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-zinc-300">Repeat event</span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  role="switch"
                                  aria-checked={eventRepeatEnabled}
                                  onClick={() => {
                                    if (eventRepeatEnabled) {
                                      setEventRepeatEnabled(false);
                                      setEventRecurrenceDays(null);
                                    } else {
                                      setTempRecurrenceOption("7");
                                      setTempRecurrenceDays(7);
                                      if (eventCreateDelayDays && eventCreateDelayDays > 0) {
                                        setTempCreateDelayOption("custom");
                                        setTempCreateDelayDays(eventCreateDelayDays);
                                      } else {
                                        setTempCreateDelayOption("0");
                                        setTempCreateDelayDays(2);
                                      }
                                      if (eventVotingStartsBeforeDays === -1) {
                                        setTempVotingStartsBeforeOption("always");
                                        setTempVotingStartsBeforeDays(1);
                                      } else {
                                        setTempVotingStartsBeforeOption("custom");
                                        setTempVotingStartsBeforeDays(eventVotingStartsBeforeDays || 1);
                                      }
                                      setShowRepeatConfigModal(true);
                                    }
                                  }}
                                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                                    eventRepeatEnabled ? 'bg-hos-red' : 'bg-white/15'
                                  }`}
                                >
                                  <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200 ${
                                    eventRepeatEnabled ? 'translate-x-4' : 'translate-x-0'
                                  }`} />
                                </button>
                              </div>
                            </div>
                            {eventRepeatEnabled && eventRecurrenceDays !== null && (
                              <div className="space-y-0.5 pl-1 border-l border-white/10 animate-in slide-in-from-top-1 duration-200 text-[10px] text-zinc-400">
                                <p>• Repeats every <span className="text-zinc-200 font-semibold">{eventRecurrenceDays} day{eventRecurrenceDays > 1 ? "s" : ""}</span></p>
                                <p>• Next occurrence: <span className="text-zinc-200 font-semibold">{eventCreateDelayDays === 0 ? "Instantly after old ends" : `${eventCreateDelayDays} day${eventCreateDelayDays > 1 ? "s" : ""} delay`}</span></p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (eventRecurrenceDays !== null) {
                                      const isStandard = ["1", "3", "7", "14", "30"].includes(String(eventRecurrenceDays));
                                      setTempRecurrenceOption(isStandard ? String(eventRecurrenceDays) : "custom");
                                      setTempRecurrenceDays(eventRecurrenceDays);
                                    } else {
                                      setTempRecurrenceOption("7");
                                      setTempRecurrenceDays(7);
                                    }
                                    if (eventCreateDelayDays && eventCreateDelayDays > 0) {
                                      setTempCreateDelayOption("custom");
                                      setTempCreateDelayDays(eventCreateDelayDays);
                                    } else {
                                      setTempCreateDelayOption("0");
                                      setTempCreateDelayDays(2);
                                    }
                                    if (eventVotingStartsBeforeDays === -1) {
                                      setTempVotingStartsBeforeOption("always");
                                      setTempVotingStartsBeforeDays(1);
                                    } else {
                                      setTempVotingStartsBeforeOption("custom");
                                      setTempVotingStartsBeforeDays(eventVotingStartsBeforeDays || 1);
                                    }
                                    if (eventVotingEndsBeforeMinutes === 0) {
                                      setTempVotingEndsBeforeOption("0");
                                      setTempVotingEndsBeforeHours(1);
                                      setTempVotingEndsBeforeMins(0);
                                    } else {
                                      setTempVotingEndsBeforeOption("custom");
                                      setTempVotingEndsBeforeHours(Math.floor(eventVotingEndsBeforeMinutes / 60));
                                      setTempVotingEndsBeforeMins(eventVotingEndsBeforeMinutes % 60);
                                    }
                                    setShowRepeatConfigModal(true);
                                  }}
                                  className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-hos-red hover:underline"
                                >
                                  Edit Repeat Settings
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="border-t border-white/5 my-2 pt-2 space-y-2">
                            <div className="flex flex-col gap-1 py-1">
                              <div className="flex items-center justify-between gap-2">
                                <label htmlFor="event-voting" className="text-xs font-semibold text-zinc-300 select-none">
                                  Enable participation voting
                                </label>
                                <button
                                  type="button"
                                  id="event-voting"
                                  role="switch"
                                  aria-checked={eventVotingEnabled}
                                  onClick={() => {
                                    const enabling = !eventVotingEnabled;
                                    setEventVotingEnabled(enabling);
                                    if (enabling) {
                                      setIsNewVotingConfig(true);
                                      if (eventVotingStartsBeforeDays === -1) {
                                        setTempVotingStartsBeforeOption('always');
                                        setTempVotingStartsBeforeDays(1);
                                      } else {
                                        setTempVotingStartsBeforeOption('custom');
                                        setTempVotingStartsBeforeDays(eventVotingStartsBeforeDays || 1);
                                      }
                                      if (eventVotingEndsBeforeMinutes === 0) {
                                        setTempVotingEndsBeforeOption('0');
                                        setTempVotingEndsBeforeHours(1);
                                        setTempVotingEndsBeforeMins(0);
                                      } else {
                                        setTempVotingEndsBeforeOption('custom');
                                        setTempVotingEndsBeforeHours(Math.floor(eventVotingEndsBeforeMinutes / 60));
                                        setTempVotingEndsBeforeMins(eventVotingEndsBeforeMinutes % 60);
                                      }
                                      setShowVotingConfigModal(true);
                                    }
                                  }}
                                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                                    eventVotingEnabled ? 'bg-hos-red' : 'bg-white/15'
                                  }`}
                                >
                                  <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200 ${
                                    eventVotingEnabled ? 'translate-x-4' : 'translate-x-0'
                                  }`} />
                                </button>
                              </div>
                              <p className="text-[10px] text-zinc-500">
                                Members can join or leave and see the participant list.
                              </p>
                            </div>

                            {eventVotingEnabled && (
                              <div className="pl-6 pt-1 space-y-2 animate-in slide-in-from-top-1 duration-200">
                                <div className="flex items-center justify-between gap-2">
                                  <label htmlFor="event-max-voting" className="text-xs font-semibold text-zinc-300 select-none">
                                    Limit maximum participants
                                  </label>
                                  <button
                                    type="button"
                                    id="event-max-voting"
                                    role="switch"
                                    aria-checked={eventMaxParticipantsEnabled}
                                    onClick={() => setEventMaxParticipantsEnabled(!eventMaxParticipantsEnabled)}
                                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                                      eventMaxParticipantsEnabled ? 'bg-hos-red' : 'bg-white/15'
                                    }`}
                                  >
                                    <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200 ${
                                      eventMaxParticipantsEnabled ? 'translate-x-4' : 'translate-x-0'
                                    }`} />
                                  </button>
                                </div>
                                {eventMaxParticipantsEnabled && (
                                  <div className="animate-in slide-in-from-top-1 duration-200 pl-6">
                                    <label className="text-[11px] text-zinc-400 block mb-1">
                                      Maximum Limit:
                                    </label>
                                    <input
                                      type="number"
                                      min={1}
                                      value={eventMaxParticipantsLimit}
                                      onChange={(e) => setEventMaxParticipantsLimit(Math.max(1, Number(e.target.value) || 20))}
                                      className="w-24 rounded-lg border border-white/10 bg-black/35 px-2 py-1 text-xs text-zinc-200 outline-none focus:border-hos-red"
                                      required
                                    />
                                  </div>
                                )}
                              </div>
                            )}

                            {eventVotingEnabled && (
                              <div className="pl-6 pt-1 flex flex-col gap-0.5 animate-in slide-in-from-top-1 duration-200 text-[10px] text-zinc-400">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span>
                                    • Starts: <span className="text-zinc-200 font-semibold">{eventVotingStartsBeforeDays === -1 ? "Always open" : `${eventVotingStartsBeforeDays} day${eventVotingStartsBeforeDays > 1 ? "s" : ""} before`}</span>
                                  </span>
                                  <span>
                                    • Closes: <span className="text-zinc-200 font-semibold">{eventVotingEndsBeforeMinutes === 0 ? "At event start" : `${Math.floor(eventVotingEndsBeforeMinutes / 60)}h ${eventVotingEndsBeforeMinutes % 60}m before`}</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsNewVotingConfig(false);
                                      if (eventVotingStartsBeforeDays === -1) {
                                        setTempVotingStartsBeforeOption("always");
                                        setTempVotingStartsBeforeDays(1);
                                      } else {
                                        setTempVotingStartsBeforeOption("custom");
                                        setTempVotingStartsBeforeDays(eventVotingStartsBeforeDays || 1);
                                      }
                                      if (eventVotingEndsBeforeMinutes === 0) {
                                        setTempVotingEndsBeforeOption("0");
                                        setTempVotingEndsBeforeHours(1);
                                        setTempVotingEndsBeforeMins(0);
                                      } else {
                                        setTempVotingEndsBeforeOption("custom");
                                        setTempVotingEndsBeforeHours(Math.floor(eventVotingEndsBeforeMinutes / 60));
                                        setTempVotingEndsBeforeMins(eventVotingEndsBeforeMinutes % 60);
                                      }
                                      setShowVotingConfigModal(true);
                                    }}
                                    className="text-[10px] font-bold uppercase tracking-wider text-hos-red hover:underline ml-1"
                                  >
                                    Edit
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                          </motion.div>
                        )}
                      </AnimatePresence>


                    </form>
                    <div className="flex items-center justify-end gap-2 border-t border-white/10 pt-4 mt-2">
                      <button
                        type="button"
                        onClick={() => setShowCreateModal(false)}
                        disabled={savingEvent}
                        className="rounded-lg border border-white/10 px-4 py-2 text-xs font-bold text-zinc-300 hover:bg-white/5 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        form="event-form"
                        disabled={savingEvent}
                        style={{ backgroundColor: draft.primaryColor }}
                        className="flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold text-white hover:brightness-110 disabled:opacity-70 disabled:cursor-not-allowed transition"
                      >
                        {savingEvent && (
                          <svg className="animate-spin h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                        )}
                        {savingEvent
                          ? (editingEventId ? "Saving..." : "Creating...")
                          : (editingEventId ? "Save Changes" : "Create Event")
                        }
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

              <AnimatePresence>
                {showRepeatConfigModal && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 15 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 15 }}
                      transition={{ type: "spring", duration: 0.3 }}
                      className="glass-panel w-full max-w-sm rounded-xl p-5 shadow-2xl border border-zinc-800 space-y-4"
                    >
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                        Configure Repeat Settings
                      </h4>
                      <p className="text-[11px] text-zinc-400 mt-1">
                        Specify details for this repeating event.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {/* Repeat Frequency */}
                      <div className="space-y-1.5">
                        <label className="text-xs text-zinc-300 block font-semibold">Frequency</label>
                        <select
                          value={tempRecurrenceOption}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTempRecurrenceOption(val);
                            if (val !== "custom") {
                              setTempRecurrenceDays(Number(val));
                            }
                          }}
                          className="w-full rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-xs text-zinc-200 outline-none focus:border-hos-red"
                        >
                          <option value="1">Daily (Every 1 day)</option>
                          <option value="3">Every 3 days</option>
                          <option value="7">Weekly (Every 7 days)</option>
                          <option value="14">Fortnightly (Every 14 days)</option>
                          <option value="30">Monthly (Every 30 days)</option>
                          <option value="custom">Custom Days...</option>
                        </select>

                        {tempRecurrenceOption === "custom" && (
                          <div className="animate-in slide-in-from-top-1 duration-200 mt-2">
                            <label className="text-[10px] text-zinc-400 block mb-1">Repeat Every (Days)</label>
                            <input
                              type="number"
                              min={1}
                              max={365}
                              value={tempRecurrenceDays}
                              onChange={(e) => setTempRecurrenceDays(Math.max(1, Number(e.target.value) || 2))}
                              className="w-full rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-xs text-zinc-200 outline-none focus:border-hos-red"
                              required
                            />
                          </div>
                        )}
                      </div>

                      {/* Display Delay (Next occurrence creation delay) */}
                      <div className="space-y-1.5 border-t border-white/5 pt-3">
                        <label className="text-xs text-zinc-300 block font-semibold">
                          Display next occurrence
                        </label>
                        <select
                          value={tempCreateDelayOption}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTempCreateDelayOption(val);
                            if (val === "0") {
                              setTempCreateDelayDays(0);
                            }
                          }}
                          className="w-full rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-xs text-zinc-200 outline-none focus:border-hos-red"
                        >
                          <option value="0">Instantly after the old event ends</option>
                          <option value="custom">Custom delay after old event ends...</option>
                        </select>

                        {tempCreateDelayOption === "custom" && (
                          <div className="animate-in slide-in-from-top-1 duration-200 mt-2">
                            <label className="text-[10px] text-zinc-400 block mb-1">Delay in days:</label>
                            <input
                              type="number"
                              min={1}
                              max={tempRecurrenceDays}
                              value={tempCreateDelayDays || 2}
                              onChange={(e) => setTempCreateDelayDays(Math.max(1, Math.min(tempRecurrenceDays, Number(e.target.value) || 2)))}
                              className="w-full rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-xs text-zinc-200 outline-none focus:border-hos-red"
                              required
                            />
                            <p className="text-[9px] text-zinc-500 mt-0.5">
                              Max: {tempRecurrenceDays} days (cannot exceed repeat frequency)
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 flex justify-end gap-2 border-t border-white/5 pt-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowRepeatConfigModal(false);
                          if (eventRecurrenceDays === null) {
                            setEventRepeatEnabled(false);
                          }
                        }}
                        className="rounded-lg px-3 py-1.5 text-xs text-zinc-400 hover:bg-white/5 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEventRecurrenceDays(tempRecurrenceDays);
                          setEventCreateDelayDays(tempCreateDelayOption === "0" ? 0 : tempCreateDelayDays);
                          setEventVotingStartsBeforeDays(tempVotingStartsBeforeOption === "always" ? -1 : tempVotingStartsBeforeDays);
                          setEventVotingEndsBeforeMinutes(tempVotingEndsBeforeOption === "0" ? 0 : tempVotingEndsBeforeHours * 60 + tempVotingEndsBeforeMins);
                          setEventRepeatEnabled(true);
                          setShowRepeatConfigModal(false);
                        }}
                        className="rounded-lg bg-hos-red px-3 py-1.5 text-xs font-bold text-white transition hover:brightness-110"
                      >
                        Apply Settings
                      </button>
                    </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {showVotingConfigModal && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-sm"
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 15 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 15 }}
                      transition={{ type: "spring", duration: 0.3 }}
                      className="glass-panel w-full max-w-sm rounded-2xl p-5"
                    >
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-white/10 pb-2">
                      Voting Window Configuration
                    </h3>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs text-zinc-300 block font-semibold">
                          When should voting open?
                        </label>
                        <select
                          value={tempVotingStartsBeforeOption}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTempVotingStartsBeforeOption(val);
                            if (val === "always") {
                              setTempVotingStartsBeforeDays(1);
                            }
                          }}
                          className="w-full rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-xs text-zinc-200 outline-none focus:border-hos-red"
                        >
                          <option value="always">Always open (from creation)</option>
                          <option value="custom">Custom days before event starts...</option>
                        </select>

                        {tempVotingStartsBeforeOption === "custom" && (
                          <div className="animate-in slide-in-from-top-1 duration-200 mt-2">
                            <label className="text-[10px] text-zinc-400 block mb-1">Days before event:</label>
                            <input
                              type="number"
                              min={1}
                              max={eventRecurrenceDays || 365}
                              value={tempVotingStartsBeforeDays}
                              onChange={(e) => setTempVotingStartsBeforeDays(Math.max(1, Math.min(eventRecurrenceDays || 365, Number(e.target.value) || 1)))}
                              className="w-full rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-xs text-zinc-200 outline-none focus:border-hos-red"
                              required
                            />
                            {eventRecurrenceDays !== null && (
                              <p className="text-[9px] text-zinc-500 mt-0.5">
                                Max: {eventRecurrenceDays} days (cannot exceed repeat frequency)
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5 border-t border-white/5 pt-3">
                        <label className="text-xs text-zinc-300 block font-semibold">
                          When should voting close?
                        </label>
                        <select
                          value={tempVotingEndsBeforeOption}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTempVotingEndsBeforeOption(val);
                            if (val === "0") {
                              setTempVotingEndsBeforeHours(1);
                              setTempVotingEndsBeforeMins(0);
                            }
                          }}
                          className="w-full rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-xs text-zinc-200 outline-none focus:border-hos-red"
                        >
                          <option value="0">At event start</option>
                          <option value="custom">Custom time before event starts...</option>
                        </select>

                        {tempVotingEndsBeforeOption === "custom" && (
                          <div className="animate-in slide-in-from-top-1 duration-200 mt-2 grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-zinc-400 block mb-1">Hours before:</label>
                              <input
                                type="number"
                                min={0}
                                max={8760}
                                value={tempVotingEndsBeforeHours}
                                onChange={(e) => setTempVotingEndsBeforeHours(Math.max(0, Math.min(8760, Number(e.target.value) || 0)))}
                                className="w-full rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-xs text-zinc-200 outline-none focus:border-hos-red"
                                required
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-zinc-400 block mb-1">Minutes before:</label>
                              <input
                                type="number"
                                min={0}
                                max={59}
                                value={tempVotingEndsBeforeMins}
                                onChange={(e) => setTempVotingEndsBeforeMins(Math.max(0, Math.min(59, Number(e.target.value) || 0)))}
                                className="w-full rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-xs text-zinc-200 outline-none focus:border-hos-red"
                                required
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 flex justify-end gap-2 border-t border-white/5 pt-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowVotingConfigModal(false);
                          if (isNewVotingConfig) {
                            setEventVotingEnabled(false);
                          }
                        }}
                        className="rounded-lg px-3 py-1.5 text-xs text-zinc-400 hover:bg-white/5 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEventVotingStartsBeforeDays(tempVotingStartsBeforeOption === "always" ? -1 : tempVotingStartsBeforeDays);
                          setEventVotingEndsBeforeMinutes(tempVotingEndsBeforeOption === "0" ? 0 : tempVotingEndsBeforeHours * 60 + tempVotingEndsBeforeMins);
                          setShowVotingConfigModal(false);
                        }}
                        className="rounded-lg bg-hos-red px-3 py-1.5 text-xs font-bold text-white transition hover:brightness-110"
                      >
                        Apply Settings
                      </button>
                    </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {["Navigation", "Applications"].includes(active) && (
            <div className="glass-panel rounded-2xl p-5">
              <h2 className="font-bold text-white">{active}</h2>
              <p className="mt-2 text-sm text-zinc-400">This module is not yet configured with persistent fields.</p>
            </div>
          )}
          <AnimatePresence>
            {confirmState.isOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
                  className="absolute inset-0 bg-black/75 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="glass-panel relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/90 p-5 shadow-2xl"
                >
                  <div
                    className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${
                      confirmState.isDestructive
                        ? "from-neon-red to-neon-purple"
                        : "from-neon-blue to-neon-purple"
                    }`}
                  />
                  <div className="flex gap-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                        confirmState.isDestructive
                          ? "bg-neon-red/10 text-neon-red"
                          : "bg-neon-blue/10 text-neon-blue"
                      }`}
                    >
                      {confirmState.isDestructive ? <AlertTriangle size={18} /> : <Info size={18} />}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-white tracking-wide">
                        {confirmState.title}
                      </h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
                        {confirmState.message}
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 flex justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
                      className="rounded-lg border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-bold text-zinc-300 transition hover:bg-white/10 hover:text-white"
                    >
                      {confirmState.cancelLabel}
                    </button>
                    <button
                      type="button"
                      onClick={confirmState.onConfirm}
                      className={`rounded-lg px-3.5 py-1.5 text-xs font-bold text-white transition ${
                        confirmState.isDestructive
                          ? "bg-neon-red/20 text-neon-red border border-neon-red/40 hover:bg-neon-red hover:text-black"
                          : "bg-neon-blue/20 text-neon-blue border border-neon-blue/40 hover:bg-neon-blue hover:text-black"
                      }`}
                    >
                      {confirmState.confirmLabel}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {successAnimation && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] grid place-items-center bg-black/40 backdrop-blur-[2px]"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: "spring", damping: 20, stiffness: 300 }}
                  className="flex flex-col items-center justify-center rounded-2xl bg-zinc-900/90 border border-white/10 px-8 py-6 shadow-2xl backdrop-blur-md"
                >
                  {successAnimation.type === "create" || successAnimation.type === "update" ? (
                    <div className={`relative flex h-16 w-16 items-center justify-center rounded-full border bg-opacity-20 ${
                      successAnimation.type === "create"
                        ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                        : "bg-cyan-500/20 border-cyan-500/30 text-cyan-400"
                    }`}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={3}
                        stroke="currentColor"
                        className="h-8 w-8"
                      >
                        <motion.path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
                        />
                      </svg>
                    </div>
                  ) : (
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={3}
                        stroke="currentColor"
                        className="h-8 w-8"
                      >
                        <motion.path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
                        />
                      </svg>
                    </div>
                  )}
                  <motion.span
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-4 text-sm font-bold text-white uppercase tracking-wider"
                  >
                    {successAnimation.title}
                  </motion.span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {iconPickerTarget && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  transition={{ type: "spring", duration: 0.3 }}
                  className="glass-panel w-full max-w-sm rounded-2xl p-6 shadow-2xl flex flex-col max-h-[70vh] border border-white/10"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Select Icon / Logo</h3>
                    <button
                      onClick={() => setIconPickerTarget(null)}
                      className="rounded-lg border border-white/15 p-1 text-zinc-400 hover:text-white"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-5 gap-2.5 overflow-y-auto pr-1.5 flex-1 scrollbar-thin scrollbar-thumb-white/10">
                    {toolIconOptions.map((name) => {
                      const Picker = FaIcons[name as keyof typeof FaIcons] as
                        | React.ComponentType<{ className?: string }>
                        | undefined;
                      
                      const isSelected = iconPickerTarget.type === "create"
                        ? toolIcon === name
                        : draft.tools.find(t => t.id === iconPickerTarget.id)?.icon === name;

                      const activeColor = iconPickerTarget.type === "create"
                        ? toolColor
                        : draft.tools.find(t => t.id === iconPickerTarget.id)?.color || draft.primaryColor;

                      return (
                        <button
                          key={name}
                          type="button"
                          onClick={() => {
                            if (iconPickerTarget.type === "create") {
                              setToolIcon(name);
                            } else if (iconPickerTarget.id) {
                              alterTool(iconPickerTarget.id, { icon: name });
                            }
                            setIconPickerTarget(null);
                          }}
                          title={name}
                          className={`grid h-12 w-12 place-items-center rounded-xl border text-lg transition ${
                            isSelected
                              ? "border-white text-white bg-white/10 shadow-lg"
                              : "border-white/10 bg-black/20 text-zinc-400 hover:border-white/20 hover:text-white hover:bg-white/5"
                          }`}
                          style={isSelected ? { color: activeColor, borderColor: `${activeColor}60` } : undefined}
                        >
                          {Picker ? <Picker className="h-5 w-5" /> : <Wrench className="h-5 w-5" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4 border-t border-white/10 pt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setIconPickerTarget(null)}
                      className="rounded-lg border border-white/10 px-4 py-2 text-xs font-bold text-zinc-300 hover:bg-white/5"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
