/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
/** biome-ignore-all lint/suspicious/noArrayIndexKey: <explanation> */

"use client";

import { useState, useEffect, useMemo } from "react";
import { AlertCircle, RefreshCw, Trash2 } from "lucide-react";
import { MessageBubble } from "@/components/chat/message-bubble";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatInput } from "@/components/chat/chat-input";
import { Button } from "@/components/ui/button";

import { useChatStore } from "@/lib/stores/chat/use-chat-store";
import { useAuthStore } from "@/lib/stores/auth/use-auth-store";
import { useChatScroll } from "@/utils/hooks/use-chat-scroll";
import { useHydratedStore } from "@/utils/hooks/use-hydrated-store";

import { ConversationTypeEnum, MessageTypeEnum } from "@/common/enum";
import { useDateFormat } from "@/utils/hooks/use-date-format";
import { Separator } from "../ui/separator";
import { Spinner } from "../ui/spinner";
import { EMPTY_STRING } from "@/constant";

export default function ChatConversationPage({
  params,
}: {
  params: { id: string };
}) {
  const currentUser = useHydratedStore(useAuthStore, (s) => s.currentAccount);
  const {
    conversations,
    activeConversationId,
    messages,
    messagesMeta,
    typingUsers,
    fetchMessages,
    isLoadingMessages,
    sendMessage,
    resendMessage,
    removeFailedMessage,
  } = useChatStore();
  const { groupMessagesTime } = useDateFormat();

  const rawMessages = useMemo(
    () => (params.id ? messages[params.id] || [] : []),
    [messages, params.id],
  );

  const groupedMessages = useMemo(
    () => groupMessagesTime(rawMessages),
    [rawMessages],
  );

  const currentConversation = useMemo(
    () => conversations.find((c) => c.id === params.id),
    [conversations, params.id],
  );

  const meta = params.id ? messagesMeta[params.id] : null;
  const hasMore = meta ? meta.page < meta.totalPages : true;
  const [currentPage, setCurrentPage] = useState(1);

  const { scrollRef, saveScrollPosition, scrollToBottom } =
    useChatScroll(rawMessages);

  useEffect(() => {
    if (params.id) {
      setCurrentPage(1);
      scrollToBottom();
      fetchMessages(params.id, 1);
    }
  }, [params.id]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = e.currentTarget;
    if (scrollTop === 0 && !isLoadingMessages && hasMore) {
      saveScrollPosition();
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      if (activeConversationId) fetchMessages(activeConversationId, nextPage);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!activeConversationId) return;
    sendMessage({
      conversationId: activeConversationId,
      content,
      type: MessageTypeEnum.TEXT,
    }).then(() => scrollToBottom());
  };

  const handleRetry = (msgId: string, content: string) => {
    if (!activeConversationId) return;
    resendMessage(msgId, {
      conversationId: activeConversationId,
      content,
      type: MessageTypeEnum.TEXT,
    });
  };

  const handleDeleteFailed = (msgId: string) => {
    if (activeConversationId) removeFailedMessage(msgId, activeConversationId);
  };

  if (!currentUser) return null;

  return (
    <div className="flex flex-col h-full bg-background w-full">
      <div className="flex-none z-10">
        <ChatHeader
          displayName={currentConversation?.name || "Unknown"}
          avatarUrl={currentConversation?.avatar}
          isOnline={currentConversation?.isOnline}
          statusText={
            currentConversation?.type === ConversationTypeEnum.GROUP
              ? EMPTY_STRING
              : undefined
          }
        />
        <Separator />
      </div>

      <div className="flex-1 min-h-0 overflow-hidden relative bg-slate-50/50 dark:bg-background">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto p-4 scroll-smooth"
        >
          {isLoadingMessages && currentPage > 1 && (
            <div className="flex justify-center py-4">
              <Spinner className="h-5 w-5 text-muted-foreground/50" />
            </div>
          )}

          {groupedMessages.map((group, gIndex) => (
            <div key={gIndex}>
              <div className="flex justify-center my-4 sticky top-0 z-10">
                <span className="text-[10px] font-medium bg-muted/80 backdrop-blur px-2 py-1 rounded-full text-muted-foreground shadow-sm">
                  {group.label}
                </span>
              </div>

              <div className="space-y-1">
                {group.messages.map((msg, index) => {
                  const isMe = msg.senderId === currentUser.user.id;
                  const isContinuous =
                    index > 0 &&
                    group.messages[index - 1].senderId === msg.senderId;

                  return (
                    <div key={msg.id} className="group relative flex flex-col">
                      <div
                        className={`flex w-full ${isMe ? "justify-end" : "justify-start"} items-end gap-2`}
                      >
                        {isMe && msg.status === "failed" && (
                          <div className="flex flex-col gap-1 mr-1 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-destructive"
                              onClick={() => handleDeleteFailed(msg.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-blue-500"
                              onClick={() => handleRetry(msg.id, msg.content)}
                            >
                              <RefreshCw className="w-3 h-3" />
                            </Button>
                          </div>
                        )}

                        <MessageBubble
                          message={msg}
                          isMe={isMe}
                          isContinuous={isContinuous}
                          avatarUrl={
                            isMe ? currentUser.user.avatar : msg.sender?.avatar
                          }
                          displayName={isMe ? "Tôi" : msg.sender?.name}
                        />

                        {isMe && msg.status === "failed" && (
                          <AlertCircle className="w-4 h-4 text-destructive mb-3 animate-pulse" />
                        )}
                      </div>

                      {isMe && msg.status === "failed" && (
                        <div className="text-[10px] text-destructive text-right pr-2">
                          Gửi thất bại
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {typingUsers[params.id]?.length > 0 && (
            <div className="ml-10 mt-2 mb-4">
              <div className="bg-muted/50 inline-flex items-center px-3 py-1.5 rounded-2xl gap-1">
                <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce"></span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-none bg-background p-4 ">
        <ChatInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
}
