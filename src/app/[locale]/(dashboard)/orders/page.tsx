"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  CheckSquare,
  ExternalLink,
  RefreshCw,
  Send,
  Truck,
} from "lucide-react";
import {
  ContentSelect,
  GlassBadge,
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
  type GlassTabItem,
} from "@/components/toolkit";
import { Select } from "@/components/ui/select";
import { OmsStatusBadge, OmsSubNavBar } from "@/components/oms/oms-status-meta";
import config from "@/config";
import { usePermissionStore } from "@/lib/stores/iam/use-permission-store";
import { useOmsFulfillmentStore } from "@/lib/stores/oms/use-oms-fulfillment-store";
import type { PosOrderStatusType } from "@/types/catalog-pos";

type FilterStatusTab = "ALL" | PosOrderStatusType;

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

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-4">
      <GlassSectionHeader
        icon={<Truck className="w-5 h-5" />}
        title={t("ordersPage.title")}
        subtitle={t("ordersPage.subtitle")}
        actions={
          <div className="flex items-center gap-2">
            {selectedOrderIds.length > 0 && (
              <PatternButton
                variant="solid"
                color="primary"
                size="sm"
                isLoading={isSubmitting}
                onClick={handleBatchDispatch}
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                {t("ordersPage.dispatchBatchBtn", {
                  count: selectedOrderIds.length,
                })}
              </PatternButton>
            )}
            <PatternButton
              variant="glass"
              size="sm"
              onClick={() =>
                activeShopId &&
                fetchOmsOrders({
                  shopId: activeShopId,
                  status: activeTab === "ALL" ? undefined : activeTab,
                })
              }
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              {t("common.refresh")}
            </PatternButton>
          </div>
        }
      />

      <OmsSubNavBar />

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
              <TriggerSelect>
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
            <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[880px]">
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
                          {order.printedCount || 0} lần
                        </GlassBadge>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <Link
                          href={config.routes.private.orderDetail(order.id)}
                        >
                          <PatternButton variant="ghost" size="sm">
                            <ExternalLink className="w-3.5 h-3.5 mr-1" />
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
    </div>
  );
}
