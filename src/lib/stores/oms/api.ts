import apiClient from "@/lib/http/axios-client";
import type { PosOrderStatusType } from "@/types/catalog-pos";
import type {
  CodReconciliationDiscrepancyType,
  OmsCarrierRescueActionType,
  OmsCarrierSlaBreachType,
  OmsReturnConditionType,
  OmsRmaType,
  ThermalLabelFormatType,
} from "@/types/oms";

export const listOmsOrdersApi = (params: {
  shopId: string;
  status?: PosOrderStatusType;
  search?: string;
  carrierCode?: string;
  slaBreachType?: OmsCarrierSlaBreachType;
  page?: number;
  limit?: number;
}) => {
  const { shopId, ...query } = params;
  return apiClient.get(`/oms/${shopId}/orders`, { params: query });
};

export const getOmsOrderDetailApi = (shopId: string, orderId: string) =>
  apiClient.get(`/oms/${shopId}/orders/${orderId}`);

export const transitionOmsOrderStatusApi = (payload: {
  shopId: string;
  orderId: string;
  targetStatus: PosOrderStatusType;
  reasonNote?: string;
}) => {
  const { shopId, orderId, ...body } = payload;
  return apiClient.patch(`/oms/${shopId}/orders/${orderId}/status`, body);
};

export const modifyConfirmedOrderApi = (payload: {
  shopId: string;
  orderId: string;
  customerName?: string;
  receiverAddressLine?: string;
  codCollectAmount?: number;
  shippingFeeAmount?: number;
  note?: string;
  reasonNote: string;
}) => {
  const { shopId, orderId, ...body } = payload;
  return apiClient.patch(`/oms/${shopId}/orders/${orderId}/modify`, body);
};

export const dispatchCarrierBatchApi = (payload: {
  shopId: string;
  orderIds: string[];
  overrideCarrierCode?: "GHN" | "GHTK" | "VTP" | "JT";
}) => {
  const { shopId, ...body } = payload;
  return apiClient.post(`/oms/${shopId}/orders/dispatch-carrier-batch`, body);
};

export const lookupPackingOrderApi = (shopId: string, code: string) =>
  apiClient.get(`/oms/${shopId}/packing-station/lookup`, { params: { code } });

export const scanPackingBarcodeApi = (payload: {
  shopId: string;
  orderId: string;
  scannedCode: string;
  quantityDelta?: number;
  serialNumber?: string;
}) => {
  const { shopId, orderId, ...body } = payload;
  return apiClient.post(`/oms/${shopId}/packing-station/${orderId}/scan`, body);
};

export const completePackingAndPrintApi = (payload: {
  shopId: string;
  orderId: string;
  actualPackedWeightGrams: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  packingVideoUrl?: string;
  labelFormat?: ThermalLabelFormatType;
}) => {
  const { shopId, orderId, ...body } = payload;
  return apiClient.post(
    `/oms/${shopId}/packing-station/${orderId}/complete-and-print`,
    body,
  );
};

export const reprintShippingLabelApi = (payload: {
  shopId: string;
  orderId: string;
  labelFormat: ThermalLabelFormatType;
  reprintReason: string;
}) => {
  const { shopId, orderId, ...body } = payload;
  return apiClient.post(
    `/oms/${shopId}/packing-station/${orderId}/reprint`,
    body,
  );
};

export const listFailedRescueAndSlaApi = (shopId: string) =>
  apiClient.get(`/oms/${shopId}/failed-rescue`);

export const executeCarrierRescueActionApi = (payload: {
  shopId: string;
  orderId: string;
  action: OmsCarrierRescueActionType;
  noteToCarrier?: string;
  preferredDeliverySlot?: string;
  updatedReceiverName?: string;
  updatedReceiverPhone?: string;
  updatedReceiverAddress?: string;
  updatedCodAmount?: number;
  notifyCustomerViaOmnichannel?: boolean;
}) => {
  const { shopId, orderId, ...body } = payload;
  return apiClient.post(
    `/oms/${shopId}/orders/${orderId}/carrier-rescue-action`,
    body,
  );
};

export const triggerSlaWatchdogScanApi = (shopId: string) =>
  apiClient.post(`/oms/${shopId}/sla-watchdog/scan`, {});

export const lookupReturningOrderApi = (shopId: string, code: string) =>
  apiClient.get(`/oms/${shopId}/returns/lookup`, { params: { code } });

export const verifyReturnedOrderApi = (payload: {
  shopId: string;
  orderId: string;
  items: Array<{
    variantId: string;
    verifiedQty: number;
    condition: OmsReturnConditionType;
    serialNumbers?: string[];
    evidenceImageUrls?: string[];
    inspectionNote?: string;
  }>;
  createCarrierCompensationClaim?: boolean;
  overallNote?: string;
}) => {
  const { shopId, orderId, ...body } = payload;
  return apiClient.post(
    `/oms/${shopId}/returns/${orderId}/verify-restock`,
    body,
  );
};

export const listRmaExchangesApi = (shopId: string) =>
  apiClient.get(`/oms/${shopId}/rma-exchanges`);

export const createRmaExchangeApi = (payload: {
  shopId: string;
  originalOrderId: string;
  rmaType: OmsRmaType;
  returnItems: Array<{
    variantId: string;
    quantity: number;
    expectedCondition?: OmsReturnConditionType;
  }>;
  outboundItems?: Array<{
    variantId: string;
    quantity: number;
    warehouseId?: string;
  }>;
  rmaShippingFeeCustomerCharged?: number;
  refundNegativeDeltaToWallet?: boolean;
  reasonNote?: string;
}) => {
  const { shopId, ...body } = payload;
  return apiClient.post(`/oms/${shopId}/rma-exchanges`, body);
};

export const listCodBatchesApi = (shopId: string) =>
  apiClient.get(`/oms/${shopId}/reconciliation/batches`);

export const createCodBatchApi = (payload: {
  shopId: string;
  carrierCode: "GHN" | "GHTK" | "VTP" | "JT" | "OTHER";
  sourceFileName: string;
  weightToleranceGrams?: number;
  feeToleranceVnd?: number;
  rows: Array<{
    trackingNumber: string;
    orderCode?: string;
    actualCodAmount: number;
    actualShippingFee: number;
    returnFeeCharged?: number;
    carrierChargedWeightGrams?: number;
  }>;
  note?: string;
}) => {
  const { shopId, ...body } = payload;
  return apiClient.post(`/oms/${shopId}/reconciliation/batches`, body);
};

export const getCodBatchDetailApi = (
  shopId: string,
  batchId: string,
  discrepancyType?: CodReconciliationDiscrepancyType,
) =>
  apiClient.get(`/oms/${shopId}/reconciliation/batches/${batchId}`, {
    params: discrepancyType ? { discrepancyType } : undefined,
  });

export const confirmMatchedCodBatchApi = (payload: {
  shopId: string;
  batchId: string;
  itemIds?: string[];
  note?: string;
}) => {
  const { shopId, batchId, ...body } = payload;
  return apiClient.post(
    `/oms/${shopId}/reconciliation/batches/${batchId}/confirm-matched`,
    body,
  );
};

export const exportCodDisputesCsvApi = (shopId: string, batchId: string) =>
  apiClient.get(
    `/oms/${shopId}/reconciliation/batches/${batchId}/export-disputes`,
  );
