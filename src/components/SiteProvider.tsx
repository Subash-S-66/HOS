"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { defaultSiteConfig, type SiteConfig } from "@/lib/site-config";
import { api } from "@/lib/api";

type ToolResponse = {
  toolId: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  displayOrder: number;
  link: string;
  enabled: boolean;
};

type HistoryResponse = {
  position: number;
  week: string;
  date?: string;
  url: string;
};

type SettingsResponse = {
  websiteTitle?: string;
  banner?: string;
  youtubeLink?: string;
  discordLink?: string;
  footer?: string;
  primaryColor?: string;
  galleryUploadsPer10Min?: number;
  recruitmentEmailSenderName?: string;
  recruitmentEmailReceiver?: string;
  recruitmentEmailLimitPer30Min?: number;
  chatMessagesLimitPerMin?: number;
};

const SiteContext = createContext<{
  config: SiteConfig;
  updateConfig: (config: SiteConfig) => void;
  refreshConfig: () => Promise<void>;
}>({
  config: defaultSiteConfig,
  updateConfig: () => {},
  refreshConfig: async () => {},
});

const hexToRgb = (hex: string) => {
  const value = hex.replace("#", "").trim();
  const full = value.length === 3 ? value.split("").map((c) => c + c).join("") : value;
  const valid = /^[0-9a-fA-F]{6}$/.test(full) ? full : "00f3ff";
  const r = Number.parseInt(valid.slice(0, 2), 16);
  const g = Number.parseInt(valid.slice(2, 4), 16);
  const b = Number.parseInt(valid.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
};

export function SiteProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState(defaultSiteConfig);

  const refreshConfig = useCallback(async () => {
    try {
      const [tools, history, settings] = await Promise.all([
        api<Array<ToolResponse>>("/tools"),
        api<Array<HistoryResponse>>("/svs-history"),
        api<SettingsResponse>("/settings"),
      ]);

      setConfig((current) => ({
        ...current,
        title: settings.websiteTitle ?? current.title,
        banner: settings.banner ?? current.banner,
        youtubeUrl: settings.youtubeLink ?? current.youtubeUrl,
        discordUrl: settings.discordLink ?? current.discordUrl,
        footer: settings.footer ?? current.footer,
        primaryColor: settings.primaryColor ?? current.primaryColor,
        galleryUploadsPer10Min: Number(settings.galleryUploadsPer10Min ?? current.galleryUploadsPer10Min ?? 2),
        recruitmentEmailSenderName: settings.recruitmentEmailSenderName ?? current.recruitmentEmailSenderName,
        recruitmentEmailReceiver: settings.recruitmentEmailReceiver ?? current.recruitmentEmailReceiver,
        recruitmentEmailLimitPer30Min: Number(settings.recruitmentEmailLimitPer30Min ?? current.recruitmentEmailLimitPer30Min ?? 2),
        chatMessagesLimitPerMin: Number(settings.chatMessagesLimitPerMin ?? current.chatMessagesLimitPerMin ?? 30),
        tools: tools.map((tool) => ({
          id: tool.toolId,
          title: tool.title,
          description: tool.description,
          icon: tool.icon,
          color: tool.color,
          category: tool.category,
          order: tool.displayOrder,
          link: tool.link,
          enabled: tool.enabled,
          visible: true,
        })),
        svsHistory: history.map((entry) => ({
          label:
            entry.position === 1
              ? "Latest SVS"
              : entry.position === 2
                ? "Previous SVS"
                : `SVS Archive ${entry.position}`,
          date: entry.date || current.svsHistory[entry.position - 1]?.date || "",
          url: entry.url,
        })),
      }));
    } catch {
      // Keep defaults if backend is unavailable.
    }
  }, []);

  useEffect(() => {
    void refreshConfig();
  }, [refreshConfig]);

  useEffect(() => {
    const root = document.documentElement;
    const rgb = hexToRgb(config.primaryColor);
    root.style.setProperty("--color-hos-red", config.primaryColor);
    root.style.setProperty("--color-panel-border", `${config.primaryColor}55`);
    root.style.setProperty("--color-neon-blue", config.primaryColor);
    root.style.setProperty("--theme-rgb", rgb);
    root.style.setProperty("--theme-primary", config.primaryColor);
  }, [config.primaryColor]);

  const updateConfig = (next: SiteConfig) => {
    setConfig(next);
  };

  return <SiteContext.Provider value={{ config, updateConfig, refreshConfig }}>{children}</SiteContext.Provider>;
}

export const useSiteConfig = () => useContext(SiteContext);
