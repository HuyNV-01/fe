import { createPersistedStore } from "../create-persisted-store";
import {
  completePackingAndPrintApi,
  confirmMatchedCodBatchApi,
  createCodBatchApi,
  createRmaExchangeApi,
  dispatchCarrierBatchApi,
  executeCarrierRescueActionApi,
  exportCodDisputesCsvApi,
  getCodBatchDetailApi,
  getOmsOrderDetailApi,
  listCodBatchesApi,
  listFailedRescueAndSlaApi,
  listOmsOrdersApi,
  listRmaExchangesApi,
  lookupPackingOrderApi,
  lookupReturningOrderApi,
  modifyConfirmedOrderApi,
  reprintShippingLabelApi,
  scanPackingBarcodeApi,
  transitionOmsOrderStatusApi,
  triggerSlaWatchdogScanApi,
  verifyReturnedOrderApi,
} from "./api";
import type { PosOrderStatusType } from "@/types/catalog-pos";
import type {
  CodReconciliationDiscrepancyType,
  ICodReconciliationBatch,
  ICodReconciliationItem,
  IOmsOrder,
  IOmsOrderDetailResponse,
  IOrderRmaExchange,
  IPackingProgress,
  IThermalShippingLabelPayload,
  OmsCarrierRescueActionType,
  OmsReturnConditionType,
  OmsRmaType,
  ThermalLabelFormatType,
} from "@/types/oms";
import {
  playBarcodeErrorBuzz,
  playBarcodeSuccessBeep,
  playPackingCompletedChime,
} from "@/utils/sound";
import { printThermalLabelHtml } from "@/utils/hooks/use-hardware-barcode-scanner";
import { toast } from "sonner";

export interface OmsFulfillmentState {
  orders: IOmsOrder[];
  statusCounts: Record<string, number>;
  totalOrders: number;
  isLoadingOrders: boolean;

  activeOrderDetail: IOmsOrderDetailResponse | null;
  isLoadingOrderDetail: boolean;

  packingOrder: IOmsOrder | null;
  packingProgress: IPackingProgress | null;
  lastScanAlert: { type: "success" | "danger"; message: string } | null;
  lastPrintedLabel: IThermalShippingLabelPayload | null;

  failedRescueOrders: IOmsOrder[];
  slaBreachedOrders: IOmsOrder[];
  totalCodAtRisk: number;

  returningOrder: IOmsOrder | null;
  rmaExchanges: IOrderRmaExchange[];

  codBatches: ICodReconciliationBatch[];
  activeCodBatch: ICodReconciliationBatch | null;
  activeCodBatchItems: ICodReconciliationItem[];

  isSubmitting: boolean;

  fetchOmsOrders: (params: {
    shopId: string;
    status?: PosOrderStatusType;
    search?: string;
    carrierCode?: string;
    page?: number;
    limit?: number;
  }) => Promise<void>;
  fetchOrderDetail: (shopId: string, orderId: string) => Promise<void>;
  transitionOrderStatus: (payload: {
    shopId: string;
    orderId: string;
    targetStatus: PosOrderStatusType;
    reasonNote?: string;
  }) => Promise<boolean>;
  modifyConfirmedOrder: (payload: {
    shopId: string;
    orderId: string;
    customerName?: string;
    receiverAddressLine?: string;
    codCollectAmount?: number;
    shippingFeeAmount?: number;
    note?: string;
    reasonNote: string;
  }) => Promise<boolean>;
  dispatchCarrierBatch: (payload: {
    shopId: string;
    orderIds: string[];
    overrideCarrierCode?: "GHN" | "GHTK" | "VTP" | "JT";
  }) => Promise<boolean>;

  lookupPackingOrder: (shopId: string, code: string) => Promise<void>;
  scanPackingBarcode: (payload: {
    shopId: string;
    orderId: string;
    scannedCode: string;
    serialNumber?: string;
  }) => Promise<void>;
  completePackingAndPrint: (payload: {
    shopId: string;
    orderId: string;
    actualPackedWeightGrams: number;
    lengthCm?: number;
    widthCm?: number;
    heightCm?: number;
    packingVideoUrl?: string;
    labelFormat: ThermalLabelFormatType;
  }) => Promise<boolean>;
  reprintShippingLabel: (payload: {
    shopId: string;
    orderId: string;
    labelFormat: ThermalLabelFormatType;
    reprintReason: string;
  }) => Promise<boolean>;

  fetchFailedRescueCenter: (shopId: string) => Promise<void>;
  executeRescueAction: (payload: {
    shopId: string;
    orderId: string;
    action: OmsCarrierRescueActionType;
    noteToCarrier?: string;
    preferredDeliverySlot?: string;
    updatedReceiverName?: string;
    updatedReceiverAddress?: string;
    updatedCodAmount?: number;
  }) => Promise<string | null>;
  triggerSlaWatchdogScan: (shopId: string) => Promise<void>;

  lookupReturningOrder: (shopId: string, code: string) => Promise<void>;
  verifyReturnedOrder: (payload: {
    shopId: string;
    orderId: string;
    items: Array<{
      variantId: string;
      verifiedQty: number;
      condition: OmsReturnConditionType;
      inspectionNote?: string;
    }>;
    createCarrierCompensationClaim?: boolean;
    overallNote?: string;
  }) => Promise<boolean>;

  fetchRmaExchanges: (shopId: string) => Promise<void>;
  createRmaExchange: (payload: {
    shopId: string;
    originalOrderId: string;
    rmaType: OmsRmaType;
    returnItems: Array<{ variantId: string; quantity: number }>;
    outboundItems?: Array<{ variantId: string; quantity: number }>;
    rmaShippingFeeCustomerCharged?: number;
    refundNegativeDeltaToWallet?: boolean;
    reasonNote?: string;
  }) => Promise<boolean>;

  fetchCodBatches: (shopId: string) => Promise<void>;
  createCodBatch: (payload: {
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
  }) => Promise<string | null>;
  fetchCodBatchDetail: (
    shopId: string,
    batchId: string,
    discrepancyType?: CodReconciliationDiscrepancyType,
  ) => Promise<void>;
  confirmMatchedCodBatch: (shopId: string, batchId: string) => Promise<boolean>;
  downloadCodDisputesCsv: (shopId: string, batchId: string) => Promise<void>;
}

/**
 * Tuân thủ đúng chữ ký `createPersistedStore<T>(storeCreator, persistName, options)` trong `fe/src/lib/stores/create-persisted-store.ts`.
 */
export const useOmsFulfillmentStore = createPersistedStore<OmsFulfillmentState>(
  (set, get) => ({
    orders: [],
    statusCounts: {},
    totalOrders: 0,
    isLoadingOrders: false,
    activeOrderDetail: null,
    isLoadingOrderDetail: false,
    packingOrder: null,
    packingProgress: null,
    lastScanAlert: null,
    lastPrintedLabel: null,
    failedRescueOrders: [],
    slaBreachedOrders: [],
    totalCodAtRisk: 0,
    returningOrder: null,
    rmaExchanges: [],
    codBatches: [],
    activeCodBatch: null,
    activeCodBatchItems: [],
    isSubmitting: false,

    fetchOmsOrders: async (params) => {
      set((s) => {
        s.isLoadingOrders = true;
      });
      try {
        const res = await listOmsOrdersApi(params);
        const data = res.data?.data;
        set((s) => {
          s.orders = data?.items || [];
          s.totalOrders = Number(data?.total || 0);
          s.statusCounts = data?.statusCounts || {};
        });
      } catch {
        toast.error("Không thể tải danh sách đơn hàng OMS");
      } finally {
        set((s) => {
          s.isLoadingOrders = false;
        });
      }
    },

    fetchOrderDetail: async (shopId, orderId) => {
      set((s) => {
        s.isLoadingOrderDetail = true;
      });
      try {
        const res = await getOmsOrderDetailApi(shopId, orderId);
        set((s) => {
          s.activeOrderDetail = res.data?.data || null;
        });
      } catch {
        toast.error("Không thể tải chi tiết đơn hàng");
      } finally {
        set((s) => {
          s.isLoadingOrderDetail = false;
        });
      }
    },

    transitionOrderStatus: async (payload) => {
      set((s) => {
        s.isSubmitting = true;
      });
      try {
        await transitionOmsOrderStatusApi(payload);
        toast.success("Đã cập nhật trạng thái đơn hàng");
        await get().fetchOrderDetail(payload.shopId, payload.orderId);
        return true;
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || "Chuyển trạng thái thất bại";
        toast.error(msg);
        return false;
      } finally {
        set((s) => {
          s.isSubmitting = false;
        });
      }
    },

    modifyConfirmedOrder: async (payload) => {
      set((s) => {
        s.isSubmitting = true;
      });
      try {
        await modifyConfirmedOrderApi(payload);
        toast.success("Đã lưu chỉnh sửa và ghi nhật ký Before <-> After");
        await get().fetchOrderDetail(payload.shopId, payload.orderId);
        return true;
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || "Không đủ quyền hoặc sửa đơn thất bại";
        toast.error(msg);
        return false;
      } finally {
        set((s) => {
          s.isSubmitting = false;
        });
      }
    },

    dispatchCarrierBatch: async (payload) => {
      set((s) => {
        s.isSubmitting = true;
      });
      try {
        const res = await dispatchCarrierBatchApi(payload);
        const data = res.data?.data;
        toast.success(
          `Đã đẩy ${data?.succeeded?.length || 0} đơn sang hãng vận chuyển (Lỗi: ${data?.failed?.length || 0})`,
        );
        await get().fetchOmsOrders({ shopId: payload.shopId });
        return true;
      } catch {
        toast.error("Đẩy vận đơn hàng loạt thất bại");
        return false;
      } finally {
        set((s) => {
          s.isSubmitting = false;
        });
      }
    },

    lookupPackingOrder: async (shopId, code) => {
      try {
        const res = await lookupPackingOrderApi(shopId, code);
        const data = res.data?.data;
        playBarcodeSuccessBeep();
        set((s) => {
          s.packingOrder = data?.order || null;
          s.packingProgress = data?.progress || null;
          s.lastScanAlert = {
            type: "success",
            message: `Đã nạp đơn ${data?.order?.orderCode} lên bàn đóng gói`,
          };
        });
      } catch (err: unknown) {
        playBarcodeErrorBuzz();
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || "Không tìm thấy đơn hàng cần đóng gói";
        set((s) => {
          s.lastScanAlert = { type: "danger", message: msg };
        });
      }
    },

    scanPackingBarcode: async (payload) => {
      try {
        const res = await scanPackingBarcodeApi(payload);
        const data = res.data?.data;
        if (data?.matched) {
          if (data?.progress?.isComplete) {
            playPackingCompletedChime();
          } else {
            playBarcodeSuccessBeep();
          }
          set((s) => {
            s.packingOrder = data.order;
            s.packingProgress = data.progress;
            s.lastScanAlert = { type: "success", message: data.message };
          });
        } else {
          playBarcodeErrorBuzz();
          set((s) => {
            s.lastScanAlert = {
              type: "danger",
              message: data?.message || "Cảnh báo nhặt sai sản phẩm!",
            };
          });
        }
      } catch (err: unknown) {
        playBarcodeErrorBuzz();
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || "Lỗi quét mã vạch sản phẩm";
        set((s) => {
          s.lastScanAlert = { type: "danger", message: msg };
        });
      }
    },

    completePackingAndPrint: async (payload) => {
      set((s) => {
        s.isSubmitting = true;
      });
      try {
        const res = await completePackingAndPrintApi(payload);
        const data = res.data?.data;
        playPackingCompletedChime();
        if (data?.labelPayload?.htmlTemplate) {
          printThermalLabelHtml(data.labelPayload.htmlTemplate);
        }
        set((s) => {
          s.packingOrder = data?.order || null;
          s.lastPrintedLabel = data?.labelPayload || null;
          s.lastScanAlert = {
            type: "success",
            message: `Hoàn tất đóng gói & đã nhả lệnh in phiếu lần ${data?.order?.printedCount || 1}`,
          };
        });
        toast.success("Đã chốt đóng gói & gửi lệnh in phiếu nhiệt!");
        return true;
      } catch (err: unknown) {
        playBarcodeErrorBuzz();
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || "Chưa thể hoàn tất đóng gói";
        toast.error(msg);
        return false;
      } finally {
        set((s) => {
          s.isSubmitting = false;
        });
      }
    },

    reprintShippingLabel: async (payload) => {
      set((s) => {
        s.isSubmitting = true;
      });
      try {
        const res = await reprintShippingLabelApi(payload);
        const data = res.data?.data;
        if (data?.labelPayload?.htmlTemplate) {
          printThermalLabelHtml(data.labelPayload.htmlTemplate);
        }
        toast.success(
          `Đã in lại phiếu (${data?.labelPayload?.reprintWatermarkText || "Bản in lại"})`,
        );
        return true;
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ||
          "Không đủ quyền OMS_SHIPPING_LABEL_REPRINT để in lại phiếu";
        toast.error(msg);
        return false;
      } finally {
        set((s) => {
          s.isSubmitting = false;
        });
      }
    },

    fetchFailedRescueCenter: async (shopId) => {
      try {
        const res = await listFailedRescueAndSlaApi(shopId);
        const data = res.data?.data;
        set((s) => {
          s.failedRescueOrders = data?.failedRescueOrders || [];
          s.slaBreachedOrders = data?.slaBreachedOrders || [];
          s.totalCodAtRisk = Number(data?.summary?.totalCodAtRisk || 0);
        });
      } catch {
        toast.error("Không thể tải danh sách cứu đơn giao thất bại");
      }
    },

    executeRescueAction: async (payload) => {
      set((s) => {
        s.isSubmitting = true;
      });
      try {
        const res = await executeCarrierRescueActionApi(payload);
        const data = res.data?.data;
        toast.success(
          `Đã gửi lệnh tới 3PL (Mã phiếu: ${data?.carrierTicketCode})`,
        );
        await get().fetchFailedRescueCenter(payload.shopId);
        return data?.suggestedCustomerRescueMessage || null;
      } catch {
        toast.error("Thực thi lệnh cứu đơn thất bại");
        return null;
      } finally {
        set((s) => {
          s.isSubmitting = false;
        });
      }
    },

    triggerSlaWatchdogScan: async (shopId) => {
      try {
        const res = await triggerSlaWatchdogScanApi(shopId);
        const data = res.data?.data;
        toast.info(
          `Watchdog SLA: phát hiện ${data?.pickupDelayedCount || 0} đơn chậm lấy, ${data?.transitStuckCount || 0} đơn ngâm trung chuyển`,
        );
        await get().fetchFailedRescueCenter(shopId);
      } catch {
        toast.error("Không thể chạy quét SLA");
      }
    },

    lookupReturningOrder: async (shopId, code) => {
      try {
        const res = await lookupReturningOrderApi(shopId, code);
        playBarcodeSuccessBeep();
        set((s) => {
          s.returningOrder = res.data?.data || null;
        });
      } catch (err: unknown) {
        playBarcodeErrorBuzz();
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || "Không tìm thấy đơn hoàn cần đồng kiểm";
        toast.error(msg);
      }
    },

    verifyReturnedOrder: async (payload) => {
      set((s) => {
        s.isSubmitting = true;
      });
      try {
        const res = await verifyReturnedOrderApi(payload);
        const summary = res.data?.data?.summary;
        playPackingCompletedChime();
        toast.success(
          `Đã đồng kiểm hoàn: +${summary?.totalRestockedUnits || 0} SP nhập kho bán, ${summary?.totalDefectiveUnits || 0} SP kho lỗi`,
        );
        set((s) => {
          s.returningOrder = null;
        });
        return true;
      } catch {
        toast.error("Xác nhận đồng kiểm hàng hoàn thất bại");
        return false;
      } finally {
        set((s) => {
          s.isSubmitting = false;
        });
      }
    },

    fetchRmaExchanges: async (shopId) => {
      try {
        const res = await listRmaExchangesApi(shopId);
        set((s) => {
          s.rmaExchanges = res.data?.data || [];
        });
      } catch {
        toast.error("Không thể tải danh sách đơn đổi trả 2 chiều RMA");
      }
    },

    createRmaExchange: async (payload) => {
      set((s) => {
        s.isSubmitting = true;
      });
      try {
        const res = await createRmaExchangeApi(payload);
        const rma = res.data?.data?.rma;
        toast.success(`Đã tạo phiếu đổi trả 2 chiều ${rma?.rmaCode}`);
        await get().fetchRmaExchanges(payload.shopId);
        return true;
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || "Tạo đơn đổi hàng 2 chiều thất bại";
        toast.error(msg);
        return false;
      } finally {
        set((s) => {
          s.isSubmitting = false;
        });
      }
    },

    fetchCodBatches: async (shopId) => {
      try {
        const res = await listCodBatchesApi(shopId);
        set((s) => {
          s.codBatches = res.data?.data || [];
        });
      } catch {
        toast.error("Không thể tải danh sách phiên đối soát COD");
      }
    },

    createCodBatch: async (payload) => {
      set((s) => {
        s.isSubmitting = true;
      });
      try {
        const res = await createCodBatchApi(payload);
        const batch = res.data?.data?.batch;
        toast.success(
          `Đã phân tích ${batch?.totalOrdersCount || 0} vận đơn (Khớp: ${batch?.matchedOrdersCount || 0}, Lệch: ${batch?.discrepancyOrdersCount || 0})`,
        );
        await get().fetchCodBatches(payload.shopId);
        if (batch?.id) {
          await get().fetchCodBatchDetail(payload.shopId, batch.id);
          return batch.id;
        }
        return null;
      } catch {
        toast.error("Phân tích file đối soát COD thất bại");
        return null;
      } finally {
        set((s) => {
          s.isSubmitting = false;
        });
      }
    },

    fetchCodBatchDetail: async (shopId, batchId, discrepancyType) => {
      try {
        const res = await getCodBatchDetailApi(
          shopId,
          batchId,
          discrepancyType,
        );
        const data = res.data?.data;
        set((s) => {
          s.activeCodBatch = data?.batch || null;
          s.activeCodBatchItems = data?.items || [];
        });
      } catch {
        toast.error("Không thể tải chi tiết phiên đối soát");
      }
    },

    confirmMatchedCodBatch: async (shopId, batchId) => {
      set((s) => {
        s.isSubmitting = true;
      });
      try {
        const res = await confirmMatchedCodBatchApi({ shopId, batchId });
        const data = res.data?.data;
        toast.success(
          `Đã tất toán ${data?.settledOrdersCount || 0} đơn khớp -> DELIVERED_RECONCILED`,
        );
        await get().fetchCodBatches(shopId);
        await get().fetchCodBatchDetail(shopId, batchId);
        return true;
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || "Xác nhận đối soát thất bại";
        toast.error(msg);
        return false;
      } finally {
        set((s) => {
          s.isSubmitting = false;
        });
      }
    },

    downloadCodDisputesCsv: async (shopId, batchId) => {
      try {
        const res = await exportCodDisputesCsvApi(shopId, batchId);
        const data = res.data?.data;
        if (!data?.csvContent) return;
        const blob = new Blob([data.csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = data.fileName || "bien-ban-khieu-nai-cod.csv";
        anchor.click();
        URL.revokeObjectURL(url);
        toast.success(
          `Đã xuất biên bản khiếu nại (${data.discrepancyCount} đơn lệch)`,
        );
      } catch {
        toast.error("Không thể xuất biên bản khiếu nại CSV");
      }
    },
  }),
  "oms-fulfillment-storage",
  {
    partialize: () =>
      ({}) as OmsFulfillmentState & {
        _hasHydrated: boolean;
        setHasHydrated: (s: boolean) => void;
      },
  },
);
