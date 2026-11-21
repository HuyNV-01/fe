"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowRight, Edit3, History, Lock, Printer, Truck } from "lucide-react";
import {
  ButtonBack,
  GlassAlert,
  GlassBadge,
  GlassModal,
  GlassSectionHeader,
  GlassSurfaceCard,
  LiquidGlassInput,
  PatternButton,
} from "@/components/toolkit";
import { OmsStatusBadge } from "@/components/oms/oms-status-meta";
import { usePermissionStore } from "@/lib/stores/iam/use-permission-store";
import { useOmsFulfillmentStore } from "@/lib/stores/oms/use-oms-fulfillment-store";
import type { PosOrderStatusType } from "@/types/catalog-pos";

export default function OmsOrderDetailPage() {
  const t = useTranslations("OmsFulfillment");
  const params = useParams<{ id: string }>();
  const orderId = params?.id;
  const activeShopId = usePermissionStore((s) => s.activeShopId);

  const activeOrderDetail = useOmsFulfillmentStore((s) => s.activeOrderDetail);
  const isLoading = useOmsFulfillmentStore((s) => s.isLoadingOrderDetail);
  const isSubmitting = useOmsFulfillmentStore((s) => s.isSubmitting);
  const fetchOrderDetail = useOmsFulfillmentStore((s) => s.fetchOrderDetail);
  const transitionOrderStatus = useOmsFulfillmentStore(
    (s) => s.transitionOrderStatus,
  );
  const modifyConfirmedOrder = useOmsFulfillmentStore(
    (s) => s.modifyConfirmedOrder,
  );
  const reprintShippingLabel = useOmsFulfillmentStore(
    (s) => s.reprintShippingLabel,
  );

  const [modifyModalOpen, setModifyModalOpen] = useState(false);
  const [reprintModalOpen, setReprintModalOpen] = useState(false);
  const [editCustomerName, setEditCustomerName] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editCod, setEditCod] = useState("");
  const [editReason, setEditReason] = useState("");
  const [reprintReason, setReprintReason] = useState(
    "Rách tem khi dán lên thùng hàng",
  );

  useEffect(() => {
    if (activeShopId && orderId) {
      fetchOrderDetail(activeShopId, orderId);
    }
  }, [activeShopId, orderId, fetchOrderDetail]);

  const openModifyModal = () => {
    if (!activeOrderDetail?.order) return;
    setEditCustomerName(activeOrderDetail.order.customerName);
    setEditAddress(activeOrderDetail.order.receiverAddressLine || "");
    setEditCod(String(activeOrderDetail.order.codCollectAmount || 0));
    setEditReason("");
    setModifyModalOpen(true);
  };

  const handleSaveModification = async () => {
    if (!activeShopId || !orderId || !editReason.trim()) return;
    const ok = await modifyConfirmedOrder({
      shopId: activeShopId,
      orderId,
      customerName: editCustomerName,
      receiverAddressLine: editAddress,
      codCollectAmount: Number(editCod || 0),
      reasonNote: editReason.trim(),
    });
    if (ok) setModifyModalOpen(false);
  };

  const handleReprint = async () => {
    if (!activeShopId || !orderId || !reprintReason.trim()) return;
    const ok = await reprintShippingLabel({
      shopId: activeShopId,
      orderId,
      labelFormat: "A6_100X150",
      reprintReason: reprintReason.trim(),
    });
    if (ok) setReprintModalOpen(false);
  };

  if (isLoading || !activeOrderDetail) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        {t("common.loading")}
      </div>
    );
  }

  const {
    order,
    revisions,
    carrierEvents,
    isLockedForStandardSale,
    allowedNextStatuses,
  } = activeOrderDetail;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-4">
      <div className="flex items-center gap-2">
        <ButtonBack />
        <GlassSectionHeader
          title={`Đơn hàng ${order.orderCode}`}
          subtitle={`${order.carrierCode} • Vận đơn: ${order.trackingNumber || "Chưa đẩy 3PL"}`}
          actions={
            <div className="flex items-center gap-2">
              <PatternButton
                variant="glass"
                size="sm"
                onClick={() => setReprintModalOpen(true)}
              >
                <Printer className="w-3.5 h-3.5 mr-1" />
                {t("detailPage.reprintBtn")} ({order.printedCount})
              </PatternButton>
              <PatternButton
                variant="solid"
                color="primary"
                size="sm"
                onClick={openModifyModal}
              >
                <Edit3 className="w-3.5 h-3.5 mr-1" />
                {t("detailPage.modifyBtn")}
              </PatternButton>
            </div>
          }
        />
      </div>

      {isLockedForStandardSale && (
        <GlassAlert
          variant="warning"
          icon={<Lock className="w-4 h-4 text-amber-500" />}
          title={t("detailPage.lockAlertTitle")}
          description={t("detailPage.lockAlertDesc")}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassSurfaceCard
          className="lg:col-span-2"
          header={
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm">
                {t("detailPage.itemsAndStatusTitle")}
              </span>
              <OmsStatusBadge status={order.status} />
            </div>
          }
        >
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {allowedNextStatuses.map((nextStatus: PosOrderStatusType) => (
                <PatternButton
                  key={nextStatus}
                  variant="glass"
                  size="sm"
                  isLoading={isSubmitting}
                  onClick={() =>
                    activeShopId &&
                    transitionOrderStatus({
                      shopId: activeShopId,
                      orderId: order.id,
                      targetStatus: nextStatus,
                    })
                  }
                >
                  <ArrowRight className="w-3.5 h-3.5 mr-1" />
                  Chuyển sang {nextStatus}
                </PatternButton>
              ))}
            </div>

            <div className="divide-y divide-border/40">
              {order.itemsJson.map((item) => (
                <div
                  key={item.variantId}
                  className="py-2.5 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-semibold text-sm">
                      {item.variantName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      SKU: {item.skuCode} • Barcode: {item.barcode}
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-bold">
                      x{item.quantity} •{" "}
                      {Number(item.lineTotalAmount).toLocaleString("vi-VN")}đ
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Đã quét đóng gói: {item.packedScannedQty || 0}/
                      {item.quantity}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GlassSurfaceCard>

        <GlassSurfaceCard
          header={
            <span className="font-bold text-sm">
              {t("detailPage.financialSummary")}
            </span>
          }
        >
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Khách hàng:</span>
              <span className="font-semibold">{order.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">SĐT (Che PII):</span>
              <span className="font-mono">{order.customerPhoneMasked}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Cân khai báo / Cân kho:
              </span>
              <span>
                {order.totalWeightGrams}g /{" "}
                <strong>{order.actualPackedWeightGrams ?? "—"}g</strong>
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Thu hộ COD:</span>
              <span className="font-bold text-primary">
                {Number(order.codCollectAmount).toLocaleString("vi-VN")}đ
              </span>
            </div>
          </div>
        </GlassSurfaceCard>
      </div>

      {/* Lịch sử chỉnh sửa Before <-> After (F07.2) */}
      <GlassSurfaceCard
        header={
          <div className="flex items-center gap-2 font-bold text-sm">
            <History className="w-4 h-4 text-primary" />
            <span>
              {t("detailPage.revisionHistoryTitle")} ({revisions.length})
            </span>
          </div>
        }
      >
        <div className="space-y-3">
          {revisions.map((rev) => (
            <div
              key={rev.id}
              className="p-3 rounded-xl border border-border/50 space-y-2"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold">
                  #{rev.revisionNumber} • {rev.actionType} ({rev.changedByName})
                </span>
                <span className="text-muted-foreground">
                  {new Date(rev.createdAt).toLocaleString("vi-VN")}
                </span>
              </div>
              {rev.reasonNote && (
                <p className="text-xs text-muted-foreground">
                  Lý do: {rev.reasonNote}
                </p>
              )}
              {rev.diffSummaryJson.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {rev.diffSummaryJson.map((d) => (
                    <div key={d.field} className="p-2 rounded-lg bg-muted/40">
                      <div className="font-semibold">{d.label}</div>
                      <div className="text-red-500 line-through">
                        Trước: {JSON.stringify(d.beforeValue)}
                      </div>
                      <div className="text-emerald-600 font-medium">
                        Sau: {JSON.stringify(d.afterValue)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </GlassSurfaceCard>

      {/* Hành trình vận chuyển 3PL */}
      <GlassSurfaceCard
        header={
          <div className="flex items-center gap-2 font-bold text-sm">
            <Truck className="w-4 h-4 text-primary" />
            <span>
              {t("detailPage.carrierTimelineTitle")} ({carrierEvents.length})
            </span>
          </div>
        }
      >
        <div className="space-y-2">
          {carrierEvents.map((evt) => (
            <div
              key={evt.id}
              className="flex items-start justify-between gap-3 py-2 border-b border-border/30 text-xs"
            >
              <div>
                <div className="font-semibold">{evt.description}</div>
                <div className="text-muted-foreground">
                  {evt.carrierCode} • {evt.carrierRawStatus}{" "}
                  {evt.locationHubName ? `• ${evt.locationHubName}` : ""}
                </div>
              </div>
              <GlassBadge variant="secondary">
                {new Date(evt.eventOccurredAt).toLocaleString("vi-VN")}
              </GlassBadge>
            </div>
          ))}
        </div>
      </GlassSurfaceCard>

      <GlassModal
        open={modifyModalOpen}
        onOpenChange={setModifyModalOpen}
        title={t("detailPage.modifyModalTitle")}
        description={t("detailPage.modifyModalDesc")}
        footer={
          <>
            <PatternButton
              variant="ghost"
              size="sm"
              onClick={() => setModifyModalOpen(false)}
            >
              {t("common.cancel")}
            </PatternButton>
            <PatternButton
              variant="solid"
              color="primary"
              size="sm"
              isLoading={isSubmitting}
              onClick={handleSaveModification}
            >
              {t("common.save")}
            </PatternButton>
          </>
        }
      >
        <div className="space-y-3 py-1">
          <LiquidGlassInput>
            <input
              value={editCustomerName}
              onChange={(e) => setEditCustomerName(e.target.value)}
              placeholder="Tên người nhận"
              className="w-full bg-transparent px-3 py-2 text-sm outline-none"
            />
          </LiquidGlassInput>
          <LiquidGlassInput>
            <input
              value={editAddress}
              onChange={(e) => setEditAddress(e.target.value)}
              placeholder="Địa chỉ giao hàng"
              className="w-full bg-transparent px-3 py-2 text-sm outline-none"
            />
          </LiquidGlassInput>
          <LiquidGlassInput>
            <input
              type="number"
              value={editCod}
              onChange={(e) => setEditCod(e.target.value)}
              placeholder="Tiền thu hộ COD (VNĐ)"
              className="w-full bg-transparent px-3 py-2 text-sm outline-none"
            />
          </LiquidGlassInput>
          <LiquidGlassInput>
            <input
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              placeholder="Bắt buộc nhập lý do sửa đơn..."
              className="w-full bg-transparent px-3 py-2 text-sm outline-none"
            />
          </LiquidGlassInput>
        </div>
      </GlassModal>

      <GlassModal
        open={reprintModalOpen}
        onOpenChange={setReprintModalOpen}
        title={t("detailPage.reprintModalTitle")}
        description={t("detailPage.reprintModalDesc")}
        footer={
          <>
            <PatternButton
              variant="ghost"
              size="sm"
              onClick={() => setReprintModalOpen(false)}
            >
              {t("common.cancel")}
            </PatternButton>
            <PatternButton
              variant="solid"
              color="warning"
              size="sm"
              isLoading={isSubmitting}
              onClick={handleReprint}
            >
              <Printer className="w-3.5 h-3.5 mr-1" />
              In lại phiếu A6
            </PatternButton>
          </>
        }
      >
        <LiquidGlassInput>
          <input
            value={reprintReason}
            onChange={(e) => setReprintReason(e.target.value)}
            placeholder="Nhập lý do in lại phiếu vận đơn..."
            className="w-full bg-transparent px-3 py-2 text-sm outline-none"
          />
        </LiquidGlassInput>
      </GlassModal>
    </div>
  );
}
