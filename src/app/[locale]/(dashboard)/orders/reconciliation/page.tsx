"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, Download, FileSpreadsheet, Upload } from "lucide-react";
import {
  ContentSelect,
  GlassBadge,
  GlassEmptyState,
  GlassSectionHeader,
  GlassSurfaceCard,
  GlassTabs,
  ItemSelect,
  PatternButton,
  ScrollArea,
  ScrollBar,
  TriggerSelect,
} from "@/components/toolkit";
import { Select } from "@/components/ui/select";
import { OmsSubNavBar } from "@/components/oms/oms-status-meta";
import { usePermissionStore } from "@/lib/stores/iam/use-permission-store";
import { useOmsFulfillmentStore } from "@/lib/stores/oms/use-oms-fulfillment-store";
import type { CodReconciliationDiscrepancyType } from "@/types/oms";
import { toast } from "sonner";

type FilterDiscrepancyTab = "ALL" | CodReconciliationDiscrepancyType;

export default function CodReconciliationPage() {
  const t = useTranslations("OmsFulfillment");
  const activeShopId = usePermissionStore((s) => s.activeShopId);

  const codBatches = useOmsFulfillmentStore((s) => s.codBatches);
  const activeCodBatch = useOmsFulfillmentStore((s) => s.activeCodBatch);
  const activeCodBatchItems = useOmsFulfillmentStore(
    (s) => s.activeCodBatchItems,
  );
  const isSubmitting = useOmsFulfillmentStore((s) => s.isSubmitting);
  const fetchCodBatches = useOmsFulfillmentStore((s) => s.fetchCodBatches);
  const createCodBatch = useOmsFulfillmentStore((s) => s.createCodBatch);
  const fetchCodBatchDetail = useOmsFulfillmentStore(
    (s) => s.fetchCodBatchDetail,
  );
  const confirmMatchedCodBatch = useOmsFulfillmentStore(
    (s) => s.confirmMatchedCodBatch,
  );
  const downloadCodDisputesCsv = useOmsFulfillmentStore(
    (s) => s.downloadCodDisputesCsv,
  );

  const [carrierCode, setCarrierCode] = useState<"GHN" | "GHTK" | "VTP" | "JT">(
    "GHN",
  );
  const [filterTab, setFilterTab] = useState<FilterDiscrepancyTab>("ALL");

  useEffect(() => {
    if (activeShopId) {
      fetchCodBatches(activeShopId);
    }
  }, [activeShopId, fetchCodBatches]);

  useEffect(() => {
    if (activeShopId && activeCodBatch?.id) {
      fetchCodBatchDetail(
        activeShopId,
        activeCodBatch.id,
        filterTab === "ALL" ? undefined : filterTab,
      );
    }
  }, [activeShopId, activeCodBatch?.id, filterTab, fetchCodBatchDetail]);

  /**
   * Parse file CSV đối soát từ GHN/GHTK/VTP/J&T ngay trên trình duyệt
   * (Cột hỗ trợ: trackingNumber, orderCode, actualCodAmount, actualShippingFee, carrierChargedWeightGrams, returnFeeCharged).
   */
  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeShopId) return;

    const text = await file.text();
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      toast.error("File CSV không có dữ liệu đối soát");
      return;
    }

    const rows = lines
      .slice(1)
      .map((line) => {
        const cols = line.split(",").map((c) => c.replace(/^"|"$/g, "").trim());
        return {
          trackingNumber: cols[0] || "",
          orderCode: cols[1] || undefined,
          actualCodAmount: Number(cols[2] || 0),
          actualShippingFee: Number(cols[3] || 0),
          carrierChargedWeightGrams: cols[4] ? Number(cols[4]) : undefined,
          returnFeeCharged: cols[5] ? Number(cols[5]) : 0,
        };
      })
      .filter((r) => Boolean(r.trackingNumber));

    if (rows.length === 0) {
      toast.error("Không đọc được mã vận đơn hợp lệ trong file CSV");
      return;
    }

    await createCodBatch({
      shopId: activeShopId,
      carrierCode,
      sourceFileName: file.name,
      rows,
    });
    e.target.value = "";
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-4">
      <GlassSectionHeader
        icon={<FileSpreadsheet className="w-5 h-5" />}
        title={t("reconciliationPage.title")}
        subtitle={t("reconciliationPage.subtitle")}
        actions={
          <div className="flex items-center gap-2">
            <div className="w-36">
              <Select
                value={carrierCode}
                onValueChange={(v) =>
                  setCarrierCode(v as "GHN" | "GHTK" | "VTP" | "JT")
                }
              >
                <TriggerSelect>
                  <span>{carrierCode}</span>
                </TriggerSelect>
                <ContentSelect>
                  <ItemSelect value="GHN">GHN</ItemSelect>
                  <ItemSelect value="GHTK">GHTK</ItemSelect>
                  <ItemSelect value="VTP">Viettel Post</ItemSelect>
                  <ItemSelect value="JT">J&T Express</ItemSelect>
                </ContentSelect>
              </Select>
            </div>
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".csv,.txt"
                className="hidden"
                onChange={handleCsvUpload}
              />
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs">
                <Upload className="w-3.5 h-3.5" />
                Tải file đối soát CSV
              </span>
            </label>
          </div>
        }
      />

      <OmsSubNavBar />

      {codBatches.length > 0 && (
        <GlassSurfaceCard
          header={
            <span className="text-xs font-bold">
              Các phiên đối soát gần đây
            </span>
          }
        >
          <div className="flex flex-wrap gap-2">
            {codBatches.map((b) => (
              <PatternButton
                key={b.id}
                variant={activeCodBatch?.id === b.id ? "solid" : "glass"}
                color={activeCodBatch?.id === b.id ? "primary" : "neutral"}
                size="sm"
                onClick={() =>
                  activeShopId && fetchCodBatchDetail(activeShopId, b.id)
                }
              >
                {b.batchCode} ({b.carrierCode}) • {b.matchedOrdersCount}/
                {b.totalOrdersCount} khớp
              </PatternButton>
            ))}
          </div>
        </GlassSurfaceCard>
      )}

      {!activeCodBatch ? (
        <GlassSurfaceCard>
          <GlassEmptyState
            icon={<FileSpreadsheet className="w-8 h-8" />}
            title="Chưa chọn phiên đối soát COD"
            description="Tải file CSV đối soát từ GHN/GHTK/VTP/J&T hoặc chọn 1 phiên đã tải lên ở phía trên."
          />
        </GlassSurfaceCard>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <GlassSurfaceCard>
              <div className="text-xs text-muted-foreground">
                COD Hệ thống / Thực trả
              </div>
              <div className="text-sm font-bold mt-1">
                {Number(activeCodBatch.expectedCodTotal).toLocaleString(
                  "vi-VN",
                )}
                đ /{" "}
                <span className="text-primary">
                  {Number(activeCodBatch.actualCodTotal).toLocaleString(
                    "vi-VN",
                  )}
                  đ
                </span>
              </div>
            </GlassSurfaceCard>
            <GlassSurfaceCard>
              <div className="text-xs text-muted-foreground">
                Phí Ship Dự kiến / Thực trừ
              </div>
              <div className="text-sm font-bold mt-1">
                {Number(activeCodBatch.expectedShippingFeeTotal).toLocaleString(
                  "vi-VN",
                )}
                đ /{" "}
                <span className="text-amber-600">
                  {Number(activeCodBatch.actualShippingFeeTotal).toLocaleString(
                    "vi-VN",
                  )}
                  đ
                </span>
              </div>
            </GlassSurfaceCard>
            <GlassSurfaceCard>
              <div className="text-xs text-muted-foreground">
                Thực nhận về Sổ quỹ
              </div>
              <div className="text-lg font-black text-emerald-600 mt-1">
                {Number(activeCodBatch.netSettlementAmount).toLocaleString(
                  "vi-VN",
                )}
                đ
              </div>
            </GlassSurfaceCard>
            <GlassSurfaceCard>
              <div className="flex flex-col gap-2">
                <PatternButton
                  variant="solid"
                  color="success"
                  size="sm"
                  isLoading={isSubmitting}
                  onClick={() =>
                    activeShopId &&
                    confirmMatchedCodBatch(activeShopId, activeCodBatch.id)
                  }
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Tất toán đơn khớp
                </PatternButton>
                <PatternButton
                  variant="glass"
                  color="danger"
                  size="sm"
                  onClick={() =>
                    activeShopId &&
                    downloadCodDisputesCsv(activeShopId, activeCodBatch.id)
                  }
                >
                  <Download className="w-3.5 h-3.5 mr-1" />
                  Xuất khiếu nại CSV
                </PatternButton>
              </div>
            </GlassSurfaceCard>
          </div>

          <GlassTabs
            value={filterTab}
            onValueChange={(v) => setFilterTab(v as FilterDiscrepancyTab)}
            size="sm"
            items={[
              {
                key: "ALL",
                label: "Tất cả",
                badge: activeCodBatch.totalOrdersCount,
              },
              {
                key: "MATCHED",
                label: "✅ Khớp 100%",
                badge: activeCodBatch.matchedOrdersCount,
              },
              { key: "COD_SHORTFALL", label: "🔴 Lệch thiếu COD" },
              { key: "WEIGHT_OVERCHARGE", label: "⚖️ Đội cước cân nặng" },
              { key: "RETURN_FEE_ERROR", label: "🟠 Sai phí hoàn" },
              { key: "UNIDENTIFIED_TRACKING", label: "❓ Mã vận đơn lạ" },
            ]}
          />

          <GlassSurfaceCard>
            <ScrollArea className="w-full">
              <table className="w-full text-left text-xs border-collapse min-w-[900px]">
                <thead>
                  <tr className="border-b border-border/50 text-muted-foreground">
                    <th className="py-2 px-2">Mã vận đơn / Mã đơn</th>
                    <th className="py-2 px-2">Phân loại</th>
                    <th className="py-2 px-2 text-right">COD (HT / Thực)</th>
                    <th className="py-2 px-2 text-right">
                      Phí Ship (DK / Thực)
                    </th>
                    <th className="py-2 px-2 text-center">Cân (Kho / 3PL)</th>
                    <th className="py-2 px-2">Chi tiết đối soát / Khiếu nại</th>
                  </tr>
                </thead>
                <tbody>
                  {activeCodBatchItems.map((item) => (
                    <tr key={item.id} className="border-b border-border/30">
                      <td className="py-2.5 px-2 font-mono font-semibold">
                        <div>{item.trackingNumber}</div>
                        <div className="text-muted-foreground">
                          {item.orderCode || "—"}
                        </div>
                      </td>
                      <td className="py-2.5 px-2">
                        <GlassBadge
                          variant={
                            item.discrepancyType === "MATCHED"
                              ? "success"
                              : "danger"
                          }
                        >
                          {item.discrepancyType}
                        </GlassBadge>
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        {Number(item.expectedCodAmount).toLocaleString("vi-VN")}
                        đ /{" "}
                        <strong>
                          {Number(item.actualCodAmount).toLocaleString("vi-VN")}
                          đ
                        </strong>
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        {Number(item.expectedShippingFee).toLocaleString(
                          "vi-VN",
                        )}
                        đ /{" "}
                        <strong>
                          {Number(item.actualShippingFee).toLocaleString(
                            "vi-VN",
                          )}
                          đ
                        </strong>
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        {item.actualPackedWeightGrams ?? "—"}g /{" "}
                        <strong>
                          {item.carrierChargedWeightGrams ?? "—"}g
                        </strong>
                      </td>
                      <td className="py-2.5 px-2 text-muted-foreground">
                        {item.disputeNote ||
                          (item.isReconciled ? "Đã tất toán" : "Khớp chuẩn")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </GlassSurfaceCard>
        </>
      )}
    </div>
  );
}
