"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { socketService } from "@/services/socket/socket-client";
import { useChatStore } from "@/lib/stores/chat/use-chat-store";
import { useAuthStore } from "@/lib/stores/auth/use-auth-store";
import { CallStatusEnum, SocketNamespaceEnum } from "@/common/enum";
import { SOCKET_EVENTS } from "@/constant/socket-events";
import type {
  IMessage,
  ITypingPayload,
  ISocketErrorPayload,
  IUserStatusPayload,
  IMessageStatusUpdatePayload,
  IMessageReadPayload,
  IMessageRecalledPayload,
  IMessageReactionPayload,
  IMessagePinnedPayload,
} from "@/types/chat";

export const useChatSocket = () => {
  const {
    handleIncomingMessage,
    handleMessageEdited,
    handleMessageRecalled,
    handleMessageReaction,
    handleMessagePinned,
    setTypingUser,
    setUserStatus,
    updateMessageStatus,
    handleReadMessage,
    setActiveCall,
    updateActiveCall,
  } = useChatStore();
  const currentUser = useAuthStore((s) => s.currentAccount);
  const isAuthenticated = !!currentUser?.accessToken;

  useEffect(() => {
    if (!isAuthenticated || !currentUser?.user?.id) return;

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

    const cleanEdited = socketService.on<IMessage>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.CHAT.MESSAGE_EDITED,
      (message) => {
        handleMessageEdited(message);
      },
    );

    const cleanRecalled = socketService.on<IMessageRecalledPayload>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.CHAT.MESSAGE_RECALLED,
      (payload) => {
        handleMessageRecalled(payload);
      },
    );

    const cleanReaction = socketService.on<IMessageReactionPayload>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.CHAT.MESSAGE_REACTION,
      (payload) => {
        handleMessageReaction(payload);
      },
    );

    const cleanPinned = socketService.on<IMessagePinnedPayload>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.CHAT.MESSAGE_PINNED,
      (payload) => {
        handleMessagePinned(payload);
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

    const cleanIncomingCall = socketService.on<any>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.CALL.INCOMING,
      (payload) => {
        setActiveCall({
          callId: payload.callId,
          conversationId: payload.conversationId,
          callType: payload.callType,
          initiatorId: payload.callerId,
          status: CallStatusEnum.RINGING,
          isIncoming: true,
          sdpOffer: payload.sdpOffer,
          startedAt: payload.createdAt,
          participants: {},
        });
      },
    );

    const cleanCallAccepted = socketService.on<any>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.CALL.ACCEPTED,
      (payload) => {
        updateActiveCall({
          status: CallStatusEnum.ONGOING,
          answeredAt: payload.answeredAt,
          participants: payload.participants || {},
        });
      },
    );

    const cleanCallRejected = socketService.on<any>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.CALL.REJECTED,
      (payload) => {
        if (payload.isCallTerminated) {
          toast.info(
            payload.reason === "busy"
              ? "Người nhận đang bận ở cuộc gọi khác"
              : "Cuộc gọi đã bị từ chối",
          );
          setActiveCall(null);
        }
      },
    );

    const cleanCallEnded = socketService.on<any>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.CALL.ENDED,
      () => {
        setActiveCall(null);
      },
    );

    const cleanCallMediaState = socketService.on<any>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.CALL.MEDIA_STATE,
      (payload) => {
        const active = useChatStore.getState().activeCall;
        if (!active || active.callId !== payload.callId) return;
        updateActiveCall({
          participants: {
            ...active.participants,
            [payload.userId]: payload.participantState,
          },
        });
      },
    );

    return () => {
      cleanNewMessage();
      cleanEdited();
      cleanRecalled();
      cleanReaction();
      cleanPinned();
      cleanStatusUpdate();
      cleanRead();
      cleanTyping();
      cleanException();
      cleanUserStatus();
      cleanBatchStatus();
      cleanIncomingCall();
      cleanCallAccepted();
      cleanCallRejected();
      cleanCallEnded();
      cleanCallMediaState();
    };
  }, [
    isAuthenticated,
    currentUser?.user?.id,
    handleIncomingMessage,
    handleMessageEdited,
    handleMessageRecalled,
    handleMessageReaction,
    handleMessagePinned,
    updateMessageStatus,
    handleReadMessage,
    setTypingUser,
    setUserStatus,
    setActiveCall,
    updateActiveCall,
  ]);
};
