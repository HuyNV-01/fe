import apiClient from "@/lib/http/axios-client";
import type {
  IBundleBomComponent,
  IProductFreeGiftRule,
  ISellerAdvisorFieldSchema,
  ISellerAdvisorRuleRow,
  ISellerCategoryBlueprint,
  ISellerVietQrBankConfig,
  InventoryMovementType,
  PosOrderPaymentMethodType,
  PosOrderStatusType,
  ProductIndustryType,
  ProductSerialStatusType,
} from "@/types/catalog-pos";

export const getShopCatalogPosConfigApi = (shopId: string) =>
  apiClient.get(`/catalog-pos/${shopId}/config`);

export const updateShopCatalogPosConfigApi = (payload: {
  shopId: string;
  categories?: ISellerCategoryBlueprint[];
  freeGiftRules?: IProductFreeGiftRule[];
  vietQrBankConfig?: Partial<ISellerVietQrBankConfig>;
  autoSeedDemoCatalogWhenEmpty?: boolean;
}) => {
  const { shopId, ...body } = payload;
  return apiClient.put(`/catalog-pos/${shopId}/config`, body);
};

export const upsertSellerCategoryBlueprintApi = (payload: {
  shopId: string;
  categoryId?: string;
  code: string;
  name: string;
  badgeLabel?: string;
  iconEmoji?: string;
  industryType?: ProductIndustryType;
  defaultUnitName?: string;
  attributeAxis1Name?: string;
  attributeAxis1SampleValues?: string[];
  attributeAxis2Name?: string;
  attributeAxis2SampleValues?: string[];
  requiresSerialImei?: boolean;
  defaultWarrantyMonths?: number;
  requiresBatchExpiry?: boolean;
  defaultShelfLifeMonths?: number;
  defaultStorageCondition?: string | null;
  defaultMaxDiscountPercent?: number;
  enableAdvisorInPos?: boolean;
  advisorTitle?: string;
  advisorFields?: ISellerAdvisorFieldSchema[];
  advisorRules?: ISellerAdvisorRuleRow[];
  isActive?: boolean;
  sortOrder?: number;
}) => {
  const { shopId, ...body } = payload;
  return apiClient.post(`/catalog-pos/${shopId}/config/categories`, body);
};

export const deleteSellerCategoryBlueprintApi = (params: {
  shopId: string;
  categoryId: string;
}) =>
  apiClient.delete(
    `/catalog-pos/${params.shopId}/config/categories/${encodeURIComponent(params.categoryId)}`,
  );

export const seedSampleCatalogApi = (shopId: string) =>
  apiClient.post(`/catalog-pos/${shopId}/seed-demo`, {});

export const listWarehousesApi = (shopId: string) =>
  apiClient.get(`/catalog-pos/${shopId}/warehouses`);

export const upsertWarehouseApi = (payload: {
  shopId: string;
  code: string;
  name: string;
  provinceCode?: string;
  districtCode?: string;
  wardCode?: string;
  addressLine?: string;
  contactPhone?: string;
  isDefault?: boolean;
  priorityOrder?: number;
  allowNegativeStock?: boolean;
}) => {
  const { shopId, ...body } = payload;
  return apiClient.post(`/catalog-pos/${shopId}/warehouses`, body);
};

export const listCatalogVariantsApi = (params: {
  shopId: string;
  search?: string;
  warehouseId?: string;
  bundleOnly?: boolean;
  industryType?: ProductIndustryType;
  customCategoryId?: string;
}) => {
  const { shopId, ...query } = params;
  return apiClient.get(`/catalog-pos/${shopId}/variants`, { params: query });
};

export const updateProductVariantApi = (payload: {
  shopId: string;
  variantId: string;
  variantName?: string;
  customCategoryId?: string | null;
  industryType?: ProductIndustryType;
  categoryName?: string;
  brandName?: string | null;
  unitName?: string;
  barcode?: string;
  retailPrice?: number;
  wholesalePrice?: number;
  costPrice?: number;
  maxDiscountPercent?: number;
  weightGrams?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  isFreeGiftItem?: boolean;
  requiresSerialImei?: boolean;
  warrantyMonths?: number;
  requiresBatchExpiry?: boolean;
  batchCode?: string | null;
  expiryDate?: string | null;
  storageCondition?: string | null;
  isActive?: boolean;
}) => {
  const { shopId, variantId, ...body } = payload;
  return apiClient.patch(
    `/catalog-pos/${shopId}/variants/${encodeURIComponent(variantId)}`,
    body,
  );
};

export const deleteProductVariantApi = (params: {
  shopId: string;
  variantId: string;
}) =>
  apiClient.delete(
    `/catalog-pos/${params.shopId}/variants/${encodeURIComponent(params.variantId)}`,
  );

export const createProductWithMatrixApi = (payload: {
  shopId: string;
  code: string;
  name: string;
  customCategoryId?: string;
  industryType?: ProductIndustryType;
  categoryName?: string;
  brandName?: string;
  unitName?: string;
  attributeAxis1Name?: string;
  attributeAxis1Values?: string[];
  attributeAxis2Name?: string;
  attributeAxis2Values?: string[];
  colors?: string[];
  sizes?: string[];
  retailPrice?: number;
  wholesalePrice?: number;
  costPrice?: number;
  maxDiscountPercent?: number;
  weightGrams?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  isFreeGiftItem?: boolean;
  requiresSerialImei?: boolean;
  warrantyMonths?: number;
  requiresBatchExpiry?: boolean;
  batchCode?: string;
  manufacturingDate?: string;
  expiryDate?: string;
  shelfLifeMonths?: number;
  storageCondition?: string;
  technicalSpecsJson?: Record<string, string>;
  initialOnHandQtyPerVariant?: number;
}) => {
  const { shopId, ...body } = payload;
  return apiClient.post(`/catalog-pos/${shopId}/products/matrix`, body);
};

export const createBundleBomVariantApi = (payload: {
  shopId: string;
  skuCode: string;
  variantName: string;
  customCategoryId?: string;
  industryType?: ProductIndustryType;
  retailPrice: number;
  maxDiscountPercent?: number;
  components: IBundleBomComponent[];
}) => {
  const { shopId, ...body } = payload;
  return apiClient.post(`/catalog-pos/${shopId}/bundles`, body);
};

export const recommendApparelSizeApi = (payload: {
  shopId: string;
  productId?: string;
  customCategoryId?: string;
  industryType?: ProductIndustryType;
  dynamicInputs?: Record<string, string | number>;
  heightCm?: number;
  weightKg?: number;
  babyAgeMonths?: number;
  skinType?: string;
  usageNeed?: string;
}) => {
  const { shopId, ...body } = payload;
  return apiClient.post(`/catalog-pos/${shopId}/size-advisor`, body);
};

export const reserveStockAtomicApi = (payload: {
  shopId: string;
  draftCartId: string;
  warehouseId: string;
  variantId: string;
  quantity: number;
  conversationId?: string;
}) => {
  const { shopId, ...body } = payload;
  return apiClient.post(
    `/catalog-pos/${shopId}/inventory/reserve-atomic`,
    body,
  );
};

export const releaseStockAtomicApi = (payload: {
  shopId: string;
  draftCartId: string;
  warehouseId: string;
  variantId: string;
  quantity?: number;
}) => {
  const { shopId, ...body } = payload;
  return apiClient.post(
    `/catalog-pos/${shopId}/inventory/release-atomic`,
    body,
  );
};

export const adjustWarehouseStocktakeApi = (payload: {
  shopId: string;
  warehouseId: string;
  variantId: string;
  movementType: InventoryMovementType;
  deltaQty: number;
  deltaDefectiveHoldQty?: number;
  note: string;
}) => {
  const { shopId, ...body } = payload;
  return apiClient.post(`/catalog-pos/${shopId}/inventory/adjust`, body);
};

export const listInventoryLedgersApi = (params: {
  shopId: string;
  warehouseId?: string;
  variantId?: string;
}) => {
  const { shopId, ...query } = params;
  return apiClient.get(`/catalog-pos/${shopId}/inventory/ledgers`, {
    params: query,
  });
};

export const listWarehouseTransfersApi = (shopId: string) =>
  apiClient.get(`/catalog-pos/${shopId}/transfers`);

export const createWarehouseTransferApi = (payload: {
  shopId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  items: Array<{ variantId: string; requestedQty: number }>;
  note?: string;
  dispatchImmediately?: boolean;
}) => {
  const { shopId, ...body } = payload;
  return apiClient.post(`/catalog-pos/${shopId}/transfers`, body);
};

export const receiveWarehouseTransferApi = (payload: {
  shopId: string;
  transferId: string;
  receivedItems?: Array<{
    variantId: string;
    receivedQty: number;
    discrepancyReason?: string;
  }>;
  note?: string;
}) => {
  const { shopId, transferId, ...body } = payload;
  return apiClient.post(
    `/catalog-pos/${shopId}/transfers/${transferId}/receive`,
    body,
  );
};

export const listProductSerialsApi = (params: {
  shopId: string;
  warehouseId?: string;
  variantId?: string;
  status?: ProductSerialStatusType;
  search?: string;
}) => {
  const { shopId, ...query } = params;
  return apiClient.get(`/catalog-pos/${shopId}/serials`, { params: query });
};

export const registerProductSerialsApi = (payload: {
  shopId: string;
  warehouseId: string;
  variantId: string;
  serialNumbers: string[];
  warrantyMonths?: number;
}) => {
  const { shopId, ...body } = payload;
  return apiClient.post(`/catalog-pos/${shopId}/serials/register`, body);
};

export const scanBindSerialToOrderApi = (payload: {
  shopId: string;
  serialNumber: string;
  orderId: string;
  customerId?: string;
}) => {
  const { shopId, ...body } = payload;
  return apiClient.post(`/catalog-pos/${shopId}/serials/scan-bind`, body);
};

export const listPosOrdersApi = (params: {
  shopId: string;
  status?: PosOrderStatusType;
  conversationId?: string;
  customerId?: string;
  search?: string;
}) => {
  const { shopId, ...query } = params;
  return apiClient.get(`/catalog-pos/${shopId}/pos/orders`, { params: query });
};

export const checkMergeableDuplicateOrdersApi = (params: {
  shopId: string;
  customerId?: string;
  conversationId?: string;
}) => {
  const { shopId, ...query } = params;
  return apiClient.get(`/catalog-pos/${shopId}/pos/orders/duplicate-check`, {
    params: query,
  });
};

export const previewOrderWarehouseRoutingApi = (payload: {
  shopId: string;
  receiverProvinceCode?: string | null;
  preferredWarehouseId?: string | null;
  items: Array<{ variantId: string; quantity: number }>;
}) => {
  const { shopId, ...body } = payload;
  return apiClient.post(
    `/catalog-pos/${shopId}/pos/orders/routing-preview`,
    body,
  );
};

export const createPosOrderApi = (payload: {
  shopId: string;
  conversationId?: string;
  customerId?: string;
  customerName: string;
  rawPhone?: string;
  channelType?: string;
  pageShortCode?: string;
  preferredWarehouseId?: string;
  addressTierMode?: "3_TIER" | "4_TIER";
  receiverProvinceCode?: string | null;
  receiverDistrictCode?: string | null;
  receiverWardCode?: string | null;
  receiverHamletCode?: string | null;
  receiverHamletName?: string | null;
  receiverAddressLine?: string | null;
  items: Array<{
    variantId: string;
    quantity: number;
    discountPercent?: number;
    serialNumbers?: string[];
  }>;
  carrierCode?: "GHN" | "GHTK" | "VTP" | "JT" | "COUNTER_PICKUP";
  shippingFeeAmount?: number;
  isFreeShippingForCustomer?: boolean;
  orderDiscountPercent?: number;
  discountApprovalReason?: string;
  loyaltyPointsRedeemed?: number;
  walletCreditAppliedAmount?: number;
  paymentMethod?: PosOrderPaymentMethodType;
  allowMultiWarehouseSplit?: boolean;
  reservationCartId?: string;
  note?: string;
}) => {
  const { shopId, ...body } = payload;
  return apiClient.post(`/catalog-pos/${shopId}/pos/orders`, body);
};

export const mergeDuplicatePosOrdersApi = (payload: {
  shopId: string;
  targetPrimaryOrderId: string;
  sourceDuplicateOrderId?: string;
  additionalCartItems?: Array<{
    variantId: string;
    quantity: number;
    discountPercent?: number;
  }>;
}) => {
  const { shopId, ...body } = payload;
  return apiClient.post(`/catalog-pos/${shopId}/pos/orders/merge`, body);
};

export const resolveDiscountApprovalApi = (payload: {
  shopId: string;
  orderId: string;
  approved: boolean;
  managerNote?: string;
}) => {
  const { shopId, orderId, ...body } = payload;
  return apiClient.post(
    `/catalog-pos/${shopId}/pos/orders/${orderId}/discount-approval`,
    body,
  );
};

export const regenerateOrderVietQrApi = (payload: {
  shopId: string;
  orderId: string;
  bankBin?: string;
  bankShortName?: string;
  accountNumber?: string;
  accountName?: string;
  amountVnd?: number;
}) => {
  const { shopId, orderId, ...body } = payload;
  return apiClient.post(
    `/catalog-pos/${shopId}/pos/orders/${orderId}/vietqr`,
    body,
  );
};

export const simulateVietQrPaymentWebhookApi = (payload: {
  shopId: string;
  orderIdOrReference: string;
  paidAmountVnd: number;
  bankTransactionId?: string;
  transferContent?: string;
}) => {
  const { shopId, ...body } = payload;
  return apiClient.post(`/catalog-pos/${shopId}/pos/webhooks/vietqr`, body);
};
