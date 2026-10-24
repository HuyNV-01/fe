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
) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [showScrollButton, setShowScrollButton] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // --- INTERNAL STATE (REFS) ---
  // Dùng refs để lưu trữ trạng thái mà không gây re-render
  const prevScrollHeight = useRef<number>(0);
  const prevFirstMsgId = useRef<string | null>(null);
  const prevLastMsgId = useRef<string | null>(null);

  // Ref lưu ID hội thoại hiện tại để so sánh sự thay đổi
  const activeConversationIdRef = useRef<string>(conversationId);

  // Trạng thái ghim đáy
  const isPinnedToBottom = useRef<boolean>(true);

  // 1. TẮT TÍNH NĂNG NHỚ VỊ TRÍ CỦA TRÌNH DUYỆT
  useLayoutEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
  }, []);

  // 2. HELPER: CUỘN ĐÁY CHỦ ĐỘNG
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    isPinnedToBottom.current = true;
    setShowScrollButton(false);
    setUnreadCount(0);

    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior, block: "end" });
    } else if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  // 3. HANDLER: NGƯỜI DÙNG CUỘN
  const handleScroll = useCallback(() => {
    const node = scrollRef.current;
    if (!node) return;

    const { scrollTop, scrollHeight, clientHeight } = node;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const isAtBottom = distanceFromBottom < 50;

    isPinnedToBottom.current = isAtBottom;
    setShowScrollButton(!isAtBottom);

    if (isAtBottom) setUnreadCount(0);
  }, []);

  // 4. SNAPSHOT TRƯỚC KHI FETCH
  const saveScrollSnapshot = useCallback(() => {
    const node = scrollRef.current;
    if (node) {
      prevScrollHeight.current = node.scrollHeight;
    }
  }, []);

  // 5. CORE LOGIC: QUẢN LÝ CUỘN TẬP TRUNG
  // ✅ Đã thêm đầy đủ dependencies theo yêu cầu ESLint
  useLayoutEffect(() => {
    const node = scrollRef.current;
    if (!node) return;

    // Lấy thông tin hiện tại
    const currentScrollHeight = node.scrollHeight;
    const currentFirstMsgId = messages.length > 0 ? messages[0].id : null;
    const currentLastMsgId =
      messages.length > 0 ? messages[messages.length - 1].id : null;

    // --- LOGIC 1: PHÁT HIỆN ĐỔI PHÒNG (RESET) ---
    // So sánh conversationId props với ref đã lưu
    if (conversationId !== activeConversationIdRef.current) {
      // Cập nhật lại ref
      activeConversationIdRef.current = conversationId;

      // Reset trạng thái
      isPinnedToBottom.current = true;
      prevScrollHeight.current = 0;
      prevFirstMsgId.current = null;
      prevLastMsgId.current = null;
      setUnreadCount(0);
      setShowScrollButton(false);

      // Cưỡng chế cuộn đáy (Aggressive Scroll)
      // Sử dụng requestAnimationFrame để đảm bảo chạy sau khi trình duyệt paint
      if (messages.length > 0) {
        const forceScroll = () => {
          if (bottomRef.current)
            bottomRef.current.scrollIntoView({
              behavior: "auto",
              block: "end",
            });
        };
        forceScroll();
        requestAnimationFrame(() => {
          forceScroll();
          setTimeout(forceScroll, 50);
        });
      }
      return; // Dừng logic tại đây cho lần render này
    }

    if (messages.length === 0) return;

    // --- LOGIC 2: XỬ LÝ KHI DỮ LIỆU THAY ĐỔI ---

    // CASE: LOAD HISTORY (PREPEND)
    // ID đầu thay đổi và chiều cao tăng
    if (
      prevFirstMsgId.current &&
      currentFirstMsgId !== prevFirstMsgId.current &&
      currentScrollHeight > prevScrollHeight.current
    ) {
      const heightDiff = currentScrollHeight - prevScrollHeight.current;
      // Bù đắp vị trí cuộn (Scroll Compensation)
      node.scrollTop = node.scrollTop + heightDiff;
    }

    // CASE: TIN MỚI (APPEND)
    // ID cuối thay đổi (so với lần render trước)
    else if (currentLastMsgId !== prevLastMsgId.current) {
      const lastMsg = messages[messages.length - 1];
      const isMyMessage = lastMsg?.senderId === currentUserId;

      // Nếu là tin của tôi HOẶC đang dính đáy -> Cuộn
      if (isMyMessage || isPinnedToBottom.current) {
        scrollToBottom("smooth");
      } else {
        // Nếu không -> Báo tin mới
        setUnreadCount((prev) => prev + 1);
      }
    }

    // CASE: HÌNH ẢNH LOAD CHẬM (RESIZE)
    // Nếu ID không đổi nhưng chiều cao thay đổi và đang dính đáy -> Cuộn tiếp
    else if (
      isPinnedToBottom.current &&
      currentScrollHeight !== prevScrollHeight.current
    ) {
      if (bottomRef.current)
        bottomRef.current.scrollIntoView({ behavior: "auto", block: "end" });
    }

    // --- CẬP NHẬT REF CHO LẦN SAU ---
    prevScrollHeight.current = currentScrollHeight;
    prevFirstMsgId.current = currentFirstMsgId;
    prevLastMsgId.current = currentLastMsgId;
  }, [messages, conversationId, currentUserId, scrollToBottom]);
  // ^ Dependency đầy đủ: messages, conversationId, currentUserId, scrollToBottom

  // 6. OBSERVER
  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;

    const observer = new ResizeObserver(() => {
      if (isPinnedToBottom.current) {
        if (bottomRef.current)
          bottomRef.current.scrollIntoView({ behavior: "auto", block: "end" });
      }
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return {
    scrollRef,
    bottomRef,
    scrollToBottom,
    handleScroll,
    showScrollButton,
    unreadCount,
    saveScrollSnapshot,
  };
};
