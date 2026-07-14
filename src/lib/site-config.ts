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

const svs = Array.from({ length: 10 }, (_, index) => {
  const date = new Date(Date.UTC(2026, 6, 20));
  date.setUTCDate(date.getUTCDate() - index * 14);
  return {
    label: index === 0 ? "Latest SVS" : index === 1 ? "Previous SVS" : `SVS Archive ${index + 1}`,
    date: date.toISOString(),
    url: `https://svs.info/server/1895/svs/2026-W${String(30 - index * 2).padStart(2, "0")}`,
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
