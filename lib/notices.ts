import { getCopy, type SiteLanguage } from "@/lib/i18n";

export type SeasonalNotice = {
  activeFrom?: string;
  activeUntil: string;
  body: string;
  dismissStorageKey: string;
  eyebrow: string;
  id: string;
  primaryActionLabel: string;
  secondaryActionLabel: string;
  title: string;
};

type SeasonalNoticeConfig = {
  activeFrom?: string;
  activeUntil: string;
  dismissStorageKey: string;
  enabled: boolean;
  id: "easter-apology";
};

const seasonalNoticeConfigs: SeasonalNoticeConfig[] = [
  {
    id: "easter-apology",
    enabled: process.env.NEXT_PUBLIC_SHOW_EASTER_NOTICE !== "false",
    activeFrom: "2026-04-01",
    activeUntil: "2026-04-10",
    dismissStorageKey: "bokavader:easter-apology-dismissed",
  },
];

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isSeasonalNoticeActive(config: SeasonalNoticeConfig, dateKey: string) {
  if (!config.enabled) {
    return false;
  }

  if (config.activeFrom && dateKey < config.activeFrom) {
    return false;
  }

  return dateKey <= config.activeUntil;
}

export function getActiveSeasonalNotice(language: SiteLanguage, date = new Date()): SeasonalNotice | null {
  const dateKey = getLocalDateKey(date);
  const activeConfig = seasonalNoticeConfigs.find((config) => isSeasonalNoticeActive(config, dateKey));

  if (!activeConfig) {
    return null;
  }

  const strings = getCopy(language);

  switch (activeConfig.id) {
    case "easter-apology":
      return {
        ...activeConfig,
        body: strings.apologyMessage,
        eyebrow: strings.apologyEyebrow,
        primaryActionLabel: strings.apologyAccepted,
        secondaryActionLabel: strings.apologyThanks,
        title: strings.apologyTitle,
      };
  }
}
