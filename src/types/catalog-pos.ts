export type ProductIndustryType =
  | "GENERAL_MULTI_CATEGORY"
  | "FASHION_APPAREL"
  | "COSMETICS_BEAUTY"
  | "ELECTRONICS_TECH"
  | "FOOD_BEVERAGE"
  | "MOTHER_AND_BABY"
  | "HOME_LIVING_APPLIANCES";

export type InventoryMovementType =
  | "PO_RECEIVE"
  | "POS_RESERVE"
  | "POS_RELEASE"
  | "ORDER_SHIP"
  | "RETURN_RESTOCK"
  | "RMA_EXCHANGE"
  | "TRANSFER_OUT"
  | "TRANSFER_IN"
  | "STOCKTAKE_ADJUST"
  | "BUNDLE_DEDUCT"
  | "DEFECTIVE_HOLD";

export type WarehouseTransferStatusType =
  | "DRAFT"
  | "OUTBOUND_IN_TRANSIT"
  | "COMPLETED"
  | "DISCREPANCY"
  | "CANCELLED";

export type ProductSerialStatusType =
  | "IN_STOCK"
  | "RESERVED"
  | "SOLD_ACTIVE_WARRANTY"
  | "RMA_RETURNED"
  | "DEFECTIVE";

export type PosOrderStatusType =
  | "DRAFT"
  | "PENDING_PRICE_APPROVAL"
  | "WAITING_DEPOSIT"
  | "CONFIRMED"
  | "WAITING_PACKING"
  | "PACKED_READY_TO_SHIP"
  | "HANDED_TO_CARRIER"
  | "IN_TRANSIT"
  | "DELIVERY_FAILED_RESCUE"
  | "DELIVERED"
  | "DELIVERED_RECONCILED"
  | "RETURNING"
  | "RETURNED_RESTOCKED"
  | "CANCELLED";

export type PosOrderPaymentMethodType =
  | "COD"
  | "VIETQR_TRANSFER"
  | "DEPOSIT_AND_COD"
  | "COUNTER_CASH"
  | "COUNTER_VIETQR"
  | "WALLET_CREDIT";

export type PosOrderPaymentStatusType =
  | "UNPAID"
  | "PARTIAL_DEPOSIT_PAID"
  | "PAID_IN_FULL"
  | "REFUNDED";

export type DiscountApprovalStatusType =
  | "NOT_REQUIRED"
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

/**
 * Cấu hình Trường Nhập Liệu Tư Vấn Động (`ISellerAdvisorFieldSchema`) do Người bán tự định nghĩa
 */
export interface ISellerAdvisorFieldOption {
  value: string;
  label: string;
}

export interface ISellerAdvisorFieldSchema {
  fieldKey: string;
  label: string;
  unit?: string;
  fieldType: "NUMBER" | "SELECT" | "TEXT";
  placeholder?: string;
  defaultValue?: number | string;
  min?: number;
  max?: number;
  options?: ISellerAdvisorFieldOption[];
  nerAutoFillField?: "heightCm" | "weightKg" | null;
}

/**
 * Quy tắc Đối chiếu Tư vấn Thông số / Kích cỡ Động (`ISellerAdvisorRuleRow`) do Người bán tự cấu hình
 */
export interface ISellerAdvisorRuleRow {
  ruleId: string;
  recommendedResultCode: string;
  fitNote: string;
  numericRanges?: Record<string, { min: number; max: number }>;
  exactMatches?: Record<string, string>;
  linkedSkuKeyword?: string;
}

/**
 * Cấu hình Ngành hàng / Danh mục Sản phẩm Động do Người bán tự thiết lập (`ISellerCategoryBlueprint`)
 */
export interface ISellerCategoryBlueprint {
  categoryId: string;
  code: string;
  name: string;
  badgeLabel: string;
  iconEmoji?: string;
  industryType: ProductIndustryType;
  defaultUnitName: string;
  attributeAxis1Name: string;
  attributeAxis1SampleValues: string[];
  attributeAxis2Name: string;
  attributeAxis2SampleValues: string[];
  requiresSerialImei: boolean;
  defaultWarrantyMonths: number;
  requiresBatchExpiry: boolean;
  defaultShelfLifeMonths: number;
  defaultStorageCondition?: string | null;
  defaultMaxDiscountPercent: number;
  enableAdvisorInPos: boolean;
  advisorTitle: string;
  advisorFields: ISellerAdvisorFieldSchema[];
  advisorRules: ISellerAdvisorRuleRow[];
  isActive: boolean;
  sortOrder: number;
}

/**
 * Quy tắc Quà tặng kèm 0đ tự động do Người bán cấu hình (`IProductFreeGiftRule`)
 */
export interface IProductFreeGiftRule {
  ruleId: string;
  ruleName: string;
  minOrderSubtotalVnd: number;
  requiredCategoryId?: string | null;
  giftVariantId: string;
  giftSkuCode: string;
  giftVariantName: string;
  giftQty: number;
  isActive: boolean;
}

/**
 * Cấu hình Tài khoản Ngân hàng Thụ hưởng VietQR EMVCo của Cửa hàng (`ISellerVietQrBankConfig`)
 */
export interface ISellerVietQrBankConfig {
  bankBin: string;
  bankShortName: string;
  accountNumber: string;
  accountName: string;
  transferPrefix: string;
  autoConfirmWebhookEnabled: boolean;
}

/**
 * Cấu hình Tổng thể Danh mục Ngành hàng Động, Khuyến mãi Quà tặng kèm & Thanh toán VietQR của Cửa hàng (`IShopCatalogAndPosConfig`)
 */
export interface IShopCatalogAndPosConfig {
  categories: ISellerCategoryBlueprint[];
  freeGiftRules: IProductFreeGiftRule[];
  vietQrBankConfig: ISellerVietQrBankConfig;
  autoSeedDemoCatalogWhenEmpty: boolean;
  hasInitializedDefaultCatalog?: boolean;
  updatedAt: string;
}

export interface ISuggestedVariantAdvisorItem {
  variantId: string;
  skuCode: string;
  variantName: string;
  retailPrice: number;
  totalAvailableQty: number;
  categoryName: string;
}

export interface IDynamicAdvisorResult {
  recommendedSizeCode: string;
  confidenceScore: number;
  matchedRow: IProductSizeChartRow;
  adviceMessage: string;
  categoryName: string;
  suggestedVariantsInStock: ISuggestedVariantAdvisorItem[];
}

export interface IWarehouse {
  id: string;
  shopId: string;
  code: string;
  name: string;
  provinceCode: string;
  districtCode: string;
  wardCode: string;
  addressLine: string;
  contactPhone: string;
  isDefault: boolean;
  priorityOrder: number;
  allowNegativeStock: boolean;
  isActive: boolean;
}

export interface IProductSizeChartRow {
  sizeCode: string;
  minHeightCm: number;
  maxHeightCm: number;
  minWeightKg: number;
  maxWeightKg: number;
  chestCm?: number;
  waistCm?: number;
  hipCm?: number;
  minAgeMonths?: number;
  maxAgeMonths?: number;
  skinTypeRecommendation?: string;
  fitNote?: string;
  numericRanges?: Record<string, { min: number; max: number }>;
  exactMatches?: Record<string, string>;
}

export interface IProductUomConversion {
  unitName: string;
  conversionFactor: number;
  barcode?: string;
  retailPrice?: number;
}

export interface IBundleBomComponent {
  componentVariantId: string;
  componentSkuCode: string;
  componentName: string;
  requiredQty: number;
  retailPriceSnapshot: number;
}

export interface IWarehouseStockBreakdown {
  warehouseId: string;
  warehouseCode: string;
  warehouseName: string;
  provinceCode: string;
  onHandQty: number;
  reservedQty: number;
  availableQty: number;
  inTransitQty: number;
  defectiveHoldQty: number;
  binLocationCode: string;
}

export interface IProductVariant {
  id: string;
  shopId: string;
  productId: string;
  customCategoryId?: string | null;
  industryType?: ProductIndustryType;
  categoryName?: string;
  brandName?: string | null;
  unitName?: string;
  skuCode: string;
  barcode: string;
  variantName: string;
  colorName?: string | null;
  sizeCode?: string | null;
  attributeAxis1Name?: string | null;
  attributeAxis1Value?: string | null;
  attributeAxis2Name?: string | null;
  attributeAxis2Value?: string | null;
  attributesJson?: Record<string, string> | null;
  imageUrl?: string | null;
  retailPrice: number;
  wholesalePrice: number;
  /**
   * Trường `costPrice` chỉ tồn tại trong JSON nếu user có quyền `CATALOG_COST_PRICE_VIEW` (bảo vệ bởi FLS Interceptor)
   */
  costPrice?: number;
  maxDiscountPercent: number;
  weightGrams: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  volumetricWeightGrams?: number;
  chargeableWeightGrams?: number;
  isBundleBom: boolean;
  bundleComponentsJson?: IBundleBomComponent[] | null;
  isFreeGiftItem: boolean;
  requiresSerialImei: boolean;
  warrantyMonths: number;
  requiresBatchExpiry?: boolean;
  batchCode?: string | null;
  manufacturingDate?: string | null;
  expiryDate?: string | null;
  shelfLifeMonths?: number;
  storageCondition?: string | null;
  daysUntilExpiry?: number | null;
  isNearExpiryWarning?: boolean;
  technicalSpecsJson?: Record<string, string> | null;
  uomConversionsJson?: IProductUomConversion[] | null;
  sizeChartMetadataJson?: IProductSizeChartRow[] | null;
  isActive: boolean;
  totalOnHandQty: number;
  totalReservedQty: number;
  totalAvailableQty: number;
  totalDefectiveHoldQty: number;
  stocksByWarehouse: IWarehouseStockBreakdown[];
}

export interface IInventoryMovementLedger {
  id: string;
  shopId: string;
  warehouseId: string;
  variantId: string;
  skuCode: string;
  movementType: InventoryMovementType;
  deltaQty: number;
  beforeOnHandQty: number;
  afterOnHandQty: number;
  beforeReservedQty: number;
  afterReservedQty: number;
  beforeAvailableQty: number;
  afterAvailableQty: number;
  costPrice?: number;
  referenceType: string;
  referenceId?: string | null;
  note?: string | null;
  actorUserId?: string | null;
  createdAt: string;
}

export interface IWarehouseTransferLineItem {
  variantId: string;
  skuCode: string;
  variantName: string;
  requestedQty: number;
  shippedQty: number;
  receivedQty: number;
  discrepancyReason?: string | null;
}

export interface IWarehouseTransferOrder {
  id: string;
  shopId: string;
  transferCode: string;
  fromWarehouseId: string;
  fromWarehouseName: string;
  toWarehouseId: string;
  toWarehouseName: string;
  status: WarehouseTransferStatusType;
  itemsJson: IWarehouseTransferLineItem[];
  note?: string | null;
  shippedByUserId?: string | null;
  shippedAt?: string | null;
  receivedByUserId?: string | null;
  receivedAt?: string | null;
  createdAt: string;
}

export interface IProductSerialItem {
  id: string;
  shopId: string;
  warehouseId: string;
  variantId: string;
  skuCode: string;
  variantName: string;
  serialNumber: string;
  status: ProductSerialStatusType;
  soldOrderId?: string | null;
  soldOrderCode?: string | null;
  customerId?: string | null;
  warrantyMonths: number;
  activatedAt?: string | null;
  warrantyExpiresAt?: string | null;
  note?: string | null;
  createdAt: string;
}

export interface IPosOrderLineItem {
  variantId: string;
  productId: string;
  skuCode: string;
  barcode: string;
  variantName: string;
  imageUrl?: string | null;
  quantity: number;
  retailPrice: number;
  discountPercent: number;
  discountAmount: number;
  finalUnitPrice: number;
  lineTotalAmount: number;
  costPrice?: number;
  weightGrams: number;
  isBundleBom: boolean;
  isFreeGift: boolean;
  warehouseId: string;
  warehouseName: string;
  assignedSerialNumbers?: string[];
}

export interface IVietQrEmvcoPayloadInfo {
  bankBin: string;
  bankShortName: string;
  accountNumber: string;
  accountName: string;
  amountVnd: number;
  transferReferenceCode: string;
  emvcoRawPayload: string;
  qrImageUrl: string;
  generatedAt: string;
  paidAt?: string | null;
  bankTransactionId?: string | null;
}

export interface IPosOrder {
  id: string;
  shopId: string;
  orderCode: string;
  parentOrderId?: string | null;
  mergedFromOrderIdsJson?: string[] | null;
  splitChildOrderIdsJson?: string[] | null;
  conversationId?: string | null;
  customerId?: string | null;
  customerName: string;
  customerPhoneMasked: string;
  channelType: string;
  pageShortCode?: string | null;
  warehouseId: string;
  warehouseName: string;
  status: PosOrderStatusType;
  addressTierMode: "3_TIER" | "4_TIER";
  receiverProvinceCode?: string | null;
  receiverProvinceName?: string | null;
  receiverDistrictCode?: string | null;
  receiverDistrictName?: string | null;
  receiverWardCode?: string | null;
  receiverWardName?: string | null;
  receiverHamletCode?: string | null;
  receiverHamletName?: string | null;
  receiverAddressLine?: string | null;
  fullThreeTierAddress?: string | null;
  fullFourTierAddress?: string | null;
  itemsJson: IPosOrderLineItem[];
  totalWeightGrams: number;
  carrierCode: "GHN" | "GHTK" | "VTP" | "JT" | "COUNTER_PICKUP";
  carrierServiceName: string;
  trackingNumber?: string | null;
  shippingFeeAmount: number;
  isFreeShippingForCustomer: boolean;
  subtotalAmount: number;
  discountPercent: number;
  discountAmount: number;
  loyaltyPointsRedeemed: number;
  walletCreditAppliedAmount: number;
  totalPayableAmount: number;
  depositRequiredAmount: number;
  paidTransferAmount: number;
  codCollectAmount: number;
  cogsSnapshotAmount?: number;
  estimatedNetProfitAmount?: number;
  paymentMethod: PosOrderPaymentMethodType;
  paymentStatus: PosOrderPaymentStatusType;
  discountApprovalStatus: DiscountApprovalStatusType;
  discountApprovalReason?: string | null;
  discountApprovedByUserId?: string | null;
  vietqrPayloadJson?: IVietQrEmvcoPayloadInfo | null;
  reservationCartId?: string | null;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IPosDraftCartItem {
  variant: IProductVariant;
  quantity: number;
  discountPercent: number;
  serialNumbers: string[];
  reservedInRedis?: boolean;
}

export interface IWarehouseRoutingPreview {
  canFulfillSingleWarehouse: boolean;
  recommendedSingleWarehouse: IWarehouse | null;
  requiresMultiWarehouseSplit: boolean;
  allocationsByWarehouse: Array<{
    warehouseId: string;
    warehouseCode: string;
    warehouseName: string;
    items: Array<{
      variantId: string;
      skuCode: string;
      variantName: string;
      quantity: number;
    }>;
  }>;
}
