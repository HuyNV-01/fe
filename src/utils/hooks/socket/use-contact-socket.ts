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
import { useUserStore } from "@/lib/stores/user/use-user-store";

export const useContactSocket = () => {
  const { handleSocketUpdate, fetchBlockedUsers } = useContactStore();
  const {
    activeConversationId,
    fetchConversationDetails,
    syncBlockStateForUser,
  } = useChatStore();
  const { syncProfileBlockState } = useUserStore();
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
          syncBlockStateForUser(payload.targetId, { blockedByMe: true });
          syncProfileBlockState(payload.targetId, {
            isBlocked: true,
            blockedByMe: true,
          });
          fetchBlockedUsers();
        } else if (payload.targetId === myId) {
          handleSocketUpdate(payload.blockerId, null);
          syncBlockStateForUser(payload.blockerId, { blockedByPartner: true });
          syncProfileBlockState(payload.blockerId, {
            isBlocked: true,
            blockedByTarget: true,
          });
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
          syncBlockStateForUser(payload.targetId, { blockedByMe: false });
          syncProfileBlockState(payload.targetId, {
            isBlocked: false,
            blockedByMe: false,
          });
          fetchBlockedUsers();
        } else if (payload.targetId === myId) {
          syncBlockStateForUser(payload.unblockerId, {
            blockedByPartner: false,
          });
          syncProfileBlockState(payload.unblockerId, {
            isBlocked: false,
            blockedByTarget: false,
          });
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
    fetchBlockedUsers,
    fetchConversationDetails,
    syncBlockStateForUser,
    syncProfileBlockState,
    t,
  ]);
};
