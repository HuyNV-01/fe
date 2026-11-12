import apiClient from "@/lib/http/axios-client";

export type ChannelPlatformType =
  | "FACEBOOK_PAGE"
  | "INSTAGRAM"
  | "ZALO_OA"
  | "TIKTOK_SHOP"
  | "SHOPEE"
  | "LAZADA"
  | "WEBSITE_LIVECHAT";

export type WebhookHealthStatusType =
  | "HEALTHY"
  | "TOKEN_EXPIRING_SOON"
  | "TOKEN_EXPIRED"
  | "WEBHOOK_DISCONNECTED"
  | "RATE_LIMITED";

export interface ChannelPlatformSaasConfig {
  saasAppProfileId?: string | null;
  saasAppProfileName?: string | null;
  apiVersion?: string;
  appId?: string;
  webhookVerifyToken?: string;
  webhookCallbackUrl?: string;
  subscribedFields?: string[];
  igBusinessAccountId?: string;
  igUsername?: string;
  zaloOaId?: string;
  tiktokShopCipher?: string;
  shopeePartnerId?: string;
  lazadaAppKey?: string;
  autoHidePhoneComments?: boolean;
  autoHideKeywordComments?: string[];
  syncEchoMessagesFromNativeApp?: boolean;
  webhookAutoInjected?: boolean;
  webhookInjectedAt?: string | null;
  subscribedAppsVerifiedOnPlatform?: boolean;
}

export interface SaasAppProfileItem {
  id: string;
  name: string;
  channelType: ChannelPlatformType;
  apiVersion: string;
  appId: string;
  hasAppSecretConfigured: boolean;
  webhookVerifyToken: string;
  webhookCallbackUrl: string;
  subscribedFields: string[];
  autoHidePhoneComments: boolean;
  syncEchoMessagesFromNativeApp: boolean;
  autoInjectWebhookOnConnect: boolean;
  isDefault: boolean;
  isActive: boolean;
  appWebhookRegistered: boolean;
  connectedChannelsCount: number;
  lastVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectedChannelItem {
  id: string;
  shopId: string;
  channelType: ChannelPlatformType;
  saasAppProfileId?: string | null;
  externalPageId: string;
  externalShopId?: string | null;
  pageName: string;
  pageShortCode: string;
  avatarUrl?: string | null;
  apiVersion?: string;
  appId?: string | null;
  hasAppSecretConfigured?: boolean;
  platformConfigJson?: ChannelPlatformSaasConfig | null;
  webhookCallbackUrl?: string;
  webhookVerifyToken?: string;
  metaDatasetId?: string | null;
  tokenExpiresAt?: string | null;
  webhookStatus: WebhookHealthStatusType;
  lastWebhookReceivedAt?: string | null;
  lastErrorMessage?: string | null;
  isActive: boolean;
  unreadCount: number;
}

export interface ResolvedChannelTokenCandidatePage {
  externalPageId: string;
  pageName: string;
  pageShortCode: string;
  avatarUrl: string | null;
  category?: string | null;
  pageAccessToken?: string;
  tasks?: string[];
  subscribedFields: string[];
  igBusinessAccount?: {
    id: string;
    name: string;
    username?: string;
    avatarUrl?: string | null;
  } | null;
}

export interface ResolvedChannelTokenMetadata {
  channelType: ChannelPlatformType;
  saasAppProfileId?: string | null;
  saasAppProfileName?: string | null;
  tokenKind:
    | "PAGE_TOKEN"
    | "USER_TOKEN"
    | "OA_TOKEN"
    | "SHOP_TOKEN"
    | "SANDBOX_TOKEN";
  apiVersionUsed: string;
  appIdDetected: string | null;
  tokenExpiresAt: string | null;
  scopesGranted: string[];
  externalPageId: string;
  pageName: string;
  pageShortCode: string;
  avatarUrl: string | null;
  category: string | null;
  subscribedFields: string[];
  candidatePages: ResolvedChannelTokenCandidatePage[];
  requiresPageSelection: boolean;
  resolvedFromLiveApi: boolean;
  webhookCallbackUrl: string;
  webhookVerifyToken: string;
  diagnosticMessage?: string | null;
}

export interface SaasWebhookBlueprintItem {
  channelType: ChannelPlatformType;
  defaultApiVersion: string;
  defaultAppId: string | null;
  hasSystemAppSecret: boolean;
  webhookCallbackUrl: string;
  webhookVerifyToken: string;
  requiredScopes: string[];
  subscribedFields: string[];
  outboundCapabilities: string[];
}

export interface ChannelWebhookLogItem {
  id: string;
  shopId: string | null;
  channelIntegrationId: string | null;
  channelType: ChannelPlatformType;
  idempotencyKey: string;
  eventType: string;
  processingStatus:
    | "RECEIVED"
    | "PROCESSED"
    | "DUPLICATE_SKIPPED"
    | "FAILED_DLQ"
    | "REPLAYED_SUCCESS";
  processingDurationMs: number;
  errorStack?: string | null;
  replayedCount: number;
  createdAt: string;
  headersJson?: Record<string, string>;
  rawPayloadJson?: Record<string, unknown>;
}

export interface MergedOmnichannelConversationItem {
  id: string;
  shopId: string;
  channelType: ChannelPlatformType;
  channelIntegrationId: string | null;
  externalThreadId?: string | null;
  name: string;
  avatar?: string | null;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  lastCustomerMessageAt?: string | null;
  lastAgentReplyAt?: string | null;
  assignedAgentId?: string | null;
  supportStatus: string;
  slaDeadlineAt?: string | null;
  hasPhoneCollected?: boolean;
  hasOrderCreated?: boolean;
  sourceAdId?: string | null;
  sourcePostId?: string | null;
  pageShortCode?: string;
  pageName?: string;
  channelAvatarUrl?: string | null;
}

export interface MarketplaceStockReservationItem {
  orderSn: string;
  channelType: ChannelPlatformType;
  channelIntegrationId: string;
  pageShortCode: string;
  buyerUsername: string;
  orderStatus: string;
  totalAmount: number;
  items: Array<{
    externalItemId: string;
    skuCode?: string;
    itemName: string;
    quantity: number;
    unitPrice: number;
    mappedVariantId: string;
  }>;
  reservedAt: string;
  conversationId?: string;
}

export const listShopChannelsApi = async (shopId: string) => {
  return apiClient.get(`/channels/${shopId}`);
};

export const getSaasWebhookConfigApi = async (shopId: string) => {
  return apiClient.get(`/channels/${shopId}/saas-webhook-config`);
};

export const listSaasAppProfilesApi = async (shopId: string) => {
  return apiClient.get(`/channels/${shopId}/saas-profiles`);
};

export const createSaasAppProfileApi = async (
  shopId: string,
  data: {
    name: string;
    channelType: ChannelPlatformType;
    apiVersion?: string;
    appId: string;
    appSecret?: string;
    webhookVerifyToken?: string;
    subscribedFields?: string[];
    autoHidePhoneComments?: boolean;
    syncEchoMessagesFromNativeApp?: boolean;
    autoInjectWebhookOnConnect?: boolean;
    isDefault?: boolean;
    autoRegisterAppWebhookOnPlatform?: boolean;
  },
) => {
  return apiClient.post(`/channels/${shopId}/saas-profiles`, data);
};

export const updateSaasAppProfileApi = async (
  shopId: string,
  profileId: string,
  data: {
    name?: string;
    apiVersion?: string;
    appId?: string;
    appSecret?: string;
    webhookVerifyToken?: string;
    subscribedFields?: string[];
    autoHidePhoneComments?: boolean;
    syncEchoMessagesFromNativeApp?: boolean;
    autoInjectWebhookOnConnect?: boolean;
    isDefault?: boolean;
    isActive?: boolean;
    propagateToBoundChannels?: boolean;
  },
) => {
  return apiClient.patch(
    `/channels/${shopId}/saas-profiles/${profileId}`,
    data,
  );
};

export const deleteSaasAppProfileApi = async (
  shopId: string,
  profileId: string,
) => {
  return apiClient.delete(`/channels/${shopId}/saas-profiles/${profileId}`);
};

export const injectWebhooksForSaasProfileApi = async (
  shopId: string,
  profileId: string,
) => {
  return apiClient.post(
    `/channels/${shopId}/saas-profiles/${profileId}/inject-all-webhooks`,
  );
};

export const resolveChannelTokenMetadataApi = async (
  shopId: string,
  data: {
    channelType: ChannelPlatformType;
    accessToken: string;
    saasAppProfileId?: string;
    externalPageId?: string;
    apiVersion?: string;
    appId?: string;
    appSecret?: string;
    allowSandboxSimulation?: boolean;
  },
) => {
  return apiClient.post(`/channels/${shopId}/resolve-token-metadata`, data);
};

export const connectChannelOAuthApi = async (
  shopId: string,
  data: {
    channelType: ChannelPlatformType;
    saasAppProfileId?: string;
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
) => {
  return apiClient.post(`/channels/${shopId}/connect-oauth`, data);
};

export const batchConnectChannelsApi = async (
  shopId: string,
  data: {
    channelType: ChannelPlatformType;
    saasAppProfileId?: string;
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
) => {
  return apiClient.post(`/channels/${shopId}/connect-batch`, data);
};

export const syncChannelWebhookApi = async (
  shopId: string,
  channelId: string,
) => {
  return apiClient.post(`/channels/${shopId}/${channelId}/sync-webhook`);
};

export const syncChannelPostsCommentsApi = async (
  shopId: string,
  channelId: string,
) => {
  return apiClient.post(`/channels/${shopId}/${channelId}/sync-posts-comments`);
};

export const syncAllShopPostsCommentsApi = async (shopId: string) => {
  return apiClient.post(`/channels/${shopId}/sync-all-posts-comments`);
};

export const updateChannelIntegrationApi = async (
  shopId: string,
  channelId: string,
  data: {
    saasAppProfileId?: string;
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
) => {
  return apiClient.patch(`/channels/${shopId}/${channelId}`, data);
};

export const removeChannelIntegrationApi = async (
  shopId: string,
  channelId: string,
) => {
  return apiClient.delete(`/channels/${shopId}/${channelId}`);
};

export const runTokenDoctorHealthCheckApi = async (shopId: string) => {
  return apiClient.post(`/channels/${shopId}/token-doctor/inspect`);
};

export const getWebhookLogsApi = async (
  shopId: string,
  params?: {
    channelType?: ChannelPlatformType;
    processingStatus?: string;
    page?: number;
    limit?: number;
  },
) => {
  return apiClient.get(`/channels/${shopId}/webhook-logs`, { params });
};

export const getMergedInboxConversationsApi = async (
  shopId: string,
  params?: {
    channelIds?: string;
    supportStatus?: string;
    search?: string;
    page?: number;
    limit?: number;
  },
) => {
  return apiClient.get(`/channels/${shopId}/merged-conversations`, { params });
};

export const getMarketplaceReservationsApi = async (shopId: string) => {
  return apiClient.get(`/channels/${shopId}/marketplace-reservations`);
};

export const replayFailedWebhookApi = async (shopId: string, logId: string) => {
  return apiClient.post(`/webhooks/omnichannel/replay/${logId}`, { shopId });
};

export const simulateOmnichannelWebhookApi = async (
  channelType: ChannelPlatformType,
  payload: Record<string, unknown>,
) => {
  return apiClient.post(
    `/webhooks/omnichannel/${channelType.toLowerCase()}`,
    payload,
  );
};
