/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  Sparkles,
  Copy,
  ShieldCheck,
  Code2,
  Link2,
  Layers,
  Star,
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
  GlassAlert,
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
  type ResolvedChannelTokenCandidatePage,
  type ResolvedChannelTokenMetadata,
  type SaasAppProfileItem,
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
import { cn } from "@/lib/utils";

type ChannelsTabMode =
  | "CONNECTED_CHANNELS"
  | "SAAS_APP_PROFILES"
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

const DEFAULT_API_VERSION_BY_PLATFORM: Record<ChannelPlatformType, string> = {
  FACEBOOK_PAGE: "v27.1",
  INSTAGRAM: "v27.1",
  ZALO_OA: "v3.0",
  TIKTOK_SHOP: "202309",
  SHOPEE: "v2",
  LAZADA: "v2",
  WEBSITE_LIVECHAT: "v1.0",
};

export default function OmnichannelSettingsPage() {
  const t = useTranslations("SettingsChannels");
  const router = useRouter();

  const activeShopId = usePermissionStore((s) => s.activeShopId);
  const membersRefreshTick = usePermissionStore((s) => s.membersRefreshTick);
  const channels = useChannelWorkspaceStore((s) => s.channels);
  const saasBlueprints = useChannelWorkspaceStore((s) => s.saasBlueprints);
  const saasProfiles = useChannelWorkspaceStore((s) => s.saasProfiles);
  const webhookLogs = useChannelWorkspaceStore((s) => s.webhookLogs);
  const marketplaceReservations = useChannelWorkspaceStore(
    (s) => s.marketplaceReservations,
  );
  const fetchShopChannels = useChannelWorkspaceStore(
    (s) => s.fetchShopChannels,
  );
  const fetchSaasWebhookConfig = useChannelWorkspaceStore(
    (s) => s.fetchSaasWebhookConfig,
  );
  const fetchSaasAppProfiles = useChannelWorkspaceStore(
    (s) => s.fetchSaasAppProfiles,
  );
  const createSaasAppProfile = useChannelWorkspaceStore(
    (s) => s.createSaasAppProfile,
  );
  const updateSaasAppProfile = useChannelWorkspaceStore(
    (s) => s.updateSaasAppProfile,
  );
  const deleteSaasAppProfile = useChannelWorkspaceStore(
    (s) => s.deleteSaasAppProfile,
  );
  const injectWebhooksForSaasProfile = useChannelWorkspaceStore(
    (s) => s.injectWebhooksForSaasProfile,
  );
  const resolveChannelTokenMetadata = useChannelWorkspaceStore(
    (s) => s.resolveChannelTokenMetadata,
  );
  const connectChannelOAuth = useChannelWorkspaceStore(
    (s) => s.connectChannelOAuth,
  );
  const batchConnectChannels = useChannelWorkspaceStore(
    (s) => s.batchConnectChannels,
  );
  const syncChannelWebhook = useChannelWorkspaceStore(
    (s) => s.syncChannelWebhook,
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

  // State cho Tab Quản lý Đa Hồ sơ SaaS (SAAS_APP_PROFILES)
  const [saasProfileModalOpen, setSaasProfileModalOpen] = useState(false);
  const [editingSaasProfile, setEditingSaasProfile] =
    useState<SaasAppProfileItem | null>(null);
  const [profName, setProfName] = useState("");
  const [profChannelType, setProfChannelType] =
    useState<ChannelPlatformType>("FACEBOOK_PAGE");
  const [profApiVersion, setProfApiVersion] = useState("v27.1");
  const [profAppId, setProfAppId] = useState("");
  const [profAppSecret, setProfAppSecret] = useState("");
  const [profVerifyToken, setProfVerifyToken] = useState("");
  const [profAutoHidePhone, setProfAutoHidePhone] = useState(true);
  const [profSyncEcho, setProfSyncEcho] = useState(true);
  const [profAutoInjectWebhook, setProfAutoInjectWebhook] = useState(true);
  const [profIsDefault, setProfIsDefault] = useState(true);
  const [isSavingSaasProfile, setIsSavingSaasProfile] = useState(false);
  const [injectingProfileId, setInjectingProfileId] = useState<string | null>(
    null,
  );
  const [deletingProfileId, setDeletingProfileId] = useState<string | null>(
    null,
  );

  // State cho Modal Kết nối Kênh (Chỉ cần chọn Hồ sơ SaaS & dán Access Token)
  const [channelType, setChannelType] =
    useState<ChannelPlatformType>("FACEBOOK_PAGE");
  const [selectedSaasProfileId, setSelectedSaasProfileId] =
    useState<string>("");
  const [showCustomSaasOverride, setShowCustomSaasOverride] = useState(false);
  const [apiVersion, setApiVersion] = useState("v27.1");
  const [appId, setAppId] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const [webhookVerifySecret, setWebhookVerifySecret] = useState("");
  const [webhookCallbackUrl, setWebhookCallbackUrl] = useState("");
  const [autoHidePhoneComments, setAutoHidePhoneComments] = useState(true);
  const [syncEchoMessagesFromNativeApp, setSyncEchoMessagesFromNativeApp] =
    useState(true);
  const [allowSandboxSimulation, setAllowSandboxSimulation] = useState(false);

  const [pageName, setPageName] = useState("");
  const [pageShortCode, setPageShortCode] = useState("");
  const [externalPageId, setExternalPageId] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [metaDatasetId, setMetaDatasetId] = useState("");
  const [capiAccessToken, setCapiAccessToken] = useState("");
  const [resolvedTokenMeta, setResolvedTokenMeta] =
    useState<ResolvedChannelTokenMetadata | null>(null);
  const [candidatePages, setCandidatePages] = useState<
    ResolvedChannelTokenCandidatePage[]
  >([]);
  const [selectedBatchPageIds, setSelectedBatchPageIds] = useState<string[]>(
    [],
  );
  const [subscribedFields, setSubscribedFields] = useState<string[]>([]);
  const [isResolvingTokenMeta, setIsResolvingTokenMeta] = useState(false);

  const [editSaasProfileId, setEditSaasProfileId] = useState<string>("");
  const [editPageName, setEditPageName] = useState("");
  const [editPageShortCode, setEditPageShortCode] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [editApiVersion, setEditApiVersion] = useState("v27.1");
  const [editAppId, setEditAppId] = useState("");
  const [editAppSecret, setEditAppSecret] = useState("");
  const [editWebhookVerifySecret, setEditWebhookVerifySecret] = useState("");
  const [editAutoHidePhoneComments, setEditAutoHidePhoneComments] =
    useState(true);
  const [editSyncEchoMessages, setEditSyncEchoMessages] = useState(true);
  const [editAccessToken, setEditAccessToken] = useState("");
  const [editRefreshToken, setEditRefreshToken] = useState("");
  const [editMetaDatasetId, setEditMetaDatasetId] = useState("");
  const [editCapiAccessToken, setEditCapiAccessToken] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [isUpdatingChannel, setIsUpdatingChannel] = useState(false);

  const [webhookStatusFilter, setWebhookStatusFilter] = useState<string>("ALL");

  const [isConnecting, setIsConnecting] = useState(false);
  const [isRunningDoctor, setIsRunningDoctor] = useState(false);
  const [syncingWebhookChannelId, setSyncingWebhookChannelId] = useState<
    string | null
  >(null);
  const [simulatingChannelId, setSimulatingChannelId] = useState<string | null>(
    null,
  );
  const [simulatingCommentChannelId, setSimulatingCommentChannelId] = useState<
    string | null
  >(null);
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
    fetchSaasWebhookConfig(activeShopId);
    fetchSaasAppProfiles(activeShopId);
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
    fetchSaasWebhookConfig,
    fetchSaasAppProfiles,
    loadWorkspaceSettings,
    fetchWebhookLogs,
    fetchMarketplaceReservations,
  ]);

  const matchingPlatformProfiles = useMemo(
    () => saasProfiles.filter((p) => p.channelType === channelType),
    [saasProfiles, channelType],
  );

  // Tự động chọn Hồ sơ SaaS mặc định của nền tảng khi mở Modal Kết nối kênh hoặc đổi loại kênh
  useEffect(() => {
    const defaultProf =
      matchingPlatformProfiles.find((p) => p.isDefault && p.isActive) ||
      matchingPlatformProfiles[0];

    if (defaultProf) {
      setSelectedSaasProfileId(defaultProf.id);
      setApiVersion(defaultProf.apiVersion);
      setAppId(defaultProf.appId);
      setWebhookCallbackUrl(defaultProf.webhookCallbackUrl);
      setWebhookVerifySecret(defaultProf.webhookVerifyToken);
      setAutoHidePhoneComments(defaultProf.autoHidePhoneComments);
      setSyncEchoMessagesFromNativeApp(
        defaultProf.syncEchoMessagesFromNativeApp,
      );
      return;
    }

    setSelectedSaasProfileId("");
    const bp = saasBlueprints.find((item) => item.channelType === channelType);
    if (bp) {
      setApiVersion(
        bp.defaultApiVersion || DEFAULT_API_VERSION_BY_PLATFORM[channelType],
      );
      setAppId(bp.defaultAppId || "");
      setWebhookCallbackUrl(bp.webhookCallbackUrl);
      setWebhookVerifySecret(bp.webhookVerifyToken);
    } else {
      setApiVersion(DEFAULT_API_VERSION_BY_PLATFORM[channelType]);
    }
  }, [channelType, matchingPlatformProfiles, saasBlueprints]);

  const activeSelectedSaasProfile = useMemo(
    () =>
      matchingPlatformProfiles.find((p) => p.id === selectedSaasProfileId) ||
      null,
    [matchingPlatformProfiles, selectedSaasProfileId],
  );

  const handleCopyText = async (value: string, toastMessage: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      showSuccessToast(toastMessage);
    } catch {}
  };

  const handleOpenCreateSaasProfileModal = (
    defaultPlat: ChannelPlatformType = "FACEBOOK_PAGE",
  ) => {
    setEditingSaasProfile(null);
    setProfChannelType(defaultPlat);
    setProfName("");
    setProfApiVersion(DEFAULT_API_VERSION_BY_PLATFORM[defaultPlat]);
    setProfAppId("");
    setProfAppSecret("");
    const bp = saasBlueprints.find((b) => b.channelType === defaultPlat);
    setProfVerifyToken(
      bp?.webhookVerifyToken || "pancake_seller_os_verify_2026",
    );
    setProfAutoHidePhone(true);
    setProfSyncEcho(true);
    setProfAutoInjectWebhook(true);
    setProfIsDefault(
      !saasProfiles.some((p) => p.channelType === defaultPlat && p.isDefault),
    );
    setSaasProfileModalOpen(true);
  };

  const handleOpenEditSaasProfileModal = (prof: SaasAppProfileItem) => {
    setEditingSaasProfile(prof);
    setProfChannelType(prof.channelType);
    setProfName(prof.name);
    setProfApiVersion(prof.apiVersion);
    setProfAppId(prof.appId);
    setProfAppSecret("");
    setProfVerifyToken(prof.webhookVerifyToken);
    setProfAutoHidePhone(prof.autoHidePhoneComments);
    setProfSyncEcho(prof.syncEchoMessagesFromNativeApp);
    setProfAutoInjectWebhook(prof.autoInjectWebhookOnConnect);
    setProfIsDefault(prof.isDefault);
    setSaasProfileModalOpen(true);
  };

  const handleSaveSaasProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShopId || !profName.trim() || !profAppId.trim()) return;
    setIsSavingSaasProfile(true);
    try {
      if (editingSaasProfile) {
        await updateSaasAppProfile(activeShopId, editingSaasProfile.id, {
          name: profName.trim(),
          apiVersion: profApiVersion.trim() || undefined,
          appId: profAppId.trim(),
          appSecret: profAppSecret.trim() || undefined,
          webhookVerifyToken: profVerifyToken.trim() || undefined,
          autoHidePhoneComments: profAutoHidePhone,
          syncEchoMessagesFromNativeApp: profSyncEcho,
          autoInjectWebhookOnConnect: profAutoInjectWebhook,
          isDefault: profIsDefault,
          propagateToBoundChannels: true,
        });
        showSuccessToast(
          t("saasProfilesTab.updatedProfileToast", { name: profName.trim() }),
        );
      } else {
        await createSaasAppProfile(activeShopId, {
          name: profName.trim(),
          channelType: profChannelType,
          apiVersion: profApiVersion.trim() || undefined,
          appId: profAppId.trim(),
          appSecret: profAppSecret.trim() || undefined,
          webhookVerifyToken: profVerifyToken.trim() || undefined,
          autoHidePhoneComments: profAutoHidePhone,
          syncEchoMessagesFromNativeApp: profSyncEcho,
          autoInjectWebhookOnConnect: profAutoInjectWebhook,
          isDefault: profIsDefault,
          autoRegisterAppWebhookOnPlatform: true,
        });
        showSuccessToast(
          t("saasProfilesTab.createdProfileToast", { name: profName.trim() }),
        );
      }
      setSaasProfileModalOpen(false);
    } catch (err: any) {
      showErrorToast(err?.response?.data?.message || "Failed");
    } finally {
      setIsSavingSaasProfile(false);
    }
  };

  const handleSetDefaultSaasProfile = async (prof: SaasAppProfileItem) => {
    if (!activeShopId || prof.isDefault) return;
    try {
      await updateSaasAppProfile(activeShopId, prof.id, {
        isDefault: true,
        propagateToBoundChannels: false,
      });
      showSuccessToast(
        t("saasProfilesTab.setDefaultSuccessToast", { name: prof.name }),
      );
    } catch (err: any) {
      showErrorToast(err?.response?.data?.message || "Failed");
    }
  };

  const handleInjectAllWebhooksForProfile = async (
    prof: SaasAppProfileItem,
  ) => {
    if (!activeShopId) return;
    setInjectingProfileId(prof.id);
    try {
      const res = await injectWebhooksForSaasProfile(activeShopId, prof.id);
      showSuccessToast(
        t("saasProfilesTab.injectedAllWebhooksToast", {
          successCount: res?.injectedSuccessCount || 0,
          totalCount: res?.totalChannels || 0,
        }),
      );
    } catch (err: any) {
      showErrorToast(err?.response?.data?.message || "Failed");
    } finally {
      setInjectingProfileId(null);
    }
  };

  const handleDeleteSaasProfile = async (profileId: string) => {
    if (!activeShopId) return;
    setDeletingProfileId(profileId);
    try {
      await deleteSaasAppProfile(activeShopId, profileId);
      showInfoToast(t("saasProfilesTab.deletedProfileToast"));
    } catch (err: any) {
      showErrorToast(err?.response?.data?.message || "Failed");
    } finally {
      setDeletingProfileId(null);
    }
  };

  const handleAutoResolveTokenMetadata = useCallback(
    async (
      rawTok?: string,
      targetPlat?: ChannelPlatformType,
      overrideProfileId?: string,
    ) => {
      const tokenToResolve = (rawTok ?? accessToken).trim();
      const platformToUse = targetPlat ?? channelType;
      const profileIdToUse = overrideProfileId ?? selectedSaasProfileId;
      if (!activeShopId || tokenToResolve.length < 6) return;

      setIsResolvingTokenMeta(true);
      try {
        const resolved = await resolveChannelTokenMetadata(activeShopId, {
          channelType: platformToUse,
          accessToken: tokenToResolve,
          saasAppProfileId: profileIdToUse || undefined,
          externalPageId: externalPageId.trim() || undefined,
          apiVersion: showCustomSaasOverride
            ? apiVersion.trim() || undefined
            : undefined,
          appId: showCustomSaasOverride ? appId.trim() || undefined : undefined,
          appSecret: showCustomSaasOverride
            ? appSecret.trim() || undefined
            : undefined,
          allowSandboxSimulation,
        });
        if (resolved) {
          setResolvedTokenMeta(resolved);
          setCandidatePages(resolved.candidatePages || []);
          setSubscribedFields(resolved.subscribedFields || []);
          if (resolved.webhookCallbackUrl) {
            setWebhookCallbackUrl(resolved.webhookCallbackUrl);
          }
          if (resolved.webhookVerifyToken && !webhookVerifySecret) {
            setWebhookVerifySecret(resolved.webhookVerifyToken);
          }
          if (resolved.appIdDetected && !appId) {
            setAppId(resolved.appIdDetected);
          }

          if (!resolved.requiresPageSelection) {
            setPageName(resolved.pageName);
            setPageShortCode(resolved.pageShortCode);
            setExternalPageId(resolved.externalPageId);
            setAvatarUrl(resolved.avatarUrl || "");
            const matchedCand = (resolved.candidatePages || []).find(
              (c) => c.externalPageId === resolved.externalPageId,
            );
            if (matchedCand?.pageAccessToken) {
              setAccessToken(matchedCand.pageAccessToken);
            }
            setSelectedBatchPageIds(
              resolved.externalPageId ? [resolved.externalPageId] : [],
            );
            showSuccessToast(
              t("autoFetchTokenSuccessToast", { name: resolved.pageName }),
            );
          } else {
            setPageName("");
            setPageShortCode("");
            setExternalPageId("");
            setAvatarUrl("");
            setSelectedBatchPageIds(
              (resolved.candidatePages || []).map((c) => c.externalPageId),
            );
            if (resolved.diagnosticMessage) {
              showInfoToast(resolved.diagnosticMessage);
            }
          }
        }
      } catch (err: any) {
        showErrorToast(err?.response?.data?.message || "Failed");
      } finally {
        setIsResolvingTokenMeta(false);
      }
    },
    [
      activeShopId,
      accessToken,
      channelType,
      selectedSaasProfileId,
      showCustomSaasOverride,
      externalPageId,
      apiVersion,
      appId,
      appSecret,
      allowSandboxSimulation,
      webhookVerifySecret,
      resolveChannelTokenMetadata,
      t,
    ],
  );

  const handleOpenEditChannel = (ch: ConnectedChannelItem) => {
    setEditingChannel(ch);
    setEditSaasProfileId(
      ch.saasAppProfileId || ch.platformConfigJson?.saasAppProfileId || "",
    );
    setEditPageName(ch.pageName);
    setEditPageShortCode(ch.pageShortCode);
    setEditAvatarUrl(ch.avatarUrl || "");
    setEditApiVersion(
      ch.apiVersion ||
        ch.platformConfigJson?.apiVersion ||
        DEFAULT_API_VERSION_BY_PLATFORM[ch.channelType],
    );
    setEditAppId(ch.appId || ch.platformConfigJson?.appId || "");
    setEditAppSecret("");
    setEditWebhookVerifySecret(ch.webhookVerifyToken || "");
    setEditAutoHidePhoneComments(
      Boolean(ch.platformConfigJson?.autoHidePhoneComments ?? true),
    );
    setEditSyncEchoMessages(
      Boolean(ch.platformConfigJson?.syncEchoMessagesFromNativeApp ?? true),
    );
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
        saasAppProfileId: editSaasProfileId || undefined,
        pageName: editPageName.trim() || undefined,
        pageShortCode: editPageShortCode.trim().toUpperCase() || undefined,
        avatarUrl: editAvatarUrl.trim() || undefined,
        apiVersion: editApiVersion.trim() || undefined,
        appId: editAppId.trim() || undefined,
        appSecret: editAppSecret.trim() || undefined,
        webhookVerifySecret: editWebhookVerifySecret.trim() || undefined,
        autoHidePhoneComments: editAutoHidePhoneComments,
        syncEchoMessagesFromNativeApp: editSyncEchoMessages,
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

  const resetConnectModalState = () => {
    setPageName("");
    setPageShortCode("");
    setExternalPageId("");
    setAvatarUrl("");
    setAccessToken("");
    setRefreshToken("");
    setAppSecret("");
    setMetaDatasetId("");
    setCapiAccessToken("");
    setShowCustomSaasOverride(false);
    setResolvedTokenMeta(null);
    setCandidatePages([]);
    setSelectedBatchPageIds([]);
    setSubscribedFields([]);
  };

  const handleConnectChannelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShopId || !accessToken.trim()) {
      return;
    }

    setIsConnecting(true);
    try {
      const selectedPagesForBatch = candidatePages.filter(
        (cand) =>
          selectedBatchPageIds.includes(cand.externalPageId) &&
          cand.pageAccessToken,
      );

      if (selectedPagesForBatch.length > 1 && !externalPageId.trim()) {
        const connectedCount = await batchConnectChannels(activeShopId, {
          channelType,
          saasAppProfileId: selectedSaasProfileId || undefined,
          apiVersion: showCustomSaasOverride
            ? apiVersion.trim() || undefined
            : undefined,
          appId: showCustomSaasOverride ? appId.trim() || undefined : undefined,
          appSecret: showCustomSaasOverride
            ? appSecret.trim() || undefined
            : undefined,
          webhookVerifySecret: showCustomSaasOverride
            ? webhookVerifySecret.trim() || undefined
            : undefined,
          metaDatasetId: metaDatasetId.trim() || undefined,
          capiAccessToken: capiAccessToken.trim() || undefined,
          pages: selectedPagesForBatch.map((p) => ({
            externalPageId: p.externalPageId,
            pageName: p.pageName,
            pageShortCode: p.pageShortCode,
            avatarUrl: p.avatarUrl || undefined,
            pageAccessToken: p.pageAccessToken!,
          })),
        });
        setConnectModalOpen(false);
        resetConnectModalState();
        showSuccessToast(
          t("batchConnectedSuccessToast", { count: connectedCount }),
        );
        return;
      }

      await connectChannelOAuth(activeShopId, {
        channelType,
        saasAppProfileId: selectedSaasProfileId || undefined,
        pageName: pageName.trim() || undefined,
        pageShortCode: pageShortCode.trim().toUpperCase() || undefined,
        externalPageId: externalPageId.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
        accessToken: accessToken.trim(),
        refreshToken: refreshToken.trim() || undefined,
        apiVersion: showCustomSaasOverride
          ? apiVersion.trim() || undefined
          : undefined,
        appId: showCustomSaasOverride ? appId.trim() || undefined : undefined,
        appSecret: showCustomSaasOverride
          ? appSecret.trim() || undefined
          : undefined,
        webhookVerifySecret: showCustomSaasOverride
          ? webhookVerifySecret.trim() || undefined
          : undefined,
        subscribedFields:
          subscribedFields.length > 0 ? subscribedFields : undefined,
        autoHidePhoneComments,
        syncEchoMessagesFromNativeApp,
        allowSandboxSimulation,
        metaDatasetId: metaDatasetId.trim() || undefined,
        capiAccessToken: capiAccessToken.trim() || undefined,
      });
      setConnectModalOpen(false);
      resetConnectModalState();
      showSuccessToast(
        t("connectedSuccessToast", { name: pageName.trim() || channelType }),
      );
    } catch (err: any) {
      showErrorToast(err?.response?.data?.message || "Failed");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSyncChannelWebhook = async (ch: ConnectedChannelItem) => {
    if (!activeShopId) return;
    setSyncingWebhookChannelId(ch.id);
    try {
      const res = await syncChannelWebhook(activeShopId, ch.id);
      if (res) {
        showSuccessToast(
          t("syncWebhookSuccessToast", {
            count: res.subscribedFields?.length || 0,
          }),
        );
      }
    } catch (err: any) {
      showErrorToast(err?.response?.data?.message || "Failed");
    } finally {
      setSyncingWebhookChannelId(null);
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

  const handleSimulateCommentWebhook = async (ch: ConnectedChannelItem) => {
    if (!activeShopId) return;
    setSimulatingCommentChannelId(ch.id);
    try {
      const postId = `post_${ch.pageShortCode.toLowerCase()}_${String(Date.now()).slice(-4)}`;
      const commentId = `cmt_${Date.now()}`;
      await simulateOmnichannelWebhookApi(ch.channelType, {
        externalPageId: ch.externalPageId,
        interactionType: "COMMENT",
        event: "COMMENT_INBOUND",
        postId,
        commentId,
        senderId: `commenter_${String(Date.now()).slice(-4)}`,
        senderName: `Khách bình luận ${ch.pageShortCode}`,
        messageText: `Shop ơi mẫu đầm trên bài viết #${postId} còn size M không ạ? SĐT mình 0988123456 nhé!`,
      });
      await fetchShopChannels(activeShopId);
      await fetchWebhookLogs(activeShopId);
      showSuccessToast(t("simulatedCommentWebhookToast"));
    } catch (err: any) {
      showErrorToast(err?.response?.data?.message || "Failed");
    } finally {
      setSimulatingCommentChannelId(null);
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

  const toggleBatchCandidatePage = (pageId: string) => {
    setSelectedBatchPageIds((prev) =>
      prev.includes(pageId)
        ? prev.filter((id) => id !== pageId)
        : [...prev, pageId],
    );
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
                variant="glass"
                color="primary"
                size="sm"
                rounded="full"
                onClick={() => {
                  setActiveTab("SAAS_APP_PROFILES");
                  handleOpenCreateSaasProfileModal();
                }}
                icon={<Layers className="w-3.5 h-3.5" />}
                iconPosition="left"
              >
                <TruncatedText>
                  {t("saasProfilesTab.addProfileBtn")}
                </TruncatedText>
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
            key: "SAAS_APP_PROFILES",
            label: <TruncatedText>{t("tabs.saasAppProfiles")}</TruncatedText>,
            badge: saasProfiles.length,
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

      {/* TAB 1: DANH SÁCH KÊNH BÁN HÀNG ĐÃ KẾT NỐI */}
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

              const boundProfile = saasProfiles.find(
                (p) =>
                  p.id === ch.saasAppProfileId ||
                  p.id === ch.platformConfigJson?.saasAppProfileId,
              );

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
                          <GlassBadge variant="info" size="sm">
                            <TruncatedText>
                              {ch.apiVersion ||
                                DEFAULT_API_VERSION_BY_PLATFORM[ch.channelType]}
                            </TruncatedText>
                          </GlassBadge>
                          {(boundProfile ||
                            ch.platformConfigJson?.saasAppProfileName) && (
                            <GlassBadge variant="secondary" size="sm">
                              <Layers className="w-3 h-3 mr-1 inline" />
                              {boundProfile?.name ||
                                ch.platformConfigJson?.saasAppProfileName}
                            </GlassBadge>
                          )}
                          {ch.hasAppSecretConfigured && (
                            <GlassBadge variant="success" size="sm">
                              <ShieldCheck className="w-3 h-3 mr-1 inline" />
                              HMAC Proof
                            </GlassBadge>
                          )}
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
                          {ch.appId ? ` • App ID: ${ch.appId}` : ""}
                          {ch.metaDatasetId
                            ? ` • Pixel/Dataset: ${ch.metaDatasetId}`
                            : ""}
                        </TruncatedText>
                        {ch.webhookCallbackUrl && (
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                            <Link2 className="w-3 h-3 shrink-0 text-primary" />
                            <span className="font-mono truncate max-w-md">
                              {ch.webhookCallbackUrl}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopyText(
                                  ch.webhookCallbackUrl!,
                                  t("copiedWebhookUrlToast"),
                                )
                              }
                              className="text-primary hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Copy className="w-3 h-3" />
                              {t("copyWebhookUrlBtn")}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      <PermissionGate
                        can="CHANNEL_INTEGRATION_CONNECT"
                        mode="hide"
                      >
                        <PatternButton
                          type="button"
                          variant="glass"
                          color="success"
                          size="sm"
                          rounded="full"
                          isLoading={syncingWebhookChannelId === ch.id}
                          onClick={() => handleSyncChannelWebhook(ch)}
                          icon={<RefreshCw className="w-3.5 h-3.5" />}
                          iconPosition="left"
                        >
                          <TruncatedText>{t("syncWebhookBtn")}</TruncatedText>
                        </PatternButton>
                      </PermissionGate>

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

                      <PatternButton
                        type="button"
                        variant="glass"
                        color="info"
                        size="sm"
                        rounded="full"
                        isLoading={simulatingCommentChannelId === ch.id}
                        onClick={() => handleSimulateCommentWebhook(ch)}
                        icon={<Activity className="w-3.5 h-3.5" />}
                        iconPosition="left"
                      >
                        <TruncatedText>
                          {t("simulateCommentWebhookBtn")}
                        </TruncatedText>
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

      {/* TAB 2: QUẢN LÝ ĐA CẤU HÌNH ỨNG DỤNG SAAS & TỰ ĐỘNG TIÊM WEBHOOK (SAAS_APP_PROFILES) */}
      {activeTab === "SAAS_APP_PROFILES" && (
        <div className="space-y-4">
          <GlassAlert
            variant="info"
            title={t("saasProfilesTab.bannerTitle")}
            description={t("saasProfilesTab.bannerDesc")}
          />

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <h3 className="text-sm font-bold text-foreground">
                {t("saasProfilesTab.sectionHeading", {
                  count: saasProfiles.length,
                })}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t("saasProfilesTab.sectionSubheading")}
              </p>
            </div>

            <PermissionGate can="CHANNEL_INTEGRATION_CONNECT" mode="disable">
              <PatternButton
                type="button"
                variant="solid"
                color="primary"
                size="sm"
                rounded="full"
                onClick={() => handleOpenCreateSaasProfileModal()}
                icon={<Plus className="w-4 h-4" />}
                iconPosition="left"
              >
                <TruncatedText>
                  {t("saasProfilesTab.addProfileBtn")}
                </TruncatedText>
              </PatternButton>
            </PermissionGate>
          </div>

          {saasProfiles.length === 0 ? (
            <GlassEmptyState
              icon={<Layers className="w-6 h-6" />}
              title={
                <TruncatedText>{t("saasProfilesTab.emptyTitle")}</TruncatedText>
              }
              description={t("saasProfilesTab.emptyDesc")}
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
                    onClick={() => handleOpenCreateSaasProfileModal()}
                    icon={<Plus className="w-4 h-4" />}
                    iconPosition="left"
                  >
                    <TruncatedText>
                      {t("saasProfilesTab.addProfileBtn")}
                    </TruncatedText>
                  </PatternButton>
                </PermissionGate>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {saasProfiles.map((prof) => (
                <GlassSurfaceCard key={prof.id} className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <TruncatedText
                          as="h4"
                          className="font-bold text-sm max-w-80"
                        >
                          {prof.name}
                        </TruncatedText>
                        <GlassBadge variant="primary" size="sm">
                          {t(`platforms.${prof.channelType}`)}
                        </GlassBadge>
                        <GlassBadge variant="info" size="sm">
                          {prof.apiVersion}
                        </GlassBadge>
                        {prof.isDefault && (
                          <GlassBadge variant="warning" size="sm">
                            <Star className="w-3 h-3 mr-1 inline fill-current" />
                            {t("saasProfilesTab.defaultBadge")}
                          </GlassBadge>
                        )}
                        {prof.hasAppSecretConfigured && (
                          <GlassBadge variant="success" size="sm">
                            <ShieldCheck className="w-3 h-3 mr-1 inline" />
                            HMAC Secret
                          </GlassBadge>
                        )}
                        {prof.autoInjectWebhookOnConnect && (
                          <GlassBadge variant="success" size="sm" dot>
                            {t("saasProfilesTab.autoInjectBadge")}
                          </GlassBadge>
                        )}
                        <GlassBadge variant="secondary" size="sm">
                          {t("saasProfilesTab.boundChannelsCount", {
                            count: prof.connectedChannelsCount,
                          })}
                        </GlassBadge>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        App ID:{" "}
                        <span className="font-mono font-semibold text-foreground">
                          {prof.appId}
                        </span>{" "}
                        •{" "}
                        {t("subscribedFieldsBadge", {
                          count: prof.subscribedFields?.length || 0,
                        })}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px] text-muted-foreground">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Link2 className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="font-mono truncate">
                            {prof.webhookCallbackUrl}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopyText(
                                prof.webhookCallbackUrl,
                                t("copiedWebhookUrlToast"),
                              )
                            }
                            className="text-primary hover:underline font-semibold inline-flex items-center gap-1 shrink-0 cursor-pointer"
                          >
                            <Copy className="w-3 h-3" />
                            {t("copyWebhookUrlBtn")}
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5 min-w-0">
                          <KeyRound className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="font-mono truncate">
                            Verify Token: {prof.webhookVerifyToken}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopyText(
                                prof.webhookVerifyToken,
                                t("copiedVerifyTokenToast"),
                              )
                            }
                            className="text-primary hover:underline font-semibold inline-flex items-center gap-1 shrink-0 cursor-pointer"
                          >
                            <Copy className="w-3 h-3" />
                            {t("copyWebhookUrlBtn")}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      <PermissionGate
                        can="CHANNEL_INTEGRATION_CONNECT"
                        mode="hide"
                      >
                        <PatternButton
                          type="button"
                          variant="glass"
                          color="primary"
                          size="sm"
                          rounded="full"
                          onClick={() => {
                            setChannelType(prof.channelType);
                            setSelectedSaasProfileId(prof.id);
                            setConnectModalOpen(true);
                          }}
                          icon={<Plus className="w-3.5 h-3.5" />}
                          iconPosition="left"
                        >
                          <TruncatedText>
                            {t("saasProfilesTab.quickConnectWithProfileBtn")}
                          </TruncatedText>
                        </PatternButton>

                        <PatternButton
                          type="button"
                          variant="glass"
                          color="success"
                          size="sm"
                          rounded="full"
                          isLoading={injectingProfileId === prof.id}
                          onClick={() =>
                            handleInjectAllWebhooksForProfile(prof)
                          }
                          icon={<Zap className="w-3.5 h-3.5" />}
                          iconPosition="left"
                        >
                          <TruncatedText>
                            {t("saasProfilesTab.injectAllWebhooksBtn")}
                          </TruncatedText>
                        </PatternButton>

                        {!prof.isDefault && (
                          <PatternButton
                            type="button"
                            variant="ghost"
                            color="warning"
                            size="sm"
                            rounded="full"
                            onClick={() => handleSetDefaultSaasProfile(prof)}
                            icon={<Star className="w-3.5 h-3.5" />}
                            iconPosition="left"
                          >
                            <TruncatedText>
                              {t("saasProfilesTab.setDefaultBtn")}
                            </TruncatedText>
                          </PatternButton>
                        )}

                        <PatternButton
                          type="button"
                          variant="ghost"
                          color="neutral"
                          size="sm"
                          rounded="full"
                          onClick={() => handleOpenEditSaasProfileModal(prof)}
                          icon={<Pencil className="w-3.5 h-3.5" />}
                          iconPosition="left"
                        >
                          <TruncatedText>{t("editChannelBtn")}</TruncatedText>
                        </PatternButton>

                        {saasProfiles.filter(
                          (p) => p.channelType === prof.channelType,
                        ).length > 1 && (
                          <PatternButton
                            type="button"
                            variant="ghost"
                            color="danger"
                            size="sm"
                            rounded="full"
                            isLoading={deletingProfileId === prof.id}
                            onClick={() => handleDeleteSaasProfile(prof.id)}
                            icon={<Trash2 className="w-3.5 h-3.5" />}
                            iconPosition="left"
                          >
                            <TruncatedText>
                              {t("saasProfilesTab.deleteProfileBtn")}
                            </TruncatedText>
                          </PatternButton>
                        )}
                      </PermissionGate>
                    </div>
                  </div>
                </GlassSurfaceCard>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: QUY TẮC CHIA KHÁCH & SLA */}
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

      {/* TAB 4: ĐƠN HÀNG SÀN TMĐT & GIỮ TỒN KHO */}
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

      {/* TAB 5: NHẬT KÝ SỰ KIỆN WEBHOOK & REPLAY */}
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

      {/* MODAL TẠO / CẬP NHẬT HỒ SƠ CẤU HÌNH ỨNG DỤNG SAAS (SAAS_APP_PROFILES) */}
      <GlassModal
        open={saasProfileModalOpen}
        onOpenChange={setSaasProfileModalOpen}
        title={
          <TruncatedText as="span">
            {editingSaasProfile
              ? t("saasProfilesTab.editModalTitle")
              : t("saasProfilesTab.createModalTitle")}
          </TruncatedText>
        }
        description={t("saasProfilesTab.modalDesc")}
        size="lg"
        footer={
          <PatternButton
            type="submit"
            form="saas-app-profile-form"
            variant="solid"
            color="primary"
            size="md"
            rounded="full"
            fullWidth
            isLoading={isSavingSaasProfile}
            icon={<CheckCircle2 className="w-4 h-4" />}
            iconPosition="left"
          >
            <TruncatedText>{t("saasProfilesTab.saveProfileBtn")}</TruncatedText>
          </PatternButton>
        }
      >
        <form
          id="saas-app-profile-form"
          onSubmit={handleSaveSaasProfileSubmit}
          className="p-2"
        >
          <FieldGroup>
            <FieldSet>
              <FieldGroup>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel>
                      <TruncatedText>
                        {t("saasProfilesTab.profileNameLabel")}
                      </TruncatedText>
                    </FieldLabel>
                    <LiquidGlassInput className="w-full h-10 overflow-hidden p-0">
                      <div className="flex items-center px-3.5 w-full h-full">
                        <Layers className="h-4 w-4 text-primary mr-2 shrink-0" />
                        <Input
                          required
                          value={profName}
                          onChange={(e) => setProfName(e.target.value)}
                          placeholder={t(
                            "saasProfilesTab.profileNamePlaceholder",
                          )}
                          className="flex h-full w-full py-2 text-sm bg-transparent! border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                        />
                      </div>
                    </LiquidGlassInput>
                  </Field>

                  <Field>
                    <FieldLabel>
                      <TruncatedText>{t("channelTypeLabel")}</TruncatedText>
                    </FieldLabel>
                    <Select
                      value={profChannelType}
                      disabled={Boolean(editingSaasProfile)}
                      onValueChange={(val) => {
                        const nextPlat = val as ChannelPlatformType;
                        setProfChannelType(nextPlat);
                        setProfApiVersion(
                          DEFAULT_API_VERSION_BY_PLATFORM[nextPlat],
                        );
                      }}
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
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel>
                      <TruncatedText>{t("apiVersionLabel")}</TruncatedText>
                    </FieldLabel>
                    <LiquidGlassInput className="w-full h-10 overflow-hidden p-0">
                      <div className="flex items-center px-3.5 w-full h-full">
                        <Code2 className="h-4 w-4 text-primary mr-2 shrink-0" />
                        <Input
                          required
                          value={profApiVersion}
                          onChange={(e) => setProfApiVersion(e.target.value)}
                          placeholder={t("apiVersionPlaceholder")}
                          className="flex h-full w-full py-2 text-sm font-mono bg-transparent! border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                        />
                      </div>
                    </LiquidGlassInput>
                  </Field>

                  <Field>
                    <FieldLabel>
                      <TruncatedText>{t("appIdLabel")}</TruncatedText>
                    </FieldLabel>
                    <LiquidGlassInput className="w-full h-10 overflow-hidden p-0">
                      <div className="flex items-center px-3.5 w-full h-full">
                        <Input
                          required
                          value={profAppId}
                          onChange={(e) => setProfAppId(e.target.value)}
                          placeholder={t("appIdPlaceholder")}
                          className="flex h-full w-full py-2 text-sm font-mono bg-transparent! border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                        />
                      </div>
                    </LiquidGlassInput>
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel>
                      <TruncatedText>{t("appSecretLabel")}</TruncatedText>
                    </FieldLabel>
                    <LiquidGlassInput className="w-full h-10 overflow-hidden p-0">
                      <div className="flex items-center px-3.5 w-full h-full">
                        <Input
                          type="password"
                          value={profAppSecret}
                          onChange={(e) => setProfAppSecret(e.target.value)}
                          placeholder={
                            editingSaasProfile
                              ? t("newAccessTokenOptionalPlaceholder")
                              : t("appSecretPlaceholder")
                          }
                          className="flex h-full w-full py-2 text-sm bg-transparent! border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                        />
                      </div>
                    </LiquidGlassInput>
                  </Field>

                  <Field>
                    <FieldLabel>
                      <TruncatedText>
                        {t("webhookVerifySecretLabel")}
                      </TruncatedText>
                    </FieldLabel>
                    <LiquidGlassInput className="w-full h-10 overflow-hidden p-0">
                      <div className="flex items-center px-3.5 w-full h-full">
                        <Input
                          value={profVerifyToken}
                          onChange={(e) => setProfVerifyToken(e.target.value)}
                          placeholder={t("webhookVerifySecretPlaceholder")}
                          className="flex h-full w-full py-2 text-sm font-mono bg-transparent! border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                        />
                      </div>
                    </LiquidGlassInput>
                  </Field>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-border/40">
                    <TruncatedText className="text-xs font-medium">
                      {t("saasProfilesTab.autoInjectOnConnectLabel")}
                    </TruncatedText>
                    <Switch
                      checked={profAutoInjectWebhook}
                      onCheckedChange={setProfAutoInjectWebhook}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-border/40">
                    <TruncatedText className="text-xs font-medium">
                      {t("saasProfilesTab.setAsDefaultLabel")}
                    </TruncatedText>
                    <Switch
                      checked={profIsDefault}
                      onCheckedChange={setProfIsDefault}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-border/40">
                    <TruncatedText className="text-xs font-medium">
                      {t("autoHidePhoneCommentsLabel")}
                    </TruncatedText>
                    <Switch
                      checked={profAutoHidePhone}
                      onCheckedChange={setProfAutoHidePhone}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-border/40">
                    <TruncatedText className="text-xs font-medium">
                      {t("syncEchoMessagesLabel")}
                    </TruncatedText>
                    <Switch
                      checked={profSyncEcho}
                      onCheckedChange={setProfSyncEcho}
                    />
                  </div>
                </div>
              </FieldGroup>
            </FieldSet>
          </FieldGroup>
        </form>
      </GlassModal>

      {/* MODAL KẾT NỐI KÊNH BÁN HÀNG MỚI — CHỈ CẦN CHỌN HỒ SƠ SAAS & DÁN ACCESS TOKEN */}
      <GlassModal
        open={connectModalOpen}
        onOpenChange={setConnectModalOpen}
        title={
          <TruncatedText as="span">{t("connectModalTitle")}</TruncatedText>
        }
        description={t("connectModalDesc")}
        size="lg"
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
            <TruncatedText>
              {selectedBatchPageIds.length > 1 && !externalPageId.trim()
                ? t("batchConnectSubmitBtn", {
                    count: selectedBatchPageIds.length,
                  })
                : t("submitConnectBtn")}
            </TruncatedText>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel>
                      <TruncatedText>{t("channelTypeLabel")}</TruncatedText>
                    </FieldLabel>
                    <Select
                      value={channelType}
                      onValueChange={(val) => {
                        const nextPlat = val as ChannelPlatformType;
                        setChannelType(nextPlat);
                        const defaultProf = saasProfiles.find(
                          (p) => p.channelType === nextPlat && p.isDefault,
                        );
                        if (accessToken.trim().length >= 8) {
                          void handleAutoResolveTokenMetadata(
                            accessToken,
                            nextPlat,
                            defaultProf?.id,
                          );
                        }
                      }}
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
                      <TruncatedText>
                        {t("saasProfilesTab.selectProfileLabel")}
                      </TruncatedText>
                    </FieldLabel>
                    <Select
                      value={selectedSaasProfileId || "SYSTEM_DEFAULT"}
                      onValueChange={(val) => {
                        const nextId = val === "SYSTEM_DEFAULT" ? "" : val;
                        setSelectedSaasProfileId(nextId);
                        if (accessToken.trim().length >= 8) {
                          void handleAutoResolveTokenMetadata(
                            accessToken,
                            channelType,
                            nextId,
                          );
                        }
                      }}
                    >
                      <LiquidGlassInput className="w-full h-10 overflow-hidden p-0">
                        <SelectTrigger className="w-full h-full rounded-full cursor-pointer border-0 shadow-none bg-transparent px-3.5">
                          <div className="flex items-center gap-2">
                            <Layers className="h-4 w-4 text-primary shrink-0" />
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                      </LiquidGlassInput>
                      <ContentSelect>
                        {matchingPlatformProfiles.map((prof) => (
                          <ItemSelect key={prof.id} value={prof.id}>
                            <TruncatedText>
                              {prof.name} ({prof.apiVersion} • App ID:{" "}
                              {prof.appId})
                            </TruncatedText>
                          </ItemSelect>
                        ))}
                        {matchingPlatformProfiles.length === 0 && (
                          <ItemSelect value="SYSTEM_DEFAULT">
                            <TruncatedText>
                              {t("saasProfilesTab.systemDefaultProfileOption")}
                            </TruncatedText>
                          </ItemSelect>
                        )}
                      </ContentSelect>
                    </Select>
                  </Field>
                </div>

                {/* Thẻ tóm tắt Cấu hình SaaS đang áp dụng (Chỉ cần dán Access Token là tự tiêm Webhook) */}
                <GlassSurfaceCard className="p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="text-xs font-bold text-foreground">
                        {activeSelectedSaasProfile
                          ? activeSelectedSaasProfile.name
                          : t("saasArchitectureTitle")}
                      </span>
                      <GlassBadge variant="info" size="sm">
                        {activeSelectedSaasProfile?.apiVersion || apiVersion}
                      </GlassBadge>
                      <GlassBadge variant="success" size="sm" dot>
                        {t("saasProfilesTab.autoInjectBadge")}
                      </GlassBadge>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowCustomSaasOverride((v) => !v)}
                      className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                    >
                      {showCustomSaasOverride
                        ? t("saasProfilesTab.hideOverrideBtn")
                        : t("saasProfilesTab.showOverrideBtn")}
                    </button>
                  </div>

                  <p className="text-[11px] text-muted-foreground">
                    {t("saasProfilesTab.zeroTouchConnectHint")}
                  </p>

                  {showCustomSaasOverride && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-border/40">
                      <Field>
                        <FieldLabel>
                          <TruncatedText>{t("apiVersionLabel")}</TruncatedText>
                        </FieldLabel>
                        <LiquidGlassInput className="w-full h-9 overflow-hidden p-0">
                          <div className="flex items-center px-3 w-full h-full">
                            <Input
                              value={apiVersion}
                              onChange={(e) => setApiVersion(e.target.value)}
                              placeholder="v27.1"
                              className="flex h-full w-full py-1.5 text-xs font-mono bg-transparent! border-none shadow-none focus-visible:ring-0 px-0"
                            />
                          </div>
                        </LiquidGlassInput>
                      </Field>

                      <Field>
                        <FieldLabel>
                          <TruncatedText>{t("appIdLabel")}</TruncatedText>
                        </FieldLabel>
                        <LiquidGlassInput className="w-full h-9 overflow-hidden p-0">
                          <div className="flex items-center px-3 w-full h-full">
                            <Input
                              value={appId}
                              onChange={(e) => setAppId(e.target.value)}
                              placeholder={t("appIdPlaceholder")}
                              className="flex h-full w-full py-1.5 text-xs font-mono bg-transparent! border-none shadow-none focus-visible:ring-0 px-0"
                            />
                          </div>
                        </LiquidGlassInput>
                      </Field>

                      <Field>
                        <FieldLabel>
                          <TruncatedText>{t("appSecretLabel")}</TruncatedText>
                        </FieldLabel>
                        <LiquidGlassInput className="w-full h-9 overflow-hidden p-0">
                          <div className="flex items-center px-3 w-full h-full">
                            <Input
                              type="password"
                              value={appSecret}
                              onChange={(e) => setAppSecret(e.target.value)}
                              placeholder={t("appSecretPlaceholder")}
                              className="flex h-full w-full py-1.5 text-xs bg-transparent! border-none shadow-none focus-visible:ring-0 px-0"
                            />
                          </div>
                        </LiquidGlassInput>
                      </Field>
                    </div>
                  )}
                </GlassSurfaceCard>

                {/* Nhập Access Token để tự động gọi Graph API / Zalo OA lấy đúng Tên, Avatar Trang & Tự động Tiêm Webhook */}
                <Field>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <FieldLabel>
                      <TruncatedText>{t("accessTokenLabel")}</TruncatedText>
                    </FieldLabel>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {resolvedTokenMeta?.tokenKind && (
                        <GlassBadge
                          variant={
                            resolvedTokenMeta.resolvedFromLiveApi
                              ? "success"
                              : "warning"
                          }
                          size="sm"
                        >
                          {t(`tokenKindBadges.${resolvedTokenMeta.tokenKind}`)}
                        </GlassBadge>
                      )}
                      <PatternButton
                        type="button"
                        variant="glass"
                        color="primary"
                        size="sm"
                        rounded="full"
                        isLoading={isResolvingTokenMeta}
                        disabled={accessToken.trim().length < 6}
                        onClick={() => handleAutoResolveTokenMetadata()}
                        icon={<Sparkles className="w-3.5 h-3.5" />}
                        iconPosition="left"
                      >
                        <TruncatedText>{t("autoFetchTokenBtn")}</TruncatedText>
                      </PatternButton>
                    </div>
                  </div>
                  <LiquidGlassInput className="w-full h-10 overflow-hidden p-0">
                    <div className="flex items-center px-3.5 w-full h-full">
                      <KeyRound className="h-4 w-4 text-muted-foreground/50 mr-2.5 shrink-0" />
                      <Input
                        required
                        type="password"
                        value={accessToken}
                        onChange={(e) => setAccessToken(e.target.value)}
                        onPaste={(e) => {
                          const pasted = e.clipboardData.getData("text");
                          if (pasted && pasted.trim().length >= 8) {
                            setTimeout(() => {
                              void handleAutoResolveTokenMetadata(pasted);
                            }, 50);
                          }
                        }}
                        placeholder={t("accessTokenPlaceholder")}
                        className="flex h-full w-full py-2 text-sm bg-transparent! border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                      />
                    </div>
                  </LiquidGlassInput>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {resolvedTokenMeta?.diagnosticMessage ||
                      t("autoFetchTokenHint")}
                  </p>
                </Field>

                {/* Danh sách Fanpage / OA tự động nhận diện từ Access Token */}
                {candidatePages.length > 0 && (
                  <GlassSurfaceCard className="p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs font-bold text-foreground">
                        {t("candidatePagesHeading", {
                          count: candidatePages.length,
                        })}
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {candidatePages.length > 1 && (
                          <GlassBadge variant="primary" size="sm">
                            {t("batchSelectPageToggle", {
                              count: selectedBatchPageIds.length,
                            })}
                          </GlassBadge>
                        )}
                        {subscribedFields.length > 0 && (
                          <GlassBadge variant="success" size="sm" dot>
                            {t("subscribedFieldsBadge", {
                              count: subscribedFields.length,
                            })}
                          </GlassBadge>
                        )}
                      </div>
                    </div>

                    {resolvedTokenMeta?.requiresPageSelection && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                        {t("requiresPageSelectionNotice")}
                      </p>
                    )}

                    <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                      {candidatePages.map((cand) => {
                        const isSelectedSingle =
                          externalPageId === cand.externalPageId;
                        const isSelectedBatch = selectedBatchPageIds.includes(
                          cand.externalPageId,
                        );
                        return (
                          <div
                            key={cand.externalPageId}
                            className={cn(
                              "w-full flex items-center justify-between gap-2.5 p-2 rounded-xl border text-left transition-all",
                              isSelectedSingle || isSelectedBatch
                                ? "border-primary bg-primary/10"
                                : "border-border/50 hover:bg-muted/40",
                            )}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setExternalPageId(cand.externalPageId);
                                setPageName(cand.pageName);
                                setPageShortCode(cand.pageShortCode);
                                setAvatarUrl(cand.avatarUrl || "");
                                if (cand.pageAccessToken) {
                                  setAccessToken(cand.pageAccessToken);
                                }
                              }}
                              className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer"
                            >
                              <GlassAvatar
                                src={cand.avatarUrl}
                                name={cand.pageShortCode}
                                size="sm"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-bold truncate">
                                  {cand.pageName}
                                </p>
                                <p className="text-[11px] text-muted-foreground truncate">
                                  ID: {cand.externalPageId} •{" "}
                                  {cand.pageShortCode}
                                  {cand.category ? ` • ${cand.category}` : ""}
                                </p>
                              </div>
                            </button>

                            <div className="flex items-center gap-2 shrink-0">
                              {candidatePages.length > 1 && (
                                <Switch
                                  checked={isSelectedBatch}
                                  onCheckedChange={() =>
                                    toggleBatchCandidatePage(
                                      cand.externalPageId,
                                    )
                                  }
                                />
                              )}
                              {isSelectedSingle && (
                                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </GlassSurfaceCard>
                )}

                <Field>
                  <FieldLabel>
                    <TruncatedText>{t("pageNameLabel")}</TruncatedText>
                  </FieldLabel>
                  <LiquidGlassInput className="w-full h-10 overflow-hidden p-0">
                    <div className="flex items-center px-3.5 w-full h-full gap-2.5">
                      {(avatarUrl || pageShortCode) && (
                        <GlassAvatar
                          src={avatarUrl || null}
                          name={pageShortCode || pageName || "P"}
                          size="xs"
                        />
                      )}
                      <Input
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
                    <TruncatedText>{t("avatarUrlLabel")}</TruncatedText>
                  </FieldLabel>
                  <LiquidGlassInput className="w-full h-10 overflow-hidden p-0">
                    <div className="flex items-center px-3.5 w-full h-full">
                      <Input
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        placeholder={t("avatarUrlPlaceholder")}
                        className="flex h-full w-full py-2 text-sm bg-transparent! border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                      />
                    </div>
                  </LiquidGlassInput>
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-border/40">
                    <TruncatedText className="text-xs font-medium">
                      {t("autoHidePhoneCommentsLabel")}
                    </TruncatedText>
                    <Switch
                      checked={autoHidePhoneComments}
                      onCheckedChange={setAutoHidePhoneComments}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-border/40">
                    <TruncatedText className="text-xs font-medium">
                      {t("syncEchoMessagesLabel")}
                    </TruncatedText>
                    <Switch
                      checked={syncEchoMessagesFromNativeApp}
                      onCheckedChange={setSyncEchoMessagesFromNativeApp}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-border/40">
                    <TruncatedText className="text-xs font-medium">
                      {t("allowSandboxSimulationLabel")}
                    </TruncatedText>
                    <Switch
                      checked={allowSandboxSimulation}
                      onCheckedChange={setAllowSandboxSimulation}
                    />
                  </div>
                </div>
              </FieldGroup>
            </FieldSet>
          </FieldGroup>
        </form>
      </GlassModal>

      {/* Modal Chỉnh sửa Kênh tích hợp */}
      <GlassModal
        open={Boolean(editingChannel)}
        onOpenChange={(open) => {
          if (!open) setEditingChannel(null);
        }}
        title={
          <TruncatedText as="span">{t("editChannelModalTitle")}</TruncatedText>
        }
        description={editingChannel?.pageName}
        size="lg"
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
          className="p-2"
        >
          <FieldGroup>
            <FieldSet>
              <FieldGroup>
                {editingChannel && (
                  <Field>
                    <FieldLabel>
                      <TruncatedText>
                        {t("saasProfilesTab.selectProfileLabel")}
                      </TruncatedText>
                    </FieldLabel>
                    <Select
                      value={editSaasProfileId || "SYSTEM_DEFAULT"}
                      onValueChange={(val) =>
                        setEditSaasProfileId(
                          val === "SYSTEM_DEFAULT" ? "" : val,
                        )
                      }
                    >
                      <LiquidGlassInput className="w-full h-10 overflow-hidden p-0">
                        <SelectTrigger className="w-full h-full rounded-full cursor-pointer border-0 shadow-none bg-transparent px-3.5">
                          <div className="flex items-center gap-2">
                            <Layers className="h-4 w-4 text-primary shrink-0" />
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                      </LiquidGlassInput>
                      <ContentSelect>
                        {saasProfiles
                          .filter(
                            (p) => p.channelType === editingChannel.channelType,
                          )
                          .map((prof) => (
                            <ItemSelect key={prof.id} value={prof.id}>
                              <TruncatedText>
                                {prof.name} ({prof.apiVersion} • App ID:{" "}
                                {prof.appId})
                              </TruncatedText>
                            </ItemSelect>
                          ))}
                        <ItemSelect value="SYSTEM_DEFAULT">
                          <TruncatedText>
                            {t("saasProfilesTab.systemDefaultProfileOption")}
                          </TruncatedText>
                        </ItemSelect>
                      </ContentSelect>
                    </Select>
                  </Field>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel>
                      <TruncatedText>{t("pageNameLabel")}</TruncatedText>
                    </FieldLabel>
                    <LiquidGlassInput className="w-full h-10 overflow-hidden p-0">
                      <div className="flex items-center px-3.5 w-full h-full gap-2.5">
                        <GlassAvatar
                          src={editAvatarUrl || editingChannel?.avatarUrl}
                          name={editPageShortCode || "P"}
                          size="xs"
                        />
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
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Field>
                    <FieldLabel>
                      <TruncatedText>{t("apiVersionLabel")}</TruncatedText>
                    </FieldLabel>
                    <LiquidGlassInput className="w-full h-10 overflow-hidden p-0">
                      <div className="flex items-center px-3.5 w-full h-full">
                        <Input
                          value={editApiVersion}
                          onChange={(e) => setEditApiVersion(e.target.value)}
                          placeholder="v27.1"
                          className="flex h-full w-full py-2 text-sm font-mono bg-transparent! border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                        />
                      </div>
                    </LiquidGlassInput>
                  </Field>

                  <Field>
                    <FieldLabel>
                      <TruncatedText>{t("appIdLabel")}</TruncatedText>
                    </FieldLabel>
                    <LiquidGlassInput className="w-full h-10 overflow-hidden p-0">
                      <div className="flex items-center px-3.5 w-full h-full">
                        <Input
                          value={editAppId}
                          onChange={(e) => setEditAppId(e.target.value)}
                          placeholder={t("appIdPlaceholder")}
                          className="flex h-full w-full py-2 text-sm font-mono bg-transparent! border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                        />
                      </div>
                    </LiquidGlassInput>
                  </Field>

                  <Field>
                    <FieldLabel>
                      <TruncatedText>{t("appSecretLabel")}</TruncatedText>
                    </FieldLabel>
                    <LiquidGlassInput className="w-full h-10 overflow-hidden p-0">
                      <div className="flex items-center px-3.5 w-full h-full">
                        <Input
                          type="password"
                          value={editAppSecret}
                          onChange={(e) => setEditAppSecret(e.target.value)}
                          placeholder={t("newAccessTokenOptionalPlaceholder")}
                          className="flex h-full w-full py-2 text-sm bg-transparent! border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                        />
                      </div>
                    </LiquidGlassInput>
                  </Field>
                </div>

                <Field>
                  <FieldLabel>
                    <TruncatedText>{t("avatarUrlLabel")}</TruncatedText>
                  </FieldLabel>
                  <LiquidGlassInput className="w-full h-10 overflow-hidden p-0">
                    <div className="flex items-center px-3.5 w-full h-full">
                      <Input
                        value={editAvatarUrl}
                        onChange={(e) => setEditAvatarUrl(e.target.value)}
                        placeholder={t("avatarUrlPlaceholder")}
                        className="flex h-full w-full py-2 text-sm bg-transparent! border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                      />
                    </div>
                  </LiquidGlassInput>
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/40">
                    <TruncatedText className="text-xs sm:text-sm font-medium">
                      {t("autoHidePhoneCommentsLabel")}
                    </TruncatedText>
                    <Switch
                      checked={editAutoHidePhoneComments}
                      onCheckedChange={setEditAutoHidePhoneComments}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/40">
                    <TruncatedText className="text-xs sm:text-sm font-medium">
                      {t("syncEchoMessagesLabel")}
                    </TruncatedText>
                    <Switch
                      checked={editSyncEchoMessages}
                      onCheckedChange={setEditSyncEchoMessages}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/40">
                    <TruncatedText className="text-xs sm:text-sm font-medium">
                      {t("channelActiveToggleLabel")}
                    </TruncatedText>
                    <Switch
                      checked={editIsActive}
                      onCheckedChange={setEditIsActive}
                    />
                  </div>
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
