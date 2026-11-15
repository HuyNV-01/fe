import { createPersistedStore } from "../create-persisted-store";
import {
  listCatalogVariantsApi,
  createProductWithMatrixApi,
  createBundleBomVariantApi,
  recommendApparelSizeApi,
  reserveStockAtomicApi,
  releaseStockAtomicApi,
  adjustWarehouseStocktakeApi,
  listInventoryLedgersApi,
  listWarehouseTransfersApi,
  createWarehouseTransferApi,
  receiveWarehouseTransferApi,
  listProductSerialsApi,
  registerProductSerialsApi,
  scanBindSerialToOrderApi,
  listPosOrdersApi,
  checkMergeableDuplicateOrdersApi,
  previewOrderWarehouseRoutingApi,
  createPosOrderApi,
  mergeDuplicatePosOrdersApi,
  resolveDiscountApprovalApi,
  simulateVietQrPaymentWebhookApi,
} from "./api";
import { estimateMultiCarrierShippingFeeApi } from "../crm/api";
import type {
  IBundleBomComponent,
  IInventoryMovementLedger,
  IPosDraftCartItem,
  IPosOrder,
  IProductSerialItem,
  IProductVariant,
  IWarehouse,
  IWarehouseRoutingPreview,
  IWarehouseTransferOrder,
  InventoryMovementType,
  PosOrderPaymentMethodType,
  PosOrderStatusType,
  ProductSerialStatusType,
} from "@/types/catalog-pos";
import type { ICarrierShippingQuoteItem } from "@/types/crm";
import { toast } from "sonner";

interface CounterPosTabSession {
  tabId: string;
  tabLabel: string;
  customerName: string;
  customerPhone: string;
  items: IPosDraftCartItem[];
  discountPercent: number;
  paymentMethod: PosOrderPaymentMethodType;
  activeOrder: IPosOrder | null;
}

interface CatalogPosState {
  warehouses: IWarehouse[];
  variants: IProductVariant[];
  isLoadingCatalog: boolean;

  inventoryLedgers: IInventoryMovementLedger[];
  transferOrders: IWarehouseTransferOrder[];
  serialItems: IProductSerialItem[];

  posOrders: IPosOrder[];
  mergeableDuplicateOrdersByConv: Record<string, IPosOrder[]>;
  inChatDraftCartByConv: Record<string, IPosDraftCartItem[]>;
  shippingQuotesByConv: Record<string, ICarrierShippingQuoteItem[]>;
  routingPreviewByConv: Record<string, IWarehouseRoutingPreview | null>;
  activeCreatedOrderByConv: Record<string, IPosOrder | null>;
  sizeAdviceText: string | null;

  // Multi-tab Hold Carts cho Bán hàng tại quầy (/pos/counter — tối đa 10 hóa đơn đồng thời)
  counterTabs: CounterPosTabSession[];
  activeCounterTabId: string;

  fetchCatalogAndStock: (params: {
    shopId: string;
    search?: string;
    warehouseId?: string;
    bundleOnly?: boolean;
  }) => Promise<void>;
  createProductWithMatrix: (payload: {
    shopId: string;
    code: string;
    name: string;
    categoryName?: string;
    brandName?: string;
    colors?: string[];
    sizes?: string[];
    retailPrice?: number;
    wholesalePrice?: number;
    costPrice?: number;
    maxDiscountPercent?: number;
    weightGrams?: number;
    requiresSerialImei?: boolean;
    warrantyMonths?: number;
    initialOnHandQtyPerVariant?: number;
  }) => Promise<boolean>;
  createBundleBom: (payload: {
    shopId: string;
    skuCode: string;
    variantName: string;
    retailPrice: number;
    maxDiscountPercent?: number;
    components: IBundleBomComponent[];
  }) => Promise<boolean>;
  askSizeAdvisor: (payload: {
    shopId: string;
    productId?: string;
    heightCm: number;
    weightKg: number;
  }) => Promise<string | null>;
  adjustStocktake: (payload: {
    shopId: string;
    warehouseId: string;
    variantId: string;
    movementType: InventoryMovementType;
    deltaQty: number;
    deltaDefectiveHoldQty?: number;
    note: string;
  }) => Promise<boolean>;
  fetchInventoryLedgers: (
    shopId: string,
    warehouseId?: string,
    variantId?: string,
  ) => Promise<void>;
  fetchWarehouseTransfers: (shopId: string) => Promise<void>;
  createWarehouseTransfer: (payload: {
    shopId: string;
    fromWarehouseId: string;
    toWarehouseId: string;
    items: Array<{ variantId: string; requestedQty: number }>;
    note?: string;
  }) => Promise<boolean>;
  receiveWarehouseTransfer: (payload: {
    shopId: string;
    transferId: string;
    note?: string;
  }) => Promise<boolean>;
  fetchProductSerials: (params: {
    shopId: string;
    warehouseId?: string;
    variantId?: string;
    status?: ProductSerialStatusType;
    search?: string;
  }) => Promise<void>;
  registerProductSerials: (payload: {
    shopId: string;
    warehouseId: string;
    variantId: string;
    serialNumbers: string[];
    warrantyMonths?: number;
  }) => Promise<boolean>;
  scanBindSerialToOrder: (payload: {
    shopId: string;
    serialNumber: string;
    orderId: string;
    customerId?: string;
  }) => Promise<boolean>;

  // In-Chat POS Actions
  addOrIncrementInChatCartItem: (params: {
    shopId: string;
    conversationId: string;
    variant: IProductVariant;
    warehouseId?: string;
  }) => Promise<void>;
  updateInChatCartItemQuantity: (params: {
    conversationId: string;
    variantId: string;
    quantity: number;
  }) => void;
  clearInChatCart: (conversationId: string) => void;
  checkMergeableDuplicateOrders: (params: {
    shopId: string;
    customerId?: string | null;
    conversationId: string;
  }) => Promise<IPosOrder[]>;
  fetchShippingQuotesAndRoutingPreview: (params: {
    shopId: string;
    conversationId: string;
    receiverProvinceCode?: string | null;
    receiverDistrictCode?: string | null;
    receiverWardCode?: string | null;
    receiverHamletName?: string | null;
    preferredWarehouseId?: string | null;
  }) => Promise<void>;
  submitInChatPosOrder: (payload: {
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
    note?: string;
  }) => Promise<IPosOrder | null>;
  mergeIntoExistingOrderOneClick: (payload: {
    shopId: string;
    conversationId: string;
    targetPrimaryOrderId: string;
  }) => Promise<IPosOrder | null>;
  approveOrRejectOrderDiscount: (payload: {
    shopId: string;
    orderId: string;
    approved: boolean;
    managerNote?: string;
  }) => Promise<IPosOrder | null>;
  confirmVietQrPaymentReceived: (payload: {
    shopId: string;
    orderIdOrReference: string;
    paidAmountVnd: number;
  }) => Promise<IPosOrder | null>;
  fetchPosOrders: (params: {
    shopId: string;
    status?: PosOrderStatusType;
    conversationId?: string;
    customerId?: string;
    search?: string;
  }) => Promise<void>;

  // Counter POS Multi-Tab Actions
  addCounterTab: () => void;
  closeCounterTab: (tabId: string) => void;
  setActiveCounterTab: (tabId: string) => void;
  addVariantToCounterTab: (variant: IProductVariant) => void;
  updateCounterTabItemQty: (variantId: string, qty: number) => void;
  updateCounterTabMeta: (patch: Partial<CounterPosTabSession>) => void;
}

const DEFAULT_COUNTER_TAB: CounterPosTabSession = {
  tabId: "tab-1",
  tabLabel: "Hóa đơn #1",
  customerName: "Khách lẻ tại quầy",
  customerPhone: "",
  items: [],
  discountPercent: 0,
  paymentMethod: "COUNTER_VIETQR",
  activeOrder: null,
};

export const useCatalogPosStore = createPersistedStore<CatalogPosState>(
  (set, get) => ({
    warehouses: [],
    variants: [],
    isLoadingCatalog: false,
    inventoryLedgers: [],
    transferOrders: [],
    serialItems: [],
    posOrders: [],
    mergeableDuplicateOrdersByConv: {},
    inChatDraftCartByConv: {},
    shippingQuotesByConv: {},
    routingPreviewByConv: {},
    activeCreatedOrderByConv: {},
    sizeAdviceText: null,
    counterTabs: [DEFAULT_COUNTER_TAB],
    activeCounterTabId: "tab-1",

    fetchCatalogAndStock: async (params) => {
      if (!params.shopId) return;
      set({ isLoadingCatalog: true });
      try {
        const res: any = await listCatalogVariantsApi(params);
        const data = res?.data?.data ?? res?.data ?? {};
        set({
          warehouses: Array.isArray(data.warehouses) ? data.warehouses : [],
          variants: Array.isArray(data.variants) ? data.variants : [],
          isLoadingCatalog: false,
        });
      } catch {
        set({ isLoadingCatalog: false });
      }
    },

    createProductWithMatrix: async (payload) => {
      try {
        await createProductWithMatrixApi(payload);
        await get().fetchCatalogAndStock({ shopId: payload.shopId });
        toast.success(
          "Đã tạo sản phẩm và sinh ma trận biến thể SKU thành công!",
        );
        return true;
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Không thể tạo sản phẩm.");
        return false;
      }
    },

    createBundleBom: async (payload) => {
      try {
        await createBundleBomVariantApi(payload);
        await get().fetchCatalogAndStock({ shopId: payload.shopId });
        toast.success("Đã tạo sản phẩm Combo (Bundle BOM) thành công!");
        return true;
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Không thể tạo Combo BOM.");
        return false;
      }
    },

    askSizeAdvisor: async (payload) => {
      try {
        const res: any = await recommendApparelSizeApi(payload);
        const data = res?.data?.data ?? res?.data;
        const msg = data?.adviceMessage || null;
        set({ sizeAdviceText: msg });
        return msg;
      } catch {
        return null;
      }
    },

    adjustStocktake: async (payload) => {
      try {
        await adjustWarehouseStocktakeApi(payload);
        await get().fetchCatalogAndStock({ shopId: payload.shopId });
        await get().fetchInventoryLedgers(payload.shopId);
        toast.success("Đã cập nhật tồn kho và ghi Sổ cái Thẻ kho phân vùng!");
        return true;
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Lỗi điều chỉnh tồn kho.");
        return false;
      }
    },

    fetchInventoryLedgers: async (shopId, warehouseId, variantId) => {
      if (!shopId) return;
      try {
        const res: any = await listInventoryLedgersApi({
          shopId,
          warehouseId,
          variantId,
        });
        const items = res?.data?.data ?? res?.data ?? [];
        set({ inventoryLedgers: Array.isArray(items) ? items : [] });
      } catch {
        // Ignore
      }
    },

    fetchWarehouseTransfers: async (shopId) => {
      if (!shopId) return;
      try {
        const res: any = await listWarehouseTransfersApi(shopId);
        const items = res?.data?.data ?? res?.data ?? [];
        set({ transferOrders: Array.isArray(items) ? items : [] });
      } catch {
        // Ignore
      }
    },

    createWarehouseTransfer: async (payload) => {
      try {
        await createWarehouseTransferApi(payload);
        await Promise.all([
          get().fetchWarehouseTransfers(payload.shopId),
          get().fetchCatalogAndStock({ shopId: payload.shopId }),
          get().fetchInventoryLedgers(payload.shopId),
        ]);
        toast.success("Đã tạo phiếu xuất chuyển kho Bước 1 (TRANSFER_OUT)!");
        return true;
      } catch (err: any) {
        toast.error(
          err?.response?.data?.message || "Không thể tạo phiếu chuyển kho.",
        );
        return false;
      }
    },

    receiveWarehouseTransfer: async (payload) => {
      try {
        await receiveWarehouseTransferApi(payload);
        await Promise.all([
          get().fetchWarehouseTransfers(payload.shopId),
          get().fetchCatalogAndStock({ shopId: payload.shopId }),
          get().fetchInventoryLedgers(payload.shopId),
        ]);
        toast.success("Đã xác nhận nhận hàng chuyển kho Bước 2 (TRANSFER_IN)!");
        return true;
      } catch (err: any) {
        toast.error(
          err?.response?.data?.message || "Lỗi nhận hàng chuyển kho.",
        );
        return false;
      }
    },

    fetchProductSerials: async (params) => {
      if (!params.shopId) return;
      try {
        const res: any = await listProductSerialsApi(params);
        const items = res?.data?.data ?? res?.data ?? [];
        set({ serialItems: Array.isArray(items) ? items : [] });
      } catch {
        // Ignore
      }
    },

    registerProductSerials: async (payload) => {
      try {
        await registerProductSerialsApi(payload);
        await get().fetchProductSerials({ shopId: payload.shopId });
        toast.success("Đã đăng ký mã Serial / IMEI vào kho thành công!");
        return true;
      } catch {
        toast.error("Không thể đăng ký Serial / IMEI.");
        return false;
      }
    },

    scanBindSerialToOrder: async (payload) => {
      try {
        await scanBindSerialToOrderApi(payload);
        await get().fetchProductSerials({ shopId: payload.shopId });
        toast.success(
          `Đã gắn Serial [${payload.serialNumber}] và kích hoạt bảo hành điện tử!`,
        );
        return true;
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Mã Serial không hợp lệ.");
        return false;
      }
    },

    addOrIncrementInChatCartItem: async ({
      shopId,
      conversationId,
      variant,
      warehouseId,
    }) => {
      const targetWhId =
        warehouseId ||
        get().warehouses.find((w) => w.isDefault)?.id ||
        get().warehouses[0]?.id;

      if (targetWhId && shopId) {
        try {
          await reserveStockAtomicApi({
            shopId,
            draftCartId: `cart_${conversationId}`,
            warehouseId: targetWhId,
            variantId: variant.id,
            quantity: 1,
            conversationId,
          });
        } catch (err: any) {
          toast.error(
            err?.response?.data?.message ||
              `Sản phẩm ${variant.skuCode} đã hết tồn khả dụng!`,
          );
          return;
        }
      }

      set((state) => {
        const list = state.inChatDraftCartByConv[conversationId] || [];
        const existing = list.find((i) => i.variant.id === variant.id);
        if (existing) {
          existing.quantity += 1;
          existing.reservedInRedis = true;
        } else {
          list.push({
            variant,
            quantity: 1,
            discountPercent: 0,
            serialNumbers: [],
            reservedInRedis: true,
          });
        }
        state.inChatDraftCartByConv[conversationId] = [...list];
      });

      if (shopId) {
        await get().fetchCatalogAndStock({ shopId });
      }
    },

    updateInChatCartItemQuantity: ({ conversationId, variantId, quantity }) => {
      set((state) => {
        const list = state.inChatDraftCartByConv[conversationId] || [];
        if (quantity <= 0) {
          state.inChatDraftCartByConv[conversationId] = list.filter(
            (i) => i.variant.id !== variantId,
          );
        } else {
          const item = list.find((i) => i.variant.id === variantId);
          if (item) {
            item.quantity = quantity;
          }
          state.inChatDraftCartByConv[conversationId] = [...list];
        }
      });
    },

    clearInChatCart: (conversationId) => {
      set((state) => {
        state.inChatDraftCartByConv[conversationId] = [];
      });
    },

    checkMergeableDuplicateOrders: async ({
      shopId,
      customerId,
      conversationId,
    }) => {
      if (!shopId) return [];
      try {
        const res: any = await checkMergeableDuplicateOrdersApi({
          shopId,
          customerId: customerId || undefined,
          conversationId,
        });
        const list: IPosOrder[] = res?.data?.data ?? res?.data ?? [];
        set((state) => {
          state.mergeableDuplicateOrdersByConv[conversationId] = Array.isArray(
            list,
          )
            ? list
            : [];
        });
        return list;
      } catch {
        return [];
      }
    },

    fetchShippingQuotesAndRoutingPreview: async ({
      shopId,
      conversationId,
      receiverProvinceCode,
      receiverDistrictCode,
      receiverWardCode,
      receiverHamletName,
      preferredWarehouseId,
    }) => {
      if (!shopId) return;
      const cartItems = get().inChatDraftCartByConv[conversationId] || [];
      const totalWeightGrams = Math.max(
        250,
        cartItems.reduce(
          (sum, it) => sum + (it.variant.weightGrams || 300) * it.quantity,
          0,
        ),
      );
      const totalValue = cartItems.reduce(
        (sum, it) => sum + it.variant.retailPrice * it.quantity,
        0,
      );

      try {
        const [feeRes, routeRes]: any = await Promise.all([
          estimateMultiCarrierShippingFeeApi({
            shopId,
            receiverProvinceCode,
            receiverDistrictCode,
            receiverWardCode,
            receiverHamletName,
            weightGrams: totalWeightGrams,
            insuranceValue: totalValue || 350000,
          }),
          cartItems.length > 0
            ? previewOrderWarehouseRoutingApi({
                shopId,
                receiverProvinceCode,
                preferredWarehouseId,
                items: cartItems.map((c) => ({
                  variantId: c.variant.id,
                  quantity: c.quantity,
                })),
              })
            : Promise.resolve(null),
        ]);

        const feeData = feeRes?.data?.data ?? feeRes?.data;
        const routeData = routeRes?.data?.data ?? routeRes?.data ?? null;

        set((state) => {
          if (Array.isArray(feeData?.quotes)) {
            state.shippingQuotesByConv[conversationId] = feeData.quotes;
          }
          state.routingPreviewByConv[conversationId] = routeData;
        });
      } catch {
        // Ignore preview error
      }
    },

    submitInChatPosOrder: async (payload) => {
      try {
        const res: any = await createPosOrderApi(payload);
        const data = res?.data?.data ?? res?.data;
        const createdOrder: IPosOrder | null =
          data?.primaryOrder ?? data ?? null;
        if (createdOrder?.id) {
          set((state) => {
            state.posOrders.unshift(createdOrder);
            if (payload.conversationId) {
              state.activeCreatedOrderByConv[payload.conversationId] =
                createdOrder;
              state.inChatDraftCartByConv[payload.conversationId] = [];
            }
          });
          if (data?.requiresManagerDiscountApproval) {
            toast.warning(
              `Đơn ${createdOrder.orderCode} vượt trần chiết khấu (${data.allowedMaxDiscountPercent}%) — Đã gửi yêu cầu duyệt 1 chạm tới Quản lý!`,
            );
          } else {
            toast.success(
              `Đã tạo đơn hàng ${createdOrder.orderCode} kèm mã VietQR động chuẩn EMVCo!`,
            );
          }
          await get().fetchCatalogAndStock({ shopId: payload.shopId });
          return createdOrder;
        }
        return null;
      } catch (err: any) {
        toast.error(
          err?.response?.data?.message || "Không thể tạo đơn hàng POS.",
        );
        return null;
      }
    },

    mergeIntoExistingOrderOneClick: async ({
      shopId,
      conversationId,
      targetPrimaryOrderId,
    }) => {
      const cartItems = get().inChatDraftCartByConv[conversationId] || [];
      if (cartItems.length === 0) {
        toast.error(
          "Giỏ hàng đang trống, hãy chọn sản phẩm cần gộp vào đơn cũ!",
        );
        return null;
      }
      try {
        const res: any = await mergeDuplicatePosOrdersApi({
          shopId,
          targetPrimaryOrderId,
          additionalCartItems: cartItems.map((it) => ({
            variantId: it.variant.id,
            quantity: it.quantity,
            discountPercent: it.discountPercent,
          })),
        });
        const mergedOrder: IPosOrder = res?.data?.data ?? res?.data;
        if (mergedOrder?.id) {
          set((state) => {
            state.activeCreatedOrderByConv[conversationId] = mergedOrder;
            state.inChatDraftCartByConv[conversationId] = [];
            const idx = state.posOrders.findIndex(
              (o) => o.id === mergedOrder.id,
            );
            if (idx !== -1) state.posOrders[idx] = mergedOrder;
          });
          toast.success(
            `Đã gộp giỏ hàng vào đơn #${mergedOrder.orderCode} thành công — Tiết kiệm 1 lần phí vận chuyển!`,
          );
          await get().fetchCatalogAndStock({ shopId });
          return mergedOrder;
        }
        return null;
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Không thể gộp đơn hàng.");
        return null;
      }
    },

    approveOrRejectOrderDiscount: async ({
      shopId,
      orderId,
      approved,
      managerNote,
    }) => {
      try {
        const res: any = await resolveDiscountApprovalApi({
          shopId,
          orderId,
          approved,
          managerNote,
        });
        const updated: IPosOrder = res?.data?.data ?? res?.data;
        if (updated?.id) {
          set((state) => {
            const idx = state.posOrders.findIndex((o) => o.id === updated.id);
            if (idx !== -1) state.posOrders[idx] = updated;
            if (updated.conversationId) {
              state.activeCreatedOrderByConv[updated.conversationId] = updated;
            }
          });
          toast.success(
            approved
              ? `Đã phê duyệt giảm giá cho đơn ${updated.orderCode}!`
              : `Đã từ chối mức giảm giá vượt trần của đơn ${updated.orderCode}.`,
          );
          return updated;
        }
        return null;
      } catch (err: any) {
        toast.error(
          err?.response?.data?.message ||
            "Bạn không có quyền phê duyệt giảm giá vượt trần.",
        );
        return null;
      }
    },

    confirmVietQrPaymentReceived: async ({
      shopId,
      orderIdOrReference,
      paidAmountVnd,
    }) => {
      try {
        const res: any = await simulateVietQrPaymentWebhookApi({
          shopId,
          orderIdOrReference,
          paidAmountVnd,
        });
        const data = res?.data?.data ?? res?.data;
        const updated: IPosOrder = data?.order ?? data;
        if (updated?.id) {
          set((state) => {
            const idx = state.posOrders.findIndex((o) => o.id === updated.id);
            if (idx !== -1) state.posOrders[idx] = updated;
            if (updated.conversationId) {
              state.activeCreatedOrderByConv[updated.conversationId] = updated;
            }
          });
          toast.success(
            `💳 Ting ting! Đã nhận chuyển khoản VietQR ${paidAmountVnd.toLocaleString("vi-VN")}đ cho đơn ${updated.orderCode}!`,
          );
          return updated;
        }
        return null;
      } catch (err: any) {
        toast.error(
          err?.response?.data?.message || "Lỗi xác nhận thanh toán VietQR.",
        );
        return null;
      }
    },

    fetchPosOrders: async (params) => {
      if (!params.shopId) return;
      try {
        const res: any = await listPosOrdersApi(params);
        const list = res?.data?.data ?? res?.data ?? [];
        set({ posOrders: Array.isArray(list) ? list : [] });
      } catch {
        // Ignore
      }
    },

    // Counter POS Multi-Tab Actions (tối đa 10 hóa đơn chờ cùng lúc)
    addCounterTab: () => {
      set((state) => {
        if (state.counterTabs.length >= 10) {
          toast.warning("Tối đa 10 tab hóa đơn chờ tại quầy cùng lúc!");
          return;
        }
        const nextNum = state.counterTabs.length + 1;
        const newTabId = `tab-${Date.now().toString().slice(-4)}`;
        state.counterTabs.push({
          tabId: newTabId,
          tabLabel: `Hóa đơn #${nextNum}`,
          customerName: "Khách lẻ tại quầy",
          customerPhone: "",
          items: [],
          discountPercent: 0,
          paymentMethod: "COUNTER_VIETQR",
          activeOrder: null,
        });
        state.activeCounterTabId = newTabId;
      });
    },

    closeCounterTab: (tabId) => {
      set((state) => {
        if (state.counterTabs.length <= 1) {
          state.counterTabs = [{ ...DEFAULT_COUNTER_TAB, items: [] }];
          state.activeCounterTabId = DEFAULT_COUNTER_TAB.tabId;
          return;
        }
        const nextTabs = state.counterTabs.filter((t) => t.tabId !== tabId);
        state.counterTabs = nextTabs;
        if (state.activeCounterTabId === tabId) {
          state.activeCounterTabId = nextTabs[nextTabs.length - 1].tabId;
        }
      });
    },

    setActiveCounterTab: (tabId) => {
      set({ activeCounterTabId: tabId });
    },

    addVariantToCounterTab: (variant) => {
      set((state) => {
        const activeTab = state.counterTabs.find(
          (t) => t.tabId === state.activeCounterTabId,
        );
        if (!activeTab) return;
        const existing = activeTab.items.find(
          (i) => i.variant.id === variant.id,
        );
        if (existing) {
          existing.quantity += 1;
        } else {
          activeTab.items.push({
            variant,
            quantity: 1,
            discountPercent: 0,
            serialNumbers: [],
          });
        }
      });
    },

    updateCounterTabItemQty: (variantId, qty) => {
      set((state) => {
        const activeTab = state.counterTabs.find(
          (t) => t.tabId === state.activeCounterTabId,
        );
        if (!activeTab) return;
        if (qty <= 0) {
          activeTab.items = activeTab.items.filter(
            (i) => i.variant.id !== variantId,
          );
        } else {
          const item = activeTab.items.find((i) => i.variant.id === variantId);
          if (item) item.quantity = qty;
        }
      });
    },

    updateCounterTabMeta: (patch) => {
      set((state) => {
        const activeTab = state.counterTabs.find(
          (t) => t.tabId === state.activeCounterTabId,
        );
        if (!activeTab) return;
        Object.assign(activeTab, patch);
      });
    },
  }),
  "catalog-pos-sprint4-storage",
  {
    partialize: (state) =>
      ({
        counterTabs: state.counterTabs,
        activeCounterTabId: state.activeCounterTabId,
      }) as any,
  },
);
