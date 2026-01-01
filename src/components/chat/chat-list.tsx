"use client";

import type React from "react";
import { useCallback, useEffect } from "react";
import { ScrollArea } from "../ui/scroll-area";
import { ChatSidebarEmpty } from "./chat-sidebar-empty";
import ChatItem, { ChatItemSkeleton } from "./chat-item";
import { MAP_ARRAY, UNKNOWN } from "@/constant";
import { useShallow } from "zustand/react/shallow";
import { useChatStore } from "@/lib/stores/chat/use-chat-store";
import config from "@/config";
import { useRouter } from "@/i18n/navigation";

export default function ChatList() {
  const router = useRouter();
  const {
    conversations,
    activeConversationId,
    fetchInbox,
    isLoadingInbox,
    inboxMeta,
    typingUsers,
  } = useChatStore(
    useShallow((state) => ({
      conversations: state.conversations,
      activeConversationId: state.activeConversationId,
      fetchInbox: state.fetchInbox,
      isLoadingInbox: state.isLoadingInbox,
      inboxMeta: state.inboxMeta,
      typingUsers: state.typingUsers,
    })),
  );

  useEffect(() => {
    fetchInbox({ page: 1 });
  }, [fetchInbox]);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      if (scrollHeight - scrollTop - clientHeight < 100) {
        if (
          !isLoadingInbox &&
          inboxMeta &&
          inboxMeta.page < inboxMeta.totalPages
        ) {
          fetchInbox({ page: inboxMeta.page + 1 });
        }
      }
    },
    [isLoadingInbox, inboxMeta, fetchInbox],
  );

  const handleSelectChat = useCallback(
    (id: string) => {
      router.push(config.routes.private.detailChat(id));
    },
    [router],
  );
  return (
    <ScrollArea className="h-full w-full flex-1" onScrollCapture={handleScroll}>
      <div className="flex flex-col gap-1.5 px-4 pb-4 pt-1">
        {!isLoadingInbox && conversations.length === 0 && (
          <div className="mt-10 animate-in fade-in zoom-in-95 duration-500">
            <ChatSidebarEmpty />
          </div>
        )}

        {!isLoadingInbox &&
          conversations.map((chat) => (
            <ChatItem
              key={chat.id}
              id={chat.id}
              displayName={chat.name || UNKNOWN}
              avatarFallback={
                chat.name?.substring(0, 2).toUpperCase() || UNKNOWN
              }
              avatarUrl={chat.avatar}
              timestamp={chat.lastMessageAt}
              badge={chat.unreadCount}
              subtitle={chat.lastMessage}
              isSelected={activeConversationId === chat.id}
              isOnline={chat.isOnline}
              onSelect={() => handleSelectChat(chat.id)}
              isTyping={typingUsers[chat.id]?.length > 0}
            />
          ))}

        {isLoadingInbox && (
          <div className="py-2 flex flex-col items-center w-full gap-2">
            {MAP_ARRAY.map((i) => (
              <ChatItemSkeleton key={i} />
            ))}
          </div>
        )}

        {!isLoadingInbox && isLoadingInbox && conversations.length > 0 && (
          <div className="py-4 w-full flex justify-center">
            <div className="h-5 w-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
