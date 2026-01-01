import { useState, useEffect, useCallback } from "react";

interface UsePersistentCountdownReturn {
  seconds: number;
  isFinished: boolean;
  start: (duration?: number) => void;
  formatTime: () => string;
}

export function usePersistentCountdown(
  key: string,
  defaultDuration: number = 60,
): UsePersistentCountdownReturn {
  const [seconds, setSeconds] = useState(0);
  const [isFinished, setIsFinished] = useState(true);

  const getRemainingSeconds = useCallback(() => {
    if (typeof window === "undefined") return 0;

    const savedEndTime = localStorage.getItem(key);
    if (!savedEndTime) return 0;

    const endTime = parseInt(savedEndTime, 10);
    const now = Date.now();
    const diff = Math.ceil((endTime - now) / 1000);

    return diff > 0 ? diff : 0;
  }, [key]);

  useEffect(() => {
    const remaining = getRemainingSeconds();
    if (remaining > 0) {
      setSeconds(remaining);
      setIsFinished(false);
    } else {
      setSeconds(0);
      setIsFinished(true);
    }
  }, [getRemainingSeconds]);

  useEffect(() => {
    if (isFinished) return;

    const interval = setInterval(() => {
      const remaining = getRemainingSeconds();

      if (remaining <= 0) {
        setSeconds(0);
        setIsFinished(true);
        localStorage.removeItem(key);
        clearInterval(interval);
      } else {
        setSeconds(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isFinished, key, getRemainingSeconds]);

  const start = useCallback(
    (duration: number = defaultDuration) => {
      const endTime = Date.now() + duration * 1000;
      localStorage.setItem(key, endTime.toString());

      setSeconds(duration);
      setIsFinished(false);
    },
    [key, defaultDuration],
  );

  const formatTime = () => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return { seconds, isFinished, start, formatTime };
}
