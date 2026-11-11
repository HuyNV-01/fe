import { createPersistedStore } from "@/lib/stores/create-persisted-store";
import {
  batchConnectChannelsApi,
  type ChannelPlatformSaasConfig,
  type ChannelPlatformType,
  type ChannelWebhookLogItem,
  type ConnectedChannelItem,
  connectChannelOAuthApi,
  getMarketplaceReservationsApi,
  getMergedInboxConversationsApi,
  getSaasWebhookConfigApi,
  getWebhookLogsApi,
  listShopChannelsApi,
  type MarketplaceStockReservationItem,
  type MergedOmnichannelConversationItem,
  removeChannelIntegrationApi,
  replayFailedWebhookApi,
  type ResolvedChannelTokenCandidatePage,
  type ResolvedChannelTokenMetadata,
  resolveChannelTokenMetadataApi,
  runTokenDoctorHealthCheckApi,
  type SaasWebhookBlueprintItem,
  syncChannelWebhookApi,
  updateChannelIntegrationApi,
} from "./api";

export type {
  ChannelPlatformSaasConfig,
  ChannelPlatformType,
  ChannelWebhookLogItem,
  ConnectedChannelItem,
  MarketplaceStockReservationItem,
  MergedOmnichannelConversationItem,
  ResolvedChannelTokenCandidatePage,
  ResolvedChannelTokenMetadata,
  SaasWebhookBlueprintItem,
};

export interface ChannelWorkspaceStoreState {
  channels: ConnectedChannelItem[];
  saasBlueprints: SaasWebhookBlueprintItem[];
  selectedChannelIds: string[];
  isMergeMode: boolean;
  activePresetId: string | null;
  webhookLogs: ChannelWebhookLogItem[];
  mergedConversations: MergedOmnichannelConversationItem[];
  mergedTotal: number;
  marketplaceReservations: MarketplaceStockReservationItem[];
  isLoadingChannels: boolean;
  isLoadingWebhookLogs: boolean;
  isLoadingMergedInbox: boolean;
  isLoadingMarketplaceReservations: boolean;

  fetchShopChannels: (shopId: string) => Promise<void>;
  fetchSaasWebhookConfig: (shopId: string) => Promise<void>;
  resolveChannelTokenMetadata: (
    shopId: string,
    payload: {
      channelType: ChannelPlatformType;
      accessToken: string;
      externalPageId?: string;
      apiVersion?: string;
      appId?: string;
      appSecret?: string;
      allowSandboxSimulation?: boolean;
    },
  ) => Promise<ResolvedChannelTokenMetadata | null>;
  connectChannelOAuth: (
    shopId: string,
    payload: {
      channelType: ChannelPlatformType;
      externalPageId?: string;
      externalShopId?: string;
      pageName?: string;
      pageShortCode?: string;
      avatarUrl?: string;
      oauthCode?: string;
      accessToken?: string;
      refreshToken?: string;
      apiVersion?: string;
      appId?: string;
      appSecret?: string;
      webhookVerifySecret?: string;
      subscribedFields?: string[];
      autoHidePhoneComments?: boolean;
      syncEchoMessagesFromNativeApp?: boolean;
      allowSandboxSimulation?: boolean;
      metaDatasetId?: string;
      capiAccessToken?: string;
    },
  ) => Promise<boolean>;
  batchConnectChannels: (
    shopId: string,
    payload: {
      channelType: ChannelPlatformType;
      apiVersion?: string;
      appId?: string;
      appSecret?: string;
      webhookVerifySecret?: string;
      metaDatasetId?: string;
      capiAccessToken?: string;
      pages: Array<{
        externalPageId: string;
        pageName: string;
        pageShortCode?: string;
        avatarUrl?: string;
        pageAccessToken: string;
      }>;
    },
  ) => Promise<number>;
  syncChannelWebhook: (
    shopId: string,
    channelId: string,
  ) => Promise<{
    webhookStatus: string;
    subscribedFields: string[];
    webhookCallbackUrl: string;
    webhookVerifyToken: string;
  } | null>;
  updateChannelIntegration: (
    shopId: string,
    channelId: string,
    payload: {
      pageName?: string;
      pageShortCode?: string;
      avatarUrl?: string;
      accessToken?: string;
      refreshToken?: string;
      apiVersion?: string;
      appId?: string;
      appSecret?: string;
      webhookVerifySecret?: string;
      subscribedFields?: string[];
      autoHidePhoneComments?: boolean;
      syncEchoMessagesFromNativeApp?: boolean;
      metaDatasetId?: string;
      capiAccessToken?: string;
      isActive?: boolean;
    },
  ) => Promise<boolean>;
  disconnectChannel: (shopId: string, channelId: string) => Promise<boolean>;
  runTokenDoctor: (shopId: string) => Promise<{
    totalChecked: number;
    healthyCount: number;
    warningCount: number;
    expiredCount: number;
  } | null>;
  fetchWebhookLogs: (
    shopId: string,
    params?: {
      channelType?: ChannelPlatformType;
      processingStatus?: string;
    },
  ) => Promise<void>;
  fetchMergedConversations: (
    shopId: string,
    params?: {
      channelIds?: string[];
      supportStatus?: string;
      search?: string;
      page?: number;
      limit?: number;
    },
  ) => Promise<void>;
  fetchMarketplaceReservations: (shopId: string) => Promise<void>;
  replayWebhookLog: (shopId: string, logId: string) => Promise<boolean>;
  selectSingleChannel: (channelId: string) => void;
  toggleMergeChannel: (channelId: string) => void;
  selectAllChannelsMerge: () => void;
  applySavedPreset: (presetId: string, channelIds: string[]) => void;
}

export const useChannelWorkspaceStore =
  createPersistedStore<ChannelWorkspaceStoreState>(
    (set, get) => ({
      channels: [],
      saasBlueprints: [],
      selectedChannelIds: [],
      isMergeMode: true,
      activePresetId: null,
      webhookLogs: [],
      mergedConversations: [],
      mergedTotal: 0,
      marketplaceReservations: [],
      isLoadingChannels: false,
      isLoadingWebhookLogs: false,
      isLoadingMergedInbox: false,
      isLoadingMarketplaceReservations: false,

      fetchShopChannels: async (shopId) => {
        if (!shopId) return;
        set((state) => {
          state.isLoadingChannels = true;
        });
        try {
          const res: any = await listShopChannelsApi(shopId);
          const list: ConnectedChannelItem[] = res?.data || [];
          set((state) => {
            state.channels = list;
            if (state.selectedChannelIds.length === 0 && list.length > 0) {
              state.selectedChannelIds = list.map((c) => c.id);
              state.isMergeMode = list.length > 1;
            } else {
              const validIds = new Set(list.map((c) => c.id));
              state.selectedChannelIds = state.selectedChannelIds.filter((id) =>
                validIds.has(id),
              );
              if (state.selectedChannelIds.length === 0 && list.length > 0) {
                state.selectedChannelIds = list.map((c) => c.id);
              }
            }
          });
        } finally {
          set((state) => {
            state.isLoadingChannels = false;
          });
        }
      },

      fetchSaasWebhookConfig: async (shopId) => {
        if (!shopId) return;
        try {
          const res: any = await getSaasWebhookConfigApi(shopId);
          const data = res?.data ?? res;
          set((state) => {
            state.saasBlueprints = data?.platforms || [];
          });
        } catch {}
      },

      resolveChannelTokenMetadata: async (shopId, payload) => {
        if (!shopId || !payload.accessToken.trim()) return null;
        const res: any = await resolveChannelTokenMetadataApi(shopId, payload);
        return (res?.data ?? res) as ResolvedChannelTokenMetadata;
      },

      connectChannelOAuth: async (shopId, payload) => {
        await connectChannelOAuthApi(shopId, payload);
        await get().fetchShopChannels(shopId);
        return true;
      },

      batchConnectChannels: async (shopId, payload) => {
        const res: any = await batchConnectChannelsApi(shopId, payload);
        await get().fetchShopChannels(shopId);
        const data = res?.data ?? res;
        return Number(data?.connectedCount || payload.pages.length);
      },

      syncChannelWebhook: async (shopId, channelId) => {
        const res: any = await syncChannelWebhookApi(shopId, channelId);
        await get().fetchShopChannels(shopId);
        return (res?.data ?? res) || null;
      },

      updateChannelIntegration: async (shopId, channelId, payload) => {
        await updateChannelIntegrationApi(shopId, channelId, payload);
        await get().fetchShopChannels(shopId);
        return true;
      },

      disconnectChannel: async (shopId, channelId) => {
        await removeChannelIntegrationApi(shopId, channelId);
        await get().fetchShopChannels(shopId);
        return true;
      },

      runTokenDoctor: async (shopId) => {
        const res: any = await runTokenDoctorHealthCheckApi(shopId);
        await get().fetchShopChannels(shopId);
        return res?.data || null;
      },

      fetchWebhookLogs: async (shopId, params) => {
        if (!shopId) return;
        set((state) => {
          state.isLoadingWebhookLogs = true;
        });
        try {
          const res: any = await getWebhookLogsApi(shopId, params);
          set((state) => {
            state.webhookLogs = res?.data?.items || [];
          });
        } finally {
          set((state) => {
            state.isLoadingWebhookLogs = false;
          });
        }
      },

      fetchMergedConversations: async (shopId, params) => {
        if (!shopId) return;
        set((state) => {
          state.isLoadingMergedInbox = true;
        });
        try {
          const channelIdsStr =
            params?.channelIds && params.channelIds.length > 0
              ? params.channelIds.join(",")
              : get().selectedChannelIds.join(",");
          const res: any = await getMergedInboxConversationsApi(shopId, {
            channelIds: channelIdsStr || undefined,
            supportStatus:
              params?.supportStatus && params.supportStatus !== "ALL"
                ? params.supportStatus
                : undefined,
            search: params?.search?.trim() || undefined,
            page: params?.page || 1,
            limit: params?.limit || 50,
          });
          set((state) => {
            state.mergedConversations = res?.data?.items || [];
            state.mergedTotal = Number(res?.data?.total || 0);
          });
        } finally {
          set((state) => {
            state.isLoadingMergedInbox = false;
          });
        }
      },

      fetchMarketplaceReservations: async (shopId) => {
        if (!shopId) return;
        set((state) => {
          state.isLoadingMarketplaceReservations = true;
        });
        try {
          const res: any = await getMarketplaceReservationsApi(shopId);
          set((state) => {
            state.marketplaceReservations = res?.data || [];
          });
        } catch {
        } finally {
          set((state) => {
            state.isLoadingMarketplaceReservations = false;
          });
        }
      },

      replayWebhookLog: async (shopId, logId) => {
        await replayFailedWebhookApi(shopId, logId);
        await get().fetchWebhookLogs(shopId);
        return true;
      },

      selectSingleChannel: (channelId) => {
        set((state) => {
          state.isMergeMode = false;
          state.selectedChannelIds = [channelId];
          state.activePresetId = null;
        });
      },

      toggleMergeChannel: (channelId) => {
        set((state) => {
          state.isMergeMode = true;
          state.activePresetId = null;
          if (state.selectedChannelIds.includes(channelId)) {
            if (state.selectedChannelIds.length > 1) {
              state.selectedChannelIds = state.selectedChannelIds.filter(
                (id) => id !== channelId,
              );
            }
          } else {
            state.selectedChannelIds = [...state.selectedChannelIds, channelId];
          }
        });
      },

      selectAllChannelsMerge: () => {
        set((state) => {
          state.isMergeMode = true;
          state.activePresetId = null;
          state.selectedChannelIds = state.channels.map((c) => c.id);
        });
      },

      applySavedPreset: (presetId, channelIds) => {
        set((state) => {
          state.isMergeMode = true;
          state.activePresetId = presetId;
          state.selectedChannelIds = channelIds;
        });
      },
    }),
    "seller-os-channel-workspace-storage",
  );
