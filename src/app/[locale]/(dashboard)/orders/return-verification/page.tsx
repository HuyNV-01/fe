/** biome-ignore-all lint/a11y/noLabelWithoutControl: <explanation> */
"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Barcode, PackageCheck, ShieldAlert } from "lucide-react";
import {
  ContentSelect,
  GlassEmptyState,
  GlassSectionHeader,
  GlassSurfaceCard,
  ItemSelect,
  LiquidGlassInput,
  PatternButton,
  Switch,
  TriggerSelect,
} from "@/components/toolkit";
import { Select } from "@/components/ui/select";
import { OmsStatusBadge, OmsSubNavBar } from "@/components/oms/oms-status-meta";
import { usePermissionStore } from "@/lib/stores/iam/use-permission-store";
import { useOmsFulfillmentStore } from "@/lib/stores/oms/use-oms-fulfillment-store";
import type { OmsReturnConditionType } from "@/types/oms";
import { useHardwareBarcodeScanner } from "@/utils/hooks/use-hardware-barcode-scanner";

interface ReturnItemFormRow {
  variantId: string;
  skuCode: string;
  variantName: string;
  expectedQty: number;
  verifiedQty: number;
  condition: OmsReturnConditionType;
  inspectionNote: string;
}

export default function ReturnVerificationPage() {
  const t = useTranslations("OmsFulfillment");
  const activeShopId = usePermissionStore((s) => s.activeShopId);

  const returningOrder = useOmsFulfillmentStore((s) => s.returningOrder);
  const isSubmitting = useOmsFulfillmentStore((s) => s.isSubmitting);
  const lookupReturningOrder = useOmsFulfillmentStore(
    (s) => s.lookupReturningOrder,
  );
  const verifyReturnedOrder = useOmsFulfillmentStore(
    (s) => s.verifyReturnedOrder,
  );

  const [scanInput, setScanInput] = useState("");
  const [rows, setRows] = useState<ReturnItemFormRow[]>([]);
  const [createClaim, setCreateClaim] = useState(true);
  const [overallNote, setOverallNote] = useState("");

  useHardwareBarcodeScanner({
    enabled: Boolean(activeShopId),
    onScan: (code) => {
      if (activeShopId) lookupReturningOrder(activeShopId, code);
    },
  });

  useEffect(() => {
    if (!returningOrder) {
      setRows([]);
      return;
    }
    setRows(
      (returningOrder.itemsJson || []).map((item) => ({
        variantId: item.variantId,
        skuCode: item.skuCode,
        variantName: item.variantName,
        expectedQty: item.quantity,
        verifiedQty: item.quantity,
        condition: "GOOD_RESTOCK",
        inspectionNote: "",
      })),
    );
  }, [returningOrder]);

  const handleLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeShopId && scanInput.trim()) {
      lookupReturningOrder(activeShopId, scanInput.trim());
      setScanInput("");
    }
  };

  const handleConfirmVerification = async () => {
    if (!activeShopId || !returningOrder) return;
    await verifyReturnedOrder({
      shopId: activeShopId,
      orderId: returningOrder.id,
      items: rows.map((r) => ({
        variantId: r.variantId,
        verifiedQty: r.verifiedQty,
        condition: r.condition,
        inspectionNote: r.inspectionNote.trim() || undefined,
      })),
      createCarrierCompensationClaim: createClaim,
      overallNote: overallNote.trim() || undefined,
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-4">
      <GlassSectionHeader
        icon={<PackageCheck className="w-5 h-5" />}
        title={t("returnPage.title")}
        subtitle={t("returnPage.subtitle")}
      />

      <OmsSubNavBar />

      <GlassSurfaceCard>
        <form
          onSubmit={handleLookupSubmit}
          className="flex flex-col sm:flex-row gap-3"
        >
          <LiquidGlassInput className="flex-1">
            <input
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              placeholder="Quét mã vận đơn hoặc mã đơn hoàn về tới kho..."
              className="w-full bg-transparent px-3 py-2 text-sm font-mono outline-none"
            />
          </LiquidGlassInput>
          <PatternButton type="submit" variant="solid" color="primary">
            <Barcode className="w-4 h-4 mr-1.5" />
            Mở kiểm hoàn
          </PatternButton>
        </form>
      </GlassSurfaceCard>

      {!returningOrder ? (
        <GlassSurfaceCard>
          <GlassEmptyState
            icon={<PackageCheck className="w-8 h-8" />}
            title="Sẵn sàng nhận kiện hàng hoàn"
            description="Quét mã vận đơn trên vỏ hộp hoàn để đối chiếu danh sách SKU đã xuất đi trước khi cộng lại tồn kho."
          />
        </GlassSurfaceCard>
      ) : (
        <GlassSurfaceCard
          header={
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-base">
                  Đồng kiểm đơn hoàn {returningOrder.orderCode} (
                  {returningOrder.trackingNumber})
                </div>
                <div className="text-xs text-muted-foreground">
                  Khách: {returningOrder.customerName} • Kho nhận:{" "}
                  {returningOrder.warehouseName}
                </div>
              </div>
              <OmsStatusBadge status={returningOrder.status} />
            </div>
          }
          footer={
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <Switch
                  checked={createClaim}
                  onCheckedChange={setCreateClaim}
                />
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <span>
                  Tự động mở hồ sơ khiếu nại ĐVVC nếu phát hiện hàng hỏng / bị
                  tráo
                </span>
              </label>
              <PatternButton
                variant="solid"
                color="success"
                isLoading={isSubmitting}
                onClick={handleConfirmVerification}
              >
                Xác nhận đồng kiểm & Nhập kho
              </PatternButton>
            </div>
          }
        >
          <div className="space-y-3">
            {rows.map((row, idx) => (
              <div
                key={row.variantId}
                className="p-3 rounded-xl border border-border/50 grid grid-cols-1 md:grid-cols-12 gap-3 items-center"
              >
                <div className="md:col-span-4">
                  <div className="font-semibold text-sm">{row.variantName}</div>
                  <div className="text-xs text-muted-foreground font-mono">
                    SKU: {row.skuCode} • Xuất đi: x{row.expectedQty}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <LiquidGlassInput>
                    <input
                      type="number"
                      min={0}
                      max={row.expectedQty}
                      value={row.verifiedQty}
                      onChange={(e) => {
                        const val = Math.max(0, Number(e.target.value || 0));
                        setRows((prev) =>
                          prev.map((r, i) =>
                            i === idx ? { ...r, verifiedQty: val } : r,
                          ),
                        );
                      }}
                      className="w-full bg-transparent px-2.5 py-1.5 text-sm font-bold outline-none"
                    />
                  </LiquidGlassInput>
                </div>
                <div className="md:col-span-3">
                  <Select
                    value={row.condition}
                    onValueChange={(v) =>
                      setRows((prev) =>
                        prev.map((r, i) =>
                          i === idx
                            ? { ...r, condition: v as OmsReturnConditionType }
                            : r,
                        ),
                      )
                    }
                  >
                    <TriggerSelect>
                      <span>{row.condition}</span>
                    </TriggerSelect>
                    <ContentSelect>
                      <ItemSelect value="GOOD_RESTOCK">
                        Nguyên vẹn → Nhập tồn bán
                      </ItemSelect>
                      <ItemSelect value="DAMAGED_OR_SWAPPED">
                        Hỏng / Bị tráo → Kho lỗi
                      </ItemSelect>
                      <ItemSelect value="MISSING_ITEM">
                        Thiếu hàng trong kiện
                      </ItemSelect>
                    </ContentSelect>
                  </Select>
                </div>
                <div className="md:col-span-3">
                  <LiquidGlassInput>
                    <input
                      value={row.inspectionNote}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((r, i) =>
                            i === idx
                              ? { ...r, inspectionNote: e.target.value }
                              : r,
                          ),
                        )
                      }
                      placeholder="Ghi chú kiểm đếm..."
                      className="w-full bg-transparent px-2.5 py-1.5 text-xs outline-none"
                    />
                  </LiquidGlassInput>
                </div>
              </div>
            ))}
            <LiquidGlassInput>
              <input
                value={overallNote}
                onChange={(e) => setOverallNote(e.target.value)}
                placeholder="Ghi chú biên bản đồng kiểm chung..."
                className="w-full bg-transparent px-3 py-2 text-sm outline-none"
              />
            </LiquidGlassInput>
          </div>
        </GlassSurfaceCard>
      )}
    </div>
  );
}
