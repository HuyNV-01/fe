import apiClient from "@/lib/http/axios-client";
import type {
  AdsConversionEventNameType,
  AdsConversionPlatformType,
  CustomerTierType,
  CustomerWalletLedgerType,
  CustomerWalletTransactionType,
  ICustomerCustomAttributeItem,
  PhoneTrustLookupSourceType,
  RfmSegmentCodeType,
  SecurityAuditActionCodeType,
  ShopBusinessCategoryType,
} from "@/types/crm";

export const getAdministrativeUnitsApi = (shopId: string) =>
  apiClient.get(`/crm/${shopId}/administrative-units`);

export const getShopCrmConfigApi = (shopId: string) =>
  apiClient.get(`/crm/${shopId}/settings/crm-config`);

export const updateShopCrmConfigApi = (payload: {
  shopId: string;
  businessCategory?: ShopBusinessCategoryType;
  showApparelMeasurementsInProfile?: boolean;
  enableCustomAttributesInProfile?: boolean;
  defaultCustomAttributeKeys?: string[];
  enableCommunityTrustLookup?: boolean;
  enableCarrier3plTrustLookup?: boolean;
  enabledLookupSources?: PhoneTrustLookupSourceType[];
  customLookupWebhookUrl?: string;
  customLookupApiKey?: string;
  autoMaskPhoneInChatMessages?: boolean;
  autoExtractPhoneAndAddressInChat?: boolean;
  autoRequireDepositBelowTrustScore?: number;
}) => {
  const { shopId, ...body } = payload;
  return apiClient.patch(`/crm/${shopId}/settings/crm-config`, body);
};

export const extractVietnameseNerApi = (payload: {
  shopId: string;
  text: string;
  conversationId?: string;
  messageId?: string;
}) => {
  const { shopId, ...body } = payload;
  return apiClient.post(`/crm/${shopId}/ner/extract`, body);
};

export const listCustomersApi = (params: {
  shopId: string;
  page?: number;
  limit?: number;
  search?: string;
  tier?: CustomerTierType;
  rfmSegment?: RfmSegmentCodeType;
  highRiskOnly?: boolean;
  blacklistedOnly?: boolean;
}) => {
  const { shopId, ...query } = params;
  return apiClient.get(`/crm/${shopId}/customers`, { params: query });
};

export const getCustomer360ByConversationApi = (
  shopId: string,
  conversationId: string,
) =>
  apiClient.get(`/crm/${shopId}/customers/by-conversation/${conversationId}`);

export const getCustomer360DetailApi = (shopId: string, customerId: string) =>
  apiClient.get(`/crm/${shopId}/customers/${customerId}`);

export const createCustomerProfileApi = (payload: {
  shopId: string;
  fullName: string;
  rawPhone?: string;
  email?: string;
  defaultProvinceCode?: string;
  defaultDistrictCode?: string;
  defaultWardCode?: string;
  defaultAddressLine?: string;
  tier?: CustomerTierType;
  industryCategory?: ShopBusinessCategoryType;
  heightCm?: number;
  weightKg?: number;
  preferredSize?: string;
  customAttributesJson?: ICustomerCustomAttributeItem[];
  notes?: string;
  conversationId?: string;
}) => {
  const { shopId, ...body } = payload;
  return apiClient.post(`/crm/${shopId}/customers`, body);
};

export const updateCustomerProfileApi = (payload: {
  shopId: string;
  customerId: string;
  fullName: string;
  rawPhone?: string;
  email?: string;
  defaultProvinceCode?: string;
  defaultDistrictCode?: string;
  defaultWardCode?: string;
  defaultAddressLine?: string;
  tier?: CustomerTierType;
  industryCategory?: ShopBusinessCategoryType;
  heightCm?: number;
  weightKg?: number;
  preferredSize?: string;
  customAttributesJson?: ICustomerCustomAttributeItem[];
  notes?: string;
  conversationId?: string;
}) => {
  const { shopId, customerId, ...body } = payload;
  return apiClient.patch(`/crm/${shopId}/customers/${customerId}`, body);
};

export const lookupCustomerTrustFromSourcesApi = (payload: {
  shopId: string;
  customerId: string;
  sources?: PhoneTrustLookupSourceType[];
  customWebhookUrl?: string;
}) => {
  const { shopId, customerId, ...body } = payload;
  return apiClient.post(
    `/crm/${shopId}/customers/${customerId}/lookup-trust`,
    body,
  );
};

export const reportCustomerPhoneAbuseApi = (payload: {
  shopId: string;
  customerId: string;
  reasonCode:
    | "BOM_HANG"
    | "BOOM_AO_SPAM"
    | "TU_CHOI_NHAN_NHIEU_LAN"
    | "SAI_SO_DIEN_THOAI"
    | "OTHER";
  reasonNote: string;
  carrierCode?: string;
  orderCode?: string;
  markBlacklisted?: boolean;
}) => {
  const { shopId, customerId, ...body } = payload;
  return apiClient.post(
    `/crm/${shopId}/customers/${customerId}/report-abuse`,
    body,
  );
};

export const toggleCustomerBlacklistApi = (payload: {
  shopId: string;
  customerId: string;
  isBlacklisted: boolean;
  blacklistReason?: string;
}) => {
  const { shopId, customerId, ...body } = payload;
  return apiClient.post(
    `/crm/${shopId}/customers/${customerId}/blacklist`,
    body,
  );
};

export const overrideCustomerTrustScoreApi = (payload: {
  shopId: string;
  customerId: string;
  deliveryTrustScore: number;
  successfulDeliveriesCount?: number;
  returnedOrdersCount?: number;
  networkDeliveredCount?: number;
  networkReturnedCount?: number;
  reportedCount?: number;
  reason: string;
}) => {
  const { shopId, customerId, ...body } = payload;
  return apiClient.post(
    `/crm/${shopId}/customers/${customerId}/trust-score-override`,
    body,
  );
};

export const mergeCustomerProfilesApi = (payload: {
  shopId: string;
  primaryCustomerId: string;
  duplicateCustomerId: string;
  mergeReason?: string;
}) => {
  const { shopId, ...body } = payload;
  return apiClient.post(`/crm/${shopId}/customers/merge`, body);
};

export const unmaskCustomerPhoneApi = (payload: {
  shopId: string;
  customerId: string;
  reason?: string;
  conversationId?: string;
}) => {
  const { shopId, customerId, ...body } = payload;
  return apiClient.post(
    `/crm/${shopId}/customers/${customerId}/unmask-phone`,
    body,
  );
};

export const adjustCustomerWalletOrPointsApi = (payload: {
  shopId: string;
  customerId: string;
  ledgerType: CustomerWalletLedgerType;
  transactionType: CustomerWalletTransactionType;
  deltaAmount: number;
  referenceOrderId?: string;
  note: string;
}) => {
  const { shopId, customerId, ...body } = payload;
  return apiClient.post(
    `/crm/${shopId}/customers/${customerId}/wallet-adjust`,
    body,
  );
};

export const getRfmSegmentsApi = (shopId: string) =>
  apiClient.get(`/crm/${shopId}/rfm-segments`);

export const recalculateRfmSegmentsApi = (shopId: string) =>
  apiClient.post(`/crm/${shopId}/rfm-segments/recalculate`);

export const listAdsConversionsApi = (params: {
  shopId: string;
  conversationId?: string;
}) => {
  const { shopId, ...query } = params;
  return apiClient.get(`/crm/${shopId}/ads-conversions`, { params: query });
};

export const dispatchAdsConversionApi = (payload: {
  shopId: string;
  platform: AdsConversionPlatformType;
  eventName: AdsConversionEventNameType;
  conversationId?: string;
  customerId?: string;
  channelIntegrationId?: string;
  orderId?: string;
  ctwaClickId?: string;
  sourceAdId?: string;
  valueAmount?: number;
  currency?: string;
  testEventCode?: string;
}) => {
  const { shopId, ...body } = payload;
  return apiClient.post(`/crm/${shopId}/ads-conversions/dispatch`, body);
};

export const retryAdsConversionApi = (shopId: string, logId: string) =>
  apiClient.post(`/crm/${shopId}/ads-conversions/${logId}/retry`);

export const listSecurityAuditLogsApi = (params: {
  shopId: string;
  page?: number;
  limit?: number;
  actionCode?: SecurityAuditActionCodeType;
  actorUserId?: string;
}) => {
  const { shopId, ...query } = params;
  return apiClient.get(`/crm/${shopId}/security-audit`, { params: query });
};

export const verifySecurityAuditChainApi = (shopId: string) =>
  apiClient.get(`/crm/${shopId}/security-audit/verify-chain`);
