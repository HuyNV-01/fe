"use client";

import { useEffect, useState } from "react";
import {
  ContentSelect,
  GlassAlert,
  GlassBadge,
  GlassModal,
  GlassSurfaceCard,
  GlassTabs,
  ItemSelect,
  LiquidGlassInput,
  PatternButton,
  ScrollArea,
  Switch,
  TriggerSelect,
  TruncatedText,
} from "@/components/toolkit";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectValue } from "@/components/ui/select";
import { submitStandalonePhoneAbuseReportApi } from "@/lib/stores/crm/phone-trust-api";
import { useCrmStore } from "@/lib/stores/crm/use-crm-store";
import type {
  IDeliverySourceBreakdownItem,
  IStandalonePhoneTrustLookupResult,
  ITrustProviderDiagnosticItem,
  TrustProviderStatusType,
} from "@/types/crm";
import {
  Activity,
  AlertTriangle,
  ExternalLink,
  Flag,
  Layers,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

export interface PhoneTrustLookupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shopId: string;
  initialPhone?: string;
}

const PROVIDER_STATUS_BADGE_VARIANT: Record<
  TrustProviderStatusType,
  "success" | "info" | "warning" | "danger" | "secondary"
> = {
  LIVE_VERIFIED: "success",
  COMMUNITY_SYNCED: "info",
  LOCAL_LEDGER: "info",
  NO_RECORD: "secondary",
  NOT_CONFIGURED: "secondary",
  PROVIDER_ERROR: "danger",
};

type LookupTabKey = "LOOKUP" | "REPORT";
type AbuseReasonCodeType =
  | "BOM_HANG"
  | "BOOM_AO_SPAM"
  | "TU_CHOI_NHAN_NHIEU_LAN"
  | "SAI_SO_DIEN_THOAI"
  | "OTHER";

export function PhoneTrustLookupModal({
  open,
  onOpenChange,
  shopId,
  initialPhone = "",
}: PhoneTrustLookupModalProps) {
  const t = useTranslations("Crm360.trustLookupModal");
  const { lookupStandalonePhoneTrust } = useCrmStore();

  const [activeTab, setActiveTab] = useState<LookupTabKey>("LOOKUP");
  const [phoneInput, setPhoneInput] = useState(initialPhone);
  const [isSearching, setIsSearching] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [result, setResult] =
    useState<IStandalonePhoneTrustLookupResult | null>(null);

  const [reportPhone, setReportPhone] = useState(initialPhone);
  const [reportReasonCode, setReportReasonCode] =
    useState<AbuseReasonCodeType>("BOM_HANG");
  const [reportCarrierCode, setReportCarrierCode] = useState("GHN");
  const [reportTrackingNumber, setReportTrackingNumber] = useState("");
  const [reportReasonNote, setReportReasonNote] = useState("");
  const [reportMarkBlacklisted, setReportMarkBlacklisted] = useState(false);

  useEffect(() => {
    if (open && initialPhone) {
      setPhoneInput(initialPhone);
      setReportPhone(initialPhone);
    }
  }, [open, initialPhone]);

  const handleLookup = async (bypassCache = false) => {
    if (!phoneInput.trim()) return;
    setIsSearching(true);
    const data = await lookupStandalonePhoneTrust({
      shopId,
      rawPhone: phoneInput.trim(),
      bypassCache,
    });
    if (data) {
      setResult(data);
      setReportPhone(phoneInput.trim());
    }
    setIsSearching(false);
  };

  const handleSubmitStandaloneReport = async () => {
    if (!reportPhone.trim() || !reportReasonNote.trim()) return;
    setIsReporting(true);
    try {
      const res: any = await submitStandalonePhoneAbuseReportApi({
        shopId,
        rawPhone: reportPhone.trim(),
        reasonCode: reportReasonCode,
        reasonNote: reportReasonNote.trim(),
        carrierCode:
          reportCarrierCode && reportCarrierCode !== "NONE"
            ? reportCarrierCode
            : undefined,
        trackingNumber: reportTrackingNumber.trim() || undefined,
        markBlacklisted: reportMarkBlacklisted,
      });
      const data = res?.data?.data ?? res?.data;
      if (data?.trustEvaluation) {
        setResult({
          phoneMasked: data.phoneMasked || reportPhone.trim(),
          existingCustomerId: result?.existingCustomerId || null,
          existingCustomerName: result?.existingCustomerName || null,
          trustEvaluation: data.trustEvaluation,
          warningMessage: null,
        });
        setPhoneInput(reportPhone.trim());
        setReportReasonNote("");
        setReportTrackingNumber("");
        setActiveTab("LOOKUP");
        toast.success(t("reportSuccessToast"));
      }
    } catch {
      toast.error(t("reportFailedToast"));
    } finally {
      setIsReporting(false);
    }
  };

  const evalData = result?.trustEvaluation;

  return (
    <GlassModal
      open={open}
      onOpenChange={onOpenChange}
      title={t("title")}
      description={t("description")}
      size="lg"
      footer={
        <div className="flex items-center justify-end w-full">
          <PatternButton
            type="button"
            size="sm"
            variant="ghost"
            rounded="full"
            onClick={() => onOpenChange(false)}
          >
            {t("closeBtn")}
          </PatternButton>
        </div>
      }
    >
      <div className="space-y-3.5 py-1">
        <GlassTabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as LookupTabKey)}
          items={[
            { key: "LOOKUP", label: t("lookupTabLabel") },
            { key: "REPORT", label: t("reportTabLabel") },
          ]}
        />

        {activeTab === "REPORT" ? (
          <GlassSurfaceCard className="p-3 space-y-3 text-xs">
            <p className="font-bold text-foreground inline-flex items-center gap-1.5">
              <Flag className="w-3.5 h-3.5 text-red-500" />
              <span>{t("reportHeading")}</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label className="text-[11px]">{t("reportPhoneLabel")}</Label>
                <LiquidGlassInput className="h-8 p-0 overflow-hidden">
                  <Input
                    value={reportPhone}
                    onChange={(e) => setReportPhone(e.target.value)}
                    placeholder="0988123456"
                    className="h-full text-xs bg-transparent! border-none shadow-none focus-visible:ring-0 px-2.5 font-mono"
                  />
                </LiquidGlassInput>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">
                  {t("reportReasonCodeLabel")}
                </Label>
                <Select
                  value={reportReasonCode}
                  onValueChange={(v) =>
                    setReportReasonCode(v as AbuseReasonCodeType)
                  }
                >
                  <TriggerSelect
                    fluid
                    enableGlassAnchor
                    className="h-8 text-xs"
                  >
                    <SelectValue />
                  </TriggerSelect>
                  <ContentSelect>
                    <ItemSelect value="BOM_HANG">
                      {t("reasonCodes.BOM_HANG")}
                    </ItemSelect>
                    <ItemSelect value="TU_CHOI_NHAN_NHIEU_LAN">
                      {t("reasonCodes.TU_CHOI_NHAN_NHIEU_LAN")}
                    </ItemSelect>
                    <ItemSelect value="BOOM_AO_SPAM">
                      {t("reasonCodes.BOOM_AO_SPAM")}
                    </ItemSelect>
                    <ItemSelect value="SAI_SO_DIEN_THOAI">
                      {t("reasonCodes.SAI_SO_DIEN_THOAI")}
                    </ItemSelect>
                    <ItemSelect value="OTHER">
                      {t("reasonCodes.OTHER")}
                    </ItemSelect>
                  </ContentSelect>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px]">{t("reportCarrierLabel")}</Label>
                <Select
                  value={reportCarrierCode}
                  onValueChange={setReportCarrierCode}
                >
                  <TriggerSelect
                    fluid
                    enableGlassAnchor
                    className="h-8 text-xs"
                  >
                    <SelectValue />
                  </TriggerSelect>
                  <ContentSelect>
                    <ItemSelect value="GHN">Giao Hàng Nhanh (GHN)</ItemSelect>
                    <ItemSelect value="GHTK">
                      Giao Hàng Tiết Kiệm (GHTK)
                    </ItemSelect>
                    <ItemSelect value="VTP">ViettelPost (VTP)</ItemSelect>
                    <ItemSelect value="JT">J&T Express</ItemSelect>
                    <ItemSelect value="SPX">Shopee / SPX</ItemSelect>
                    <ItemSelect value="NONE">
                      {t("reportNoCarrierOption")}
                    </ItemSelect>
                  </ContentSelect>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">
                  {t("reportTrackingLabel")}
                </Label>
                <LiquidGlassInput className="h-8 p-0 overflow-hidden">
                  <Input
                    value={reportTrackingNumber}
                    onChange={(e) => setReportTrackingNumber(e.target.value)}
                    placeholder="VD: G84X92KA..."
                    className="h-full text-xs bg-transparent! border-none shadow-none focus-visible:ring-0 px-2.5 font-mono"
                  />
                </LiquidGlassInput>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px]">{t("reportNoteLabel")}</Label>
              <textarea
                value={reportReasonNote}
                onChange={(e) => setReportReasonNote(e.target.value)}
                rows={3}
                placeholder={t("reportNotePlaceholder")}
                className="w-full rounded-xl border border-border/60 bg-background/70 p-2.5 text-xs focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <span>{t("reportBlacklistToggle")}</span>
              <Switch
                checked={reportMarkBlacklisted}
                onCheckedChange={setReportMarkBlacklisted}
              />
            </div>

            <div className="flex justify-end">
              <PatternButton
                type="button"
                size="sm"
                variant="solid"
                color="danger"
                rounded="full"
                isLoading={isReporting}
                disabled={!reportPhone.trim() || !reportReasonNote.trim()}
                icon={<Flag className="w-3.5 h-3.5" />}
                onClick={handleSubmitStandaloneReport}
              >
                {t("reportSubmitBtn")}
              </PatternButton>
            </div>
          </GlassSurfaceCard>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <LiquidGlassInput className="flex-1 h-9 p-0 overflow-hidden">
                <Input
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      void handleLookup(true);
                    }
                  }}
                  placeholder={t("phonePlaceholder")}
                  className="h-full text-xs bg-transparent! border-none shadow-none focus-visible:ring-0 px-3 font-mono"
                />
              </LiquidGlassInput>
              <PatternButton
                type="button"
                size="sm"
                variant="solid"
                color="primary"
                rounded="full"
                isLoading={isSearching}
                disabled={!phoneInput.trim()}
                icon={<Search className="w-3.5 h-3.5" />}
                onClick={() => handleLookup(true)}
              >
                {t("searchBtn")}
              </PatternButton>
            </div>

            {result?.warningMessage && (
              <GlassAlert
                variant="info"
                title={t("diagnosticWarningTitle")}
                description={result.warningMessage}
                icon={<ShieldCheck className="w-4 h-4 text-sky-500" />}
              />
            )}

            {result && evalData && (
              <ScrollArea className="max-h-[430px] pr-2">
                <div className="space-y-3">
                  <GlassSurfaceCard className="p-3 space-y-2.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 min-w-0">
                        {evalData.band === "HIGH_RISK_RED" ? (
                          <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
                        ) : evalData.band === "TRUSTED_GREEN" ? (
                          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                        )}
                        <TruncatedText className="text-xs font-bold text-foreground">
                          {result.phoneMasked}
                          {result.existingCustomerName
                            ? ` — ${result.existingCustomerName}`
                            : ""}
                        </TruncatedText>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <GlassBadge variant={evalData.badgeVariant} size="sm">
                          {evalData.headline}
                        </GlassBadge>
                        <PatternButton
                          type="button"
                          size="sm"
                          variant="glass"
                          color="danger"
                          rounded="full"
                          className="h-6 px-2 text-[10px]"
                          icon={<Flag className="w-3 h-3" />}
                          onClick={() => {
                            setReportPhone(phoneInput.trim());
                            setActiveTab("REPORT");
                          }}
                        >
                          {t("quickReportBtn")}
                        </PatternButton>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                        <p className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
                          {t("deliveredLabel")}
                        </p>
                        <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                          {evalData.totalDeliveredCount}
                        </p>
                        <p className="text-[9px] text-muted-foreground">
                          Shop: {evalData.shopDeliveredCount} • Mạng lưới:{" "}
                          {evalData.networkDeliveredCount}
                        </p>
                      </div>

                      <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center">
                        <p className="text-[10px] font-medium text-amber-700 dark:text-amber-300">
                          {t("returnedLabel")}
                        </p>
                        <p className="text-sm font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
                          {evalData.totalReturnedCount} (
                          {evalData.returnRatePercent}%)
                        </p>
                        <p className="text-[9px] text-muted-foreground">
                          Shop: {evalData.shopReturnedCount} • Mạng lưới:{" "}
                          {evalData.networkReturnedCount}
                        </p>
                      </div>

                      <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/30 text-center">
                        <p className="text-[10px] font-medium text-red-700 dark:text-red-300">
                          {t("reportedLabel")}
                        </p>
                        <p className="text-sm font-extrabold text-red-600 dark:text-red-400 tabular-nums">
                          {evalData.reportedCount}
                        </p>
                        <p className="text-[9px] text-muted-foreground">
                          {t("verifiedReportsShort", {
                            count: evalData.verifiedReportedCount || 0,
                          })}
                        </p>
                      </div>
                    </div>
                  </GlassSurfaceCard>

                  {Array.isArray(evalData.sourceBreakdowns) &&
                    evalData.sourceBreakdowns.length > 0 && (
                      <GlassSurfaceCard className="p-3 space-y-2">
                        <p className="inline-flex items-center gap-1.5 text-xs font-bold text-foreground">
                          <Layers className="w-3.5 h-3.5 text-primary" />
                          <span>{t("sourceBreakdownHeading")}</span>
                        </p>
                        <div className="overflow-x-auto">
                          <table className="w-full text-[11px]">
                            <thead>
                              <tr className="border-b border-border/50 text-muted-foreground">
                                <th className="py-1.5 text-left font-medium">
                                  {t("breakdownColSource")}
                                </th>
                                <th className="py-1.5 text-right font-medium">
                                  {t("breakdownColDelivered")}
                                </th>
                                <th className="py-1.5 text-right font-medium">
                                  {t("breakdownColReturned")}
                                </th>
                                <th className="py-1.5 text-right font-medium">
                                  {t("breakdownColReported")}
                                </th>
                                <th className="py-1.5 text-right font-medium">
                                  {t("breakdownColStatus")}
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                              {evalData.sourceBreakdowns.map(
                                (item: IDeliverySourceBreakdownItem) => (
                                  <tr key={item.sourceCode}>
                                    <td className="py-1.5 pr-2 font-medium text-foreground">
                                      {item.shortLabel}
                                    </td>
                                    <td className="py-1.5 text-right tabular-nums text-emerald-600 dark:text-emerald-400 font-semibold">
                                      {item.deliveredCount}
                                    </td>
                                    <td className="py-1.5 text-right tabular-nums text-amber-600 dark:text-amber-400 font-semibold">
                                      {item.returnedCount}
                                    </td>
                                    <td className="py-1.5 text-right tabular-nums text-red-600 dark:text-red-400 font-semibold">
                                      {item.reportedCount}
                                    </td>
                                    <td className="py-1.5 pl-2 text-right">
                                      <GlassBadge
                                        variant={
                                          PROVIDER_STATUS_BADGE_VARIANT[
                                            item.status
                                          ] ?? "secondary"
                                        }
                                        size="sm"
                                      >
                                        {t(`providerStatuses.${item.status}`)}
                                      </GlassBadge>
                                    </td>
                                  </tr>
                                ),
                              )}
                            </tbody>
                          </table>
                        </div>
                      </GlassSurfaceCard>
                    )}

                  {Array.isArray(evalData.reportedReasons) &&
                    evalData.reportedReasons.length > 0 && (
                      <GlassSurfaceCard className="p-3 space-y-2">
                        <p className="text-xs font-bold text-red-600 dark:text-red-400">
                          {t("reportsDetailHeading")} (
                          {evalData.reportedReasons.length})
                        </p>
                        <div className="space-y-1.5">
                          {evalData.reportedReasons.map((rep) => (
                            <div
                              key={rep.reportId}
                              className="p-2 rounded-xl border border-red-500/30 bg-red-500/5 text-[11px] space-y-1"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <GlassBadge variant="danger" size="sm">
                                  {rep.sourceLabel || rep.source || "Cảnh báo"}
                                </GlassBadge>
                                {rep.evidenceUrl && (
                                  <a
                                    href={rep.evidenceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
                                  >
                                    {t("openEvidenceLink")}
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                              <p className="text-foreground">
                                {rep.reasonNote || rep.reason}
                              </p>
                            </div>
                          ))}
                        </div>
                      </GlassSurfaceCard>
                    )}

                  {Array.isArray(evalData.providerDiagnostics) &&
                    evalData.providerDiagnostics.length > 0 && (
                      <GlassSurfaceCard className="p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-foreground">
                            <Activity className="w-3.5 h-3.5 text-primary" />
                            {t("providerDiagnosticsHeading")}
                          </span>
                          <PatternButton
                            type="button"
                            size="sm"
                            variant="ghost"
                            rounded="full"
                            className="h-6 px-2 text-[10px]"
                            icon={<RefreshCw className="w-3 h-3" />}
                            onClick={() => handleLookup(true)}
                          >
                            {t("forceRefreshBtn")}
                          </PatternButton>
                        </div>

                        <div className="space-y-1.5">
                          {evalData.providerDiagnostics.map(
                            (diag: ITrustProviderDiagnosticItem) => (
                              <div
                                key={diag.providerCode}
                                className="p-2 rounded-xl border border-border/50 bg-background/60 space-y-1 text-[11px]"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <TruncatedText className="font-semibold text-foreground">
                                    {diag.providerName}
                                  </TruncatedText>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {diag.latencyMs > 0 && (
                                      <span className="font-mono text-[9px] text-muted-foreground">
                                        {diag.latencyMs}ms
                                      </span>
                                    )}
                                    <GlassBadge
                                      variant={
                                        PROVIDER_STATUS_BADGE_VARIANT[
                                          diag.status
                                        ] ?? "secondary"
                                      }
                                      size="sm"
                                    >
                                      {t(`providerStatuses.${diag.status}`)}
                                    </GlassBadge>
                                  </div>
                                </div>
                                <p className="text-[10px] text-muted-foreground leading-relaxed">
                                  {diag.message}
                                </p>
                              </div>
                            ),
                          )}
                        </div>
                      </GlassSurfaceCard>
                    )}
                </div>
              </ScrollArea>
            )}
          </>
        )}
      </div>
    </GlassModal>
  );
}
