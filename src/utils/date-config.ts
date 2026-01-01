import { vi, enUS } from "date-fns/locale";
import type { Locale } from "date-fns";

export type SupportedLocale = "vi" | "en";

export const DATE_FNS_LOCALES: Record<SupportedLocale, Locale> = {
  vi: vi,
  en: enUS,
};

export const RELATIVE_TIME_LABELS: Record<
  SupportedLocale,
  { today: string; yesterday: string }
> = {
  vi: { today: "Hôm nay", yesterday: "Hôm qua" },
  en: { today: "Today", yesterday: "Yesterday" },
};

export const getDateLocale = (lang: string): Locale => {
  return DATE_FNS_LOCALES[lang as SupportedLocale] || enUS;
};

export const getRelativeLabel = (lang: string, key: "today" | "yesterday") => {
  const labels =
    RELATIVE_TIME_LABELS[lang as SupportedLocale] || RELATIVE_TIME_LABELS["en"];
  return labels[key];
};

export const JUST_NOW_LABELS: Record<SupportedLocale, string> = {
  vi: "Vừa xong",
  en: "Just now",
};

export const getJustNowLabel = (lang: string) => {
  return JUST_NOW_LABELS[lang as SupportedLocale] || JUST_NOW_LABELS["en"];
};
