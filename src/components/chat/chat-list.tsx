"use client";

import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollArea } from "../ui/scroll-area";
import { ChatSidebarEmpty } from "./chat-sidebar-empty";
import ChatItem, { ChatItemSkeleton } from "./chat-item";
import { MAP_ARRAY, UNKNOWN } from "@/constant";
import { useShallow } from "zustand/react/shallow";
import { useChatStore } from "@/lib/stores/chat/use-chat-store";
import { useChannelWorkspaceStore } from "@/lib/stores/channel/use-channel-workspace-store";
import config from "@/config";
import { useRouter } from "@/i18n/navigation";
import {
  Bell,
  BellOff,
  Trash2,
  EllipsisVertical,
  CheckCheck,
  Check,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DropdownMenuContentCus,
  GlassBadge,
  ItemMenu,
  PatternButton,
  GlassConfirmDialog,
} from "@/components/toolkit";
import type { IConversation } from "@/types/chat";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/lib/stores/auth/use-auth-store";
import { parseSafeDate } from "@/utils/date-helper";

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
  const channels = useChannelWorkspaceStore((s) => s.channels);
  const selectedChannelIds = useChannelWorkspaceStore(
    (s) => s.selectedChannelIds,
  );

  const channelMap = useMemo(() => {
    const map = new Map<
      string,
      { pageShortCode: string; channelType: string }
    >();
    for (const ch of channels) {
      map.set(ch.id, {
        pageShortCode: ch.pageShortCode,
        channelType: ch.channelType,
      });
    }
    return map;
  }, [channels]);

  const filteredConversations = useMemo(() => {
    if (channels.length === 0 || selectedChannelIds.length === 0) {
      return conversations;
    }
    return conversations.filter(
      (c) =>
        !c.channelIntegrationId ||
        selectedChannelIds.includes(c.channelIntegrationId),
    );
  }, [conversations, channels.length, selectedChannelIds]);

  const tHeader = useTranslations("Chat.Detail.header.actions");
  const [deleteTarget, setDeleteTarget] = useState<IConversation | null>(null);

  const tConv = useTranslations("Chat.Detail.conversation");
  const tSidebar = useTranslations("Chat.Sidebar");
  const currentUserId = useAuthStore((s) => s.currentAccount?.user?.id);
  const { toggleMuteConversation, deleteConversation, purgeExpiredMessages } =
    useChatStore();

  useEffect(() => {
    const hasExpiringPreview = conversations.some((c) =>
      Boolean(c.lastMessageExpiresAt || c.disappearingTtl),
    );
    if (!hasExpiringPreview) return;

    const timer = setInterval(() => {
      purgeExpiredMessages();
    }, 1000);
    return () => clearInterval(timer);
  }, [conversations, purgeExpiredMessages]);

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
        {!isLoadingInbox && filteredConversations.length === 0 && (
          <div className="mt-10 animate-in fade-in zoom-in-95 duration-500">
            <ChatSidebarEmpty />
          </div>
        )}

        {filteredConversations.map((chat) => {
          const isSelected = activeConversationId === chat.id;
          const unreadBadge = isSelected
            ? 0
            : Math.max(0, Number(chat.unreadCount || 0));

          const isLastMsgExpired = Boolean(
            chat.lastMessageExpiresAt &&
              (parseSafeDate(chat.lastMessageExpiresAt)?.getTime() ?? 0) <=
                Date.now(),
          );
          const safeLastMessage = isLastMsgExpired ? null : chat.lastMessage;
          const isMyLastMsg = Boolean(
            safeLastMessage &&
              currentUserId &&
              chat.lastMessageSenderId === currentUserId,
          );

          const channelInfo = chat.channelIntegrationId
            ? channelMap.get(chat.channelIntegrationId)
            : null;

          const formattedSubtitle = (
            <span className="inline-flex items-center gap-1.5 truncate w-full">
              {channelInfo && (
                <GlassBadge
                  variant="primary"
                  size="sm"
                  className="px-1.5 py-0 text-[9px] shrink-0"
                >
                  {channelInfo.pageShortCode}
                </GlassBadge>
              )}
              {safeLastMessage ? (
                isMyLastMsg ? (
                  <span className="inline-flex items-center gap-1 truncate min-w-0">
                    {chat.lastMessageStatus === "read" ? (
                      <CheckCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ) : chat.lastMessageStatus === "delivered" ? (
                      <CheckCheck className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    ) : (
                      <Check className="w-3 h-3 text-muted-foreground/80 shrink-0" />
                    )}
                    <span className="truncate">
                      {tConv("me")}: {safeLastMessage}
                    </span>
                  </span>
                ) : (
                  <span className="truncate">{safeLastMessage}</span>
                )
              ) : (
                <span className="truncate">{tSidebar("item.noMessages")}</span>
              )}
            </span>
          );

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
              subtitle={formattedSubtitle}
              isSelected={isSelected}
              isOnline={chat.isOnline}
              isMuted={chat.isMuted}
              onSelect={() => handleSelectChat(chat.id)}
              isTyping={(typingUsers[chat.id]?.length || 0) > 0}
              actions={
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <PatternButton
                      variant="ghost"
                      size="icon"
                      rounded="full"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <EllipsisVertical className="h-4 w-4 text-muted-foreground" />
                    </PatternButton>
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

      <GlassConfirmDialog
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
