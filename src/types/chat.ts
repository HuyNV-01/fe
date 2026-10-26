import type {
  CallStatusEnum,
  CallTypeEnum,
  ConversationTypeEnum,
  KeyContactsEnum,
  MessageTypeEnum,
} from "@/common/enum";
import type { IUserRes } from "./common";

export interface IConversation {
  id: string;
  name?: string;
  avatar?: string | null;
  lastMessage?: string | null;
  lastMessageAt?: string;
  lastMessageType?: string;
  lastMessageSenderId?: string;
  unreadCount?: number;
  type: ConversationTypeEnum;
  isOnline?: boolean;
  partnerId?: string;
  isAdmin?: boolean;
  isMuted?: boolean;
}

export interface ICreateGroupPayload {
  name: string;
  memberIds: string[];
}

export interface IAddGroupMembersPayload {
  conversationId: string;
  memberIds: string[];
}

export interface IRemoveGroupMemberPayload {
  conversationId: string;
  memberId: string;
}

export interface IGroupUpdatedPayload {
  action: "members_added" | "member_removed";
  conversationId: string;
  addedMemberIds?: string[];
  removedUserId?: string;
}

export interface IMessageAttachment {
  fileId: string;
  url: string;
  thumbnailUrl?: string;
  fileName: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
}

export interface IMessageReplyPreview {
  messageId: string;
  senderId: string;
  senderName?: string;
  content: string;
  type: MessageTypeEnum;
}

export interface IMessageCallInfo {
  callId: string;
  callType: CallTypeEnum;
  status: CallStatusEnum;
  durationSeconds?: number;
  initiatorId: string;
  participantIds: string[];
  startedAt?: string;
  endedAt?: string;
}

export interface IMessageMetadata {
  fileName?: string;
  fileSize?: number;
  width?: number;
  height?: number;
  isEncrypted?: boolean;
  encryptionAlg?: "AES-256-GCM";
  isE2EE?: boolean;
  e2eeKeyId?: string;
  isEdited?: boolean;
  editedAt?: string;
  isPinned?: boolean;
  pinnedBy?: string;
  pinnedAt?: string;
  replyToMessageId?: string;
  replyPreview?: IMessageReplyPreview;
  reactions?: Record<string, string[]>;
  attachments?: IMessageAttachment[];
  callInfo?: IMessageCallInfo;
}

export interface ISendMessagePayload {
  conversationId: string;
  content: string;
  type?: MessageTypeEnum;
  replyToMessageId?: string;
  fileIds?: string[];
  isE2EE?: boolean;
  e2eeKeyId?: string;
  metadata?: Partial<IMessageMetadata>;
}

export interface ITypingPayload {
  userId: string;
  conversationId: string;
}

export interface ISocketErrorPayload {
  status: string | number;
  code?: string;
  message: string | string[];
  error?: string;
}

export type MessageStatus =
  | "sending"
  | "sent"
  | "delivered"
  | "read"
  | "failed"
  | "removed";

export interface IMessageStatusUpdatePayload {
  id: string;
  conversationId: string;
  status: MessageStatus;
  userId: string;
  updatedAt?: string;
  timestamp?: string;
}

export interface IMessageReadPayload {
  conversationId: string;
  userId: string;
  user: IUserRes;
  lastReadAt: string;
}

export interface IMessageRecalledPayload {
  conversationId: string;
  messageId: string;
  recalledBy: string;
  recalledAt: string;
}

export interface IMessageReactionPayload {
  conversationId: string;
  messageId: string;
  userId: string;
  emoji: string;
  action: "added" | "removed";
  reactions: Record<string, string[]>;
}

export interface IMessagePinnedPayload {
  conversationId: string;
  messageId: string;
  isPinned: boolean;
  pinnedBy: string;
}

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
  replyToMessageId?: string | null;
  isPinned?: boolean;
  metadata?: IMessageMetadata;
  deliveredTo?: string[];
  readBy?: string[];
  readByUsers?: IUserRes[];
}

export interface IUserStatusPayload {
  userId: string;
  isOnline: boolean;
  lastActive?: string;
}

export interface ICallParticipantState {
  userId: string;
  joinedAt: string;
  isAudioMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
}

export interface ICallMemberInfo {
  id: string;
  name: string;
  avatar: string | null;
}

export interface IActiveCallState {
  callId: string;
  conversationId: string;
  callType: CallTypeEnum;
  isGroupCall?: boolean;
  initiatorId: string;
  callerName?: string;
  callerAvatar?: string | null;
  status: CallStatusEnum;
  isIncoming: boolean;
  sdpOffer?: RTCSessionDescriptionInit;
  startedAt?: string;
  answeredAt?: string;
  participants: Record<string, ICallParticipantState>;
  membersInfo?: ICallMemberInfo[];
  isMinimized?: boolean;
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
