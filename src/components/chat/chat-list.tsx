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
import { useState } from "react";
import { Bell, BellOff, Trash2, EllipsisVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DropdownMenuContentCus from "@/components/dropdown-menu/dropdown-menu-content-cus";
import ItemMenu from "@/components/dropdown-menu/item-menu";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteModal } from "@/components/common/confirm-delete-modal";
import type { IConversation } from "@/types/chat";
import { useTranslations } from "next-intl";

export default function ChatList() {
  const router = useRouter();
  const {
    conversations,
    activeConversationId,
    fetchInbox,
    markConversationReadOptimistic,
    isLoadingInbox,
    inboxMeta,
    typingUsers,
  } = useChatStore(
    useShallow((state) => ({
      conversations: state.conversations,
      activeConversationId: state.activeConversationId,
      fetchInbox: state.fetchInbox,
      markConversationReadOptimistic: state.markConversationReadOptimistic,
      isLoadingInbox: state.isLoadingInbox,
      inboxMeta: state.inboxMeta,
      typingUsers: state.typingUsers,
    })),
  );
  const tHeader = useTranslations("Chat.Detail.header.actions");
  const [deleteTarget, setDeleteTarget] = useState<IConversation | null>(null);
  const { toggleMuteConversation, deleteConversation } = useChatStore();

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
      markConversationReadOptimistic(id);
      router.push(config.routes.private.detailChat(id));
    },
    [markConversationReadOptimistic, router],
  );

  const showInitialSkeleton = isLoadingInbox && conversations.length === 0;

  return (
    <ScrollArea className="h-full w-full flex-1" onScrollCapture={handleScroll}>
      <div className="flex flex-col gap-1.5 px-2.5 sm:px-3 pb-4 pt-1">
        {!isLoadingInbox && conversations.length === 0 && (
          <div className="mt-10 animate-in fade-in zoom-in-95 duration-500">
            <ChatSidebarEmpty />
          </div>
        )}

        {conversations.map((chat) => {
          const isSelected = activeConversationId === chat.id;
          const unreadBadge = isSelected
            ? 0
            : Math.max(0, Number(chat.unreadCount || 0));

          return (
            <ChatItem
              key={chat.id}
              id={chat.id}
              displayName={chat.name || UNKNOWN}
              avatarFallback={
                chat.name?.substring(0, 2).toUpperCase() || UNKNOWN
              }
              avatarUrl={chat.avatar}
              timestamp={chat.lastMessageAt}
              badge={unreadBadge}
              subtitle={chat.lastMessage}
              isSelected={isSelected}
              isOnline={chat.isOnline}
              isMuted={chat.isMuted}
              onSelect={() => handleSelectChat(chat.id)}
              isTyping={(typingUsers[chat.id]?.length || 0) > 0}
              actions={
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <EllipsisVertical className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContentCus
                    align="end"
                    className="w-48"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ItemMenu
                      onClick={() =>
                        toggleMuteConversation(chat.id, !chat.isMuted)
                      }
                      icon={
                        chat.isMuted ? (
                          <Bell className="w-4 h-4 mr-2" />
                        ) : (
                          <BellOff className="w-4 h-4 mr-2" />
                        )
                      }
                    >
                      {chat.isMuted ? tHeader("unmute") : tHeader("mute")}
                    </ItemMenu>
                    <ItemMenu
                      onClick={() => setDeleteTarget(chat)}
                      className="text-red-600 focus:text-red-600"
                      icon={<Trash2 className="w-4 h-4 mr-2 text-red-600" />}
                    >
                      {tHeader("deleteConversation")}
                    </ItemMenu>
                  </DropdownMenuContentCus>
                </DropdownMenu>
              }
            />
          );
        })}

        {showInitialSkeleton && (
          <div className="py-2 flex flex-col items-center w-full gap-2">
            {MAP_ARRAY.map((i) => (
              <ChatItemSkeleton key={i} />
            ))}
          </div>
        )}
      </div>

      <ConfirmDeleteModal
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        itemName={deleteTarget?.name}
        onConfirm={async () => {
          if (deleteTarget) {
            const ok = await deleteConversation(deleteTarget.id);
            if (ok && activeConversationId === deleteTarget.id) {
              router.push(config.routes.private.chat);
            }
            setDeleteTarget(null);
          }
        }}
      />
    </ScrollArea>
  );
}
