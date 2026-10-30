"use client";

import { useEffect } from "react";
import { socketService } from "@/services/socket/socket-client";
import { useContactStore } from "@/lib/stores/contact/use-contact-store";
import { useAuthStore } from "@/lib/stores/auth/use-auth-store";
import { SocketNamespaceEnum, ContactStatusEnum } from "@/common/enum";
import { SOCKET_EVENTS } from "@/constant/socket-events";
import type { IContactSocketPayload } from "@/types/socket";
import { showInfoToast } from "@/utils/toast";
import { useTranslations } from "next-intl";
import { useChatStore } from "@/lib/stores/chat/use-chat-store";

export const useContactSocket = () => {
  const { handleSocketUpdate } = useContactStore();
  const { activeConversationId, fetchConversationDetails } = useChatStore();
  const currentUser = useAuthStore((s) => s.currentAccount);
  const isAuthenticated = !!currentUser?.accessToken;
  const t = useTranslations("Chat.Detail.contact.item.toast");

  useEffect(() => {
    if (!isAuthenticated) return;
    const cleanRequestReceived = socketService.on<IContactSocketPayload>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.CONTACT.REQUEST_RECEIVED,
      (payload) => {
        if (!payload.senderId) return;

        handleSocketUpdate(
          payload.senderId,
          ContactStatusEnum.PENDING_RECEIVED,
        );

        showInfoToast(t("newRequestReceived"));
      },
    );

    const cleanRequestAccepted = socketService.on<IContactSocketPayload>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.CONTACT.REQUEST_ACCEPTED,
      (payload) => {
        if (!payload.accepterId) return;

        handleSocketUpdate(payload.accepterId, ContactStatusEnum.FRIEND);

        showInfoToast(t("requestAccepted"));
      },
    );

    const cleanFriendRemoved = socketService.on<IContactSocketPayload>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.CONTACT.FRIEND_REMOVED,
      (payload) => {
        if (!payload.removerId) return;

        handleSocketUpdate(payload.removerId, null);
      },
    );

    const cleanUserBlocked = socketService.on<{
      blockerId: string;
      targetId: string;
    }>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.CONTACT.USER_BLOCKED,
      (payload) => {
        const myId = currentUser?.user?.id;
        if (payload.blockerId === myId) {
          handleSocketUpdate(payload.targetId, ContactStatusEnum.BLOCKED);
        } else if (payload.targetId === myId) {
          handleSocketUpdate(payload.blockerId, null);
        }
        if (activeConversationId) {
          fetchConversationDetails(activeConversationId);
        }
      },
    );

    const cleanUserUnblocked = socketService.on<{
      unblockerId: string;
      targetId: string;
    }>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.CONTACT.USER_UNBLOCKED,
      (payload) => {
        const myId = currentUser?.user?.id;
        if (payload.unblockerId === myId) {
          handleSocketUpdate(payload.targetId, null);
        }
        if (activeConversationId) {
          fetchConversationDetails(activeConversationId);
        }
      },
    );

    return () => {
      cleanRequestReceived();
      cleanRequestAccepted();
      cleanFriendRemoved();
      cleanUserBlocked();
      cleanUserUnblocked();
    };
  }, [
    isAuthenticated,
    currentUser?.user?.id,
    activeConversationId,
    handleSocketUpdate,
    fetchConversationDetails,
    t,
  ]);
};
