"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  Barcode,
  FileSpreadsheet,
  PackageCheck,
  RefreshCcw,
  Truck,
} from "lucide-react";
import {
  GlassBadge,
  GlassSurfaceCard,
  type GlassVariant,
} from "@/components/toolkit";
import config from "@/config";
import type { PosOrderStatusType } from "@/types/catalog-pos";

export const OMS_STATUS_META: Record<
  PosOrderStatusType,
  { label: string; variant: GlassVariant }
> = {
  DRAFT: { label: "Nháp POS", variant: "secondary" },
  PENDING_PRICE_APPROVAL: { label: "Chờ duyệt giá", variant: "warning" },
  WAITING_DEPOSIT: { label: "Chờ đặt cọc", variant: "warning" },
  CONFIRMED: { label: "Đã chốt đơn", variant: "info" },
  WAITING_PACKING: { label: "Chờ đóng gói", variant: "accent" },
  PACKED_READY_TO_SHIP: { label: "Đã đóng gói", variant: "primary" },
  HANDED_TO_CARRIER: { label: "Đã bàn giao 3PL", variant: "info" },
  IN_TRANSIT: { label: "Đang vận chuyển", variant: "info" },
  DELIVERY_FAILED_RESCUE: { label: "🚨 Cần cứu đơn", variant: "danger" },
  DELIVERED: { label: "Đã giao - Chờ đối soát", variant: "warning" },
  DELIVERED_RECONCILED: { label: "Đã đối soát COD", variant: "success" },
  RETURNING: { label: "Đang hoàn về kho", variant: "danger" },
  RETURNED_RESTOCKED: { label: "Đã kiểm hoàn nhập kho", variant: "secondary" },
  CANCELLED: { label: "Đã hủy", variant: "secondary" },
};

export function OmsStatusBadge({ status }: { status: PosOrderStatusType }) {
  const meta = OMS_STATUS_META[status] || {
    label: status,
    variant: "secondary" as GlassVariant,
  };
  return (
    <GlassBadge
      variant={meta.variant}
      dot
      pulse={status === "DELIVERY_FAILED_RESCUE"}
    >
      {meta.label}
    </GlassBadge>
  );
}

export function OmsSubNavBar() {
  const pathname = usePathname();
  const navItems = [
    {
      href: config.routes.private.orders,
      label: "Danh sách vận đơn",
      icon: Truck,
    },
    {
      href: config.routes.private.orderPackingStation,
      label: "Bàn đóng gói (T09)",
      icon: Barcode,
    },
    {
      href: config.routes.private.orderFailedRescue,
      label: "Cứu đơn & SLA",
      icon: AlertTriangle,
    },
    {
      href: config.routes.private.orderReturnVerification,
      label: "Đồng kiểm hoàn",
      icon: PackageCheck,
    },
    {
      href: config.routes.private.orderRmaExchange,
      label: "Đổi hàng 2 chiều RMA",
      icon: RefreshCcw,
    },
    {
      href: config.routes.private.orderCodReconciliation,
      label: "Đối soát COD (T10)",
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
