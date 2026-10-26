import apiClient from "@/lib/http/axios-client";
import type { NotificationTypeEnum } from "@/types/notification";

export const getNotificationsApi = async (params: {
  page?: number;
  limit?: number;
  isRead?: boolean;
  type?: NotificationTypeEnum;
}) => {
  return apiClient.get("/notifications", { params });
};

export const getUnreadNotificationCountApi = async () => {
  return apiClient.get("/notifications/unread-count");
};

export const markNotificationReadApi = async (notificationId: string) => {
  return apiClient.patch(`/notifications/${notificationId}/read`);
};

export const markAllNotificationsReadApi = async () => {
  return apiClient.put("/notifications/read-all");
};

export const markConversationNotificationsReadApi = async (
  conversationId: string,
) => {
  return apiClient.put(`/notifications/conversations/${conversationId}/read`);
};

export const deleteNotificationApi = async (notificationId: string) => {
  return apiClient.delete(`/notifications/${notificationId}`);
};
