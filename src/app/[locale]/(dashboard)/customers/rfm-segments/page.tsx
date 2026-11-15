"use client";

import { useEffect } from "react";
import {
  ButtonBack,
  GlassBadge,
  GlassSectionHeader,
  GlassSurfaceCard,
  PatternButton,
} from "@/components/toolkit";
import { PermissionGate } from "@/components/iam/permission-gate";
import { usePermissionStore } from "@/lib/stores/iam/use-permission-store";
import { useCrmStore } from "@/lib/stores/crm/use-crm-store";
import { BarChart3, RefreshCw, Sparkles, Users } from "lucide-react";
import { useTranslations } from "next-intl";

export default function CustomerRfmSegmentsPage() {
  const t = useTranslations("Crm360.rfmPage");
  const activeShopId = usePermissionStore((s) => s.activeShopId);
  const {
    rfmSegments,
    rfmTotalEvaluated,
    isRecalculatingRfm,
    fetchRfmSegments,
    recalculateRfmSegments,
  } = useCrmStore();

  useEffect(() => {
    if (activeShopId) {
      fetchRfmSegments(activeShopId);
    }
  }, [activeShopId, fetchRfmSegments]);

  if (!activeShopId) return null;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-5">
      <div className="flex items-center gap-2">
        <ButtonBack />
        <GlassSectionHeader
          icon={<BarChart3 className="w-5 h-5" />}
          title={t("title")}
          subtitle={t("subtitle", { total: rfmTotalEvaluated })}
          actions={
            <PermissionGate can="CRM_RFM_SEGMENT_CONFIGURE" mode="hide">
              <PatternButton
                type="button"
                variant="solid"
                color="primary"
                size="sm"
                rounded="full"
                isLoading={isRecalculatingRfm}
                icon={<RefreshCw className="w-4 h-4" />}
                onClick={() => recalculateRfmSegments(activeShopId)}
              >
                {t("recalculateNowBtn")}
              </PatternButton>
            </PermissionGate>
          }
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {rfmSegments.map((seg) => (
          <GlassSurfaceCard
            key={seg.segmentCode}
            className="p-4 flex flex-col justify-between space-y-3"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <GlassBadge
                  variant={
                    seg.segmentCode === "CHAMPIONS"
                      ? "accent"
                      : seg.segmentCode === "LOYAL"
                        ? "success"
                        : seg.segmentCode === "AT_RISK"
                          ? "danger"
                          : "info"
                  }
                  size="sm"
                >
                  <Sparkles className="w-3 h-3 mr-1 inline" />
                  {seg.segmentCode}
                </GlassBadge>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-foreground">
                  <Users className="w-3.5 h-3.5 text-primary" />
                  {seg.customerCount}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t(`descriptions.${seg.segmentCode}`)}
              </p>
            </div>

            <div className="pt-2.5 border-t border-border/40 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Uy tín TB: <strong>{seg.avgTrustScore}/100</strong>
              </span>
              <span className="font-bold text-primary tabular-nums">
                {Number(seg.totalLifetimeValue || 0).toLocaleString("vi-VN")}đ
              </span>
            </div>
          </GlassSurfaceCard>
        ))}
      </div>
    </div>
  );
}
