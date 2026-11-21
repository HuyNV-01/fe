import type {
  IPosOrder,
  IPosOrderLineItem,
  PosOrderStatusType,
} from "./catalog-pos";

export type PosOrderType =
  | "STANDARD"
  | "COUNTER_POS"
  | "RMA_EXCHANGE"
  | "PARTIAL_DELIVERY"
  | "WARRANTY_REPLACEMENT";

export type OmsCarrierSlaBreachType =
  | "NONE"
  | "PICKUP_DELAYED"
  | "TRANSIT_STUCK"
  | "RESCUE_OVERDUE";

export type OmsCarrierRescueActionType =
  | "REDELIVER"
  | "UPDATE_RECEIVER"
  | "APPROVE_RETURN"
  | "ESCALATE_TICKET";

export type OmsReturnConditionType =
  | "GOOD_RESTOCK"
  | "DAMAGED_OR_SWAPPED"
  | "MISSING_ITEM";

export type OmsRmaType =
  | "EXCHANGE_2_WAY"
  | "PARTIAL_RETURN"
  | "WARRANTY_REPAIR";

export type OmsRmaStatusType =
  | "PENDING_DISPATCH"
  | "OUTBOUND_IN_TRANSIT"
  | "RETURN_AWAITING_INSPECTION"
  | "COMPLETED"
  | "CLAIM_DISPUTED"
  | "CANCELLED";

export type CodReconciliationBatchStatusType =
  | "DRAFT_PARSED"
  | "PARTIALLY_RECONCILED"
  | "COMPLETED";

export type CodReconciliationDiscrepancyType =
  | "MATCHED"
  | "COD_SHORTFALL"
  | "WEIGHT_OVERCHARGE"
  | "RETURN_FEE_ERROR"
  | "UNIDENTIFIED_TRACKING";

export type ThermalLabelFormatType =
  | "A7_74X105"
  | "A6_100X150"
  | "K80_80X80"
  | "K80_80X100"
  | "K58_58X80"
  | "LABEL_75X100"
  | "A5_148X210"
  | "A4_210X297";

export interface IThermalPrintTemplateOptions {
  hideProductNames?: boolean;
  hideItemPrices?: boolean;
  showCodAmount?: boolean;
  showOrderNote?: boolean;
  showWarehouseInfo?: boolean;
  showBarcodeSvg?: boolean;
  copies?: number;
}

export interface IOmsOrderLineItem extends IPosOrderLineItem {
  packedScannedQty?: number;
  requiresSerialImei?: boolean;
}

export interface IOmsOrder extends Omit<IPosOrder, "itemsJson"> {
  orderType?: PosOrderType;
  itemsJson: IOmsOrderLineItem[];
  actualPackedWeightGrams?: number | null;
  carrierChargedWeightGrams?: number | null;
  shippingFeeCarrierEstimated?: number;
  shippingFeeCarrierActual?: number | null;
  isTwoWayExchange?: boolean;
  printedCount: number;
  lastPrintedAt?: string | null;
  packedByUserId?: string | null;
  packedAt?: string | null;
  packingVideoUrl?: string | null;
  handedToCarrierAt?: string | null;
  deliveredAt?: string | null;
  deliveryFailCount: number;
  lastDeliveryFailReason?: string | null;
  shipperName?: string | null;
  shipperPhone?: string | null;
  rescueDeadlineAt?: string | null;
  lastCarrierEventAt?: string | null;
  slaBreachType: OmsCarrierSlaBreachType;
  carrierTicketCode?: string | null;
  reconciledBatchId?: string | null;
  reconciledAt?: string | null;
  orderTagsJson?: string[] | null;
  subStatus?: string | null;
  callLaterAt?: string | null;
  callAttemptCount?: number;
  lastCallNote?: string | null;
  handoverManifestId?: string | null;
  partialDeliveryInfoJson?: IPosOrderPartialDeliveryInfo | null;
}

export interface IOrderFieldDiffEntry {
  field: string;
  label: string;
  beforeValue: unknown;
  afterValue: unknown;
}

export interface IOrderRevisionHistory {
  id: string;
  shopId: string;
  orderId: string;
  orderCode: string;
  revisionNumber: number;
  changedByUserId: string;
  changedByName: string;
  actionType: string;
  reasonNote?: string | null;
  beforeSnapshotJson: Record<string, unknown>;
  afterSnapshotJson: Record<string, unknown>;
  diffSummaryJson: IOrderFieldDiffEntry[];
  createdAt: string;
}

export interface IOrderCarrierEvent {
  id: string;
  orderId: string;
  orderCode: string;
  carrierCode: string;
  trackingNumber: string;
  carrierRawStatus: string;
  mappedOmsStatus?: PosOrderStatusType | null;
  description: string;
  locationHubName?: string | null;
  shipperName?: string | null;
  shipperPhone?: string | null;
  eventSource: "WEBHOOK" | "MANUAL_RESCUE" | "SLA_WATCHDOG" | "SYSTEM";
  eventOccurredAt: string;
}

export interface IOmsOrderDetailResponse {
  order: IOmsOrder;
  revisions: IOrderRevisionHistory[];
  carrierEvents: IOrderCarrierEvent[];
  childOrders: IOmsOrder[];
  isLockedForStandardSale: boolean;
  allowedNextStatuses: PosOrderStatusType[];
}

export interface IPackingProgress {
  requiredUnits: number;
  scannedUnits: number;
  percent: number;
  isComplete: boolean;
}

export interface IThermalShippingLabelPayload {
  orderId: string;
  orderCode: string;
  trackingNumber: string;
  carrierCode: string;
  labelFormat: ThermalLabelFormatType;
  printedCount: number;
  isReprint: boolean;
  reprintWatermarkText: string | null;
  shopName: string;
  warehouseName: string;
  customerName: string;
  customerPhoneMasked: string;
  fullAddress: string;
  codCollectAmount: number;
  actualPackedWeightGrams: number;
  items: Array<{ skuCode: string; variantName: string; quantity: number }>;
  printedAtIso: string;
  htmlTemplate: string;
}

export interface IRmaReturnLineItem {
  variantId: string;
  skuCode: string;
  barcode: string;
  variantName: string;
  expectedQty: number;
  verifiedQty: number;
  unitPrice: number;
  condition: OmsReturnConditionType;
  serialNumbers?: string[];
  evidenceImageUrls?: string[];
  inspectionNote?: string | null;
}

export interface IRmaOutboundLineItem {
  variantId: string;
  skuCode: string;
  barcode: string;
  variantName: string;
  quantity: number;
  unitPrice: number;
  weightGrams: number;
  warehouseId: string;
}

export interface IOrderRmaExchange {
  id: string;
  shopId: string;
  rmaCode: string;
  rmaType: OmsRmaType;
  status: OmsRmaStatusType;
  originalOrderId: string;
  originalOrderCode: string;
  exchangeOrderId?: string | null;
  exchangeOrderCode?: string | null;
  customerId?: string | null;
  customerName: string;
  warehouseId: string;
  returnItemsJson: IRmaReturnLineItem[];
  outboundItemsJson: IRmaOutboundLineItem[];
  returnItemsTotalAmount: number;
  outboundItemsTotalAmount: number;
  rmaShippingFeeCustomerCharged: number;
  codDeltaAmount: number;
  refundToWalletCredit: boolean;
  reasonNote?: string | null;
  carrierClaimCode?: string | null;
  verifiedByUserId?: string | null;
  verifiedAt?: string | null;
  createdAt: string;
}

export interface ICodReconciliationBatch {
  id: string;
  shopId: string;
  batchCode: string;
  carrierCode: "GHN" | "GHTK" | "VTP" | "JT" | "OTHER";
  sourceFileName: string;
  totalOrdersCount: number;
  matchedOrdersCount: number;
  discrepancyOrdersCount: number;
  expectedCodTotal: number;
  actualCodTotal: number;
  expectedShippingFeeTotal: number;
  actualShippingFeeTotal: number;
  netSettlementAmount: number;
  status: CodReconciliationBatchStatusType;
  confirmedAt?: string | null;
  note?: string | null;
  createdAt: string;
}

export interface ICodReconciliationItem {
  id: string;
  batchId: string;
  orderId?: string | null;
  orderCode?: string | null;
  trackingNumber: string;
  discrepancyType: CodReconciliationDiscrepancyType;
  expectedCodAmount: number;
  actualCodAmount: number;
  codVarianceAmount: number;
  expectedShippingFee: number;
  actualShippingFee: number;
  shippingFeeVarianceAmount: number;
  actualPackedWeightGrams?: number | null;
  carrierChargedWeightGrams?: number | null;
  returnFeeCharged: number;
  isReconciled: boolean;
  disputeNote?: string | null;
}

export type CarrierHandoverManifestStatusType =
  | "DRAFT_SCANNING"
  | "SEALED_HANDED_OVER"
  | "CANCELLED";

export interface IHandoverManifestScannedOrderItem {
  orderId: string;
  orderCode: string;
  trackingNumber: string;
  customerName: string;
  codCollectAmount: number;
  actualPackedWeightGrams: number;
  scannedAtIso: string;
  scannedByUserId: string;
}

export interface ICarrierHandoverManifest {
  id: string;
  shopId: string;
  manifestCode: string;
  warehouseId: string;
  warehouseName: string;
  carrierCode: string;
  status: CarrierHandoverManifestStatusType;
  courierDriverName?: string | null;
  courierDriverPhone?: string | null;
  courierVehiclePlate?: string | null;
  scannedOrdersJson: IHandoverManifestScannedOrderItem[];
  totalParcelsCount: number;
  totalWeightGrams: number;
  totalCodAmount: number;
  sealedByUserId?: string | null;
  sealedAt?: string | null;
  note?: string | null;
  createdAt: string;
}

export interface IWavePicklistSkuLine {
  variantId: string;
  skuCode: string;
  barcode: string;
  variantName: string;
  imageUrl?: string | null;
  warehouseId: string;
  warehouseName: string;
  binLocationCode: string;
  totalPickQty: number;
  currentOnHandQty: number;
  currentAvailableQty: number;
  isShortageRisk: boolean;
  orderCodes: string[];
}

export interface IWavePicklistResult {
  picklistCode: string;
  generatedAtIso: string;
  totalOrdersCount: number;
  totalUniqueSkusCount: number;
  totalUnitsToPick: number;
  shortageSkuCount: number;
  orderIds: string[];
  items: IWavePicklistSkuLine[];
  printableHtmlTemplate: string;
}

export interface IPosOrderPartialDeliveryLineItem {
  variantId: string;
  skuCode: string;
  variantName: string;
  orderedQty: number;
  deliveredQty: number;
  returnedQty: number;
  unitPrice: number;
  restockedToWarehouse: boolean;
}

export interface IPosOrderPartialDeliveryInfo {
  settledAtIso: string;
  settledByUserId: string;
  originalCodAmount: number;
  revisedCodAmount: number;
  partialReturnShippingFee: number;
  items: IPosOrderPartialDeliveryLineItem[];
  note?: string | null;
}

export interface ICallLaterQueueResponse {
  totalCount: number;
  overdueCount: number;
  upcomingCount: number;
  orders: IOmsOrder[];
}
