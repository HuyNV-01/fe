"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  GlassBadge,
  GlassEmptyState,
  GlassSectionHeader,
  GlassSurfaceCard,
  GlassTabs,
  LiquidGlassInput,
  PatternButton,
  ScrollArea,
} from "@/components/toolkit";
import { Input } from "@/components/ui/input";
import { useCatalogPosStore } from "@/lib/stores/catalog-pos/use-catalog-pos-store";
import {
  Barcode,
  CheckCircle2,
  Monitor,
  Plus,
  Printer,
  QrCode,
  ShoppingBag,
  Trash2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useChannelWorkspaceStore } from "@/lib/stores/channel/use-channel-workspace-store";

const COUNTER_SYNC_CHANNEL = "seller_os_counter_pos_sync";

export default function CounterPosPage() {
  const searchParams = useSearchParams();
  const isCustomerDisplayMode = searchParams.get("mode") === "customer-display";

  const activeShop = useChannelWorkspaceStore((s) => s.activeShop);
  const shopId = activeShop?.id || "default_shop";

  const {
    variants,
    counterTabs,
    activeCounterTabId,
    fetchCatalogAndStock,
    addCounterTab,
    closeCounterTab,
    setActiveCounterTab,
    addVariantToCounterTab,
    updateCounterTabItemQty,
    updateCounterTabMeta,
    submitInChatPosOrder,
    confirmVietQrPaymentReceived,
  } = useCatalogPosStore();

  const [barcodeInput, setBarcodeInput] = useState("");
  const [customerMirrorData, setCustomerMirrorData] = useState<any>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);

  const activeTabSession = useMemo(
    () =>
      counterTabs.find((t) => t.tabId === activeCounterTabId) || counterTabs[0],
    [counterTabs, activeCounterTabId],
  );

  const subtotal = useMemo(
    () =>
      (activeTabSession?.items || []).reduce(
        (s, i) => s + i.variant.retailPrice * i.quantity,
        0,
      ),
    [activeTabSession],
  );
  const discountAmount = Math.round(
    (subtotal * Number(activeTabSession?.discountPercent || 0)) / 100,
  );
  const totalPayable = Math.max(0, subtotal - discountAmount);

  useEffect(() => {
    if (!shopId) return;
    void fetchCatalogAndStock({ shopId });
  }, [shopId, fetchCatalogAndStock]);

  // Đồng bộ thời gian thực 2 màn hình qua BroadcastChannel('seller_os_counter_pos_sync') (F06.7 & T08)
  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) {
      return;
    }
    const bc = new BroadcastChannel(COUNTER_SYNC_CHANNEL);
    channelRef.current = bc;

    bc.onmessage = (event) => {
      if (isCustomerDisplayMode && event.data) {
        setCustomerMirrorData(event.data);
      }
    };

    return () => {
      bc.close();
    };
  }, [isCustomerDisplayMode]);

  useEffect(() => {
    if (!isCustomerDisplayMode && channelRef.current && activeTabSession) {
      channelRef.current.postMessage({
        tabLabel: activeTabSession.tabLabel,
        customerName: activeTabSession.customerName,
        items: activeTabSession.items,
        subtotal,
        discountAmount,
        totalPayable,
        activeOrder: activeTabSession.activeOrder,
      });
    }
  }, [
    isCustomerDisplayMode,
    activeTabSession,
    subtotal,
    discountAmount,
    totalPayable,
  ]);

  const handleBarcodeScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = barcodeInput.trim().toLowerCase();
    if (!q) return;
    const matched = variants.find(
      (v) =>
        v.barcode.toLowerCase() === q ||
        v.skuCode.toLowerCase() === q ||
        v.skuCode.toLowerCase().includes(q),
    );
    if (matched) {
      addVariantToCounterTab(matched);
      setBarcodeInput("");
      toast.success(
        `Đã quét thêm [${matched.skuCode}] vào ${activeTabSession.tabLabel}`,
      );
    } else {
      toast.error(`Không tìm thấy mã vạch / SKU "${barcodeInput}"`);
    }
  };

  const handleCheckoutF9 = async () => {
    if (!activeTabSession || activeTabSession.items.length === 0) {
      toast.error("Giỏ hàng tại quầy đang trống!");
      return;
    }
    const created = await submitInChatPosOrder({
      shopId,
      customerName: activeTabSession.customerName || "Khách lẻ tại quầy",
      rawPhone: activeTabSession.customerPhone || undefined,
      carrierCode: "COUNTER_PICKUP",
      shippingFeeAmount: 0,
      isFreeShippingForCustomer: true,
      orderDiscountPercent: activeTabSession.discountPercent,
      paymentMethod: activeTabSession.paymentMethod,
      items: activeTabSession.items.map((it) => ({
        variantId: it.variant.id,
        quantity: it.quantity,
      })),
      note: `Bán hàng trực tiếp tại quầy (${activeTabSession.tabLabel})`,
    });
    if (created) {
      updateCounterTabMeta({ activeOrder: created });
    }
  };

  // Chế độ Màn hình phụ hướng về phía khách hàng (/pos/counter?mode=customer-display)
  if (isCustomerDisplayMode) {
    const data = customerMirrorData || {
      tabLabel: activeTabSession?.tabLabel,
      customerName: activeTabSession?.customerName,
      items: activeTabSession?.items || [],
      subtotal,
      discountAmount,
      totalPayable,
      activeOrder: activeTabSession?.activeOrder,
    };

    return (
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <GlassSectionHeader
          icon={<Monitor className="w-5 h-5" />}
          title="Màn Hình Phụ Khách Hàng Tại Quầy (Dual-Screen Customer Display)"
          subtitle="Đồng bộ thời gian thực qua BroadcastChannel('seller_os_counter_pos_sync')"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlassSurfaceCard className="p-5 space-y-3">
            <div className="text-base font-bold">
              Xin chào: {data.customerName || "Quý khách"} ({data.tabLabel})
            </div>
            <div className="divide-y divide-border/40 text-sm">
              {(data.items || []).map((it: any) => (
                <div
                  key={it.variant.id}
                  className="py-2.5 flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold">
                      {it.variant.variantName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      SL: x{it.quantity}
                    </div>
                  </div>
                  <div className="font-bold">
                    {(it.variant.retailPrice * it.quantity).toLocaleString(
                      "vi-VN",
                    )}
                    đ
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-border/50 flex justify-between text-lg font-bold">
              <span>Tổng thanh toán:</span>
              <span className="text-primary">
                {Number(data.totalPayable || 0).toLocaleString("vi-VN")}đ
              </span>
            </div>
          </GlassSurfaceCard>

          <GlassSurfaceCard className="p-5 flex flex-col items-center justify-center text-center space-y-3">
            {data.activeOrder?.vietqrPayloadJson ? (
              <>
                <div className="font-bold text-sm">
                  Quét Mã VietQR Động Để Thanh Toán
                </div>
                <img
                  src={data.activeOrder.vietqrPayloadJson.qrImageUrl}
                  alt="VietQR"
                  className="w-56 h-56 rounded-2xl border bg-white p-2 object-contain"
                />
                <div className="text-xs font-mono font-bold text-primary">
                  {data.activeOrder.vietqrPayloadJson.transferReferenceCode}
                </div>
              </>
            ) : (
              <GlassEmptyState
                icon={<QrCode className="w-8 h-8" />}
                title="Đang chờ thu ngân xác nhận hóa đơn"
                description="Mã VietQR động chuẩn EMVCo sẽ hiển thị ngay khi thu ngân bấm Thanh toán (F9)."
              />
            )}
          </GlassSurfaceCard>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-4">
      <GlassSectionHeader
        icon={<ShoppingBag className="w-5 h-5" />}
        title="Bán Hàng Tại Quầy Siêu Tốc & Màn Hình Phụ Khách Hàng (/pos/counter — F06.7 & T08)"
        subtitle="Hỗ trợ quét súng mã vạch liên tục, mở tối đa 10 hóa đơn chờ cùng lúc (Multi-Tab Hold Carts) & đồng bộ VietQR 2 màn hình"
        actions={
          <div className="flex items-center gap-2">
            <PatternButton
              type="button"
              size="sm"
              rounded="full"
              variant="glass"
              color="info"
              icon={<Monitor className="w-3.5 h-3.5" />}
              onClick={() =>
                window.open("/vi/pos/counter?mode=customer-display", "_blank")
              }
            >
              Mở Màn Hình Phụ Khách Hàng
            </PatternButton>
            <PatternButton
              type="button"
              size="sm"
              rounded="full"
              variant="solid"
              color="primary"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={addCounterTab}
            >
              + Thêm Hóa Đơn Chờ ({counterTabs.length}/10)
            </PatternButton>
          </div>
        }
      />

      {/* Thanh Multi-Tab Hold Carts */}
      <div className="flex items-center gap-2 flex-wrap">
        <GlassTabs
          size="sm"
          value={activeCounterTabId}
          onValueChange={setActiveCounterTab}
          items={counterTabs.map((t) => ({
            key: t.tabId,
            label: t.tabLabel,
            badge: t.items.reduce((s, i) => s + i.quantity, 0),
          }))}
        />
        {counterTabs.length > 1 && (
          <button
            type="button"
            onClick={() => closeCounterTab(activeCounterTabId)}
            className="text-xs text-muted-foreground hover:text-destructive inline-flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Đóng tab hiện tại</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Cột trái: Quét Barcode & Chọn nhanh sản phẩm */}
        <div className="lg:col-span-2 space-y-3">
          <GlassSurfaceCard className="p-4 space-y-3">
            <form onSubmit={handleBarcodeScanSubmit} className="flex gap-2">
              <LiquidGlassInput className="flex-1 h-10 p-0 overflow-hidden">
                <div className="flex items-center px-3 h-full w-full">
                  <Barcode className="w-4 h-4 text-primary mr-2 shrink-0" />
                  <Input
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="Quét súng mã vạch Barcode hoặc gõ mã SKU rồi nhấn Enter..."
                    className="h-full text-xs bg-transparent! border-none shadow-none focus-visible:ring-0 px-0"
                    autoFocus
                  />
                </div>
              </LiquidGlassInput>
              <PatternButton
                type="submit"
                variant="solid"
                color="primary"
                size="md"
                rounded="full"
              >
                Quét thêm
              </PatternButton>
            </form>

            <ScrollArea className="h-72 pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {variants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    disabled={v.totalAvailableQty <= 0}
                    onClick={() => addVariantToCounterTab(v)}
                    className="p-3 rounded-xl border border-border/50 bg-background/50 hover:bg-primary/5 text-left transition-all cursor-pointer disabled:opacity-40"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-primary">
                        {v.skuCode}
                      </span>
                      <GlassBadge
                        variant={v.totalAvailableQty > 0 ? "success" : "danger"}
                        size="sm"
                      >
                        Tồn: {v.totalAvailableQty}
                      </GlassBadge>
                    </div>
                    <div className="text-xs font-semibold truncate mt-1">
                      {v.variantName}
                    </div>
                    <div className="text-xs font-bold text-foreground mt-1">
                      {Number(v.retailPrice).toLocaleString("vi-VN")}đ
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </GlassSurfaceCard>
        </div>

        {/* Cột phải: Chi tiết Hóa đơn tại quầy & VietQR Động */}
        <div className="space-y-3">
          <GlassSurfaceCard className="p-4 space-y-3">
            <div className="font-bold text-sm flex items-center justify-between">
              <span>{activeTabSession?.tabLabel}</span>
              <GlassBadge variant="primary" size="sm">
                POS Quầy Thu Ngân
              </GlassBadge>
            </div>

            <Input
              value={activeTabSession?.customerName || ""}
              onChange={(e) =>
                updateCounterTabMeta({ customerName: e.target.value })
              }
              placeholder="Tên khách hàng tại quầy..."
              className="h-8 text-xs"
            />

            <div className="space-y-2 max-h-52 overflow-y-auto">
              {(activeTabSession?.items || []).map((item) => (
                <div
                  key={item.variant.id}
                  className="flex items-center justify-between gap-2 p-2 rounded-xl border border-border/40 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold truncate">
                      {item.variant.variantName}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {Number(item.variant.retailPrice).toLocaleString("vi-VN")}
                      đ x {item.quantity}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        updateCounterTabItemQty(
                          item.variant.id,
                          item.quantity - 1,
                        )
                      }
                      className="h-6 w-6 rounded-full border flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>
                    <span className="w-6 text-center font-bold">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateCounterTabItemQty(
                          item.variant.id,
                          item.quantity + 1,
                        )
                      }
                      className="h-6 w-6 rounded-full border flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-border/40 space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Tạm tính:</span>
                <span>{subtotal.toLocaleString("vi-VN")}đ</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-primary pt-1">
                <span>Khách cần trả:</span>
                <span>{totalPayable.toLocaleString("vi-VN")}đ</span>
              </div>
            </div>

            <PatternButton
              type="button"
              variant="solid"
              color="primary"
              size="md"
              rounded="full"
              fullWidth
              icon={<Zap className="w-4 h-4" />}
              onClick={handleCheckoutF9}
            >
              Thanh Toán & In Hóa Đơn K80 (F9)
            </PatternButton>

            {activeTabSession?.activeOrder?.vietqrPayloadJson && (
              <div className="p-3 rounded-xl border bg-background/60 text-center space-y-2">
                <img
                  src={
                    activeTabSession.activeOrder.vietqrPayloadJson.qrImageUrl
                  }
                  alt="VietQR"
                  className="w-40 h-40 mx-auto rounded-xl border bg-white p-1 object-contain"
                />
                <div className="text-[11px] font-mono font-bold text-primary">
                  {
                    activeTabSession.activeOrder.vietqrPayloadJson
                      .transferReferenceCode
                  }
                </div>
                <PatternButton
                  type="button"
                  size="sm"
                  rounded="full"
                  variant="solid"
                  color="success"
                  fullWidth
                  icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                  onClick={() =>
                    confirmVietQrPaymentReceived({
                      shopId,
                      orderIdOrReference: activeTabSession.activeOrder!.id,
                      paidAmountVnd: totalPayable,
                    })
                  }
                >
                  Xác nhận Đã Nhận Chuyển Khoản
                </PatternButton>
              </div>
            )}
          </GlassSurfaceCard>
        </div>
      </div>
    </div>
  );
}
