/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Share2,
  Plus,
  RefreshCw,
  ArrowRight,
  KeyRound,
  Trash2,
  Zap,
  Sliders,
  Activity,
  RotateCcw,
  Hash,
  Globe,
  ShoppingBag,
  Pencil,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import {
  LiquidGlassInput,
  GlassSurfaceCard,
  GlassSectionHeader,
  GlassTabs,
  GlassBadge,
  GlassAvatar,
  GlassModal,
  GlassEmptyState,
  PatternButton,
  TruncatedText,
  ContentSelect,
  ItemSelect,
  Switch,
} from "@/components/toolkit";
import { PermissionGate } from "@/components/iam/permission-gate";
import {
  type ChannelPlatformType,
  type ChannelWebhookLogItem,
  type ConnectedChannelItem,
  simulateOmnichannelWebhookApi,
} from "@/lib/stores/channel/api";
import { useChannelWorkspaceStore } from "@/lib/stores/channel/use-channel-workspace-store";
import {
  getWorkspaceSettingsApi,
  type RoutingStrategyType,
  updateWorkspaceSettingsApi,
} from "@/lib/stores/iam/api";
import { usePermissionStore } from "@/lib/stores/iam/use-permission-store";
import config from "@/config";
import { showErrorToast, showInfoToast, showSuccessToast } from "@/utils/toast";

type ChannelsTabMode =
  | "CONNECTED_CHANNELS"
  | "ROUTING_AND_SLA"
  | "MARKETPLACE_BRIDGE"
  | "WEBHOOK_INSPECTOR";

const CHANNEL_PLATFORMS: ChannelPlatformType[] = [
  "FACEBOOK_PAGE",
  "INSTAGRAM",
  "ZALO_OA",
  "TIKTOK_SHOP",
  "SHOPEE",
  "LAZADA",
  "WEBSITE_LIVECHAT",
];

const ROUTING_STRATEGIES: RoutingStrategyType[] = [
  "STICKY_AGENT",
  "LEAST_BUSY",
  "ROUND_ROBIN",
  "AI_FIRST",
];

const WEBHOOK_STATUS_FILTERS = [
  "ALL",
  "PROCESSED",
  "DUPLICATE_SKIPPED",
  "FAILED_DLQ",
  "REPLAYED_SUCCESS",
] as const;

export default function OmnichannelSettingsPage() {
  const t = useTranslations("SettingsChannels");
  const router = useRouter();

  const activeShopId = usePermissionStore((s) => s.activeShopId);
  const membersRefreshTick = usePermissionStore((s) => s.membersRefreshTick);
  const channels = useChannelWorkspaceStore((s) => s.channels);
  const webhookLogs = useChannelWorkspaceStore((s) => s.webhookLogs);
  const marketplaceReservations = useChannelWorkspaceStore(
    (s) => s.marketplaceReservations,
  );
  const fetchShopChannels = useChannelWorkspaceStore(
    (s) => s.fetchShopChannels,
  );
  const connectChannelOAuth = useChannelWorkspaceStore(
    (s) => s.connectChannelOAuth,
  );
  const updateChannelIntegration = useChannelWorkspaceStore(
    (s) => s.updateChannelIntegration,
  );
  const disconnectChannel = useChannelWorkspaceStore(
    (s) => s.disconnectChannel,
  );
  const runTokenDoctor = useChannelWorkspaceStore((s) => s.runTokenDoctor);
  const fetchWebhookLogs = useChannelWorkspaceStore((s) => s.fetchWebhookLogs);
  const fetchMarketplaceReservations = useChannelWorkspaceStore(
    (s) => s.fetchMarketplaceReservations,
  );
  const replayWebhookLog = useChannelWorkspaceStore((s) => s.replayWebhookLog);

  const [activeTab, setActiveTab] =
    useState<ChannelsTabMode>("CONNECTED_CHANNELS");
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] =
    useState<ConnectedChannelItem | null>(null);
  const [inspectingLog, setInspectingLog] =
    useState<ChannelWebhookLogItem | null>(null);

  const [channelType, setChannelType] =
    useState<ChannelPlatformType>("FACEBOOK_PAGE");
  const [pageName, setPageName] = useState("");
  const [pageShortCode, setPageShortCode] = useState("");
  const [externalPageId, setExternalPageId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [metaDatasetId, setMetaDatasetId] = useState("");
  const [capiAccessToken, setCapiAccessToken] = useState("");

  const [editPageName, setEditPageName] = useState("");
  const [editPageShortCode, setEditPageShortCode] = useState("");
  const [editAccessToken, setEditAccessToken] = useState("");
  const [editRefreshToken, setEditRefreshToken] = useState("");
  const [editMetaDatasetId, setEditMetaDatasetId] = useState("");
  const [editCapiAccessToken, setEditCapiAccessToken] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [isUpdatingChannel, setIsUpdatingChannel] = useState(false);

  const [webhookStatusFilter, setWebhookStatusFilter] = useState<string>("ALL");

  const [isConnecting, setIsConnecting] = useState(false);
  const [isRunningDoctor, setIsRunningDoctor] = useState(false);
  const [simulatingChannelId, setSimulatingChannelId] = useState<string | null>(
    null,
  );
  const [simulatingOrderChannelId, setSimulatingOrderChannelId] = useState<
    string | null
  >(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [replayingLogId, setReplayingLogId] = useState<string | null>(null);

  const [routingStrategy, setRoutingStrategy] =
    useState<RoutingStrategyType>("STICKY_AGENT");
  const [slaResponseSeconds, setSlaResponseSeconds] = useState<number>(180);
  const [ghostedAlertSeconds, setGhostedAlertSeconds] = useState<number>(180);
  const [autoReclaimMinutes, setAutoReclaimMinutes] = useState<number>(5);
  const [leadCollectorWeight, setLeadCollectorWeight] = useState<number>(0.4);
  const [orderCloserWeight, setOrderCloserWeight] = useState<number>(0.6);
  const [deductOnReturnedOrder, setDeductOnReturnedOrder] =
    useState<boolean>(true);
  const [lockOrderAfterPrint, setLockOrderAfterPrint] = useState<boolean>(true);
  const [requireDepositOnHighRisk, setRequireDepositOnHighRisk] =
    useState<boolean>(true);
  const [autoReserveMarketplace, setAutoReserveMarketplace] =
    useState<boolean>(true);
  const [safetyBufferStockQty, setSafetyBufferStockQty] = useState<number>(2);
  const [pushAvailableStockToMarketplace, setPushAvailableStockToMarketplace] =
    useState<boolean>(true);
  const [isSavingRouting, setIsSavingRouting] = useState(false);

  const loadWorkspaceSettings = useCallback(async () => {
    if (!activeShopId) return;
    try {
      const res: any = await getWorkspaceSettingsApi(activeShopId);
      const data = res?.data;
      if (!data) return;
      setRoutingStrategy(data.routingStrategy || "STICKY_AGENT");
      setSlaResponseSeconds(Number(data.slaResponseSeconds || 180));
      setGhostedAlertSeconds(Number(data.ghostedAlertSeconds || 180));
      setAutoReclaimMinutes(Number(data.autoReclaimMinutes || 5));
      setLockOrderAfterPrint(Boolean(data.lockOrderAfterPrint ?? true));
      setRequireDepositOnHighRisk(
        Boolean(data.requireDepositOnHighRisk ?? true),
      );
      if (data.commissionSplitConfigJson) {
        setLeadCollectorWeight(
          Number(data.commissionSplitConfigJson.leadCollectorWeight ?? 0.4),
        );
        setOrderCloserWeight(
          Number(data.commissionSplitConfigJson.orderCloserWeight ?? 0.6),
        );
        setDeductOnReturnedOrder(
          Boolean(data.commissionSplitConfigJson.deductOnReturnedOrder ?? true),
        );
      }
      if (data.marketplaceSyncConfigJson) {
        setAutoReserveMarketplace(
          Boolean(
            data.marketplaceSyncConfigJson.autoReserveStockOnMarketplaceOrder ??
              true,
          ),
        );
        setSafetyBufferStockQty(
          Number(data.marketplaceSyncConfigJson.safetyBufferStockQty ?? 2),
        );
        setPushAvailableStockToMarketplace(
          Boolean(
            data.marketplaceSyncConfigJson.pushAvailableStockToShopeeTikTok ??
              true,
          ),
        );
      }
    } catch {}
  }, [activeShopId]);

  useEffect(() => {
    if (!activeShopId) return;
    fetchShopChannels(activeShopId);
    loadWorkspaceSettings();
    fetchWebhookLogs(activeShopId, {
      processingStatus:
        webhookStatusFilter === "ALL" ? undefined : webhookStatusFilter,
    });
    fetchMarketplaceReservations(activeShopId);
  }, [
    activeShopId,
    membersRefreshTick,
    webhookStatusFilter,
    fetchShopChannels,
    loadWorkspaceSettings,
    fetchWebhookLogs,
    fetchMarketplaceReservations,
  ]);

  const handleOpenEditChannel = (ch: ConnectedChannelItem) => {
    setEditingChannel(ch);
    setEditPageName(ch.pageName);
    setEditPageShortCode(ch.pageShortCode);
    setEditAccessToken("");
    setEditRefreshToken("");
    setEditMetaDatasetId(ch.metaDatasetId || "");
    setEditCapiAccessToken("");
    setEditIsActive(ch.isActive);
  };

  const handleEditChannelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShopId || !editingChannel) return;
    setIsUpdatingChannel(true);
    try {
      await updateChannelIntegration(activeShopId, editingChannel.id, {
        pageName: editPageName.trim() || undefined,
        pageShortCode: editPageShortCode.trim().toUpperCase() || undefined,
        accessToken: editAccessToken.trim() || undefined,
        refreshToken: editRefreshToken.trim() || undefined,
        metaDatasetId: editMetaDatasetId.trim() || undefined,
        capiAccessToken: editCapiAccessToken.trim() || undefined,
        isActive: editIsActive,
      });
      setEditingChannel(null);
      showSuccessToast(t("updatedChannelToast"));
    } catch (err: any) {
      showErrorToast(err?.response?.data?.message || "Failed");
    } finally {
      setIsUpdatingChannel(false);
    }
  };

  const handleConnectChannelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !activeShopId ||
      !pageName.trim() ||
      !pageShortCode.trim() ||
      !externalPageId.trim() ||
      !accessToken.trim()
    ) {
      return;
    }

    setIsConnecting(true);
    try {
      await connectChannelOAuth(activeShopId, {
        channelType,
        pageName: pageName.trim(),
        pageShortCode: pageShortCode.trim().toUpperCase(),
        externalPageId: externalPageId.trim(),
        accessToken: accessToken.trim(),
        refreshToken: refreshToken.trim() || undefined,
        metaDatasetId: metaDatasetId.trim() || undefined,
        capiAccessToken: capiAccessToken.trim() || undefined,
      });
      setConnectModalOpen(false);
      setPageName("");
      setPageShortCode("");
      setExternalPageId("");
      setAccessToken("");
      setRefreshToken("");
      setMetaDatasetId("");
      setCapiAccessToken("");
      showSuccessToast(t("connectedSuccessToast", { name: pageName.trim() }));
    } catch (err: any) {
      showErrorToast(err?.response?.data?.message || "Failed");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleRunTokenDoctor = async () => {
    if (!activeShopId) return;
    setIsRunningDoctor(true);
    try {
      const stats = await runTokenDoctor(activeShopId);
      if (stats) {
        showSuccessToast(
          t("tokenDoctorSuccessDesc", {
            total: stats.totalChecked,
            healthy: stats.healthyCount,
            warning: stats.warningCount,
            expired: stats.expiredCount,
          }),
          {
            title: t("tokenDoctorSuccessTitle"),
          },
        );
      }
    } catch (err: any) {
      showErrorToast(err?.response?.data?.message || "Failed");
    } finally {
      setIsRunningDoctor(false);
    }
  };

  const handleSimulateWebhook = async (ch: ConnectedChannelItem) => {
    if (!activeShopId) return;
    setSimulatingChannelId(ch.id);
    try {
      await simulateOmnichannelWebhookApi(ch.channelType, {
        externalPageId: ch.externalPageId,
        threadId: `thread_${Date.now()}`,
        senderName: `Khách ${ch.pageShortCode}`,
        messageText: `Xin chào shop, tư vấn giúp mình mẫu mới trên ${ch.pageName} nhé!`,
        event: "MESSAGE_INBOUND",
      });
      await fetchShopChannels(activeShopId);
      await fetchWebhookLogs(activeShopId);
      showInfoToast(t("simulatedWebhookToast"));
    } catch (err: any) {
      showErrorToast(err?.response?.data?.message || "Failed");
    } finally {
      setSimulatingChannelId(null);
    }
  };

  const handleSimulateMarketplaceOrder = async (ch: ConnectedChannelItem) => {
    if (!activeShopId) return;
    setSimulatingOrderChannelId(ch.id);
    try {
      const orderSn = `${ch.pageShortCode.replace(/[^A-Z0-9]/g, "")}${String(Date.now()).slice(-6)}`;
      await simulateOmnichannelWebhookApi(ch.channelType, {
        externalPageId: ch.externalPageId,
        order_sn: orderSn,
        buyer_username: `Khách hàng ${ch.pageShortCode}`,
        total_amount: 485000,
        order_status: "READY_TO_SHIP",
        event: "ORDER_CREATED",
        items: [
          {
            externalItemId: `ITEM-${orderSn}`,
            skuCode: `SKU-${ch.pageShortCode}-01`,
            itemName: `Sản phẩm chủ lực ${ch.pageName}`,
            quantity: 2,
            unitPrice: 242500,
          },
        ],
      });
      await fetchShopChannels(activeShopId);
      await fetchWebhookLogs(activeShopId);
      await fetchMarketplaceReservations(activeShopId);
      showSuccessToast(t("simulatedMarketplaceOrderToast"));
    } catch (err: any) {
      showErrorToast(err?.response?.data?.message || "Failed");
    } finally {
      setSimulatingOrderChannelId(null);
    }
  };

  const handleDisconnectChannel = async (channelId: string) => {
    if (!activeShopId) return;
    setDisconnectingId(channelId);
    try {
      await disconnectChannel(activeShopId, channelId);
      showInfoToast(t("disconnectedToast"));
    } catch (err: any) {
      showErrorToast(err?.response?.data?.message || "Failed");
    } finally {
      setDisconnectingId(null);
    }
  };

  const handleSaveRoutingSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShopId) return;
    setIsSavingRouting(true);
    try {
      await updateWorkspaceSettingsApi(activeShopId, {
        routingStrategy,
        slaResponseSeconds,
        ghostedAlertSeconds,
        autoReclaimMinutes,
        leadCollectorWeight,
        orderCloserWeight,
        deductOnReturnedOrder,
        lockOrderAfterPrint,
        requireDepositOnHighRisk,
        autoReserveStockOnMarketplaceOrder: autoReserveMarketplace,
        safetyBufferStockQty,
        pushAvailableStockToShopeeTikTok: pushAvailableStockToMarketplace,
      });
      showSuccessToast(t("savedRoutingToast"));
    } catch (err: any) {
      showErrorToast(err?.response?.data?.message || "Failed");
    } finally {
      setIsSavingRouting(false);
    }
  };

  const handleReplayWebhook = async (logId: string) => {
    if (!activeShopId) return;
    setReplayingLogId(logId);
    try {
      await replayWebhookLog(activeShopId, logId);
      showSuccessToast(t("replayedSuccessToast"));
    } catch (err: any) {
      showErrorToast(err?.response?.data?.message || "Failed");
    } finally {
      setReplayingLogId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      <GlassSectionHeader
        icon={<Share2 className="w-5 h-5" />}
        title={<TruncatedText as="span">{t("title")}</TruncatedText>}
        subtitle={<TruncatedText as="span">{t("subtitle")}</TruncatedText>}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <PermissionGate can="CHANNEL_INTEGRATION_CONNECT" mode="disable">
              <PatternButton
                type="button"
                variant="glass"
                color="info"
                size="sm"
                rounded="full"
                isLoading={isRunningDoctor}
                onClick={handleRunTokenDoctor}
                icon={<RefreshCw className="w-3.5 h-3.5" />}
                iconPosition="left"
              >
                <TruncatedText>{t("runTokenDoctorBtn")}</TruncatedText>
              </PatternButton>
            </PermissionGate>

            <PermissionGate can="CHANNEL_INTEGRATION_CONNECT" mode="disable">
              <PatternButton
                type="button"
                variant="solid"
                color="primary"
                size="sm"
                rounded="full"
                onClick={() => setConnectModalOpen(true)}
                icon={<Plus className="w-4 h-4" />}
                iconPosition="left"
              >
                <TruncatedText>{t("connectNewChannelBtn")}</TruncatedText>
              </PatternButton>
            </PermissionGate>
          </div>
        }
      />

      <GlassTabs
        value={activeTab}
        onValueChange={setActiveTab}
        items={[
          {
            key: "CONNECTED_CHANNELS",
            label: <TruncatedText>{t("tabs.connectedChannels")}</TruncatedText>,
            badge: channels.length,
          },
          {
            key: "ROUTING_AND_SLA",
            label: <TruncatedText>{t("tabs.routingAndSla")}</TruncatedText>,
          },
          {
            key: "MARKETPLACE_BRIDGE",
            label: <TruncatedText>{t("tabs.marketplaceBridge")}</TruncatedText>,
            badge: marketplaceReservations.length,
          },
          {
            key: "WEBHOOK_INSPECTOR",
            label: <TruncatedText>{t("tabs.webhookInspector")}</TruncatedText>,
            badge: webhookLogs.length,
          },
        ]}
      />

      {activeTab === "CONNECTED_CHANNELS" && (
        <div className="space-y-3">
          {channels.length === 0 ? (
            <GlassEmptyState
              icon={<Share2 className="w-6 h-6" />}
              title={<TruncatedText>{t("emptyChannelsTitle")}</TruncatedText>}
              description={t("emptyChannelsDesc")}
              action={
                <PermissionGate
                  can="CHANNEL_INTEGRATION_CONNECT"
                  mode="disable"
                >
                  <PatternButton
                    type="button"
                    variant="solid"
                    color="primary"
                    size="md"
                    rounded="full"
                    onClick={() => setConnectModalOpen(true)}
                    icon={<ArrowRight className="w-4 h-4" />}
                    iconPosition="right"
                  >
                    <TruncatedText>{t("connectNewChannelBtn")}</TruncatedText>
                  </PatternButton>
                </PermissionGate>
              }
            />
          ) : (
            channels.map((ch) => {
              const isMarketplace =
                ch.channelType === "SHOPEE" ||
                ch.channelType === "TIKTOK_SHOP" ||
                ch.channelType === "LAZADA";

              return (
                <GlassSurfaceCard key={ch.id} className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <GlassAvatar
                        src={ch.avatarUrl}
                        name={ch.pageShortCode}
                        size="md"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <TruncatedText
                            as="h4"
                            className="font-bold text-sm max-w-64"
                          >
                            {ch.pageName}
                          </TruncatedText>
                          <GlassBadge variant="primary" size="sm">
                            <TruncatedText>{ch.pageShortCode}</TruncatedText>
                          </GlassBadge>
                          <GlassBadge
                            variant={
                              ch.webhookStatus === "HEALTHY"
                                ? "success"
                                : ch.webhookStatus === "TOKEN_EXPIRING_SOON"
                                  ? "warning"
                                  : "danger"
                            }
                            size="sm"
                            dot
                          >
                            <TruncatedText>
                              {t(`webhookStatuses.${ch.webhookStatus}`)}
                            </TruncatedText>
                          </GlassBadge>
                          {ch.unreadCount > 0 && (
                            <GlassBadge variant="danger" size="sm">
                              {t("unreadBadgeCount", {
                                count: ch.unreadCount,
                              })}
                            </GlassBadge>
                          )}
                        </div>
                        <TruncatedText
                          as="p"
                          className="text-xs text-muted-foreground mt-0.5"
                        >
                          {t(`platforms.${ch.channelType}`)} • ID:{" "}
                          {ch.externalPageId}
                          {ch.metaDatasetId
                            ? ` • Pixel/Dataset: ${ch.metaDatasetId}`
                            : ""}
                        </TruncatedText>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      <PatternButton
                        type="button"
                        variant="glass"
                        color="primary"
                        size="sm"
                        rounded="full"
                        isLoading={simulatingChannelId === ch.id}
                        onClick={() => handleSimulateWebhook(ch)}
                        icon={<Zap className="w-3.5 h-3.5" />}
                        iconPosition="left"
                      >
                        <TruncatedText>{t("simulateWebhookBtn")}</TruncatedText>
                      </PatternButton>

                      {isMarketplace && (
                        <PatternButton
                          type="button"
                          variant="glass"
                          color="success"
                          size="sm"
                          rounded="full"
                          isLoading={simulatingOrderChannelId === ch.id}
                          onClick={() => handleSimulateMarketplaceOrder(ch)}
                          icon={<ShoppingBag className="w-3.5 h-3.5" />}
                          iconPosition="left"
                        >
                          <TruncatedText>
                            {t("simulateMarketplaceOrderBtn")}
                          </TruncatedText>
                        </PatternButton>
                      )}

                      <PermissionGate
                        can="CHANNEL_INTEGRATION_CONNECT"
                        mode="hide"
                      >
                        <PatternButton
                          type="button"
                          variant="ghost"
                          color="neutral"
                          size="sm"
                          rounded="full"
                          onClick={() => handleOpenEditChannel(ch)}
                          icon={<Pencil className="w-3.5 h-3.5" />}
                          iconPosition="left"
                        >
                          <TruncatedText>{t("editChannelBtn")}</TruncatedText>
                        </PatternButton>
                      </PermissionGate>

                      <PermissionGate
                        can="CHANNEL_INTEGRATION_CONNECT"
                        mode="hide"
                      >
                        <PatternButton
                          type="button"
                          variant="ghost"
                          color="danger"
                          size="sm"
                          rounded="full"
                          isLoading={disconnectingId === ch.id}
                          onClick={() => handleDisconnectChannel(ch.id)}
                          icon={<Trash2 className="w-3.5 h-3.5" />}
                          iconPosition="left"
                        >
                          <TruncatedText>{t("disconnectBtn")}</TruncatedText>
                        </PatternButton>
                      </PermissionGate>
                    </div>
                  </div>
                </GlassSurfaceCard>
              );
            })
          )}
        </div>
      )}

      {activeTab === "ROUTING_AND_SLA" && (
        <GlassSurfaceCard
          header={
            <div>
              <TruncatedText as="h3" className="text-base font-bold">
                {t("routingCardTitle")}
              </TruncatedText>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("routingCardDesc")}
              </p>
            </div>
          }
          footer={
            <PermissionGate
              can={[
                "WORKSPACE_SETTINGS_MANAGE",
                "INBOX_ROUTING_RULES_CONFIGURE",
                "INBOX_SLA_CONFIG_MANAGE",
              ]}
              mode="disable"
            >
              <PatternButton
                type="submit"
                form="workspace-routing-form"
                variant="solid"
                color="primary"
                size="md"
                rounded="full"
                fullWidth
                isLoading={isSavingRouting}
                icon={<ArrowRight className="w-4 h-4" />}
                iconPosition="right"
              >
                <TruncatedText>{t("saveRoutingConfigBtn")}</TruncatedText>
              </PatternButton>
            </PermissionGate>
          }
        >
          <form
            id="workspace-routing-form"
            onSubmit={handleSaveRoutingSettings}
          >
            <FieldGroup>
              <FieldSet>
                <FieldGroup className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field className="sm:col-span-3">
                    <FieldLabel>
                      <TruncatedText>{t("routingStrategyLabel")}</TruncatedText>
                    </FieldLabel>
                    <Select
                      value={routingStrategy}
                      onValueChange={(val) =>
                        setRoutingStrategy(val as RoutingStrategyType)
                      }
                    >
                      <LiquidGlassInput className="w-full h-10 overflow-hidden p-0">
                        <SelectTrigger className="w-full h-full rounded-full cursor-pointer border-0 shadow-none bg-transparent px-3.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <Sliders className="h-4 w-4 text-primary shrink-0" />
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                      </LiquidGlassInput>
                      <ContentSelect>
                        {ROUTING_STRATEGIES.map((st) => (
                          <ItemSelect key={st} value={st}>
                            <TruncatedText>
                              {t(`strategies.${st}`)}
                            </TruncatedText>
                          </ItemSelect>
                        ))}
                      </ContentSelect>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel>
                      <TruncatedText>
                        {t("slaResponseSecondsLabel")}
                      </TruncatedText>
                    </FieldLabel>
                    <LiquidGlassInput className="w-full h-10 overflow-hidden p-0">
                      <div className="flex items-center px-3.5 w-full h-full">
                        <Input
                          type="number"
                          min={15}
                          value={String(slaResponseSeconds)}
                          onChange={(e) =>
                            setSlaResponseSeconds(Number(e.target.value || 180))
                          }
                          className="flex h-full w-full py-2 text-sm bg-transparent! border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                        />
                      </div>
                    </LiquidGlassInput>
                  </Field>

                  <Field>
                    <FieldLabel>
                      <TruncatedText>
                        {t("ghostedAlertSecondsLabel")}
                      </TruncatedText>
                    </FieldLabel>
                    <LiquidGlassInput className="w-full h-10 overflow-hidden p-0">
                      <div className="flex items-center px-3.5 w-full h-full">
                        <Input
                          type="number"
                          min={15}
                          value={String(ghostedAlertSeconds)}
                          onChange={(e) =>
                            setGhostedAlertSeconds(
                              Number(e.target.value || 180),
                            )
                          }
                          className="flex h-full w-full py-2 text-sm bg-transparent! border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                        />
                      </div>
                    </LiquidGlassInput>
                  </Field>

                  <Field>
                    <FieldLabel>
                      <TruncatedText>
                        {t("autoReclaimMinutesLabel")}
                      </TruncatedText>
                    </FieldLabel>
                    <LiquidGlassInput className="w-full h-10 overflow-hidden p-0">
                      <div className="flex items-center px-3.5 w-full h-full">
                        <Input
                          type="number"
                          min={1}
                          value={String(autoReclaimMinutes)}
                          onChange={(e) =>
                            setAutoReclaimMinutes(Number(e.target.value || 5))
                          }
                          className="flex h-full w-full py-2 text-sm bg-transparent! border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                        />
                      </div>
                    </LiquidGlassInput>
                  </Field>

                  <Field>
                    <FieldLabel>
                      <TruncatedText>
                        {t("leadCollectorWeightLabel")}
                      </TruncatedText>
                    </FieldLabel>
                    <LiquidGlassInput className="w-full h-10 overflow-hidden p-0">
                      <div className="flex items-center px-3.5 w-full h-full">
                        <Input
                          type="number"
                          step="0.1"
                          min={0}
                          max={1}
                          value={String(leadCollectorWeight)}
                          onChange={(e) =>
                            setLeadCollectorWeight(
                              Number(e.target.value || 0.4),
                            )
                          }
                          className="flex h-full w-full py-2 text-sm bg-transparent! border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                        />
                      </div>
                    </LiquidGlassInput>
                  </Field>

                  <Field>
                    <FieldLabel>
                      <TruncatedText>
                        {t("orderCloserWeightLabel")}
                      </TruncatedText>
                    </FieldLabel>
                    <LiquidGlassInput className="w-full h-10 overflow-hidden p-0">
                      <div className="flex items-center px-3.5 w-full h-full">
                        <Input
                          type="number"
                          step="0.1"
                          min={0}
                          max={1}
                          value={String(orderCloserWeight)}
                          onChange={(e) =>
                            setOrderCloserWeight(Number(e.target.value || 0.6))
                          }
                          className="flex h-full w-full py-2 text-sm bg-transparent! border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                        />
                      </div>
                    </LiquidGlassInput>
                  </Field>

                  <Field>
                    <FieldLabel>
                      <TruncatedText>
                        {t("safetyBufferStockQtyLabel")}
                      </TruncatedText>
                    </FieldLabel>
                    <LiquidGlassInput className="w-full h-10 overflow-hidden p-0">
                      <div className="flex items-center px-3.5 w-full h-full">
                        <Input
                          type="number"
                          min={0}
                          value={String(safetyBufferStockQty)}
                          onChange={(e) =>
                            setSafetyBufferStockQty(Number(e.target.value || 0))
                          }
                          className="flex h-full w-full py-2 text-sm bg-transparent! border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                        />
                      </div>
                    </LiquidGlassInput>
                  </Field>

                  <div className="sm:col-span-3 space-y-2.5 pt-2">
                    <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/40">
                      <TruncatedText className="text-xs sm:text-sm font-medium">
                        {t("lockOrderAfterPrintLabel")}
                      </TruncatedText>
                      <Switch
                        checked={lockOrderAfterPrint}
                        onCheckedChange={setLockOrderAfterPrint}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/40">
                      <TruncatedText className="text-xs sm:text-sm font-medium">
                        {t("requireDepositOnHighRiskLabel")}
                      </TruncatedText>
                      <Switch
                        checked={requireDepositOnHighRisk}
                        onCheckedChange={setRequireDepositOnHighRisk}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/40">
                      <TruncatedText className="text-xs sm:text-sm font-medium">
                        {t("deductOnReturnedOrderLabel")}
                      </TruncatedText>
                      <Switch
                        checked={deductOnReturnedOrder}
                        onCheckedChange={setDeductOnReturnedOrder}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/40">
                      <TruncatedText className="text-xs sm:text-sm font-medium">
                        {t("autoReserveMarketplaceLabel")}
                      </TruncatedText>
                      <Switch
                        checked={autoReserveMarketplace}
                        onCheckedChange={setAutoReserveMarketplace}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/40">
                      <TruncatedText className="text-xs sm:text-sm font-medium">
                        {t("pushAvailableStockToMarketplaceLabel")}
                      </TruncatedText>
                      <Switch
                        checked={pushAvailableStockToMarketplace}
                        onCheckedChange={setPushAvailableStockToMarketplace}
                      />
                    </div>
                  </div>
                </FieldGroup>
              </FieldSet>
            </FieldGroup>
          </form>
        </GlassSurfaceCard>
      )}

      {activeTab === "MARKETPLACE_BRIDGE" && (
        <div className="space-y-3">
          {marketplaceReservations.length === 0 ? (
            <GlassEmptyState
              icon={<ShoppingBag className="w-6 h-6" />}
              title={
                <TruncatedText>
                  {t("marketplaceBridge.emptyTitle")}
                </TruncatedText>
              }
              description={t("marketplaceBridge.emptyDesc")}
            />
          ) : (
            marketplaceReservations.map((res) => (
              <GlassSurfaceCard key={res.orderSn} className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm">#{res.orderSn}</span>
                      <GlassBadge variant="primary" size="sm">
                        {res.pageShortCode}
                      </GlassBadge>
                      <GlassBadge variant="success" size="sm" dot>
                        {res.orderStatus}
                      </GlassBadge>
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {Number(res.totalAmount || 0).toLocaleString("vi-VN")}đ
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {res.buyerUsername} •{" "}
                      {res.items
                        .map(
                          (it) =>
                            `${it.itemName} x${it.quantity} (${it.externalItemId} ↔ ${it.mappedVariantId})`,
                        )
                        .join(" | ")}
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
                      icon={<ArrowRight className="w-3.5 h-3.5" />}
                      iconPosition="right"
                    >
                      <TruncatedText>
                        {t("marketplaceBridge.openChatBtn")}
                      </TruncatedText>
                    </PatternButton>
                  )}
                </div>
              </GlassSurfaceCard>
            ))
          )}
        </div>
      )}

      {activeTab === "WEBHOOK_INSPECTOR" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <GlassTabs
              size="sm"
              value={webhookStatusFilter}
              onValueChange={setWebhookStatusFilter}
              items={WEBHOOK_STATUS_FILTERS.map((st) => ({
                key: st,
                label:
                  st === "ALL"
                    ? t("allWebhookStatusesFilter")
                    : t(`processingStatuses.${st}`),
              }))}
            />
          </div>

          {webhookLogs.length === 0 ? (
            <GlassEmptyState
              icon={<Activity className="w-6 h-6" />}
              title={
                <TruncatedText>{t("emptyWebhookLogsTitle")}</TruncatedText>
              }
              description={t("webhookInspectorDesc")}
            />
          ) : (
            webhookLogs.map((log) => (
              <GlassSurfaceCard key={log.id} className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <GlassBadge variant="primary" size="sm">
                        <TruncatedText>
                          {t(`platforms.${log.channelType}`)}
                        </TruncatedText>
                      </GlassBadge>
                      <GlassBadge
                        variant={
                          log.processingStatus === "PROCESSED" ||
                          log.processingStatus === "REPLAYED_SUCCESS"
                            ? "success"
                            : log.processingStatus === "DUPLICATE_SKIPPED"
                              ? "warning"
                              : "danger"
                        }
                        size="sm"
                        dot
                      >
                        <TruncatedText>
                          {t(`processingStatuses.${log.processingStatus}`)}
                        </TruncatedText>
                      </GlassBadge>
                      <TruncatedText className="text-xs font-mono text-muted-foreground max-w-60">
                        {log.idempotencyKey}
                      </TruncatedText>
                    </div>
                    <TruncatedText
                      as="p"
                      className="text-xs text-muted-foreground"
                    >
                      {t("webhookLogSummary", {
                        eventType: log.eventType,
                        duration: log.processingDurationMs,
                        replayed: log.replayedCount,
                      })}
                    </TruncatedText>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <PatternButton
                      type="button"
                      variant="ghost"
                      color="neutral"
                      size="sm"
                      rounded="full"
                      onClick={() => setInspectingLog(log)}
                      icon={<Eye className="w-3.5 h-3.5" />}
                      iconPosition="left"
                    >
                      <TruncatedText>{t("inspectPayloadBtn")}</TruncatedText>
                    </PatternButton>

                    <PermissionGate
                      can="CHANNEL_WEBHOOK_INSPECT_REPLAY"
                      mode="disable"
                    >
                      <PatternButton
                        type="button"
                        variant="glass"
                        color="primary"
                        size="sm"
                        rounded="full"
                        isLoading={replayingLogId === log.id}
                        onClick={() => handleReplayWebhook(log.id)}
                        icon={<RotateCcw className="w-3.5 h-3.5" />}
                        iconPosition="left"
                      >
                        <TruncatedText>{t("replayWebhookBtn")}</TruncatedText>
                      </PatternButton>
                    </PermissionGate>
                  </div>
                </div>
              </GlassSurfaceCard>
            ))
          )}
        </div>
      )}

      {/* Modal Kết nối Kênh mới */}
      <GlassModal
        open={connectModalOpen}
        onOpenChange={setConnectModalOpen}
        title={
          <TruncatedText as="span">{t("connectModalTitle")}</TruncatedText>
        }
        description={t("connectModalDesc")}
        size="md"
        footer={
          <PatternButton
            type="submit"
            form="connect-channel-oauth-form"
            variant="solid"
            color="primary"
            size="md"
            rounded="full"
            fullWidth
            isLoading={isConnecting}
            icon={<ArrowRight className="w-4 h-4" />}
            iconPosition="right"
          >
            <TruncatedText>{t("submitConnectBtn")}</TruncatedText>
          </PatternButton>
        }
      >
        <form
          id="connect-channel-oauth-form"
          onSubmit={handleConnectChannelSubmit}
          className="p-2"
        >
          <FieldGroup>
            <FieldSet>
              <FieldGroup>
                <Field>
                  <FieldLabel>
                    <TruncatedText>{t("channelTypeLabel")}</TruncatedText>
                  </FieldLabel>
                  <Select
                    value={channelType}
                    onValueChange={(val) =>
                      setChannelType(val as ChannelPlatformType)
                    }
                  >
                    <LiquidGlassInput className="w-full h-10 overflow-hidden p-0">
                      <SelectTrigger className="w-full h-full rounded-full cursor-pointer border-0 shadow-none bg-transparent px-3.5">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-primary shrink-0" />
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                    </LiquidGlassInput>
                    <ContentSelect>
                      {CHANNEL_PLATFORMS.map((plat) => (
                        <ItemSelect key={plat} value={plat}>
                          <TruncatedText>
                            {t(`platforms.${plat}`)}
                          </TruncatedText>
                        </ItemSelect>
                      ))}
                    </ContentSelect>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel>
                    <TruncatedText>{t("pageNameLabel")}</TruncatedText>
                  </FieldLabel>
                  <LiquidGlassInput className="w-full h-10 overflow-hidden p-0">
                    <div className="flex items-center px-3.5 w-full h-full">
                      <Input
                        required
                        value={pageName}
                        onChange={(e) => setPageName(e.target.value)}
                        placeholder={t("pageNamePlaceholder")}
                        className="flex h-full w-full py-2 text-sm bg-transparent! border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                      />
                    </div>
                  </LiquidGlassInput>
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel>
                      <TruncatedText>{t("pageShortCodeLabel")}</TruncatedText>
                    </FieldLabel>
                    <LiquidGlassInput className="w-full h-10 overflow-hidden p-0">
                      <div className="flex items-center px-3.5 w-full h-full">
                        <Hash className="h-4 w-4 text-muted-foreground/50 mr-2 shrink-0" />
                        <Input
                          required
                          value={pageShortCode}
                          onChange={(e) => setPageShortCode(e.target.value)}
                          placeholder={t("pageShortCodePlaceholder")}
                          className="flex h-full w-full py-2 text-sm uppercase bg-transparent! border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                        />
                      </div>
                    </LiquidGlassInput>
                  </Field>

                  <Field>
                    <FieldLabel>
                      <TruncatedText>{t("externalPageIdLabel")}</TruncatedText>
                    </FieldLabel>
                    <LiquidGlassInput className="w-full h-10 overflow-hidden p-0">
                      <div className="flex items-center px-3.5 w-full h-full">
                        <Input
                          required
                          value={externalPageId}
                          onChange={(e) => setExternalPageId(e.target.value)}
                          placeholder={t("externalPageIdPlaceholder")}
                          className="flex h-full w-full py-2 text-sm bg-transparent! border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                        />
                      </div>
                    </LiquidGlassInput>
                  </Field>
                </div>

                <Field>
                  <FieldLabel>
                    <TruncatedText>{t("accessTokenLabel")}</TruncatedText>
                  </FieldLabel>
                  <LiquidGlassInput className="w-full h-10 overflow-hidden p-0">
                    <div className="flex items-center px-3.5 w-full h-full">
                      <KeyRound className="h-4 w-4 text-muted-foreground/50 mr-2.5 shrink-0" />
                      <Input
                        required
                        type="password"
                        value={accessToken}
                        onChange={(e) => setAccessToken(e.target.value)}
                        placeholder={t("accessTokenPlaceholder")}
                        className="flex h-full w-full py-2 text-sm bg-transparent! border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                      />
                    </div>
                  </LiquidGlassInput>
                </Field>

                <Field>
                  <FieldLabel>
                    <TruncatedText>{t("refreshTokenLabel")}</TruncatedText>
                  </FieldLabel>
                  <LiquidGlassInput className="w-full h-10 overflow-hidden p-0">
                    <div className="flex items-center px-3.5 w-full h-full">
                      <Input
                        type="password"
                        value={refreshToken}
                        onChange={(e) => setRefreshToken(e.target.value)}
                        placeholder={t("refreshTokenPlaceholder")}
                        className="flex h-full w-full py-2 text-sm bg-transparent! border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                      />
                    </div>
                  </LiquidGlassInput>
                </Field>

                <Field>
                  <FieldLabel>
                    <TruncatedText>{t("metaDatasetIdLabel")}</TruncatedText>
                  </FieldLabel>
                  <LiquidGlassInput className="w-full h-10 overflow-hidden p-0">
                    <div className="flex items-center px-3.5 w-full h-full">
                      <Input
                        value={metaDatasetId}
                        onChange={(e) => setMetaDatasetId(e.target.value)}
                        placeholder={t("metaDatasetIdPlaceholder")}
                        className="flex h-full w-full py-2 text-sm bg-transparent! border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                      />
                    </div>
                  </LiquidGlassInput>
                </Field>
              </FieldGroup>
            </FieldSet>
          </FieldGroup>
        </form>
      </GlassModal>

      {/* Modal Chỉnh sửa Kênh tích hợp (PATCH /channels/:shopId/:channelId) */}
      <GlassModal
        open={Boolean(editingChannel)}
        onOpenChange={(open) => {
          if (!open) setEditingChannel(null);
        }}
        title={
          <TruncatedText as="span">{t("editChannelModalTitle")}</TruncatedText>
        }
        description={editingChannel?.pageName}
        size="md"
        footer={
          <PatternButton
            type="submit"
            form="edit-channel-integration-form"
            variant="solid"
            color="primary"
            size="md"
            rounded="full"
            fullWidth
            isLoading={isUpdatingChannel}
            icon={<CheckCircle2 className="w-4 h-4" />}
            iconPosition="left"
          >
            <TruncatedText>{t("saveEditChannelBtn")}</TruncatedText>
          </PatternButton>
        }
      >
        <form
          id="edit-channel-integration-form"
          onSubmit={handleEditChannelSubmit}
        >
          <FieldGroup>
            <FieldSet>
              <FieldGroup>
                <Field>
                  <FieldLabel>
                    <TruncatedText>{t("pageNameLabel")}</TruncatedText>
                  </FieldLabel>
                  <LiquidGlassInput className="w-full h-10 overflow-hidden p-0">
                    <div className="flex items-center px-3.5 w-full h-full">
                      <Input
                        required
                        value={editPageName}
                        onChange={(e) => setEditPageName(e.target.value)}
                        className="flex h-full w-full py-2 text-sm bg-transparent! border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                      />
                    </div>
                  </LiquidGlassInput>
                </Field>

                <Field>
                  <FieldLabel>
                    <TruncatedText>{t("pageShortCodeLabel")}</TruncatedText>
                  </FieldLabel>
                  <LiquidGlassInput className="w-full h-10 overflow-hidden p-0">
                    <div className="flex items-center px-3.5 w-full h-full">
                      <Input
                        required
                        value={editPageShortCode}
                        onChange={(e) => setEditPageShortCode(e.target.value)}
                        className="flex h-full w-full py-2 text-sm uppercase bg-transparent! border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                      />
                    </div>
                  </LiquidGlassInput>
                </Field>

                <Field>
                  <FieldLabel>
                    <TruncatedText>{t("accessTokenLabel")}</TruncatedText>
                  </FieldLabel>
                  <LiquidGlassInput className="w-full h-10 overflow-hidden p-0">
                    <div className="flex items-center px-3.5 w-full h-full">
                      <Input
                        type="password"
                        value={editAccessToken}
                        onChange={(e) => setEditAccessToken(e.target.value)}
                        placeholder={t("newAccessTokenOptionalPlaceholder")}
                        className="flex h-full w-full py-2 text-sm bg-transparent! border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                      />
                    </div>
                  </LiquidGlassInput>
                </Field>

                <Field>
                  <FieldLabel>
                    <TruncatedText>{t("metaDatasetIdLabel")}</TruncatedText>
                  </FieldLabel>
                  <LiquidGlassInput className="w-full h-10 overflow-hidden p-0">
                    <div className="flex items-center px-3.5 w-full h-full">
                      <Input
                        value={editMetaDatasetId}
                        onChange={(e) => setEditMetaDatasetId(e.target.value)}
                        placeholder={t("metaDatasetIdPlaceholder")}
                        className="flex h-full w-full py-2 text-sm bg-transparent! border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                      />
                    </div>
                  </LiquidGlassInput>
                </Field>

                <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/40">
                  <TruncatedText className="text-xs sm:text-sm font-medium">
                    {t("channelActiveToggleLabel")}
                  </TruncatedText>
                  <Switch
                    checked={editIsActive}
                    onCheckedChange={setEditIsActive}
                  />
                </div>
              </FieldGroup>
            </FieldSet>
          </FieldGroup>
        </form>
      </GlassModal>

      {/* Modal T01: Xem chi tiết Payload & Error Stack của Webhook */}
      <GlassModal
        open={Boolean(inspectingLog)}
        onOpenChange={(open) => {
          if (!open) setInspectingLog(null);
        }}
        title={
          <TruncatedText as="span">
            {t("webhookPayloadModalTitle")}
          </TruncatedText>
        }
        description={inspectingLog?.idempotencyKey}
        size="lg"
      >
        {inspectingLog && (
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl border border-border/50 bg-muted/30 space-y-1">
              <p className="font-bold text-foreground">
                {t("webhookPayloadLabel")}
              </p>
              <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-[11px] text-muted-foreground max-h-60">
                {JSON.stringify(inspectingLog.rawPayloadJson || {}, null, 2)}
              </pre>
            </div>

            {inspectingLog.errorStack && (
              <div className="p-3 rounded-xl border border-red-500/40 bg-red-500/10 space-y-1">
                <p className="font-bold text-red-500">
                  {t("webhookErrorStackLabel")}
                </p>
                <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-[11px] text-red-400 max-h-40">
                  {inspectingLog.errorStack}
                </pre>
              </div>
            )}
          </div>
        )}
      </GlassModal>
    </div>
  );
}
