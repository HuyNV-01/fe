import { createPersistedStore } from "../create-persisted-store";
import {
  deleteNotificationApi,
  getNotificationsApi,
  getUnreadNotificationCountApi,
  markAllNotificationsReadApi,
  markConversationNotificationsReadApi,
  markNotificationReadApi,
} from "./api";
import type { IPaginationMeta } from "@/types/common";
import type {
  INotification,
  INotificationReadSocketPayload,
  INotificationSocketPayload,
  NotificationTypeEnum,
} from "@/types/notification";

interface NotificationState {
  notifications: INotification[];
  meta: IPaginationMeta | null;
  unreadCount: number;
  isLoading: boolean;
  filterMode: "ALL" | "UNREAD";

  setFilterMode: (mode: "ALL" | "UNREAD") => void;
  fetchNotifications: (params?: {
    page?: number;
    limit?: number;
    isRead?: boolean;
    type?: NotificationTypeEnum;
  }) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  markConversationNotificationsRead: (conversationId: string) => Promise<void>;
  removeNotification: (notificationId: string) => Promise<void>;

  handleSocketNewNotification: (payload: INotificationSocketPayload) => void;
  handleSocketUpdatedNotification: (
    payload: INotificationSocketPayload,
  ) => void;
  handleSocketMarkRead: (payload: INotificationReadSocketPayload) => void;
  handleSocketReadAll: () => void;
  handleSocketRemoved: (payload: {
    notificationId: string;
    unreadCount: number;
  }) => void;
}

export const useNotificationStore = createPersistedStore<NotificationState>(
  (set, get) => ({
    notifications: [],
    meta: null,
    unreadCount: 0,
    isLoading: false,
    filterMode: "ALL",

    setFilterMode: (mode) => {
      set({ filterMode: mode });
      get().fetchNotifications({
        page: 1,
        isRead: mode === "UNREAD" ? false : undefined,
      });
    },

    fetchNotifications: async (params = {}) => {
      const { page = 1, limit = 15, isRead, type } = params;
      set({ isLoading: true });
      try {
        const res = await getNotificationsApi({ page, limit, isRead, type });
        const payload = res?.data;
        if (!payload) return;

        set((state) => {
          if (page === 1) {
            state.notifications = payload.data || [];
          } else {
            const existingIds = new Set(state.notifications.map((n) => n.id));
            const newItems = (payload.data || []).filter(
              (item: INotification) => !existingIds.has(item.id),
            );
            state.notifications = [...state.notifications, ...newItems];
          }
          state.meta = payload.meta || null;
          if (typeof payload.unreadCount === "number") {
            state.unreadCount = Math.max(0, payload.unreadCount);
          }
        });
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      } finally {
        set({ isLoading: false });
      }
    },

    fetchUnreadCount: async () => {
      try {
        const res = await getUnreadNotificationCountApi();
        const count = res?.data?.unreadCount;
        if (typeof count === "number") {
          set({ unreadCount: Math.max(0, count) });
        }
      } catch {
        // Ignore silent background check error
      }
    },

    markAsRead: async (notificationId) => {
      set((state) => {
        const target = state.notifications.find((n) => n.id === notificationId);
        if (target && !target.isRead) {
          target.isRead = true;
          target.readAt = new Date().toISOString();
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      });

      try {
        const res = await markNotificationReadApi(notificationId);
        if (typeof res?.data?.unreadCount === "number") {
          set({ unreadCount: Math.max(0, res.data.unreadCount) });
        }
      } catch (err) {
        console.error("Failed to mark notification as read:", err);
      }
    },

    markAllAsRead: async () => {
      const nowIso = new Date().toISOString();
      set((state) => {
        state.notifications = state.notifications.map((n) => ({
          ...n,
          isRead: true,
          readAt: n.readAt || nowIso,
        }));
        state.unreadCount = 0;
      });

      try {
        await markAllNotificationsReadApi();
      } catch (err) {
        console.error("Failed to mark all notifications as read:", err);
      }
    },

    markConversationNotificationsRead: async (conversationId) => {
      if (!conversationId) return;
      const hasUnreadForConv = get().notifications.some(
        (n) =>
          !n.isRead &&
          (n.resourceId === conversationId ||
            n.metadata?.conversationId === conversationId),
      );

      set((state) => {
        let reduced = 0;
        state.notifications = state.notifications.map((n) => {
          if (
            !n.isRead &&
            (n.resourceId === conversationId ||
              n.metadata?.conversationId === conversationId)
          ) {
            reduced += 1;
            return { ...n, isRead: true, readAt: new Date().toISOString() };
          }
          return n;
        });
        state.unreadCount = Math.max(0, state.unreadCount - reduced);
      });

      if (hasUnreadForConv) {
        markConversationNotificationsReadApi(conversationId).catch(() => {});
      }
    },

    removeNotification: async (notificationId) => {
      set((state) => {
        const target = state.notifications.find((n) => n.id === notificationId);
        if (target && !target.isRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.notifications = state.notifications.filter(
          (n) => n.id !== notificationId,
        );
      });

      try {
        const res = await deleteNotificationApi(notificationId);
        if (typeof res?.data?.unreadCount === "number") {
          set({ unreadCount: Math.max(0, res.data.unreadCount) });
        }
      } catch (err) {
        console.error("Failed to delete notification:", err);
      }
    },

    handleSocketNewNotification: ({ notification, unreadCount }) => {
      set((state) => {
        const existsIdx = state.notifications.findIndex(
          (n) => n.id === notification.id,
        );
        if (existsIdx !== -1) {
          state.notifications.splice(existsIdx, 1);
        }
        state.notifications.unshift(notification);
        state.unreadCount =
          typeof unreadCount === "number"
            ? Math.max(0, unreadCount)
            : state.unreadCount + 1;
      });
    },

    handleSocketUpdatedNotification: ({ notification, unreadCount }) => {
      set((state) => {
        const existsIdx = state.notifications.findIndex(
          (n) => n.id === notification.id,
        );
        if (existsIdx !== -1) {
          state.notifications.splice(existsIdx, 1);
        }
        state.notifications.unshift(notification);
        if (typeof unreadCount === "number") {
          state.unreadCount = Math.max(0, unreadCount);
        }
      });
    },

    handleSocketMarkRead: ({
      notificationIds,
      conversationId,
      unreadCount,
    }) => {
      const idSet = new Set(notificationIds || []);
      const nowIso = new Date().toISOString();

      set((state) => {
        state.notifications = state.notifications.map((n) => {
          if (
            idSet.has(n.id) ||
            (conversationId &&
              (n.resourceId === conversationId ||
                n.metadata?.conversationId === conversationId))
          ) {
            return { ...n, isRead: true, readAt: n.readAt || nowIso };
          }
          return n;
        });
        if (typeof unreadCount === "number") {
          state.unreadCount = Math.max(0, unreadCount);
        }
      });
    },

    handleSocketReadAll: () => {
      const nowIso = new Date().toISOString();
      set((state) => {
        state.notifications = state.notifications.map((n) => ({
          ...n,
          isRead: true,
          readAt: n.readAt || nowIso,
        }));
        state.unreadCount = 0;
      });
    },

    handleSocketRemoved: ({ notificationId, unreadCount }) => {
      set((state) => {
        state.notifications = state.notifications.filter(
          (n) => n.id !== notificationId,
        );
        if (typeof unreadCount === "number") {
          state.unreadCount = Math.max(0, unreadCount);
        }
      });
    },
  }),
  "notification-storage",
  {
    partialize: (state) =>
      ({
        unreadCount: state.unreadCount,
      }) as any,
  },
);
