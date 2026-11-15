"use client";

import { useEffect, useState } from "react";
import {
  ContentSelect,
  GlassBadge,
  GlassEmptyState,
  GlassModal,
  GlassSectionHeader,
  GlassSurfaceCard,
  GlassTabs,
  ItemSelect,
  LiquidGlassInput,
  PatternButton,
  ScrollArea,
  TriggerSelect,
} from "@/components/toolkit";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectValue } from "@/components/ui/select";
import { useCatalogPosStore } from "@/lib/stores/catalog-pos/use-catalog-pos-store";
import {
  ArrowLeftRight,
  Barcode,
  Boxes,
  CheckCircle2,
  Cpu,
  History,
  Layers,
  PackagePlus,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Warehouse,
} from "lucide-react";
import { useChannelWorkspaceStore } from "@/lib/stores/channel/use-channel-workspace-store";

export default function ProductsAndInventoryPage() {
  const activeShop = useChannelWorkspaceStore((s) => s.activeShop);
  const shopId = activeShop?.id || "default_shop";

  const {
    warehouses,
    variants,
    inventoryLedgers,
    transferOrders,
    serialItems,
    fetchCatalogAndStock,
    createProductWithMatrix,
    createBundleBom,
    adjustStocktake,
    fetchInventoryLedgers,
    fetchWarehouseTransfers,
    createWarehouseTransfer,
    receiveWarehouseTransfer,
    fetchProductSerials,
    registerProductSerials,
  } = useCatalogPosStore();

  const [activeTab, setActiveTab] = useState<
    "VARIANTS" | "BUNDLES" | "TRANSFERS" | "LEDGERS" | "SERIALS"
  >("VARIANTS");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterWarehouseId, setFilterWarehouseId] = useState<string>("ALL");

  // Modal tạo sản phẩm & ma trận biến thể
  const [openCreateMatrixModal, setOpenCreateMatrixModal] = useState(false);
  const [prodCode, setProdCode] = useState("");
  const [prodName, setProdName] = useState("");
  const [colorsInput, setColorsInput] = useState("Trắng, Đen, Kem");
  const [sizesInput, setSizesInput] = useState("S, M, L");
  const [retailPriceInput, setRetailPriceInput] = useState(390000);
  const [costPriceInput, setCostPriceInput] = useState(195000);
  const [initStockInput, setInitStockInput] = useState(30);

  // Modal tạo phiếu chuyển kho 2 bước
  const [openTransferModal, setOpenTransferModal] = useState(false);
  const [fromWhId, setFromWhId] = useState("");
  const [toWhId, setToWhId] = useState("");
  const [transferVariantId, setTransferVariantId] = useState("");
  const [transferQty, setTransferQty] = useState(5);

  useEffect(() => {
    if (!shopId) return;
    void fetchCatalogAndStock({ shopId });
    void fetchInventoryLedgers(shopId);
    void fetchWarehouseTransfers(shopId);
    void fetchProductSerials({ shopId });
  }, [
    shopId,
    fetchCatalogAndStock,
    fetchInventoryLedgers,
    fetchWarehouseTransfers,
    fetchProductSerials,
  ]);

  useEffect(() => {
    if (warehouses.length >= 2 && !fromWhId) {
      setFromWhId(warehouses[0].id);
      setToWhId(warehouses[1].id);
    }
    if (variants.length > 0 && !transferVariantId) {
      setTransferVariantId(variants[0].id);
    }
  }, [warehouses, variants, fromWhId, transferVariantId]);

  const displayedVariants = variants.filter((v) => {
    if (activeTab === "BUNDLES" && !v.isBundleBom) return false;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      v.skuCode.toLowerCase().includes(q) ||
      v.barcode.toLowerCase().includes(q) ||
      v.variantName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-4">
      <GlassSectionHeader
        icon={<Boxes className="w-5 h-5" />}
        title="Danh Mục Sản Phẩm, Đa Kho Hàng, Tồn Kho Nguyên Tử Redis Lua & Combo BOM (Sprint 4)"
        subtitle="Quản lý biến thể SKU (Màu x Size), bảo mật giá vốn (FLS), tồn kho 4 trạng thái, chuyển kho 2 bước & Serial/IMEI"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <PatternButton
              type="button"
              size="sm"
              rounded="full"
              variant="glass"
              color="primary"
              icon={<ArrowLeftRight className="w-3.5 h-3.5" />}
              onClick={() => setOpenTransferModal(true)}
            >
              Chuyển kho 2 bước
            </PatternButton>
            <PatternButton
              type="button"
              size="sm"
              rounded="full"
              variant="solid"
              color="primary"
              icon={<PackagePlus className="w-3.5 h-3.5" />}
              onClick={() => setOpenCreateMatrixModal(true)}
            >
              + Tạo Sản Phẩm (Nhân Ma Trận SKU)
            </PatternButton>
          </div>
        }
      />

      {/* Thẻ tổng quan các Kho vật lý */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {warehouses.map((wh) => (
          <GlassSurfaceCard key={wh.id} className="p-3.5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm flex items-center gap-1.5">
                <Warehouse className="w-4 h-4 text-primary" />
                <span>{wh.name}</span>
              </span>
              {wh.isDefault && (
                <GlassBadge variant="success" size="sm">
                  Kho mặc định
                </GlassBadge>
              )}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {wh.addressLine}
            </div>
            <div className="text-[11px] font-mono text-muted-foreground">
              Mã kho: {wh.code} • Tỉnh: #{wh.provinceCode}
            </div>
          </GlassSurfaceCard>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <GlassTabs
          size="sm"
          value={activeTab}
          onValueChange={(v) => setActiveTab(v)}
          items={[
            {
              key: "VARIANTS",
              label: "Biến thể SKU & Tồn kho 4 trạng thái",
              icon: <Barcode className="w-3.5 h-3.5" />,
              badge: variants.length,
            },
            {
              key: "BUNDLES",
              label: "Sản phẩm Combo (Bundle BOM)",
              icon: <Layers className="w-3.5 h-3.5" />,
              badge: variants.filter((v) => v.isBundleBom).length,
            },
            {
              key: "TRANSFERS",
              label: "Chuyển kho 2 bước",
              icon: <ArrowLeftRight className="w-3.5 h-3.5" />,
              badge: transferOrders.length,
            },
            {
              key: "LEDGERS",
              label: "Sổ cái Thẻ kho (Partitioned)",
              icon: <History className="w-3.5 h-3.5" />,
              badge: inventoryLedgers.length,
            },
            {
              key: "SERIALS",
              label: "Serial / IMEI & Bảo hành",
              icon: <Cpu className="w-3.5 h-3.5" />,
              badge: serialItems.length,
            },
          ]}
        />

        <div className="flex items-center gap-2">
          <LiquidGlassInput className="h-8 w-64 p-0 overflow-hidden">
            <div className="flex items-center px-3 h-full w-full">
              <Search className="w-3.5 h-3.5 text-muted-foreground mr-2 shrink-0" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm mã SKU, Barcode, tên SP..."
                className="h-full text-xs bg-transparent! border-none shadow-none focus-visible:ring-0 px-0"
              />
            </div>
          </LiquidGlassInput>
        </div>
      </div>

      {(activeTab === "VARIANTS" || activeTab === "BUNDLES") && (
        <GlassSurfaceCard className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/50 text-muted-foreground">
                  <th className="py-2.5 px-2">Mã SKU / Barcode</th>
                  <th className="py-2.5 px-2">Tên Biến thể / Định mức BOM</th>
                  <th className="py-2.5 px-2 text-right">Giá bán lẻ</th>
                  <th className="py-2.5 px-2 text-right">
                    Giá vốn (FLS Protected)
                  </th>
                  <th className="py-2.5 px-2 text-center">Tồn thực tế</th>
                  <th className="py-2.5 px-2 text-center">Đang giữ chỗ</th>
                  <th className="py-2.5 px-2 text-center">Có thể bán</th>
                  <th className="py-2.5 px-2">Phân bổ Đa kho</th>
                  <th className="py-2.5 px-2 text-right">Kiểm kho nhanh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {displayedVariants.map((v) => (
                  <tr key={v.id} className="hover:bg-muted/20">
                    <td className="py-2.5 px-2 font-mono">
                      <div className="font-bold text-primary">{v.skuCode}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {v.barcode}
                      </div>
                    </td>
                    <td className="py-2.5 px-2">
                      <div className="font-semibold flex items-center gap-1.5 flex-wrap">
                        <span>{v.variantName}</span>
                        {v.isBundleBom && (
                          <GlassBadge variant="accent" size="sm">
                            Bundle BOM
                          </GlassBadge>
                        )}
                        {v.requiresSerialImei && (
                          <GlassBadge variant="warning" size="sm">
                            Serial/IMEI ({v.warrantyMonths}T)
                          </GlassBadge>
                        )}
                      </div>
                      {v.isBundleBom &&
                        Array.isArray(v.bundleComponentsJson) && (
                          <div className="text-[10px] text-sky-600 dark:text-sky-400 mt-0.5">
                            Thành phần:{" "}
                            {v.bundleComponentsJson
                              .map(
                                (c) =>
                                  `${c.componentSkuCode} (x${c.requiredQty})`,
                              )
                              .join(" + ")}
                          </div>
                        )}
                    </td>
                    <td className="py-2.5 px-2 text-right font-bold">
                      {Number(v.retailPrice).toLocaleString("vi-VN")}đ
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono">
                      {v.costPrice !== undefined ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          {Number(v.costPrice).toLocaleString("vi-VN")}đ
                        </span>
                      ) : (
                        <GlassBadge variant="secondary" size="sm">
                          🔒 Đã ẩn (FLS)
                        </GlassBadge>
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono font-semibold">
                      {v.totalOnHandQty}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono text-amber-600 font-semibold">
                      {v.totalReservedQty}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <GlassBadge
                        variant={v.totalAvailableQty > 0 ? "success" : "danger"}
                        size="sm"
                      >
                        {v.totalAvailableQty}
                      </GlassBadge>
                    </td>
                    <td className="py-2.5 px-2">
                      <div className="flex items-center gap-1 flex-wrap">
                        {v.stocksByWarehouse?.map((st) => (
                          <span
                            key={st.warehouseId}
                            className="px-2 py-0.5 rounded-md bg-muted/50 text-[10px] font-mono"
                          >
                            {st.warehouseCode}: {st.availableQty}/{st.onHandQty}
                            {st.inTransitQty > 0
                              ? ` (+${st.inTransitQty} đang chuyển)`
                              : ""}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      {!v.isBundleBom && warehouses[0] && (
                        <PatternButton
                          type="button"
                          size="sm"
                          rounded="full"
                          variant="glass"
                          color="primary"
                          className="h-7 px-2.5 text-[10px]"
                          onClick={() =>
                            adjustStocktake({
                              shopId,
                              warehouseId: warehouses[0].id,
                              variantId: v.id,
                              movementType: "PO_RECEIVE",
                              deltaQty: 10,
                              note: "Nhập bổ sung nhanh +10 sản phẩm vào kho",
                            })
                          }
                        >
                          +10 Nhập kho
                        </PatternButton>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassSurfaceCard>
      )}

      {/* TAB CHUYỂN KHO NỘI BỘ 2 BƯỚC (F05.6) */}
      {activeTab === "TRANSFERS" && (
        <GlassSurfaceCard className="p-4 space-y-3">
          {transferOrders.length === 0 ? (
            <GlassEmptyState
              icon={<ArrowLeftRight className="w-7 h-7" />}
              title="Chưa có phiếu chuyển kho nội bộ"
              description="Bấm 'Chuyển kho 2 bước' ở góc trên để tạo lệnh điều chuyển hàng hóa giữa Kho Hà Nội và Kho TP.HCM."
            />
          ) : (
            <div className="space-y-2">
              {transferOrders.map((trf) => (
                <div
                  key={trf.id}
                  className="p-3 rounded-xl border border-border/50 flex items-center justify-between gap-3 flex-wrap"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-primary">
                        {trf.transferCode}
                      </span>
                      <GlassBadge
                        variant={
                          trf.status === "COMPLETED"
                            ? "success"
                            : trf.status === "OUTBOUND_IN_TRANSIT"
                              ? "info"
                              : "warning"
                        }
                        size="sm"
                      >
                        {trf.status}
                      </GlassBadge>
                    </div>
                    <div className="text-xs font-medium">
                      {trf.fromWarehouseName} → {trf.toWarehouseName}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {trf.itemsJson
                        ?.map(
                          (i) =>
                            `${i.skuCode}: Xuất ${i.shippedQty} / Nhận ${i.receivedQty}`,
                        )
                        .join(" • ")}
                    </div>
                  </div>

                  {trf.status === "OUTBOUND_IN_TRANSIT" && (
                    <PatternButton
                      type="button"
                      size="sm"
                      rounded="full"
                      variant="solid"
                      color="success"
                      icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                      onClick={() =>
                        receiveWarehouseTransfer({
                          shopId,
                          transferId: trf.id,
                          note: "Kho nhận đã quét Barcode xác nhận đủ số lượng (Bước 2)",
                        })
                      }
                    >
                      Xác nhận Kho nhận đã kiểm đủ (Bước 2 — TRANSFER_IN)
                    </PatternButton>
                  )}
                </div>
              ))}
            </div>
          )}
        </GlassSurfaceCard>
      )}

      {/* TAB SỔ CÁI THẺ KHO PHÂN VÙNG THEO THÁNG (F05.5) */}
      {activeTab === "LEDGERS" && (
        <GlassSurfaceCard className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/50 text-muted-foreground">
                  <th className="py-2 px-2">Thời gian</th>
                  <th className="py-2 px-2">Mã SKU</th>
                  <th className="py-2 px-2">Loại biến động</th>
                  <th className="py-2 px-2 text-right">Thay đổi</th>
                  <th className="py-2 px-2 text-right">Tồn thực tế</th>
                  <th className="py-2 px-2 text-right">Có thể bán</th>
                  <th className="py-2 px-2">Tham chiếu / Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {inventoryLedgers.map((lg) => (
                  <tr key={lg.id}>
                    <td className="py-2 px-2 font-mono text-[11px]">
                      {new Date(lg.createdAt).toLocaleString("vi-VN")}
                    </td>
                    <td className="py-2 px-2 font-mono font-bold text-primary">
                      {lg.skuCode}
                    </td>
                    <td className="py-2 px-2">
                      <GlassBadge variant="info" size="sm">
                        {lg.movementType}
                      </GlassBadge>
                    </td>
                    <td
                      className={`py-2 px-2 text-right font-mono font-bold ${
                        lg.deltaQty >= 0 ? "text-emerald-600" : "text-amber-600"
                      }`}
                    >
                      {lg.deltaQty > 0 ? `+${lg.deltaQty}` : lg.deltaQty}
                    </td>
                    <td className="py-2 px-2 text-right font-mono">
                      {lg.beforeOnHandQty} → <b>{lg.afterOnHandQty}</b>
                    </td>
                    <td className="py-2 px-2 text-right font-mono">
                      {lg.beforeAvailableQty} → <b>{lg.afterAvailableQty}</b>
                    </td>
                    <td className="py-2 px-2 text-muted-foreground">
                      [{lg.referenceId}] {lg.note}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassSurfaceCard>
      )}

      {/* TAB QUẢN LÝ MÃ SERIAL / IMEI & KÍCH HOẠT BẢO HÀNH ĐIỆN TỬ (F05.8) */}
      {activeTab === "SERIALS" && (
        <GlassSurfaceCard className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {serialItems.map((sn) => (
              <div
                key={sn.id}
                className="p-3 rounded-xl border border-border/50 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-primary">
                    {sn.serialNumber}
                  </span>
                  <GlassBadge
                    variant={
                      sn.status === "IN_STOCK"
                        ? "success"
                        : sn.status === "SOLD_ACTIVE_WARRANTY"
                          ? "info"
                          : "warning"
                    }
                    size="sm"
                  >
                    {sn.status}
                  </GlassBadge>
                </div>
                <div className="text-xs font-medium truncate">
                  [{sn.skuCode}] {sn.variantName}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Bảo hành: {sn.warrantyMonths} tháng
                  {sn.warrantyExpiresAt
                    ? ` • Hết hạn: ${new Date(sn.warrantyExpiresAt).toLocaleDateString("vi-VN")}`
                    : ""}
                </div>
              </div>
            ))}
          </div>
        </GlassSurfaceCard>
      )}

      {/* Modal Tạo Sản phẩm & Nhân Ma trận Biến thể Tự động (Màu x Size) */}
      <GlassModal
        open={openCreateMatrixModal}
        onOpenChange={setOpenCreateMatrixModal}
        title="Tạo Sản Phẩm & Khởi Tạo Ma Trận Biến Thể SKU Tự Động (F05.1)"
        description="Hệ thống tự động nhân tổ hợp (Màu sắc x Kích cỡ), cấp mã Barcode và khởi tạo tồn kho 4 trạng thái."
        size="lg"
        footer={
          <>
            <PatternButton
              type="button"
              variant="ghost"
              size="sm"
              rounded="full"
              onClick={() => setOpenCreateMatrixModal(false)}
            >
              Hủy
            </PatternButton>
            <PatternButton
              type="button"
              variant="solid"
              color="primary"
              size="sm"
              rounded="full"
              onClick={async () => {
                if (!prodCode.trim() || !prodName.trim()) return;
                const ok = await createProductWithMatrix({
                  shopId,
                  code: prodCode.trim(),
                  name: prodName.trim(),
                  colors: colorsInput
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                  sizes: sizesInput
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                  retailPrice: retailPriceInput,
                  costPrice: costPriceInput,
                  initialOnHandQtyPerVariant: initStockInput,
                });
                if (ok) setOpenCreateMatrixModal(false);
              }}
            >
              Khởi tạo Ma trận SKU
            </PatternButton>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <Label className="text-xs">Mã sản phẩm gốc</Label>
              <Input
                value={prodCode}
                onChange={(e) => setProdCode(e.target.value)}
                placeholder="VD: AO-SO-MI-2026"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Tên sản phẩm</Label>
              <Input
                value={prodName}
                onChange={(e) => setProdName(e.target.value)}
                placeholder="VD: Áo Sơ Mi Lụa Hàn Quốc"
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <Label className="text-xs">
                Danh sách Màu sắc (ngăn cách bằng dấu phẩy)
              </Label>
              <Input
                value={colorsInput}
                onChange={(e) => setColorsInput(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">
                Danh sách Kích cỡ (ngăn cách bằng dấu phẩy)
              </Label>
              <Input
                value={sizesInput}
                onChange={(e) => setSizesInput(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <Label className="text-xs">Giá bán lẻ (VND)</Label>
              <Input
                type="number"
                value={retailPriceInput}
                onChange={(e) => setRetailPriceInput(Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Giá vốn MAC (VND - Bảo mật FLS)</Label>
              <Input
                type="number"
                value={costPriceInput}
                onChange={(e) => setCostPriceInput(Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Tồn đầu kỳ / mỗi biến thể</Label>
              <Input
                type="number"
                value={initStockInput}
                onChange={(e) => setInitStockInput(Number(e.target.value))}
                className="mt-1"
              />
            </div>
          </div>
        </div>
      </GlassModal>

      {/* Modal Tạo Phiếu Chuyển Kho Nội Bộ 2 Bước (F05.6) */}
      <GlassModal
        open={openTransferModal}
        onOpenChange={setOpenTransferModal}
        title="Tạo Phiếu Điều Chuyển Kho Nội Bộ 2 Bước (F05.6)"
        description="Bước 1 (TRANSFER_OUT): Trừ tồn Kho xuất và cộng tồn đang vận chuyển (inTransitQty) tại Kho nhận."
        size="md"
        footer={
          <>
            <PatternButton
              type="button"
              variant="ghost"
              size="sm"
              rounded="full"
              onClick={() => setOpenTransferModal(false)}
            >
              Hủy
            </PatternButton>
            <PatternButton
              type="button"
              variant="solid"
              color="primary"
              size="sm"
              rounded="full"
              onClick={async () => {
                const ok = await createWarehouseTransfer({
                  shopId,
                  fromWarehouseId: fromWhId,
                  toWarehouseId: toWhId,
                  items: [
                    { variantId: transferVariantId, requestedQty: transferQty },
                  ],
                  note: "Điều chuyển bổ sung hàng bán",
                });
                if (ok) {
                  setOpenTransferModal(false);
                  setActiveTab("TRANSFERS");
                }
              }}
            >
              Xuất Kho Bước 1 (TRANSFER_OUT)
            </PatternButton>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Kho xuất hàng</Label>
              <Select value={fromWhId} onValueChange={setFromWhId}>
                <TriggerSelect className="mt-1">
                  <SelectValue />
                </TriggerSelect>
                <ContentSelect>
                  {warehouses.map((w) => (
                    <ItemSelect key={w.id} value={w.id}>
                      {w.name}
                    </ItemSelect>
                  ))}
                </ContentSelect>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Kho nhận hàng</Label>
              <Select value={toWhId} onValueChange={setToWhId}>
                <TriggerSelect className="mt-1">
                  <SelectValue />
                </TriggerSelect>
                <ContentSelect>
                  {warehouses.map((w) => (
                    <ItemSelect key={w.id} value={w.id}>
                      {w.name}
                    </ItemSelect>
                  ))}
                </ContentSelect>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs">Biến thể SKU cần điều chuyển</Label>
            <Select
              value={transferVariantId}
              onValueChange={setTransferVariantId}
            >
              <TriggerSelect className="mt-1">
                <SelectValue />
              </TriggerSelect>
              <ContentSelect>
                {variants
                  .filter((v) => !v.isBundleBom)
                  .map((v) => (
                    <ItemSelect key={v.id} value={v.id}>
                      [{v.skuCode}] {v.variantName}
                    </ItemSelect>
                  ))}
              </ContentSelect>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Số lượng điều chuyển</Label>
            <Input
              type="number"
              min={1}
              value={transferQty}
              onChange={(e) => setTransferQty(Number(e.target.value))}
              className="mt-1"
            />
          </div>
        </div>
      </GlassModal>
    </div>
  );
}
