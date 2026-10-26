import type { IMessage } from "@/types/chat";
import {
  format,
  formatDistanceToNow,
  isSameYear,
  isToday,
  isYesterday,
} from "date-fns";
import {
  getDateLocale,
  getJustNowLabel,
  getRelativeLabel,
} from "./date-config";

export const parseSafeDate = (
  dateInput?: Date | string | number | null,
): Date | null => {
  if (!dateInput) return null;
  if (dateInput instanceof Date) {
    return Number.isNaN(dateInput.getTime()) ? null : dateInput;
  }
  if (typeof dateInput === "number") {
    const d = new Date(dateInput);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const raw = String(dateInput).trim();
  if (!raw) return null;

  const hasTimezone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(raw);
  const normalized = hasTimezone
    ? raw
    : /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(raw)
      ? `${raw.replace(" ", "T")}Z`
      : raw;

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const formatDate = (
  dateString: string | Date,
  currentLocale: string,
  dateFormat = "dd/MM/yyyy",
) => {
  const date = parseSafeDate(dateString);
  if (!date) return "";
  const locale = getDateLocale(currentLocale);

  return format(date, dateFormat, { locale });
};

export const formatChatTime = (
  dateString: string | Date,
  currentLocale: string,
) => {
  const date = parseSafeDate(dateString);
  if (!date) return "";
  const locale = getDateLocale(currentLocale);

  if (isToday(date)) {
    return format(date, "HH:mm", { locale });
  }

  if (isYesterday(date)) {
    return getRelativeLabel(currentLocale, "yesterday");
  }

  if (isSameYear(date, new Date())) {
    return format(date, "dd/MM", { locale });
  }

  return format(date, "dd/MM/yyyy", { locale });
};

export const formatMessageTime = (
  dateString: string | Date,
  currentLocale = "vi",
) => {
  const date = parseSafeDate(dateString);
  if (!date) return "";
  const locale = getDateLocale(currentLocale);

  if (isToday(date)) {
    return format(date, "HH:mm", { locale });
  }

  if (isYesterday(date)) {
    return `${format(date, "HH:mm", { locale })} • ${getRelativeLabel(currentLocale, "yesterday")}`;
  }

  if (isSameYear(date, new Date())) {
    return format(date, "HH:mm • dd/MM", { locale });
  }

  return format(date, "HH:mm • dd/MM/yyyy", { locale });
};

export const formatFullDateTime = (
  dateString: string | Date,
  currentLocale = "vi",
) => {
  const date = parseSafeDate(dateString);
  if (!date) return "";
  const locale = getDateLocale(currentLocale);
  return format(date, "HH:mm:ss - dd/MM/yyyy", { locale });
};

export const formatRelativeTime = (
  dateString: string | Date,
  currentLocale: string,
) => {
  const date = parseSafeDate(dateString);
  if (!date) return "";
  const locale = getDateLocale(currentLocale);

  return formatDistanceToNow(date, {
    addSuffix: true,
    locale,
  });
};

export const getGroupLabel = (dateString: string, currentLocale: string) => {
  const date = parseSafeDate(dateString);
  if (!date) return "";
  const locale = getDateLocale(currentLocale);

  if (isToday(date)) return getRelativeLabel(currentLocale, "today");
  if (isYesterday(date)) return getRelativeLabel(currentLocale, "yesterday");

  return format(date, "dd/MM/yyyy", { locale });
};

export const groupMessagesByDate = (
  messages: IMessage[],
  currentLocale: string,
) => {
  const groups: { label: string; messages: IMessage[] }[] = [];

  messages.forEach((msg) => {
    const dateLabel = getGroupLabel(msg.createdAt, currentLocale);
    const lastGroup = groups[groups.length - 1];

    if (lastGroup && lastGroup.label === dateLabel) {
      lastGroup.messages.push(msg);
    } else {
      groups.push({ label: dateLabel, messages: [msg] });
    }
  });

  return groups;
};

export const calculateRelativeTime = (
  dateInput: Date | string | number,
  locale: string,
): string => {
  const date = parseSafeDate(dateInput);
  if (!date) return "";

  const now = new Date();
  const rawDiffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  const diffInSeconds = Math.max(0, rawDiffSeconds);

  if (diffInSeconds < 60) {
    const langCode = locale.split("-")[0];
    return getJustNowLabel(langCode);
  }

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (diffInSeconds < 3600) {
    return rtf.format(-Math.floor(diffInSeconds / 60), "minute");
  }

  if (diffInSeconds < 86400) {
    return rtf.format(-Math.floor(diffInSeconds / 3600), "hour");
  }

  if (diffInSeconds < 604800) {
    return rtf.format(-Math.floor(diffInSeconds / 86400), "day");
  }

  return date.toLocaleDateString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};
