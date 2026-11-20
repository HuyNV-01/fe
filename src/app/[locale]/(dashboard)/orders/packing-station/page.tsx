/** biome-ignore-all lint/a11y/noLabelWithoutControl: <explanation> */
"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Barcode, CheckCircle2, Printer, Scale, Video } from "lucide-react";
import {
  ContentSelect,
  GlassAlert,
  GlassBadge,
  GlassEmptyState,
  GlassSectionHeader,
  GlassSurfaceCard,
  ItemSelect,
  LiquidGlassInput,
  PatternButton,
  TriggerSelect,
} from "@/components/toolkit";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { OmsStatusBadge, OmsSubNavBar } from "@/components/oms/oms-status-meta";
import { usePermissionStore } from "@/lib/stores/iam/use-permission-store";
import { useOmsFulfillmentStore } from "@/lib/stores/oms/use-oms-fulfillment-store";
import type { ThermalLabelFormatType } from "@/types/oms";
import {
  useElectronicScaleReader,
  useHardwareBarcodeScanner,
} from "@/utils/hooks/use-hardware-barcode-scanner";

export default function PackingStationPage() {
  const t = useTranslations("OmsFulfillment");
  const activeShopId = usePermissionStore((s) => s.activeShopId);

  const packingOrder = useOmsFulfillmentStore((s) => s.packingOrder);
  const packingProgress = useOmsFulfillmentStore((s) => s.packingProgress);
  const lastScanAlert = useOmsFulfillmentStore((s) => s.lastScanAlert);
  const isSubmitting = useOmsFulfillmentStore((s) => s.isSubmitting);
  const lookupPackingOrder = useOmsFulfillmentStore(
    (s) => s.lookupPackingOrder,
  );
  const scanPackingBarcode = useOmsFulfillmentStore(
    (s) => s.scanPackingBarcode,
  );
  const completePackingAndPrint = useOmsFulfillmentStore(
    (s) => s.completePackingAndPrint,
  );

  const [manualInput, setManualInput] = useState("");
  const [weightGrams, setWeightGrams] = useState("500");
  const [packingVideoUrl, setPackingVideoUrl] = useState("");
  const [labelFormat, setLabelFormat] =
    useState<ThermalLabelFormatType>("A6_100X150");

  const {
    isConnected,
    liveWeightGrams,
    scaleError,
    connectScale,
    disconnectScale,
  } = useElectronicScaleReader();

  useEffect(() => {
    if (liveWeightGrams !== null) {
      setWeightGrams(String(liveWeightGrams));
    }
  }, [liveWeightGrams]);

  useEffect(() => {
    if (packingOrder && !isConnected) {
      setWeightGrams(
        String(
          packingOrder.actualPackedWeightGrams ||
            packingOrder.totalWeightGrams ||
            500,
        ),
      );
    }
  }, [packingOrder, isConnected]);

  // Zero-Mouse HID Barcode Scanner: nếu chưa có đơn thì quét nạp đơn, nếu đã có đơn thì quét kiểm đếm SKU
  useHardwareBarcodeScanner({
    enabled: Boolean(activeShopId),
    onScan: (code) => {
      if (!activeShopId) return;
      if (!packingOrder) {
        lookupPackingOrder(activeShopId, code);
      } else {
        scanPackingBarcode({
          shopId: activeShopId,
          orderId: packingOrder.id,
          scannedCode: code,
        });
      }
    },
  });

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShopId || !manualInput.trim()) return;
    if (!packingOrder) {
      lookupPackingOrder(activeShopId, manualInput.trim());
    } else {
      scanPackingBarcode({
        shopId: activeShopId,
        orderId: packingOrder.id,
        scannedCode: manualInput.trim(),
      });
    }
    setManualInput("");
  };

  const handleCompleteAndPrint = async () => {
    if (!activeShopId || !packingOrder) return;
    await completePackingAndPrint({
      shopId: activeShopId,
      orderId: packingOrder.id,
      actualPackedWeightGrams: Math.max(10, Number(weightGrams || 500)),
      packingVideoUrl: packingVideoUrl.trim() || undefined,
      labelFormat,
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-4">
      <GlassSectionHeader
        icon={<Barcode className="w-5 h-5" />}
        title={t("packingPage.title")}
        subtitle={t("packingPage.subtitle")}
        actions={
          <PatternButton
            variant={isConnected ? "solid" : "glass"}
            color={isConnected ? "success" : "neutral"}
            size="sm"
            onClick={isConnected ? disconnectScale : connectScale}
          >
            <Scale className="w-3.5 h-3.5 mr-1.5" />
            {isConnected
              ? `Cân đã kết nối (${liveWeightGrams ?? 0}g)`
              : t("packingPage.connectScale")}
          </PatternButton>
        }
      />

      <OmsSubNavBar />

      {scaleError && (
        <GlassAlert
          variant="warning"
          title="Cân điện tử"
          description={scaleError}
        />
      )}

      {lastScanAlert && (
        <GlassAlert
          variant={lastScanAlert.type === "danger" ? "danger" : "success"}
          title={
            lastScanAlert.type === "danger"
              ? "CẢNH BÁO SAI HÀNG"
              : "XÁC NHẬN MÃ VẠCH"
          }
          description={lastScanAlert.message}
        />
      )}

      <GlassSurfaceCard variant="frosted" opacity="60" blur="md">
        <form
          onSubmit={handleManualSubmit}
          className="flex flex-col sm:flex-row gap-3"
        >
          <LiquidGlassInput className="flex-1">
            <input
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder={
                packingOrder
                  ? t("packingPage.scanSkuPlaceholder")
                  : t("packingPage.scanOrderPlaceholder")
              }
              className="w-full bg-transparent px-3 py-2.5 text-sm font-mono outline-none"
            />
          </LiquidGlassInput>
          <PatternButton type="submit" variant="solid" color="primary">
            <Barcode className="w-4 h-4 mr-1.5" />
            {packingOrder
              ? t("packingPage.verifySkuBtn")
              : t("packingPage.loadOrderBtn")}
          </PatternButton>
        </form>
      </GlassSurfaceCard>

      {!packingOrder ? (
        <GlassSurfaceCard>
          <GlassEmptyState
            icon={<Barcode className="w-8 h-8" />}
            title={t("packingPage.waitingOrderTitle")}
            description={t("packingPage.waitingOrderDesc")}
          />
        </GlassSurfaceCard>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <GlassSurfaceCard
            className="lg:col-span-2"
            header={
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-base">
                    {packingOrder.orderCode} • {packingOrder.customerName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {packingOrder.carrierCode} •{" "}
                    {packingOrder.trackingNumber || "Chưa có mã vận đơn"}
                  </div>
                </div>
                <OmsStatusBadge status={packingOrder.status} />
              </div>
            }
          >
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span>Tiến độ quét kiểm đếm SKU</span>
                  <span>
                    {packingProgress?.scannedUnits || 0} /{" "}
                    {packingProgress?.requiredUnits || 0} SP (
                    {packingProgress?.percent || 0}%)
                  </span>
                </div>
                <Progress
                  value={packingProgress?.percent || 0}
                  className="h-3"
                />
              </div>

              <div className="space-y-2.5">
                {packingOrder.itemsJson.map((item) => {
                  const scanned = Number(item.packedScannedQty || 0);
                  const done = scanned >= item.quantity;
                  return (
                    <div
                      key={item.variantId}
                      className="p-3 rounded-xl border border-border/50 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-sm flex items-center gap-2">
                          {done && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          )}
                          <span className="truncate">{item.variantName}</span>
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          SKU: {item.skuCode} • Barcode: {item.barcode}
                        </div>
                      </div>
                      <GlassBadge
                        variant={done ? "success" : "warning"}
                        size="md"
                      >
                        {scanned} / {item.quantity}
                      </GlassBadge>
                    </div>
                  );
                })}
              </div>
            </div>
          </GlassSurfaceCard>

          <GlassSurfaceCard
            header={
              <span className="font-bold text-sm">
                {t("packingPage.weightAndPrintTitle")}
              </span>
            }
          >
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Trọng lượng cân thực tế (gram) — chống đội cước ĐVVC
                </label>
                <LiquidGlassInput className="mt-1">
                  <input
                    type="number"
                    value={weightGrams}
                    onChange={(e) => setWeightGrams(e.target.value)}
                    className="w-full bg-transparent px-3 py-2 text-sm font-bold outline-none"
                  />
                </LiquidGlassInput>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Video className="w-3.5 h-3.5" /> Link Video Cam Check (tuỳ
                  chọn)
                </label>
                <LiquidGlassInput className="mt-1">
                  <input
                    value={packingVideoUrl}
                    onChange={(e) => setPackingVideoUrl(e.target.value)}
                    placeholder="https://camcheck.shop/clip/..."
                    className="w-full bg-transparent px-3 py-2 text-xs outline-none"
                  />
                </LiquidGlassInput>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Khổ giấy in nhiệt
                </label>
                <div className="mt-1">
                  <Select
                    value={labelFormat}
                    onValueChange={(v) =>
                      setLabelFormat(v as ThermalLabelFormatType)
                    }
                  >
                    <TriggerSelect>
                      <span>{labelFormat}</span>
                    </TriggerSelect>
                    <ContentSelect>
                      <ItemSelect value="A6_100X150">
                        Nhiệt A6 (100x150mm)
                      </ItemSelect>
                      <ItemSelect value="K80_80X80">
                        Nhiệt K80 (80x80mm)
                      </ItemSelect>
                      <ItemSelect value="A5_148X210">
                        Khổ A5 (148x210mm)
                      </ItemSelect>
                    </ContentSelect>
                  </Select>
                </div>
              </div>

              <PatternButton
                variant="solid"
                color="success"
                className="w-full"
                disabled={!packingProgress?.isComplete}
                isLoading={isSubmitting}
                onClick={handleCompleteAndPrint}
              >
                <Printer className="w-4 h-4 mr-1.5" />
                {t("packingPage.completeAndPrintBtn")}
              </PatternButton>
            </div>
          </GlassSurfaceCard>
        </div>
      )}
    </div>
  );
}
