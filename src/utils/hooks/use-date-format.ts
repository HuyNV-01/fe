"use client";

import { useCallback } from "react";
import * as DateUtils from "@/utils/date-helper";
import type { IMessage } from "@/types/chat";
import { useLocale } from "next-intl";

export const useDateFormat = () => {
  const locale = useLocale();

  const toChatTime = useCallback(
    (date: string | Date) => DateUtils.formatChatTime(date, locale),
    [locale],
  );

  const toRelativeTime = useCallback(
    (date: string | Date) => DateUtils.formatRelativeTime(date, locale),
    [locale],
  );

  const groupMessagesTime = useCallback(
    (messages: IMessage[]) => DateUtils.groupMessagesByDate(messages, locale),
    [locale],
  );

  return {
    locale,
    toChatTime,
    toRelativeTime,
    groupMessagesTime,
    utils: DateUtils,
  };
};
