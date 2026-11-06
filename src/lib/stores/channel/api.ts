// File: src/lib/stores/channel/api.ts
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

export interface ConnectedChannelItem {
  id: string;
  shopId: string;
  channelType: ChannelPlatformType;
  externalPageId: string;
  externalShopId?: string | null;
  pageName: string;
  pageShortCode: string;
  avatarUrl?: string | null;
  metaDatasetId?: string | null;
  tokenExpiresAt?: string | null;
  webhookStatus: WebhookHealthStatusType;
  lastWebhookReceivedAt?: string | null;
  lastErrorMessage?: string | null;
  isActive: boolean;
  unreadCount: number;
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

export const connectChannelOAuthApi = async (
  shopId: string,
  data: {
    channelType: ChannelPlatformType;
    externalPageId?: string;
    externalShopId?: string;
    pageName?: string;
    pageShortCode: string;
    avatarUrl?: string;
    oauthCode?: string;
    accessToken?: string;
    refreshToken?: string;
    webhookVerifySecret?: string;
    metaDatasetId?: string;
    capiAccessToken?: string;
  },
) => {
  return apiClient.post(`/channels/${shopId}/connect-oauth`, data);
};

export const updateChannelIntegrationApi = async (
  shopId: string,
  channelId: string,
  data: {
    pageName?: string;
    pageShortCode?: string;
    avatarUrl?: string;
    accessToken?: string;
    refreshToken?: string;
    webhookVerifySecret?: string;
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
