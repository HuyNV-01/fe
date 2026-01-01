import type {
  ContactStatusEnum,
  ConversationTypeEnum,
  KeyContactsEnum,
  MessageTypeEnum,
} from "@/common/enum";
import type { IUserRes } from "./common";

export interface IConversation {
  id: string;
  name?: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
  type: ConversationTypeEnum;
  isOnline?: boolean;
  partnerId?: string;
}

export interface ISendMessagePayload {
  conversationId: string;
  content: string;
  type?: MessageTypeEnum;
}

export interface ITypingPayload {
  userId: string;
  conversationId: string;
}

export interface ISocketErrorPayload {
  status: string;
  message: string | string[];
  error?: string;
}

export type MessageStatus = "sending" | "sent" | "read" | "failed";

export interface IMessage {
  id: string;
  content: string;
  type: MessageTypeEnum;
  senderId: string;
  conversationId: string;
  createdAt: string;
  sender?: IUserRes;
  status?: MessageStatus;
  tempId?: string;
}

export interface IUserStatusPayload {
  userId: string;
  isOnline: boolean;
  lastActive?: string;
}

export type TOptionKey = KeyContactsEnum;

export interface IMenuItem {
  key: TOptionKey;
  label: string;
  icon: React.ElementType;
  href: string;
  countKey?: keyof IOptionCounts;
}

export interface IOptionCounts {
  friendRequests?: number;
  groupRequests?: number;
}
