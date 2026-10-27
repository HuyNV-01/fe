import type { IPaginationMeta } from "./common";

export enum NotificationTypeEnum {
  NEW_MESSAGE = "NEW_MESSAGE",
  MESSAGE_REPLY = "MESSAGE_REPLY",
  MESSAGE_REACTION = "MESSAGE_REACTION",
  MESSAGE_PINNED = "MESSAGE_PINNED",
  FRIEND_REQUEST = "FRIEND_REQUEST",
  FRIEND_ACCEPTED = "FRIEND_ACCEPTED",
  GROUP_INVITE = "GROUP_INVITE",
  GROUP_MEMBER_ADDED = "GROUP_MEMBER_ADDED",
  MISSED_CALL = "MISSED_CALL",
  SYSTEM = "SYSTEM",
}

export enum NotificationResourceTypeEnum {
  CONVERSATION = "CONVERSATION",
  MESSAGE = "MESSAGE",
  CONTACT = "CONTACT",
  CALL = "CALL",
  USER = "USER",
  SYSTEM = "SYSTEM",
}

export interface INotificationActor {
  id: string;
  name: string;
  avatar: string | null;
}

export interface INotificationMetadata {
  conversationId?: string;
  conversationName?: string;
  conversationType?: string;
  messageId?: string;
  messageType?: string;
  callId?: string;
  callType?: string;
  emoji?: string;
  unreadMessageCount?: number;
  actionUrl?: string;
  titleKey?: string;
  contentKey?: string;
  i18nParams?: Record<string, string | number | boolean | null | undefined>;
}

export interface INotification {
  id: string;
  recipientId: string;
  actorId: string | null;
  actor: INotificationActor | null;
  type: NotificationTypeEnum;
  title: string;
  content: string;
  resourceType: NotificationResourceTypeEnum;
  resourceId: string | null;
  dedupeKey?: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
  metadata?: INotificationMetadata;
}

export interface INotificationListResponse {
  data: INotification[];
  meta: IPaginationMeta;
  unreadCount: number;
}

export interface INotificationSocketPayload {
  notification: INotification;
  unreadCount: number;
}

export interface INotificationReadSocketPayload {
  notificationIds: string[];
  conversationId?: string;
  unreadCount: number;
}
