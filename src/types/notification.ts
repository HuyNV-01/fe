import type { IPaginationMeta } from "./common";

export enum NotificationTypeEnum {
  NEW_MESSAGE = "NEW_MESSAGE",
  MESSAGE_REPLY = "MESSAGE_REPLY",
  MESSAGE_MENTION = "MESSAGE_MENTION",
  MESSAGE_REACTION = "MESSAGE_REACTION",
  MESSAGE_PINNED = "MESSAGE_PINNED",
  FRIEND_REQUEST = "FRIEND_REQUEST",
  FRIEND_ACCEPTED = "FRIEND_ACCEPTED",
  GROUP_INVITE = "GROUP_INVITE",
  GROUP_MEMBER_ADDED = "GROUP_MEMBER_ADDED",
  MISSED_CALL = "MISSED_CALL",
  SHOP_INVITATION = "SHOP_INVITATION",
  SHOP_INVITATION_ACCEPTED = "SHOP_INVITATION_ACCEPTED",
  SHOP_JOIN_REQUEST = "SHOP_JOIN_REQUEST",
  SHOP_JOIN_APPROVED = "SHOP_JOIN_APPROVED",
  SHOP_JOIN_REJECTED = "SHOP_JOIN_REJECTED",
  SHOP_ROLE_UPDATED = "SHOP_ROLE_UPDATED",
  SHOP_MEMBER_STATUS_CHANGED = "SHOP_MEMBER_STATUS_CHANGED",
  SHOP_SHIFT_HANDOVER = "SHOP_SHIFT_HANDOVER",
  SHOP_FORCE_OFFLINE = "SHOP_FORCE_OFFLINE",
  SHOP_WORKSPACE_UPDATED = "SHOP_WORKSPACE_UPDATED",
  CHANNEL_CONNECTED = "CHANNEL_CONNECTED",
  CHANNEL_TOKEN_WARNING = "CHANNEL_TOKEN_WARNING",
  INBOX_CONVERSATION_ASSIGNED = "INBOX_CONVERSATION_ASSIGNED",
  INBOX_SLA_RECLAIMED = "INBOX_SLA_RECLAIMED",
  MARKETPLACE_ORDER_SYNCED = "MARKETPLACE_ORDER_SYNCED",
  SECURITY_ALERT = "SECURITY_ALERT",
  POS_DISCOUNT_APPROVAL_REQUEST = "POS_DISCOUNT_APPROVAL_REQUEST",
  POS_DISCOUNT_APPROVAL_RESOLVED = "POS_DISCOUNT_APPROVAL_RESOLVED",
  POS_VIETQR_PAYMENT_RECEIVED = "POS_VIETQR_PAYMENT_RECEIVED",
  WAREHOUSE_LOW_STOCK_ALERT = "WAREHOUSE_LOW_STOCK_ALERT",
  WAREHOUSE_TRANSFER_DISPATCHED = "WAREHOUSE_TRANSFER_DISPATCHED",
  WAREHOUSE_TRANSFER_RECEIVED = "WAREHOUSE_TRANSFER_RECEIVED",
  SYSTEM = "SYSTEM",
}

export enum NotificationResourceTypeEnum {
  CONVERSATION = "CONVERSATION",
  MESSAGE = "MESSAGE",
  CONTACT = "CONTACT",
  CALL = "CALL",
  USER = "USER",
  SHOP_WORKSPACE = "SHOP_WORKSPACE",
  SHOP_MEMBER = "SHOP_MEMBER",
  SHOP_INVITATION = "SHOP_INVITATION",
  CHANNEL_INTEGRATION = "CHANNEL_INTEGRATION",
  WEBHOOK_LOG = "WEBHOOK_LOG",
  CUSTOMER_PROFILE = "CUSTOMER_PROFILE",
  SECURITY_AUDIT = "SECURITY_AUDIT",
  POS_ORDER = "POS_ORDER",
  PRODUCT_VARIANT = "PRODUCT_VARIANT",
  WAREHOUSE_TRANSFER = "WAREHOUSE_TRANSFER",
  INVENTORY_LEDGER = "INVENTORY_LEDGER",
  SYSTEM = "SYSTEM",
}

export interface INotificationActor {
  id: string;
  name: string;
  avatar: string | null;
}

export interface INotificationMetadata {
  shopId?: string;
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
  actorUserId?: string;
  actorName?: string;
  usedCount?: number;
  hourlyLimit?: number;
  orderId?: string;
  orderCode?: string;
  discountPercent?: number;
  allowedMaxDiscountPercent?: number;
  paidAmountVnd?: number;
  bankTransactionId?: string;
  transferId?: string;
  transferCode?: string;
  skuCode?: string;
  warehouseId?: string;
  serialNumber?: string;
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
