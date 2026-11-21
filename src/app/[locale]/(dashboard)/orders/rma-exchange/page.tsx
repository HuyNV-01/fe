/** biome-ignore-all lint/a11y/noLabelWithoutControl: <explanation> */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeftRight, Plus, RefreshCcw } from "lucide-react";
import {
  ContentSelect,
  GlassBadge,
  GlassEmptyState,
  GlassModal,
  GlassSectionHeader,
  GlassSurfaceCard,
  ItemSelect,
  LiquidGlassInput,
  PatternButton,
  Switch,
  TriggerSelect,
} from "@/components/toolkit";
import { Select } from "@/components/ui/select";
import { OmsSubNavBar } from "@/components/oms/oms-status-meta";
import { usePermissionStore } from "@/lib/stores/iam/use-permission-store";
import { useCatalogPosStore } from "@/lib/stores/catalog-pos/use-catalog-pos-store";
import { useOmsFulfillmentStore } from "@/lib/stores/oms/use-oms-fulfillment-store";
import type { OmsRmaType } from "@/types/oms";

export default function RmaExchangePage() {
  const t = useTranslations("OmsFulfillment");
  const searchParams = useSearchParams();
  const activeShopId = usePermissionStore((s) => s.activeShopId);

  const orders = useOmsFulfillmentStore((s) => s.orders);
  const rmaExchanges = useOmsFulfillmentStore((s) => s.rmaExchanges);
  const isSubmitting = useOmsFulfillmentStore((s) => s.isSubmitting);
  const fetchOmsOrders = useOmsFulfillmentStore((s) => s.fetchOmsOrders);
  const fetchRmaExchanges = useOmsFulfillmentStore((s) => s.fetchRmaExchanges);
  const createRmaExchange = useOmsFulfillmentStore((s) => s.createRmaExchange);

  // Dùng đúng tên hàm `fetchCatalogAndStock` đã khai báo trên `useCatalogPosStore`
  const variants = useCatalogPosStore((s) => s.variants);
  const fetchCatalogAndStock = useCatalogPosStore(
    (s) => s.fetchCatalogAndStock,
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [rmaType, setRmaType] = useState<OmsRmaType>("EXCHANGE_2_WAY");
  const [returnVariantId, setReturnVariantId] = useState("");
  const [returnQty, setReturnQty] = useState(1);
  const [outboundVariantId, setOutboundVariantId] = useState("");
  const [outboundQty, setOutboundQty] = useState(1);
  const [rmaShipFee, setRmaShipFee] = useState(25000);
  const [refundToWallet, setRefundToWallet] = useState(true);
  const [reasonNote, setReasonNote] = useState("Khách đổi size / đổi mẫu");

  useEffect(() => {
    if (!activeShopId) return;
    void fetchRmaExchanges(activeShopId);
    void fetchOmsOrders({ shopId: activeShopId, limit: 50 });
    void fetchCatalogAndStock({ shopId: activeShopId });
  }, [activeShopId, fetchRmaExchanges, fetchOmsOrders, fetchCatalogAndStock]);

  useEffect(() => {
    const preselectedOrderId = searchParams?.get("orderId");
    if (preselectedOrderId && orders.length > 0 && !selectedOrderId) {
      const matched = orders.find((o) => o.id === preselectedOrderId);
      if (matched) {
        setSelectedOrderId(matched.id);
        setReturnVariantId(matched.itemsJson?.[0]?.variantId || "");
        setModalOpen(true);
      }
    }
  }, [searchParams, orders, selectedOrderId]);

  const selectedOriginalOrder = useMemo(
    () => orders.find((o) => o.id === selectedOrderId) || null,
    [orders, selectedOrderId],
  );

  const computedCodDelta = useMemo(() => {
    const returnLine = selectedOriginalOrder?.itemsJson.find(
      (i) => i.variantId === returnVariantId,
    );
    const outboundVar = variants.find((v) => v.id === outboundVariantId);
    const returnTotal = Number(returnLine?.finalUnitPrice || 0) * returnQty;
    const outboundTotal =
      rmaType === "PARTIAL_RETURN"
        ? 0
        : Number(outboundVar?.retailPrice || 0) * outboundQty;
    return outboundTotal - returnTotal + Number(rmaShipFee || 0);
  }, [
    selectedOriginalOrder,
    returnVariantId,
    returnQty,
    variants,
    outboundVariantId,
    outboundQty,
    rmaShipFee,
    rmaType,
  ]);

  const handleCreateRma = async () => {
    if (!activeShopId || !selectedOrderId || !returnVariantId) return;
    const ok = await createRmaExchange({
      shopId: activeShopId,
      originalOrderId: selectedOrderId,
      rmaType,
      returnItems: [{ variantId: returnVariantId, quantity: returnQty }],
      outboundItems:
        rmaType !== "PARTIAL_RETURN" && outboundVariantId
          ? [{ variantId: outboundVariantId, quantity: outboundQty }]
          : [],
      rmaShippingFeeCustomerCharged: Number(rmaShipFee || 0),
      refundNegativeDeltaToWallet: refundToWallet,
      reasonNote: reasonNote.trim() || undefined,
    });
    if (ok) setModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-4">
      <GlassSectionHeader
        icon={<RefreshCcw className="w-5 h-5" />}
        title={t("rmaPage.title")}
        subtitle={t("rmaPage.subtitle")}
        actions={
          <PatternButton
            variant="solid"
            color="primary"
            size="sm"
            onClick={() => setModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Tạo đơn Đổi hàng 2 chiều
          </PatternButton>
        }
      />

      <OmsSubNavBar />

      {rmaExchanges.length === 0 ? (
        <GlassSurfaceCard>
          <GlassEmptyState
            icon={<ArrowLeftRight className="w-8 h-8" />}
            title="Chưa có phiếu đổi trả 2 chiều (RMA)"
            description="Tạo đơn đổi size/mẫu giao mới thu cũ trong 1 chuyến bưu tá và tự động tính chênh lệch COD."
          />
        </GlassSurfaceCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rmaExchanges.map((rma) => (
            <GlassSurfaceCard
              key={rma.id}
              header={
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm">
                      {rma.rmaCode} • {rma.rmaType}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Đơn gốc: {rma.originalOrderCode}{" "}
                      {rma.exchangeOrderCode
                        ? `→ Đơn đổi: ${rma.exchangeOrderCode}`
                        : ""}
                    </div>
                  </div>
                  <GlassBadge
                    variant={rma.status === "COMPLETED" ? "success" : "info"}
                  >
                    {rma.status}
                  </GlassBadge>
                </div>
              }
            >
              <div className="space-y-2 text-xs">
                <div>
                  Khách hàng: <strong>{rma.customerName}</strong>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg bg-muted/40">
                    <div className="font-semibold text-amber-600 mb-1">
                      Hàng thu hồi về kho
                    </div>
                    {rma.returnItemsJson.map((i) => (
                      <div key={i.variantId}>
                        {i.skuCode} x{i.expectedQty}
                      </div>
                    ))}
                  </div>
                  <div className="p-2 rounded-lg bg-muted/40">
                    <div className="font-semibold text-emerald-600 mb-1">
                      Hàng giao mới đi
                    </div>
                    {rma.outboundItemsJson.length === 0 ? (
                      <span className="text-muted-foreground">
                        Chỉ thu hồi / trả hàng
                      </span>
                    ) : (
                      rma.outboundItemsJson.map((i) => (
                        <div key={i.variantId}>
                          {i.skuCode} x{i.quantity}
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1 font-bold text-sm">
                  <span>COD Chênh lệch:</span>
                  <span
                    className={
                      rma.codDeltaAmount >= 0
                        ? "text-primary"
                        : "text-emerald-600"
                    }
                  >
                    {rma.codDeltaAmount >= 0
                      ? `Thu thêm ${Number(rma.codDeltaAmount).toLocaleString("vi-VN")}đ`
                      : `Hoàn lại ${Math.abs(Number(rma.codDeltaAmount)).toLocaleString("vi-VN")}đ`}
                  </span>
                </div>
              </div>
            </GlassSurfaceCard>
          ))}
        </div>
      )}

      <GlassModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        size="xl"
        title="Tạo Đơn Đổi Hàng 2 Chiều (Giao Mới — Thu Cũ)"
        description="Hệ thống tự động giữ chỗ tồn kho sản phẩm mới bằng Redis Lua và tính chênh lệch COD."
        footer={
          <>
            <PatternButton
              variant="ghost"
              size="sm"
              onClick={() => setModalOpen(false)}
            >
              {t("common.cancel")}
            </PatternButton>
            <PatternButton
              variant="solid"
              color="primary"
              size="sm"
              isLoading={isSubmitting}
              onClick={handleCreateRma}
            >
              Xác nhận tạo đơn RMA
            </PatternButton>
          </>
        }
      >
        <div className="space-y-4 py-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Chọn đơn hàng gốc
              </label>
              <Select
                value={selectedOrderId}
                onValueChange={(v) => {
                  setSelectedOrderId(v);
                  const ord = orders.find((o) => o.id === v);
                  setReturnVariantId(ord?.itemsJson?.[0]?.variantId || "");
                }}
              >
                <TriggerSelect fluid>
                  <span>
                    {selectedOriginalOrder?.orderCode || "Chọn đơn hàng gốc..."}
                  </span>
                </TriggerSelect>
                <ContentSelect>
                  {orders.map((o) => (
                    <ItemSelect key={o.id} value={o.id}>
                      {o.orderCode} - {o.customerName}
                    </ItemSelect>
                  ))}
                </ContentSelect>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Hình thức RMA
              </label>
              <Select
                value={rmaType}
                onValueChange={(v) => setRmaType(v as OmsRmaType)}
              >
                <TriggerSelect fluid>
                  <span>{rmaType}</span>
                </TriggerSelect>
                <ContentSelect>
                  <ItemSelect value="EXCHANGE_2_WAY">
                    Đổi hàng 2 chiều (Giao mới - Thu cũ)
                  </ItemSelect>
                  <ItemSelect value="PARTIAL_RETURN">
                    Trả hàng 1 phần (Không giao mới)
                  </ItemSelect>
                  <ItemSelect value="WARRANTY_REPAIR">
                    Đổi mới bảo hành
                  </ItemSelect>
                </ContentSelect>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <GlassSurfaceCard
              header={
                <span className="text-xs font-bold text-amber-600">
                  Cột 1: Hàng thu hồi về kho
                </span>
              }
            >
              <div className="space-y-2">
                <Select
                  value={returnVariantId}
                  onValueChange={setReturnVariantId}
                >
                  <TriggerSelect fluid>
                    <span>
                      {selectedOriginalOrder?.itemsJson.find(
                        (i) => i.variantId === returnVariantId,
                      )?.variantName || "Chọn sản phẩm thu hồi..."}
                    </span>
                  </TriggerSelect>
                  <ContentSelect>
                    {(selectedOriginalOrder?.itemsJson || []).map((i) => (
                      <ItemSelect key={i.variantId} value={i.variantId}>
                        {i.variantName} ({i.skuCode}) -{" "}
                        {Number(i.finalUnitPrice).toLocaleString("vi-VN")}đ
                      </ItemSelect>
                    ))}
                  </ContentSelect>
                </Select>
                <LiquidGlassInput>
                  <input
                    type="number"
                    min={1}
                    value={returnQty}
                    onChange={(e) =>
                      setReturnQty(Math.max(1, Number(e.target.value || 1)))
                    }
                    className="w-full bg-transparent px-3 py-1.5 text-sm outline-none"
                  />
                </LiquidGlassInput>
              </div>
            </GlassSurfaceCard>

            <GlassSurfaceCard
              header={
                <span className="text-xs font-bold text-emerald-600">
                  Cột 2: Hàng giao mới đi
                </span>
              }
            >
              <div className="space-y-2">
                <Select
                  value={outboundVariantId}
                  onValueChange={setOutboundVariantId}
                  disabled={rmaType === "PARTIAL_RETURN"}
                >
                  <TriggerSelect fluid disabled={rmaType === "PARTIAL_RETURN"}>
                    <span>
                      {variants.find((v) => v.id === outboundVariantId)
                        ?.variantName || "Chọn sản phẩm giao mới..."}
                    </span>
                  </TriggerSelect>
                  <ContentSelect>
                    {variants.map((v) => (
                      <ItemSelect key={v.id} value={v.id}>
                        {v.variantName} ({v.skuCode}) -{" "}
                        {Number(v.retailPrice).toLocaleString("vi-VN")}đ
                      </ItemSelect>
                    ))}
                  </ContentSelect>
                </Select>
                <LiquidGlassInput>
                  <input
                    type="number"
                    min={1}
                    disabled={rmaType === "PARTIAL_RETURN"}
                    value={outboundQty}
                    onChange={(e) =>
                      setOutboundQty(Math.max(1, Number(e.target.value || 1)))
                    }
                    className="w-full bg-transparent px-3 py-1.5 text-sm outline-none"
                  />
                </LiquidGlassInput>
              </div>
            </GlassSurfaceCard>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <LiquidGlassInput>
              <input
                type="number"
                value={rmaShipFee}
                onChange={(e) => setRmaShipFee(Number(e.target.value || 0))}
                placeholder="Phí ship đổi hàng khách chịu (VNĐ)"
                className="w-full bg-transparent px-3 py-2 text-sm outline-none"
              />
            </LiquidGlassInput>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <Switch
                checked={refundToWallet}
                onCheckedChange={setRefundToWallet}
              />
              <span>Hoàn chênh lệch âm vào Ví tín dụng khách hàng</span>
            </label>
          </div>

          <LiquidGlassInput>
            <input
              value={reasonNote}
              onChange={(e) => setReasonNote(e.target.value)}
              placeholder="Lý do đổi trả..."
              className="w-full bg-transparent px-3 py-2 text-sm outline-none"
            />
          </LiquidGlassInput>

          <GlassSurfaceCard variant="primary" opacity="10">
            <div className="flex items-center justify-between font-bold text-sm">
              <span>Dự tính chênh lệch COD:</span>
              <span>
                {computedCodDelta >= 0
                  ? `Thu thêm COD: ${computedCodDelta.toLocaleString("vi-VN")}đ`
                  : `Hoàn khách: ${Math.abs(computedCodDelta).toLocaleString("vi-VN")}đ`}
              </span>
            </div>
          </GlassSurfaceCard>
        </div>
      </GlassModal>
    </div>
  );
}
