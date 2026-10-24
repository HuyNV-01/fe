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
  IMessageStatusUpdatePayload,
  IMessageReadPayload,
} from "@/types/chat";

export const useChatSocket = () => {
  const {
    handleIncomingMessage,
    setTypingUser,
    setUserStatus,
    updateMessageStatus,
    handleReadMessage,
  } = useChatStore();
  const currentUser = useAuthStore((s) => s.currentAccount);
  const isAuthenticated = !!currentUser?.accessToken;

  useEffect(() => {
    if (!isAuthenticated) return;
    const cleanNewMessage = socketService.on<IMessage>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.CHAT.NEW_MESSAGE,
      (message) => {
        handleIncomingMessage(message);

        if (message.senderId !== currentUser.user.id) {
          socketService.send(
            SocketNamespaceEnum.CHAT,
            SOCKET_EVENTS.CHAT.MESSAGE_RECEIVED,
            {
              conversationId: message.conversationId,
              messageId: message.id,
            },
          );
        }
      },
    );

    const cleanStatusUpdate = socketService.on<IMessageStatusUpdatePayload>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.CHAT.MESSAGE_STATUS_UPDATE,
      (payload) => {
        updateMessageStatus(payload);
      },
    );

    const cleanRead = socketService.on<IMessageReadPayload>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.CHAT.MESSAGE_READ,
      (payload) => {
        handleReadMessage(payload);
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
        setUserStatus(payload);
      },
    );

    const cleanBatchStatus = socketService.on(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.CHAT.MESSAGE_STATUS_UPDATE_BATCH,
      (payload: any) => {
        useChatStore.getState().updateMessageStatusBatch(payload);
      },
    );

    return () => {
      cleanNewMessage();
      cleanStatusUpdate();
      cleanRead();
      cleanTyping();
      cleanException();
      cleanUserStatus();
      cleanBatchStatus();
    };
  }, [
    isAuthenticated,
    handleIncomingMessage,
    updateMessageStatus,
    handleReadMessage,
    setTypingUser,
    setUserStatus,
    currentUser?.user.id,
  ]);
};
