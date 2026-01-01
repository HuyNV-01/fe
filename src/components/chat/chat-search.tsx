"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { User, MessageSquarePlus } from "lucide-react";
import {
  LiquidSearch,
  type SearchResultItem,
  type SearchGroup,
} from "@/components/input/liquid-search";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { useChatStore } from "@/lib/stores/chat/use-chat-store";
import { useDebounce } from "@/utils/hooks/use-debounce";
import { getInitials } from "@/utils/helper";
import {
  DEFAULT_LIMIT_SEARCH,
  DEFAULT_PAGE,
  EMPTY_STRING,
  UNKNOWN,
} from "@/constant";
import { cn } from "@/lib/utils";
import config from "@/config";
import { useTranslations } from "next-intl";

export function ChatSearch() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 500);
  const t = useTranslations("Chat.Sidebar.header");

  const {
    tempConversations,
    fetchInbox,
    resetTempConversations,
    isLoadingSearch,
  } = useChatStore();

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      resetTempConversations();
      return;
    }

    fetchInbox({
      search: debouncedQuery,
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

  const renderUserItem = useCallback((item: SearchResultItem) => {
    const initials = getInitials(item.title?.toString() || "");
    return (
      <div className="flex items-center gap-3 w-full p-1 group/item">
        <div className="relative shrink-0">
          <Avatar
            className={cn(
              "h-10 w-10 border border-white/10 shadow-sm transition-all duration-300",
              "group-aria-selected/item:scale-105 group-aria-selected/item:border-primary/30",
            )}
          >
            <AvatarImage
              src={item.avatar}
              alt={item.title?.toString()}
              className="object-cover"
            />
            <AvatarFallback
              className={cn(
                "bg-primary/5 text-primary text-xs font-bold transition-colors",
                "group-aria-selected/item:bg-primary group-aria-selected/item:text-primary-foreground",
              )}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="flex flex-col min-w-0 flex-1 gap-0.5">
          <div className="flex items-center justify-between">
            <span
              className={cn(
                "text-sm font-medium leading-none truncate transition-colors",
                "text-foreground/80 group-aria-selected/item:text-foreground",
              )}
            >
              {item.title}
            </span>

            <div className="ml-2 shrink-0">
              <MessageSquarePlus
                className={cn("h-4 w-4 transition-all duration-300")}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }, []);

  const searchGroups: SearchGroup[] = useMemo(() => {
    if (!tempConversations?.length) return [];

    return [
      {
        heading: t("search.category.user"),
        items: tempConversations.map((temp) => ({
          id: temp.id || EMPTY_STRING,
          title: temp.name || UNKNOWN,
          avatar: temp.avatar,
          icon: <User className="h-4 w-4" />,
        })),
      },
    ];
  }, [tempConversations, t]);

  return (
    <LiquidSearch
      mode="inline"
      value={query}
      onSearch={setQuery}
      loading={isLoadingSearch}
      results={searchGroups}
      shouldFilter={false}
      maxHeight="400px"
      renderItem={renderUserItem}
      onItemSelect={handleSelectInbox}
      labels={{
        placeholder: t("search.placeholder"),
        emptyMessage: t("search.empty"),
      }}
    />
  );
}
