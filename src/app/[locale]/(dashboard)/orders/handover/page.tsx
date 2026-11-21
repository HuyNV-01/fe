"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Barcode,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  ExternalLink,
  PhoneCall,
  Plus,
  Printer,
  RefreshCw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  ContentSelect,
  GlassAlert,
  GlassBadge,
  GlassConfirmDialog,
  GlassEmptyState,
  GlassSectionHeader,
  GlassSurfaceCard,
  GlassTabs,
  ItemSelect,
  LiquidGlassInput,
  PatternButton,
  ScrollArea,
  ScrollBar,
  TriggerSelect,
  TruncatedText,
} from "@/components/toolkit";
import { OmsStatusBadge, OmsSubNavBar } from "@/components/oms/oms-status-meta";
import config from "@/config";
import { useCatalogPosStore } from "@/lib/stores/catalog-pos/use-catalog-pos-store";
import { usePermissionStore } from "@/lib/stores/iam/use-permission-store";
import { omsPancakeOpsApi } from "@/lib/stores/oms/api";
import type {
  ICallLaterQueueResponse,
  ICarrierHandoverManifest,
} from "@/types/oms";
import { useHardwareBarcodeScanner } from "@/utils/hooks/use-hardware-barcode-scanner";

const CARRIER_OPTIONS = [
  { value: "GHN", label: "GHN (Giao Hàng Nhanh)" },
  { value: "GHTK", label: "GHTK (Giao Hàng Tiết Kiệm)" },
  { value: "VTP", label: "Viettel Post" },
  { value: "JT", label: "J&T Express" },
  { value: "SPX", label: "SPX Express" },
];

export default function OmsHandoverAndCallLaterPage() {
  const t = useTranslations("OmsFulfillment");
  const activeShopId = usePermissionStore((s) => s.activeShopId);
  const warehouses = useCatalogPosStore((s) => s.warehouses);
  const fetchCatalogAndStock = useCatalogPosStore(
    (s) => s.fetchCatalogAndStock,
  );

  const [activeTab, setActiveTab] = useState<"handover" | "call_later">(
    "handover",
  );
  const [manifests, setManifests] = useState<ICarrierHandoverManifest[]>([]);
  const [activeManifest, setActiveManifest] =
    useState<ICarrierHandoverManifest | null>(null);
  const [callLaterQueue, setCallLaterQueue] =
    useState<ICallLaterQueueResponse | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    variant: "success" | "danger" | "warning" | "info";
    message: string;
  } | null>(null);

  // Form tạo biên bản bàn giao mới
  const [warehouseId, setWarehouseId] = useState("");
  const [carrierCode, setCarrierCode] = useState("GHN");
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [scanInput, setScanInput] = useState("");
  const [confirmSealOpen, setConfirmSealOpen] = useState(false);

  const openPrintableWindow = (htmlContent: string) => {
    const win = window.open("", "_blank", "width=900,height=720");
    if (!win) return;
    win.document.open();
    win.document.write(htmlContent);
    win.document.close();
    setTimeout(() => {
      win.focus();
      win.print();
    }, 250);
  };

  const loadData = useCallback(async () => {
    if (!activeShopId) return;
    setIsLoading(true);
    try {
      const [manifestRes, queueRes] = await Promise.all([
        omsPancakeOpsApi.listHandoverManifests(activeShopId),
        omsPancakeOpsApi.listCallLaterQueue(activeShopId),
      ]);
      const list = manifestRes.data?.data || [];
      setManifests(list);
      setActiveManifest((prev) => {
        if (!prev) {
          return (
            list.find((m) => m.status === "DRAFT_SCANNING") || list[0] || null
          );
        }
        return list.find((m) => m.id === prev.id) || list[0] || null;
      });
      setCallLaterQueue(queueRes.data?.data || null);
    } finally {
      setIsLoading(false);
    }
  }, [activeShopId]);

  useEffect(() => {
    if (!activeShopId) return;
    void fetchCatalogAndStock({ shopId: activeShopId });
    loadData();
  }, [activeShopId, fetchCatalogAndStock, loadData]);

  useEffect(() => {
    if (!warehouseId && warehouses.length > 0) {
      setWarehouseId(warehouses[0].id);
    }
  }, [warehouseId, warehouses]);

  const handleScanCode = useCallback(
    async (code: string) => {
      if (
        !activeShopId ||
        !activeManifest ||
        activeManifest.status !== "DRAFT_SCANNING" ||
        !code.trim()
      ) {
        return;
      }
      setIsSubmitting(true);
      try {
        const res = await omsPancakeOpsApi.scanOrderIntoHandover(
          activeShopId,
          activeManifest.id,
          code.trim(),
        );
        const updated = res.data?.data?.manifest;
        const item = res.data?.data?.scannedItem;
        if (updated) {
          setActiveManifest(updated);
          setManifests((prev) =>
            prev.map((m) => (m.id === updated.id ? updated : m)),
          );
          setFeedbackBanner({
            variant: "success",
            message: t("handoverPage.scanSuccessMsg", {
              orderCode: item?.orderCode || code,
              tracking: item?.trackingNumber || code,
            }),
          });
        }
      } catch (err: any) {
        setFeedbackBanner({
          variant: "danger",
          message:
            err?.response?.data?.message || t("handoverPage.scanFailedMsg"),
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [activeShopId, activeManifest, t],
  );

  // Tự động bắt xung súng bắn mã vạch khi đang đứng ở Tab Bàn giao và có biên bản mở
  useHardwareBarcodeScanner({
    enabled:
      activeTab === "handover" &&
      Boolean(activeManifest && activeManifest.status === "DRAFT_SCANNING"),
    onScan: (code) => {
      handleScanCode(code);
    },
  });

  const handleCreateManifest = async () => {
    if (!activeShopId || !warehouseId) return;
    setIsSubmitting(true);
    try {
      const res = await omsPancakeOpsApi.createHandoverManifest(activeShopId, {
        warehouseId,
        carrierCode,
        courierDriverName: driverName.trim() || undefined,
        courierDriverPhone: driverPhone.trim() || undefined,
        courierVehiclePlate: vehiclePlate.trim() || undefined,
      });
      const created = res.data?.data;
      if (created) {
        setManifests((prev) => [created, ...prev]);
        setActiveManifest(created);
        setDriverName("");
        setDriverPhone("");
        setVehiclePlate("");
        setFeedbackBanner({
          variant: "info",
          message: t("handoverPage.manifestCreatedMsg", {
            code: created.manifestCode,
          }),
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSealManifest = async () => {
    if (!activeShopId || !activeManifest) return;
    setIsSubmitting(true);
    try {
      const res = await omsPancakeOpsApi.sealHandoverManifest(
        activeShopId,
        activeManifest.id,
        {
          courierDriverName: activeManifest.courierDriverName || undefined,
          courierDriverPhone: activeManifest.courierDriverPhone || undefined,
        },
      );
      const data = res.data?.data;
      if (data?.manifest) {
        setActiveManifest(data.manifest);
        setManifests((prev) =>
          prev.map((m) => (m.id === data.manifest.id ? data.manifest : m)),
        );
        setFeedbackBanner({
          variant: "success",
          message: t("handoverPage.sealedSuccessMsg", {
            code: data.manifest.manifestCode,
            count: data.handedOverCount,
          }),
        });
        if (data.printableHtmlTemplate) {
          openPrintableWindow(data.printableHtmlTemplate);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearCallLater = async (
    orderId: string,
    existingTags: string[],
  ) => {
    if (!activeShopId) return;
    setIsSubmitting(true);
    try {
      await omsPancakeOpsApi.updateOrderTags(activeShopId, orderId, {
        orderTags: existingTags,
        subStatus: "CONFIRMED_BY_PHONE",
        clearCallLater: true,
      });
      await loadData();
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedWarehouseName =
    warehouses.find((w) => w.id === warehouseId)?.name ||
    t("handoverPage.selectWarehousePlaceholder");

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-4">
      <GlassSectionHeader
        icon={<ClipboardCheck className="w-5 h-5" />}
        title={t("handoverPage.title")}
        subtitle={t("handoverPage.subtitle")}
        actions={
          <PatternButton
            type="button"
            variant="glass"
            size="sm"
            rounded="full"
            isLoading={isLoading}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={loadData}
          >
            {t("common.refresh")}
          </PatternButton>
        }
      />

      <OmsSubNavBar />

      <GlassTabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as "handover" | "call_later")}
        items={[
          {
            key: "handover",
            label: t("handoverPage.tabs.handover"),
            icon: <Barcode className="w-3.5 h-3.5" />,
            badge: manifests.length,
          },
          {
            key: "call_later",
            label: t("handoverPage.tabs.callLater"),
            icon: <PhoneCall className="w-3.5 h-3.5" />,
            badge: callLaterQueue?.totalCount || 0,
          },
        ]}
      />

      {feedbackBanner && (
        <GlassAlert
          variant={feedbackBanner.variant}
          description={feedbackBanner.message}
          dismissible
          onDismiss={() => setFeedbackBanner(null)}
        />
      )}

      {activeTab === "handover" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Cột trái: Tạo biên bản & danh sách biên bản gần nhất */}
          <div className="space-y-4">
            <GlassSurfaceCard className="p-4 space-y-3">
              <h3 className="text-sm font-bold">
                {t("handoverPage.createManifestTitle")}
              </h3>
              <div className="space-y-2">
                <Select value={warehouseId} onValueChange={setWarehouseId}>
                  <TriggerSelect fluid size="sm" className="text-xs">
                    <span>{selectedWarehouseName}</span>
                  </TriggerSelect>
                  <ContentSelect>
                    {warehouses.map((w) => (
                      <ItemSelect key={w.id} value={w.id}>
                        {w.name}
                      </ItemSelect>
                    ))}
                  </ContentSelect>
                </Select>

                <Select value={carrierCode} onValueChange={setCarrierCode}>
                  <TriggerSelect fluid size="sm" className="text-xs">
                    <span>
                      {CARRIER_OPTIONS.find((c) => c.value === carrierCode)
                        ?.label || carrierCode}
                    </span>
                  </TriggerSelect>
                  <ContentSelect>
                    {CARRIER_OPTIONS.map((c) => (
                      <ItemSelect key={c.value} value={c.value}>
                        {c.label}
                      </ItemSelect>
                    ))}
                  </ContentSelect>
                </Select>

                <Input
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder={t("handoverPage.driverNamePlaceholder")}
                  className="h-9 text-xs"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    placeholder={t("handoverPage.driverPhonePlaceholder")}
                    className="h-9 text-xs"
                  />
                  <Input
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value)}
                    placeholder={t("handoverPage.vehiclePlatePlaceholder")}
                    className="h-9 text-xs"
                  />
                </div>
                <PatternButton
                  type="button"
                  variant="solid"
                  color="primary"
                  size="sm"
                  rounded="full"
                  fullWidth
                  isLoading={isSubmitting}
                  disabled={!warehouseId}
                  icon={<Plus className="w-4 h-4" />}
                  onClick={handleCreateManifest}
                >
                  {t("handoverPage.createManifestBtn")}
                </PatternButton>
              </div>
            </GlassSurfaceCard>

            <GlassSurfaceCard className="p-4 space-y-2.5">
              <h3 className="text-sm font-bold">
                {t("handoverPage.recentManifestsTitle")}
              </h3>
              {manifests.length === 0 ? (
                <GlassEmptyState
                  title={t("handoverPage.emptyManifestTitle")}
                  description={t("handoverPage.emptyManifestDesc")}
                />
              ) : (
                <div className="space-y-2">
                  {manifests.map((m) => {
                    const isSelected = activeManifest?.id === m.id;
                    return (
                      <PatternButton
                        key={m.id}
                        type="button"
                        variant={isSelected ? "glass" : "outline"}
                        color={isSelected ? "primary" : "neutral"}
                        fullWidth
                        contentAlign="between"
                        className="h-auto py-2.5 px-3 text-left"
                        onClick={() => setActiveManifest(m)}
                      >
                        <div className="flex items-center justify-between gap-2 w-full">
                          <div className="min-w-0">
                            <div className="text-xs font-bold font-mono truncate">
                              {m.manifestCode}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {m.carrierCode} • {m.totalParcelsCount}{" "}
                              {t("handoverPage.parcelsUnit")}
                            </div>
                          </div>
                          <GlassBadge
                            variant={
                              m.status === "SEALED_HANDED_OVER"
                                ? "success"
                                : "warning"
                            }
                            size="sm"
                          >
                            {t(`handoverPage.status.${m.status}`)}
                          </GlassBadge>
                        </div>
                      </PatternButton>
                    );
                  })}
                </div>
              )}
            </GlassSurfaceCard>
          </div>

          {/* Cột phải: Bàn quét Barcode kiện hàng & chốt biên bản */}
          <div className="lg:col-span-2 space-y-4">
            {!activeManifest ? (
              <GlassSurfaceCard className="p-8">
                <GlassEmptyState
                  icon={<Barcode className="w-8 h-8" />}
                  title={t("handoverPage.selectManifestTitle")}
                  description={t("handoverPage.selectManifestDesc")}
                />
              </GlassSurfaceCard>
            ) : (
              <GlassSurfaceCard className="p-4 sm:p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold font-mono">
                        {activeManifest.manifestCode}
                      </span>
                      <GlassBadge variant="info" size="sm">
                        {activeManifest.carrierCode}
                      </GlassBadge>
                      <GlassBadge
                        variant={
                          activeManifest.status === "SEALED_HANDED_OVER"
                            ? "success"
                            : "warning"
                        }
                        size="sm"
                      >
                        {t(`handoverPage.status.${activeManifest.status}`)}
                      </GlassBadge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {activeManifest.warehouseName} •{" "}
                      {activeManifest.totalParcelsCount}{" "}
                      {t("handoverPage.parcelsUnit")} •{" "}
                      {activeManifest.totalWeightGrams}g •{" "}
                      {Number(
                        activeManifest.totalCodAmount || 0,
                      ).toLocaleString("vi-VN")}
                      đ
                    </p>
                  </div>

                  {activeManifest.status === "DRAFT_SCANNING" && (
                    <PatternButton
                      type="button"
                      variant="solid"
                      color="success"
                      size="sm"
                      rounded="full"
                      disabled={activeManifest.totalParcelsCount === 0}
                      isLoading={isSubmitting}
                      icon={<Printer className="w-3.5 h-3.5" />}
                      onClick={() => setConfirmSealOpen(true)}
                    >
                      {t("handoverPage.sealAndPrintBtn")}
                    </PatternButton>
                  )}
                </div>

                {activeManifest.status === "DRAFT_SCANNING" && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleScanCode(scanInput);
                      setScanInput("");
                    }}
                    className="flex flex-col sm:flex-row gap-2.5"
                  >
                    <LiquidGlassInput className="flex-1">
                      <input
                        value={scanInput}
                        onChange={(e) => setScanInput(e.target.value)}
                        placeholder={t("handoverPage.scanInputPlaceholder")}
                        className="w-full bg-transparent px-3 py-2 text-sm outline-none font-mono"
                      />
                    </LiquidGlassInput>
                    <PatternButton
                      type="submit"
                      variant="solid"
                      color="primary"
                      size="sm"
                      rounded="full"
                      isLoading={isSubmitting}
                      icon={<Barcode className="w-4 h-4" />}
                    >
                      {t("handoverPage.scanSubmitBtn")}
                    </PatternButton>
                  </form>
                )}

                <ScrollArea className="w-full">
                  <table className="w-full text-left text-xs border-collapse min-w-[640px]">
                    <thead>
                      <tr className="border-b border-border/50 text-muted-foreground">
                        <th className="py-2 px-2">#</th>
                        <th className="py-2 px-2">
                          {t("table.carrierTracking")}
                        </th>
                        <th className="py-2 px-2">{t("table.orderCode")}</th>
                        <th className="py-2 px-2">{t("table.customer")}</th>
                        <th className="py-2 px-2 text-right">
                          {t("handoverPage.weightCol")}
                        </th>
                        <th className="py-2 px-2 text-right">
                          {t("table.codAmount")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(activeManifest.scannedOrdersJson || []).map(
                        (item, idx) => (
                          <tr
                            key={item.orderId}
                            className="border-b border-border/30"
                          >
                            <td className="py-2.5 px-2">{idx + 1}</td>
                            <td className="py-2.5 px-2 font-mono font-bold">
                              {item.trackingNumber}
                            </td>
                            <td className="py-2.5 px-2 font-semibold">
                              {item.orderCode}
                            </td>
                            <td className="py-2.5 px-2">{item.customerName}</td>
                            <td className="py-2.5 px-2 text-right">
                              {item.actualPackedWeightGrams}g
                            </td>
                            <td className="py-2.5 px-2 text-right font-bold">
                              {item.codCollectAmount.toLocaleString("vi-VN")}đ
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </GlassSurfaceCard>
            )}
          </div>
        </div>
      ) : (
        /* Tab 2: Hàng đợi Hẹn Gọi Lại Xác Nhận Đơn (Pancake POS Call Later) */
        <GlassSurfaceCard className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <GlassBadge variant="danger" size="md">
              <Clock className="w-3.5 h-3.5" />
              {t("handoverPage.overdueBadge", {
                count: callLaterQueue?.overdueCount || 0,
              })}
            </GlassBadge>
            <GlassBadge variant="info" size="md">
              {t("handoverPage.upcomingBadge", {
                count: callLaterQueue?.upcomingCount || 0,
              })}
            </GlassBadge>
          </div>

          {!callLaterQueue || callLaterQueue.orders.length === 0 ? (
            <GlassEmptyState
              icon={<PhoneCall className="w-7 h-7" />}
              title={t("handoverPage.emptyCallLaterTitle")}
              description={t("handoverPage.emptyCallLaterDesc")}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {callLaterQueue.orders.map((order) => {
                const isOverdue = Boolean(
                  order.callLaterAt &&
                    new Date(order.callLaterAt).getTime() < Date.now(),
                );
                return (
                  <GlassSurfaceCard key={order.id} className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold font-mono">
                            {order.orderCode}
                          </span>
                          <OmsStatusBadge status={order.status} />
                          <GlassBadge
                            variant={isOverdue ? "danger" : "warning"}
                            size="sm"
                          >
                            {t("handoverPage.attemptBadge", {
                              count: order.callAttemptCount || 1,
                            })}
                          </GlassBadge>
                        </div>
                        <TruncatedText className="text-xs text-muted-foreground mt-0.5">
                          {order.customerName} ({order.customerPhoneMasked})
                        </TruncatedText>
                      </div>
                      <Link href={config.routes.private.orderDetail(order.id)}>
                        <PatternButton variant="ghost" size="sm" rounded="full">
                          <ExternalLink className="w-3.5 h-3.5 mr-1" />
                          {t("common.detail")}
                        </PatternButton>
                      </Link>
                    </div>

                    {order.lastCallNote && (
                      <p className="text-xs text-foreground/90 bg-muted/20 p-2 rounded-lg">
                        {order.lastCallNote}
                      </p>
                    )}

                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {(order.orderTagsJson || []).map((tag) => (
                          <GlassBadge key={tag} variant="accent" size="sm">
                            {tag}
                          </GlassBadge>
                        ))}
                      </div>
                      <PatternButton
                        type="button"
                        variant="solid"
                        color="success"
                        size="sm"
                        rounded="full"
                        isLoading={isSubmitting}
                        icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                        onClick={() =>
                          handleClearCallLater(
                            order.id,
                            order.orderTagsJson || [],
                          )
                        }
                      >
                        {t("handoverPage.markConfirmedBtn")}
                      </PatternButton>
                    </div>
                  </GlassSurfaceCard>
                );
              })}
            </div>
          )}
        </GlassSurfaceCard>
      )}

      <GlassConfirmDialog
        open={confirmSealOpen}
        onOpenChange={setConfirmSealOpen}
        title={t("handoverPage.sealConfirmTitle")}
        description={t("handoverPage.sealConfirmDesc", {
          count: activeManifest?.totalParcelsCount || 0,
          carrier: activeManifest?.carrierCode || "",
        })}
        variant="primary"
        isLoading={isSubmitting}
        onConfirm={handleSealManifest}
      />
    </div>
  );
}
