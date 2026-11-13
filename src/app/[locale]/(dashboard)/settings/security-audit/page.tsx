"use client";

import { useEffect, useState } from "react";
import {
  GlassAlert,
  GlassBadge,
  GlassSectionHeader,
  GlassSurfaceCard,
  GlassTabs,
  LiquidGlassInput,
  PatternButton,
} from "@/components/toolkit";
import { Input } from "@/components/ui/input";
import { usePermissionStore } from "@/lib/stores/iam/use-permission-store";
import { useCrmStore } from "@/lib/stores/crm/use-crm-store";
import {
  CheckCircle2,
  Lock,
  Megaphone,
  RefreshCw,
  Send,
  ShieldAlert,
  ShieldCheck,
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
                <div className="flex items-center gap-2">
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
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {new Date(log.createdAt).toLocaleString("vi-VN")}
                </span>
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
            <div className="flex items-center gap-3 flex-wrap">
              <LiquidGlassInput className="h-9 w-48 p-0 overflow-hidden">
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
              <div className="flex items-center gap-2 text-xs">
                <GlassBadge variant="info" size="sm">
                  Lead: {adsConversionSummary.leadSubmittedCount}
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
                        capiLog.eventName === "Purchase" ? "success" : "info"
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
            ))}
          </GlassSurfaceCard>
        </div>
      )}
    </div>
  );
}
