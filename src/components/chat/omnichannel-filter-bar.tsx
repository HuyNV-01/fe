"use client";

import React, { useState } from "react";
import {
  Filter,
  AlertTriangle,
  Clock,
  Phone,
  ShoppingBag,
  Tag,
  RotateCcw,
  CheckSquare,
  Layers,
  MessageSquare,
  RefreshCw,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  GlassIconButton,
  PatternButton,
  DropdownMenuContentCus,
  ScrollArea,
  ScrollBar,
  TruncatedText,
} from "@/components/toolkit";
import { useChatStore } from "@/lib/stores/chat/use-chat-store";
import { useChannelWorkspaceStore } from "@/lib/stores/channel/use-channel-workspace-store";
import { useTagStore } from "@/lib/stores/tags/use-tag-store";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuTrigger } from "../ui/dropdown-menu";

export interface OmnichannelFilterBarProps {
  shopId: string;
  selectedConversationIds?: string[];
  onClearBulkSelection?: () => void;
}

export const OmnichannelFilterBar = ({
  shopId,
  selectedConversationIds = [],
  onClearBulkSelection,
}: OmnichannelFilterBarProps) => {
  const t = useTranslations("OmnichannelInbox.filters");
  const tTag = useTranslations("TaggingSystem");

  const filter = useChatStore((s) => s.omnichannelFilter);
  const summaryCounts = useChatStore((s) => s.omnichannelSummaryCounts);
  const setOmnichannelFilter = useChatStore((s) => s.setOmnichannelFilter);
  const resetOmnichannelFilter = useChatStore((s) => s.resetOmnichannelFilter);
  const queryOmnichannelInbox = useChatStore((s) => s.queryOmnichannelInbox);

  const tags = useTagStore((s) => s.tags);
  const bulkAssignConversationTags = useTagStore(
    (s) => s.bulkAssignConversationTags,
  );
  const fetchInbox = useChatStore((s) => s.fetchInbox);
  const syncAllShopPostsComments = useChannelWorkspaceStore(
    (s) => s.syncAllShopPostsComments,
  );
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isSyncingOrganicComments, setIsSyncingOrganicComments] =
    useState(false);

  const handleSyncOrganicComments = async () => {
    if (!shopId || isSyncingOrganicComments) return;
    setIsSyncingOrganicComments(true);
    try {
      const res = await syncAllShopPostsComments(shopId);
      await Promise.all([
        fetchInbox({ page: 1 }),
        queryOmnichannelInbox(shopId),
      ]);
      showSuccessToast(
        t("syncedOrganicCommentsToast", {
          count: res?.newCommentsSynced || 0,
        }),
      );
    } catch (err: any) {
      showErrorToast(err?.response?.data?.message || "Failed");
    } finally {
      setIsSyncingOrganicComments(false);
    }
  };

  const applyPatch = (patch: Record<string, any>) => {
    setOmnichannelFilter(patch);
    if (shopId) {
      queryOmnichannelInbox(shopId, patch);
    }
  };

  const handleToggleIncludeTag = (tagId: string) => {
    const current = new Set(filter.includeTagIds || []);
    if (current.has(tagId)) current.delete(tagId);
    else current.add(tagId);
    applyPatch({ includeTagIds: Array.from(current) });
  };

  const handleToggleExcludeTag = (tagId: string) => {
    const current = new Set(filter.excludeTagIds || []);
    if (current.has(tagId)) current.delete(tagId);
    else current.add(tagId);
    applyPatch({ excludeTagIds: Array.from(current) });
  };

  const activeCriteriaCount = [
    filter.unreadOnly,
    filter.unrepliedOnly,
    filter.ghostedByAgentOnly,
    filter.slaBreachedOnly,
    filter.window24hExpiringOnly,
    filter.snoozedOnly,
    filter.hasPhone,
    filter.noPhone,
    filter.hasOrder,
    filter.noOrder,
    filter.interactionType,
    (filter.includeTagIds?.length || 0) > 0,
    (filter.excludeTagIds?.length || 0) > 0,
  ].filter(Boolean).length;

  return (
    <div className="px-2.5 sm:px-3 py-1.5 border-b border-border/40 bg-muted/10 space-y-1.5">
      {/* Thanh chọn nhanh các bộ lọc trọng yếu (Ghosted, Chờ trả lời, Quá hạn SLA, Có SĐT, Chưa lên đơn) */}
      <div className="flex items-center gap-1.5">
        <ScrollArea className="flex-1 min-w-0 whitespace-nowrap">
          <div className="flex items-center gap-1.5 w-max">
            <TruncatedText
              onlyWhenTruncated={false}
              tooltipContent={t("all")}
              className="inline-flex"
            >
              <PatternButton
                type="button"
                size="icon"
                rounded="full"
                variant={activeCriteriaCount === 0 ? "solid" : "outline"}
                color={activeCriteriaCount === 0 ? "primary" : "neutral"}
                onClick={() => {
                  resetOmnichannelFilter();
                  if (shopId) queryOmnichannelInbox(shopId, {});
                }}
                className="h-7 w-7 shrink-0"
              >
                <Layers className="w-3.5 h-3.5 shrink-0" />
              </PatternButton>
            </TruncatedText>

            <TruncatedText
              onlyWhenTruncated={false}
              tooltipContent={t("ghosted", {
                count: summaryCounts?.ghostedCount || 0,
              })}
              className="inline-flex"
            >
              <PatternButton
                type="button"
                size="icon"
                rounded="full"
                variant={filter.ghostedByAgentOnly ? "solid" : "outline"}
                color="danger"
                onClick={() =>
                  applyPatch({
                    ghostedByAgentOnly: !filter.ghostedByAgentOnly,
                    unrepliedOnly: undefined,
                  })
                }
                className={cn(
                  "h-7 w-7 shrink-0",
                  !filter.ghostedByAgentOnly &&
                    "border-red-500/40 text-red-600 dark:text-red-400 bg-red-500/10",
                )}
              >
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              </PatternButton>
            </TruncatedText>

            <TruncatedText
              onlyWhenTruncated={false}
              tooltipContent={t("unreplied")}
              className="inline-flex"
            >
              <PatternButton
                type="button"
                size="icon"
                rounded="full"
                variant={filter.unrepliedOnly ? "solid" : "outline"}
                color={filter.unrepliedOnly ? "warning" : "neutral"}
                onClick={() =>
                  applyPatch({
                    unrepliedOnly: !filter.unrepliedOnly,
                    ghostedByAgentOnly: undefined,
                  })
                }
                className="h-7 w-7 shrink-0"
              >
                <Clock className="w-3.5 h-3.5 shrink-0" />
              </PatternButton>
            </TruncatedText>

            <TruncatedText
              onlyWhenTruncated={false}
              tooltipContent={t("hasPhone")}
              className="inline-flex"
            >
              <PatternButton
                type="button"
                size="icon"
                rounded="full"
                variant={filter.hasPhone ? "solid" : "outline"}
                color={filter.hasPhone ? "success" : "neutral"}
                onClick={() =>
                  applyPatch({
                    hasPhone: !filter.hasPhone,
                    noPhone: undefined,
                  })
                }
                className="h-7 w-7 shrink-0"
              >
                <Phone className="w-3.5 h-3.5 shrink-0" />
              </PatternButton>
            </TruncatedText>

            <TruncatedText
              onlyWhenTruncated={false}
              tooltipContent={t("unconfirmedOrder")}
              className="inline-flex"
            >
              <PatternButton
                type="button"
                size="icon"
                rounded="full"
                variant={filter.noOrder ? "solid" : "outline"}
                color={filter.noOrder ? "info" : "neutral"}
                onClick={() =>
                  applyPatch({
                    hasPhone: true,
                    noOrder: !filter.noOrder,
                  })
                }
                className="h-7 w-7 shrink-0"
              >
                <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
              </PatternButton>
            </TruncatedText>

            <TruncatedText
              onlyWhenTruncated={false}
              tooltipContent={t("commentsOnlyTooltip")}
              className="inline-flex"
            >
              <PatternButton
                type="button"
                size="icon"
                rounded="full"
                variant={
                  filter.interactionType === "COMMENT" ? "solid" : "outline"
                }
                color={
                  filter.interactionType === "COMMENT" ? "primary" : "neutral"
                }
                onClick={() =>
                  applyPatch({
                    interactionType:
                      filter.interactionType === "COMMENT"
                        ? undefined
                        : "COMMENT",
                  })
                }
                className="h-7 w-7 shrink-0"
              >
                <MessageSquare className="w-3.5 h-3.5 shrink-0" />
              </PatternButton>
            </TruncatedText>

            <TruncatedText
              onlyWhenTruncated={false}
              tooltipContent={t("syncOrganicCommentsTooltip")}
              className="inline-flex"
            >
              <PatternButton
                type="button"
                size="icon"
                rounded="full"
                variant="outline"
                color="info"
                isLoading={isSyncingOrganicComments}
                onClick={handleSyncOrganicComments}
                className="h-7 w-7 shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5 shrink-0" />
              </PatternButton>
            </TruncatedText>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Bộ lọc 18 tiêu chí nâng cao & Toán tử Tag AND / OR / NOT */}
        <DropdownMenu open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <DropdownMenuTrigger asChild>
            <GlassIconButton
              size="sm"
              variant={activeCriteriaCount > 0 ? "solid" : "ghost"}
              color={activeCriteriaCount > 0 ? "primary" : "neutral"}
              badgeCount={activeCriteriaCount}
              className="h-7 w-7 shrink-0 ml-auto"
              icon={<Filter className="size-4.5" />}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContentCus
            align="end"
            className="w-80 z-50 p-0 overflow-hidden"
          >
            {/* Header cố định trên đầu Dropdown */}
            <div className="flex items-center justify-between px-3 pt-2.5 pb-2 border-b border-border/40">
              <span className="text-xs font-bold">
                {t("advancedFilterTitle")}
              </span>
              <PatternButton
                type="button"
                variant="ghost"
                size="sm"
                rounded="full"
                icon={<RotateCcw className="w-3 h-3" />}
                onClick={() => {
                  resetOmnichannelFilter();
                  if (shopId) queryOmnichannelInbox(shopId, {});
                }}
              >
                {t("resetFilterBtn")}
              </PatternButton>
            </div>

            {/* Vùng cuộn chính của Dropdown: truyền max-h trực tiếp vào viewportClassName để Radix Viewport kích hoạt cuộn dọc */}
            <ScrollArea
              className="w-full max-h-[min(340px,65dvh)]"
              viewportClassName="max-h-[min(340px,65dvh)] overscroll-contain pr-2"
            >
              <div className="p-2.5 space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {(
                    ["INBOX", "COMMENT", "LIVESTREAM", "MARKETPLACE"] as const
                  ).map((typeKey) => {
                    const isSelectedType = filter.interactionType === typeKey;
                    return (
                      <PatternButton
                        key={typeKey}
                        type="button"
                        size="sm"
                        rounded="full"
                        variant={isSelectedType ? "solid" : "outline"}
                        color={isSelectedType ? "primary" : "neutral"}
                        onClick={() =>
                          applyPatch({
                            interactionType: isSelectedType
                              ? undefined
                              : typeKey,
                          })
                        }
                        className="h-6 px-2.5 text-[11px]"
                      >
                        {typeKey}
                      </PatternButton>
                    );
                  })}
                </div>

                <div className="space-y-1.5 pt-2 border-t border-border/40">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold">
                      {t("tagIncludeLabel")}
                    </span>
                    <div className="inline-flex rounded-full border border-border/60 p-0.5 gap-0.5">
                      {(["OR", "AND"] as const).map((op) => {
                        const isOpActive = filter.includeTagOperator === op;
                        return (
                          <PatternButton
                            key={op}
                            type="button"
                            size="sm"
                            rounded="full"
                            variant={isOpActive ? "solid" : "ghost"}
                            color={isOpActive ? "primary" : "neutral"}
                            onClick={() =>
                              applyPatch({ includeTagOperator: op })
                            }
                            className="h-5 px-2 text-[10px] font-bold"
                          >
                            {op}
                          </PatternButton>
                        );
                      })}
                    </div>
                  </div>

                  <ScrollArea
                    className="w-full max-h-28"
                    viewportClassName="max-h-28 overscroll-contain pr-1"
                  >
                    <div className="flex flex-wrap gap-1 p-1">
                      {tags.map((tag) => {
                        const included = filter.includeTagIds?.includes(tag.id);
                        return (
                          <PatternButton
                            key={tag.id}
                            type="button"
                            size="sm"
                            rounded="full"
                            variant={included ? "solid" : "outline"}
                            color="custom"
                            onClick={() => handleToggleIncludeTag(tag.id)}
                            style={
                              included
                                ? {
                                    backgroundColor:
                                      tag.colorOklch || tag.colorHex,
                                    color: "#fff",
                                  }
                                : undefined
                            }
                            className={cn(
                              "h-6 px-2 text-[10px] font-semibold",
                              included
                                ? "border-transparent"
                                : "border-border/60 text-muted-foreground",
                            )}
                          >
                            + {tag.name}
                          </PatternButton>
                        );
                      })}
                    </div>
                    <ScrollBar orientation="vertical" />
                  </ScrollArea>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-border/40">
                  <span className="text-[11px] font-semibold block">
                    {t("tagExcludeLabel")} (NOT)
                  </span>
                  <ScrollArea
                    className="w-full max-h-28"
                    viewportClassName="max-h-28 overscroll-contain pr-1"
                  >
                    <div className="flex flex-wrap gap-1 p-1">
                      {tags.map((tag) => {
                        const excluded = filter.excludeTagIds?.includes(tag.id);
                        return (
                          <PatternButton
                            key={tag.id}
                            type="button"
                            size="sm"
                            rounded="full"
                            variant={excluded ? "solid" : "outline"}
                            color={excluded ? "danger" : "neutral"}
                            onClick={() => handleToggleExcludeTag(tag.id)}
                            className="h-6 px-2 text-[10px] font-semibold"
                          >
                            {tag.name}
                          </PatternButton>
                        );
                      })}
                    </div>
                    <ScrollBar orientation="vertical" />
                  </ScrollArea>
                </div>
              </div>
              <ScrollBar orientation="vertical" />
            </ScrollArea>
          </DropdownMenuContentCus>
        </DropdownMenu>
      </div>

      {/* Thanh gắn Tag hàng loạt (F02.6 Bulk Tagging) khi chọn nhiều hội thoại */}
      {selectedConversationIds.length > 0 && (
        <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-primary/10 border border-primary/30 text-xs">
          <span className="inline-flex items-center gap-1 font-semibold text-primary shrink-0">
            <CheckSquare className="w-3.5 h-3.5" />
            {tTag("bulkToolbar.selectedCount", {
              count: selectedConversationIds.length,
            })}
          </span>
          <ScrollArea className="flex-1 min-w-0 whitespace-nowrap">
            <div className="flex items-center justify-end gap-1 w-max pb-2">
              {tags.slice(0, 4).map((tag) => (
                <PatternButton
                  key={tag.id}
                  type="button"
                  size="sm"
                  rounded="full"
                  variant="solid"
                  color="custom"
                  icon={<Tag className="w-2.5 h-2.5" />}
                  onClick={async () => {
                    await bulkAssignConversationTags({
                      shopId,
                      conversationIds: selectedConversationIds,
                      addTagIds: [tag.id],
                    });
                    onClearBulkSelection?.();
                  }}
                  style={{
                    backgroundColor: tag.colorOklch || tag.colorHex,
                    color: "#fff",
                  }}
                  className="h-6 px-2 text-[10px] font-semibold"
                >
                  {tag.name}
                </PatternButton>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}
    </div>
  );
};
