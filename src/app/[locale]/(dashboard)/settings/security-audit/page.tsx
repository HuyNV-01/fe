"use client";

import { useEffect, useState } from "react";
import {
  GlassAlert,
  GlassBadge,
  GlassSectionHeader,
  GlassSheet,
  GlassSurfaceCard,
  GlassTabs,
  LiquidGlassInput,
  PatternButton,
} from "@/components/toolkit";
import { Input } from "@/components/ui/input";
import { usePermissionStore } from "@/lib/stores/iam/use-permission-store";
import { useCrmStore } from "@/lib/stores/crm/use-crm-store";
import type { IAdsConversionEventLog, ISecurityAuditLog } from "@/types/crm";
import {
  CheckCircle2,
  Eye,
  Lock,
  Megaphone,
  RefreshCw,
  Send,
  ShieldAlert,
  ShieldCheck,
  ShoppingCart,
} from "lucide-react";
import { useTranslations } from "next-intl";

export default function SecurityAuditAndCapiDebuggerPage() {
  const t = useTranslations("Crm360.securityAuditPage");
  const activeShopId = usePermissionStore((s) => s.activeShopId);
  const {
    securityAuditLogs,
    chainVerificationResult,
    isVerifyingChain,
    adsConversionLogs,
    adsConversionSummary,
    fetchSecurityAuditLogs,
    verifyAuditHashChain,
    fetchAdsConversions,
    dispatchAdsConversion,
    retryAdsConversion,
  } = useCrmStore();

  const [activeTab, setActiveTab] = useState<"AUDIT_CHAIN" | "CAPI_DEBUGGER">(
    "AUDIT_CHAIN",
  );
  const [testEventCode, setTestEventCode] = useState("TEST88291");
  const [selectedAuditLog, setSelectedAuditLog] =
    useState<ISecurityAuditLog | null>(null);
  const [selectedCapiLog, setSelectedCapiLog] =
    useState<IAdsConversionEventLog | null>(null);

  useEffect(() => {
    if (activeShopId) {
      fetchSecurityAuditLogs({ shopId: activeShopId, page: 1, limit: 30 });
      fetchAdsConversions(activeShopId);
    }
  }, [activeShopId, fetchSecurityAuditLogs, fetchAdsConversions]);

  if (!activeShopId) return null;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-5">
      <GlassSectionHeader
        icon={<ShieldCheck className="w-5 h-5" />}
        title={t("title")}
        subtitle={t("subtitle")}
        actions={
          <PatternButton
            type="button"
            variant="solid"
            color="success"
            size="sm"
            rounded="full"
            isLoading={isVerifyingChain}
            icon={<ShieldCheck className="w-4 h-4" />}
            onClick={() => verifyAuditHashChain(activeShopId)}
          >
            {t("verifyHashChainBtn")}
          </PatternButton>
        }
      />

      {chainVerificationResult && (
        <GlassAlert
          variant={chainVerificationResult.isValidChain ? "success" : "danger"}
          title={
            chainVerificationResult.isValidChain
              ? t("chainValidTitle", {
                  count: chainVerificationResult.totalEntriesChecked,
                })
              : t("chainBrokenTitle")
          }
          description={t("chainValidDesc", {
            status: chainVerificationResult.status,
            verifiedAt: new Date(
              chainVerificationResult.verifiedAt,
            ).toLocaleString("vi-VN"),
          })}
          icon={
            chainVerificationResult.isValidChain ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-red-500" />
            )
          }
        />
      )}

      <GlassTabs
        size="md"
        value={activeTab}
        onValueChange={setActiveTab}
        items={[
          {
            key: "AUDIT_CHAIN",
            label: t("auditChainTab"),
            icon: <Lock className="w-4 h-4" />,
            badge: securityAuditLogs.length,
          },
          {
            key: "CAPI_DEBUGGER",
            label: t("capiDebuggerTab"),
            icon: <Megaphone className="w-4 h-4" />,
            badge: adsConversionLogs.length,
          },
        ]}
      />

      {activeTab === "AUDIT_CHAIN" ? (
        <GlassSurfaceCard className="p-4 space-y-3">
          {securityAuditLogs.map((log) => (
            <div
              key={log.id}
              className="p-3 rounded-xl bg-muted/40 border border-border/50 space-y-1.5 text-xs"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <GlassBadge
                    variant={
                      log.actionCode === "UNMASK_PHONE" ? "warning" : "primary"
                    }
                    size="sm"
                  >
                    {log.actionCode}
                  </GlassBadge>
                  <span className="font-bold text-foreground">
                    {log.actorName || log.actorUserId}
                  </span>
                  <span className="text-muted-foreground">
                    → {log.targetResourceType} #
                    {log.targetResourceId.slice(0, 8)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {new Date(log.createdAt).toLocaleString("vi-VN")}
                  </span>
                  <PatternButton
                    type="button"
                    size="sm"
                    variant="ghost"
                    rounded="full"
                    className="h-6 px-2 text-[11px]"
                    icon={<Eye className="w-3.5 h-3.5" />}
                    onClick={() => setSelectedAuditLog(log)}
                  >
                    {t("inspectDetailBtn")}
                  </PatternButton>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] font-mono text-muted-foreground pt-1">
                <span className="truncate">prevHash: {log.prevHash}</span>
                <span className="truncate text-emerald-600 dark:text-emerald-400">
                  hmacHash: {log.entryHmacHash}
                </span>
              </div>
            </div>
          ))}
        </GlassSurfaceCard>
      ) : (
        <div className="space-y-4">
          <GlassSurfaceCard className="p-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5 flex-wrap">
              <LiquidGlassInput className="h-9 w-44 p-0 overflow-hidden">
                <Input
                  value={testEventCode}
                  onChange={(e) => setTestEventCode(e.target.value)}
                  placeholder="test_event_code..."
                  className="h-full text-xs bg-transparent! border-none shadow-none focus-visible:ring-0 px-3 font-mono"
                />
              </LiquidGlassInput>
              <PatternButton
                type="button"
                size="sm"
                variant="solid"
                color="info"
                rounded="full"
                icon={<Send className="w-3.5 h-3.5" />}
                onClick={() =>
                  dispatchAdsConversion({
                    shopId: activeShopId,
                    platform: "META_CAPI",
                    eventName: "LeadSubmitted",
                    testEventCode: testEventCode.trim() || undefined,
                    valueAmount: 0,
                    currency: "VND",
                  })
                }
              >
                {t("testLeadEventBtn")}
              </PatternButton>
              <PatternButton
                type="button"
                size="sm"
                variant="glass"
                color="warning"
                rounded="full"
                icon={<ShoppingCart className="w-3.5 h-3.5" />}
                onClick={() =>
                  dispatchAdsConversion({
                    shopId: activeShopId,
                    platform: "META_CAPI",
                    eventName: "InitiateCheckout",
                    testEventCode: testEventCode.trim() || undefined,
                    valueAmount: 350000,
                    currency: "VND",
                  })
                }
              >
                {t("testCheckoutEventBtn")}
              </PatternButton>
              <PatternButton
                type="button"
                size="sm"
                variant="solid"
                color="success"
                rounded="full"
                icon={<Send className="w-3.5 h-3.5" />}
                onClick={() =>
                  dispatchAdsConversion({
                    shopId: activeShopId,
                    platform: "META_CAPI",
                    eventName: "Purchase",
                    testEventCode: testEventCode.trim() || undefined,
                    valueAmount: 850000,
                    currency: "VND",
                  })
                }
              >
                {t("testPurchaseEventBtn")}
              </PatternButton>
            </div>

            {adsConversionSummary && (
              <div className="flex items-center gap-2 text-xs flex-wrap">
                <GlassBadge variant="info" size="sm">
                  Lead: {adsConversionSummary.leadSubmittedCount}
                </GlassBadge>
                <GlassBadge variant="warning" size="sm">
                  Checkout: {adsConversionSummary.initiateCheckoutCount}
                </GlassBadge>
                <GlassBadge variant="success" size="sm">
                  Purchase: {adsConversionSummary.purchaseCount} (
                  {Number(
                    adsConversionSummary.totalPurchaseRevenue || 0,
                  ).toLocaleString("vi-VN")}
                  đ)
                </GlassBadge>
              </div>
            )}
          </GlassSurfaceCard>

          <GlassSurfaceCard className="p-4 space-y-2.5">
            {adsConversionLogs.map((capiLog) => (
              <div
                key={capiLog.id}
                className="flex items-center justify-between gap-2 p-3 rounded-xl bg-muted/40 border border-border/50 text-xs flex-wrap"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <GlassBadge variant="primary" size="sm">
                      {capiLog.platform}
                    </GlassBadge>
                    <GlassBadge
                      variant={
                        capiLog.eventName === "Purchase"
                          ? "success"
                          : capiLog.eventName === "InitiateCheckout"
                            ? "warning"
                            : "info"
                      }
                      size="sm"
                    >
                      {capiLog.eventName}
                    </GlassBadge>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {capiLog.eventId}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Status: {capiLog.syncStatus} (HTTP {capiLog.responseStatus})
                    • Value:{" "}
                    {Number(capiLog.valueAmount || 0).toLocaleString("vi-VN")}{" "}
                    {capiLog.currency}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <PatternButton
                    type="button"
                    size="sm"
                    variant="ghost"
                    rounded="full"
                    icon={<Eye className="w-3.5 h-3.5" />}
                    onClick={() => setSelectedCapiLog(capiLog)}
                  >
                    {t("inspectDetailBtn")}
                  </PatternButton>
                  <PatternButton
                    type="button"
                    size="sm"
                    variant="ghost"
                    rounded="full"
                    icon={<RefreshCw className="w-3.5 h-3.5" />}
                    onClick={() => retryAdsConversion(activeShopId, capiLog.id)}
                  >
                    Retry
                  </PatternButton>
                </div>
              </div>
            ))}
          </GlassSurfaceCard>
        </div>
      )}

      {/* Ngăn kéo GlassSheet xem chi tiết bản ghi kiểm toán bảo mật (Chuẩn Mục 2 Đặc tả Sprint 3) */}
      <GlassSheet
        open={Boolean(selectedAuditLog)}
        onOpenChange={(open) => !open && setSelectedAuditLog(null)}
        title={t("auditDetailSheetTitle")}
        description={selectedAuditLog?.id || ""}
        side="right"
      >
        {selectedAuditLog && (
          <div className="space-y-3 py-2 text-xs">
            <GlassSurfaceCard className="p-3 space-y-1.5">
              <p>
                <strong>Action:</strong> {selectedAuditLog.actionCode}
              </p>
              <p>
                <strong>Actor:</strong>{" "}
                {selectedAuditLog.actorName || selectedAuditLog.actorUserId}
              </p>
              <p>
                <strong>Resource:</strong> {selectedAuditLog.targetResourceType}{" "}
                #{selectedAuditLog.targetResourceId}
              </p>
              <p>
                <strong>IP / User-Agent:</strong>{" "}
                {selectedAuditLog.ipAddress || "127.0.0.1"} •{" "}
                {selectedAuditLog.userAgent || "Browser"}
              </p>
              <p className="font-mono text-[10px] break-all text-muted-foreground">
                <strong>prevHash:</strong> {selectedAuditLog.prevHash}
              </p>
              <p className="font-mono text-[10px] break-all text-emerald-600 dark:text-emerald-400">
                <strong>entryHmacHash:</strong> {selectedAuditLog.entryHmacHash}
              </p>
            </GlassSurfaceCard>

            {selectedAuditLog.beforeSnapshotJson && (
              <GlassSurfaceCard className="p-3 space-y-1">
                <p className="font-bold">Before Snapshot:</p>
                <pre className="text-[10px] font-mono whitespace-pre-wrap break-all bg-muted/50 p-2 rounded-lg">
                  {JSON.stringify(selectedAuditLog.beforeSnapshotJson, null, 2)}
                </pre>
              </GlassSurfaceCard>
            )}

            {selectedAuditLog.afterSnapshotJson && (
              <GlassSurfaceCard className="p-3 space-y-1">
                <p className="font-bold">After Snapshot:</p>
                <pre className="text-[10px] font-mono whitespace-pre-wrap break-all bg-muted/50 p-2 rounded-lg">
                  {JSON.stringify(selectedAuditLog.afterSnapshotJson, null, 2)}
                </pre>
              </GlassSurfaceCard>
            )}
          </div>
        )}
      </GlassSheet>

      {/* Ngăn kéo GlassSheet xem chi tiết Payload sự kiện Meta CAPI / TikTok Events API */}
      <GlassSheet
        open={Boolean(selectedCapiLog)}
        onOpenChange={(open) => !open && setSelectedCapiLog(null)}
        title={t("capiDetailSheetTitle")}
        description={selectedCapiLog?.eventId || ""}
        side="right"
      >
        {selectedCapiLog && (
          <div className="space-y-3 py-2 text-xs">
            <GlassSurfaceCard className="p-3 space-y-1.5">
              <p>
                <strong>Platform:</strong> {selectedCapiLog.platform}
              </p>
              <p>
                <strong>Event Name:</strong> {selectedCapiLog.eventName}
              </p>
              <p>
                <strong>Status:</strong> {selectedCapiLog.syncStatus} (HTTP{" "}
                {selectedCapiLog.responseStatus})
              </p>
              <p>
                <strong>Value:</strong>{" "}
                {Number(selectedCapiLog.valueAmount || 0).toLocaleString(
                  "vi-VN",
                )}{" "}
                {selectedCapiLog.currency}
              </p>
            </GlassSurfaceCard>

            {selectedCapiLog.requestPayloadJson && (
              <GlassSurfaceCard className="p-3 space-y-1">
                <p className="font-bold">Request Payload:</p>
                <pre className="text-[10px] font-mono whitespace-pre-wrap break-all bg-muted/50 p-2 rounded-lg">
                  {JSON.stringify(selectedCapiLog.requestPayloadJson, null, 2)}
                </pre>
              </GlassSurfaceCard>
            )}

            {selectedCapiLog.responseBodyJson && (
              <GlassSurfaceCard className="p-3 space-y-1">
                <p className="font-bold">Response Body:</p>
                <pre className="text-[10px] font-mono whitespace-pre-wrap break-all bg-muted/50 p-2 rounded-lg">
                  {JSON.stringify(selectedCapiLog.responseBodyJson, null, 2)}
                </pre>
              </GlassSurfaceCard>
            )}
          </div>
        )}
      </GlassSheet>
    </div>
  );
}
