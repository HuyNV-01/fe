export type CustomerTierType = "NEW" | "SILVER" | "GOLD" | "VIP" | "BLACKLIST";

export type DeliveryTrustBandType =
  | "TRUSTED_GREEN"
  | "NEW_NEUTRAL"
  | "CAUTION_AMBER"
  | "HIGH_RISK_RED";

export type RfmSegmentCodeType =
  | "CHAMPIONS"
  | "LOYAL"
  | "POTENTIAL_LOYALIST"
  | "NEW_CUSTOMERS"
  | "PROMISING"
  | "NEED_ATTENTION"
  | "AT_RISK"
  | "HIBERNATING";

export type CustomerWalletLedgerType = "LOYALTY_POINT" | "WALLET_CREDIT";

export type CustomerWalletTransactionType =
  | "EARN_FROM_ORDER"
  | "REDEEM_ON_ORDER"
  | "RMA_REFUND_CREDIT"
  | "OVERPAYMENT_CREDIT"
  | "MANUAL_ADJUST";

export type AdsConversionPlatformType = "META_CAPI" | "TIKTOK_EVENTS";

export type AdsConversionEventNameType =
  | "LeadSubmitted"
  | "InitiateCheckout"
  | "Purchase";

export type SecurityAuditActionCodeType =
  | "UNMASK_PHONE"
  | "EXPORT_CUSTOMERS"
  | "OVERRIDE_DISCOUNT"
  | "MERGE_CUSTOMER"
  | "BLACKLIST_TOGGLE"
  | "TRUST_SCORE_OVERRIDE"
  | "WALLET_MANUAL_ADJUST"
  | "CAPI_CONFIG_UPDATE"
  | "MODIFY_CONFIRMED_ORDER"
  | "ADJUST_STOCK"
  | "UPDATE_IAM_PERMISSIONS";

export interface IVnWardUnit {
  code: string;
  name: string;
  aliases: string[];
  ghnWardCode: string;
  ghtkWardName: string;
}

export interface IVnDistrictUnit {
  code: string;
  name: string;
  aliases: string[];
  ghnDistrictId: number;
  ghtkDistrictName: string;
  wards: IVnWardUnit[];
}

export interface IVnProvinceUnit {
  code: string;
  name: string;
  aliases: string[];
  ghnProvinceId: number;
  ghtkProvinceName: string;
  vtpProvinceId: number;
  jtCityCode: string;
  districts: IVnDistrictUnit[];
}

export interface IExtractedCommerceEntities {
  phones?: string[];
  normalizedPhones?: Array<{
    rawMatch: string;
    localPhone: string;
    e164Phone: string;
    carrierName: string;
  }>;
  provinceCode?: string | null;
  provinceName?: string | null;
  districtCode?: string | null;
  districtName?: string | null;
  wardCode?: string | null;
  wardName?: string | null;
  addressLine?: string | null;
  fullFormattedAddress?: string | null;
  carrierCodes?: {
    ghnProvinceId?: number;
    ghnDistrictId?: number;
    ghnWardCode?: string;
    ghtkProvince?: string;
    ghtkDistrict?: string;
    ghtkWard?: string;
    vtpProvinceId?: number;
    jtCityCode?: string;
  } | null;
  skuCodes?: string[];
  colors?: string[];
  sizes?: string[];
  heightCm?: number | null;
  weightKg?: number | null;
  quantities?: number[];
  processingTimeMs?: number;
}

export interface IDeliveryTrustEvaluation {
  score: number;
  band: DeliveryTrustBandType;
  badgeVariant: "success" | "info" | "warning" | "danger";
  headline: string;
  recommendation: string;
  requireDepositVietQr: boolean;
  successRatePercent: number;
}

export interface ILinkedExternalIdentity {
  channelType: string;
  channelIntegrationId: string | null;
  pageShortCode?: string | null;
  pageName?: string | null;
  externalUserId: string;
  externalUsername?: string | null;
  avatarUrl?: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface ICustomerRecentOrderSnapshot {
  orderId: string;
  orderCode: string;
  channelType: string;
  pageShortCode?: string | null;
  totalAmount: number;
  status:
    | "CONFIRMED"
    | "SHIPPING"
    | "DELIVERED_RECONCILED"
    | "RETURNED"
    | "CANCELLED";
  carrierCode?: string | null;
  trackingNumber?: string | null;
  createdAt: string;
}

export interface ICustomerProfile {
  id: string;
  shopId: string;
  code: string;
  fullName: string;
  avatarUrl?: string | null;
  phoneMasked?: string | null;
  email?: string | null;
  defaultProvinceCode?: string | null;
  defaultProvinceName?: string | null;
  defaultDistrictCode?: string | null;
  defaultDistrictName?: string | null;
  defaultWardCode?: string | null;
  defaultWardName?: string | null;
  defaultAddressLine?: string | null;
  tier: CustomerTierType;
  rfmScoreR: number;
  rfmScoreF: number;
  rfmScoreM: number;
  rfmSegmentCode: RfmSegmentCodeType;
  totalOrdersCount: number;
  successfulDeliveriesCount: number;
  returnedOrdersCount: number;
  deliveryTrustScore: number;
  isBlacklisted: boolean;
  blacklistReason?: string | null;
  lifetimeValueAmount: number;
  loyaltyPointsBalance: number;
  walletCreditBalance: number;
  heightCm?: number | null;
  weightKg?: number | null;
  preferredSize?: string | null;
  notes?: string | null;
  linkedExternalIdentitiesJson?: ILinkedExternalIdentity[] | null;
  activeTagIdsJson?: string[] | null;
  recentOrdersSnapshotJson?: ICustomerRecentOrderSnapshot[] | null;
  lastOrderAt?: string | null;
  createdAt: string;
  updatedAt: string;
  trustEvaluation?: IDeliveryTrustEvaluation;
}

export interface ICustomerWalletLedger {
  id: string;
  shopId: string;
  customerId: string;
  ledgerType: CustomerWalletLedgerType;
  transactionType: CustomerWalletTransactionType;
  deltaAmount: number;
  balanceAfter: number;
  referenceOrderId?: string | null;
  note?: string | null;
  actorUserId?: string | null;
  createdAt: string;
}

export interface IUnmaskedPhoneSession {
  customerId: string;
  unmaskedPhone: string;
  phoneMasked: string;
  expiresInSeconds: number;
  expiresAt: string;
  hourlyQuotaLimit: number;
  hourlyQuotaUsed: number;
  remainingQuotaThisHour: number;
  auditLogId: string;
}

export interface IAdsConversionEventLog {
  id: string;
  shopId: string;
  channelIntegrationId?: string | null;
  conversationId?: string | null;
  customerId?: string | null;
  orderId?: string | null;
  platform: AdsConversionPlatformType;
  eventName: AdsConversionEventNameType;
  eventId: string;
  ctwaClickId?: string | null;
  sourceAdId?: string | null;
  sourcePostId?: string | null;
  valueAmount: number;
  currency: string;
  testEventCode?: string | null;
  syncStatus:
    | "DISPATCHED_LIVE"
    | "SIMULATED_SANDBOX"
    | "QUEUED_RETRY"
    | "FAILED";
  requestPayloadJson?: Record<string, unknown> | null;
  responseStatus: number;
  responseBodyJson?: Record<string, unknown> | null;
  retryCount: number;
  syncedAt?: string | null;
  createdAt: string;
}

export interface ISecurityAuditLog {
  id: string;
  shopId: string;
  actorUserId: string;
  actorName?: string | null;
  actionCode: SecurityAuditActionCodeType;
  targetResourceType: string;
  targetResourceId: string;
  beforeSnapshotJson?: Record<string, unknown> | null;
  afterSnapshotJson?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  prevHash: string;
  entryHmacHash: string;
  createdAt: string;
}

export interface ISecurityChainVerificationResult {
  shopId: string;
  isValidChain: boolean;
  status: "VALID_100_PERCENT" | "TAMPER_DETECTED";
  totalEntriesChecked: number;
  brokenAtLogId: string | null;
  verifiedAt: string;
}

export interface IRfmSegmentSummary {
  segmentCode: RfmSegmentCodeType;
  customerCount: number;
  totalLifetimeValue: number;
  avgTrustScore: number;
}
