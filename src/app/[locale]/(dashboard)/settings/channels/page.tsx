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
} from "lucide-react";
import { useTranslations } from "next-intl";
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
import {
  type ChannelPlatformType,
  simulateOmnichannelWebhookApi,
} from "@/lib/stores/channel/api";
import { useChannelWorkspaceStore } from "@/lib/stores/channel/use-channel-workspace-store";
import {
  getWorkspaceSettingsApi,
  type RoutingStrategyType,
  updateWorkspaceSettingsApi,
} from "@/lib/stores/iam/api";
import { usePermissionStore } from "@/lib/stores/iam/use-permission-store";
import { showErrorToast, showInfoToast, showSuccessToast } from "@/utils/toast";

type ChannelsTabMode =
  | "CONNECTED_CHANNELS"
  | "ROUTING_AND_SLA"
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

export default function OmnichannelSettingsPage() {
  const t = useTranslations("SettingsChannels");

  const activeShopId = usePermissionStore((s) => s.activeShopId);
  const channels = useChannelWorkspaceStore((s) => s.channels);
  const webhookLogs = useChannelWorkspaceStore((s) => s.webhookLogs);
  const fetchShopChannels = useChannelWorkspaceStore(
    (s) => s.fetchShopChannels,
  );
  const connectChannelOAuth = useChannelWorkspaceStore(
    (s) => s.connectChannelOAuth,
  );
  const disconnectChannel = useChannelWorkspaceStore(
    (s) => s.disconnectChannel,
  );
  const runTokenDoctor = useChannelWorkspaceStore((s) => s.runTokenDoctor);
  const fetchWebhookLogs = useChannelWorkspaceStore((s) => s.fetchWebhookLogs);
  const replayWebhookLog = useChannelWorkspaceStore((s) => s.replayWebhookLog);

  const [activeTab, setActiveTab] =
    useState<ChannelsTabMode>("CONNECTED_CHANNELS");
  const [connectModalOpen, setConnectModalOpen] = useState(false);

  const [channelType, setChannelType] =
    useState<ChannelPlatformType>("FACEBOOK_PAGE");
  const [pageName, setPageName] = useState("");
  const [pageShortCode, setPageShortCode] = useState("");
  const [externalPageId, setExternalPageId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [metaDatasetId, setMetaDatasetId] = useState("");

  const [isConnecting, setIsConnecting] = useState(false);
  const [isRunningDoctor, setIsRunningDoctor] = useState(false);
  const [simulatingChannelId, setSimulatingChannelId] = useState<string | null>(
    null,
  );
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [replayingLogId, setReplayingLogId] = useState<string | null>(null);

  const [routingStrategy, setRoutingStrategy] =
    useState<RoutingStrategyType>("STICKY_AGENT");
  const [slaResponseSeconds, setSlaResponseSeconds] = useState<number>(180);
  const [autoReclaimMinutes, setAutoReclaimMinutes] = useState<number>(5);
  const [leadCollectorWeight, setLeadCollectorWeight] = useState<number>(0.4);
  const [orderCloserWeight, setOrderCloserWeight] = useState<number>(0.6);
  const [lockOrderAfterPrint, setLockOrderAfterPrint] = useState<boolean>(true);
  const [autoReserveMarketplace, setAutoReserveMarketplace] =
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
      setAutoReclaimMinutes(Number(data.autoReclaimMinutes || 5));
      setLockOrderAfterPrint(Boolean(data.lockOrderAfterPrint ?? true));
      if (data.commissionSplitConfigJson) {
        setLeadCollectorWeight(
          Number(data.commissionSplitConfigJson.leadCollectorWeight ?? 0.4),
        );
        setOrderCloserWeight(
          Number(data.commissionSplitConfigJson.orderCloserWeight ?? 0.6),
        );
      }
      if (data.marketplaceSyncConfigJson) {
        setAutoReserveMarketplace(
          Boolean(
            data.marketplaceSyncConfigJson.autoReserveStockOnMarketplaceOrder ??
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
    fetchWebhookLogs(activeShopId);
  }, [
    activeShopId,
    fetchShopChannels,
    loadWorkspaceSettings,
    fetchWebhookLogs,
  ]);

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
      });
      setConnectModalOpen(false);
      setPageName("");
      setPageShortCode("");
      setExternalPageId("");
      setAccessToken("");
      setRefreshToken("");
      setMetaDatasetId("");
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

  const handleSimulateWebhook = async (ch: any) => {
    if (!activeShopId) return;
    setSimulatingChannelId(ch.id);
    try {
      await simulateOmnichannelWebhookApi(ch.channelType, {
        externalPageId: ch.externalPageId,
        threadId: `thread_${Date.now()}`,
        senderName: `Khách ${ch.pageShortCode}`,
        messageText: `Tư vấn mẫu mới trên kênh ${ch.pageName}`,
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
        autoReclaimMinutes,
        leadCollectorWeight,
        orderCloserWeight,
        lockOrderAfterPrint,
        autoReserveStockOnMarketplaceOrder: autoReserveMarketplace,
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
            <PatternButton
              type="button"
              variant="glass"
              color="info"
              size="sm"
              rounded={"full"}
              isLoading={isRunningDoctor}
              onClick={handleRunTokenDoctor}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
              iconPosition="left"
            >
              <TruncatedText>{t("runTokenDoctorBtn")}</TruncatedText>
            </PatternButton>

            <PatternButton
              type="button"
              variant="solid"
              color="primary"
              size="sm"
              rounded={"full"}
              onClick={() => setConnectModalOpen(true)}
              icon={<Plus className="w-4 h-4" />}
              iconPosition="left"
            >
              <TruncatedText>{t("connectNewChannelBtn")}</TruncatedText>
            </PatternButton>
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
                <PatternButton
                  type="button"
                  variant="solid"
                  color="primary"
                  size="md"
                  rounded={"full"}
                  onClick={() => setConnectModalOpen(true)}
                  icon={<ArrowRight className="w-4 h-4" />}
                  iconPosition="right"
                >
                  <TruncatedText>{t("connectNewChannelBtn")}</TruncatedText>
                </PatternButton>
              }
            />
          ) : (
            channels.map((ch) => (
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
                          <TruncatedText>{ch.webhookStatus}</TruncatedText>
                        </GlassBadge>
                      </div>
                      <TruncatedText
                        as="p"
                        className="text-xs text-muted-foreground mt-0.5"
                      >
                        {ch.channelType} • ID: {ch.externalPageId}
                        {ch.metaDatasetId
                          ? ` • Meta Dataset: ${ch.metaDatasetId}`
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
                      rounded={"full"}
                      isLoading={simulatingChannelId === ch.id}
                      onClick={() => handleSimulateWebhook(ch)}
                      icon={<Zap className="w-3.5 h-3.5" />}
                      iconPosition="left"
                    >
                      <TruncatedText>{t("simulateWebhookBtn")}</TruncatedText>
                    </PatternButton>

                    <PatternButton
                      type="button"
                      variant="ghost"
                      color="danger"
                      size="sm"
                      rounded={"full"}
                      isLoading={disconnectingId === ch.id}
                      onClick={() => handleDisconnectChannel(ch.id)}
                      icon={<Trash2 className="w-3.5 h-3.5" />}
                      iconPosition="left"
                    >
                      <TruncatedText>{t("disconnectBtn")}</TruncatedText>
                    </PatternButton>
                  </div>
                </div>
              </GlassSurfaceCard>
            ))
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
            <PatternButton
              type="submit"
              form="workspace-routing-form"
              variant="solid"
              color="primary"
              size="md"
              rounded={"full"}
              fullWidth
              isLoading={isSavingRouting}
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
            >
              <TruncatedText>{t("saveRoutingConfigBtn")}</TruncatedText>
            </PatternButton>
          }
        >
          <form
            id="workspace-routing-form"
            onSubmit={handleSaveRoutingSettings}
          >
            <FieldGroup>
              <FieldSet>
                <FieldGroup className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field className="sm:col-span-2">
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

                  <div className="sm:col-span-2 space-y-3 pt-2">
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
                        {t("autoReserveMarketplaceLabel")}
                      </TruncatedText>
                      <Switch
                        checked={autoReserveMarketplace}
                        onCheckedChange={setAutoReserveMarketplace}
                      />
                    </div>
                  </div>
                </FieldGroup>
              </FieldSet>
            </FieldGroup>
          </form>
        </GlassSurfaceCard>
      )}

      {activeTab === "WEBHOOK_INSPECTOR" && (
        <div className="space-y-3">
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
                        <TruncatedText>{log.channelType}</TruncatedText>
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
                        <TruncatedText>{log.processingStatus}</TruncatedText>
                      </GlassBadge>
                      <TruncatedText className="text-xs font-mono text-muted-foreground max-w-60">
                        {log.idempotencyKey}
                      </TruncatedText>
                    </div>
                    <TruncatedText
                      as="p"
                      className="text-xs text-muted-foreground"
                    >
                      Event: {log.eventType} • {log.processingDurationMs}ms •
                      Replayed: {log.replayedCount}
                    </TruncatedText>
                  </div>

                  <PatternButton
                    type="button"
                    variant="glass"
                    color="primary"
                    size="sm"
                    rounded={"full"}
                    isLoading={replayingLogId === log.id}
                    onClick={() => handleReplayWebhook(log.id)}
                    icon={<RotateCcw className="w-3.5 h-3.5" />}
                    iconPosition="left"
                  >
                    <TruncatedText>{t("replayWebhookBtn")}</TruncatedText>
                  </PatternButton>
                </div>
              </GlassSurfaceCard>
            ))
          )}
        </div>
      )}

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
            rounded={"full"}
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
                          <TruncatedText>{plat}</TruncatedText>
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
    </div>
  );
}
