"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  CheckSquare,
  ClipboardList,
  Clock,
  ExternalLink,
  Printer,
  RefreshCw,
  Send,
  Truck,
} from "lucide-react";
import {
  ContentSelect,
  GlassAlert,
  GlassBadge,
  GlassEmptyState,
  GlassModal,
  GlassSectionHeader,
  GlassSurfaceCard,
  GlassTabs,
  ItemSelect,
  LiquidGlassInput,
  PatternButton,
  ScrollArea,
  ScrollBar,
  TriggerSelect,
  type GlassTabItem,
} from "@/components/toolkit";
import { Select } from "@/components/ui/select";
import { OmsStatusBadge, OmsSubNavBar } from "@/components/oms/oms-status-meta";
import config from "@/config";
import { usePermissionStore } from "@/lib/stores/iam/use-permission-store";
import { omsPancakeOpsApi } from "@/lib/stores/oms/api";
import { useOmsFulfillmentStore } from "@/lib/stores/oms/use-oms-fulfillment-store";
import type { PosOrderStatusType } from "@/types/catalog-pos";
import type { IWavePicklistResult, ThermalLabelFormatType } from "@/types/oms";

type FilterStatusTab = "ALL" | PosOrderStatusType;

const BATCH_PRINT_FORMATS: Array<{
  value: ThermalLabelFormatType;
  label: string;
}> = [
  { value: "A7_74X105", label: "Nhiệt A7 (74 × 105mm)" },
  { value: "A6_100X150", label: "Nhiệt A6 (100 × 150mm)" },
  { value: "K80_80X80", label: "Nhiệt K80 (80 × 80mm)" },
  { value: "K80_80X100", label: "Nhiệt K80 (80 × 100mm)" },
  { value: "K58_58X80", label: "Nhiệt K58 (58 × 80mm)" },
  { value: "LABEL_75X100", label: "Tem 75 × 100mm" },
  { value: "A5_148X210", label: "Khổ A5 (148 × 210mm)" },
  { value: "A4_210X297", label: "Khổ A4 (210 × 297mm)" },
];

export default function OmsOrdersPage() {
  const t = useTranslations("OmsFulfillment");
  const activeShopId = usePermissionStore((s) => s.activeShopId);

  const orders = useOmsFulfillmentStore((s) => s.orders);
  const statusCounts = useOmsFulfillmentStore((s) => s.statusCounts);
  const isLoadingOrders = useOmsFulfillmentStore((s) => s.isLoadingOrders);
  const isSubmitting = useOmsFulfillmentStore((s) => s.isSubmitting);
  const fetchOmsOrders = useOmsFulfillmentStore((s) => s.fetchOmsOrders);
  const dispatchCarrierBatch = useOmsFulfillmentStore(
    (s) => s.dispatchCarrierBatch,
  );

  const [activeTab, setActiveTab] = useState<FilterStatusTab>("ALL");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [carrierFilter, setCarrierFilter] = useState<string>("ALL");
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [batchPrintFormat, setBatchPrintFormat] =
    useState<ThermalLabelFormatType>("A6_100X150");
  const [isBatchOperating, setIsBatchOperating] = useState(false);
  const [picklistResult, setPicklistResult] =
    useState<IWavePicklistResult | null>(null);
  const [actionAlert, setActionAlert] = useState<{
    variant: "success" | "danger" | "info";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!activeShopId) return;
    fetchOmsOrders({
      shopId: activeShopId,
      status: activeTab === "ALL" ? undefined : activeTab,
      search: searchKeyword.trim() || undefined,
      carrierCode: carrierFilter === "ALL" ? undefined : carrierFilter,
    });
  }, [activeShopId, activeTab, searchKeyword, carrierFilter, fetchOmsOrders]);

  const tabItems: GlassTabItem<FilterStatusTab>[] = useMemo(() => {
    const totalAll = Object.values(statusCounts).reduce((a, b) => a + b, 0);
    return [
      { key: "ALL", label: t("tabs.all"), badge: totalAll },
      {
        key: "CONFIRMED",
        label: t("tabs.confirmed"),
        badge: statusCounts.CONFIRMED || 0,
      },
      {
        key: "WAITING_PACKING",
        label: t("tabs.waitingPacking"),
        badge: statusCounts.WAITING_PACKING || 0,
      },
      {
        key: "PACKED_READY_TO_SHIP",
        label: t("tabs.packed"),
        badge: statusCounts.PACKED_READY_TO_SHIP || 0,
      },
      {
        key: "IN_TRANSIT",
        label: t("tabs.inTransit"),
        badge: statusCounts.IN_TRANSIT || 0,
      },
      {
        key: "DELIVERY_FAILED_RESCUE",
        label: t("tabs.failedRescue"),
        badge: statusCounts.DELIVERY_FAILED_RESCUE || 0,
      },
      {
        key: "DELIVERED",
        label: t("tabs.deliveredUnreconciled"),
        badge: statusCounts.DELIVERED || 0,
      },
      {
        key: "DELIVERED_RECONCILED",
        label: t("tabs.reconciled"),
        badge: statusCounts.DELIVERED_RECONCILED || 0,
      },
      {
        key: "RETURNING",
        label: t("tabs.returning"),
        badge: statusCounts.RETURNING || 0,
      },
      {
        key: "RETURNED_RESTOCKED",
        label: t("tabs.returnedRestocked"),
        badge: statusCounts.RETURNED_RESTOCKED || 0,
      },
      {
        key: "CANCELLED",
        label: t("tabs.cancelled"),
        badge: statusCounts.CANCELLED || 0,
      },
    ];
  }, [statusCounts, t]);

  const openPrintWindow = (htmlContent: string) => {
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

  const toggleSelectOrder = (orderId: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId],
    );
  };

  const handleBatchDispatch = async () => {
    if (!activeShopId || selectedOrderIds.length === 0) return;
    const ok = await dispatchCarrierBatch({
      shopId: activeShopId,
      orderIds: selectedOrderIds,
    });
    if (ok) setSelectedOrderIds([]);
  };

  const handleBatchPrint = async () => {
    if (!activeShopId || selectedOrderIds.length === 0) return;
    setIsBatchOperating(true);
    try {
      const res = await omsPancakeOpsApi.batchPrintLabels(activeShopId, {
        orderIds: selectedOrderIds,
        labelFormat: batchPrintFormat,
        showCodAmount: true,
        showOrderNote: true,
      });
      const data = res.data?.data;
      if (data?.combinedHtmlTemplate) {
        openPrintWindow(data.combinedHtmlTemplate);
        setActionAlert({
          variant: "success",
          message: t("ordersPage.batchPrintSuccess", {
            count: data.count,
            format: data.labelFormat,
          }),
        });
      }
    } catch (err: any) {
      setActionAlert({
        variant: "danger",
        message:
          err?.response?.data?.message || t("ordersPage.batchActionFailed"),
      });
    } finally {
      setIsBatchOperating(false);
    }
  };

  const handleGenerateWavePicklist = async () => {
    if (!activeShopId || selectedOrderIds.length === 0) return;
    setIsBatchOperating(true);
    try {
      const res = await omsPancakeOpsApi.generateWavePicklist(activeShopId, {
        orderIds: selectedOrderIds,
      });
      if (res.data?.data) {
        setPicklistResult(res.data.data);
      }
    } catch (err: any) {
      setActionAlert({
        variant: "danger",
        message:
          err?.response?.data?.message || t("ordersPage.batchActionFailed"),
      });
    } finally {
      setIsBatchOperating(false);
    }
  };

  const selectedPrintFormatLabel =
    BATCH_PRINT_FORMATS.find((f) => f.value === batchPrintFormat)?.label ||
    batchPrintFormat;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-4">
      <GlassSectionHeader
        icon={<Truck className="w-5 h-5" />}
        title={t("ordersPage.title")}
        subtitle={t("ordersPage.subtitle")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {selectedOrderIds.length > 0 && (
              <>
                <div className="w-44">
                  <Select
                    value={batchPrintFormat}
                    onValueChange={(val) =>
                      setBatchPrintFormat(val as ThermalLabelFormatType)
                    }
                  >
                    <TriggerSelect fluid size="sm" className="text-xs">
                      <span>{selectedPrintFormatLabel}</span>
                    </TriggerSelect>
                    <ContentSelect>
                      {BATCH_PRINT_FORMATS.map((fmt) => (
                        <ItemSelect key={fmt.value} value={fmt.value}>
                          {fmt.label}
                        </ItemSelect>
                      ))}
                    </ContentSelect>
                  </Select>
                </div>
                <PatternButton
                  type="button"
                  variant="glass"
                  color="info"
                  size="sm"
                  rounded="full"
                  isLoading={isBatchOperating}
                  icon={<Printer className="w-3.5 h-3.5" />}
                  onClick={handleBatchPrint}
                >
                  {t("ordersPage.batchPrintBtn", {
                    count: selectedOrderIds.length,
                  })}
                </PatternButton>
                <PatternButton
                  type="button"
                  variant="glass"
                  color="success"
                  size="sm"
                  rounded="full"
                  isLoading={isBatchOperating}
                  icon={<ClipboardList className="w-3.5 h-3.5" />}
                  onClick={handleGenerateWavePicklist}
                >
                  {t("ordersPage.wavePicklistBtn")}
                </PatternButton>
                <PatternButton
                  type="button"
                  variant="solid"
                  color="primary"
                  size="sm"
                  rounded="full"
                  isLoading={isSubmitting}
                  icon={<Send className="w-3.5 h-3.5" />}
                  onClick={handleBatchDispatch}
                >
                  {t("ordersPage.dispatchBatchBtn", {
                    count: selectedOrderIds.length,
                  })}
                </PatternButton>
              </>
            )}
            <PatternButton
              type="button"
              variant="glass"
              size="sm"
              rounded="full"
              icon={<RefreshCw className="w-3.5 h-3.5" />}
              onClick={() =>
                activeShopId &&
                fetchOmsOrders({
                  shopId: activeShopId,
                  status: activeTab === "ALL" ? undefined : activeTab,
                })
              }
            >
              {t("common.refresh")}
            </PatternButton>
          </div>
        }
      />

      <OmsSubNavBar />

      {actionAlert && (
        <GlassAlert
          variant={actionAlert.variant}
          description={actionAlert.message}
          dismissible
          onDismiss={() => setActionAlert(null)}
        />
      )}

      <GlassTabs
        items={tabItems}
        value={activeTab}
        onValueChange={setActiveTab}
        size="sm"
      />

      <GlassSurfaceCard variant="frosted" opacity="60" blur="md">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <LiquidGlassInput className="flex-1">
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder={t("ordersPage.searchPlaceholder")}
              className="w-full bg-transparent px-3 py-2 text-sm outline-none"
            />
          </LiquidGlassInput>
          <div className="w-full sm:w-52">
            <Select value={carrierFilter} onValueChange={setCarrierFilter}>
              <TriggerSelect fluid>
                <span>
                  {carrierFilter === "ALL"
                    ? t("ordersPage.allCarriers")
                    : carrierFilter}
                </span>
              </TriggerSelect>
              <ContentSelect>
                <ItemSelect value="ALL">
                  {t("ordersPage.allCarriers")}
                </ItemSelect>
                <ItemSelect value="GHN">GHN (Giao Hàng Nhanh)</ItemSelect>
                <ItemSelect value="GHTK">GHTK (Giao Hàng Tiết Kiệm)</ItemSelect>
                <ItemSelect value="VTP">Viettel Post</ItemSelect>
                <ItemSelect value="JT">J&T Express</ItemSelect>
                <ItemSelect value="SPX">SPX Express</ItemSelect>
              </ContentSelect>
            </Select>
          </div>
        </div>

        {isLoadingOrders ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            {t("common.loading")}
          </div>
        ) : orders.length === 0 ? (
          <GlassEmptyState
            title={t("ordersPage.emptyTitle")}
            description={t("ordersPage.emptyDesc")}
          />
        ) : (
          <ScrollArea className="w-full">
            <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[920px]">
              <thead>
                <tr className="border-b border-border/50 text-muted-foreground">
                  <th className="py-2.5 px-2 w-10">
                    <CheckSquare className="w-4 h-4" />
                  </th>
                  <th className="py-2.5 px-2">{t("table.orderCode")}</th>
                  <th className="py-2.5 px-2">{t("table.customer")}</th>
                  <th className="py-2.5 px-2">{t("table.carrierTracking")}</th>
                  <th className="py-2.5 px-2">{t("table.status")}</th>
                  <th className="py-2.5 px-2 text-right">
                    {t("table.codAmount")}
                  </th>
                  <th className="py-2.5 px-2 text-center">
                    {t("table.printed")}
                  </th>
                  <th className="py-2.5 px-2 text-right">
                    {t("table.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const isChecked = selectedOrderIds.includes(order.id);
                  return (
                    <tr
                      key={order.id}
                      className="border-b border-border/30 hover:bg-primary/5 transition-colors"
                    >
                      <td className="py-3 px-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectOrder(order.id)}
                          className="h-4 w-4 accent-primary cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-2 font-semibold">
                        <div>{order.orderCode}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {order.warehouseName}
                        </div>
                        {(order.orderTagsJson || []).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(order.orderTagsJson || []).map((tag) => (
                              <GlassBadge key={tag} variant="accent" size="sm">
                                {tag}
                              </GlassBadge>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <div className="font-medium">{order.customerName}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {order.customerPhoneMasked}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <GlassBadge variant="info">
                          {order.carrierCode}
                        </GlassBadge>
                        <div className="text-[11px] font-mono mt-1 text-muted-foreground">
                          {order.trackingNumber || "—"}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex flex-col gap-1 items-start">
                          <OmsStatusBadge status={order.status} />
                          {order.callLaterAt && (
                            <GlassBadge variant="warning" size="sm">
                              <Clock className="w-3 h-3" />
                              {t("ordersPage.callLaterBadge")}
                            </GlassBadge>
                          )}
                          {order.slaBreachType !== "NONE" && (
                            <GlassBadge variant="danger" size="sm">
                              SLA: {order.slaBreachType}
                            </GlassBadge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right font-bold">
                        {Number(order.codCollectAmount || 0).toLocaleString(
                          "vi-VN",
                        )}
                        đ
                      </td>
                      <td className="py-3 px-2 text-center">
                        <GlassBadge
                          variant={
                            order.printedCount > 0 ? "success" : "secondary"
                          }
                        >
                          {t("ordersPage.printedTimes", {
                            count: order.printedCount || 0,
                          })}
                        </GlassBadge>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <Link
                          href={config.routes.private.orderDetail(order.id)}
                        >
                          <PatternButton
                            variant="ghost"
                            size="sm"
                            rounded="full"
                            icon={<ExternalLink className="w-3.5 h-3.5" />}
                          >
                            {t("common.detail")}
                          </PatternButton>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}
      </GlassSurfaceCard>

      {/* Modal Phiếu Nhặt Hàng Tổng Hợp theo Lô (Wave Picklist — F07.9A) */}
      <GlassModal
        open={Boolean(picklistResult)}
        onOpenChange={(open) => {
          if (!open) setPicklistResult(null);
        }}
        size="full"
        title={
          picklistResult
            ? `${t("ordersPage.picklistModalTitle")} — ${picklistResult.picklistCode}`
            : undefined
        }
        description={
          picklistResult
            ? t("ordersPage.picklistModalDesc", {
                orders: picklistResult.totalOrdersCount,
                skus: picklistResult.totalUniqueSkusCount,
                units: picklistResult.totalUnitsToPick,
              })
            : undefined
        }
        footer={
          <>
            <PatternButton
              type="button"
              variant="ghost"
              size="sm"
              rounded="full"
              onClick={() => setPicklistResult(null)}
            >
              {t("common.close")}
            </PatternButton>
            <PatternButton
              type="button"
              variant="solid"
              color="primary"
              size="sm"
              rounded="full"
              icon={<Printer className="w-4 h-4" />}
              onClick={() =>
                picklistResult?.printableHtmlTemplate &&
                openPrintWindow(picklistResult.printableHtmlTemplate)
              }
            >
              {t("ordersPage.printPicklistBtn")}
            </PatternButton>
          </>
        }
      >
        {picklistResult && (
          <div className="space-y-3">
            {picklistResult.shortageSkuCount > 0 && (
              <GlassAlert
                variant="danger"
                description={t("ordersPage.picklistShortageWarn", {
                  count: picklistResult.shortageSkuCount,
                })}
              />
            )}
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/50 text-muted-foreground">
                  <th className="py-2 px-2">{t("ordersPage.binCol")}</th>
                  <th className="py-2 px-2">SKU</th>
                  <th className="py-2 px-2">{t("ordersPage.productCol")}</th>
                  <th className="py-2 px-2 text-center">
                    {t("ordersPage.pickQtyCol")}
                  </th>
                  <th className="py-2 px-2 text-center">
                    {t("ordersPage.stockCol")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {picklistResult.items.map((item) => (
                  <tr
                    key={`${item.warehouseId}-${item.variantId}`}
                    className="border-b border-border/30"
                  >
                    <td className="py-2 px-2 font-mono font-bold">
                      {item.binLocationCode}
                    </td>
                    <td className="py-2 px-2 font-mono">{item.skuCode}</td>
                    <td className="py-2 px-2">{item.variantName}</td>
                    <td className="py-2 px-2 text-center font-bold text-primary">
                      {item.totalPickQty}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <GlassBadge
                        variant={item.isShortageRisk ? "danger" : "success"}
                        size="sm"
                      >
                        {item.currentOnHandQty}
                      </GlassBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassModal>
    </div>
  );
}
