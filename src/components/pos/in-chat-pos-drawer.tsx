/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ContentSelect,
  GlassAlert,
  GlassBadge,
  GlassEmptyState,
  GlassSurfaceCard,
  GlassTabs,
  ItemSelect,
  LiquidGlassConfigProvider,
  LiquidGlassInput,
  PatternButton,
  ScrollArea,
  Switch,
  TriggerSelect,
  useGlassNestingLevel,
  useLiquidGlassConfig,
} from "@/components/toolkit";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectValue } from "@/components/ui/select";
import { ProvinceDistrictWardCombobox } from "@/components/crm/province-district-ward-combobox";
import { useCatalogPosStore } from "@/lib/stores/catalog-pos/use-catalog-pos-store";
import { useCrmStore } from "@/lib/stores/crm/use-crm-store";
import type {
  PosOrderPaymentMethodType,
  ProductIndustryType,
} from "@/types/catalog-pos";
import type { ICustomerProfile, IExtractedCommerceEntities } from "@/types/crm";
import {
  AlertTriangle,
  Barcode,
  Boxes,
  CheckCircle2,
  Coins,
  GitMerge,
  Minus,
  Package,
  Plus,
  QrCode,
  Ruler,
  Search,
  Send,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  Split,
  Trash2,
  Truck,
  Wallet,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

export interface InChatPosDrawerProps {
  shopId: string;
  conversationId: string;
  customerProfile?: ICustomerProfile | null;
  fallbackCustomerName?: string;
  latestExtractedNer?: IExtractedCommerceEntities | null;
  onSendInvoiceCardToChat?: (markdownCardText: string) => Promise<void>;
}

export function InChatPosDrawer({
  shopId,
  conversationId,
  customerProfile,
  fallbackCustomerName,
  latestExtractedNer,
  onSendInvoiceCardToChat,
}: InChatPosDrawerProps) {
  const themeConfig = useLiquidGlassConfig();
  const nestingLevel = useGlassNestingLevel();

  const posGlassConfig = useMemo(
    () => ({
      ...themeConfig,
      maxBackdropNestingDepth: Math.max(
        themeConfig.maxBackdropNestingDepth,
        nestingLevel + 5,
        8,
      ),
    }),
    [themeConfig, nestingLevel],
  );

  const administrativeTree = useCrmStore((s) => s.administrativeTree);

  const {
    warehouses,
    variants,
    inChatDraftCartByConv,
    mergeableDuplicateOrdersByConv,
    shippingQuotesByConv,
    routingPreviewByConv,
    activeCreatedOrderByConv,
    sizeAdviceText,
    fetchCatalogAndStock,
    addOrIncrementInChatCartItem,
    updateInChatCartItemQuantity,
    clearInChatCart,
    checkMergeableDuplicateOrders,
    fetchShippingQuotesAndRoutingPreview,
    submitInChatPosOrder,
    mergeIntoExistingOrderOneClick,
    approveOrRejectOrderDiscount,
    confirmVietQrPaymentReceived,
    askSizeAdvisor,
  } = useCatalogPosStore();

  const [activeTab, setActiveTab] = useState<"CART" | "VIETQR" | "ORDERS">(
    "CART",
  );
  const [searchSkuQuery, setSearchSkuQuery] = useState("");
  const [selectedWarehouseId, setSelectedWarehouseId] =
    useState<string>("AUTO");
  const [filterIndustry, setFilterIndustry] = useState<
    "ALL" | ProductIndustryType
  >("ALL");

  // Thông tin người nhận & Địa chỉ 3 cấp / 4 cấp
  const [customerName, setCustomerName] = useState(
    customerProfile?.fullName || fallbackCustomerName || "Khách hàng",
  );
  const [rawPhoneInput, setRawPhoneInput] = useState("");
  const [provinceCode, setProvinceCode] = useState<string | null>(
    customerProfile?.defaultProvinceCode ||
      latestExtractedNer?.provinceCode ||
      "01",
  );
  const [districtCode, setDistrictCode] = useState<string | null>(
    customerProfile?.defaultDistrictCode ||
      latestExtractedNer?.districtCode ||
      null,
  );
  const [wardCode, setWardCode] = useState<string | null>(
    customerProfile?.defaultWardCode || latestExtractedNer?.wardCode || null,
  );
  const [hamletCode, setHamletCode] = useState<string | null>(
    customerProfile?.defaultHamletCode ||
      latestExtractedNer?.hamletCode ||
      null,
  );
  const [hamletName, setHamletName] = useState<string | null>(
    customerProfile?.defaultHamletName ||
      latestExtractedNer?.hamletName ||
      null,
  );
  const [addressLine, setAddressLine] = useState<string>(
    customerProfile?.defaultAddressLine ||
      latestExtractedNer?.addressLine ||
      "",
  );

  // Tư vấn thông số / kích cỡ đa ngành hàng (Thời trang, Mẹ & Bé, Mỹ phẩm, Điện tử/F&B)
  const [advisorMode, setAdvisorMode] =
    useState<ProductIndustryType>("FASHION_APPAREL");
  const [advisorHeightCm, setAdvisorHeightCm] = useState<number>(
    customerProfile?.heightCm || latestExtractedNer?.heightCm || 160,
  );
  const [advisorWeightKg, setAdvisorWeightKg] = useState<number>(
    customerProfile?.weightKg || latestExtractedNer?.weightKg || 52,
  );
  const [advisorBabyMonths, setAdvisorBabyMonths] = useState<number>(8);
  const [advisorSkinType, setAdvisorSkinType] = useState<string>("COMBINATION");
  const [advisorUsageNeed, setAdvisorUsageNeed] = useState<string>(
    "Gia đình 4 người / Sử dụng hàng ngày",
  );

  // Vận chuyển, giảm giá & thanh toán
  const [selectedCarrierCode, setSelectedCarrierCode] = useState<
    "GHN" | "GHTK" | "VTP" | "JT"
  >("GHN");
  const [isFreeShipping, setIsFreeShipping] = useState(false);
  const [orderDiscountPercent, setOrderDiscountPercent] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState("");
  const [redeemLoyaltyPoints, setRedeemLoyaltyPoints] = useState<number>(0);
  const [applyWalletCredit, setApplyWalletCredit] = useState<boolean>(false);
  const [allowMultiWarehouseSplit, setAllowMultiWarehouseSplit] =
    useState<boolean>(true);
  const [paymentMethod, setPaymentMethod] =
    useState<PosOrderPaymentMethodType>("COD");
  const [orderNote, setOrderNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cartItems = inChatDraftCartByConv[conversationId] || [];
  const mergeableOrders = mergeableDuplicateOrdersByConv[conversationId] || [];
  const shippingQuotes = shippingQuotesByConv[conversationId] || [];
  const routingPreview = routingPreviewByConv[conversationId] || null;
  const activeCreatedOrder = activeCreatedOrderByConv[conversationId] || null;

  useEffect(() => {
    if (!shopId) return;
    void fetchCatalogAndStock({ shopId });
    void checkMergeableDuplicateOrders({
      shopId,
      customerId: customerProfile?.id,
      conversationId,
    });
  }, [
    shopId,
    conversationId,
    customerProfile?.id,
    fetchCatalogAndStock,
    checkMergeableDuplicateOrders,
  ]);

  // Tự động cập nhật báo giá phí vận chuyển 4 hãng & định tuyến kho khi thay đổi địa chỉ hoặc giỏ hàng
  useEffect(() => {
    if (!shopId) return;
    void fetchShippingQuotesAndRoutingPreview({
      shopId,
      conversationId,
      receiverProvinceCode: provinceCode,
      receiverDistrictCode: districtCode,
      receiverWardCode: wardCode,
      receiverHamletName: hamletName,
      preferredWarehouseId:
        selectedWarehouseId === "AUTO" ? null : selectedWarehouseId,
    });
  }, [
    shopId,
    conversationId,
    provinceCode,
    districtCode,
    wardCode,
    hamletName,
    selectedWarehouseId,
    cartItems.length,
    fetchShippingQuotesAndRoutingPreview,
  ]);

  const filteredCatalogVariants = useMemo(() => {
    const q = searchSkuQuery.trim().toLowerCase();
    return variants
      .filter((v) => {
        if (filterIndustry !== "ALL" && v.industryType !== filterIndustry) {
          return false;
        }
        if (!q) return true;
        return (
          v.skuCode.toLowerCase().includes(q) ||
          v.barcode.toLowerCase().includes(q) ||
          v.variantName.toLowerCase().includes(q) ||
          (v.categoryName || "").toLowerCase().includes(q) ||
          (v.batchCode || "").toLowerCase().includes(q)
        );
      })
      .slice(0, 12);
  }, [variants, searchSkuQuery, filterIndustry]);

  // Tự động điền SĐT, Địa chỉ 3 cấp / 4 cấp và sản phẩm SKU từ tin nhắn NER (F04.1 -> F06.1)
  const handleFillFromExtractedNer = async () => {
    if (!latestExtractedNer) {
      toast.info("Chưa có thông tin NER mới trong tin nhắn gần nhất.");
      return;
    }
    if (latestExtractedNer.provinceCode) {
      setProvinceCode(latestExtractedNer.provinceCode);
    }
    if (latestExtractedNer.districtCode) {
      setDistrictCode(latestExtractedNer.districtCode);
    }
    if (latestExtractedNer.wardCode) {
      setWardCode(latestExtractedNer.wardCode);
    }
    if (latestExtractedNer.hamletCode) {
      setHamletCode(latestExtractedNer.hamletCode);
    }
    if (latestExtractedNer.hamletName) {
      setHamletName(latestExtractedNer.hamletName);
    }
    if (latestExtractedNer.addressLine) {
      setAddressLine(latestExtractedNer.addressLine);
    }
    if (latestExtractedNer.heightCm) {
      setAdvisorHeightCm(latestExtractedNer.heightCm);
    }
    if (latestExtractedNer.weightKg) {
      setAdvisorWeightKg(latestExtractedNer.weightKg);
    }
    if (latestExtractedNer.deliveryTimeNote) {
      setOrderNote(latestExtractedNer.deliveryTimeNote);
    }

    if (
      Array.isArray(latestExtractedNer.skuCodes) &&
      latestExtractedNer.skuCodes.length > 0
    ) {
      for (const skuToken of latestExtractedNer.skuCodes) {
        const matchedVar = variants.find((v) =>
          v.skuCode.toUpperCase().includes(skuToken.toUpperCase()),
        );
        if (matchedVar) {
          await addOrIncrementInChatCartItem({
            shopId,
            conversationId,
            variant: matchedVar,
          });
        }
      }
    }
    toast.success(
      "Đã tự động điền Địa chỉ 3 cấp/4 cấp & Sản phẩm từ động cơ NER!",
    );
  };

  // Tính toán tổng tiền giỏ hàng thời gian thực
  const financialSummary = useMemo(() => {
    const subtotal = cartItems.reduce(
      (sum, it) => sum + it.variant.retailPrice * it.quantity,
      0,
    );
    const totalWeightGrams = cartItems.reduce(
      (sum, it) =>
        sum +
        (it.variant.chargeableWeightGrams || it.variant.weightGrams || 300) *
          it.quantity,
      0,
    );
    const minVariantMaxDiscount =
      cartItems.length > 0
        ? Math.min(
            ...cartItems.map((it) =>
              Number(it.variant.maxDiscountPercent || 15),
            ),
          )
        : 15;

    const discountAmount = Math.round(
      (subtotal * Math.max(0, Math.min(100, orderDiscountPercent))) / 100,
    );

    const activeQuote =
      shippingQuotes.find((q) => q.carrierCode === selectedCarrierCode) ||
      shippingQuotes[0];
    const shippingFee = activeQuote ? activeQuote.totalFeeVnd : 25000;
    const customerShippingCharge = isFreeShipping ? 0 : shippingFee;

    const maxPointsAvailable = Number(
      customerProfile?.loyaltyPointsBalance || 0,
    );
    const effectivePoints = Math.min(
      maxPointsAvailable,
      Math.max(0, redeemLoyaltyPoints),
    );
    const pointsDiscountVnd = effectivePoints * 1000;

    const availableWalletCredit = Number(
      customerProfile?.walletCreditBalance || 0,
    );
    const walletCreditUsed = applyWalletCredit
      ? Math.min(
          availableWalletCredit,
          Math.max(
            0,
            subtotal -
              discountAmount +
              customerShippingCharge -
              pointsDiscountVnd,
          ),
        )
      : 0;

    const totalPayable = Math.max(
      0,
      subtotal -
        discountAmount +
        customerShippingCharge -
        pointsDiscountVnd -
        walletCreditUsed,
    );

    const isHighRiskBuyer = Boolean(
      customerProfile?.trustEvaluation?.requireDepositVietQr ||
        customerProfile?.trustEvaluation?.band === "HIGH_RISK_RED",
    );

    const depositRequired = isHighRiskBuyer
      ? Math.max(50000, Math.round(totalPayable * 0.3))
      : 0;

    return {
      subtotal,
      totalWeightGrams,
      minVariantMaxDiscount,
      exceedsDiscountCeiling: orderDiscountPercent > minVariantMaxDiscount,
      discountAmount,
      shippingFee,
      customerShippingCharge,
      effectivePoints,
      pointsDiscountVnd,
      walletCreditUsed,
      totalPayable,
      isHighRiskBuyer,
      depositRequired,
    };
  }, [
    cartItems,
    orderDiscountPercent,
    shippingQuotes,
    selectedCarrierCode,
    isFreeShipping,
    customerProfile,
    redeemLoyaltyPoints,
    applyWalletCredit,
  ]);

  const handleCreatePosOrder = async () => {
    if (cartItems.length === 0) {
      toast.error("Vui lòng thêm ít nhất 1 sản phẩm vào giỏ hàng POS!");
      return;
    }
    setIsSubmitting(true);
    try {
      const created = await submitInChatPosOrder({
        shopId,
        conversationId,
        customerId: customerProfile?.id,
        customerName: customerName.trim() || "Khách hàng",
        rawPhone: rawPhoneInput.trim() || undefined,
        preferredWarehouseId:
          selectedWarehouseId === "AUTO" ? undefined : selectedWarehouseId,
        addressTierMode: "3_TIER",
        receiverProvinceCode: provinceCode,
        receiverDistrictCode: districtCode,
        receiverWardCode: wardCode,
        receiverHamletCode: hamletCode,
        receiverHamletName: hamletName,
        receiverAddressLine: addressLine,
        items: cartItems.map((c) => ({
          variantId: c.variant.id,
          quantity: c.quantity,
          discountPercent: orderDiscountPercent,
          serialNumbers: c.serialNumbers,
        })),
        carrierCode: selectedCarrierCode,
        shippingFeeAmount: financialSummary.shippingFee,
        isFreeShippingForCustomer: isFreeShipping,
        orderDiscountPercent,
        discountApprovalReason: discountReason || undefined,
        loyaltyPointsRedeemed: financialSummary.effectivePoints,
        walletCreditAppliedAmount: financialSummary.walletCreditUsed,
        paymentMethod: financialSummary.isHighRiskBuyer
          ? "DEPOSIT_AND_COD"
          : paymentMethod,
        allowMultiWarehouseSplit,
        note: orderNote || undefined,
      });

      if (created) {
        setActiveTab("VIETQR");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LiquidGlassConfigProvider config={posGlassConfig}>
      <div className="space-y-3 text-xs">
        <GlassTabs
          fullWidth
          size="sm"
          value={activeTab}
          onValueChange={(v) => setActiveTab(v)}
          items={[
            {
              key: "CART",
              label: "Giỏ hàng POS",
              icon: <ShoppingBag className="w-3.5 h-3.5" />,
              badge: cartItems.reduce((s, i) => s + i.quantity, 0),
            },
            {
              key: "VIETQR",
              label: "VietQR EMVCo",
              icon: <QrCode className="w-3.5 h-3.5" />,
              badge: activeCreatedOrder ? "1" : undefined,
            },
            {
              key: "ORDERS",
              label: "Gộp / Duyệt",
              icon: <GitMerge className="w-3.5 h-3.5" />,
              badge: mergeableOrders.length,
            },
          ]}
        />

        {/* 1. Thanh Cảnh báo Phát hiện Đơn Trùng Chưa Gửi & Gộp Đơn 1 Chạm (F06.5) */}
        {mergeableOrders.length > 0 && (
          <GlassAlert
            variant="info"
            icon={<GitMerge className="w-4 h-4 text-sky-500 shrink-0" />}
            title={`Phát hiện đơn #${mergeableOrders[0].orderCode} chưa xuất kho!`}
            description={`Khách ${mergeableOrders[0].customerName} đang có đơn #${mergeableOrders[0].orderCode} (${Number(mergeableOrders[0].totalPayableAmount).toLocaleString("vi-VN")}đ) ở trạng thái ${mergeableOrders[0].status}. Gộp chung thành 1 kiện hàng để tiết kiệm phí vận chuyển?`}
            action={
              <PatternButton
                type="button"
                size="sm"
                rounded="full"
                variant="solid"
                color="primary"
                className="h-7 px-3 text-[11px]"
                icon={<GitMerge className="w-3 h-3" />}
                onClick={() =>
                  mergeIntoExistingOrderOneClick({
                    shopId,
                    conversationId,
                    targetPrimaryOrderId: mergeableOrders[0].id,
                  })
                }
              >
                Gộp ngay vào đơn #{mergeableOrders[0].orderCode}
              </PatternButton>
            }
          />
        )}

        {/* 2. Cảnh báo Đỏ Khách Có Rủi Ro Bom Hàng Cao -> Bắt buộc thu cọc VietQR (F04.3 & F06.4) */}
        {financialSummary.isHighRiskBuyer && (
          <GlassAlert
            variant="danger"
            icon={<ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />}
            title="Cảnh báo Bom hàng Cao — Tự động bật yêu cầu Đặt cọc VietQR!"
            description={`Điểm uy tín nhận hàng của khách đạt ${customerProfile?.deliveryTrustScore ?? 35}/100. Hệ thống tự động yêu cầu thu cọc trước tối thiểu ${financialSummary.depositRequired.toLocaleString("vi-VN")}đ qua VietQR trước khi đẩy đơn sang ${selectedCarrierCode}.`}
          />
        )}

        {activeTab === "CART" && (
          <div className="space-y-3">
            {/* Nút 1 chạm Điền SĐT, Địa chỉ 3 cấp & SKU từ tin nhắn NER (F04.1) */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <PatternButton
                type="button"
                size="sm"
                rounded="full"
                variant="glass"
                color="success"
                className="h-7 px-3 text-[11px]"
                icon={<Sparkles className="w-3.5 h-3.5" />}
                onClick={handleFillFromExtractedNer}
              >
                ✨ Điền SĐT, Địa chỉ 3 Cấp & SKU từ Tin nhắn
              </PatternButton>

              {cartItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => clearInChatCart(conversationId)}
                  className="text-[11px] text-muted-foreground hover:text-destructive inline-flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Xóa giỏ</span>
                </button>
              )}
            </div>

            {/* Tìm kiếm SKU Đa Ngành Hàng / Quét Barcode & Giữ chỗ nguyên tử Redis Lua (< 1ms) */}
            <GlassSurfaceCard className="p-3 space-y-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Barcode className="w-3.5 h-3.5 text-primary" />
                  <span>
                    Tìm SKU Đa Ngành / Quét Barcode (Giữ chỗ Redis Lua &lt;1ms)
                  </span>
                </Label>
                <GlassBadge variant="info" size="sm">
                  {warehouses.length} Kho hoạt động
                </GlassBadge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2">
                  <LiquidGlassInput className="h-8 p-0 overflow-hidden">
                    <div className="flex items-center px-2.5 h-full w-full">
                      <Search className="w-3.5 h-3.5 text-muted-foreground mr-1.5 shrink-0" />
                      <Input
                        value={searchSkuQuery}
                        onChange={(e) => setSearchSkuQuery(e.target.value)}
                        placeholder="Gõ SKU (A12, SRM, GRN, S9, COMBO) hoặc Barcode..."
                        className="h-full text-xs bg-transparent! border-none shadow-none focus-visible:ring-0 px-0"
                      />
                    </div>
                  </LiquidGlassInput>
                </div>

                <Select
                  value={selectedWarehouseId}
                  onValueChange={setSelectedWarehouseId}
                >
                  <TriggerSelect className="h-8 text-xs">
                    <SelectValue placeholder="Định tuyến kho" />
                  </TriggerSelect>
                  <ContentSelect>
                    <ItemSelect value="AUTO">
                      ⚡ Tự động kho gần khách
                    </ItemSelect>
                    {warehouses.map((wh) => (
                      <ItemSelect key={wh.id} value={wh.id}>
                        {wh.name}
                      </ItemSelect>
                    ))}
                  </ContentSelect>
                </Select>
              </div>

              {/* Bộ lọc nhanh ngành hàng */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5">
                {(
                  [
                    { key: "ALL", label: "Tất cả" },
                    { key: "FASHION_APPAREL", label: "👗 Thời trang" },
                    { key: "COSMETICS_BEAUTY", label: "💄 Mỹ phẩm" },
                    { key: "ELECTRONICS_TECH", label: "📱 Điện tử" },
                    { key: "FOOD_BEVERAGE", label: "🍵 Thực phẩm" },
                    { key: "MOTHER_AND_BABY", label: "🍼 Mẹ & Bé" },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setFilterIndustry(item.key)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                      filterIndustry === item.key
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/60 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Danh sách gợi ý SKU kèm tồn khả dụng đa kho, Lô HSD & nhãn Combo BOM */}
              <ScrollArea className="max-h-44 pr-1">
                <div className="space-y-1.5">
                  {filteredCatalogVariants.map((variant) => (
                    <div
                      key={variant.id}
                      className="flex items-center justify-between gap-2 p-2 rounded-xl border border-border/50 bg-background/40 hover:bg-primary/5 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-bold text-[11px] text-primary">
                            {variant.skuCode}
                          </span>
                          {variant.isBundleBom && (
                            <GlassBadge variant="accent" size="sm">
                              Combo BOM
                            </GlassBadge>
                          )}
                          {variant.requiresSerialImei && (
                            <GlassBadge variant="warning" size="sm">
                              Serial/IMEI
                            </GlassBadge>
                          )}
                          {variant.requiresBatchExpiry && variant.batchCode && (
                            <GlassBadge variant="info" size="sm">
                              Lô {variant.batchCode}
                            </GlassBadge>
                          )}
                          <span className="truncate font-medium">
                            {variant.variantName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5 flex-wrap">
                          <span className="font-semibold text-foreground">
                            {Number(variant.retailPrice).toLocaleString(
                              "vi-VN",
                            )}
                            đ
                          </span>
                          <span>•</span>
                          <span
                            className={
                              variant.totalAvailableQty > 0
                                ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                                : "text-red-500 font-semibold"
                            }
                          >
                            Có thể bán: {variant.totalAvailableQty}
                          </span>
                          {variant.stocksByWarehouse?.map((st) => (
                            <span key={st.warehouseId} className="font-mono">
                              [{st.warehouseCode}: {st.availableQty}]
                            </span>
                          ))}
                        </div>
                      </div>

                      <PatternButton
                        type="button"
                        size="sm"
                        rounded="full"
                        variant="solid"
                        color="primary"
                        disabled={variant.totalAvailableQty <= 0}
                        className="h-7 px-2.5 text-[11px] shrink-0"
                        icon={<Plus className="w-3 h-3" />}
                        onClick={() =>
                          addOrIncrementInChatCartItem({
                            shopId,
                            conversationId,
                            variant,
                            warehouseId:
                              selectedWarehouseId === "AUTO"
                                ? undefined
                                : selectedWarehouseId,
                          })
                        }
                      >
                        Thêm
                      </PatternButton>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Công cụ Tư vấn Thông số & Size Đa Ngành Hàng (F05.1) */}
              <div className="pt-2 border-t border-border/40 space-y-1.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Ruler className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="text-[11px] font-semibold">
                      Tư vấn Thông số Đa Ngành:
                    </span>
                    <Select
                      value={advisorMode}
                      onValueChange={(v) =>
                        setAdvisorMode(v as ProductIndustryType)
                      }
                    >
                      <TriggerSelect className="h-6 text-[10px] w-36 px-2">
                        <SelectValue />
                      </TriggerSelect>
                      <ContentSelect>
                        <ItemSelect value="FASHION_APPAREL">
                          👗 Thời trang (Cao/Nặng)
                        </ItemSelect>
                        <ItemSelect value="MOTHER_AND_BABY">
                          🍼 Mẹ & Bé (Kg/Tháng)
                        </ItemSelect>
                        <ItemSelect value="COSMETICS_BEAUTY">
                          💄 Mỹ phẩm (Loại da)
                        </ItemSelect>
                        <ItemSelect value="ELECTRONICS_TECH">
                          📱 Điện tử / F&B (Nhu cầu)
                        </ItemSelect>
                      </ContentSelect>
                    </Select>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      askSizeAdvisor({
                        shopId,
                        industryType: advisorMode,
                        heightCm: advisorHeightCm,
                        weightKg: advisorWeightKg,
                        babyAgeMonths:
                          advisorMode === "MOTHER_AND_BABY"
                            ? advisorBabyMonths
                            : undefined,
                        skinType:
                          advisorMode === "COSMETICS_BEAUTY"
                            ? advisorSkinType
                            : undefined,
                        usageNeed:
                          advisorMode === "ELECTRONICS_TECH"
                            ? advisorUsageNeed
                            : undefined,
                      })
                    }
                    className="text-[10px] font-semibold text-primary hover:underline cursor-pointer"
                  >
                    Gợi ý chuẩn →
                  </button>
                </div>

                {advisorMode === "FASHION_APPAREL" && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground">
                      Cao:
                    </span>
                    <Input
                      type="number"
                      value={advisorHeightCm}
                      onChange={(e) =>
                        setAdvisorHeightCm(Number(e.target.value))
                      }
                      className="h-6 w-14 text-[11px] px-1.5"
                    />
                    <span className="text-[10px] text-muted-foreground">
                      cm • Nặng:
                    </span>
                    <Input
                      type="number"
                      value={advisorWeightKg}
                      onChange={(e) =>
                        setAdvisorWeightKg(Number(e.target.value))
                      }
                      className="h-6 w-14 text-[11px] px-1.5"
                    />
                    <span className="text-[10px] text-muted-foreground">
                      kg
                    </span>
                  </div>
                )}

                {advisorMode === "MOTHER_AND_BABY" && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground">
                      Cân nặng bé:
                    </span>
                    <Input
                      type="number"
                      value={advisorWeightKg}
                      onChange={(e) =>
                        setAdvisorWeightKg(Number(e.target.value))
                      }
                      className="h-6 w-14 text-[11px] px-1.5"
                    />
                    <span className="text-[10px] text-muted-foreground">
                      kg • Tháng tuổi:
                    </span>
                    <Input
                      type="number"
                      value={advisorBabyMonths}
                      onChange={(e) =>
                        setAdvisorBabyMonths(Number(e.target.value))
                      }
                      className="h-6 w-14 text-[11px] px-1.5"
                    />
                    <span className="text-[10px] text-muted-foreground">
                      tháng
                    </span>
                  </div>
                )}

                {advisorMode === "COSMETICS_BEAUTY" && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground">
                      Loại da khách:
                    </span>
                    <Select
                      value={advisorSkinType}
                      onValueChange={setAdvisorSkinType}
                    >
                      <TriggerSelect className="h-6 text-[10px] flex-1">
                        <SelectValue />
                      </TriggerSelect>
                      <ContentSelect>
                        <ItemSelect value="OILY">
                          Da dầu / Lỗ chân lông to
                        </ItemSelect>
                        <ItemSelect value="DRY">
                          Da khô / Thiếu ẩm bong tróc
                        </ItemSelect>
                        <ItemSelect value="SENSITIVE">
                          Da nhạy cảm / Đang treatment
                        </ItemSelect>
                        <ItemSelect value="COMBINATION">
                          Da hỗn hợp thiên dầu / thường
                        </ItemSelect>
                      </ContentSelect>
                    </Select>
                  </div>
                )}

                {advisorMode === "ELECTRONICS_TECH" && (
                  <Input
                    value={advisorUsageNeed}
                    onChange={(e) => setAdvisorUsageNeed(e.target.value)}
                    placeholder="Nhập nhu cầu sử dụng của khách..."
                    className="h-6 text-[11px] px-2"
                  />
                )}
              </div>

              {sizeAdviceText && (
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-500/10 px-2.5 py-1.5 rounded-lg">
                  ✨ {sizeAdviceText}
                </div>
              )}
            </GlassSurfaceCard>

            {/* Danh sách Sản phẩm đã chọn trong Giỏ hàng POS */}
            <GlassSurfaceCard className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-primary" />
                  <span>
                    Sản phẩm trong giỏ ({cartItems.length} mã •{" "}
                    {financialSummary.totalWeightGrams}g tính cước)
                  </span>
                </span>
                {financialSummary.subtotal >= 500000 && (
                  <GlassBadge variant="success" size="sm">
                    🎁 Đủ ĐK nhận Quà tặng 0đ
                  </GlassBadge>
                )}
              </div>

              {cartItems.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-xs">
                  Chưa có sản phẩm nào trong giỏ. Bấm &ldquo;Thêm&rdquo; ở trên
                  để giữ chỗ tồn kho nguyên tử.
                </div>
              ) : (
                <div className="space-y-2">
                  {cartItems.map((item) => (
                    <div
                      key={item.variant.id}
                      className="flex items-center justify-between gap-2 p-2 rounded-xl border border-border/50 bg-muted/20"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold truncate">
                          [{item.variant.skuCode}] {item.variant.variantName}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Đơn giá:{" "}
                          {Number(item.variant.retailPrice).toLocaleString(
                            "vi-VN",
                          )}
                          đ • Trần giảm: {item.variant.maxDiscountPercent}%
                          {item.variant.batchCode
                            ? ` • Lô: ${item.variant.batchCode}`
                            : ""}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            updateInChatCartItemQuantity({
                              conversationId,
                              variantId: item.variant.id,
                              quantity: item.quantity - 1,
                            })
                          }
                          className="h-6 w-6 rounded-full border border-border flex items-center justify-center hover:bg-muted cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center font-bold tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            addOrIncrementInChatCartItem({
                              shopId,
                              conversationId,
                              variant: item.variant,
                            })
                          }
                          className="h-6 w-6 rounded-full border border-border flex items-center justify-center hover:bg-muted cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Cảnh báo Tách đơn Đa kho tự động nếu giỏ hàng nằm ở 2 kho khác nhau (F06.6) */}
              {routingPreview?.requiresMultiWarehouseSplit && (
                <GlassAlert
                  variant="warning"
                  icon={<Split className="w-4 h-4 text-amber-500 shrink-0" />}
                  title="Phát hiện mặt hàng nằm ở nhiều Kho khác nhau (Tự động Tách đơn Đa kho)"
                  description={
                    <div className="space-y-1">
                      <div>
                        Không có 1 kho đơn lẻ nào đủ toàn bộ giỏ hàng. Hệ thống
                        sẽ phân bổ thành{" "}
                        {routingPreview.allocationsByWarehouse.length} kiện xuất
                        kho:
                      </div>
                      {routingPreview.allocationsByWarehouse.map((alloc) => (
                        <div
                          key={alloc.warehouseId}
                          className="text-[11px] font-medium text-foreground"
                        >
                          • {alloc.warehouseName}:{" "}
                          {alloc.items
                            .map((i) => `${i.skuCode} (x${i.quantity})`)
                            .join(", ")}
                        </div>
                      ))}
                      <div className="flex items-center gap-2 pt-1">
                        <Switch
                          checked={allowMultiWarehouseSplit}
                          onCheckedChange={setAllowMultiWarehouseSplit}
                        />
                        <span className="text-[11px]">
                          Cho phép tự động tách thành các đơn con (#ORD-A,
                          #ORD-B)
                        </span>
                      </div>
                    </div>
                  }
                />
              )}
            </GlassSurfaceCard>

            {/* Địa chỉ giao hàng 3 Cấp Mới (34 tỉnh) & 4 Cấp Cũ (63 tỉnh) + So sánh Phí ship 4 hãng */}
            <GlassSurfaceCard className="p-3 space-y-2.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-primary" />
                <span>
                  Người nhận & Địa chỉ Hành chính (3 Cấp Mới ↔ 4 Cấp Cũ)
                </span>
              </Label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Tên người nhận..."
                  className="h-8 text-xs"
                />
                <Input
                  value={rawPhoneInput}
                  onChange={(e) => setRawPhoneInput(e.target.value)}
                  placeholder={
                    customerProfile?.phoneMasked
                      ? `SĐT đã bảo mật: ${customerProfile.phoneMasked}`
                      : "Nhập SĐT khách hàng..."
                  }
                  className="h-8 text-xs font-mono"
                />
              </div>

              <ProvinceDistrictWardCombobox
                administrativeTree={administrativeTree}
                provinceCode={provinceCode}
                districtCode={districtCode}
                wardCode={wardCode}
                hamletCode={hamletCode}
                hamletName={hamletName}
                defaultTierMode="3_TIER"
                onChange={(val) => {
                  setProvinceCode(val.provinceCode);
                  setDistrictCode(val.districtCode);
                  setWardCode(val.wardCode);
                  setHamletCode(val.hamletCode || null);
                  setHamletName(val.hamletName || null);
                }}
              />

              <Input
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                placeholder="Số nhà, ngõ/ngách, tên đường chi tiết..."
                className="h-8 text-xs"
              />

              {shippingQuotes.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold">
                      So sánh Phí vận chuyển Đa hãng:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Switch
                        checked={isFreeShipping}
                        onCheckedChange={setIsFreeShipping}
                      />
                      <span className="text-[10px]">
                        Miễn phí ship cho khách
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {shippingQuotes.map((quote) => {
                      const isSelected =
                        selectedCarrierCode === quote.carrierCode;
                      return (
                        <button
                          key={quote.carrierCode}
                          type="button"
                          onClick={() =>
                            setSelectedCarrierCode(quote.carrierCode)
                          }
                          className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? "border-primary bg-primary/10 shadow-2xs"
                              : "border-border/50 bg-background/40 hover:bg-muted/40"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-[11px]">
                              {quote.carrierCode}
                            </span>
                            <span className="font-bold text-primary text-[11px]">
                              {quote.totalFeeVnd.toLocaleString("vi-VN")}đ
                            </span>
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            {quote.estimatedDeliveryLabel}
                          </div>
                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                            {quote.isRecommendedCheapest && (
                              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9px] font-semibold">
                                💰 Rẻ nhất
                              </span>
                            )}
                            {quote.isRecommendedFastest && (
                              <span className="px-1.5 py-0.2 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 text-[9px] font-semibold">
                                ⚡ Nhanh nhất
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </GlassSurfaceCard>

            {/* Chiết khấu, Ví điểm thưởng & Tổng kết tài chính đơn hàng (F06.2, F06.3, F11.4) */}
            <GlassSurfaceCard className="p-3 space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[11px]">
                    Chiết khấu (%) — Trần SKU:{" "}
                    {financialSummary.minVariantMaxDiscount}%
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={orderDiscountPercent}
                    onChange={(e) =>
                      setOrderDiscountPercent(Number(e.target.value))
                    }
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[11px]">Phương thức thanh toán</Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={(v) =>
                      setPaymentMethod(v as PosOrderPaymentMethodType)
                    }
                  >
                    <TriggerSelect className="h-8 text-xs mt-1">
                      <SelectValue />
                    </TriggerSelect>
                    <ContentSelect>
                      <ItemSelect value="COD">Thu hộ COD</ItemSelect>
                      <ItemSelect value="VIETQR_TRANSFER">
                        Chuyển khoản VietQR 100%
                      </ItemSelect>
                      <ItemSelect value="DEPOSIT_AND_COD">
                        Đặt cọc VietQR 30% + COD
                      </ItemSelect>
                    </ContentSelect>
                  </Select>
                </div>
              </div>

              {financialSummary.exceedsDiscountCeiling && (
                <GlassAlert
                  variant="warning"
                  title={`Vượt trần chiết khấu tự quyết (${financialSummary.minVariantMaxDiscount}%)`}
                  description="Đơn hàng vẫn giữ chỗ tồn kho và tự động chuyển sang trạng thái chờ Quản lý duyệt giảm giá 1 chạm."
                />
              )}

              {customerProfile &&
                (customerProfile.loyaltyPointsBalance > 0 ||
                  customerProfile.walletCreditBalance > 0) && (
                  <div className="p-2 rounded-xl bg-primary/5 border border-primary/20 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5 text-amber-500" />
                        <span>
                          Điểm thưởng hiện có:{" "}
                          <b>{customerProfile.loyaltyPointsBalance}</b> điểm
                        </span>
                      </span>
                      <Input
                        type="number"
                        min={0}
                        max={customerProfile.loyaltyPointsBalance}
                        value={redeemLoyaltyPoints}
                        onChange={(e) =>
                          setRedeemLoyaltyPoints(Number(e.target.value))
                        }
                        placeholder="Số điểm dùng"
                        className="h-6 w-20 text-[11px]"
                      />
                    </div>
                    {Number(customerProfile.walletCreditBalance || 0) > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium flex items-center gap-1">
                          <Wallet className="w-3.5 h-3.5 text-emerald-500" />
                          <span>
                            Ví tiền thừa:{" "}
                            <b>
                              {Number(
                                customerProfile.walletCreditBalance,
                              ).toLocaleString("vi-VN")}
                              đ
                            </b>
                          </span>
                        </span>
                        <Switch
                          checked={applyWalletCredit}
                          onCheckedChange={setApplyWalletCredit}
                        />
                      </div>
                    )}
                  </div>
                )}

              <div className="space-y-1 pt-2 border-t border-border/40 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Tạm tính hàng hóa:</span>
                  <span>
                    {financialSummary.subtotal.toLocaleString("vi-VN")}đ
                  </span>
                </div>
                {financialSummary.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Giảm giá ({orderDiscountPercent}%):</span>
                    <span>
                      -{financialSummary.discountAmount.toLocaleString("vi-VN")}
                      đ
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Phí vận chuyển ({selectedCarrierCode}):</span>
                  <span>
                    {isFreeShipping
                      ? "0đ (Shop trả)"
                      : `${financialSummary.customerShippingCharge.toLocaleString("vi-VN")}đ`}
                  </span>
                </div>
                {financialSummary.pointsDiscountVnd > 0 && (
                  <div className="flex justify-between text-amber-600">
                    <span>Đổi {financialSummary.effectivePoints} điểm:</span>
                    <span>
                      -
                      {financialSummary.pointsDiscountVnd.toLocaleString(
                        "vi-VN",
                      )}
                      đ
                    </span>
                  </div>
                )}
                {financialSummary.walletCreditUsed > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Trừ Ví tiền thừa khách hàng:</span>
                    <span>
                      -
                      {financialSummary.walletCreditUsed.toLocaleString(
                        "vi-VN",
                      )}
                      đ
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm pt-1 border-t border-border/40 text-foreground">
                  <span>Tổng khách cần thanh toán:</span>
                  <span className="text-primary">
                    {financialSummary.totalPayable.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              </div>

              <PatternButton
                type="button"
                variant="solid"
                color={
                  financialSummary.exceedsDiscountCeiling
                    ? "warning"
                    : "primary"
                }
                size="md"
                rounded="full"
                fullWidth
                isLoading={isSubmitting}
                icon={
                  financialSummary.exceedsDiscountCeiling ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )
                }
                onClick={handleCreatePosOrder}
              >
                {financialSummary.exceedsDiscountCeiling
                  ? `⏳ Gửi Quản lý duyệt giảm giá (${orderDiscountPercent}%)`
                  : "Xác nhận Tạo Đơn & Sinh Mã VietQR Động"}
              </PatternButton>
            </GlassSurfaceCard>
          </div>
        )}

        {/* TAB 2: MÃ THANH TOÁN VIETQR ĐỘNG CHUẨN NAPAS EMVCO & GẠCH NỢ TỰ ĐỘNG (F06.4 & T08) */}
        {activeTab === "VIETQR" && (
          <div className="space-y-3">
            {!activeCreatedOrder ? (
              <GlassEmptyState
                icon={<QrCode className="w-7 h-7" />}
                title="Chưa có đơn hàng vừa tạo"
                description="Hãy tạo đơn hàng ở tab Giỏ hàng POS để sinh mã VietQR động chuẩn NAPAS EMVCo."
              />
            ) : (
              <GlassSurfaceCard className="p-3.5 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <div className="font-mono font-bold text-sm text-primary">
                      #{activeCreatedOrder.orderCode}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Khách: {activeCreatedOrder.customerName} • Kho:{" "}
                      {activeCreatedOrder.warehouseName}
                    </div>
                  </div>
                  <GlassBadge
                    variant={
                      activeCreatedOrder.paymentStatus === "PAID_IN_FULL"
                        ? "success"
                        : activeCreatedOrder.status === "PENDING_PRICE_APPROVAL"
                          ? "warning"
                          : "info"
                    }
                  >
                    {activeCreatedOrder.paymentStatus === "PAID_IN_FULL"
                      ? "✅ Đã thanh toán đủ"
                      : activeCreatedOrder.status}
                  </GlassBadge>
                </div>

                {activeCreatedOrder.discountApprovalStatus === "PENDING" && (
                  <GlassAlert
                    variant="warning"
                    title={`Đơn đang chờ Quản lý duyệt giảm giá (${activeCreatedOrder.discountPercent}%)`}
                    description="Quản lý cửa hàng có thể bấm phê duyệt hoặc từ chối ngay tại đây:"
                    action={
                      <div className="flex items-center gap-2">
                        <PatternButton
                          type="button"
                          size="sm"
                          rounded="full"
                          variant="solid"
                          color="success"
                          className="h-7 px-3 text-[11px]"
                          onClick={() =>
                            approveOrRejectOrderDiscount({
                              shopId,
                              orderId: activeCreatedOrder.id,
                              approved: true,
                              managerNote: "Duyệt 1 chạm trên In-Chat POS",
                            })
                          }
                        >
                          ✅ Duyệt ngay
                        </PatternButton>
                        <PatternButton
                          type="button"
                          size="sm"
                          rounded="full"
                          variant="outline"
                          color="danger"
                          className="h-7 px-3 text-[11px]"
                          onClick={() =>
                            approveOrRejectOrderDiscount({
                              shopId,
                              orderId: activeCreatedOrder.id,
                              approved: false,
                              managerNote: "Không duyệt mức giảm này",
                            })
                          }
                        >
                          ❌ Từ chối
                        </PatternButton>
                      </div>
                    }
                  />
                )}

                {activeCreatedOrder.vietqrPayloadJson && (
                  <div className="rounded-2xl border border-border/60 bg-background/60 p-3 text-center space-y-2">
                    <div className="text-xs font-bold text-foreground">
                      Mã Thanh Toán Nhanh NAPAS 247 (VietQR EMVCo Động)
                    </div>
                    <div className="flex justify-center">
                      <img
                        src={activeCreatedOrder.vietqrPayloadJson.qrImageUrl}
                        alt="VietQR EMVCo"
                        className="w-44 h-44 rounded-xl border border-border object-contain bg-white p-1.5"
                      />
                    </div>
                    <div className="space-y-0.5 text-[11px]">
                      <div>
                        Ngân hàng:{" "}
                        <b>
                          {activeCreatedOrder.vietqrPayloadJson.bankShortName}{" "}
                          (BIN {activeCreatedOrder.vietqrPayloadJson.bankBin})
                        </b>
                      </div>
                      <div>
                        Số tài khoản:{" "}
                        <b className="font-mono">
                          {activeCreatedOrder.vietqrPayloadJson.accountNumber}
                        </b>
                      </div>
                      <div>
                        Số tiền khóa cứng:{" "}
                        <b className="text-primary text-sm">
                          {Number(
                            activeCreatedOrder.vietqrPayloadJson.amountVnd,
                          ).toLocaleString("vi-VN")}
                          đ
                        </b>
                      </div>
                      <div>
                        Nội dung CK:{" "}
                        <span className="font-mono font-bold bg-primary/10 text-primary px-2 py-0.5 rounded">
                          {
                            activeCreatedOrder.vietqrPayloadJson
                              .transferReferenceCode
                          }
                        </span>
                      </div>
                    </div>

                    <div className="pt-1 text-[10px] font-mono text-muted-foreground break-all bg-muted/40 p-1.5 rounded-lg">
                      EMVCo CRC16:{" "}
                      {activeCreatedOrder.vietqrPayloadJson.emvcoRawPayload}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                      {onSendInvoiceCardToChat && (
                        <PatternButton
                          type="button"
                          size="sm"
                          rounded="full"
                          variant="glass"
                          color="primary"
                          icon={<Send className="w-3.5 h-3.5" />}
                          onClick={() => {
                            const qr = activeCreatedOrder.vietqrPayloadJson!;
                            const cardMsg = `🧾 **HÓA ĐƠN ĐƠN HÀNG #${activeCreatedOrder.orderCode}**\n- Người nhận: ${activeCreatedOrder.customerName} (${activeCreatedOrder.customerPhoneMasked})\n- Địa chỉ: ${activeCreatedOrder.fullThreeTierAddress}\n- Tổng thanh toán: **${Number(activeCreatedOrder.totalPayableAmount).toLocaleString("vi-VN")}đ**\n- Chuyển khoản nhanh VietQR (${qr.bankShortName} - ${qr.accountNumber}): Số tiền **${qr.amountVnd.toLocaleString("vi-VN")}đ** — Nội dung: \`${qr.transferReferenceCode}\``;
                            void onSendInvoiceCardToChat(cardMsg);
                          }}
                        >
                          Gửi Thẻ Hóa Đơn & QR vào Chat
                        </PatternButton>
                      )}

                      <PatternButton
                        type="button"
                        size="sm"
                        rounded="full"
                        variant="solid"
                        color="success"
                        icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                        onClick={() =>
                          confirmVietQrPaymentReceived({
                            shopId,
                            orderIdOrReference: activeCreatedOrder.id,
                            paidAmountVnd:
                              activeCreatedOrder.vietqrPayloadJson?.amountVnd ||
                              Number(activeCreatedOrder.totalPayableAmount),
                          })
                        }
                      >
                        ⚡ Giả lập Webhook Đã Nhận Tiền
                      </PatternButton>
                    </div>
                  </div>
                )}
              </GlassSurfaceCard>
            )}
          </div>
        )}

        {/* TAB 3: DANH SÁCH ĐƠN CHỜ GỘP / LỊCH SỬ ĐƠN POS TRONG HỘI THOẠI */}
        {activeTab === "ORDERS" && (
          <div className="space-y-2">
            {mergeableOrders.length === 0 ? (
              <GlassEmptyState
                icon={<Boxes className="w-7 h-7" />}
                title="Không có đơn trùng chờ gộp"
                description="Mọi đơn hàng chưa xuất kho của khách sẽ hiển thị tại đây để gộp 1 chạm."
              />
            ) : (
              mergeableOrders.map((ord) => (
                <GlassSurfaceCard key={ord.id} className="p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-primary">
                      #{ord.orderCode}
                    </span>
                    <GlassBadge variant="info" size="sm">
                      {ord.status}
                    </GlassBadge>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {ord.fullThreeTierAddress}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-bold">
                      {Number(ord.totalPayableAmount).toLocaleString("vi-VN")}đ
                    </span>
                    <PatternButton
                      type="button"
                      size="sm"
                      rounded="full"
                      variant="solid"
                      color="primary"
                      className="h-7 px-2.5 text-[10px]"
                      onClick={() =>
                        mergeIntoExistingOrderOneClick({
                          shopId,
                          conversationId,
                          targetPrimaryOrderId: ord.id,
                        })
                      }
                    >
                      Gộp giỏ hàng vào đơn này
                    </PatternButton>
                  </div>
                </GlassSurfaceCard>
              ))
            )}
          </div>
        )}
      </div>
    </LiquidGlassConfigProvider>
  );
}
