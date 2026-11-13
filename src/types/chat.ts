import type {
  CallStatusEnum,
  CallTypeEnum,
  ConversationTypeEnum,
  GroupRoleEnum,
  KeyContactsEnum,
  MessageTypeEnum,
} from "@/common/enum";
import type { IUserRes } from "./common";

export type TagCategoryType =
  | "CONSULTATION_STATUS"
  | "CUSTOMER_TIER"
  | "MESSAGE_BOOKMARK"
  | "DELIVERY_ISSUE"
  | "MARKETING_SOURCE";

export type TagApplicableScopeType =
  | "CONVERSATION"
  | "MESSAGE"
  | "CUSTOMER"
  | "ORDER";

export type CommentReplyModeType =
  | "REPLY_COMMENT_ONLY"
  | "SEND_PRIVATE_REPLY_ONLY"
  | "REPLY_COMMENT_AND_PRIVATE_INBOX";

export interface IAutoTagRuleConfig {
  triggerEvent:
    | "NER_PHONE_EXTRACTED"
    | "NER_ADDRESS_EXTRACTED"
    | "POS_DRAFT_CREATED"
    | "POS_ORDER_CONFIRMED"
    | "VIETQR_PAID"
    | "CARRIER_DELIVERY_FAILED"
    | "KEYWORD_MATCH";
  keywords?: string[];
  removeTagIdsOnApply?: string[];
}

export interface ICustomTag {
  id: string;
  shopId: string;
  name: string;
  slug: string;
  colorHex: string;
  colorOklch: string;
  category: TagCategoryType;
  isMutuallyExclusiveGroup: boolean;
  applicableScopesJson: TagApplicableScopeType[];
  shortcutKey?: string | null;
  sortOrder: number;
  autoRuleConfigJson?: IAutoTagRuleConfig | null;
  isActive: boolean;
}

export interface IMessageBookmarkItem {
  assignmentId: string;
  conversationId: string;
  messageId: string;
  tagId: string;
  tagName: string;
  tagSlug: string;
  colorOklch: string;
  colorHex: string;
  messageSnippetPreview: string | null;
  noteText: string | null;
  assignedByUserId: string;
  createdAt: string;
}

export interface IQuickReplyProductCard {
  skuCode: string;
  name: string;
  retailPrice: number;
  imageUrl?: string | null;
  availableQty?: number;
}

export interface IQuickReplyTemplate {
  id: string;
  shopId: string;
  shortcut: string;
  title: string;
  category: string;
  contentTemplate: string;
  attachmentsJson?: Array<{
    fileId?: string;
    url: string;
    fileName: string;
    mimeType?: string;
  }> | null;
  productCardsJson?: IQuickReplyProductCard[] | null;
  sortOrder: number;
  usageCount: number;
  isActive: boolean;
}

export interface ICollisionLockState {
  conversationId: string;
  holderAgentId: string;
  holderAgentName: string;
  holderAgentAvatar?: string | null;
  lockedAt: string;
  expiresAt: string;
  isForcedTakeOver?: boolean;
}

export interface IAccountabilityMilestone {
  eventCode:
    | "LEAD_INBOUND"
    | "ASSIGNED_AGENT"
    | "FIRST_SEEN"
    | "FIRST_AGENT_REPLY_FRT"
    | "INTERNAL_NOTE_ADDED"
    | "CONVERSATION_TRANSFERRED"
    | "CONVERSATION_SNOOZED"
    | "CONVERSATION_UNSNOOZED"
    | "MASKED_CALL_INITIATED"
    | "MASKED_CALL_COMPLETED"
    | "PHONE_COLLECTED"
    | "ORDER_CREATED";
  actorUserId?: string | null;
  actorName?: string | null;
  targetUserId?: string | null;
  targetUserName?: string | null;
  note?: string | null;
  elapsedSecondsFromInbound?: number | null;
  timestamp: string;
}

export interface IOmnichannelFilterState {
  channelIds?: string[];
  unreadOnly?: boolean;
  unrepliedOnly?: boolean;
  ghostedByAgentOnly?: boolean;
  slaBreachedOnly?: boolean;
  window24hExpiringOnly?: boolean;
  snoozedOnly?: boolean;
  hasPhone?: boolean;
  noPhone?: boolean;
  hasOrder?: boolean;
  noOrder?: boolean;
  interactionType?: "INBOX" | "COMMENT" | "LIVESTREAM" | "MARKETPLACE";
  sourcePostId?: string;
  sourceAdId?: string;
  assignedAgentId?: string;
  includeTagIds?: string[];
  includeTagOperator?: "AND" | "OR";
  includeTagMatchMode?: "AND" | "OR";
  excludeTagIds?: string[];
  searchKeyword?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface IOmnichannelSummaryCounts {
  totalAll: number;
  unrepliedCount: number;
  ghostedCount: number;
  slaBreachedCount: number;
  window24hExpiringCount: number;
  snoozedCount: number;
  hasPhoneCount: number;
  unconfirmedOrderCount: number;
}

export interface IMaskedVoipCallSession {
  callSessionId: string;
  conversationId: string;
  maskedPhoneDisplay: string;
  sipTrunkProvider?: string;
  status: CallStatusEnum;
  startedAt: string;
  durationSeconds?: number;
  recordingFileUrl?: string | null;
  callDispositionTag?: string | null;
}

export interface IConversation {
  id: string;
  name?: string;
  originalName?: string;
  partnerNickname?: string | null;
  partnerEmail?: string | null;
  isBlocked?: boolean;
  blockedByMe?: boolean;
  blockedByPartner?: boolean;
  avatar?: string | null;
  lastMessage?: string | null;
  lastMessageAt?: string;
  lastMessageType?: string;
  lastMessageSenderId?: string;
  lastMessageStatus?: MessageStatus | null;
  lastMessageExpiresAt?: string | null;
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
  shopId?: string | null;
  channelType?: string;
  channelIntegrationId?: string | null;
  externalThreadId?: string | null;
  interactionType?: "INBOX" | "COMMENT" | "LIVESTREAM" | "MARKETPLACE";
  customerId?: string | null;
  assignedAgentId?: string | null;
  supportStatus?: string;
  slaDeadlineAt?: string | null;
  isSlaBreached?: boolean;
  firstSeenAt?: string | null;
  firstSeenByAgentId?: string | null;
  isGhostedByAgent?: boolean;
  hasPhoneCollected?: boolean;
  hasOrderCreated?: boolean;
  sourcePostId?: string | null;
  sourceAdId?: string | null;
  sourceCampaignId?: string | null;
  ctwaClickId?: string | null;
  activeTagIdsJson?: string[] | null;
  snoozedUntilAt?: string | null;
  snoozeNote?: string | null;
  accountabilityTimelineJson?: IAccountabilityMilestone[] | null;
  pageShortCode?: string;
  pageName?: string;
  channelAvatarUrl?: string | null;
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
  callDirection?: "INTERNAL_WEBRTC" | "OUTBOUND_SIP_PSTN" | "INBOUND_SIP_PSTN";
  maskedPhoneDisplay?: string | null;
  recordingFileId?: string | null;
  recordingFileUrl?: string | null;
  callDispositionTag?: string | null;
  callNotes?: string | null;
  waveformPeaks?: number[];
}

export interface IMessageTranslation {
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  translatedAt: string;
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
  isInternalNote?: boolean;
  quickReplyShortcutUsed?: string;
  productCards?: IQuickReplyProductCard[];
  translation?: IMessageTranslation;
  // Universal Comment Response & Anti-Competitor Shielding (F03.3 & F03.4)
  externalCustomerName?: string;
  externalCustomerAvatar?: string | null;
  externalCustomerPsid?: string | null;
  skipPlatformDispatch?: boolean;
  externalCommentId?: string;
  externalPostId?: string;
  isHiddenOnPlatform?: boolean;
  hiddenByAgentId?: string;
  hiddenAt?: string;
  isLikedByPage?: boolean;
  likedByAgentId?: string;
  isDeletedOnPlatform?: boolean;
  deletedOnPlatformAt?: string;
  deletedByActor?: "CUSTOMER" | "AGENT";
  deletedByAgentId?: string | null;
  platformDeliveryStatus?: "DISPATCHED" | "SIMULATED_SANDBOX" | "FAILED";
  platformExternalId?: string | null;
  platformEditedExternalId?: string | null;
  platformEditSyncedAt?: string;
  autoHideCommentOnReply?: boolean;
  originalTextBeforePlatformEdit?: string;
  privateReplySentAt?: string;
  privateReplyByAgentId?: string;
  linkedInboxConversationId?: string;
  commentReplyMode?: CommentReplyModeType;
  buyerDeliveredAt?: string | null;
  buyerReadAt?: string | null;
  platformSeenSyncedAt?: string | null;
  viewerReadBy?: Array<{
    id: string;
    name: string;
    avatar: string | null;
    readAt: string;
  }>;
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
  user?: IUserRes;
  lastReadAt: string;
  status?: MessageStatus;
  isBuyerReceipt?: boolean;
  platformSeenSynced?: boolean;
}

export interface IMessageRecalledPayload {
  conversationId: string;
  messageId: string;
  recalledBy: string;
  recalledAt: string;
  isLastMessage?: boolean;
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
  isLastMessage?: boolean;
  shopId?: string | null;
  direction?: "INBOUND" | "OUTBOUND" | "INTERNAL_NOTE" | "SYSTEM";
  isInternalNote?: boolean;
  messageTagIdsJson?: string[] | null;
  extractedEntitiesJson?: {
    phones?: string[];
    normalizedPhones?: Array<{
      rawMatch: string;
      localPhone: string;
      e164Phone: string;
      carrierName: string;
    }>;
    provinceCode?: string | null;
    provinceName?: string | null;
    districtCode?: string | null;
    districtName?: string | null;
    wardCode?: string | null;
    wardName?: string | null;
    addressLine?: string | null;
    fullFormattedAddress?: string | null;
    carrierCodes?: {
      ghnProvinceId?: number;
      ghnDistrictId?: number;
      ghnWardCode?: string;
      ghtkProvince?: string;
      ghtkDistrict?: string;
      ghtkWard?: string;
      vtpProvinceId?: number;
      jtCityCode?: string;
    } | null;
    skuCodes?: string[];
    colors?: string[];
    sizes?: string[];
    heightCm?: number | null;
    weightKg?: number | null;
    quantities?: number[];
    processingTimeMs?: number;
  } | null;
  aiDraftConfidence?: number | null;
  orderIdRef?: string | null;
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
  isHandRaised?: boolean;
  raisedHandAt?: string | null;
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
  avatar?: string | null;
  disappearingTtl: number | null;
  shopId?: string | null;
  channelType?: string;
  channelIntegrationId?: string | null;
  interactionType?: "INBOX" | "COMMENT" | "LIVESTREAM" | "MARKETPLACE";
  supportStatus?: string;
  assignedAgentId?: string | null;
  isGhostedByAgent?: boolean;
  isSlaBreached?: boolean;
  slaDeadlineAt?: string | null;
  snoozedUntilAt?: string | null;
  snoozeNote?: string | null;
  activeTagIdsJson?: string[];
  customerId?: string | null;
  sourceAdId?: string | null;
  sourcePostId?: string | null;
  sourceCampaignId?: string | null;
  ctwaClickId?: string | null;
  accountabilityTimelineJson?: IAccountabilityMilestone[];
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
  algorithm: "AES-256-GCM";
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
