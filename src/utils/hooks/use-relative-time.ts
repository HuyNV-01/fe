"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { calculateRelativeTime } from "../date-helper";

export const useRelativeTime = (
  dateInput?: Date | string | number,
  propLocale?: string,
) => {
  const systemLocale = useLocale();
  const currentLocale = propLocale || systemLocale;

  const [timeDisplay, setTimeDisplay] = useState<string>("");

  useEffect(() => {
    if (!dateInput) return;

    const updateTime = () => {
      const result = calculateRelativeTime(dateInput, currentLocale);
      setTimeDisplay(result);
    };

    updateTime();

    const interval = setInterval(updateTime, 60000);

    return () => clearInterval(interval);
  }, [dateInput, currentLocale]);

  return timeDisplay;
};
