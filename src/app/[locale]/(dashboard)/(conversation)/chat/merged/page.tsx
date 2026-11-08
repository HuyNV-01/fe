/** biome-ignore-all lint/suspicious/useIterableCallbackReturn: <explanation> */
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Layers,
  Search,
  RefreshCw,
  MessageSquare,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Bookmark,
  ArrowRight,
  Settings2,
  AlertTriangle,
  Tag,
  CheckSquare,
  Square,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LiquidGlassInput,
  GlassSurfaceCard,
  GlassSectionHeader,
  GlassTabs,
  GlassBadge,
  GlassAvatar,
  GlassEmptyState,
  PatternButton,
  TruncatedText,
} from "@/components/toolkit";
import { PermissionGate } from "@/components/iam/permission-gate";
import { OmnichannelFilterBar } from "@/components/chat/omnichannel-filter-bar";
import { CustomTagManagerModal } from "@/components/chat/custom-tag-manager-modal";
import { useChannelWorkspaceStore } from "@/lib/stores/channel/use-channel-workspace-store";
import { usePermissionStore } from "@/lib/stores/iam/use-permission-store";
import { useTagStore } from "@/lib/stores/tags/use-tag-store";
import config from "@/config";
import { cn } from "@/lib/utils";
import type { ICustomTag } from "@/types/chat";

type MergedStatusFilter =
  | "ALL"
  | "WAITING_AGENT_REPLY"
  | "GHOSTED"
  | "WAITING_CUSTOMER_REPLY";

export default function MultiPageMergedInboxPage() {
  const t = useTranslations("OmnichannelInbox");
  const tChannels = useTranslations("SettingsChannels");
  const router = useRouter();

  const activeShopId = usePermissionStore((s) => s.activeShopId);
  const savedPresets = usePermissionStore((s) => s.savedPageGroupPresets);
  const channels = useChannelWorkspaceStore((s) => s.channels);
  const selectedChannelIds = useChannelWorkspaceStore(
    (s) => s.selectedChannelIds,
  );
  const activePresetId = useChannelWorkspaceStore((s) => s.activePresetId);
  const mergedConversations = useChannelWorkspaceStore(
    (s) => s.mergedConversations,
  );
  const marketplaceReservations = useChannelWorkspaceStore(
    (s) => s.marketplaceReservations,
  );
  const isLoadingMergedInbox = useChannelWorkspaceStore(
    (s) => s.isLoadingMergedInbox,
  );
  const fetchShopChannels = useChannelWorkspaceStore(
    (s) => s.fetchShopChannels,
  );
  const fetchMergedConversations = useChannelWorkspaceStore(
    (s) => s.fetchMergedConversations,
  );
  const fetchMarketplaceReservations = useChannelWorkspaceStore(
    (s) => s.fetchMarketplaceReservations,
  );
  const toggleMergeChannel = useChannelWorkspaceStore(
    (s) => s.toggleMergeChannel,
  );
  const selectAllChannelsMerge = useChannelWorkspaceStore(
    (s) => s.selectAllChannelsMerge,
  );
  const applySavedPreset = useChannelWorkspaceStore((s) => s.applySavedPreset);

  const tags = useTagStore((s) => s.tags);
  const fetchShopTags = useTagStore((s) => s.fetchShopTags);

  const [statusFilter, setStatusFilter] = useState<MergedStatusFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedConvIds, setSelectedConvIds] = useState<string[]>([]);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);

  const tagMap = useMemo(() => {
    const map = new Map<string, ICustomTag>();
    tags.forEach((tag) => map.set(tag.id, tag));
    return map;
  }, [tags]);

  const loadMergedStream = useCallback(async () => {
    if (!activeShopId) return;
    await Promise.all([
      fetchMergedConversations(activeShopId, {
        channelIds: selectedChannelIds,
        supportStatus:
          statusFilter === "ALL" || statusFilter === "GHOSTED"
            ? undefined
            : statusFilter,
        search: searchQuery,
      }),
      fetchMarketplaceReservations(activeShopId),
      fetchShopTags(activeShopId),
    ]);
  }, [
    activeShopId,
    selectedChannelIds,
    statusFilter,
    searchQuery,
    fetchMergedConversations,
    fetchMarketplaceReservations,
    fetchShopTags,
  ]);

  useEffect(() => {
    if (!activeShopId) return;
    fetchShopChannels(activeShopId);
  }, [activeShopId, fetchShopChannels]);

  useEffect(() => {
    loadMergedStream();
  }, [loadMergedStream]);

  const displayedConversations = useMemo(() => {
    if (statusFilter === "GHOSTED") {
      return mergedConversations.filter((c: any) =>
        Boolean(c.isGhostedByAgent),
      );
    }
    return mergedConversations;
  }, [mergedConversations, statusFilter]);

  const toggleSelectConv = (id: string) => {
    setSelectedConvIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  return (
    <ScrollArea className="h-full w-full flex-1">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-5">
        <GlassSectionHeader
          icon={<Layers className="w-5 h-5" />}
          title={
            <TruncatedText as="span">{t("mergeMode.title")}</TruncatedText>
          }
          subtitle={
            <TruncatedText as="span">{t("mergeMode.subtitle")}</TruncatedText>
          }
          actions={
            <div className="flex items-center gap-2 flex-wrap">
              <PermissionGate can="TAG_SCHEMA_CREATE_EDIT" mode="hide">
                <PatternButton
                  type="button"
                  variant="glass"
                  color="neutral"
                  size="sm"
                  rounded="full"
                  onClick={() => setIsTagManagerOpen(true)}
                  icon={<Tag className="w-3.5 h-3.5" />}
                >
                  <TruncatedText>{t("mergeMode.manageTagsBtn")}</TruncatedText>
                </PatternButton>
              </PermissionGate>

              <PatternButton
                type="button"
                variant="glass"
                color="primary"
                size="sm"
                rounded="full"
                isLoading={isLoadingMergedInbox}
                onClick={loadMergedStream}
                icon={<RefreshCw className="w-3.5 h-3.5" />}
                iconPosition="left"
              >
                <TruncatedText>{t("mergeMode.refreshStreamBtn")}</TruncatedText>
              </PatternButton>

              <PermissionGate can="CHANNEL_INTEGRATION_CONNECT" mode="hide">
                <PatternButton
                  type="button"
                  variant="solid"
                  color="primary"
                  size="sm"
                  rounded="full"
                  onClick={() =>
                    router.push(config.routes.private.settingsChannels)
                  }
                  icon={<Settings2 className="w-3.5 h-3.5" />}
                  iconPosition="left"
                >
                  <TruncatedText>
                    {t("mergeMode.configureChannelsBtn")}
                  </TruncatedText>
                </PatternButton>
              </PermissionGate>
            </div>
          }
        />

        {/* Thanh chọn nhanh Kênh Gộp & Preset Gộp Trang */}
        <GlassSurfaceCard className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <GlassBadge variant="primary" size="sm">
                <Layers className="w-3 h-3 mr-1 inline" />
                <span>
                  {t("mergeMode.activePagesBadge", {
                    count: selectedChannelIds.length,
                  })}
                </span>
              </GlassBadge>
              {savedPresets.map((preset) => {
                const isActive = activePresetId === preset.presetId;
                return (
                  <button
                    key={preset.presetId}
                    type="button"
                    onClick={() =>
                      applySavedPreset(
                        preset.presetId,
                        preset.channelIntegrationIds,
                      )
                    }
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer",
                      isActive
                        ? "border-primary bg-primary/15 text-primary font-semibold"
                        : "border-border/50 hover:bg-muted/40 text-muted-foreground",
                    )}
                  >
                    <Bookmark className="w-3 h-3 shrink-0" />
                    <span>{preset.name}</span>
                  </button>
                );
              })}
            </div>

            {channels.length > 1 && (
              <PatternButton
                type="button"
                variant="ghost"
                color="primary"
                size="sm"
                rounded="full"
                onClick={selectAllChannelsMerge}
              >
                <TruncatedText>
                  {t("mergeMode.selectAllChannelsBtn", {
                    count: channels.length,
                  })}
                </TruncatedText>
              </PatternButton>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {channels.map((ch) => {
              const isSelected = selectedChannelIds.includes(ch.id);
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => toggleMergeChannel(ch.id)}
                  className={cn(
                    "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border transition-all cursor-pointer",
                    isSelected
                      ? "border-primary bg-primary/15 text-foreground font-semibold shadow-2xs"
                      : "border-border/40 bg-background/40 text-muted-foreground opacity-70 hover:opacity-100",
                  )}
                >
                  <span>{ch.pageShortCode}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {ch.pageName}
                  </span>
                  {ch.unreadCount > 0 && (
                    <span className="rounded-full bg-red-500 text-white text-[10px] font-bold px-1.5">
                      {ch.unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </GlassSurfaceCard>

        {/* Bộ lọc 18 tiêu chí & Gắn Tag hàng loạt (F03.1, F03.2, F02.6) */}
        {activeShopId && (
          <OmnichannelFilterBar
            shopId={activeShopId}
            selectedConversationIds={selectedConvIds}
            onClearBulkSelection={() => {
              setSelectedConvIds([]);
              loadMergedStream();
            }}
          />
        )}

        {/* Thanh Lọc Trạng Thái & Tìm Kiếm Xuyên Kênh */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <GlassTabs
            value={statusFilter}
            onValueChange={setStatusFilter}
            items={[
              {
                key: "ALL",
                label: t("filters.all"),
                badge: mergedConversations.length,
              },
              {
                key: "WAITING_AGENT_REPLY",
                label: t("filters.unreplied"),
                badge: mergedConversations.filter(
                  (c) => c.supportStatus === "WAITING_AGENT_REPLY",
                ).length,
              },
              {
                key: "GHOSTED",
                label: t("filters.ghosted", {
                  count: mergedConversations.filter((c: any) =>
                    Boolean(c.isGhostedByAgent),
                  ).length,
                }),
              },
              {
                key: "WAITING_CUSTOMER_REPLY",
                label: t("mergeMode.repliedFilterTab"),
                badge: mergedConversations.filter(
                  (c) => c.supportStatus === "WAITING_CUSTOMER_REPLY",
                ).length,
              },
            ]}
          />

          <LiquidGlassInput className="w-full sm:w-72 h-9 overflow-hidden p-0">
            <div className="flex items-center px-3 w-full h-full">
              <Search className="h-3.5 w-3.5 text-muted-foreground/60 mr-2 shrink-0" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("mergeMode.searchMergedPlaceholder")}
                className="flex h-full w-full py-1.5 text-xs bg-transparent! border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
              />
            </div>
          </LiquidGlassInput>
        </div>

        {/* Danh sách Hội thoại Hợp nhất (Multi-Page Unified Stream) */}
        <div className="space-y-2.5">
          {displayedConversations.length === 0 ? (
            <GlassEmptyState
              icon={<MessageSquare className="w-6 h-6" />}
              title={t("mergeMode.emptyMergedStreamTitle")}
              description={t("mergeMode.emptyMergedStreamDesc")}
            />
          ) : (
            displayedConversations.map((conv: any) => {
              const isWaitingReply =
                conv.supportStatus === "WAITING_AGENT_REPLY";
              const isChecked = selectedConvIds.includes(conv.id);
              const convTags = (conv.activeTagIdsJson || [])
                .map((tid: string) => tagMap.get(tid))
                .filter((item: ICustomTag | undefined): item is ICustomTag =>
                  Boolean(item),
                );

              return (
                <GlassSurfaceCard key={conv.id} className="p-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => toggleSelectConv(conv.id)}
                        className="text-muted-foreground hover:text-primary cursor-pointer shrink-0"
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-primary" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>

                      <GlassAvatar
                        src={conv.avatar || conv.channelAvatarUrl}
                        name={conv.name}
                        size="md"
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <TruncatedText
                            as="span"
                            className="font-bold text-sm max-w-56"
                          >
                            {conv.name}
                          </TruncatedText>
                          <GlassBadge variant="primary" size="sm">
                            {conv.pageShortCode || conv.channelType}
                          </GlassBadge>
                          {conv.interactionType && (
                            <GlassBadge
                              variant={
                                conv.interactionType === "COMMENT"
                                  ? "accent"
                                  : conv.interactionType === "LIVESTREAM"
                                    ? "danger"
                                    : "secondary"
                              }
                              size="sm"
                            >
                              {t(
                                `mergeMode.interactionTypes.${conv.interactionType}`,
                              )}
                            </GlassBadge>
                          )}
                          <GlassBadge
                            variant={isWaitingReply ? "warning" : "success"}
                            size="sm"
                            dot
                            pulse={isWaitingReply}
                          >
                            {isWaitingReply ? (
                              <>
                                <Clock className="w-3 h-3 mr-1 inline" />
                                <span>{t("filters.unreplied")}</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3 h-3 mr-1 inline" />
                                <span>{t("mergeMode.repliedFilterTab")}</span>
                              </>
                            )}
                          </GlassBadge>

                          {conv.isGhostedByAgent && (
                            <GlassBadge variant="danger" size="sm" dot pulse>
                              <AlertTriangle className="w-3 h-3 mr-1 inline" />
                              <span>{t("filters.ghosted", { count: 1 })}</span>
                            </GlassBadge>
                          )}

                          {conv.hasOrderCreated && (
                            <GlassBadge variant="info" size="sm">
                              <ShoppingBag className="w-3 h-3 mr-1 inline" />
                              <span>
                                {t("mergeMode.marketplaceOrderBadge")}
                              </span>
                            </GlassBadge>
                          )}

                          {convTags.map((tag: ICustomTag) => (
                            <span
                              key={tag.id}
                              style={{
                                backgroundColor: tag.colorOklch || tag.colorHex,
                              }}
                              className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
                            >
                              {tag.name}
                            </span>
                          ))}
                        </div>
                        <TruncatedText
                          as="p"
                          className="text-xs text-muted-foreground max-w-xl"
                        >
                          {conv.lastMessage || ""}
                        </TruncatedText>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <PatternButton
                        type="button"
                        variant="solid"
                        color="primary"
                        size="sm"
                        rounded="full"
                        onClick={() =>
                          router.push(config.routes.private.detailChat(conv.id))
                        }
                        icon={<ArrowRight className="w-3.5 h-3.5" />}
                        iconPosition="right"
                      >
                        <TruncatedText>
                          {t("mergeMode.openConversationBtn")}
                        </TruncatedText>
                      </PatternButton>
                    </div>
                  </div>
                </GlassSurfaceCard>
              );
            })
          )}
        </div>

        {/* Khối F01.8: Đơn hàng Sàn TMĐT vừa đồng bộ & giữ chỗ tồn kho xuyên kênh */}
        {marketplaceReservations.length > 0 && (
          <GlassSurfaceCard
            header={
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-emerald-500" />
                  <span className="font-bold text-sm">
                    {tChannels("marketplaceBridge.title")}
                  </span>
                </div>
                <GlassBadge variant="success" size="sm">
                  {marketplaceReservations.length}
                </GlassBadge>
              </div>
            }
          >
            <div className="space-y-2">
              {marketplaceReservations.slice(0, 5).map((res) => (
                <div
                  key={res.orderSn}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl border border-border/40"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold">#{res.orderSn}</span>
                      <GlassBadge variant="primary" size="sm">
                        {res.pageShortCode}
                      </GlassBadge>
                      <span className="text-xs text-muted-foreground">
                        {res.buyerUsername}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {res.items
                        .map(
                          (it) =>
                            `${it.itemName} x${it.quantity} (${it.mappedVariantId})`,
                        )
                        .join(", ")}
                    </p>
                  </div>

                  {res.conversationId && (
                    <PatternButton
                      type="button"
                      variant="glass"
                      color="primary"
                      size="sm"
                      rounded="full"
                      onClick={() =>
                        router.push(
                          config.routes.private.detailChat(res.conversationId!),
                        )
                      }
                    >
                      <TruncatedText>
                        {t("mergeMode.openConversationBtn")}
                      </TruncatedText>
                    </PatternButton>
                  )}
                </div>
              ))}
            </div>
          </GlassSurfaceCard>
        )}
      </div>

      {activeShopId && (
        <CustomTagManagerModal
          open={isTagManagerOpen}
          onOpenChange={setIsTagManagerOpen}
          shopId={activeShopId}
        />
      )}
    </ScrollArea>
  );
}
