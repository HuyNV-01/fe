"use client";

import { useEffect } from "react";
import { socketService } from "@/services/socket/socket-client";
import { useContactStore } from "@/lib/stores/contact/use-contact-store";
import { useAuthStore } from "@/lib/stores/auth/use-auth-store";
import { SocketNamespaceEnum, ContactStatusEnum } from "@/common/enum";
import { SOCKET_EVENTS } from "@/constant/socket-events";
import type { IContactSocketPayload } from "@/types/socket";
import { showInfoToast } from "@/utils/toast";

export const useContactSocket = () => {
  const { handleSocketUpdate } = useContactStore();
  const currentUser = useAuthStore((s) => s.currentAccount);
  const isAuthenticated = !!currentUser?.accessToken;

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

        showInfoToast("Bạn nhận được một lời mời kết bạn mới!");
      },
    );

    const cleanRequestAccepted = socketService.on<IContactSocketPayload>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.CONTACT.REQUEST_ACCEPTED,
      (payload) => {
        if (!payload.accepterId) return;

        handleSocketUpdate(payload.accepterId, ContactStatusEnum.FRIEND);

        showInfoToast("Lời mời kết bạn đã được chấp nhận!");
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

    return () => {
      cleanRequestReceived();
      cleanRequestAccepted();
      cleanFriendRemoved();
    };
  }, [isAuthenticated, handleSocketUpdate]);
};
