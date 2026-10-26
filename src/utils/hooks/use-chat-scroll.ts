/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
import {
  useRef,
  useCallback,
  useState,
  useLayoutEffect,
  useEffect,
} from "react";

interface IBaseMessage {
  id: string;
  senderId: string;
}

export const useChatScroll = <T extends IBaseMessage>(
  messages: T[],
  conversationId: string,
  currentUserId: string,
  isLoadingMessages = false,
) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [showScrollButton, setShowScrollButton] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const prevScrollHeight = useRef<number>(0);
  const prevFirstMsgId = useRef<string | null>(null);
  const prevLastMsgId = useRef<string | null>(null);

  const activeConversationIdRef = useRef<string>("");
  const initialScrolledConvRef = useRef<string | null>(null);
  const isPinnedToBottom = useRef<boolean>(true);
  const isProgrammaticScrollRef = useRef<boolean>(false);

  useLayoutEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
  }, []);

  const performScrollToBottom = useCallback(
    (behavior: ScrollBehavior = "auto") => {
      const node = scrollRef.current;
      if (!node) return;

      isPinnedToBottom.current = true;
      isProgrammaticScrollRef.current = true;
      setShowScrollButton(false);
      setUnreadCount(0);

      if (behavior === "auto" || behavior === "instant") {
        node.scrollTop = node.scrollHeight;
        bottomRef.current?.scrollIntoView({
          behavior: "instant" as ScrollBehavior,
          block: "end",
        });
      } else {
        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      }

      setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 150);
    },
    [],
  );

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      performScrollToBottom(behavior);
    },
    [performScrollToBottom],
  );

  const handleScroll = useCallback(() => {
    if (isProgrammaticScrollRef.current) return;
    const node = scrollRef.current;
    if (!node) return;

    const { scrollTop, scrollHeight, clientHeight } = node;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const isAtBottom = distanceFromBottom <= 80;

    isPinnedToBottom.current = isAtBottom;
    setShowScrollButton(!isAtBottom);

    if (isAtBottom) {
      setUnreadCount(0);
    }
  }, []);

  const saveScrollSnapshot = useCallback(() => {
    const node = scrollRef.current;
    if (node) {
      prevScrollHeight.current = node.scrollHeight;
    }
  }, []);

  useLayoutEffect(() => {
    if (conversationId !== activeConversationIdRef.current) {
      activeConversationIdRef.current = conversationId;
      initialScrolledConvRef.current = null;
      isPinnedToBottom.current = true;
      prevScrollHeight.current = 0;
      prevFirstMsgId.current = null;
      prevLastMsgId.current = null;
      setUnreadCount(0);
      setShowScrollButton(false);
    }
  }, [conversationId]);

  useLayoutEffect(() => {
    const node = scrollRef.current;
    if (!node || !conversationId) return;

    if (messages.length === 0) {
      prevScrollHeight.current = node.scrollHeight;
      prevFirstMsgId.current = null;
      prevLastMsgId.current = null;
      return;
    }

    const currentScrollHeight = node.scrollHeight;
    const currentFirstMsgId = messages[0].id;
    const currentLastMsgId = messages[messages.length - 1].id;

    if (initialScrolledConvRef.current !== conversationId) {
      initialScrolledConvRef.current = conversationId;
      isPinnedToBottom.current = true;

      performScrollToBottom("instant" as ScrollBehavior);

      const raf1 = requestAnimationFrame(() => {
        performScrollToBottom("instant" as ScrollBehavior);
      });
      const timer1 = setTimeout(() => {
        if (isPinnedToBottom.current) {
          performScrollToBottom("instant" as ScrollBehavior);
        }
      }, 80);

      prevScrollHeight.current = node.scrollHeight;
      prevFirstMsgId.current = currentFirstMsgId;
      prevLastMsgId.current = currentLastMsgId;

      return () => {
        cancelAnimationFrame(raf1);
        clearTimeout(timer1);
      };
    }

    if (
      prevFirstMsgId.current &&
      currentFirstMsgId !== prevFirstMsgId.current &&
      currentLastMsgId === prevLastMsgId.current &&
      currentScrollHeight > prevScrollHeight.current
    ) {
      const heightDiff = currentScrollHeight - prevScrollHeight.current;
      isProgrammaticScrollRef.current = true;
      node.scrollTop = node.scrollTop + heightDiff;
      setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 100);
    } else if (currentLastMsgId !== prevLastMsgId.current) {
      const lastMsg = messages[messages.length - 1];
      const isMyMessage = Boolean(
        currentUserId && lastMsg?.senderId === currentUserId,
      );

      if (isMyMessage || isPinnedToBottom.current) {
        performScrollToBottom("smooth");
      } else {
        setUnreadCount((prev) => prev + 1);
      }
    } else if (
      isPinnedToBottom.current &&
      currentScrollHeight !== prevScrollHeight.current
    ) {
      performScrollToBottom("instant" as ScrollBehavior);
    }

    prevScrollHeight.current = node.scrollHeight;
    prevFirstMsgId.current = currentFirstMsgId;
    prevLastMsgId.current = currentLastMsgId;
  }, [
    messages,
    conversationId,
    currentUserId,
    isLoadingMessages,
    performScrollToBottom,
  ]);

  useEffect(() => {
    const contentNode = contentRef.current;
    const scrollNode = scrollRef.current;
    if (!contentNode || !scrollNode) return;

    const observer = new ResizeObserver(() => {
      if (isPinnedToBottom.current) {
        scrollNode.scrollTop = scrollNode.scrollHeight;
      }
    });

    observer.observe(contentNode);
    return () => observer.disconnect();
  }, [conversationId]);

  return {
    scrollRef,
    contentRef,
    bottomRef,
    scrollToBottom,
    handleScroll,
    showScrollButton,
    unreadCount,
    saveScrollSnapshot,
  };
};
