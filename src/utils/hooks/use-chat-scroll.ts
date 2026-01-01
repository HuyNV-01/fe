/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
import { useLayoutEffect, useRef, useState } from "react";

export const useChatScroll = <T>(dep: T) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const previousScrollHeight = useRef<number>(0);
  const [isLoadingOld, setIsLoadingOld] = useState(false);

  useLayoutEffect(() => {
    const node = scrollRef.current;
    if (node && isLoadingOld) {
      const newScrollHeight = node.scrollHeight;
      const heightDiff = newScrollHeight - previousScrollHeight.current;

      node.scrollTop = heightDiff;

      setIsLoadingOld(false);
    }
  }, [dep, isLoadingOld]);

  useLayoutEffect(() => {
    const node = scrollRef.current;
    if (node && shouldAutoScroll && !isLoadingOld) {
      node.scrollTop = node.scrollHeight;
    }
  }, [dep, shouldAutoScroll, isLoadingOld]);

  const saveScrollPosition = () => {
    if (scrollRef.current) {
      previousScrollHeight.current = scrollRef.current.scrollHeight;
      setIsLoadingOld(true);
      setShouldAutoScroll(false);
    }
  };

  const scrollToBottom = () => {
    setShouldAutoScroll(true);
  };

  return {
    scrollRef,
    saveScrollPosition,
    scrollToBottom,
    isAutoScrolling: shouldAutoScroll,
  };
};
