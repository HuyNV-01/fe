import type {
  CallStatusEnum,
  CallTypeEnum,
  ConversationTypeEnum,
  GroupRoleEnum,
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
  isSavedMessages?: boolean;
  isAdmin?: boolean;
  isMuted?: boolean;
  soundEnabled?: boolean;
  readReceiptsEnabled?: boolean;
  isRestricted?: boolean;
  disappearingTtl?: number | null;
}

export interface IPollOption {
  id: string;
  text: string;
  voterIds: string[];
}

export interface IPollMetadata {
  question: string;
  options: IPollOption[];
  allowMultipleAnswers: boolean;
  isAnonymous?: boolean;
  isClosed: boolean;
  closedAt?: string;
  closedBy?: string;
}

export interface ILinkPreviewMetadata {
  url: string;
  hostname: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
}

export interface IPollUpdatedPayload {
  conversationId: string;
  messageId: string;
  poll: IPollMetadata;
  votedBy?: string;
  closedBy?: string;
}

export interface ILinkPreviewReadyPayload {
  conversationId: string;
  messageId: string;
  linkPreview: ILinkPreviewMetadata;
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
  forwardedFrom?: {
    messageId: string;
    senderId: string;
    senderName: string;
  };
  reactions?: Record<string, string[]>;
  attachments?: IMessageAttachment[];
  callInfo?: IMessageCallInfo;
  poll?: IPollMetadata;
  linkPreview?: ILinkPreviewMetadata;
  mentionedUserIds?: string[];
  mentionAll?: boolean;
  expiresAt?: string;
  disappearingTtl?: number;
}

export interface ISendMessagePayload {
  conversationId: string;
  content: string;
  type?: MessageTypeEnum;
  replyToMessageId?: string;
  fileIds?: string[];
  isE2EE?: boolean;
  e2eeKeyId?: string;
  mentionedUserIds?: string[];
  mentionAll?: boolean;
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
  expiresAt?: string | null;
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

export interface IConversationMemberDetail {
  userId: string;
  name: string;
  email: string;
  avatar: string | null;
  nickname: string | null;
  isAdmin: boolean;
  role?: GroupRoleEnum;
  joinedAt: string;
}

export interface IConversationDetails {
  conversationId: string;
  type: ConversationTypeEnum;
  name?: string;
  disappearingTtl: number | null;
  mySettings: {
    isMuted: boolean;
    soundEnabled: boolean;
    readReceiptsEnabled: boolean;
    isRestricted: boolean;
    nickname: string | null;
  };
  blockState: {
    isBlocked: boolean;
    blockedByMe: boolean;
    blockedByPartner: boolean;
    partnerId: string | null;
  };
  members: IConversationMemberDetail[];
}

export interface ISharedMediaItem {
  messageId: string;
  fileId: string;
  url: string;
  thumbnailUrl?: string;
  fileName: string;
  mimeType: string;
  size: number;
  type: MessageTypeEnum;
  senderId: string;
  senderName: string;
  createdAt: string;
}

export interface ISharedLinkItem {
  messageId: string;
  url: string;
  hostname: string;
  previewText: string;
  senderId: string;
  senderName: string;
  createdAt: string;
}

export interface ISharedAssetsResponse {
  media: ISharedMediaItem[];
  files: ISharedMediaItem[];
  links: ISharedLinkItem[];
}

export interface IGroupUpdatedPayload {
  action: "members_added" | "member_removed" | "role_updated";
  conversationId: string;
  addedMemberIds?: string[];
  removedUserId?: string;
  newOwnerUserId?: string | null;
  targetUserId?: string;
  role?: GroupRoleEnum;
  isAdmin?: boolean;
}

export interface AttachmentE2EEWrappedKey {
  ivB64: string;
  wrappedKeyB64: string;
}

export interface AttachmentE2EEMeta {
  algorithm: 'AES-256-GCM';
  fileIvB64: string;
  originalMimeType: string;
  senderUserId: string;
  senderPublicKeyB64: string;
  senderKeyId: string;
  wrappedKeys: Record<string, AttachmentE2EEWrappedKey>;
}

export interface MessageAttachmentMeta {
  fileId: string;
  url: string;
  thumbnailUrl?: string;
  fileName: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  e2ee?: AttachmentE2EEMeta;
}