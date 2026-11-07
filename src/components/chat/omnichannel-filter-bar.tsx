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
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  GlassBadge,
  GlassIconButton,
  LiquidPopover,
  LiquidPopoverTrigger,
  LiquidPopoverContent,
  PatternButton,
} from "@/components/toolkit";
import { useChatStore } from "@/lib/stores/chat/use-chat-store";
import { useTagStore } from "@/lib/stores/tags/use-tag-store";
import { cn } from "@/lib/utils";

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
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

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
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
        <button
          type="button"
          onClick={() => {
            resetOmnichannelFilter();
            if (shopId) queryOmnichannelInbox(shopId, {});
          }}
          className={cn(
            "px-2.5 py-1 rounded-full text-[11px] font-semibold border whitespace-nowrap cursor-pointer transition-all",
            activeCriteriaCount === 0
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border/60 text-muted-foreground hover:text-foreground",
          )}
        >
          {t("all")}
        </button>

        <button
          type="button"
          onClick={() =>
            applyPatch({
              ghostedByAgentOnly: !filter.ghostedByAgentOnly,
              unrepliedOnly: undefined,
            })
          }
          className={cn(
            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border whitespace-nowrap cursor-pointer transition-all",
            filter.ghostedByAgentOnly
              ? "bg-red-500 text-white border-red-500 shadow-2xs"
              : "border-red-500/40 text-red-600 dark:text-red-400 bg-red-500/10",
          )}
        >
          <AlertTriangle className="w-3 h-3 shrink-0" />
          <span>
            {t("ghosted", { count: summaryCounts?.ghostedCount || 0 })}
          </span>
        </button>

        <button
          type="button"
          onClick={() =>
            applyPatch({
              unrepliedOnly: !filter.unrepliedOnly,
              ghostedByAgentOnly: undefined,
            })
          }
          className={cn(
            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border whitespace-nowrap cursor-pointer transition-all",
            filter.unrepliedOnly
              ? "bg-amber-500 text-white border-amber-500"
              : "border-border/60 text-muted-foreground hover:text-foreground",
          )}
        >
          <Clock className="w-3 h-3 shrink-0" />
          <span>{t("unreplied")}</span>
        </button>

        <button
          type="button"
          onClick={() =>
            applyPatch({
              hasPhone: !filter.hasPhone,
              noPhone: undefined,
            })
          }
          className={cn(
            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border whitespace-nowrap cursor-pointer transition-all",
            filter.hasPhone
              ? "bg-emerald-600 text-white border-emerald-600"
              : "border-border/60 text-muted-foreground hover:text-foreground",
          )}
        >
          <Phone className="w-3 h-3 shrink-0" />
          <span>{t("hasPhone")}</span>
        </button>

        <button
          type="button"
          onClick={() =>
            applyPatch({
              hasPhone: true,
              noOrder: !filter.noOrder,
            })
          }
          className={cn(
            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border whitespace-nowrap cursor-pointer transition-all",
            filter.noOrder
              ? "bg-indigo-600 text-white border-indigo-600"
              : "border-border/60 text-muted-foreground hover:text-foreground",
          )}
        >
          <ShoppingBag className="w-3 h-3 shrink-0" />
          <span>{t("unconfirmedOrder")}</span>
        </button>

        {/* Bộ lọc 18 tiêu chí nâng cao & Toán tử Tag AND / OR / NOT */}
        <LiquidPopover open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <LiquidPopoverTrigger asChild>
            <GlassIconButton
              size="sm"
              variant={activeCriteriaCount > 0 ? "solid" : "ghost"}
              color={activeCriteriaCount > 0 ? "primary" : "neutral"}
              badgeCount={activeCriteriaCount}
              className="h-7 w-7 shrink-0 ml-auto"
              icon={<Filter className="w-3.5 h-3.5" />}
            />
          </LiquidPopoverTrigger>
          <LiquidPopoverContent className="w-80 p-3 space-y-3 z-50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">
                {t("advancedFilterTitle")}
              </span>
              <PatternButton
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

            <div className="flex flex-wrap gap-1.5">
              {(["INBOX", "COMMENT", "LIVESTREAM", "MARKETPLACE"] as const).map(
                (typeKey) => (
                  <button
                    key={typeKey}
                    type="button"
                    onClick={() =>
                      applyPatch({
                        interactionType:
                          filter.interactionType === typeKey
                            ? undefined
                            : typeKey,
                      })
                    }
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[11px] border cursor-pointer",
                      filter.interactionType === typeKey
                        ? "border-primary bg-primary/15 text-primary font-semibold"
                        : "border-border/60 text-muted-foreground",
                    )}
                  >
                    {typeKey}
                  </button>
                ),
              )}
            </div>

            <div className="space-y-1.5 pt-1 border-t border-border/40">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold">
                  {t("tagIncludeLabel")}
                </span>
                <div className="inline-flex rounded-full border border-border/60 p-0.5 text-[10px]">
                  {(["OR", "AND"] as const).map((op) => (
                    <button
                      key={op}
                      type="button"
                      onClick={() => applyPatch({ includeTagOperator: op })}
                      className={cn(
                        "px-2 py-0.2 rounded-full font-bold cursor-pointer",
                        filter.includeTagOperator === op
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {op}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => {
                  const included = filter.includeTagIds?.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleToggleIncludeTag(tag.id)}
                      style={
                        included
                          ? {
                              backgroundColor: tag.colorOklch || tag.colorHex,
                              color: "#fff",
                            }
                          : undefined
                      }
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-semibold border cursor-pointer",
                        included
                          ? "border-transparent"
                          : "border-border/60 text-muted-foreground",
                      )}
                    >
                      + {tag.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5 pt-1 border-t border-border/40">
              <span className="text-[11px] font-semibold block">
                {t("tagExcludeLabel")} (NOT)
              </span>
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => {
                  const excluded = filter.excludeTagIds?.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleToggleExcludeTag(tag.id)}
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-semibold border cursor-pointer",
                        excluded
                          ? "bg-destructive text-white border-destructive"
                          : "border-border/60 text-muted-foreground",
                      )}
                    >
                      NOT {tag.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </LiquidPopoverContent>
        </LiquidPopover>
      </div>

      {/* Thanh gắn Tag hàng loạt (F02.6 Bulk Tagging) khi chọn nhiều hội thoại */}
      {selectedConversationIds.length > 0 && (
        <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-primary/10 border border-primary/30 text-xs">
          <span className="inline-flex items-center gap-1 font-semibold text-primary">
            <CheckSquare className="w-3.5 h-3.5" />
            {tTag("bulkToolbar.selectedCount", {
              count: selectedConversationIds.length,
            })}
          </span>
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {tags.slice(0, 4).map((tag) => (
              <button
                key={tag.id}
                type="button"
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
                className="px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap cursor-pointer"
              >
                <Tag className="w-2.5 h-2.5 mr-0.5 inline" />
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
