"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { socketService } from "@/services/socket/socket-client"; // Import Service
import { useChatStore } from "@/lib/stores/chat/use-chat-store";
import { useAuthStore } from "@/lib/stores/auth/use-auth-store";
import { SocketNamespaceEnum } from "@/common/enum";
import { SOCKET_EVENTS } from "@/constant/socket-events";
import type {
  IMessage,
  ITypingPayload,
  ISocketErrorPayload,
  IUserStatusPayload,
} from "@/types/chat";

export const useChatSocket = () => {
  const { receiveMessage, setTypingUser, setUserStatus } = useChatStore();
  const currentUser = useAuthStore((s) => s.currentAccount);
  const isAuthenticated = !!currentUser?.accessToken;

  useEffect(() => {
    if (!isAuthenticated) return;
    const cleanNewMessage = socketService.on<IMessage>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.CHAT.NEW_MESSAGE,
      (data) => {
        receiveMessage(data);
      },
    );

    const cleanTyping = socketService.on<
      ITypingPayload & { isTyping: boolean }
    >(SocketNamespaceEnum.CHAT, SOCKET_EVENTS.CHAT.TYPING, (payload) => {
      if (payload.userId !== currentUser?.user.id) {
        setTypingUser(payload);
      }
    });

    const cleanException = socketService.on<ISocketErrorPayload>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.SYSTEM.EXCEPTION,
      (error) => {
        console.error("🔥 [Chat Socket] Exception:", error);
        const message = error?.message || "Lỗi kết nối Socket";
        toast.error(Array.isArray(message) ? message[0] : message);
      },
    );

    const cleanUserStatus = socketService.on<IUserStatusPayload>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.CHAT.USER_STATUS,
      (payload) => {
        console.log("payload", payload);
        setUserStatus(payload);
      },
    );

    return () => {
      cleanNewMessage();
      cleanTyping();
      cleanException();
      cleanUserStatus();
    };
  }, [
    isAuthenticated,
    receiveMessage,
    setTypingUser,
    setUserStatus,
    currentUser?.user.id,
  ]);
};
