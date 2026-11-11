/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
/** biome-ignore-all lint/suspicious/useIterableCallbackReturn: <explanation> */
/** biome-ignore-all lint/suspicious/noArrayIndexKey: <explanation> */

"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowDown,
  Loader2,
  Trash2,
  RefreshCw,
  AlertCircle,
  X,
  Search,
  ChevronUp,
  ChevronDown,
  Megaphone,
  MessageSquare,
  ExternalLink,
} from "lucide-react";
import { MessageBubble } from "@/components/chat/message-bubble";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatInput } from "@/components/chat/chat-input";
import { CreateGroupModal } from "@/components/chat/create-group-modal";
import { AgentCollisionBanner } from "@/components/chat/agent-collision-banner";
import { QuickTagShortcutBar } from "@/components/chat/quick-tag-shortcut-bar";
import { CustomTagManagerModal } from "@/components/chat/custom-tag-manager-modal";
import { TaggedMessagesSheet } from "@/components/chat/tagged-messages-sheet";
import { ConversationSnoozeAndTimelineSheet } from "@/components/chat/conversation-snooze-popover";
import { MaskedVoipCallModal } from "@/components/chat/masked-voip-call-modal";
import {
  LiquidGlassInput,
  GlassSurfaceCard,
  GlassBadge,
  PatternButton,
  GlassIconButton,
  GlassConfirmDialog,
} from "@/components/toolkit";

import { useChatStore } from "@/lib/stores/chat/use-chat-store";
import { useAuthStore } from "@/lib/stores/auth/use-auth-store";
import { usePermissionStore } from "@/lib/stores/iam/use-permission-store";
import { useTagStore } from "@/lib/stores/tags/use-tag-store";
import { useHydratedStore } from "@/utils/hooks/use-hydrated-store";
import { useDateFormat } from "@/utils/hooks/use-date-format";
import { useChatScroll } from "@/utils/hooks/use-chat-scroll";
import {
  CallTypeEnum,
  ConversationTypeEnum,
  MessageTypeEnum,
} from "@/common/enum";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import config from "@/config";

import { Input } from "@/components/ui/input";
import { PinnedMessagesBar } from "@/components/chat/pinned-messages-bar";
import { ConversationInfoDrawer } from "@/components/chat/conversation-info-drawer";
import type {
  CommentReplyModeType,
  ICustomTag,
  IMessage,
  IQuickReplyProductCard,
} from "@/types/chat";
import { ForwardMessageModal } from "./forward-message-modal";
import { OngoingCallBanner } from "./ongoing-call-banner";
import { ScrollArea } from "../ui/scroll-area";

interface ChatConversationPageProps {
  params: { id: string };
}

export default function ChatConversationPage({
  params,
}: ChatConversationPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetMessageId = searchParams.get("messageId");
  const t = useTranslations("Chat.Detail.conversation");
  const tHeader = useTranslations("Chat.Detail.header");
  const tInbox = useTranslations("OmnichannelInbox");

  const currentUser = useHydratedStore(useAuthStore, (s) => s.currentAccount);
  const activeShopId = usePermissionStore((s) => s.activeShopId);

  const {
    conversations,
    messages,
    messagesMeta,
    typingUsers,
    uploadProgress,
    activeCall,
    fetchMessages,
    isLoadingMessages,
    sendMessage,
    sendInternalNote,
    sendAttachmentMessage,
    editMessage,
    recallMessage,
    reactMessage,
    pinMessage,
    votePoll,
    closePoll,
    setReplyingTo,
    setEditingMessage,
    initiateCall,
    toggleMuteConversation,
    removeGroupMember,
    setActiveConversation,
    resendMessage,
    removeFailedMessage,
    pinnedMessagesByConv,
    conversationDetails,
    fetchPinnedMessages,
    fetchConversationDetails,
    deleteConversation,
    toggleBlockUser,
    purgeExpiredMessages,
    ongoingCallsByConv,
    collisionLocksByConv,
    acquireCollisionLock,
    releaseCollisionLock,
    forceTakeOverCollisionLock,
    initiateMaskedVoipCall,
    translateMessageOrDraft,
    toggleCommentVisibility,
    toggleCommentLike,
    deleteCommentOnPlatform,
    sendPrivateReplyFromComment,
  } = useChatStore();

  const {
    tags,
    bookmarkedMessagesByConv,
    fetchShopTags,
    toggleConversationTag,
    toggleMessageBookmarkTag,
    fetchBookmarkedMessages,
  } = useTagStore();

  const [isInfoDrawerOpen, setIsInfoDrawerOpen] = useState(false);
  const [isSearchBarOpen, setIsSearchBarOpen] = useState(false);
  const [inChatSearchQuery, setInChatSearchQuery] = useState("");
  const [searchMatchIndex, setSearchMatchIndex] = useState(0);
  const [recallTarget, setRecallTarget] = useState<IMessage | null>(null);
  const [deleteCommentTarget, setDeleteCommentTarget] =
    useState<IMessage | null>(null);
  const [forwardTarget, setForwardTarget] = useState<IMessage | null>(null);
  const [deleteFailedTargetId, setDeleteFailedTargetId] = useState<
    string | null
  >(null);
  const [isLeaveGroupConfirmOpen, setIsLeaveGroupConfirmOpen] = useState(false);
  const [isDeleteConvConfirmOpen, setIsDeleteConvConfirmOpen] = useState(false);

  // Sprint 2 modals & drawers
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  const [isBookmarksSheetOpen, setIsBookmarksSheetOpen] = useState(false);
  const [isSnoozeSheetOpen, setIsSnoozeSheetOpen] = useState(false);

  const { groupMessagesTime } = useDateFormat();
  const conversationId = params?.id || "";

  const [currentPage, setCurrentPage] = useState(1);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState<
    string | null
  >(null);
  const highlightTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scrolledNotificationMsgRef = useRef<string | null>(null);

  const currentDetails = conversationId
    ? conversationDetails[conversationId]
    : undefined;

  const currentConversation = useMemo(
    () => conversations.find((c) => c.id === conversationId),
    [conversations, conversationId],
  );

  const effectiveShopId =
    currentConversation?.shopId || currentDetails?.shopId || activeShopId;

  const interactionType =
    currentConversation?.interactionType || currentDetails?.interactionType;
  const isCommentThread =
    interactionType === "COMMENT" || interactionType === "LIVESTREAM";

  useEffect(() => {
    if (effectiveShopId && conversationId) {
      fetchShopTags(effectiveShopId);
      fetchBookmarkedMessages(effectiveShopId, conversationId);
    }
  }, [effectiveShopId, conversationId, fetchShopTags, fetchBookmarkedMessages]);

  // F03.7 & T03: Heartbeat khóa chống đụng độ nhân viên (Collision Lock 25s)
  useEffect(() => {
    if (!conversationId || !effectiveShopId) return;
    acquireCollisionLock(conversationId);

    const interval = setInterval(() => {
      acquireCollisionLock(conversationId);
    }, 25_000);

    return () => {
      clearInterval(interval);
      releaseCollisionLock(conversationId);
    };
  }, [
    conversationId,
    effectiveShopId,
    acquireCollisionLock,
    releaseCollisionLock,
  ]);

  const activeCollisionLock = conversationId
    ? collisionLocksByConv[conversationId]
    : null;
  const isCollisionLockedByOther = Boolean(
    activeCollisionLock &&
      currentUser?.user?.id &&
      activeCollisionLock.holderAgentId !== currentUser.user.id,
  );

  const allTagsMap = useMemo(() => {
    const map = new Map<string, ICustomTag>();
    tags.forEach((tag) => map.set(tag.id, tag));
    return map;
  }, [tags]);

  const bookmarkTags = useMemo(
    () =>
      tags.filter(
        (tag) =>
          tag.category === "MESSAGE_BOOKMARK" ||
          tag.applicableScopesJson?.includes("MESSAGE"),
      ),
    [tags],
  );

  const activeTagIds = useMemo(
    () =>
      currentConversation?.activeTagIdsJson ||
      currentDetails?.activeTagIdsJson ||
      [],
    [currentConversation?.activeTagIdsJson, currentDetails?.activeTagIdsJson],
  );

  const isGroupChat =
    currentConversation?.type === ConversationTypeEnum.GROUP ||
    currentDetails?.type === ConversationTypeEnum.GROUP;

  const resolvedHeaderName = useMemo(() => {
    if (isGroupChat) {
      return (
        currentConversation?.name ||
        currentDetails?.name ||
        tHeader("defaultUser")
      );
    }
    const partnerMember = currentDetails?.members?.find(
      (m) => m.userId !== currentUser?.user?.id,
    );
    return (
      partnerMember?.nickname ||
      currentConversation?.name ||
      partnerMember?.name ||
      tHeader("defaultUser")
    );
  }, [
    isGroupChat,
    currentConversation?.name,
    currentDetails?.name,
    currentDetails?.members,
    currentUser?.user?.id,
    tHeader,
  ]);

  const rawMessages = useMemo(
    () => (conversationId ? messages[conversationId] || [] : []),
    [messages, conversationId],
  );

  const pinnedMessages = useMemo(() => {
    const fromMessages = rawMessages.filter(
      (m) => (m.isPinned || m.metadata?.isPinned) && m.status !== "removed",
    );
    const fromStore = pinnedMessagesByConv[conversationId] || [];
    const map = new Map<string, IMessage>();
    [...fromStore, ...fromMessages].forEach((m) => {
      if (m.isPinned || m.metadata?.isPinned) map.set(m.id, m);
    });
    return Array.from(map.values());
  }, [rawMessages, pinnedMessagesByConv, conversationId]);

  const matchedMessageIds = useMemo(() => {
    const q = inChatSearchQuery.trim().toLowerCase();
    if (!q) return [];
    return rawMessages
      .filter(
        (m) =>
          m.status !== "removed" && (m.content || "").toLowerCase().includes(q),
      )
      .map((m) => m.id);
  }, [rawMessages, inChatSearchQuery]);

  const groupedMessages = useMemo(
    () => groupMessagesTime(rawMessages),
    [rawMessages, groupMessagesTime],
  );

  const isPartnerTyping = useMemo(
    () => (typingUsers[conversationId]?.length || 0) > 0,
    [typingUsers, conversationId],
  );

  const meta = conversationId ? messagesMeta[conversationId] : null;
  const hasMore = meta ? meta.page < meta.totalPages : true;

  const {
    scrollRef,
    contentRef,
    bottomRef,
    scrollToBottom,
    handleScroll,
    saveScrollSnapshot,
    showScrollButton,
    unreadCount,
  } = useChatScroll(
    rawMessages,
    conversationId,
    currentUser?.user?.id || "",
    isLoadingMessages,
  );

  const scrollToMessage = useCallback((messageId: string) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMessageId(messageId);
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
      }
      highlightTimerRef.current = setTimeout(() => {
        setHighlightedMessageId(null);
      }, 2500);
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    if (conversationId) {
      scrolledNotificationMsgRef.current = null;
      setActiveConversation(conversationId);
      setCurrentPage(1);
      fetchMessages(conversationId, 1);
      fetchPinnedMessages(conversationId);
      fetchConversationDetails(conversationId);
    }
    return () => {
      setActiveConversation(null);
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
      }
    };
  }, [conversationId, fetchMessages, setActiveConversation]);

  useEffect(() => {
    if (!rawMessages.length) return;

    if (
      targetMessageId &&
      scrolledNotificationMsgRef.current !== targetMessageId
    ) {
      const timer = setTimeout(() => {
        const found = scrollToMessage(targetMessageId);
        if (found) {
          scrolledNotificationMsgRef.current = targetMessageId;
        } else {
          scrollToBottom("smooth");
          scrolledNotificationMsgRef.current = targetMessageId;
        }
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [rawMessages, targetMessageId, scrollToMessage, scrollToBottom]);

  const onContainerScroll = async (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    handleScroll();

    if (target.scrollTop < 50 && !isLoadingMessages && hasMore) {
      saveScrollSnapshot();
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      await fetchMessages(conversationId, nextPage);
    }
  };

  useEffect(() => {
    const hasExpiringMessages = rawMessages.some(
      (m) => m.expiresAt || m.metadata?.expiresAt,
    );
    if (!hasExpiringMessages && !currentConversation?.disappearingTtl) return;

    const timer = setInterval(() => {
      purgeExpiredMessages();
    }, 1000);
    return () => clearInterval(timer);
  }, [rawMessages, currentConversation?.disappearingTtl, purgeExpiredMessages]);

  const readReceiptsMap = useMemo(() => {
    const map: Record<
      string,
      { id: string; name: string; avatar: string | null }[]
    > = {};
    if (!currentUser?.user?.id) return map;

    const processedUserIds = new Set<string>();
    const reversedMessages = [...rawMessages].reverse();

    reversedMessages.forEach((msg) => {
      if (msg.senderId !== currentUser.user.id) return;

      if (msg.readByUsers && msg.readByUsers.length > 0) {
        msg.readByUsers.forEach((reader) => {
          if (!reader?.id) return;

          if (!processedUserIds.has(reader.id)) {
            if (!map[msg.id]) map[msg.id] = [];

            map[msg.id].push({
              id: reader.id,
              name: reader.name || t("unknownUser"),
              avatar: reader.avatar || null,
            });

            processedUserIds.add(reader.id);
          }
        });
      }
    });

    return map;
  }, [rawMessages, currentUser?.user?.id, t]);

  const handleSendMessage = useCallback(
    async (
      content: string,
      options?: {
        mentionedUserIds?: string[];
        mentionAll?: boolean;
        productCards?: IQuickReplyProductCard[];
        quickReplyShortcutUsed?: string;
        commentReplyMode?: CommentReplyModeType;
        autoHideCommentOnReply?: boolean;
      },
    ) => {
      if (!conversationId) return;

      const latestInboundComment = [...rawMessages]
        .reverse()
        .find((m) => m.senderId !== currentUser?.user?.id);

      if (
        isCommentThread &&
        latestInboundComment &&
        options?.commentReplyMode === "SEND_PRIVATE_REPLY_ONLY"
      ) {
        await sendPrivateReplyFromComment({
          conversationId,
          messageId: latestInboundComment.id,
          content,
          autoHideComment: options.autoHideCommentOnReply,
          autoLikeComment: true,
        });
        return;
      }

      await sendMessage({
        conversationId,
        content,
        type: MessageTypeEnum.TEXT,
        mentionedUserIds: options?.mentionedUserIds,
        mentionAll: options?.mentionAll,
        metadata:
          options?.productCards ||
          options?.quickReplyShortcutUsed ||
          options?.commentReplyMode ||
          options?.autoHideCommentOnReply !== undefined
            ? {
                productCards: options.productCards,
                quickReplyShortcutUsed: options.quickReplyShortcutUsed,
                commentReplyMode: options.commentReplyMode,
                autoHideCommentOnReply: options.autoHideCommentOnReply,
              }
            : undefined,
      });

      if (
        isCommentThread &&
        latestInboundComment &&
        options?.commentReplyMode === "REPLY_COMMENT_AND_PRIVATE_INBOX" &&
        !latestInboundComment.metadata?.privateReplySentAt
      ) {
        await sendPrivateReplyFromComment({
          conversationId,
          messageId: latestInboundComment.id,
          content,
          autoHideComment: options.autoHideCommentOnReply,
          autoLikeComment: true,
        });
      }

      scrollToBottom("smooth");
    },
    [
      conversationId,
      rawMessages,
      currentUser?.user?.id,
      isCommentThread,
      sendMessage,
      sendPrivateReplyFromComment,
      scrollToBottom,
    ],
  );

  const handleSendInternalNote = useCallback(
    async (content: string, mentionedUserIds?: string[]) => {
      if (!conversationId) return;
      await sendInternalNote({
        conversationId,
        content,
        mentionedUserIds,
      });
      scrollToBottom("smooth");
    },
    [conversationId, sendInternalNote, scrollToBottom],
  );

  const handleSendAttachments = useCallback(
    async (files: File[], content?: string) => {
      if (!conversationId) return;
      await sendAttachmentMessage({
        conversationId,
        files,
        content,
      });
      scrollToBottom("smooth");
    },
    [conversationId, sendAttachmentMessage, scrollToBottom],
  );

  const handleConfirmEdit = useCallback(
    async (messageId: string, newContent: string) => {
      if (!conversationId) return;
      await editMessage({
        conversationId,
        messageId,
        content: newContent,
      });
    },
    [conversationId, editMessage],
  );

  const handleRetry = useCallback(
    (msgId: string, content: string) => {
      if (!conversationId) return;
      resendMessage(msgId, {
        conversationId,
        content,
        type: MessageTypeEnum.TEXT,
      });
    },
    [conversationId, resendMessage],
  );

  const handleDeleteFailed = useCallback(
    (msgId: string) => {
      if (conversationId) removeFailedMessage(msgId, conversationId);
    },
    [conversationId, removeFailedMessage],
  );

  const handleLeaveGroup = useCallback(async () => {
    if (!conversationId || !currentUser?.user?.id) return;
    const ok = await removeGroupMember({
      conversationId,
      memberId: currentUser.user.id,
    });
    if (ok) {
      router.push(config.routes.private.chat);
    }
  }, [conversationId, currentUser?.user?.id, removeGroupMember, router]);

  if (!currentUser) return null;

  const bookmarkedCount = (bookmarkedMessagesByConv[conversationId] || [])
    .length;

  return (
    <div className="flex flex-col h-full bg-background w-full overflow-hidden relative">
      {/* Header */}
      <div className="flex-none z-20 bg-background/95 border-b">
        <ChatHeader
          displayName={resolvedHeaderName}
          avatarUrl={currentConversation?.avatar}
          isOnline={currentConversation?.isOnline}
          isTyping={isPartnerTyping}
          isMuted={currentConversation?.isMuted}
          isGroupChat={isGroupChat}
          isAdmin={currentConversation?.isAdmin}
          partnerId={currentConversation?.partnerId}
          shopId={effectiveShopId}
          sourceAdId={
            currentConversation?.sourceAdId || currentDetails?.sourceAdId
          }
          sourcePostId={
            currentConversation?.sourcePostId || currentDetails?.sourcePostId
          }
          isGhostedByAgent={Boolean(
            currentConversation?.isGhostedByAgent ||
              currentDetails?.isGhostedByAgent,
          )}
          isSlaBreached={Boolean(
            currentConversation?.isSlaBreached || currentDetails?.isSlaBreached,
          )}
          snoozedUntilAt={
            currentConversation?.snoozedUntilAt ||
            currentDetails?.snoozedUntilAt
          }
          isBlocked={Boolean(
            currentDetails?.blockState?.isBlocked ||
              currentConversation?.isBlocked,
          )}
          onAudioCall={() => initiateCall(conversationId, CallTypeEnum.AUDIO)}
          onVideoCall={() => initiateCall(conversationId, CallTypeEnum.VIDEO)}
          onMaskedVoipCall={() =>
            initiateMaskedVoipCall({
              conversationId,
              customerId: currentConversation?.customerId || undefined,
              customerPhoneMasked: "098***678",
            })
          }
          onOpenSnoozeAndTimeline={() => setIsSnoozeSheetOpen(true)}
          onOpenBookmarksSheet={() => setIsBookmarksSheetOpen(true)}
          onToggleMute={() =>
            toggleMuteConversation(
              conversationId,
              !currentConversation?.isMuted,
            )
          }
          onToggleSearch={() => setIsSearchBarOpen((v) => !v)}
          onOpenInfoDrawer={() => setIsInfoDrawerOpen(true)}
          onAddGroupMembers={() => setIsAddMemberOpen(true)}
          onLeaveGroup={() => setIsLeaveGroupConfirmOpen(true)}
          onDeleteConversation={() => setIsDeleteConvConfirmOpen(true)}
        />

        {/* Thanh phím tắt Tag màu oklch (Alt+1..9 — F02.1 & F02.2) */}
        {effectiveShopId && tags.length > 0 && (
          <QuickTagShortcutBar
            tags={tags}
            activeTagIds={activeTagIds}
            bookmarkedCount={bookmarkedCount}
            onToggleTag={(tagId) =>
              toggleConversationTag({
                shopId: effectiveShopId,
                conversationId,
                tagId,
              })
            }
            onOpenTagManager={() => setIsTagManagerOpen(true)}
            onOpenBookmarksSheet={() => setIsBookmarksSheetOpen(true)}
          />
        )}

        {/* Thẻ Ngữ cảnh Bài viết gốc / Quảng cáo CTWA (SourcePostContextCard bọc bởi GlassSurfaceCard — F03.3 & F03.4) */}
        {(isCommentThread ||
          currentConversation?.sourcePostId ||
          currentDetails?.sourcePostId ||
          currentConversation?.sourceAdId ||
          currentDetails?.sourceAdId) && (
          <div className="px-3 sm:px-4 py-1.5 border-t border-border/40">
            <GlassSurfaceCard className="p-2.5 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 min-w-0">
                <GlassBadge
                  variant={isCommentThread ? "primary" : "info"}
                  size="sm"
                >
                  {isCommentThread ? (
                    <MessageSquare className="w-3 h-3 mr-1 inline" />
                  ) : (
                    <Megaphone className="w-3 h-3 mr-1 inline" />
                  )}
                  {interactionType || "COMMENT"}
                </GlassBadge>
                {(currentConversation?.sourcePostId ||
                  currentDetails?.sourcePostId) && (
                  <span className="text-xs font-medium text-foreground truncate">
                    Post #
                    {currentConversation?.sourcePostId ||
                      currentDetails?.sourcePostId}
                  </span>
                )}
                {(currentConversation?.sourceAdId ||
                  currentDetails?.sourceAdId) && (
                  <GlassBadge variant="warning" size="sm">
                    Ad #
                    {currentConversation?.sourceAdId ||
                      currentDetails?.sourceAdId}
                  </GlassBadge>
                )}
              </div>
              {(currentConversation?.sourcePostId ||
                currentDetails?.sourcePostId) && (
                <a
                  href={`https://facebook.com/${currentConversation?.sourcePostId || currentDetails?.sourcePostId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline shrink-0"
                >
                  <span>Mở bài viết gốc</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </GlassSurfaceCard>
          </div>
        )}

        {/* Thanh cảnh báo Chống đụng độ nhân viên (F03.7 & T03) */}
        {activeCollisionLock && (
          <AgentCollisionBanner
            holderAgentId={activeCollisionLock.holderAgentId}
            holderAgentName={activeCollisionLock.holderAgentName}
            holderAgentAvatar={activeCollisionLock.holderAgentAvatar}
            currentUserId={currentUser.user.id || ""}
            onForceTakeOver={() => {
              if (effectiveShopId) {
                forceTakeOverCollisionLock(effectiveShopId, conversationId);
              }
            }}
          />
        )}

        {isSearchBarOpen && (
          <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-muted/40 border-t">
            <LiquidGlassInput className="flex-1 h-8 p-0 overflow-hidden">
              <div className="flex items-center px-2.5 w-full h-full">
                <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0 mr-2" />
                <Input
                  value={inChatSearchQuery}
                  onChange={(e) => {
                    setInChatSearchQuery(e.target.value);
                    setSearchMatchIndex(0);
                  }}
                  placeholder={t("searchInChatPlaceholder")}
                  className="h-full text-xs bg-transparent! border-none shadow-none focus-visible:ring-0 px-0"
                  autoFocus
                />
              </div>
            </LiquidGlassInput>
            {inChatSearchQuery && (
              <span className="text-[11px] text-muted-foreground shrink-0 tabular-nums">
                {matchedMessageIds.length > 0
                  ? `${searchMatchIndex + 1}/${matchedMessageIds.length}`
                  : "0/0"}
              </span>
            )}
            <GlassIconButton
              size="sm"
              variant="ghost"
              className="h-7 w-7"
              disabled={!matchedMessageIds.length}
              icon={<ChevronUp className="w-4 h-4" />}
              onClick={() => {
                const nextIdx =
                  (searchMatchIndex - 1 + matchedMessageIds.length) %
                  matchedMessageIds.length;
                setSearchMatchIndex(nextIdx);
                scrollToMessage(matchedMessageIds[nextIdx]);
              }}
            />
            <GlassIconButton
              size="sm"
              variant="ghost"
              className="h-7 w-7"
              disabled={!matchedMessageIds.length}
              icon={<ChevronDown className="w-4 h-4" />}
              onClick={() => {
                const nextIdx =
                  (searchMatchIndex + 1) % matchedMessageIds.length;
                setSearchMatchIndex(nextIdx);
                scrollToMessage(matchedMessageIds[nextIdx]);
              }}
            />
            <GlassIconButton
              size="sm"
              variant="ghost"
              className="h-7 w-7"
              icon={<X className="w-4 h-4" />}
              onClick={() => {
                setIsSearchBarOpen(false);
                setInChatSearchQuery("");
              }}
            />
          </div>
        )}

        <PinnedMessagesBar
          pinnedMessages={pinnedMessages}
          onScrollToMessage={scrollToMessage}
          onUnpinMessage={(messageId) =>
            pinMessage({
              conversationId,
              messageId,
              isPinned: false,
            })
          }
        />

        {isGroupChat && (
          <OngoingCallBanner
            ongoingCall={ongoingCallsByConv[conversationId] || null}
            currentActiveCallId={activeCall?.callId}
            onJoinCall={(callType) => initiateCall(conversationId, callType)}
          />
        )}
      </div>

      {/* Message Area */}
      <div className="flex-1 min-h-0 relative bg-slate-50/50 dark:bg-background/50">
        <ScrollArea
          className="h-full w-full"
          viewportRef={scrollRef}
          onViewportScroll={onContainerScroll}
          viewportClassName="px-2 md:px-4 pt-4 pb-2 scroll-smooth [overflow-anchor:none]"
        >
          <div
            ref={contentRef}
            className="flex flex-col min-h-full justify-end"
          >
            {isLoadingMessages && currentPage > 1 && (
              <div className="flex justify-center w-full py-4 animate-in fade-in zoom-in duration-300">
                <Loader2 className="h-5 w-5 text-primary/60 animate-spin" />
              </div>
            )}

            {groupedMessages.map((group, gIndex) => (
              <div key={`${group.label}-${gIndex}`} className="mb-6">
                <div className="flex justify-center mb-4 sticky top-0 z-10 pointer-events-none">
                  <span className="text-[10px] font-medium bg-muted/90 px-3 py-1 rounded-full border border-border/40 select-none shadow-2xs">
                    {group.label}
                  </span>
                </div>
                <div className="flex flex-col space-y-0.5">
                  {group.messages.map((msg, index) => {
                    const isMe = msg.senderId === currentUser.user.id;

                    const nextMsg = group.messages[index + 1];
                    const prevMsg = group.messages[index - 1];
                    const isContinuous =
                      prevMsg && prevMsg.senderId === msg.senderId;
                    const isLastInGroup =
                      !nextMsg || nextMsg.senderId !== msg.senderId;

                    return (
                      <div
                        key={msg.id}
                        className="group relative flex w-full flex-col"
                      >
                        <MessageBubble
                          message={msg}
                          currentUserId={currentUser.user.id || ""}
                          isMe={isMe}
                          isGroupChat={isGroupChat}
                          isCommentThread={isCommentThread}
                          isContinuous={!!isContinuous}
                          isLastInGroup={isLastInGroup}
                          isHighlighted={highlightedMessageId === msg.id}
                          avatarUrl={
                            isMe
                              ? currentUser.user.avatar || undefined
                              : msg.sender?.avatar || undefined
                          }
                          displayName={isMe ? t("me") : msg.sender?.name}
                          displayReaders={readReceiptsMap[msg.id]}
                          bookmarkTags={bookmarkTags}
                          allTagsMap={allTagsMap}
                          uploadPercent={
                            msg.tempId ? uploadProgress[msg.tempId] : undefined
                          }
                          onReply={(m) => setReplyingTo(conversationId, m)}
                          onEdit={(m) => setEditingMessage(conversationId, m)}
                          onRecall={(m) => setRecallTarget(m)}
                          onForward={(m) => setForwardTarget(m)}
                          onReact={(m, emoji) =>
                            reactMessage({
                              conversationId,
                              messageId: m.id,
                              emoji,
                            })
                          }
                          onTogglePin={(m) =>
                            pinMessage({
                              conversationId,
                              messageId: m.id,
                              isPinned: !(m.isPinned || m.metadata?.isPinned),
                            })
                          }
                          onToggleBookmarkTag={
                            effectiveShopId
                              ? (messageId, tagId, noteText) =>
                                  toggleMessageBookmarkTag({
                                    shopId: effectiveShopId,
                                    conversationId,
                                    messageId,
                                    tagId,
                                    noteText,
                                  })
                              : undefined
                          }
                          onTranslateMessage={(m) =>
                            translateMessageOrDraft({
                              text: m.content,
                              targetLang: isMe ? "en" : "vi",
                              messageId: m.id,
                              conversationId,
                            })
                          }
                          onToggleCommentVisibility={(m) =>
                            toggleCommentVisibility({
                              conversationId,
                              messageId: m.id,
                              isHidden: !m.metadata?.isHiddenOnPlatform,
                            })
                          }
                          onToggleCommentLike={(m) =>
                            toggleCommentLike({
                              conversationId,
                              messageId: m.id,
                              isLiked: !m.metadata?.isLikedByPage,
                            })
                          }
                          onDeleteCommentOnPlatform={(m) =>
                            setDeleteCommentTarget(m)
                          }
                          onSendPrivateReplyFromComment={async (m) => {
                            const res = await sendPrivateReplyFromComment({
                              conversationId,
                              messageId: m.id,
                              content: `Dạ chào anh/chị ${resolvedHeaderName}, shop xin phép nhắn tin tư vấn chi tiết cho mình về bình luận vừa rồi ạ!`,
                              autoHideComment: true,
                              autoLikeComment: true,
                            });
                            if (res?.linkedInboxConversationId) {
                              router.push(
                                config.routes.private.detailChat(
                                  res.linkedInboxConversationId,
                                ),
                              );
                            }
                          }}
                          onOpenLinkedInboxConversation={(inboxConvId) =>
                            router.push(
                              config.routes.private.detailChat(inboxConvId),
                            )
                          }
                          onVotePoll={(messageId, optionIds) =>
                            votePoll({
                              conversationId,
                              messageId,
                              optionIds,
                            })
                          }
                          onClosePoll={(messageId) =>
                            closePoll({
                              conversationId,
                              messageId,
                            })
                          }
                          onCallbackCall={(callType) =>
                            initiateCall(conversationId, callType)
                          }
                          onScrollToMessage={scrollToMessage}
                          members={currentDetails?.members}
                        />

                        {isMe && msg.status === "failed" && (
                          <div className="w-full flex items-center justify-end gap-2 pr-4 mt-0.5">
                            <span className="inline-flex items-center gap-1 text-[11px] text-destructive font-medium">
                              <AlertCircle className="w-3.5 h-3.5" />
                              {t("sendFailed")}
                            </span>
                            <PatternButton
                              size="sm"
                              variant="ghost"
                              color="info"
                              rounded="full"
                              className="h-6 px-2 text-[11px] text-blue-600 hover:bg-blue-500/10"
                              icon={<RefreshCw className="w-3 h-3" />}
                              onClick={() => handleRetry(msg.id, msg.content)}
                            >
                              {t("retry")}
                            </PatternButton>
                            <PatternButton
                              size="sm"
                              variant="ghost"
                              color="danger"
                              rounded="full"
                              className="h-6 px-2 text-[11px] text-destructive hover:bg-destructive/10"
                              icon={<Trash2 className="w-3 h-3" />}
                              onClick={() => setDeleteFailedTargetId(msg.id)}
                            >
                              {t("delete")}
                            </PatternButton>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <div ref={bottomRef} className="h-px w-full shrink-0" />
          </div>
        </ScrollArea>

        {showScrollButton && (
          <div className="absolute bottom-4 right-1/2 translate-x-1/2 z-30 animate-in slide-in-from-bottom-2 fade-in">
            <PatternButton
              variant="glass"
              size="sm"
              enableGlassPortal={false}
              onClick={() => scrollToBottom("smooth")}
              rounded="full"
              color="primary"
              icon={<ArrowDown className="w-4 h-4 text-muted-foreground" />}
            >
              {unreadCount > 0 ? (
                <span className="font-semibold text-primary text-xs">
                  {t("newMessagesCount", { count: unreadCount })}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  {t("latest")}
                </span>
              )}
            </PatternButton>
          </div>
        )}
      </div>

      <div className="flex-none bg-background p-2.5 sm:p-3 md:p-4 border-t">
        <ChatInput
          onSendMessage={handleSendMessage}
          onSendInternalNote={handleSendInternalNote}
          onSendAttachments={handleSendAttachments}
          onConfirmEdit={handleConfirmEdit}
          onScrollToMessage={scrollToMessage}
          isCollisionLockedByOther={isCollisionLockedByOther}
          isCommentThread={isCommentThread}
          blockState={currentDetails?.blockState}
          onUnblockPartner={() => {
            if (currentDetails?.blockState?.partnerId) {
              toggleBlockUser(
                conversationId,
                currentDetails.blockState.partnerId,
                false,
              );
            }
          }}
        />
      </div>

      <ForwardMessageModal
        open={Boolean(forwardTarget)}
        onOpenChange={(open) => !open && setForwardTarget(null)}
        message={forwardTarget}
      />

      {isGroupChat && (
        <CreateGroupModal
          open={isAddMemberOpen}
          onOpenChange={setIsAddMemberOpen}
          mode="add-members"
          conversationId={conversationId}
          groupName={currentConversation?.name}
        />
      )}

      <ConversationInfoDrawer
        open={isInfoDrawerOpen}
        onOpenChange={setIsInfoDrawerOpen}
        conversationId={conversationId}
        onDeletedConversation={() => router.push(config.routes.private.chat)}
        onLeaveGroup={handleLeaveGroup}
      />

      {effectiveShopId && (
        <>
          <CustomTagManagerModal
            open={isTagManagerOpen}
            onOpenChange={setIsTagManagerOpen}
            shopId={effectiveShopId}
          />

          <TaggedMessagesSheet
            open={isBookmarksSheetOpen}
            onOpenChange={setIsBookmarksSheetOpen}
            shopId={effectiveShopId}
            conversationId={conversationId}
            onJumpToMessage={scrollToMessage}
          />
        </>
      )}

      <ConversationSnoozeAndTimelineSheet
        open={isSnoozeSheetOpen}
        onOpenChange={setIsSnoozeSheetOpen}
        conversationId={conversationId}
        currentSnoozedUntil={
          currentConversation?.snoozedUntilAt || currentDetails?.snoozedUntilAt
        }
        currentSnoozeNote={
          currentConversation?.snoozeNote || currentDetails?.snoozeNote
        }
        members={currentDetails?.members}
        timeline={currentDetails?.accountabilityTimelineJson}
        currentUserId={currentUser.user.id || ""}
      />

      <MaskedVoipCallModal
        customerName={resolvedHeaderName}
        customerAvatar={currentConversation?.avatar}
      />

      <GlassConfirmDialog
        open={Boolean(deleteCommentTarget)}
        onOpenChange={(open) => !open && setDeleteCommentTarget(null)}
        title={tInbox("commentActions.deleteOnPlatformConfirmTitle")}
        description={tInbox("commentActions.deleteOnPlatformConfirmDesc")}
        onConfirm={async () => {
          if (deleteCommentTarget) {
            await deleteCommentOnPlatform({
              conversationId,
              messageId: deleteCommentTarget.id,
            });
            setDeleteCommentTarget(null);
          }
        }}
      />

      <GlassConfirmDialog
        open={Boolean(recallTarget)}
        onOpenChange={(open) => !open && setRecallTarget(null)}
        title={t("recallConfirmTitle")}
        description={t("recallConfirmDesc")}
        onConfirm={async () => {
          if (recallTarget) {
            await recallMessage({
              conversationId,
              messageId: recallTarget.id,
            });
            setRecallTarget(null);
          }
        }}
      />

      <GlassConfirmDialog
        open={Boolean(deleteFailedTargetId)}
        onOpenChange={(open) => !open && setDeleteFailedTargetId(null)}
        onConfirm={() => {
          if (deleteFailedTargetId) {
            handleDeleteFailed(deleteFailedTargetId);
            setDeleteFailedTargetId(null);
          }
        }}
      />

      <GlassConfirmDialog
        open={isLeaveGroupConfirmOpen}
        onOpenChange={setIsLeaveGroupConfirmOpen}
        title={t("leaveGroupConfirmTitle")}
        description={t("leaveGroupConfirmDesc")}
        onConfirm={handleLeaveGroup}
      />

      <GlassConfirmDialog
        open={isDeleteConvConfirmOpen}
        onOpenChange={setIsDeleteConvConfirmOpen}
        title={t("deleteConversationConfirmTitle")}
        description={t("deleteConversationConfirmDesc")}
        onConfirm={async () => {
          const ok = await deleteConversation(conversationId);
          if (ok) {
            router.push(config.routes.private.chat);
          }
        }}
      />
    </div>
  );
}
