import type { IMessage } from "@/types/chat";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import {
  getDateLocale,
  getJustNowLabel,
  getRelativeLabel,
} from "./date-config";

export const formatDate = (
  dateString: string | Date,
  currentLocale: string,
  dateFormat = "dd/MM/yyyy",
) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const locale = getDateLocale(currentLocale);

  return format(date, dateFormat, { locale });
};

export const formatChatTime = (
  dateString: string | Date,
  currentLocale: string,
) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const locale = getDateLocale(currentLocale);

  if (isToday(date)) {
    return format(date, "HH:mm", { locale });
  }

  if (isYesterday(date)) {
    return getRelativeLabel(currentLocale, "yesterday");
  }

  const currentYear = new Date().getFullYear();
  if (date.getFullYear() === currentYear) {
    return format(date, "dd/MM", { locale });
  }

  return format(date, "dd/MM/yyyy", { locale });
};

export const formatRelativeTime = (
  dateString: string | Date,
  currentLocale: string,
) => {
  if (!dateString) return "";
  const locale = getDateLocale(currentLocale);

  return formatDistanceToNow(new Date(dateString), {
    addSuffix: true,
    locale,
  });
};

export const formatMessageTime = (dateString: string) => {
  return format(new Date(dateString), "HH:mm");
};

export const getGroupLabel = (dateString: string, currentLocale: string) => {
  const date = new Date(dateString);
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
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

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
