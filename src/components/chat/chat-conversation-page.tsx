/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
/** biome-ignore-all lint/suspicious/noArrayIndexKey: <explanation> */

"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  ArrowDown,
  Loader2,
  Trash2,
  RefreshCw,
  AlertCircle,
  Pin,
  X,
} from "lucide-react";
import { MessageBubble } from "@/components/chat/message-bubble";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatInput } from "@/components/chat/chat-input";
import { CreateGroupModal } from "@/components/chat/create-group-modal";
import { Button } from "@/components/ui/button";
import { PatternButton } from "../button/button-patterns";

import { useChatStore } from "@/lib/stores/chat/use-chat-store";
import { useAuthStore } from "@/lib/stores/auth/use-auth-store";
import { useHydratedStore } from "@/utils/hooks/use-hydrated-store";
import { useDateFormat } from "@/utils/hooks/use-date-format";
import { useChatScroll } from "@/utils/hooks/use-chat-scroll";
import {
  CallTypeEnum,
  ConversationTypeEnum,
  MessageTypeEnum,
} from "@/common/enum";
import { useRouter } from "@/i18n/navigation";
import config from "@/config";

interface ChatConversationPageProps {
  params: { id: string };
}

export default function ChatConversationPage({
  params,
}: ChatConversationPageProps) {
  const router = useRouter();
  const currentUser = useHydratedStore(useAuthStore, (s) => s.currentAccount);

  const {
    conversations,
    messages,
    messagesMeta,
    typingUsers,
    uploadProgress,
    fetchMessages,
    isLoadingMessages,
    sendMessage,
    sendAttachmentMessage,
    editMessage,
    recallMessage,
    reactMessage,
    pinMessage,
    setReplyingTo,
    setEditingMessage,
    initiateCall,
    toggleMuteConversation,
    removeGroupMember,
    setActiveConversation,
    resendMessage,
    removeFailedMessage,
  } = useChatStore();

  const { groupMessagesTime } = useDateFormat();
  const conversationId = params?.id || "";

  const [currentPage, setCurrentPage] = useState(1);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState<
    string | null
  >(null);
  const highlightTimerRef = useRef<NodeJS.Timeout | null>(null);

  const currentConversation = useMemo(
    () => conversations.find((c) => c.id === conversationId),
    [conversations, conversationId],
  );

  const isGroupChat = currentConversation?.type === ConversationTypeEnum.GROUP;

  const rawMessages = useMemo(
    () => (conversationId ? messages[conversationId] || [] : []),
    [messages, conversationId],
  );

  const pinnedMessage = useMemo(
    () =>
      [...rawMessages]
        .reverse()
        .find(
          (m) => (m.isPinned || m.metadata?.isPinned) && m.status !== "removed",
        ),
    [rawMessages],
  );

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

  useEffect(() => {
    if (conversationId) {
      setActiveConversation(conversationId);
      setCurrentPage(1);
      fetchMessages(conversationId, 1);
    }
    return () => {
      setActiveConversation(null);
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
      }
    };
  }, [conversationId, fetchMessages, setActiveConversation]);

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
      }, 2200);
    }
  }, []);

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
              name: reader.name || "Unknown",
              avatar: reader.avatar || null,
            });

            processedUserIds.add(reader.id);
          }
        });
      }
    });

    return map;
  }, [rawMessages, currentUser?.user?.id]);

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!conversationId) return;
      await sendMessage({
        conversationId,
        content,
        type: MessageTypeEnum.TEXT,
      });
      scrollToBottom("smooth");
    },
    [conversationId, sendMessage, scrollToBottom],
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

  return (
    <div className="flex flex-col h-full bg-background w-full overflow-hidden relative">
      {/* Header */}
      <div className="flex-none z-20 bg-background/95 backdrop-blur border-b">
        <ChatHeader
          displayName={currentConversation?.name || "Người dùng"}
          avatarUrl={currentConversation?.avatar}
          isOnline={currentConversation?.isOnline}
          isTyping={isPartnerTyping}
          isMuted={currentConversation?.isMuted}
          isGroupChat={isGroupChat}
          isAdmin={currentConversation?.isAdmin}
          partnerId={currentConversation?.partnerId}
          onAudioCall={() => initiateCall(conversationId, CallTypeEnum.AUDIO)}
          onVideoCall={() => initiateCall(conversationId, CallTypeEnum.VIDEO)}
          onToggleMute={() =>
            toggleMuteConversation(
              conversationId,
              !currentConversation?.isMuted,
            )
          }
          onAddGroupMembers={() => setIsAddMemberOpen(true)}
          onLeaveGroup={handleLeaveGroup}
        />

        {/* Thanh hiển thị Tin nhắn đã ghim */}
        {pinnedMessage && (
          <div className="flex items-center justify-between gap-2 px-4 py-1.5 bg-primary/5 border-t text-xs">
            <button
              type="button"
              onClick={() => scrollToMessage(pinnedMessage.id)}
              className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer hover:opacity-85"
            >
              <Pin className="w-3.5 h-3.5 text-primary shrink-0 rotate-45" />
              <span className="font-semibold text-primary shrink-0">
                Tin nhắn đã ghim:
              </span>
              <span className="truncate text-muted-foreground">
                {pinnedMessage.content}
              </span>
            </button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full shrink-0"
              onClick={() =>
                pinMessage({
                  conversationId,
                  messageId: pinnedMessage.id,
                  isPinned: false,
                })
              }
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Message Area */}
      <div className="flex-1 min-h-0 relative bg-slate-50/50 dark:bg-background/50">
        <div
          ref={scrollRef}
          onScroll={onContainerScroll}
          className="h-full overflow-y-auto overflow-x-hidden px-2 md:px-4 pt-4 pb-2 scroll-smooth [overflow-anchor:none]"
        >
          <div
            ref={contentRef}
            className="flex flex-col min-h-full justify-end"
          >
            {/* Top Loader */}
            {isLoadingMessages && currentPage > 1 && (
              <div className="flex justify-center w-full py-4 animate-in fade-in zoom-in duration-300">
                <Loader2 className="h-5 w-5 text-primary/60 animate-spin" />
              </div>
            )}

            {/* Message List */}
            {groupedMessages.map((group, gIndex) => (
              <div key={`${group.label}-${gIndex}`} className="mb-6">
                <div className="flex justify-center mb-4 sticky top-0 z-10 pointer-events-none">
                  <span className="text-[10px] font-medium bg-muted/90 backdrop-blur-md px-3 py-1 rounded-full border border-border/40 select-none shadow-2xs">
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
                          currentUserId={currentUser.user.id}
                          isMe={isMe}
                          isGroupChat={isGroupChat}
                          isContinuous={!!isContinuous}
                          isLastInGroup={isLastInGroup}
                          isHighlighted={highlightedMessageId === msg.id}
                          avatarUrl={
                            isMe
                              ? currentUser.user.avatar || undefined
                              : msg.sender?.avatar || undefined
                          }
                          displayName={isMe ? "Tôi" : msg.sender?.name}
                          displayReaders={readReceiptsMap[msg.id]}
                          uploadPercent={
                            msg.tempId ? uploadProgress[msg.tempId] : undefined
                          }
                          onReply={(m) => setReplyingTo(conversationId, m)}
                          onEdit={(m) => setEditingMessage(conversationId, m)}
                          onRecall={(m) =>
                            recallMessage({
                              conversationId,
                              messageId: m.id,
                            })
                          }
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
                          onCallbackCall={(callType) =>
                            initiateCall(conversationId, callType)
                          }
                          onScrollToMessage={scrollToMessage}
                        />

                        {/* Thanh hành động Gửi lại / Xóa khi gửi lỗi */}
                        {isMe && msg.status === "failed" && (
                          <div className="w-full flex items-center justify-end gap-2 pr-4 mt-0.5">
                            <span className="inline-flex items-center gap-1 text-[11px] text-destructive font-medium">
                              <AlertCircle className="w-3.5 h-3.5" />
                              Gửi thất bại
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-[11px] text-blue-600 hover:bg-blue-500/10 rounded-full"
                              onClick={() => handleRetry(msg.id, msg.content)}
                            >
                              <RefreshCw className="w-3 h-3 mr-1" />
                              Thử lại
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-[11px] text-destructive hover:bg-destructive/10 rounded-full"
                              onClick={() => handleDeleteFailed(msg.id)}
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Xóa
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Bottom Anchor */}
            <div ref={bottomRef} className="h-px w-full shrink-0" />
          </div>
        </div>

        {/* Scroll Button */}
        {showScrollButton && (
          <div className="absolute bottom-4 right-1/2 translate-x-1/2 z-30 animate-in slide-in-from-bottom-2 fade-in">
            <PatternButton
              variant="glass"
              size="sm"
              onClick={() => scrollToBottom("smooth")}
              rounded="full"
              color="primary"
              icon={<ArrowDown className="w-4 h-4 text-muted-foreground" />}
            >
              {unreadCount > 0 ? (
                <span className="font-semibold text-primary text-xs">
                  {unreadCount} tin mới
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">Mới nhất</span>
              )}
            </PatternButton>
          </div>
        )}
      </div>

      <div className="flex-none bg-background p-3 md:p-4 border-t">
        <ChatInput
          onSendMessage={handleSendMessage}
          onSendAttachments={handleSendAttachments}
          onConfirmEdit={handleConfirmEdit}
          onScrollToMessage={scrollToMessage}
        />
      </div>

      {isGroupChat && (
        <CreateGroupModal
          open={isAddMemberOpen}
          onOpenChange={setIsAddMemberOpen}
          mode="add-members"
          conversationId={conversationId}
          groupName={currentConversation?.name}
        />
      )}
    </div>
  );
}
