"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  Barcode,
  ClipboardCheck,
  FileSpreadsheet,
  PackageCheck,
  RefreshCcw,
  Truck,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  GlassBadge,
  GlassSurfaceCard,
  type GlassVariant,
} from "@/components/toolkit";
import config from "@/config";
import type { PosOrderStatusType } from "@/types/catalog-pos";

export const OMS_STATUS_META: Record<
  PosOrderStatusType,
  { labelKey: string; fallback: string; variant: GlassVariant }
> = {
  DRAFT: {
    labelKey: "statusLabels.DRAFT",
    fallback: "Nháp POS",
    variant: "secondary",
  },
  PENDING_PRICE_APPROVAL: {
    labelKey: "statusLabels.PENDING_PRICE_APPROVAL",
    fallback: "Chờ duyệt giá",
    variant: "warning",
  },
  WAITING_DEPOSIT: {
    labelKey: "statusLabels.WAITING_DEPOSIT",
    fallback: "Chờ đặt cọc",
    variant: "warning",
  },
  CONFIRMED: {
    labelKey: "statusLabels.CONFIRMED",
    fallback: "Đã chốt đơn",
    variant: "info",
  },
  WAITING_PACKING: {
    labelKey: "statusLabels.WAITING_PACKING",
    fallback: "Chờ đóng gói",
    variant: "accent",
  },
  PACKED_READY_TO_SHIP: {
    labelKey: "statusLabels.PACKED_READY_TO_SHIP",
    fallback: "Đã đóng gói",
    variant: "primary",
  },
  HANDED_TO_CARRIER: {
    labelKey: "statusLabels.HANDED_TO_CARRIER",
    fallback: "Đã bàn giao 3PL",
    variant: "info",
  },
  IN_TRANSIT: {
    labelKey: "statusLabels.IN_TRANSIT",
    fallback: "Đang vận chuyển",
    variant: "info",
  },
  DELIVERY_FAILED_RESCUE: {
    labelKey: "statusLabels.DELIVERY_FAILED_RESCUE",
    fallback: "Cần cứu đơn",
    variant: "danger",
  },
  DELIVERED: {
    labelKey: "statusLabels.DELIVERED",
    fallback: "Đã giao - Chờ đối soát",
    variant: "warning",
  },
  DELIVERED_RECONCILED: {
    labelKey: "statusLabels.DELIVERED_RECONCILED",
    fallback: "Đã đối soát COD",
    variant: "success",
  },
  RETURNING: {
    labelKey: "statusLabels.RETURNING",
    fallback: "Đang hoàn về kho",
    variant: "danger",
  },
  RETURNED_RESTOCKED: {
    labelKey: "statusLabels.RETURNED_RESTOCKED",
    fallback: "Đã kiểm hoàn nhập kho",
    variant: "secondary",
  },
  CANCELLED: {
    labelKey: "statusLabels.CANCELLED",
    fallback: "Đã hủy",
    variant: "secondary",
  },
};

export function OmsStatusBadge({ status }: { status: PosOrderStatusType }) {
  const t = useTranslations("OmsFulfillment");
  const meta = OMS_STATUS_META[status];
  const label = meta
    ? t.has(meta.labelKey)
      ? t(meta.labelKey)
      : meta.fallback
    : status;

  return (
    <GlassBadge
      variant={meta?.variant || "secondary"}
      dot
      pulse={status === "DELIVERY_FAILED_RESCUE"}
    >
      {label}
    </GlassBadge>
  );
}

export function OmsSubNavBar() {
  const pathname = usePathname();
  const t = useTranslations("OmsFulfillment");

  const navItems = [
    {
      href: config.routes.private.orders,
      label: t.has("nav.orders") ? t("nav.orders") : "Danh sách vận đơn",
      icon: Truck,
    },
    {
      href: config.routes.private.orderPackingStation,
      label: t.has("nav.packingStation")
        ? t("nav.packingStation")
        : "Bàn đóng gói (T09)",
      icon: Barcode,
    },
    {
      href: config.routes.private.orderHandoverOps,
      label: t.has("nav.handoverOps")
        ? t("nav.handoverOps")
        : "Nhặt hàng & Bàn giao 3PL",
      icon: ClipboardCheck,
    },
    {
      href: config.routes.private.orderFailedRescue,
      label: t.has("nav.failedRescue")
        ? t("nav.failedRescue")
        : "Cứu đơn & SLA",
      icon: AlertTriangle,
    },
    {
      href: config.routes.private.orderReturnVerification,
      label: t.has("nav.returnVerification")
        ? t("nav.returnVerification")
        : "Đồng kiểm hoàn",
      icon: PackageCheck,
    },
    {
      href: config.routes.private.orderRmaExchange,
      label: t.has("nav.rmaExchange")
        ? t("nav.rmaExchange")
        : "Đổi hàng 2 chiều RMA",
      icon: RefreshCcw,
    },
    {
      href: config.routes.private.orderCodReconciliation,
      label: t.has("nav.reconciliation")
        ? t("nav.reconciliation")
        : "Đối soát COD (T10)",
      icon: FileSpreadsheet,
    },
  ];

  return (
    <GlassSurfaceCard
      variant="secondary"
      opacity="30"
      blur="md"
      className="p-2"
    >
      <div className="flex flex-wrap items-center gap-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === config.routes.private.orders
              ? pathname?.endsWith("/orders")
              : pathname?.includes(item.href);
          return (
            <Link key={item.href} href={item.href}>
              <GlassBadge
                variant={isActive ? "primary" : "secondary"}
                size="md"
                className="cursor-pointer px-3 py-1.5"
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </GlassBadge>
            </Link>
          );
        })}
      </div>
    </GlassSurfaceCard>
  );
}
