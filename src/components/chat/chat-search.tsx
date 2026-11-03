"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { User, UsersRound, MessageSquarePlus } from "lucide-react";
import {
  LiquidSearch,
  GlassAvatar,
  GlassBadge,
  type SearchResultItem,
  type SearchGroup,
} from "@/components/toolkit";

import {
  matchConversationBySearchRule,
  useChatStore,
} from "@/lib/stores/chat/use-chat-store";
import { useAuthStore } from "@/lib/stores/auth/use-auth-store";
import { useContactStore } from "@/lib/stores/contact/use-contact-store";
import { useDebounce } from "@/utils/hooks/use-debounce";
import {
  DEFAULT_LIMIT_SEARCH,
  DEFAULT_PAGE,
  EMPTY_STRING,
  UNKNOWN,
} from "@/constant";
import { ConversationTypeEnum } from "@/common/enum";
import { cn } from "@/lib/utils";
import config from "@/config";
import { useTranslations } from "next-intl";
import type { IConversation } from "@/types/chat";

/**
 * Thanh tìm kiếm cuộc trò chuyện thông minh:
 * - Tối ưu hóa bằng useDebounce để tránh re-render liên tục khi gõ phím.
 * - Trò chuyện 1-1 (DIRECT): Lọc theo Tên hiển thị (name), Biệt danh (nickname) và Email; tự động loại bỏ người dùng bị chặn.
 * - Trò chuyện nhóm (GROUP): Chỉ lọc theo Tên nhóm (group name), bỏ qua hoàn toàn email/biệt danh của thành viên.
 */
export function ChatSearch() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 350);
  const t = useTranslations("Chat.Sidebar.header");

  const currentUserId = useAuthStore((s) => s.currentAccount?.user?.id);
  const blockedUsers = useContactStore((s) => s.blockedUsers);

  const {
    conversations,
    tempConversations,
    conversationDetails,
    fetchInbox,
    resetTempConversations,
    isLoadingSearch,
  } = useChatStore();

  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (!trimmed) {
      resetTempConversations();
      return;
    }

    fetchInbox({
      search: trimmed,
      page: DEFAULT_PAGE,
      limit: DEFAULT_LIMIT_SEARCH,
    });
  }, [debouncedQuery, fetchInbox, resetTempConversations]);

  const handleSelectInbox = useCallback(
    async (inboxItem: SearchResultItem) => {
      const inboxId = inboxItem.id;
      if (!inboxId) return;

      setQuery("");
      resetTempConversations();
      router.push(config.routes.private.detailChat(inboxId));
    },
    [router, resetTempConversations],
  );

  const filteredConversations = useMemo(() => {
    const trimmed = debouncedQuery.trim();
    if (!trimmed) return [];

    const blockedSet = new Set(
      blockedUsers.map((b) => b.contactUser?.id || b.contactId),
    );

    const combinedMap = new Map<string, IConversation>();
    for (const conv of conversations) {
      combinedMap.set(conv.id, conv);
    }
    for (const temp of tempConversations) {
      combinedMap.set(temp.id, {
        ...(combinedMap.get(temp.id) || {}),
        ...temp,
      });
    }

    return Array.from(combinedMap.values()).filter((conv) => {
      if (
        conv.type === ConversationTypeEnum.DIRECT &&
        conv.partnerId &&
        blockedSet.has(conv.partnerId)
      ) {
        return false;
      }

      return matchConversationBySearchRule(
        conv,
        trimmed,
        conversationDetails[conv.id],
        currentUserId,
      );
    });
  }, [
    debouncedQuery,
    conversations,
    tempConversations,
    conversationDetails,
    currentUserId,
    blockedUsers,
  ]);

  const renderConversationItem = useCallback((item: SearchResultItem) => {
    const isGroup = item.convType === ConversationTypeEnum.GROUP;

    return (
      <div className="flex items-center gap-3 w-full p-1 group/item">
        <GlassAvatar
          src={item.avatar}
          name={item.title?.toString() || "U"}
          size="md"
          className="transition-all duration-300 group-aria-selected/item:scale-105"
        />

        <div className="flex flex-col min-w-0 flex-1 gap-0.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className={cn(
                  "text-sm font-medium leading-none truncate transition-colors",
                  "text-foreground/80 group-aria-selected/item:text-foreground",
                )}
              >
                {item.title}
              </span>
              {!isGroup && item.originalName && item.hasNickname && (
                <GlassBadge
                  variant="secondary"
                  size="sm"
                  className="max-w-[110px] truncate text-[10px]"
                >
                  {item.originalName}
                </GlassBadge>
              )}
            </div>

            <div className="ml-2 shrink-0">
              <MessageSquarePlus className="h-4 w-4 transition-all duration-300 text-muted-foreground group-aria-selected/item:text-primary" />
            </div>
          </div>

          {!isGroup && item.description && (
            <span className="text-[11px] text-muted-foreground truncate font-mono">
              {item.description}
            </span>
          )}
        </div>
      </div>
    );
  }, []);

  const searchGroups: SearchGroup[] = useMemo(() => {
    if (!filteredConversations.length) return [];

    const directItems: SearchResultItem[] = [];
    const groupItems: SearchResultItem[] = [];

    for (const conv of filteredConversations) {
      const details = conversationDetails[conv.id];
      const partnerMember = details?.members?.find(
        (m) => m.userId !== currentUserId,
      );

      if (conv.type === ConversationTypeEnum.GROUP) {
        groupItems.push({
          id: conv.id || EMPTY_STRING,
          title: conv.name || UNKNOWN,
          avatar: conv.avatar,
          convType: ConversationTypeEnum.GROUP,
          icon: <UsersRound className="h-4 w-4" />,
        });
      } else {
        const nickname = conv.partnerNickname || partnerMember?.nickname;
        const originalName =
          conv.originalName || partnerMember?.name || conv.name;
        const email = conv.partnerEmail || partnerMember?.email || "";

        directItems.push({
          id: conv.id || EMPTY_STRING,
          title: nickname || originalName || UNKNOWN,
          originalName,
          hasNickname: Boolean(nickname && nickname !== originalName),
          description: email || undefined,
          avatar: conv.avatar,
          convType: ConversationTypeEnum.DIRECT,
          icon: <User className="h-4 w-4" />,
        });
      }
    }

    const groups: SearchGroup[] = [];
    if (directItems.length > 0) {
      groups.push({
        heading: t("search.category.user"),
        items: directItems,
      });
    }
    if (groupItems.length > 0) {
      groups.push({
        heading: t("search.category.group"),
        items: groupItems,
      });
    }

    return groups;
  }, [filteredConversations, conversationDetails, currentUserId, t]);

  return (
    <LiquidSearch
      mode="inline"
      value={query}
      onSearch={setQuery}
      loading={isLoadingSearch && query === debouncedQuery}
      results={searchGroups}
      shouldFilter={false}
      maxHeight="400px"
      renderItem={renderConversationItem}
      onItemSelect={handleSelectInbox}
      labels={{
        placeholder: t("search.placeholder"),
        emptyMessage: t("search.empty"),
      }}
    />
  );
}
