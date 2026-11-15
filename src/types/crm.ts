export type CustomerTierType = "NEW" | "SILVER" | "GOLD" | "VIP" | "BLACKLIST";

export type DeliveryTrustBandType =
  | "TRUSTED_GREEN"
  | "NEW_NEUTRAL"
  | "CAUTION_AMBER"
  | "HIGH_RISK_RED";

export type ShopBusinessCategoryType =
  | "GENERAL_MULTI_CATEGORY"
  | "FASHION_APPAREL"
  | "COSMETICS_BEAUTY"
  | "ELECTRONICS_TECH"
  | "FOOD_BEVERAGE"
  | "MOTHER_AND_BABY";

export type PhoneTrustLookupSourceType =
  | "INTERNAL_POS"
  | "PANCAKE_COMMUNITY"
  | "CARRIER_3PL"
  | "CUSTOM_WEBHOOK";

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
  | "PHONE_ABUSE_REPORT"
  | "CRM_SETTINGS_UPDATE"
  | "WALLET_MANUAL_ADJUST"
  | "CAPI_CONFIG_UPDATE"
  | "MODIFY_CONFIRMED_ORDER"
  | "ADJUST_STOCK"
  | "UPDATE_IAM_PERMISSIONS";

export interface ICrmTrustAndIndustryConfig {
  businessCategory: ShopBusinessCategoryType;
  showApparelMeasurementsInProfile: boolean;
  enableCustomAttributesInProfile?: boolean;
  defaultCustomAttributeKeys?: string[];
  customAttributeTemplates?: Array<{
    key: string;
    label: string;
    placeholder?: string;
  }>;
  enableAutoTrustLookupOnPhone?: boolean;
  useInternalPosHistory?: boolean;
  enableCommunityTrustLookup?: boolean;
  usePancakeCommunityNetwork?: boolean;
  enableCarrier3plTrustLookup?: boolean;
  useCarrier3plLookup?: boolean;
  enabledLookupSources?: PhoneTrustLookupSourceType[];
  enabledCarriers?: Array<"GHN" | "GHTK" | "VTP" | "JT">;
  customLookupWebhookUrl: string | null;
  hasCustomLookupApiKey?: boolean;
  autoMaskPhoneInChatMessages?: boolean;
  autoMaskBuyerPhoneInChat?: boolean;
  autoExtractPhoneAndAddressInChat?: boolean;
  autoExtractAddressFromChat?: boolean;
  autoRequireDepositBelowTrustScore?: number;
  highRiskReturnRateThresholdPercent?: number;
  highRiskReportedCountThreshold?: number;
  requireDepositOnHighRisk?: boolean;
  updatedAt?: string;
}

export interface ICustomerAbuseReportItem {
  reportId: string;
  reason?: string;
  reasonCode?:
    | "BOM_HANG"
    | "BOOM_AO_SPAM"
    | "TU_CHOI_NHAN_NHIEU_LAN"
    | "SAI_SO_DIEN_THOAI"
    | "OTHER"
    | string;
  reasonNote?: string;
  source?: string;
  carrierCode?: string | null;
  orderCode?: string | null;
  reportedByName?: string;
  reportedByUserId?: string;
  reportedByShopId?: string;
  reportedAt?: string;
  createdAt?: string;
}

export interface ICustomerCustomAttributeItem {
  key: string;
  label: string;
  value: string;
}

export interface IExtractedPhoneTrustSummary {
  customerId?: string | null;
  phoneMasked: string;
  carrierName: string;
  score: number;
  band: DeliveryTrustBandType;
  badgeVariant: "success" | "info" | "warning" | "danger";
  headline: string;
  totalDeliveredCount: number;
  shopDeliveredCount: number;
  networkDeliveredCount: number;
  totalReturnedCount: number;
  shopReturnedCount: number;
  networkReturnedCount: number;
  reportedCount: number;
  returnRatePercent: number;
  requireDepositVietQr: boolean;
  lookupSource: PhoneTrustLookupSourceType;
  lookupSourceLabel: string;
  lastLookupAt: string;
}

export type VnHamletUnitType =
  | "THON"
  | "AP"
  | "BAN"
  | "LANG"
  | "KHU_PHO"
  | "TO_DAN_PHO"
  | "KHOM"
  | "TIEU_KHU"
  | "XOM"
  | "KHU_DO_THI"
  | "DUONG_PHO";

export interface IVnHamletUnit {
  code: string;
  name: string;
  unitType: VnHamletUnitType;
  aliases: string[];
  ghtkHamletName: string;
}

export interface IVnWardUnit {
  code: string;
  name: string;
  unitType?: "PHUONG" | "XA" | "THI_TRAN" | "DAC_KHU";
  aliases: string[];
  ghnWardCode: string;
  ghtkWardName: string;
  vtpWardId?: number;
  isNewPostMergerWard?: boolean;
  mergedFromWardNames?: string[];
  mergedIntoNewWardCode?: string;
  mergedIntoNewWardName?: string;
  legacyProvinceCode?: string;
  legacyProvinceName?: string;
  legacyDistrictCode?: string;
  legacyDistrictName?: string;
  mergedProvinceCode?: string;
  mergedProvinceName?: string;
  ghnProvinceId?: number;
  ghnDistrictId?: number;
  ghtkProvinceName?: string;
  ghtkDistrictName?: string;
  vtpProvinceId?: number;
  jtCityCode?: string;
  hamlets?: IVnHamletUnit[];
}

export interface IVnDistrictUnit {
  code: string;
  name: string;
  unitType?: "QUAN" | "HUYEN" | "THI_XA" | "THANH_PHO" | "DAC_KHU";
  aliases: string[];
  ghnDistrictId: number;
  ghtkDistrictName: string;
  legacyProvinceCode?: string;
  legacyProvinceName?: string;
  mergedProvinceCode?: string;
  mergedProvinceName?: string;
  wards: IVnWardUnit[];
}

export interface IVnProvinceUnit {
  code: string;
  name: string;
  region?: "BAC_BO" | "TRUNG_BO" | "TAY_NGUYEN" | "NAM_BO";
  aliases: string[];
  ghnProvinceId: number;
  ghtkProvinceName: string;
  vtpProvinceId: number;
  jtCityCode: string;
  isCurrent34Province?: boolean;
  mergedIntoProvinceCode?: string;
  mergedIntoProvinceName?: string;
  mergedFromProvinceCodes?: string[];
  mergedFromProvinceNames?: string[];
  resolutionNumber?: string;
  ubtvqhResolutionNumber?: string;
  adminCenterName?: string;
  totalPostMergerCommunesCount?: number;
  directWards?: IVnWardUnit[];
  districts: IVnDistrictUnit[];
}

export interface IAdministrativeCrosswalkResult {
  preferredMode: "3_TIER" | "4_TIER";
  detectedInputTier: 3 | 4;
  isMergedProvince: boolean;
  threeTierAddress: {
    provinceCode: string;
    provinceName: string;
    resolutionNumber: string;
    ubtvqhResolutionNumber: string;
    adminCenterName: string;
    wardCode: string | null;
    wardName: string | null;
    wardUnitType: "PHUONG" | "XA" | "DAC_KHU" | null;
    mergedFromWardNames: string[];
    hamletCode: string | null;
    hamletName: string | null;
    addressLine: string | null;
    fullFormattedAddress: string;
  };
  fourTierAddress: {
    provinceCode: string;
    provinceName: string;
    districtCode: string | null;
    districtName: string | null;
    wardCode: string | null;
    wardName: string | null;
    wardUnitType: "PHUONG" | "XA" | "THI_TRAN" | "DAC_KHU" | null;
    hamletCode: string | null;
    hamletName: string | null;
    addressLine: string | null;
    fullFormattedAddress: string;
  };
  carrierMapping: {
    ghn: {
      provinceId: number;
      districtId: number;
      wardCode: string;
      isReadyForShipment: boolean;
    };
    ghtk: {
      province: string;
      postMergerProvince: string;
      district: string;
      ward: string;
      hamlet: string;
      street: string;
      isReadyForShipment: boolean;
    };
    viettelPost: {
      provinceId: number;
      districtId: number;
      wardId: number;
      nlpThreeTierAddress: string;
      nlpFourTierAddress: string;
      isReadyForShipment: boolean;
    };
    jtExpress: {
      cityCode: string;
      postMergerCityCode: string;
      prov: string;
      city: string;
      area: string;
      address: string;
      isReadyForShipment: boolean;
    };
  };
  processingTimeMs: number;
}

export interface ICarrierShippingQuoteItem {
  carrierCode: "GHN" | "GHTK" | "VTP" | "JT";
  carrierName: string;
  serviceCode: string;
  serviceName: string;
  totalFeeVnd: number;
  baseFeeVnd: number;
  insuranceFeeVnd: number;
  codFeeVnd: number;
  remoteAreaSurchargeVnd: number;
  estimatedDeliveryHours: number;
  estimatedDeliveryLabel: string;
  routeZoneType:
    | "INTRA_PROVINCE"
    | "SAME_REGION"
    | "CROSS_REGION"
    | "ISLAND_SPECIAL_ZONE";
  quoteSource: "LIVE_CARRIER_API" | "CALIBRATED_RATE_TABLE";
  mappedAddressSummary: string;
  isRecommendedCheapest?: boolean;
  isRecommendedFastest?: boolean;
}

export interface IMultiCarrierShippingFeeEstimateResult {
  routeZoneType:
    | "INTRA_PROVINCE"
    | "SAME_REGION"
    | "CROSS_REGION"
    | "ISLAND_SPECIAL_ZONE";
  routeZoneLabel: string;
  chargeableWeightGrams: number;
  cheapestCarrierCode: "GHN" | "GHTK" | "VTP" | "JT";
  fastestCarrierCode: "GHN" | "GHTK" | "VTP" | "JT";
  quotes: ICarrierShippingQuoteItem[];
  senderCrosswalk: IAdministrativeCrosswalkResult;
  receiverCrosswalk: IAdministrativeCrosswalkResult;
  evaluatedAt: string;
}

export interface IExtractedCommerceEntities {
  phones?: string[];
  maskedPhones?: string[];
  normalizedPhones?: Array<{
    rawMatch: string;
    localPhone?: string;
    e164Phone?: string;
    maskedPhone?: string;
    carrierName: string;
  }>;
  phoneTrustSummary?: IExtractedPhoneTrustSummary | null;
  provinceCode?: string | null;
  provinceName?: string | null;
  districtCode?: string | null;
  districtName?: string | null;
  wardCode?: string | null;
  wardName?: string | null;
  hamletCode?: string | null;
  hamletName?: string | null;
  hamletType?: VnHamletUnitType | null;
  legacyProvinceCode?: string | null;
  legacyProvinceName?: string | null;
  mergedProvinceCode?: string | null;
  mergedProvinceName?: string | null;
  isMergedProvince?: boolean;
  detectedAddressTier?: 3 | 4 | null;
  addressLine?: string | null;
  fullFormattedAddress?: string | null;
  fullThreeTierPostMergerAddress?: string | null;
  fullFourTierFormattedAddress?: string | null;
  hasAddressDetected?: boolean;
  carrierCodes?: {
    ghnProvinceId?: number;
    ghnDistrictId?: number;
    ghnWardCode?: string;
    ghtkProvince?: string;
    ghtkDistrict?: string;
    ghtkWard?: string;
    ghtkHamlet?: string;
    vtpProvinceId?: number;
    jtCityCode?: string;
  } | null;
  skuCodes?: string[];
  colors?: string[];
  sizes?: string[];
  heightCm?: number | null;
  weightKg?: number | null;
  quantities?: number[];
  paymentIntent?: "BANK_TRANSFER" | "COD" | null;
  deliveryTimeNote?: string | null;
  processingTimeMs?: number;
  maskedText?: string;
}

export interface IDeliveryTrustEvaluation {
  score: number;
  band: DeliveryTrustBandType;
  badgeVariant: "success" | "info" | "warning" | "danger";
  headline: string;
  recommendation: string;
  requireDepositVietQr: boolean;
  successRatePercent: number;
  returnRatePercent: number;
  totalDeliveredCount: number;
  shopDeliveredCount: number;
  networkDeliveredCount: number;
  totalReturnedCount: number;
  shopReturnedCount: number;
  networkReturnedCount: number;
  reportedCount: number;
  lookupSource: PhoneTrustLookupSourceType;
  lookupSourceLabel: string;
  lastLookupAt?: string | null;
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
  defaultHamletCode?: string | null;
  defaultHamletName?: string | null;
  defaultAddressLine?: string | null;
  tier: CustomerTierType;
  rfmScoreR: number;
  rfmScoreF: number;
  rfmScoreM: number;
  rfmSegmentCode: RfmSegmentCodeType;
  totalOrdersCount: number;
  successfulDeliveriesCount: number;
  returnedOrdersCount: number;
  networkDeliveredCount?: number;
  networkReturnedCount?: number;
  reportedCount?: number;
  reportedReasonsJson?: ICustomerAbuseReportItem[] | null;
  trustLookupSource?: PhoneTrustLookupSourceType;
  lastTrustLookupAt?: string | null;
  deliveryTrustScore: number;
  isBlacklisted: boolean;
  blacklistReason?: string | null;
  lifetimeValueAmount: number;
  loyaltyPointsBalance: number;
  walletCreditBalance: number;
  industryCategory?: ShopBusinessCategoryType;
  heightCm?: number | null;
  weightKg?: number | null;
  preferredSize?: string | null;
  customAttributesJson?: ICustomerCustomAttributeItem[] | null;
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
