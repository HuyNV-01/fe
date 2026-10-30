"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { socketService } from "@/services/socket/socket-client";
import { useChatStore } from "@/lib/stores/chat/use-chat-store";
import { useAuthStore } from "@/lib/stores/auth/use-auth-store";
import { CallStatusEnum, SocketNamespaceEnum } from "@/common/enum";
import { SOCKET_EVENTS } from "@/constant/socket-events";
import type {
  IGroupUpdatedPayload,
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
import { useTranslations } from "next-intl";

export const useChatSocket = () => {
  const tSocket = useTranslations("Chat.Detail.socketToast");
  const {
    handleIncomingMessage,
    handleMessageEdited,
    handleMessageRecalled,
    handleMessageReaction,
    handleMessagePinned,
    handleGroupUpdated,
    handleNicknameUpdated,
    handleConversationSettingsUpdated,
    setTypingUser,
    setUserStatus,
    updateMessageStatus,
    handleReadMessage,
    setActiveCall,
    updateActiveCall,
    handlePollUpdated,
    handleLinkPreviewReady,
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

    const cleanGroupUpdated = socketService.on<IGroupUpdatedPayload>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.CHAT.GROUP_UPDATED,
      (payload) => {
        handleGroupUpdated(payload);
      },
    );

    const cleanNicknameUpdated = socketService.on<{
      conversationId: string;
      targetUserId: string;
      nickname: string | null;
    }>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.CHAT.NICKNAME_UPDATED,
      (payload) => {
        handleNicknameUpdated(payload);
      },
    );

    const cleanSettingsUpdated = socketService.on<{
      conversationId: string;
      disappearingTtl?: number | null;
    }>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.CHAT.CONVERSATION_SETTINGS_UPDATED,
      (payload) => {
        handleConversationSettingsUpdated(payload);
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
        const currentActive = useChatStore.getState().activeCall;
        if (currentActive && currentActive.callId !== payload.callId) {
          socketService.send(
            SocketNamespaceEnum.CHAT,
            SOCKET_EVENTS.CALL.REJECT,
            { callId: payload.callId, reason: "busy" },
          );
          return;
        }

        setActiveCall({
          callId: payload.callId,
          conversationId: payload.conversationId,
          callType: payload.callType,
          isGroupCall: payload.isGroupCall,
          initiatorId: payload.callerId,
          callerName: payload.callerName,
          callerAvatar: payload.callerAvatar,
          status: CallStatusEnum.RINGING,
          isIncoming: true,
          sdpOffer: payload.sdpOffer,
          startedAt: payload.createdAt,
          participants: payload.participants || {},
          membersInfo: payload.membersInfo || [],
          isMinimized: false,
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
          membersInfo: payload.membersInfo,
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
              ? tSocket("recipientBusy")
              : tSocket("callRejected"),
          );
          setActiveCall(null);
        }
      },
    );

    const cleanCallEnded = socketService.on<any>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.CALL.ENDED,
      (payload) => {
        if (payload?.reason === "timeout") {
          toast.info(tSocket("callNoAnswer"));
        }
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
          ...(payload.callType ? { callType: payload.callType } : {}),
          participants: {
            ...active.participants,
            [payload.userId]: payload.participantState,
          },
        });
      },
    );

    const cleanPollUpdated = socketService.on(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.CHAT.POLL_UPDATED,
      (payload: any) => {
        handlePollUpdated(payload);
      },
    );

    const cleanLinkPreview = socketService.on(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.CHAT.LINK_PREVIEW_READY,
      (payload: any) => {
        handleLinkPreviewReady(payload);
      },
    );

    const cleanCallHandledElsewhere = socketService.on<{
      callId: string;
      action: "accepted" | "rejected";
    }>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.CALL.HANDLED_ELSEWHERE,
      (payload) => {
        const current = useChatStore.getState().activeCall;
        if (
          current &&
          current.callId === payload.callId &&
          current.status === CallStatusEnum.RINGING
        ) {
          setActiveCall(null);
        }
      },
    );

    

    const cleanHostMuted = socketService.on<{
      callId: string;
      mutedBy: string;
    }>(SocketNamespaceEnum.CHAT, SOCKET_EVENTS.CALL.HOST_MUTED, () => {
      toast.info(tSocket("hostMutedYourMic"));
    });

    const cleanException = socketService.on<ISocketErrorPayload>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.SYSTEM.EXCEPTION,
      (error) => {
        const message = error?.message || tSocket("connectionError");
        toast.error(Array.isArray(message) ? message[0] : message);
      },
    );

    return () => {
      cleanNewMessage();
      cleanEdited();
      cleanRecalled();
      cleanReaction();
      cleanPinned();
      cleanGroupUpdated();
      cleanNicknameUpdated();
      cleanSettingsUpdated();
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
      cleanPollUpdated();
      cleanLinkPreview();
      cleanCallHandledElsewhere();
      cleanHostMuted();
    };
  }, [
    isAuthenticated,
    currentUser?.user?.id,
    tSocket,
    handleIncomingMessage,
    handleMessageEdited,
    handleMessageRecalled,
    handleMessageReaction,
    handleMessagePinned,
    handleGroupUpdated,
    updateMessageStatus,
    handleReadMessage,
    setTypingUser,
    setUserStatus,
    setActiveCall,
    updateActiveCall,
  ]);
};
