"use client";

import { useEffect, useState } from "react";
import {
  ContentSelect,
  GlassAvatar,
  GlassBadge,
  GlassEmptyState,
  GlassSectionHeader,
  GlassSurfaceCard,
  ItemSelect,
  LiquidSearch,
  PatternButton,
  TriggerSelect,
} from "@/components/toolkit";
import { Select, SelectValue } from "@/components/ui/select";
import { PermissionGate } from "@/components/iam/permission-gate";
import { usePermissionStore } from "@/lib/stores/iam/use-permission-store";
import { useCrmStore } from "@/lib/stores/crm/use-crm-store";
import { PiiMaskedPhoneField } from "@/components/crm/pii-masked-phone-field";
import type { CustomerTierType, RfmSegmentCodeType } from "@/types/crm";
import {
  Award,
  BarChart3,
  Download,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import config from "@/config";

export default function CustomersCrmPage() {
  const t = useTranslations("Crm360.directoryPage");
  const activeShopId = usePermissionStore((s) => s.activeShopId);
  const {
    customers,
    customersTotal,
    isLoadingCustomers,
    fetchCustomers,
    exportCustomersWithAudit,
  } = useCrmStore();

  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("ALL");
  const [rfmFilter, setRfmFilter] = useState<string>("ALL");
  const [highRiskOnly, setHighRiskOnly] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!activeShopId) return;
    fetchCustomers({
      shopId: activeShopId,
      page: 1,
      limit: 30,
      search: search.trim() || undefined,
      tier: tierFilter !== "ALL" ? (tierFilter as CustomerTierType) : undefined,
      rfmSegment:
        rfmFilter !== "ALL" ? (rfmFilter as RfmSegmentCodeType) : undefined,
      highRiskOnly: highRiskOnly || undefined,
    });
  }, [
    activeShopId,
    search,
    tierFilter,
    rfmFilter,
    highRiskOnly,
    fetchCustomers,
  ]);

  if (!activeShopId) return null;

  const handleExportSafeCsv = async () => {
    setIsExporting(true);
    const ok = await exportCustomersWithAudit({
      shopId: activeShopId,
      exportedCount: customers.length,
      filterSummary: `tier=${tierFilter};rfm=${rfmFilter};highRisk=${highRiskOnly}`,
    });
    setIsExporting(false);
    if (!ok) return;

    const header = [
      "Mã KH",
      "Họ và tên",
      "SĐT (Đã che PII)",
      "Hạng thẻ",
      "Phân khúc RFM",
      "Điểm uy tín",
      "Tổng chi tiêu (VND)",
      "Điểm thưởng",
      "Số dư Ví",
      "Địa chỉ 3 cấp",
    ];
    const rows = customers.map((c) => [
      c.code,
      `"${(c.fullName || "").replace(/"/g, '""')}"`,
      c.phoneMasked || "098***678",
      c.tier,
      c.rfmSegmentCode,
      c.trustEvaluation?.score ?? c.deliveryTrustScore ?? 80,
      c.lifetimeValueAmount || 0,
      c.loyaltyPointsBalance || 0,
      c.walletCreditBalance || 0,
      `"${[
        c.defaultAddressLine,
        c.defaultWardName,
        c.defaultDistrictName,
        c.defaultProvinceName,
      ]
        .filter(Boolean)
        .join(", ")
        .replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "\uFEFF" + [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `crm360-customers-masked-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-5">
      <GlassSectionHeader
        icon={<Users className="w-5 h-5" />}
        title={t("title")}
        subtitle={t("subtitle", { total: customersTotal })}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <PermissionGate can="CRM_CUSTOMER_EXPORT_FILE" mode="hide">
              <PatternButton
                type="button"
                variant="outline"
                size="sm"
                rounded="full"
                isLoading={isExporting}
                icon={<Download className="w-4 h-4" />}
                onClick={handleExportSafeCsv}
              >
                {t("exportCsvBtn")}
              </PatternButton>
            </PermissionGate>
            <Link href={config.routes.private.customerRfmSegments}>
              <PatternButton
                type="button"
                variant="glass"
                color="info"
                size="sm"
                rounded="full"
                icon={<BarChart3 className="w-4 h-4" />}
              >
                {t("rfmMatrixBtn")}
              </PatternButton>
            </Link>
            <Link href={config.routes.private.settingsSecurityAudit}>
              <PatternButton
                type="button"
                variant="outline"
                size="sm"
                rounded="full"
                icon={<ShieldCheck className="w-4 h-4" />}
              >
                {t("securityAuditBtn")}
              </PatternButton>
            </Link>
          </div>
        }
      />

      {/* Bộ lọc Tìm kiếm Chỉ mục mù SĐT (< 2ms), Hạng thẻ, Phân khúc RFM & Cảnh báo Bom hàng */}
      <GlassSurfaceCard className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
          <div className="md:col-span-2">
            <LiquidSearch
              mode="input"
              value={search}
              onSearch={setSearch}
              placeholder={t("searchPlaceholder")}
            />
          </div>

          <Select value={tierFilter} onValueChange={setTierFilter}>
            <TriggerSelect className="w-full justify-between">
              <SelectValue placeholder={t("filterByTier")} />
            </TriggerSelect>
            <ContentSelect>
              <ItemSelect value="ALL">{t("allTiers")}</ItemSelect>
              <ItemSelect value="VIP">VIP</ItemSelect>
              <ItemSelect value="GOLD">GOLD</ItemSelect>
              <ItemSelect value="SILVER">SILVER</ItemSelect>
              <ItemSelect value="NEW">NEW</ItemSelect>
              <ItemSelect value="BLACKLIST">BLACKLIST (Bom hàng)</ItemSelect>
            </ContentSelect>
          </Select>

          <div className="flex items-center gap-2">
            <Select value={rfmFilter} onValueChange={setRfmFilter}>
              <TriggerSelect className="w-full justify-between">
                <SelectValue placeholder={t("filterByRfm")} />
              </TriggerSelect>
              <ContentSelect>
                <ItemSelect value="ALL">{t("allRfmSegments")}</ItemSelect>
                <ItemSelect value="CHAMPIONS">CHAMPIONS</ItemSelect>
                <ItemSelect value="LOYAL">LOYAL</ItemSelect>
                <ItemSelect value="POTENTIAL_LOYALIST">
                  POTENTIAL_LOYALIST
                </ItemSelect>
                <ItemSelect value="NEW_CUSTOMERS">NEW_CUSTOMERS</ItemSelect>
                <ItemSelect value="AT_RISK">AT_RISK</ItemSelect>
                <ItemSelect value="HIBERNATING">HIBERNATING</ItemSelect>
              </ContentSelect>
            </Select>

            <PatternButton
              type="button"
              size="sm"
              variant={highRiskOnly ? "solid" : "outline"}
              color="danger"
              rounded="full"
              onClick={() => setHighRiskOnly((v) => !v)}
              icon={<ShieldAlert className="w-3.5 h-3.5" />}
            >
              {t("highRiskBtn")}
            </PatternButton>
          </div>
        </div>
      </GlassSurfaceCard>

      {!isLoadingCustomers && customers.length === 0 ? (
        <GlassSurfaceCard>
          <GlassEmptyState
            icon={<Users className="w-7 h-7" />}
            title={t("emptyTitle")}
            description={t("emptyDesc")}
          />
        </GlassSurfaceCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((cust) => {
            const trust = cust.trustEvaluation;
            const totalDelivered =
              trust?.totalDeliveredCount ??
              Number(cust.successfulDeliveriesCount || 0) +
                Number(cust.networkDeliveredCount || 0);
            const totalReturned =
              trust?.totalReturnedCount ??
              Number(cust.returnedOrdersCount || 0) +
                Number(cust.networkReturnedCount || 0);
            const totalReported =
              trust?.reportedCount ?? Number(cust.reportedCount || 0);

            return (
              <GlassSurfaceCard
                key={cust.id}
                className="p-4 flex flex-col justify-between space-y-3.5"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <GlassAvatar
                        src={cust.avatarUrl}
                        name={cust.fullName}
                        size="md"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-sm font-bold truncate">
                            {cust.fullName}
                          </h3>
                          <GlassBadge
                            variant={
                              cust.tier === "VIP"
                                ? "accent"
                                : cust.tier === "GOLD"
                                  ? "warning"
                                  : cust.tier === "BLACKLIST"
                                    ? "danger"
                                    : "primary"
                            }
                            size="sm"
                          >
                            <Award className="w-2.5 h-2.5 mr-0.5 inline" />
                            {cust.tier}
                          </GlassBadge>
                        </div>
                        <p className="text-[11px] font-mono text-muted-foreground">
                          {cust.code} • RFM: {cust.rfmSegmentCode}
                        </p>
                      </div>
                    </div>

                    <Link
                      href={config.routes.private.customerDetail(cust.id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline shrink-0"
                    >
                      <span>{t("viewDetailBtn")}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {/* SĐT che bảo mật PII Vault + Mở khóa 15 giây */}
                  <PiiMaskedPhoneField
                    shopId={activeShopId}
                    customerId={cust.id}
                    phoneMasked={cust.phoneMasked}
                  />

                  {/* Địa chỉ hành chính 3 cấp */}
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    📍{" "}
                    {[
                      cust.defaultAddressLine,
                      cust.defaultWardName,
                      cust.defaultDistrictName,
                      cust.defaultProvinceName,
                    ]
                      .filter(Boolean)
                      .join(", ") || t("noAddressYet")}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-border/40 flex items-center justify-between gap-2 flex-wrap">
                  {trust && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <GlassBadge variant={trust.badgeVariant} size="sm">
                        Uy tín: {trust.score}/100 ({totalDelivered} nhận /{" "}
                        {totalReturned} hoàn)
                      </GlassBadge>
                      {totalReported > 0 && (
                        <GlassBadge variant="danger" size="sm">
                          🚨 Báo xấu: {totalReported}
                        </GlassBadge>
                      )}
                    </div>
                  )}

                  <span className="text-xs font-bold tabular-nums text-foreground">
                    LTV:{" "}
                    {Number(cust.lifetimeValueAmount || 0).toLocaleString(
                      "vi-VN",
                    )}
                    đ
                  </span>
                </div>
              </GlassSurfaceCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
