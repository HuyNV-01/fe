/** biome-ignore-all lint/suspicious/useIterableCallbackReturn: <explanation> */
import type {
  IActiveCallState,
  IAddGroupMembersPayload,
  IConversation,
  ICreateGroupPayload,
  IGroupUpdatedPayload,
  IMessage,
  IMessagePinnedPayload,
  IMessageReactionPayload,
  IMessageReadPayload,
  IMessageRecalledPayload,
  IMessageStatusUpdatePayload,
  IRemoveGroupMemberPayload,
  ISendMessagePayload,
  ITypingPayload,
  IUserStatusPayload,
  MessageStatus,
  IPollUpdatedPayload,
  ILinkPreviewReadyPayload,
  ICollisionLockState,
  IMaskedVoipCallSession,
  IOmnichannelFilterState,
  IOmnichannelSummaryCounts,
  IMessageTranslation,
  IAccountabilityMilestone,
} from "@/types/chat";
import type { CreateDirectChatPayload, IPaginationMeta } from "@/types/common";
import type { ActionCallbacks } from "@/types/store";
import { createPersistedStore } from "../create-persisted-store";
import {
  getInbox,
  getMessages,
  createDirectChat,
  createGroup,
  addGroupMembersApi,
  removeGroupMemberApi,
  markAsReadApi,
  uploadChatAttachmentsApi,
  editMessageApi,
  recallMessageApi,
  reactMessageApi,
  pinMessageApi,
  muteConversationApi,
  sendMessageHttpFallbackApi,
  getConversationDetailsApi,
  getPinnedMessagesApi,
  getSharedAssetsApi,
  updateParticipantNicknameApi,
  updateConversationSettingsApi,
  updateDisappearingMessagesApi,
  deleteConversationApi,
  updateGroupMemberRoleApi,
  forwardMessageApi,
  getOrCreateSavedMessagesApi,
  createPollApi,
  votePollApi,
  closePollApi,
  getConversationActiveCallApi,
  queryOmnichannelInboxApi,
  createInternalNoteApi,
  toggleCommentVisibilityApi,
  toggleCommentLikeApi,
  deleteCommentOnPlatformApi,
  sendPrivateReplyFromCommentApi,
  snoozeConversationApi,
  cancelSnoozeConversationApi,
  transferConversationApi,
  acquireCollisionLockApi,
  releaseCollisionLockApi,
  forceTakeoverCollisionLockApi,
  initiateMaskedVoipCallApi,
  finalizeMaskedVoipCallApi,
  translateChatMessageApi,
} from "./api";
import { blockUserApi, unblockUserApi } from "../contact/api";
import type { IConversationDetails, ISharedAssetsResponse } from "@/types/chat";

import { socketService } from "@/services/socket/socket-client";
import {
  CallStatusEnum,
  CallTypeEnum,
  ConversationTypeEnum,
  GroupRoleEnum,
  MessageTypeEnum,
  SocketNamespaceEnum,
} from "@/common/enum";
import { SOCKET_EVENTS } from "@/constant/socket-events";
import { useAuthStore } from "../auth/use-auth-store";
import { v4 as uuidv4 } from "uuid";
import { DEFAULT_LIMIT_INBOX, DEFAULT_LIMIT_MESSAGE } from "@/constant";
import { toast } from "sonner";

import { useNotificationStore } from "../notification/use-notification-store";
import { parseSafeDate } from "@/utils/date-helper";
import { tStore } from "@/i18n/translate-store";

const tChatToast = (subKey: string, params?: Record<string, string | number>) =>
  tStore(`Chat.Detail.storeToast.${subKey}`, params);

const typingTimers = new Map<string, NodeJS.Timeout>();

const loadingMessagesByConv = new Set<string>();
const locallyReadConversations = new Map<string, number>();

const mergeAndSortMessages = (
  existing: IMessage[],
  incoming: IMessage[],
): IMessage[] => {
  const map = new Map<string, IMessage>();
  const tempIdMap = new Map<string, string>();

  for (const msg of existing) {
    if (!msg?.id) continue;
    map.set(msg.id, msg);
    if (msg.tempId) {
      tempIdMap.set(msg.tempId, msg.id);
    }
  }

  for (const msg of incoming) {
    if (!msg?.id) continue;
    if (msg.tempId && tempIdMap.has(msg.tempId)) {
      const oldId = tempIdMap.get(msg.tempId)!;
      if (oldId !== msg.id) {
        map.delete(oldId);
      }
    }
    const prev = map.get(msg.id);
    map.set(msg.id, prev ? { ...prev, ...msg } : msg);
  }

  return Array.from(map.values()).sort((a, b) => {
    const timeA = parseSafeDate(a.createdAt)?.getTime() ?? 0;
    const timeB = parseSafeDate(b.createdAt)?.getTime() ?? 0;
    return timeA - timeB;
  });
};

export const matchConversationBySearchRule = (
  conv: IConversation,
  rawKeyword: string,
  details?: IConversationDetails,
  currentUserId?: string,
): boolean => {
  const keyword = rawKeyword.trim().toLowerCase();
  if (!keyword) return false;

  if (conv.type === ConversationTypeEnum.GROUP) {
    const groupName = (conv.name || "").trim().toLowerCase();
    return groupName.includes(keyword);
  }

  if (conv.type === ConversationTypeEnum.DIRECT) {
    if (
      conv.isBlocked ||
      conv.blockedByMe ||
      conv.blockedByPartner ||
      details?.blockState?.isBlocked
    ) {
      return false;
    }

    const partnerMember = details?.members?.find(
      (m) => m.userId !== currentUserId,
    );

    const displayName = (
      conv.originalName ||
      partnerMember?.name ||
      conv.name ||
      ""
    )
      .trim()
      .toLowerCase();
    const nickname = (
      conv.partnerNickname ||
      partnerMember?.nickname ||
      conv.name ||
      ""
    )
      .trim()
      .toLowerCase();
    const email = (conv.partnerEmail || partnerMember?.email || "")
      .trim()
      .toLowerCase();

    return (
      displayName.includes(keyword) ||
      nickname.includes(keyword) ||
      email.includes(keyword)
    );
  }

  return false;
};

interface ChatState {
  tempConversations: IConversation[];
  conversations: IConversation[];
  inboxMeta: IPaginationMeta | null;
  messages: Record<string, IMessage[]>;
  messagesMeta: Record<string, IPaginationMeta>;
  typingUsers: Record<string, string[]>;

  replyingTo: Record<string, IMessage | null>;
  editingMessage: Record<string, IMessage | null>;
  uploadProgress: Record<string, number>;
  activeCall: IActiveCallState | null;

  activeConversationId: string | null;
  isSocketConnected: boolean;
  isLoadingInbox: boolean;
  isLoadingMessages: boolean;
  isLoadingSearch: boolean;

  pinnedMessagesByConv: Record<string, IMessage[]>;
  conversationDetails: Record<string, IConversationDetails>;
  sharedAssets: Record<string, ISharedAssetsResponse>;
  fetchConversationDetails: (conversationId: string) => Promise<void>;
  fetchPinnedMessages: (conversationId: string) => Promise<void>;
  fetchSharedAssets: (conversationId: string) => Promise<void>;
  updateNickname: (payload: {
    conversationId: string;
    targetUserId: string;
    nickname: string | null;
  }) => Promise<boolean>;
  updateConversationSettings: (payload: {
    conversationId: string;
    isMuted?: boolean;
    soundEnabled?: boolean;
    readReceiptsEnabled?: boolean;
    isRestricted?: boolean;
  }) => Promise<void>;
  updateDisappearingMessages: (
    conversationId: string,
    disappearingTtl: number | null,
  ) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<boolean>;
  toggleBlockUser: (
    conversationId: string,
    targetUserId: string,
    shouldBlock: boolean,
  ) => Promise<boolean>;
  syncBlockStateForUser: (
    targetUserId: string,
    blockPatch: {
      blockedByMe?: boolean;
      blockedByPartner?: boolean;
    },
  ) => void;
  handleNicknameUpdated: (payload: {
    conversationId: string;
    targetUserId: string;
    nickname: string | null;
    originalName?: string | null;
    displayName?: string | null;
  }) => void;
  handleConversationSettingsUpdated: (payload: {
    conversationId: string;
    disappearingTtl?: number | null;
  }) => void;

  setSocketConnected: (status: boolean) => void;
  setActiveConversation: (id: string | null) => void;
  markConversationReadOptimistic: (conversationId: string) => void;
  setTypingUser: (payload: ITypingPayload & { isTyping: boolean }) => void;

  setReplyingTo: (conversationId: string, message: IMessage | null) => void;
  setEditingMessage: (conversationId: string, message: IMessage | null) => void;

  setActiveCall: (call: IActiveCallState | null) => void;
  updateActiveCall: (patch: Partial<IActiveCallState>) => void;
  initiateCall: (
    conversationId: string,
    callType: CallTypeEnum,
  ) => Promise<void>;

  handleIncomingMessage: (message: IMessage) => void;
  handleMessageEdited: (message: IMessage) => void;
  handleMessageRecalled: (payload: IMessageRecalledPayload) => void;
  handleMessageReaction: (payload: IMessageReactionPayload) => void;
  handleMessagePinned: (payload: IMessagePinnedPayload) => void;
  handleGroupUpdated: (payload: IGroupUpdatedPayload) => void;

  updateMessageStatus: (payload: IMessageStatusUpdatePayload) => void;
  handleReadMessage: (payload: IMessageReadPayload) => void;
  setUserStatus: (payload: IUserStatusPayload) => void;
  updateMessageStatusBatch: (payload: {
    conversationId: string;
    messageIds: string[];
    status: MessageStatus;
  }) => void;

  fetchInbox: (
    payload: { page?: number; limit?: number; search?: string },
    cb?: ActionCallbacks,
  ) => Promise<void>;
  fetchMessages: (
    conversationId: string,
    page?: number,
    cb?: ActionCallbacks,
  ) => Promise<void>;
  createDirectChat: (
    payload: CreateDirectChatPayload,
    cb?: ActionCallbacks,
  ) => Promise<string | null>;
  createGroupChat: (
    payload: ICreateGroupPayload,
    cb?: ActionCallbacks<IConversation>,
  ) => Promise<string | null>;
  addGroupMembers: (
    payload: IAddGroupMembersPayload,
    cb?: ActionCallbacks,
  ) => Promise<boolean>;
  removeGroupMember: (
    payload: IRemoveGroupMemberPayload,
    cb?: ActionCallbacks,
  ) => Promise<boolean>;
  sendMessage: (payload: ISendMessagePayload) => Promise<void>;
  sendAttachmentMessage: (payload: {
    conversationId: string;
    files: File[];
    content?: string;
    replyToMessageId?: string;
  }) => Promise<void>;
  editMessage: (payload: {
    conversationId: string;
    messageId: string;
    content: string;
  }) => Promise<void>;
  recallMessage: (payload: {
    conversationId: string;
    messageId: string;
  }) => Promise<void>;
  reactMessage: (payload: {
    conversationId: string;
    messageId: string;
    emoji: string;
  }) => Promise<void>;
  pinMessage: (payload: {
    conversationId: string;
    messageId: string;
    isPinned: boolean;
  }) => Promise<void>;
  toggleMuteConversation: (
    conversationId: string,
    isMuted: boolean,
  ) => Promise<void>;
  resendMessage: (
    tempId: string,
    payload: ISendMessagePayload,
  ) => Promise<void>;
  removeFailedMessage: (tempId: string, conversationId: string) => void;
  resetTempConversations: () => void;
  updateGroupMemberRole: (payload: {
    conversationId: string;
    memberId: string;
    role: GroupRoleEnum;
  }) => Promise<boolean>;
  forwardMessage: (payload: {
    messageId: string;
    sourceConversationId: string;
    targetConversationIds: string[];
  }) => Promise<boolean>;
  openSavedMessages: () => Promise<string | null>;
  createPoll: (payload: {
    conversationId: string;
    question: string;
    options: string[];
    allowMultipleAnswers?: boolean;
    isAnonymous?: boolean;
  }) => Promise<boolean>;
  votePoll: (payload: {
    conversationId: string;
    messageId: string;
    optionIds: string[];
  }) => Promise<void>;
  closePoll: (payload: {
    conversationId: string;
    messageId: string;
  }) => Promise<void>;
  handlePollUpdated: (payload: IPollUpdatedPayload) => void;
  handleLinkPreviewReady: (payload: ILinkPreviewReadyPayload) => void;
  ongoingCallsByConv: Record<string, IActiveCallState | null>;
  purgeExpiredMessages: () => void;
  fetchConversationActiveCall: (conversationId: string) => Promise<void>;
  setOngoingCallForConv: (
    conversationId: string,
    call: IActiveCallState | null,
  ) => void;

  // Sprint 2 Omnichannel Inbox, Collision Lock, Snooze, Internal Note, Masked VoIP, Comment Actions & Translation
  collisionLocksByConv: Record<string, ICollisionLockState | null>;
  activeMaskedCall: IMaskedVoipCallSession | null;
  omnichannelFilter: IOmnichannelFilterState;
  omnichannelSummaryCounts: IOmnichannelSummaryCounts | null;
  setOmnichannelFilter: (patch: Partial<IOmnichannelFilterState>) => void;
  resetOmnichannelFilter: () => void;
  queryOmnichannelInbox: (
    shopId: string,
    overrideFilter?: Partial<IOmnichannelFilterState>,
  ) => Promise<void>;
  sendInternalNote: (payload: {
    conversationId: string;
    content: string;
    mentionedUserIds?: string[];
    replyToMessageId?: string;
  }) => Promise<boolean>;
  toggleCommentVisibility: (payload: {
    conversationId: string;
    messageId: string;
    isHidden: boolean;
  }) => Promise<boolean>;
  toggleCommentLike: (payload: {
    conversationId: string;
    messageId: string;
    isLiked: boolean;
  }) => Promise<boolean>;
  deleteCommentOnPlatform: (payload: {
    conversationId: string;
    messageId: string;
  }) => Promise<boolean>;
  handleRealtimeCommentVisibilityUpdated: (payload: {
    conversationId: string;
    messageId: string;
    isHiddenOnPlatform: boolean;
    hiddenByAgentId?: string | null;
    hiddenAt?: string | null;
  }) => void;
  handleRealtimeCommentLikeUpdated: (payload: {
    conversationId: string;
    messageId: string;
    isLikedByPage: boolean;
    likedByAgentId?: string | null;
  }) => void;
  handleRealtimeCommentPrivateReplySent: (payload: {
    conversationId: string;
    commentMessageId: string;
    linkedInboxConversationId: string;
    privateReplySentAt: string;
    privateReplyByAgentId?: string | null;
    isHiddenOnPlatform?: boolean;
    isLikedByPage?: boolean;
  }) => void;
  handleRealtimeCommentDeletedOnPlatform: (payload: {
    conversationId: string;
    messageId: string;
    isDeletedOnPlatform: boolean;
    deletedByActor?: "CUSTOMER" | "AGENT";
    deletedByAgentId?: string | null;
    deletedOnPlatformAt?: string;
  }) => void;
  sendPrivateReplyFromComment: (payload: {
    conversationId: string;
    messageId: string;
    content: string;
    autoHideComment?: boolean;
    autoLikeComment?: boolean;
  }) => Promise<{ linkedInboxConversationId?: string } | null>;
  snoozeConversation: (payload: {
    conversationId: string;
    snoozedUntilAt: string;
    snoozeNote?: string;
  }) => Promise<boolean>;
  cancelSnoozeConversation: (conversationId: string) => Promise<boolean>;
  transferConversation: (payload: {
    conversationId: string;
    targetAgentId: string;
    transferNote?: string;
  }) => Promise<boolean>;
  acquireCollisionLock: (
    conversationId: string,
  ) => Promise<ICollisionLockState | null>;
  releaseCollisionLock: (conversationId: string) => Promise<void>;
  forceTakeOverCollisionLock: (
    shopId: string,
    conversationId: string,
  ) => Promise<boolean>;
  setCollisionLockForConv: (
    conversationId: string,
    lock: ICollisionLockState | null,
  ) => void;
  initiateMaskedVoipCall: (payload: {
    conversationId: string;
    customerId?: string;
    customerPhoneMasked?: string;
  }) => Promise<IMaskedVoipCallSession | null>;
  finalizeMaskedVoipCall: (payload: {
    conversationId: string;
    callSessionId: string;
    durationSeconds: number;
    callDispositionTag: string;
    callNotes?: string;
  }) => Promise<boolean>;
  setActiveMaskedCall: (call: IMaskedVoipCallSession | null) => void;
  translateMessageOrDraft: (payload: {
    text: string;
    targetLang: string;
    sourceLang?: string;
    messageId?: string;
    conversationId?: string;
  }) => Promise<{
    translatedText: string;
    sourceLang: string;
    targetLang: string;
  } | null>;
  handleMessageTranslated: (payload: {
    conversationId: string;
    messageId: string;
    translation: IMessageTranslation;
  }) => void;
  syncConversationTagsOptimistic: (
    conversationId: string,
    activeTagIds: string[],
  ) => void;
  syncMessageTagsOptimistic: (
    conversationId: string,
    messageId: string,
    messageTagIds: string[],
  ) => void;
  handleGhostedAlert: (payload: {
    conversationId: string;
    customerName?: string;
  }) => void;
  handleSnoozeWakeup: (payload: {
    conversationId: string;
    customerName?: string;
    snoozeNote?: string | null;
  }) => void;
  handleConversationTransferred: (payload: {
    conversationId: string;
    fromAgentId: string;
    toAgentId: string;
    timeline?: IAccountabilityMilestone[];
  }) => void;
}

export const useChatStore = createPersistedStore<ChatState>(
  (set, get) => ({
    tempConversations: [],
    conversations: [],
    inboxMeta: null,
    messages: {},
    messagesMeta: {},
    typingUsers: {},
    replyingTo: {},
    editingMessage: {},
    uploadProgress: {},
    activeCall: null,
    activeConversationId: null,
    isSocketConnected: false,
    isLoadingInbox: false,
    isLoadingMessages: false,
    isLoadingSearch: false,
    pinnedMessagesByConv: {},
    conversationDetails: {},
    sharedAssets: {},
    ongoingCallsByConv: {},
    collisionLocksByConv: {},
    activeMaskedCall: null,
    omnichannelFilter: {
      includeTagOperator: "OR",
    },
    omnichannelSummaryCounts: null,

    setSocketConnected: (status) => {
      set({ isSocketConnected: status });

      if (status) {
        const { activeConversationId } = get();
        if (activeConversationId) {
          socketService
            .emit(SocketNamespaceEnum.CHAT, SOCKET_EVENTS.CHAT.JOIN_ROOM, {
              conversationId: activeConversationId,
            })
            .catch(console.warn);
        }
      }
    },

    markConversationReadOptimistic: (conversationId) => {
      if (!conversationId) return;
      const nowMs = Date.now();
      locallyReadConversations.set(conversationId, nowMs);

      set((state) => {
        const conv = state.conversations.find((c) => c.id === conversationId);
        if (conv) {
          conv.unreadCount = 0;
        }
        const tempConv = state.tempConversations.find(
          (c) => c.id === conversationId,
        );
        if (tempConv) {
          tempConv.unreadCount = 0;
        }
      });

      useNotificationStore
        .getState()
        .markConversationNotificationsRead(conversationId)
        .catch(() => {});

      if (socketService.isConnected(SocketNamespaceEnum.CHAT)) {
        socketService.send(
          SocketNamespaceEnum.CHAT,
          SOCKET_EVENTS.CHAT.MARK_READ,
          {
            conversationId,
          },
        );
      }

      markAsReadApi({ conversationId })
        .then((res: any) => {
          const serverReadAt = res?.data?.lastReadAt || res?.lastReadAt;
          const parsed = parseSafeDate(serverReadAt)?.getTime();
          if (parsed) {
            locallyReadConversations.set(
              conversationId,
              Math.max(nowMs, parsed),
            );
          }
        })
        .catch(() => {});
    },

    setActiveConversation: (id) => {
      const { activeConversationId, isSocketConnected } = get();

      if (
        activeConversationId &&
        activeConversationId !== id &&
        isSocketConnected
      ) {
        socketService
          .emit(SocketNamespaceEnum.CHAT, SOCKET_EVENTS.CHAT.LEAVE_ROOM, {
            conversationId: activeConversationId,
          })
          .catch(console.warn);
      }

      set((state) => {
        state.activeConversationId = id;
        if (id) {
          const conv = state.conversations.find((c) => c.id === id);
          if (conv) conv.unreadCount = 0;
          const tempConv = state.tempConversations.find((c) => c.id === id);
          if (tempConv) tempConv.unreadCount = 0;
        }
      });

      if (!id) return;

      get().markConversationReadOptimistic(id);

      if (isSocketConnected) {
        socketService
          .emit(SocketNamespaceEnum.CHAT, SOCKET_EVENTS.CHAT.JOIN_ROOM, {
            conversationId: id,
          })
          .catch((err) => console.error("Join room failed:", err));
      }
    },

    setReplyingTo: (conversationId, message) => {
      set((state) => {
        state.replyingTo[conversationId] = message;
        if (message) {
          state.editingMessage[conversationId] = null;
        }
      });
    },

    setEditingMessage: (conversationId, message) => {
      set((state) => {
        state.editingMessage[conversationId] = message;
        if (message) {
          state.replyingTo[conversationId] = null;
        }
      });
    },

    setActiveCall: (call) => {
      set({ activeCall: call });
    },

    updateActiveCall: (patch) => {
      set((state) => {
        if (!state.activeCall) return;
        state.activeCall = {
          ...state.activeCall,
          ...patch,
        };
      });
    },

    initiateCall: async (conversationId, callType) => {
      const { activeCall } = get();
      if (activeCall) {
        toast.warning(tChatToast("alreadyInAnotherCall"));
        return;
      }

      try {
        const res = await socketService.emit<any>(
          SocketNamespaceEnum.CHAT,
          SOCKET_EVENTS.CALL.INITIATE,
          {
            conversationId,
            callType,
          },
        );

        if (
          !res?.isJoinedExisting &&
          res?.ringingUserIds?.length === 0 &&
          res?.busyUserIds?.length > 0
        ) {
          toast.info(tChatToast("recipientBusyInAnotherCall"));
          return;
        }

        set({
          activeCall: {
            callId: res.callId,
            conversationId,
            callType: res.callType || callType,
            isGroupCall: res.isGroupCall,
            initiatorId: res.initiatorId,
            status: res.isJoinedExisting
              ? CallStatusEnum.ONGOING
              : CallStatusEnum.RINGING,
            isIncoming: false,
            startedAt: res.createdAt,
            answeredAt: res.answeredAt,
            participants: res.participants || {},
            membersInfo: res.membersInfo || [],
            isMinimized: false,
          },
        });
      } catch (err: any) {
        toast.error(err?.message || tChatToast("initiateCallError"));
      }
    },

    setTypingUser: ({
      conversationId,
      userId,
      isTyping,
    }: ITypingPayload & { isTyping: boolean }) => {
      const timerKey = `${conversationId}:${userId}`;
      const existingTimer = typingTimers.get(timerKey);
      if (existingTimer) {
        clearTimeout(existingTimer);
        typingTimers.delete(timerKey);
      }

      set((state) => {
        const currentTyping = state.typingUsers[conversationId] || [];

        if (isTyping) {
          if (!currentTyping.includes(userId)) {
            state.typingUsers[conversationId] = [...currentTyping, userId];
          }
        } else {
          state.typingUsers[conversationId] = currentTyping.filter(
            (id) => id !== userId,
          );
        }
      });

      if (isTyping) {
        const timeout = setTimeout(() => {
          typingTimers.delete(timerKey);
          set((state) => {
            const users = state.typingUsers[conversationId] || [];
            state.typingUsers[conversationId] = users.filter(
              (id) => id !== userId,
            );
          });
        }, 4500);
        typingTimers.set(timerKey, timeout);
      }
    },

    handleIncomingMessage: (message: IMessage) => {
      const { activeConversationId } = get();
      const currentUser = useAuthStore.getState().currentAccount?.user;
      const isMe = message.senderId === currentUser?.id;
      const isTabVisible =
        typeof document === "undefined" ||
        document.visibilityState === "visible";
      const isViewing =
        activeConversationId === message.conversationId && isTabVisible;

      if (isViewing || isMe) {
        const msgTime =
          parseSafeDate(message.createdAt)?.getTime() || Date.now();
        locallyReadConversations.set(
          message.conversationId,
          Math.max(Date.now(), msgTime),
        );
      } else {
        locallyReadConversations.delete(message.conversationId);
      }

      let isNewMessageAdded = false;

      set((state) => {
        const convId = message.conversationId;
        if (!state.messages[convId]) state.messages[convId] = [];

        const msgs = state.messages[convId];

        const existingIndex = msgs.findIndex(
          (m) =>
            (m.tempId && m.tempId === message.tempId) || m.id === message.id,
        );

        let initialStatus: MessageStatus = message.status || "sent";
        if (!isMe && isViewing && initialStatus !== "removed") {
          initialStatus = "read";
        }

        const newMessage = { ...message, status: initialStatus };

        if (existingIndex !== -1) {
          msgs[existingIndex] = newMessage;
        } else {
          msgs.push(newMessage);
          isNewMessageAdded = true;
        }

        const convIndex = state.conversations.findIndex((c) => c.id === convId);
        const msgMeta = (message.metadata || {}) as Record<string, any>;
        const incomingCustomerAvatar =
          (!isMe &&
            (message.sender?.avatar || msgMeta.externalCustomerAvatar)) ||
          null;
        const incomingCustomerName =
          (!isMe && (message.sender?.name || msgMeta.externalCustomerName)) ||
          null;

        if (convIndex !== -1) {
          const updatedConv = { ...state.conversations[convIndex] };
          updatedConv.lastMessage =
            message.type === MessageTypeEnum.TEXT ||
            message.type === MessageTypeEnum.CALL ||
            message.type === MessageTypeEnum.POLL
              ? message.content
              : `[${message.type}] ${message.content || ""}`.trim();
          updatedConv.lastMessageAt = message.createdAt;
          updatedConv.lastMessageType = message.type;
          updatedConv.lastMessageSenderId = message.senderId;
          updatedConv.lastMessageStatus = initialStatus;
          updatedConv.lastMessageExpiresAt =
            message.expiresAt || message.metadata?.expiresAt || null;

          if (incomingCustomerAvatar && !updatedConv.avatar) {
            updatedConv.avatar = incomingCustomerAvatar;
          }
          if (
            incomingCustomerName &&
            (!updatedConv.name || updatedConv.name.includes("#"))
          ) {
            updatedConv.name = incomingCustomerName;
          }
          if (msgMeta.interactionType) {
            updatedConv.interactionType = msgMeta.interactionType;
          }
          if (msgMeta.sourcePostId && !updatedConv.sourcePostId) {
            updatedConv.sourcePostId = msgMeta.sourcePostId;
          }
          if (msgMeta.pageShortCode && !updatedConv.pageShortCode) {
            updatedConv.pageShortCode = msgMeta.pageShortCode;
          }

          const currentUnread = Number(updatedConv.unreadCount || 0);

          if (isViewing || isMe) {
            updatedConv.unreadCount = 0;
          } else if (isNewMessageAdded) {
            updatedConv.unreadCount = currentUnread + 1;
          }

          state.conversations.splice(convIndex, 1);
          state.conversations.unshift(updatedConv);
        } else {
          // Chèn lạc quan (Optimistic Unshift 0ms) ngay khi có hội thoại bình luận bài viết hoặc tin nhắn mới
          const optimisticConv: IConversation = {
            id: convId,
            type: ConversationTypeEnum.DIRECT,
            name:
              incomingCustomerName || message.sender?.name || "Khách hàng mới",
            avatar: incomingCustomerAvatar || message.sender?.avatar || null,
            lastMessage: message.content,
            lastMessageAt: message.createdAt,
            lastMessageType: message.type,
            lastMessageSenderId: message.senderId,
            lastMessageStatus: initialStatus,
            unreadCount: isViewing || isMe ? 0 : 1,
            shopId: message.shopId || null,
            channelType: msgMeta.channelType || undefined,
            interactionType: msgMeta.interactionType || "INBOX",
            sourcePostId:
              msgMeta.sourcePostId || msgMeta.externalPostId || null,
            sourceAdId: msgMeta.sourceAdId || null,
            pageShortCode: msgMeta.pageShortCode || undefined,
            pageName: msgMeta.pageName || undefined,
            supportStatus: isMe
              ? "WAITING_CUSTOMER_REPLY"
              : "WAITING_AGENT_REPLY",
          };
          state.conversations.unshift(optimisticConv);
          setTimeout(() => {
            get().fetchInbox({ page: 1 });
          }, 50);
        }
      });

      if (isViewing && !isMe) {
        socketService.send(
          SocketNamespaceEnum.CHAT,
          SOCKET_EVENTS.CHAT.MARK_READ,
          {
            conversationId: message.conversationId,
          },
        );
        markAsReadApi({ conversationId: message.conversationId }).catch(
          () => {},
        );
      }
    },

    handleMessageEdited: (message: IMessage) => {
      set((state) => {
        const msgs = state.messages[message.conversationId];
        if (msgs) {
          const idx = msgs.findIndex((m) => m.id === message.id);
          if (idx !== -1) {
            msgs[idx] = {
              ...msgs[idx],
              content: message.content,
              metadata: {
                ...(msgs[idx].metadata || {}),
                ...(message.metadata || {}),
                isEdited: true,
              },
            };
          }
        }

        const conv = state.conversations.find(
          (c) => c.id === message.conversationId,
        );
        if (conv && msgs && msgs[msgs.length - 1]?.id === message.id) {
          conv.lastMessage = message.content;
        }
      });
    },

    handleMessageRecalled: ({ conversationId, messageId }) => {
      const recalledText = tChatToast("recalledPlaceholder");
      set((state) => {
        const msgs = state.messages[conversationId];
        if (msgs) {
          const idx = msgs.findIndex((m) => m.id === messageId);
          if (idx !== -1) {
            msgs[idx].content = recalledText;
            msgs[idx].status = "removed";
            msgs[idx].isPinned = false;
            msgs[idx].metadata = {
              ...(msgs[idx].metadata || {}),
              isPinned: false,
              attachments: [],
            };
          }
        }

        const conv = state.conversations.find((c) => c.id === conversationId);
        if (conv && msgs && msgs[msgs.length - 1]?.id === messageId) {
          conv.lastMessage = recalledText;
        }
      });
    },

    handleMessageReaction: ({ conversationId, messageId, reactions }) => {
      set((state) => {
        const msgs = state.messages[conversationId];
        if (!msgs) return;
        const msg = msgs.find((m) => m.id === messageId);
        if (msg) {
          msg.metadata = {
            ...(msg.metadata || {}),
            reactions,
          };
        }
      });
    },

    handleMessagePinned: ({
      conversationId,
      messageId,
      isPinned,
      pinnedBy,
    }) => {
      set((state) => {
        const msgs = state.messages[conversationId];
        if (msgs) {
          const msg = msgs.find((m) => m.id === messageId);
          if (msg) {
            msg.isPinned = isPinned;
            msg.metadata = {
              ...(msg.metadata || {}),
              isPinned,
              pinnedBy: isPinned ? pinnedBy : undefined,
            };
          }
        }
      });
      get().fetchPinnedMessages(conversationId);
    },

    handleGroupUpdated: (payload) => {
      const currentUserId = useAuthStore.getState().currentAccount?.user?.id;
      if (
        payload.action === "member_removed" &&
        payload.removedUserId === currentUserId
      ) {
        set((state) => {
          state.conversations = state.conversations.filter(
            (c) => c.id !== payload.conversationId,
          );
          if (state.activeConversationId === payload.conversationId) {
            state.activeConversationId = null;
          }
        });
        toast.info(tChatToast("removedFromGroupInfo"));
      } else {
        get().fetchInbox({ page: 1 });
        get().fetchConversationDetails(payload.conversationId);
      }
    },

    updateGroupMemberRole: async ({ conversationId, memberId, role }) => {
      try {
        await updateGroupMemberRoleApi({ conversationId, memberId, role });
        await get().fetchConversationDetails(conversationId);
        toast.success("Đã cập nhật phân quyền thành viên");
        return true;
      } catch (err: any) {
        toast.error(
          err?.response?.data?.message ||
            "Không thể cập nhật phân quyền thành viên",
        );
        return false;
      }
    },

    forwardMessage: async ({
      messageId,
      sourceConversationId,
      targetConversationIds,
    }) => {
      try {
        await forwardMessageApi({
          messageId,
          sourceConversationId,
          targetConversationIds,
        });
        toast.success("Đã chuyển tiếp tin nhắn");
        return true;
      } catch (err: any) {
        toast.error(
          err?.response?.data?.message || "Không thể chuyển tiếp tin nhắn",
        );
        return false;
      }
    },

    updateMessageStatus: ({ conversationId, id, status, userId }) => {
      set((state) => {
        const msgs = state.messages[conversationId];
        if (!msgs) return;

        const msg = msgs.find((m) => m.id === id);
        if (msg && msg.status !== "removed") {
          const priority: Record<MessageStatus, number> = {
            sending: 0,
            failed: 0,
            sent: 1,
            delivered: 2,
            read: 3,
            removed: 4,
          };
          const currentP = priority[msg.status as MessageStatus] || 0;
          const newP = priority[status] || 0;

          if (newP > currentP) {
            msg.status = status;
          }

          if (status === "delivered" && userId) {
            if (!msg.deliveredTo) msg.deliveredTo = [];

            const alreadyExists = msg.deliveredTo.some(
              (u: any) => (typeof u === "string" ? u : u.id) === userId,
            );

            if (!alreadyExists) {
              msg.deliveredTo.push(userId);
            }
          }
        }
      });
    },

    handleReadMessage: ({ conversationId, userId, lastReadAt, user }) => {
      const currentUser = useAuthStore.getState().currentAccount?.user;
      const readAtDate = parseSafeDate(lastReadAt);

      if (userId === currentUser?.id) {
        locallyReadConversations.set(
          conversationId,
          Math.max(Date.now(), readAtDate?.getTime() || 0),
        );
      }

      set((state) => {
        if (userId === currentUser?.id) {
          const conv = state.conversations.find((c) => c.id === conversationId);
          if (conv) conv.unreadCount = 0;
          const tempConv = state.tempConversations.find(
            (c) => c.id === conversationId,
          );
          if (tempConv) tempConv.unreadCount = 0;
        }

        const msgs = state.messages[conversationId];
        if (!msgs) return;

        state.messages[conversationId] = msgs.map((msg) => {
          const isMyMessage = msg.senderId === currentUser?.id;

          if (
            isMyMessage &&
            msg.status !== "read" &&
            msg.status !== "removed"
          ) {
            const msgDate = parseSafeDate(msg.createdAt);
            if (!readAtDate || !msgDate || msgDate <= readAtDate) {
              const newMsg = { ...msg, status: "read" as MessageStatus };

              if (!newMsg.readBy) newMsg.readBy = [];
              if (!newMsg.readBy.includes(userId)) {
                newMsg.readBy.push(userId);
              }

              if (user) {
                if (!newMsg.readByUsers) newMsg.readByUsers = [];
                const exists = newMsg.readByUsers.some((u) => u.id === userId);
                if (!exists) {
                  newMsg.readByUsers.push(user);
                }
              }

              return newMsg;
            }
          }
          return msg;
        });
      });
    },

    updateMessageStatusBatch: ({ conversationId, messageIds, status }) => {
      set((state) => {
        const msgs = state.messages[conversationId];
        if (!msgs) return;

        const targetIds = new Set(messageIds);

        state.messages[conversationId] = msgs.map((msg) => {
          if (targetIds.has(msg.id) && msg.status !== "removed") {
            const priority: Record<MessageStatus, number> = {
              sending: 0,
              sent: 1,
              delivered: 2,
              read: 3,
              failed: 0,
              removed: 4,
            };
            const currentP = priority[msg.status as MessageStatus] || 0;
            const newP = priority[status] || 0;

            if (newP > currentP) {
              return { ...msg, status };
            }
          }
          return msg;
        });
      });
    },

    fetchInbox: async (payload, cb) => {
      const { page = 1, limit, search } = payload;
      if (search) {
        set({ isLoadingSearch: true });
      } else {
        set({ isLoadingInbox: true });
      }

      try {
        const res = await getInbox({
          params: { page, limit: limit || DEFAULT_LIMIT_INBOX, search },
        });

        const activeId = get().activeConversationId;

        const normalizedList = (res.data.data || []).map(
          (item: IConversation) => {
            const localReadTimestamp = locallyReadConversations.get(item.id);
            const lastMsgTimestamp =
              parseSafeDate(item.lastMessageAt)?.getTime() || 0;

            const wasAlreadyReadLocally =
              Boolean(localReadTimestamp) &&
              (lastMsgTimestamp === 0 ||
                lastMsgTimestamp <= localReadTimestamp! + 2000);

            const effectiveUnread =
              item.id === activeId || wasAlreadyReadLocally
                ? 0
                : Math.max(0, Number(item.unreadCount || 0));

            return {
              ...item,
              unreadCount: effectiveUnread,
            };
          },
        );

        if (search) {
          const currentUserId =
            useAuthStore.getState().currentAccount?.user?.id;
          set((state) => {
            const filteredServerList = normalizedList.filter(
              (item: IConversation) =>
                matchConversationBySearchRule(
                  item,
                  search,
                  state.conversationDetails[item.id],
                  currentUserId,
                ),
            );

            const localMatches = state.conversations.filter((conv) =>
              matchConversationBySearchRule(
                conv,
                search,
                state.conversationDetails[conv.id],
                currentUserId,
              ),
            );

            const mergedMap = new Map<string, IConversation>();
            for (const item of filteredServerList) {
              mergedMap.set(item.id, item);
            }
            for (const localConv of localMatches) {
              if (!mergedMap.has(localConv.id)) {
                mergedMap.set(localConv.id, localConv);
              } else {
                mergedMap.set(localConv.id, {
                  ...localConv,
                  ...mergedMap.get(localConv.id)!,
                });
              }
            }
            const mergedList = Array.from(mergedMap.values());

            if (page === 1) {
              state.tempConversations = mergedList;
            } else {
              const newConvs = mergedList.filter(
                (newC: { id: string }) =>
                  !state.tempConversations.some((curr) => curr.id === newC.id),
              );
              state.tempConversations = [
                ...state.tempConversations,
                ...newConvs,
              ];
            }
          });
        } else {
          set((state) => {
            if (page === 1) {
              state.conversations = normalizedList;
            } else {
              const newConvs = normalizedList.filter(
                (newC: { id: string }) =>
                  !state.conversations.some((curr) => curr.id === newC.id),
              );
              state.conversations = [...state.conversations, ...newConvs];
            }
            state.inboxMeta = res.data.meta;
          });
        }

        if (socketService.isConnected(SocketNamespaceEnum.CHAT)) {
          socketService
            .emit(
              SocketNamespaceEnum.CHAT,
              SOCKET_EVENTS.CHAT.ACK_PENDING_MESSAGES,
              {},
            )
            .catch(() => {});
        }
        cb?.onSuccess?.();
      } catch (error: any) {
        const message =
          error.response?.data?.message || "Lỗi tải danh sách chat";
        cb?.onError?.(message);
      } finally {
        set({ isLoadingInbox: false });
        set({ isLoadingSearch: false });
      }
    },

    fetchMessages: async (conversationId, page = 1, cb) => {
      if (!conversationId) return;
      const lockKey = `${conversationId}:${page}`;
      if (loadingMessagesByConv.has(lockKey)) return;

      const state = get();
      const currentMeta = state.messagesMeta[conversationId];
      if (page > 1 && currentMeta && page > currentMeta.totalPages) return;

      loadingMessagesByConv.add(lockKey);
      set({ isLoadingMessages: true });

      try {
        const res = await getMessages({
          conversationId,
          params: { page, limit: DEFAULT_LIMIT_MESSAGE },
        });

        const orderedMessages = [...(res?.data?.data || [])].reverse();

        set((state) => {
          const currentMessages = state.messages[conversationId] || [];

          if (page === 1) {
            state.messages[conversationId] = mergeAndSortMessages(
              currentMessages,
              orderedMessages,
            );
          } else {
            state.messages[conversationId] = mergeAndSortMessages(
              orderedMessages,
              currentMessages,
            );
          }
          if (res?.data?.meta) {
            state.messagesMeta[conversationId] = res.data.meta;
          }
        });

        const currentUser = useAuthStore.getState().currentAccount?.user;

        orderedMessages.forEach((msg: IMessage) => {
          const isMe = msg.senderId === currentUser?.id;

          const isDelivered = msg.deliveredTo?.some(
            (u: any) => (typeof u === "string" ? u : u.id) === currentUser?.id,
          );

          if (!isMe && !isDelivered) {
            socketService.send(
              SocketNamespaceEnum.CHAT,
              SOCKET_EVENTS.CHAT.MESSAGE_RECEIVED,
              { conversationId: msg.conversationId, messageId: msg.id },
            );
          }
        });

        cb?.onSuccess?.();
      } catch (error: any) {
        const message = error.response?.data?.message || "Lỗi tải tin nhắn";
        cb?.onError?.(message);
      } finally {
        loadingMessagesByConv.delete(lockKey);
        if (loadingMessagesByConv.size === 0) {
          set({ isLoadingMessages: false });
        }
      }
    },

    createDirectChat: async (payload, cb) => {
      try {
        const res = (await createDirectChat(payload)) as any;
        const conversation = res?.data ?? res;

        if (!conversation?.id) return null;

        set((state) => {
          state.activeConversationId = conversation.id;
          if (!state.conversations.find((c) => c.id === conversation.id)) {
            state.conversations.unshift(conversation);
          }
        });

        if (socketService.isConnected(SocketNamespaceEnum.CHAT)) {
          socketService
            .emit(SocketNamespaceEnum.CHAT, SOCKET_EVENTS.CHAT.JOIN_ROOM, {
              conversationId: conversation.id,
            })
            .catch(() => {});
        }

        cb?.onSuccess?.();
        return conversation.id;
      } catch (error: any) {
        const message = error.response?.data?.message || "Lỗi tạo chat";
        cb?.onError?.(message);
        return null;
      }
    },

    createGroupChat: async (payload, cb) => {
      try {
        const res = (await createGroup(payload)) as any;
        const rawGroup = res?.data ?? res;
        if (!rawGroup?.id) return null;

        const newGroupConv: IConversation = {
          id: rawGroup.id,
          name: rawGroup.name || payload.name,
          avatar: rawGroup.avatar || null,
          type: ConversationTypeEnum.GROUP,
          lastMessage: "Nhóm mới được tạo",
          lastMessageAt: rawGroup.lastMessageAt || new Date().toISOString(),
          unreadCount: 0,
          isAdmin: true,
          isMuted: false,
        };

        set((state) => {
          state.activeConversationId = newGroupConv.id;
          const exists = state.conversations.some(
            (c) => c.id === newGroupConv.id,
          );
          if (!exists) {
            state.conversations.unshift(newGroupConv);
          }
        });

        if (socketService.isConnected(SocketNamespaceEnum.CHAT)) {
          socketService
            .emit(SocketNamespaceEnum.CHAT, SOCKET_EVENTS.CHAT.JOIN_ROOM, {
              conversationId: newGroupConv.id,
            })
            .catch(() => {});
        }

        toast.success(`Đã tạo nhóm "${newGroupConv.name}"`);
        cb?.onSuccess?.(newGroupConv);
        return newGroupConv.id;
      } catch (error: any) {
        const message =
          error.response?.data?.message || "Không thể tạo nhóm trò chuyện";
        toast.error(message);
        cb?.onError?.(message);
        return null;
      }
    },

    addGroupMembers: async (payload, cb) => {
      try {
        await addGroupMembersApi(payload);
        toast.success("Đã thêm thành viên vào nhóm");
        cb?.onSuccess?.();
        return true;
      } catch (error: any) {
        const message =
          error.response?.data?.message || "Không thể thêm thành viên vào nhóm";
        toast.error(message);
        cb?.onError?.(message);
        return false;
      }
    },

    removeGroupMember: async (payload, cb) => {
      try {
        await removeGroupMemberApi(payload);
        const currentUserId = useAuthStore.getState().currentAccount?.user?.id;
        if (payload.memberId === currentUserId) {
          set((state) => {
            state.conversations = state.conversations.filter(
              (c) => c.id !== payload.conversationId,
            );
            if (state.activeConversationId === payload.conversationId) {
              state.activeConversationId = null;
            }
          });
          toast.success("Đã rời khỏi nhóm trò chuyện");
        } else {
          toast.success("Đã xóa thành viên khỏi nhóm");
        }
        cb?.onSuccess?.();
        return true;
      } catch (error: any) {
        const message =
          error.response?.data?.message ||
          "Không thể thực hiện thao tác với thành viên nhóm";
        toast.error(message);
        cb?.onError?.(message);
        return false;
      }
    },

    sendMessage: async (payload) => {
      const tempId = uuidv4();
      const currentUser = useAuthStore.getState().currentAccount?.user;
      const replyTarget = get().replyingTo[payload.conversationId];
      const finalReplyId = payload.replyToMessageId || replyTarget?.id;

      const optimisticMsg: IMessage = {
        id: tempId,
        tempId,
        content: payload.content,
        type: payload.type || MessageTypeEnum.TEXT,
        senderId: currentUser?.id || "",
        conversationId: payload.conversationId,
        createdAt: new Date().toISOString(),
        status: "sending",
        sender: currentUser,
        replyToMessageId: finalReplyId || null,
        metadata: {
          ...(payload.metadata || {}),
          ...(replyTarget
            ? {
                replyToMessageId: replyTarget.id,
                replyPreview: {
                  messageId: replyTarget.id,
                  senderId: replyTarget.senderId,
                  senderName: replyTarget.sender?.name || "Người dùng",
                  content: replyTarget.content,
                  type: replyTarget.type,
                },
              }
            : {}),
        },
      };

      set((state) => {
        if (!state.messages[payload.conversationId]) {
          state.messages[payload.conversationId] = [];
        }
        state.messages[payload.conversationId].push(optimisticMsg);
        state.replyingTo[payload.conversationId] = null;
      });

      const requestPayload = {
        ...payload,
        replyToMessageId: finalReplyId,
        tempId,
      };

      try {
        let serverMsg: IMessage | undefined;
        if (socketService.isConnected(SocketNamespaceEnum.CHAT)) {
          const ack = await socketService.emit<IMessage>(
            SocketNamespaceEnum.CHAT,
            SOCKET_EVENTS.CHAT.SEND_MESSAGE,
            requestPayload,
          );
          if (ack && typeof ack === "object" && "id" in ack) {
            serverMsg = ack;
          }
        } else {
          const res: any = await sendMessageHttpFallbackApi(requestPayload);
          serverMsg = res?.data ?? res;
        }

        set((state) => {
          const msgs = state.messages[payload.conversationId];
          const msgIndex = msgs?.findIndex(
            (m) => m.id === tempId || m.tempId === tempId,
          );
          if (msgs && msgIndex !== undefined && msgIndex !== -1) {
            if (serverMsg?.id) {
              msgs[msgIndex] = {
                ...msgs[msgIndex],
                ...serverMsg,
                tempId,
                status:
                  msgs[msgIndex].status === "read" ||
                  msgs[msgIndex].status === "delivered"
                    ? msgs[msgIndex].status
                    : "sent",
              };
            } else if (msgs[msgIndex].status === "sending") {
              msgs[msgIndex].status = "sent";
            }
          }
        });
      } catch {
        try {
          const res: any = await sendMessageHttpFallbackApi(requestPayload);
          const serverMsg: IMessage | undefined = res?.data ?? res;
          set((state) => {
            const msgs = state.messages[payload.conversationId];
            const msgIndex = msgs?.findIndex(
              (m) => m.id === tempId || m.tempId === tempId,
            );
            if (msgs && msgIndex !== undefined && msgIndex !== -1) {
              if (serverMsg?.id) {
                msgs[msgIndex] = {
                  ...msgs[msgIndex],
                  ...serverMsg,
                  tempId,
                  status: "sent",
                };
              } else {
                msgs[msgIndex].status = "sent";
              }
            }
          });
        } catch {
          set((state) => {
            const msgs = state.messages[payload.conversationId];
            const msgIndex = msgs?.findIndex(
              (m) => m.id === tempId || m.tempId === tempId,
            );
            if (msgs && msgIndex !== undefined && msgIndex !== -1) {
              msgs[msgIndex].status = "failed";
            }
          });
        }
      }
    },

    sendAttachmentMessage: async ({
      conversationId,
      files,
      content,
      replyToMessageId,
    }) => {
      if (!files.length) return;
      const tempId = uuidv4();
      const currentUser = useAuthStore.getState().currentAccount?.user;
      const replyTarget = get().replyingTo[conversationId];
      const finalReplyId = replyToMessageId || replyTarget?.id;

      const firstMime = files[0]?.type || "";
      let detectedType = MessageTypeEnum.FILE;
      if (firstMime.startsWith("image/")) detectedType = MessageTypeEnum.IMAGE;
      else if (firstMime.startsWith("video/"))
        detectedType = MessageTypeEnum.VIDEO;
      else if (firstMime.startsWith("audio/"))
        detectedType = MessageTypeEnum.AUDIO;

      const objectUrls: string[] = [];
      const previewAttachments = files.map((file, idx) => {
        const blobUrl = URL.createObjectURL(file);
        objectUrls.push(blobUrl);
        return {
          fileId: `local-${tempId}-${idx}`,
          url: blobUrl,
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
        };
      });

      const cleanupBlobUrls = () => {
        objectUrls.forEach((url) => URL.revokeObjectURL(url));
      };

      const optimisticMsg: IMessage = {
        id: tempId,
        tempId,
        content: content || files.map((f) => f.name).join(", "),
        type: detectedType,
        senderId: currentUser?.id || "",
        conversationId,
        createdAt: new Date().toISOString(),
        status: "sending",
        sender: currentUser,
        replyToMessageId: finalReplyId || null,
        metadata: {
          attachments: previewAttachments,
          ...(replyTarget
            ? {
                replyToMessageId: replyTarget.id,
                replyPreview: {
                  messageId: replyTarget.id,
                  senderId: replyTarget.senderId,
                  senderName: replyTarget.sender?.name || "Người dùng",
                  content: replyTarget.content,
                  type: replyTarget.type,
                },
              }
            : {}),
        },
      };

      set((state) => {
        if (!state.messages[conversationId]) {
          state.messages[conversationId] = [];
        }
        state.messages[conversationId].push(optimisticMsg);
        state.replyingTo[conversationId] = null;
        state.uploadProgress[tempId] = 1;
      });

      try {
        const res: any = await uploadChatAttachmentsApi({
          conversationId,
          files,
          content,
          replyToMessageId: finalReplyId,
          tempId,
          onProgress: (percent) => {
            set((state) => {
              state.uploadProgress[tempId] = percent;
            });
          },
        });

        const serverMsg: IMessage | undefined = res?.data ?? res;

        set((state) => {
          delete state.uploadProgress[tempId];
          const msgs = state.messages[conversationId];
          const msgIndex = msgs?.findIndex(
            (m) => m.id === tempId || m.tempId === tempId,
          );
          if (msgs && msgIndex !== undefined && msgIndex !== -1) {
            if (serverMsg?.id) {
              msgs[msgIndex] = {
                ...msgs[msgIndex],
                ...serverMsg,
                tempId,
                status: "sent",
              };
            } else if (msgs[msgIndex].status === "sending") {
              msgs[msgIndex].status = "sent";
            }
          }
        });
        setTimeout(cleanupBlobUrls, 3000);
      } catch (err: any) {
        cleanupBlobUrls();
        set((state) => {
          delete state.uploadProgress[tempId];
          const msgs = state.messages[conversationId];
          const msgIndex = msgs?.findIndex(
            (m) => m.id === tempId || m.tempId === tempId,
          );
          if (msgs && msgIndex !== undefined && msgIndex !== -1) {
            msgs[msgIndex].status = "failed";
          }
        });
        toast.error(
          err?.response?.data?.message || "Tải tệp đính kèm thất bại",
        );
      }
    },

    editMessage: async ({ conversationId, messageId, content }) => {
      set((state) => {
        state.editingMessage[conversationId] = null;
      });

      try {
        if (socketService.isConnected(SocketNamespaceEnum.CHAT)) {
          await socketService.emit(
            SocketNamespaceEnum.CHAT,
            SOCKET_EVENTS.CHAT.EDIT_MESSAGE,
            { conversationId, messageId, content },
          );
        } else {
          await editMessageApi({ conversationId, messageId, content });
        }
      } catch {
        toast.error("Không thể chỉnh sửa tin nhắn");
      }
    },

    recallMessage: async ({ conversationId, messageId }) => {
      try {
        if (socketService.isConnected(SocketNamespaceEnum.CHAT)) {
          await socketService.emit(
            SocketNamespaceEnum.CHAT,
            SOCKET_EVENTS.CHAT.RECALL_MESSAGE,
            { conversationId, messageId },
          );
        } else {
          await recallMessageApi({ conversationId, messageId });
        }
      } catch {
        toast.error("Không thể thu hồi tin nhắn");
      }
    },

    reactMessage: async ({ conversationId, messageId, emoji }) => {
      try {
        if (socketService.isConnected(SocketNamespaceEnum.CHAT)) {
          await socketService.emit(
            SocketNamespaceEnum.CHAT,
            SOCKET_EVENTS.CHAT.REACT_MESSAGE,
            { conversationId, messageId, emoji },
          );
        } else {
          await reactMessageApi({ conversationId, messageId, emoji });
        }
      } catch {
        toast.error("Không thể thả biểu tượng cảm xúc");
      }
    },

    pinMessage: async ({ conversationId, messageId, isPinned }) => {
      try {
        if (socketService.isConnected(SocketNamespaceEnum.CHAT)) {
          await socketService.emit(
            SocketNamespaceEnum.CHAT,
            SOCKET_EVENTS.CHAT.PIN_MESSAGE,
            { conversationId, messageId, isPinned },
          );
        } else {
          await pinMessageApi({ conversationId, messageId, isPinned });
        }
        toast.success(isPinned ? "Đã ghim tin nhắn" : "Đã bỏ ghim tin nhắn");
      } catch {
        toast.error("Thao tác ghim tin nhắn thất bại");
      }
    },

    toggleMuteConversation: async (conversationId, isMuted) => {
      try {
        await muteConversationApi({ conversationId, isMuted });
        set((state) => {
          const conv = state.conversations.find((c) => c.id === conversationId);
          if (conv) conv.isMuted = isMuted;
        });
        toast.success(
          isMuted
            ? "Đã tắt thông báo cuộc trò chuyện"
            : "Đã bật thông báo cuộc trò chuyện",
        );
      } catch {
        toast.error("Không thể cập nhật cài đặt thông báo");
      }
    },

    resendMessage: async (tempId, payload) => {
      set((state) => {
        const msgs = state.messages[payload.conversationId];
        const msg = msgs?.find((m) => m.id === tempId);
        if (msg) msg.status = "sending";
      });

      try {
        await socketService.emit(
          SocketNamespaceEnum.CHAT,
          SOCKET_EVENTS.CHAT.SEND_MESSAGE,
          { ...payload, tempId },
        );
        set((state) => {
          const msgs = state.messages[payload.conversationId];
          const msg = msgs?.find((m) => m.id === tempId);
          if (msg) msg.status = "sent";
        });
      } catch {
        set((state) => {
          const msgs = state.messages[payload.conversationId];
          const msg = msgs?.find((m) => m.id === tempId);
          if (msg) msg.status = "failed";
        });
      }
    },

    removeFailedMessage: (tempId, conversationId) => {
      set((state) => {
        state.messages[conversationId] = (
          state.messages[conversationId] || []
        ).filter((m) => m.id !== tempId);
      });
    },

    setUserStatus: ({ userId, isOnline }) => {
      set((state) => {
        state.conversations = state.conversations.map((conv) => {
          if (conv.partnerId === userId) {
            return { ...conv, isOnline };
          }
          return conv;
        });
      });
    },

    fetchConversationDetails: async (conversationId) => {
      if (!conversationId) return;
      try {
        const res: any = await getConversationDetailsApi(conversationId);
        const data = res?.data ?? res;
        if (data?.conversationId) {
          const currentUserId =
            useAuthStore.getState().currentAccount?.user?.id;
          set((state) => {
            state.conversationDetails[conversationId] = data;
            const conv = state.conversations.find(
              (c) => c.id === conversationId,
            );
            if (conv) {
              if (data.mySettings) {
                conv.isMuted = data.mySettings.isMuted;
                conv.soundEnabled = data.mySettings.soundEnabled;
                conv.readReceiptsEnabled = data.mySettings.readReceiptsEnabled;
                conv.isRestricted = data.mySettings.isRestricted;
                conv.disappearingTtl = data.disappearingTtl;
              }
              if (
                conv.type === ConversationTypeEnum.DIRECT &&
                Array.isArray(data.members)
              ) {
                const partnerMember = data.members.find(
                  (m: any) => m.userId !== currentUserId,
                );
                if (partnerMember) {
                  conv.originalName = partnerMember.name;
                  conv.partnerNickname = partnerMember.nickname || null;
                  conv.partnerEmail =
                    partnerMember.email || conv.partnerEmail || null;
                  conv.name = partnerMember.nickname || partnerMember.name;
                }
                if (data.blockState) {
                  conv.isBlocked = data.blockState.isBlocked;
                  conv.blockedByMe = data.blockState.blockedByMe;
                  conv.blockedByPartner = data.blockState.blockedByPartner;
                  if (data.blockState.isBlocked) {
                    conv.isOnline = false;
                  }
                }
              }
            }
          });
        }
      } catch {
        // Ignore
      }
    },

    fetchPinnedMessages: async (conversationId) => {
      if (!conversationId) return;
      try {
        const res: any = await getPinnedMessagesApi(conversationId);
        const list = res?.data ?? res;
        if (Array.isArray(list)) {
          set((state) => {
            state.pinnedMessagesByConv[conversationId] = list;
          });
        }
      } catch {
        // Ignore
      }
    },

    fetchSharedAssets: async (conversationId) => {
      if (!conversationId) return;
      try {
        const res: any = await getSharedAssetsApi(conversationId, "MEDIA");
        const data = res?.data ?? res;
        if (data) {
          set((state) => {
            state.sharedAssets[conversationId] = {
              media: data.media || [],
              files: data.files || [],
              links: data.links || [],
            };
          });
        }
      } catch {
        // Ignore
      }
    },

    updateNickname: async ({ conversationId, targetUserId, nickname }) => {
      try {
        const res: any = await updateParticipantNicknameApi({
          conversationId,
          targetUserId,
          nickname,
        });
        const data = res?.data ?? res;
        get().handleNicknameUpdated({
          conversationId,
          targetUserId,
          nickname,
          originalName: data?.originalName,
          displayName: data?.displayName,
        });
        toast.success("Đã cập nhật biệt danh");
        return true;
      } catch (err: any) {
        toast.error(
          err?.response?.data?.message || "Không thể cập nhật biệt danh",
        );
        return false;
      }
    },

    handleNicknameUpdated: ({
      conversationId,
      targetUserId,
      nickname,
      originalName,
      displayName,
    }) => {
      const currentUserId = useAuthStore.getState().currentAccount?.user?.id;
      set((state) => {
        let fallbackOriginalName = originalName || null;
        const details = state.conversationDetails[conversationId];
        if (details?.members) {
          const member = details.members.find((m) => m.userId === targetUserId);
          if (member) {
            member.nickname = nickname;
            fallbackOriginalName = fallbackOriginalName || member.name;
          }
          if (
            details.type === ConversationTypeEnum.DIRECT &&
            targetUserId !== currentUserId
          ) {
            details.name =
              nickname || displayName || fallbackOriginalName || details.name;
          }
        }

        const updateDirectConvName = (conv?: IConversation) => {
          if (!conv || conv.type !== ConversationTypeEnum.DIRECT) return;
          const isPartnerTarget =
            conv.partnerId === targetUserId ||
            (!conv.isSavedMessages && targetUserId !== currentUserId);
          if (isPartnerTarget) {
            const resolvedOriginal =
              fallbackOriginalName || conv.originalName || conv.name;
            conv.originalName = resolvedOriginal;
            conv.partnerNickname = nickname;
            conv.name = nickname || displayName || resolvedOriginal;
          }
        };

        const conv = state.conversations.find((c) => c.id === conversationId);
        updateDirectConvName(conv);

        const tempConv = state.tempConversations.find(
          (c) => c.id === conversationId,
        );
        updateDirectConvName(tempConv);

        const msgs = state.messages[conversationId];
        if (msgs) {
          msgs.forEach((m) => {
            if (m.senderId === targetUserId && m.sender) {
              const orig =
                (m.sender as any).originalName ||
                fallbackOriginalName ||
                m.sender.name;
              (m.sender as any).originalName = orig;
              m.sender.name = nickname || displayName || orig;
            }
          });
        }
      });
    },

    updateConversationSettings: async (payload) => {
      const { conversationId, ...patch } = payload;
      try {
        const res: any = await updateConversationSettingsApi(payload);
        const updated = res?.data ?? patch;
        set((state) => {
          const conv = state.conversations.find((c) => c.id === conversationId);
          if (conv) {
            Object.assign(conv, updated);
          }
          const details = state.conversationDetails[conversationId];
          if (details?.mySettings) {
            Object.assign(details.mySettings, updated);
          }
        });

        if (
          (payload.readReceiptsEnabled === true ||
            payload.isRestricted === false) &&
          get().activeConversationId === conversationId
        ) {
          get().markConversationReadOptimistic(conversationId);
        }

        toast.success("Đã cập nhật cài đặt cuộc trò chuyện");
      } catch {
        toast.error("Không thể cập nhật cài đặt");
      }
    },

    updateDisappearingMessages: async (conversationId, disappearingTtl) => {
      try {
        await updateDisappearingMessagesApi({
          conversationId,
          disappearingTtl,
        });
        get().handleConversationSettingsUpdated({
          conversationId,
          disappearingTtl,
        });
        toast.success(
          disappearingTtl
            ? "Đã bật chế độ tin nhắn tự huỷ"
            : "Đã tắt chế độ tin nhắn tự huỷ",
        );
      } catch (err: any) {
        toast.error(
          err?.response?.data?.message ||
            "Không thể thay đổi cài đặt tin nhắn tự huỷ",
        );
      }
    },

    handleConversationSettingsUpdated: ({
      conversationId,
      disappearingTtl,
    }) => {
      set((state) => {
        const conv = state.conversations.find((c) => c.id === conversationId);
        if (conv && disappearingTtl !== undefined) {
          conv.disappearingTtl = disappearingTtl;
        }
        const details = state.conversationDetails[conversationId];
        if (details && disappearingTtl !== undefined) {
          details.disappearingTtl = disappearingTtl;
        }
      });
    },

    deleteConversation: async (conversationId) => {
      try {
        await deleteConversationApi(conversationId);
        set((state) => {
          state.conversations = state.conversations.filter(
            (c) => c.id !== conversationId,
          );
          delete state.messages[conversationId];
          delete state.pinnedMessagesByConv[conversationId];
          if (state.activeConversationId === conversationId) {
            state.activeConversationId = null;
          }
        });
        toast.success("Đã xoá đoạn chat");
        return true;
      } catch {
        toast.error("Không thể xoá đoạn chat");
        return false;
      }
    },

    syncBlockStateForUser: (targetUserId, blockPatch) => {
      if (!targetUserId) return;
      set((state) => {
        state.conversations = state.conversations.map((conv) => {
          if (
            conv.type === ConversationTypeEnum.DIRECT &&
            conv.partnerId === targetUserId
          ) {
            const nextBlockedByMe =
              blockPatch.blockedByMe ?? Boolean(conv.blockedByMe);
            const nextBlockedByPartner =
              blockPatch.blockedByPartner ?? Boolean(conv.blockedByPartner);
            const nextIsBlocked = nextBlockedByMe || nextBlockedByPartner;
            return {
              ...conv,
              blockedByMe: nextBlockedByMe,
              blockedByPartner: nextBlockedByPartner,
              isBlocked: nextIsBlocked,
              isOnline: nextIsBlocked ? false : conv.isOnline,
            };
          }
          return conv;
        });

        state.tempConversations = state.tempConversations.filter(
          (conv) =>
            !(
              conv.type === ConversationTypeEnum.DIRECT &&
              conv.partnerId === targetUserId &&
              (blockPatch.blockedByMe || blockPatch.blockedByPartner)
            ),
        );

        for (const details of Object.values(state.conversationDetails)) {
          if (
            details?.type === ConversationTypeEnum.DIRECT &&
            details?.blockState?.partnerId === targetUserId
          ) {
            const nextBlockedByMe =
              blockPatch.blockedByMe ?? details.blockState.blockedByMe;
            const nextBlockedByPartner =
              blockPatch.blockedByPartner ??
              details.blockState.blockedByPartner;
            details.blockState = {
              ...details.blockState,
              blockedByMe: nextBlockedByMe,
              blockedByPartner: nextBlockedByPartner,
              isBlocked: nextBlockedByMe || nextBlockedByPartner,
            };
          }
        }
      });
    },

    toggleBlockUser: async (conversationId, targetUserId, shouldBlock) => {
      try {
        if (shouldBlock) {
          await blockUserApi(targetUserId);
          get().syncBlockStateForUser(targetUserId, { blockedByMe: true });
          toast.success("Đã chặn người dùng này");
        } else {
          await unblockUserApi(targetUserId);
          get().syncBlockStateForUser(targetUserId, { blockedByMe: false });
          toast.success("Đã bỏ chặn người dùng này");
        }
        if (conversationId) {
          await get().fetchConversationDetails(conversationId);
        }
        return true;
      } catch {
        toast.error("Không thể thực hiện thao tác chặn");
        return false;
      }
    },

    openSavedMessages: async () => {
      try {
        const res: any = await getOrCreateSavedMessagesApi();
        const conv = res?.data ?? res;
        if (!conv?.id) return null;

        set((state) => {
          state.activeConversationId = conv.id;
          const exists = state.conversations.some((c) => c.id === conv.id);
          if (!exists) {
            state.conversations.unshift({
              ...conv,
              isSavedMessages: true,
            });
          }
        });

        if (socketService.isConnected(SocketNamespaceEnum.CHAT)) {
          socketService
            .emit(SocketNamespaceEnum.CHAT, SOCKET_EVENTS.CHAT.JOIN_ROOM, {
              conversationId: conv.id,
            })
            .catch(() => {});
        }
        return conv.id;
      } catch {
        toast.error("Không thể mở Cloud của tôi");
        return null;
      }
    },

    createPoll: async (payload) => {
      try {
        await createPollApi(payload);
        toast.success("Đã tạo cuộc bình chọn");
        return true;
      } catch (err: any) {
        toast.error(
          err?.response?.data?.message || "Không thể tạo cuộc bình chọn",
        );
        return false;
      }
    },

    votePoll: async ({ conversationId, messageId, optionIds }) => {
      try {
        if (socketService.isConnected(SocketNamespaceEnum.CHAT)) {
          await socketService.emit(
            SocketNamespaceEnum.CHAT,
            SOCKET_EVENTS.CHAT.VOTE_POLL,
            { conversationId, messageId, optionIds },
          );
        } else {
          await votePollApi({ conversationId, messageId, optionIds });
        }
      } catch {
        toast.error("Không thể gửi bình chọn");
      }
    },

    closePoll: async ({ conversationId, messageId }) => {
      try {
        if (socketService.isConnected(SocketNamespaceEnum.CHAT)) {
          await socketService.emit(
            SocketNamespaceEnum.CHAT,
            SOCKET_EVENTS.CHAT.CLOSE_POLL,
            { conversationId, messageId },
          );
        } else {
          await closePollApi({ conversationId, messageId });
        }
        toast.success("Đã khóa cuộc bình chọn");
      } catch {
        toast.error("Không thể khóa cuộc bình chọn");
      }
    },

    handlePollUpdated: ({ conversationId, messageId, poll }) => {
      set((state) => {
        const msgs = state.messages[conversationId];
        if (msgs) {
          const msg = msgs.find((m) => m.id === messageId);
          if (msg) {
            msg.metadata = {
              ...(msg.metadata || {}),
              poll,
            };
          }
        }
        const pinnedList = state.pinnedMessagesByConv[conversationId];
        if (pinnedList) {
          const pinnedMsg = pinnedList.find((m) => m.id === messageId);
          if (pinnedMsg) {
            pinnedMsg.metadata = {
              ...(pinnedMsg.metadata || {}),
              poll,
            };
          }
        }
      });
    },

    handleLinkPreviewReady: ({ conversationId, messageId, linkPreview }) => {
      set((state) => {
        const msgs = state.messages[conversationId];
        if (!msgs) return;
        const msg = msgs.find((m) => m.id === messageId);
        if (msg) {
          msg.metadata = {
            ...(msg.metadata || {}),
            linkPreview,
          };
        }
      });
    },

    purgeExpiredMessages: () => {
      const nowMs = Date.now();
      set((state) => {
        for (const [convId, msgList] of Object.entries(state.messages)) {
          if (!Array.isArray(msgList) || msgList.length === 0) continue;
          const hasExpired = msgList.some((m) => {
            const exp = m.expiresAt || m.metadata?.expiresAt;
            if (!exp) return false;
            const expMs = parseSafeDate(exp)?.getTime();
            return Boolean(expMs && expMs <= nowMs);
          });

          if (hasExpired) {
            const validMsgs = msgList.filter((m) => {
              const exp = m.expiresAt || m.metadata?.expiresAt;
              if (!exp) return true;
              const expMs = parseSafeDate(exp)?.getTime();
              return !expMs || expMs > nowMs;
            });
            state.messages[convId] = validMsgs;

            const lastValid = validMsgs[validMsgs.length - 1];
            const syncConvPreview = (c?: IConversation) => {
              if (!c) return;
              if (lastValid) {
                c.lastMessage =
                  lastValid.status === "removed"
                    ? tChatToast("recalledPlaceholder")
                    : lastValid.type === MessageTypeEnum.TEXT ||
                        lastValid.type === MessageTypeEnum.CALL ||
                        lastValid.type === MessageTypeEnum.POLL
                      ? lastValid.content
                      : `[${lastValid.type}] ${lastValid.content || ""}`.trim();
                c.lastMessageAt = lastValid.createdAt;
                c.lastMessageType = lastValid.type;
                c.lastMessageSenderId = lastValid.senderId;
                c.lastMessageStatus = lastValid.status || "sent";
                c.lastMessageExpiresAt =
                  lastValid.expiresAt || lastValid.metadata?.expiresAt || null;
              } else {
                c.lastMessage = null;
                c.lastMessageExpiresAt = null;
                c.lastMessageStatus = null;
              }
            };

            syncConvPreview(state.conversations.find((c) => c.id === convId));
            syncConvPreview(
              state.tempConversations.find((c) => c.id === convId),
            );
          }
        }

        const checkConvListExpiration = (list: IConversation[]) => {
          list.forEach((c) => {
            if (!c.lastMessageExpiresAt) return;
            const expMs = parseSafeDate(c.lastMessageExpiresAt)?.getTime();
            if (expMs && expMs <= nowMs) {
              const loadedMsgs = state.messages[c.id];
              const lastValid = loadedMsgs?.[loadedMsgs.length - 1];
              if (lastValid) {
                c.lastMessage = lastValid.content;
                c.lastMessageAt = lastValid.createdAt;
                c.lastMessageExpiresAt =
                  lastValid.expiresAt || lastValid.metadata?.expiresAt || null;
              } else {
                c.lastMessage = null;
                c.lastMessageExpiresAt = null;
                c.lastMessageStatus = null;
              }
            }
          });
        };

        checkConvListExpiration(state.conversations);
        checkConvListExpiration(state.tempConversations);
      });
    },

    fetchConversationActiveCall: async (conversationId) => {
      if (!conversationId) return;
      try {
        const res: any = await getConversationActiveCallApi(conversationId);
        const session = res?.data ?? null;
        set((state) => {
          if (session?.callId) {
            state.ongoingCallsByConv[conversationId] = {
              callId: session.callId,
              conversationId: session.conversationId || conversationId,
              callType: session.callType,
              isGroupCall: session.isGroupCall,
              initiatorId: session.initiatorId,
              status: session.status,
              isIncoming: false,
              startedAt: session.createdAt,
              answeredAt: session.answeredAt,
              participants: session.participants || {},
              membersInfo: session.membersInfo || [],
            };
          } else {
            state.ongoingCallsByConv[conversationId] = null;
          }
        });
      } catch {
        // Ignore
      }
    },

    setOngoingCallForConv: (conversationId, call) => {
      if (!conversationId) return;
      set((state) => {
        state.ongoingCallsByConv[conversationId] = call;
      });
    },

    resetTempConversations: () => {
      set((state) => {
        state.tempConversations = [];
        state.isLoadingSearch = false;
      });
    },

    setOmnichannelFilter: (patch) => {
      set((state) => {
        state.omnichannelFilter = {
          ...state.omnichannelFilter,
          ...patch,
        };
      });
    },

    resetOmnichannelFilter: () => {
      set({
        omnichannelFilter: {
          includeTagOperator: "OR",
        },
      });
    },

    queryOmnichannelInbox: async (shopId, overrideFilter) => {
      if (!shopId) return;
      set({ isLoadingInbox: true });
      try {
        const mergedFilter = {
          ...get().omnichannelFilter,
          ...(overrideFilter || {}),
        };
        const res: any = await queryOmnichannelInboxApi({
          shopId,
          ...mergedFilter,
          limit: 50,
        });
        const data = res?.data ?? res;
        const items: IConversation[] = Array.isArray(data?.items)
          ? data.items
          : [];
        set((state) => {
          state.conversations = items;
          if (data?.summaryCounts) {
            state.omnichannelSummaryCounts = data.summaryCounts;
          }
          state.isLoadingInbox = false;
        });
      } catch {
        set({ isLoadingInbox: false });
      }
    },

    sendInternalNote: async ({
      conversationId,
      content,
      mentionedUserIds,
      replyToMessageId,
    }) => {
      try {
        const res: any = await createInternalNoteApi({
          conversationId,
          content,
          mentionedUserIds,
          replyToMessageId,
        });
        const noteMsg: IMessage = res?.data ?? res;
        if (noteMsg?.id) {
          get().handleIncomingMessage(noteMsg);
        }
        toast.success(
          tStore("OmnichannelInbox.composer.internalNoteSavedToast"),
        );
        return true;
      } catch {
        toast.error(tStore("OmnichannelInbox.composer.internalNoteErrorToast"));
        return false;
      }
    },

    toggleCommentVisibility: async ({
      conversationId,
      messageId,
      isHidden,
    }) => {
      try {
        const res: any = await toggleCommentVisibilityApi({
          conversationId,
          messageId,
          isHidden,
        });
        const data = res?.data ?? res;
        set((state) => {
          const msgs = state.messages[conversationId];
          if (!msgs) return;
          const msg = msgs.find((m) => m.id === messageId);
          if (msg) {
            msg.metadata = {
              ...(msg.metadata || {}),
              isHiddenOnPlatform: Boolean(data?.isHiddenOnPlatform ?? isHidden),
            };
          }
        });
        toast.success(
          isHidden
            ? tStore("OmnichannelInbox.commentActions.hiddenToast")
            : tStore("OmnichannelInbox.commentActions.unhiddenToast"),
        );
        return true;
      } catch {
        toast.error(tStore("OmnichannelInbox.commentActions.actionErrorToast"));
        return false;
      }
    },

    toggleCommentLike: async ({ conversationId, messageId, isLiked }) => {
      try {
        const res: any = await toggleCommentLikeApi({
          conversationId,
          messageId,
          isLiked,
        });
        const data = res?.data ?? res;
        set((state) => {
          const msgs = state.messages[conversationId];
          if (!msgs) return;
          const msg = msgs.find((m) => m.id === messageId);
          if (msg) {
            msg.metadata = {
              ...(msg.metadata || {}),
              isLikedByPage: Boolean(data?.isLikedByPage ?? isLiked),
            };
          }
        });
        return true;
      } catch {
        return false;
      }
    },

    deleteCommentOnPlatform: async ({ conversationId, messageId }) => {
      try {
        const res: any = await deleteCommentOnPlatformApi({
          conversationId,
          messageId,
        });
        const data = res?.data ?? res;
        set((state) => {
          const msgs = state.messages[conversationId];
          if (!msgs) return;
          const msg = msgs.find((m) => m.id === messageId);
          if (msg) {
            msg.metadata = {
              ...(msg.metadata || {}),
              isDeletedOnPlatform: true,
              deletedByActor: data?.deletedByActor || "AGENT",
              deletedByAgentId: data?.deletedByAgentId || null,
              deletedOnPlatformAt:
                data?.deletedOnPlatformAt || new Date().toISOString(),
            };
          }
        });
        toast.success(
          tStore("OmnichannelInbox.commentActions.deletedOnPlatformToast"),
        );
        return true;
      } catch {
        toast.error(tStore("OmnichannelInbox.commentActions.actionErrorToast"));
        return false;
      }
    },

    handleRealtimeCommentVisibilityUpdated: ({
      conversationId,
      messageId,
      isHiddenOnPlatform,
      hiddenByAgentId,
      hiddenAt,
    }) => {
      set((state) => {
        const msgs = state.messages[conversationId];
        if (!msgs) return;
        const msg = msgs.find((m) => m.id === messageId);
        if (msg) {
          msg.metadata = {
            ...(msg.metadata || {}),
            isHiddenOnPlatform: Boolean(isHiddenOnPlatform),
            hiddenByAgentId: hiddenByAgentId || undefined,
            hiddenAt: hiddenAt || undefined,
          };
        }
      });
    },

    handleRealtimeCommentLikeUpdated: ({
      conversationId,
      messageId,
      isLikedByPage,
      likedByAgentId,
    }) => {
      set((state) => {
        const msgs = state.messages[conversationId];
        if (!msgs) return;
        const msg = msgs.find((m) => m.id === messageId);
        if (msg) {
          msg.metadata = {
            ...(msg.metadata || {}),
            isLikedByPage: Boolean(isLikedByPage),
            likedByAgentId: likedByAgentId || undefined,
          };
        }
      });
    },

    handleRealtimeCommentPrivateReplySent: ({
      conversationId,
      commentMessageId,
      linkedInboxConversationId,
      privateReplySentAt,
      privateReplyByAgentId,
      isHiddenOnPlatform,
      isLikedByPage,
    }) => {
      set((state) => {
        const msgs = state.messages[conversationId];
        if (!msgs) return;
        const msg = msgs.find((m) => m.id === commentMessageId);
        if (msg) {
          msg.metadata = {
            ...(msg.metadata || {}),
            privateReplySentAt,
            privateReplyByAgentId: privateReplyByAgentId || undefined,
            linkedInboxConversationId,
            ...(isHiddenOnPlatform !== undefined ? { isHiddenOnPlatform } : {}),
            ...(isLikedByPage !== undefined ? { isLikedByPage } : {}),
          };
        }
      });
    },

    handleRealtimeCommentDeletedOnPlatform: ({
      conversationId,
      messageId,
      isDeletedOnPlatform,
      deletedByActor,
      deletedByAgentId,
      deletedOnPlatformAt,
    }) => {
      set((state) => {
        const msgs = state.messages[conversationId];
        if (!msgs) return;
        const msg = msgs.find((m) => m.id === messageId);
        if (msg) {
          msg.metadata = {
            ...(msg.metadata || {}),
            isDeletedOnPlatform: Boolean(isDeletedOnPlatform),
            deletedByActor: deletedByActor || "CUSTOMER",
            deletedByAgentId: deletedByAgentId || null,
            deletedOnPlatformAt:
              deletedOnPlatformAt || new Date().toISOString(),
          };
        }
      });
    },

    sendPrivateReplyFromComment: async ({
      conversationId,
      messageId,
      content,
      autoHideComment,
      autoLikeComment,
    }) => {
      try {
        const res: any = await sendPrivateReplyFromCommentApi({
          conversationId,
          messageId,
          content,
          autoHideComment,
          autoLikeComment,
        });
        const data = res?.data ?? res;
        set((state) => {
          const msgs = state.messages[conversationId];
          if (!msgs) return;
          const msg = msgs.find((m) => m.id === messageId);
          if (msg) {
            msg.metadata = {
              ...(msg.metadata || {}),
              privateReplySentAt:
                data?.privateReplySentAt || new Date().toISOString(),
              linkedInboxConversationId: data?.linkedInboxConversationId,
              isHiddenOnPlatform:
                data?.isHiddenOnPlatform ?? msg.metadata?.isHiddenOnPlatform,
              isLikedByPage: data?.isLikedByPage ?? msg.metadata?.isLikedByPage,
            };
          }
        });
        toast.success(
          tStore("OmnichannelInbox.commentActions.privateReplySuccessToast"),
        );
        return {
          linkedInboxConversationId: data?.linkedInboxConversationId,
        };
      } catch (err: any) {
        toast.error(
          err?.response?.data?.message ||
            tStore("OmnichannelInbox.commentActions.privateReplyErrorToast"),
        );
        return null;
      }
    },

    snoozeConversation: async ({
      conversationId,
      snoozedUntilAt,
      snoozeNote,
    }) => {
      try {
        await snoozeConversationApi({
          conversationId,
          snoozedUntilAt,
          snoozeNote,
        });
        set((state) => {
          const conv = state.conversations.find((c) => c.id === conversationId);
          if (conv) {
            conv.supportStatus = "SNOOZED";
            conv.snoozedUntilAt = snoozedUntilAt;
            conv.snoozeNote = snoozeNote || null;
          }
          if (state.conversationDetails[conversationId]) {
            state.conversationDetails[conversationId].supportStatus = "SNOOZED";
            state.conversationDetails[conversationId].snoozedUntilAt =
              snoozedUntilAt;
            state.conversationDetails[conversationId].snoozeNote =
              snoozeNote || null;
          }
        });
        toast.success(tStore("OmnichannelInbox.snooze.scheduledToast"));
        return true;
      } catch {
        toast.error(tStore("OmnichannelInbox.snooze.errorToast"));
        return false;
      }
    },

    cancelSnoozeConversation: async (conversationId) => {
      try {
        await cancelSnoozeConversationApi(conversationId);
        set((state) => {
          const conv = state.conversations.find((c) => c.id === conversationId);
          if (conv) {
            conv.supportStatus = "WAITING_AGENT_REPLY";
            conv.snoozedUntilAt = null;
          }
          if (state.conversationDetails[conversationId]) {
            state.conversationDetails[conversationId].supportStatus =
              "WAITING_AGENT_REPLY";
            state.conversationDetails[conversationId].snoozedUntilAt = null;
          }
        });
        toast.success(tStore("OmnichannelInbox.snooze.cancelledToast"));
        return true;
      } catch {
        return false;
      }
    },

    transferConversation: async ({
      conversationId,
      targetAgentId,
      transferNote,
    }) => {
      try {
        const res: any = await transferConversationApi({
          conversationId,
          targetAgentId,
          transferNote,
        });
        const data = res?.data ?? res;
        set((state) => {
          const conv = state.conversations.find((c) => c.id === conversationId);
          if (conv) {
            conv.assignedAgentId = targetAgentId;
          }
          if (state.conversationDetails[conversationId]) {
            state.conversationDetails[conversationId].assignedAgentId =
              targetAgentId;
            if (data?.timeline) {
              state.conversationDetails[
                conversationId
              ].accountabilityTimelineJson = data.timeline;
            }
          }
        });
        toast.success(tStore("OmnichannelInbox.transfer.successToast"));
        return true;
      } catch {
        toast.error(tStore("OmnichannelInbox.transfer.errorToast"));
        return false;
      }
    },

    acquireCollisionLock: async (conversationId) => {
      try {
        const res: any = await acquireCollisionLockApi(conversationId);
        const data = res?.data ?? res;
        const lock: ICollisionLockState | null = data?.lock || null;
        if (lock) {
          set((state) => {
            state.collisionLocksByConv[conversationId] = lock;
          });
        }
        return lock;
      } catch {
        return null;
      }
    },

    releaseCollisionLock: async (conversationId) => {
      try {
        await releaseCollisionLockApi(conversationId);
        set((state) => {
          state.collisionLocksByConv[conversationId] = null;
        });
      } catch {
        // Ignore release error
      }
    },

    forceTakeOverCollisionLock: async (shopId, conversationId) => {
      try {
        const res: any = await forceTakeoverCollisionLockApi({
          shopId,
          conversationId,
        });
        const lock: ICollisionLockState = res?.data ?? res;
        set((state) => {
          state.collisionLocksByConv[conversationId] = lock;
        });
        toast.success(
          tStore("OmnichannelInbox.collision.takeOverSuccessToast"),
        );
        return true;
      } catch {
        toast.error(tStore("OmnichannelInbox.collision.takeOverErrorToast"));
        return false;
      }
    },

    setCollisionLockForConv: (conversationId, lock) => {
      set((state) => {
        state.collisionLocksByConv[conversationId] = lock;
      });
    },

    initiateMaskedVoipCall: async ({
      conversationId,
      customerId,
      customerPhoneMasked,
    }) => {
      try {
        const res: any = await initiateMaskedVoipCallApi({
          conversationId,
          customerId,
          customerPhoneMasked: customerPhoneMasked || "098***678",
        });
        const data = res?.data ?? res;
        const session: IMaskedVoipCallSession = {
          callSessionId: data.callSessionId,
          conversationId,
          maskedPhoneDisplay: data.maskedPhoneDisplay || "098***678",
          sipTrunkProvider: data.sipTrunkProvider,
          status: CallStatusEnum.RINGING,
          startedAt: new Date().toISOString(),
        };
        set({ activeMaskedCall: session });
        return session;
      } catch {
        toast.error(tStore("MaskedVoip.initiateErrorToast"));
        return null;
      }
    },

    finalizeMaskedVoipCall: async ({
      conversationId,
      callSessionId,
      durationSeconds,
      callDispositionTag,
      callNotes,
    }) => {
      try {
        const res: any = await finalizeMaskedVoipCallApi({
          conversationId,
          callSessionId,
          durationSeconds,
          callDispositionTag,
          callNotes,
        });
        const callMsg: IMessage = res?.data ?? res;
        if (callMsg?.id) {
          get().handleIncomingMessage(callMsg);
        }
        set({ activeMaskedCall: null });
        toast.success(tStore("MaskedVoip.completedToast"));
        return true;
      } catch {
        set({ activeMaskedCall: null });
        return false;
      }
    },

    setActiveMaskedCall: (call) => {
      set({ activeMaskedCall: call });
    },

    translateMessageOrDraft: async (payload) => {
      try {
        const res: any = await translateChatMessageApi(payload);
        const data = res?.data ?? res;
        if (
          payload.messageId &&
          payload.conversationId &&
          data?.translatedText
        ) {
          get().handleMessageTranslated({
            conversationId: payload.conversationId,
            messageId: payload.messageId,
            translation: {
              translatedText: data.translatedText,
              sourceLang: data.sourceLang || "auto",
              targetLang: data.targetLang,
              translatedAt: new Date().toISOString(),
            },
          });
        }
        return data;
      } catch {
        toast.error(tStore("OmnichannelInbox.translation.errorToast"));
        return null;
      }
    },

    handleMessageTranslated: ({ conversationId, messageId, translation }) => {
      set((state) => {
        const msgs = state.messages[conversationId];
        if (!msgs) return;
        const target = msgs.find((m) => m.id === messageId);
        if (target) {
          target.metadata = {
            ...(target.metadata || {}),
            translation,
          };
        }
      });
    },

    syncConversationTagsOptimistic: (conversationId, activeTagIds) => {
      set((state) => {
        const conv = state.conversations.find((c) => c.id === conversationId);
        if (conv) {
          conv.activeTagIdsJson = activeTagIds;
        }
        if (state.conversationDetails[conversationId]) {
          state.conversationDetails[conversationId].activeTagIdsJson =
            activeTagIds;
        }
      });
    },

    syncMessageTagsOptimistic: (conversationId, messageId, messageTagIds) => {
      set((state) => {
        const msgs = state.messages[conversationId];
        if (!msgs) return;
        const msg = msgs.find((m) => m.id === messageId);
        if (msg) {
          msg.messageTagIdsJson = messageTagIds;
        }
      });
    },

    handleGhostedAlert: ({ conversationId }) => {
      set((state) => {
        const conv = state.conversations.find((c) => c.id === conversationId);
        if (conv) {
          conv.isGhostedByAgent = true;
        }
        if (state.conversationDetails[conversationId]) {
          state.conversationDetails[conversationId].isGhostedByAgent = true;
        }
      });
    },

    handleSnoozeWakeup: ({ conversationId }) => {
      set((state) => {
        const conv = state.conversations.find((c) => c.id === conversationId);
        if (conv) {
          conv.supportStatus = "WAITING_AGENT_REPLY";
          conv.snoozedUntilAt = null;
        }
        if (state.conversationDetails[conversationId]) {
          state.conversationDetails[conversationId].supportStatus =
            "WAITING_AGENT_REPLY";
          state.conversationDetails[conversationId].snoozedUntilAt = null;
        }
      });
    },

    handleConversationTransferred: ({
      conversationId,
      toAgentId,
      timeline,
    }) => {
      set((state) => {
        const conv = state.conversations.find((c) => c.id === conversationId);
        if (conv) {
          conv.assignedAgentId = toAgentId;
        }
        if (state.conversationDetails[conversationId]) {
          state.conversationDetails[conversationId].assignedAgentId = toAgentId;
          if (timeline) {
            state.conversationDetails[
              conversationId
            ].accountabilityTimelineJson = timeline;
          }
        }
      });
    },
  }),
  "chat-storage",
  {
    partialize: (state) => ({ conversations: state.conversations }) as any,
  },
);
