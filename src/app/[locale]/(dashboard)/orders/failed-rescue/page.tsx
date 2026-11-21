"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  Clock,
  Copy,
  Edit,
  PhoneCall,
  RefreshCcw,
  ShieldAlert,
  XOctagon,
} from "lucide-react";
import {
  GlassAlert,
  GlassBadge,
  GlassEmptyState,
  GlassModal,
  GlassSectionHeader,
  GlassSurfaceCard,
  GlassTabs,
  LiquidGlassInput,
  PatternButton,
} from "@/components/toolkit";
import { OmsStatusBadge, OmsSubNavBar } from "@/components/oms/oms-status-meta";
import { usePermissionStore } from "@/lib/stores/iam/use-permission-store";
import { useOmsFulfillmentStore } from "@/lib/stores/oms/use-oms-fulfillment-store";
import type { IOmsOrder, OmsCarrierRescueActionType } from "@/types/oms";
import { toast } from "sonner";

export default function FailedRescuePage() {
  const t = useTranslations("OmsFulfillment");
  const activeShopId = usePermissionStore((s) => s.activeShopId);

  const failedRescueOrders = useOmsFulfillmentStore(
    (s) => s.failedRescueOrders,
  );
  const slaBreachedOrders = useOmsFulfillmentStore((s) => s.slaBreachedOrders);
  const totalCodAtRisk = useOmsFulfillmentStore((s) => s.totalCodAtRisk);
  const isSubmitting = useOmsFulfillmentStore((s) => s.isSubmitting);
  const fetchFailedRescueCenter = useOmsFulfillmentStore(
    (s) => s.fetchFailedRescueCenter,
  );
  const executeRescueAction = useOmsFulfillmentStore(
    (s) => s.executeRescueAction,
  );
  const triggerSlaWatchdogScan = useOmsFulfillmentStore(
    (s) => s.triggerSlaWatchdogScan,
  );

  const [tab, setTab] = useState<"FAILED" | "SLA">("FAILED");
  const [selectedOrder, setSelectedOrder] = useState<IOmsOrder | null>(null);
  const [actionType, setActionType] =
    useState<OmsCarrierRescueActionType>("REDELIVER");
  const [preferredSlot, setPreferredSlot] = useState("Chiều nay 14:00 - 17:30");
  const [noteToCarrier, setNoteToCarrier] = useState("");
  const [updatedAddress, setUpdatedAddress] = useState("");
  const [updatedCod, setUpdatedCod] = useState("");
  const [suggestedMsg, setSuggestedMsg] = useState<string | null>(null);

  useEffect(() => {
    if (activeShopId) {
      fetchFailedRescueCenter(activeShopId);
    }
  }, [activeShopId, fetchFailedRescueCenter]);

  const openActionModal = (
    order: IOmsOrder,
    action: OmsCarrierRescueActionType,
  ) => {
    setSelectedOrder(order);
    setActionType(action);
    setNoteToCarrier("");
    setUpdatedAddress(order.receiverAddressLine || "");
    setUpdatedCod(String(order.codCollectAmount || 0));
  };

  const handleSubmitAction = async () => {
    if (!activeShopId || !selectedOrder) return;
    const msg = await executeRescueAction({
      shopId: activeShopId,
      orderId: selectedOrder.id,
      action: actionType,
      preferredDeliverySlot:
        actionType === "REDELIVER" ? preferredSlot : undefined,
      noteToCarrier: noteToCarrier.trim() || undefined,
      updatedReceiverAddress:
        actionType === "UPDATE_RECEIVER" ? updatedAddress : undefined,
      updatedCodAmount:
        actionType === "UPDATE_RECEIVER" ? Number(updatedCod || 0) : undefined,
    });
    setSelectedOrder(null);
    if (msg) setSuggestedMsg(msg);
  };

  const displayList = tab === "FAILED" ? failedRescueOrders : slaBreachedOrders;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-4">
      <GlassSectionHeader
        icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
        title={t("rescuePage.title")}
        subtitle={t("rescuePage.subtitle")}
        actions={
          <PatternButton
            variant="glass"
            color="warning"
            size="sm"
            onClick={() => activeShopId && triggerSlaWatchdogScan(activeShopId)}
          >
            <ShieldAlert className="w-3.5 h-3.5 mr-1.5" />
            {t("rescuePage.scanSlaBtn")}
          </PatternButton>
        }
      />

      <OmsSubNavBar />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <GlassSurfaceCard>
          <div className="text-xs text-muted-foreground">
            Đơn giao thất bại cần cứu gấp
          </div>
          <div className="text-2xl font-black text-red-500 mt-1">
            {failedRescueOrders.length}
          </div>
        </GlassSurfaceCard>
        <GlassSurfaceCard>
          <div className="text-xs text-muted-foreground">
            Tổng tiền COD đang có nguy cơ hoàn
          </div>
          <div className="text-2xl font-black text-amber-500 mt-1">
            {totalCodAtRisk.toLocaleString("vi-VN")}đ
          </div>
        </GlassSurfaceCard>
        <GlassSurfaceCard>
          <div className="text-xs text-muted-foreground">
            Đơn vi phạm SLA ngâm kho / trung chuyển
          </div>
          <div className="text-2xl font-black text-primary mt-1">
            {slaBreachedOrders.length}
          </div>
        </GlassSurfaceCard>
      </div>

      {suggestedMsg && (
        <GlassAlert
          variant="info"
          dismissible
          onDismiss={() => setSuggestedMsg(null)}
          title="Mẫu tin nhắn Botcake / Zalo ZNS cứu đơn gợi ý"
          description={suggestedMsg}
          action={
            <PatternButton
              variant="glass"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(suggestedMsg);
                toast.success("Đã sao chép mẫu tin nhắn cứu đơn!");
              }}
            >
              <Copy className="w-3.5 h-3.5 mr-1" />
              Sao chép gửi khách
            </PatternButton>
          }
        />
      )}

      <GlassTabs
        value={tab}
        onValueChange={(v) => setTab(v as "FAILED" | "SLA")}
        items={[
          {
            key: "FAILED",
            label: "🚨 Giao thất bại cần cứu",
            badge: failedRescueOrders.length,
          },
          {
            key: "SLA",
            label: "⏱️ Đơn ngâm quá hạn SLA",
            badge: slaBreachedOrders.length,
          },
        ]}
      />

      {displayList.length === 0 ? (
        <GlassSurfaceCard>
          <GlassEmptyState
            title="Không có đơn hàng nào gặp sự cố giao nhận"
            description="Toàn bộ vận đơn đang vận hành đúng tiến độ SLA."
          />
        </GlassSurfaceCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayList.map((order) => (
            <GlassSurfaceCard
              key={order.id}
              header={
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-bold text-sm">
                      {order.orderCode} • {order.carrierCode} (
                      {order.trackingNumber || "—"})
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {order.customerName} ({order.customerPhoneMasked})
                    </div>
                  </div>
                  <OmsStatusBadge status={order.status} />
                </div>
              }
              footer={
                <div className="flex flex-wrap gap-2">
                  <PatternButton
                    variant="solid"
                    color="primary"
                    size="sm"
                    onClick={() => openActionModal(order, "REDELIVER")}
                  >
                    <RefreshCcw className="w-3.5 h-3.5 mr-1" />
                    Giục phát lại
                  </PatternButton>
                  <PatternButton
                    variant="glass"
                    size="sm"
                    onClick={() => openActionModal(order, "UPDATE_RECEIVER")}
                  >
                    <Edit className="w-3.5 h-3.5 mr-1" />
                    Đổi thông tin
                  </PatternButton>
                  <PatternButton
                    variant="glass"
                    color="danger"
                    size="sm"
                    onClick={() => openActionModal(order, "APPROVE_RETURN")}
                  >
                    <XOctagon className="w-3.5 h-3.5 mr-1" />
                    Duyệt hoàn sớm
                  </PatternButton>
                </div>
              }
            >
              <div className="space-y-2 text-xs">
                <div className="text-red-500 font-semibold">
                  Lý do:{" "}
                  {order.lastDeliveryFailReason ||
                    `Vi phạm SLA ${order.slaBreachType}`}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <PhoneCall className="w-3.5 h-3.5" />
                    Bưu tá: {order.shipperName || "Chưa rõ"} (
                    {order.shipperPhone || "—"})
                  </span>
                  {order.rescueDeadlineAt && (
                    <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
                      <Clock className="w-3.5 h-3.5" />
                      Hạn cứu:{" "}
                      {new Date(order.rescueDeadlineAt).toLocaleString("vi-VN")}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span>Thu hộ COD:</span>
                  <GlassBadge variant="warning">
                    {Number(order.codCollectAmount).toLocaleString("vi-VN")}đ
                  </GlassBadge>
                </div>
              </div>
            </GlassSurfaceCard>
          ))}
        </div>
      )}

      <GlassModal
        open={Boolean(selectedOrder)}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
        title={`Gửi lệnh ${actionType} tới ${selectedOrder?.carrierCode || "3PL"}`}
        description={`Đơn hàng ${selectedOrder?.orderCode} • Vận đơn ${selectedOrder?.trackingNumber || "—"}`}
        footer={
          <>
            <PatternButton
              variant="ghost"
              size="sm"
              onClick={() => setSelectedOrder(null)}
            >
              {t("common.cancel")}
            </PatternButton>
            <PatternButton
              variant="solid"
              color={actionType === "APPROVE_RETURN" ? "danger" : "primary"}
              size="sm"
              isLoading={isSubmitting}
              onClick={handleSubmitAction}
            >
              Xác nhận gửi 3PL
            </PatternButton>
          </>
        }
      >
        <div className="space-y-3 py-1">
          {actionType === "REDELIVER" && (
            <LiquidGlassInput>
              <input
                value={preferredSlot}
                onChange={(e) => setPreferredSlot(e.target.value)}
                placeholder="Khung giờ giao lại (VD: Chiều nay 14h-17h)"
                className="w-full bg-transparent px-3 py-2 text-sm outline-none"
              />
            </LiquidGlassInput>
          )}
          {actionType === "UPDATE_RECEIVER" && (
            <>
              <LiquidGlassInput>
                <input
                  value={updatedAddress}
                  onChange={(e) => setUpdatedAddress(e.target.value)}
                  placeholder="Địa chỉ nhận hàng mới"
                  className="w-full bg-transparent px-3 py-2 text-sm outline-none"
                />
              </LiquidGlassInput>
              <LiquidGlassInput>
                <input
                  type="number"
                  value={updatedCod}
                  onChange={(e) => setUpdatedCod(e.target.value)}
                  placeholder="Số tiền COD mới (VNĐ)"
                  className="w-full bg-transparent px-3 py-2 text-sm outline-none"
                />
              </LiquidGlassInput>
            </>
          )}
          <LiquidGlassInput>
            <input
              value={noteToCarrier}
              onChange={(e) => setNoteToCarrier(e.target.value)}
              placeholder="Ghi chú gửi trực tiếp cho bưu cục phát..."
              className="w-full bg-transparent px-3 py-2 text-sm outline-none"
            />
          </LiquidGlassInput>
        </div>
      </GlassModal>
    </div>
  );
}
