"use client";

import { useEffect } from "react";
import { socketService } from "@/services/socket/socket-client";
import { useNotificationStore } from "@/lib/stores/notification/use-notification-store";
import { useChatStore } from "@/lib/stores/chat/use-chat-store";
import { useAuthStore } from "@/lib/stores/auth/use-auth-store";
import { SocketNamespaceEnum } from "@/common/enum";
import { SOCKET_EVENTS } from "@/constant/socket-events";
import {
  type INotificationReadSocketPayload,
  type INotificationSocketPayload,
  NotificationTypeEnum,
} from "@/types/notification";
import { showInfoToast } from "@/utils/toast";

export const useNotificationSocket = () => {
  const {
    fetchNotifications,
    handleSocketNewNotification,
    handleSocketUpdatedNotification,
    handleSocketMarkRead,
    handleSocketReadAll,
    handleSocketRemoved,
    markConversationNotificationsRead,
  } = useNotificationStore();

  const currentUser = useAuthStore((s) => s.currentAccount);
  const isAuthenticated = !!currentUser?.accessToken;

  useEffect(() => {
    if (!isAuthenticated || !currentUser?.user?.id) return;

    fetchNotifications({ page: 1, limit: 15 });

    const handleIncoming = (
      payload: INotificationSocketPayload,
      isUpdate = false,
    ) => {
      if (!payload?.notification) return;
      const { notification } = payload;
      const activeConvId = useChatStore.getState().activeConversationId;
      const notifConvId =
        notification.metadata?.conversationId || notification.resourceId;

      // Nếu người dùng đang mở trực tiếp hội thoại này thì tự động đánh dấu đã đọc ngay
      if (
        activeConvId &&
        notifConvId === activeConvId &&
        (notification.type === NotificationTypeEnum.NEW_MESSAGE ||
          notification.type === NotificationTypeEnum.MESSAGE_REPLY)
      ) {
        markConversationNotificationsRead(activeConvId);
        return;
      }

      if (isUpdate) {
        handleSocketUpdatedNotification(payload);
      } else {
        handleSocketNewNotification(payload);
      }

      // Tránh bắn trùng toast với useContactSocket cho lời mời kết bạn
      if (
        notification.type !== NotificationTypeEnum.FRIEND_REQUEST &&
        notification.type !== NotificationTypeEnum.FRIEND_ACCEPTED
      ) {
        showInfoToast(`${notification.title}: ${notification.content}`);
      }
    };

    const cleanNew = socketService.on<INotificationSocketPayload>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.NOTIFICATION.NEW,
      (payload) => handleIncoming(payload, false),
    );

    const cleanUpdated = socketService.on<INotificationSocketPayload>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.NOTIFICATION.UPDATED,
      (payload) => handleIncoming(payload, true),
    );

    const cleanMarkRead = socketService.on<INotificationReadSocketPayload>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.NOTIFICATION.MARK_READ,
      (payload) => {
        handleSocketMarkRead(payload);
      },
    );

    const cleanReadAll = socketService.on(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.NOTIFICATION.READ_ALL,
      () => {
        handleSocketReadAll();
      },
    );

    const cleanRemoved = socketService.on<{
      notificationId: string;
      unreadCount: number;
    }>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.NOTIFICATION.REMOVED,
      (payload) => {
        handleSocketRemoved(payload);
      },
    );

    return () => {
      cleanNew();
      cleanUpdated();
      cleanMarkRead();
      cleanReadAll();
      cleanRemoved();
    };
  }, [
    isAuthenticated,
    currentUser?.user?.id,
    fetchNotifications,
    handleSocketNewNotification,
    handleSocketUpdatedNotification,
    handleSocketMarkRead,
    handleSocketReadAll,
    handleSocketRemoved,
    markConversationNotificationsRead,
  ]);
};
