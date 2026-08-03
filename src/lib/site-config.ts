export type Tool = { id: string; title: string; description: string; icon: string; color: string; category: string; order: number; link: string; enabled: boolean; visible: boolean };
export type SiteConfig = {
  title: string; banner: string; youtubeUrl: string; discordUrl: string;
  primaryColor: string; footer: string; galleryUploadsPer10Min: number;
  tools: Tool[]; svsHistory: { label: string; url: string; date: string }[];
  recruitmentEmailSenderName: string;
  recruitmentEmailReceiver: string;
  recruitmentEmailLimitPer30Min: number;
  chatMessagesLimitPerMin: number;
};

const SVS_CADENCE_ORIGIN = Date.UTC(2026, 7, 3);
const DAY = 24 * 60 * 60 * 1000;

const isoWeek = (date: Date) => {
  const value = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  value.setUTCDate(value.getUTCDate() + 4 - (value.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(value.getUTCFullYear(), 0, 1));
  return `${value.getUTCFullYear()}-W${String(Math.ceil((((value.getTime() - yearStart.getTime()) / DAY) + 1) / 7)).padStart(2, "0")}`;
};

const latestSvsDate = () => {
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return new Date(SVS_CADENCE_ORIGIN + Math.floor((today - SVS_CADENCE_ORIGIN) / (14 * DAY)) * 14 * DAY);
};

const svs = Array.from({ length: 10 }, (_, index) => {
  const date = latestSvsDate();
  date.setUTCDate(date.getUTCDate() - index * 14);
  const svsWeekend = new Date(date);
  svsWeekend.setUTCDate(svsWeekend.getUTCDate() - 2);
  const week = isoWeek(svsWeekend);
  return {
    label: index === 0 ? "Latest SVS" : index === 1 ? "Previous SVS" : `SVS Archive ${index + 1}`,
    date: date.toISOString(),
    url: `https://svs.info/server/1895/svs/${week}`,
  };
});

export const defaultSiteConfig: SiteConfig = {
  title: "House Of Spanking", banner: "Power through unity · Server 1895",
  youtubeUrl: "", discordUrl: "", primaryColor: "#00f3ff",
  footer: "House Of Spanking · Server 1895", galleryUploadsPer10Min: 2, svsHistory: svs,
  recruitmentEmailSenderName: "HOS Recruitment",
  recruitmentEmailReceiver: "",
  recruitmentEmailLimitPer30Min: 2,
  chatMessagesLimitPerMin: 30,
  tools: [
    { id: "svs", title: "SVS Intelligence", description: "Track Server vs Server performance and reports.", icon: "FaShieldHalved", color: "#00f3ff", category: "War", order: 1, link: "/svs-history", enabled: true, visible: true },
    { id: "members", title: "Alliance Roster", description: "Open the official HOS member directory.", icon: "FaUsers", color: "#39ff14", category: "Alliance", order: 2, link: "https://svs.info/server/1895/alliance/hos", enabled: true, visible: true },
    { id: "events", title: "Event Planner", description: "Never miss a coordinated alliance event.", icon: "FaCalendarDays", color: "#bc13fe", category: "Planning", order: 3, link: "/events", enabled: true, visible: true },
  ],
};
