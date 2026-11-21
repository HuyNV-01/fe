"use client";

import { useState } from "react";
import {
  GlassAlert,
  GlassBadge,
  GlassModal,
  GlassSurfaceCard,
  GlassTabs,
  LiquidGlassInput,
  PatternButton,
  ScrollArea,
  TruncatedText,
} from "@/components/toolkit";
import { Input } from "@/components/ui/input";
import { useCrmStore } from "@/lib/stores/crm/use-crm-store";
import type {
  IImportPhoneTrustHistoryRow,
  IStandalonePhoneTrustLookupResult,
  ITrustProviderDiagnosticItem,
  TrustProviderStatusType,
} from "@/types/crm";
import {
  Activity,
  AlertTriangle,
  Database,
  ExternalLink,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { useTranslations } from "next-intl";

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
  NOT_CONFIGURED: "warning",
  PROVIDER_ERROR: "danger",
};

export function PhoneTrustLookupModal({
  open,
  onOpenChange,
  shopId,
  initialPhone = "",
}: PhoneTrustLookupModalProps) {
  const t = useTranslations("Crm360.trustLookupModal");
  const {
    lookupStandalonePhoneTrust,
    backfillShopTrustLedger,
    importPhoneTrustHistory,
  } = useCrmStore();

  const [activeTab, setActiveTab] = useState<"LOOKUP" | "IMPORT">("LOOKUP");
  const [phoneInput, setPhoneInput] = useState(initialPhone);
  const [csvText, setCsvText] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isBackfilling, setIsBackfilling] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] =
    useState<IStandalonePhoneTrustLookupResult | null>(null);

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
    }
    setIsSearching(false);
  };

  const handleBackfill = async () => {
    setIsBackfilling(true);
    await backfillShopTrustLedger(shopId);
    setIsBackfilling(false);
    if (phoneInput.trim()) {
      await handleLookup(true);
    }
  };

  const handleImportCsv = async () => {
    const lines = csvText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return;

    const rows: IImportPhoneTrustHistoryRow[] = [];
    for (const line of lines) {
      const parts = line.split(/[,\t;]/).map((p) => p.trim());
      const rawPhone = (parts[0] || "").replace(/\D/g, "");
      if (rawPhone.length < 9) continue;
      rows.push({
        rawPhone,
        deliveredCount: Math.max(0, Number(parts[1] || 0)) || 0,
        returnedCount: Math.max(0, Number(parts[2] || 0)) || 0,
        carrierCode: parts[3] || "INTERNAL",
        abuseReasonNote: parts[4] || undefined,
      });
    }
    if (rows.length === 0) return;

    setIsImporting(true);
    const res = await importPhoneTrustHistory({ shopId, rows });
    setIsImporting(false);
    if (res) {
      setCsvText("");
      setActiveTab("LOOKUP");
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
        <div className="flex items-center justify-between w-full gap-2">
          <PatternButton
            type="button"
            size="sm"
            variant="glass"
            color="info"
            rounded="full"
            isLoading={isBackfilling}
            icon={<Database className="w-3.5 h-3.5" />}
            onClick={handleBackfill}
          >
            {t("backfillBtn")}
          </PatternButton>

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
          onValueChange={(v) => setActiveTab(v as "LOOKUP" | "IMPORT")}
          items={[
            { key: "LOOKUP", label: t("lookupTabLabel") },
            { key: "IMPORT", label: t("importTabLabel") },
          ]}
        />

        {activeTab === "IMPORT" ? (
          <GlassSurfaceCard className="p-3 space-y-2.5">
            <p className="text-xs font-semibold text-foreground">
              {t("importHeading")}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {t("importFormatHint")}
            </p>
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              rows={6}
              placeholder={
                "0988123456, 3, 0, GHN\n0912345678, 0, 2, GHTK, Khách tắt máy 3 ca giao không nhận"
              }
              className="w-full rounded-xl border border-border/60 bg-background/70 p-2.5 text-xs font-mono focus:outline-none"
            />
            <div className="flex justify-end">
              <PatternButton
                type="button"
                size="sm"
                variant="solid"
                color="primary"
                rounded="full"
                isLoading={isImporting}
                disabled={!csvText.trim()}
                icon={<Upload className="w-3.5 h-3.5" />}
                onClick={handleImportCsv}
              >
                {t("importSubmitBtn")}
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
              <ScrollArea className="max-h-[400px] pr-2">
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
                      <GlassBadge variant={evalData.badgeVariant} size="sm">
                        {evalData.headline}
                      </GlassBadge>
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
                          Shop: {evalData.shopDeliveredCount} • Sổ cái:{" "}
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
                          Shop: {evalData.shopReturnedCount} • Sổ cái:{" "}
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
