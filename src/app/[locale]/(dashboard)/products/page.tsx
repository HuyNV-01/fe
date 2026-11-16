"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ContentSelect,
  GlassAlert,
  GlassBadge,
  GlassEmptyState,
  GlassModal,
  GlassSectionHeader,
  GlassSurfaceCard,
  GlassTabs,
  ItemSelect,
  LiquidGlassInput,
  PatternButton,
  Switch,
  TriggerSelect,
} from "@/components/toolkit";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectValue } from "@/components/ui/select";
import { useCatalogPosStore } from "@/lib/stores/catalog-pos/use-catalog-pos-store";
import { useChannelWorkspaceStore } from "@/lib/stores/channel/use-channel-workspace-store";
import { usePermissionStore } from "@/lib/stores/iam/use-permission-store";
import type {
  IBundleBomComponent,
  InventoryMovementType,
  ProductIndustryType,
} from "@/types/catalog-pos";
import {
  AlertTriangle,
  ArrowLeftRight,
  Barcode,
  Boxes,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Cpu,
  History,
  Layers,
  PackagePlus,
  Plus,
  QrCode,
  Search,
  Sparkles,
  Trash2,
  Warehouse,
} from "lucide-react";

export type CatalogPageTabKey =
  | "VARIANTS"
  | "BUNDLES"
  | "TRANSFERS"
  | "LEDGERS"
  | "SERIALS";

const INDUSTRY_PRESETS: Record<
  ProductIndustryType,
  {
    label: string;
    categoryPlaceholder: string;
    unitPlaceholder: string;
    axis1Name: string;
    axis1DefaultValues: string;
    axis2Name: string;
    axis2DefaultValues: string;
    requiresSerialImei: boolean;
    requiresBatchExpiry: boolean;
  }
> = {
  GENERAL_MULTI_CATEGORY: {
    label: "🌐 Đa ngành hàng / Tùy biến tự do",
    categoryPlaceholder: "Đa ngành hàng",
    unitPlaceholder: "Sản phẩm",
    axis1Name: "Phân loại 1",
    axis1DefaultValues: "Bản Tiêu Chuẩn, Bản Cao Cấp",
    axis2Name: "Phân loại 2",
    axis2DefaultValues: "Nhỏ, Vừa, Lớn",
    requiresSerialImei: false,
    requiresBatchExpiry: false,
  },
  FASHION_APPAREL: {
    label: "👗 Thời trang, Giày dép & Phụ kiện",
    categoryPlaceholder: "Thời trang & Phụ kiện",
    unitPlaceholder: "Chiếc",
    axis1Name: "Màu sắc",
    axis1DefaultValues: "Trắng, Đen, Kem",
    axis2Name: "Kích cỡ (Size)",
    axis2DefaultValues: "S, M, L, XL",
    requiresSerialImei: false,
    requiresBatchExpiry: false,
  },
  COSMETICS_BEAUTY: {
    label: "💄 Mỹ phẩm, Chăm sóc da & Làm đẹp (FEFO Lô/HSD)",
    categoryPlaceholder: "Mỹ phẩm & Chăm sóc sắc đẹp",
    unitPlaceholder: "Chai",
    axis1Name: "Dung tích / Trọng lượng",
    axis1DefaultValues: "30ml, 50ml, 100ml",
    axis2Name: "Loại da / Tone màu",
    axis2DefaultValues: "Mọi loại da, Da dầu mụn, Da khô nhạy cảm",
    requiresSerialImei: false,
    requiresBatchExpiry: true,
  },
  ELECTRONICS_TECH: {
    label: "📱 Điện tử, Thiết bị số & Công nghệ (Serial/IMEI)",
    categoryPlaceholder: "Thiết bị Điện tử & Công nghệ",
    unitPlaceholder: "Máy",
    axis1Name: "Phiên bản / Dung lượng",
    axis1DefaultValues: "Standard 128GB, Pro 256GB",
    axis2Name: "Màu sắc / Chuẩn kết nối",
    axis2DefaultValues: "Đen Không Gian, Bạc Titan",
    requiresSerialImei: true,
    requiresBatchExpiry: false,
  },
  FOOD_BEVERAGE: {
    label: "🍵 Thực phẩm, Đồ uống, Đặc sản & F&B (Hạn sử dụng)",
    categoryPlaceholder: "Thực phẩm Dinh dưỡng & F&B",
    unitPlaceholder: "Hộp",
    axis1Name: "Quy cách đóng gói",
    axis1DefaultValues: "Gói 250g, Hộp 500g, Combo 1kg",
    axis2Name: "Hương vị",
    axis2DefaultValues: "Nguyên bản, Vị Matcha, Ít ngọt",
    requiresSerialImei: false,
    requiresBatchExpiry: true,
  },
  MOTHER_AND_BABY: {
    label: "🍼 Mẹ & Bé (Bỉm, Sữa, Đồ sơ sinh theo Tháng tuổi/Kg)",
    categoryPlaceholder: "Mẹ & Bé",
    unitPlaceholder: "Bịch",
    axis1Name: "Size cân nặng / Độ tuổi",
    axis1DefaultValues: "S (4-8kg), M (6-11kg), L (9-14kg), XL (12-17kg)",
    axis2Name: "Phân loại / Quy cách",
    axis2DefaultValues: "Tã dán, Tã quần",
    requiresSerialImei: false,
    requiresBatchExpiry: true,
  },
  HOME_LIVING_APPLIANCES: {
    label: "🏠 Gia dụng, Nội thất & Đời sống (Cồng kềnh)",
    categoryPlaceholder: "Gia dụng & Đời sống",
    unitPlaceholder: "Bộ",
    axis1Name: "Kích thước / Công suất",
    axis1DefaultValues: "1200W (3.5L), 1800W (5.5L)",
    axis2Name: "Chất liệu / Kiểu dáng",
    axis2DefaultValues: "Inox 304, Phủ Gốm Ceramic",
    requiresSerialImei: true,
    requiresBatchExpiry: false,
  },
};

const INDUSTRY_BADGE_LABELS: Record<ProductIndustryType, string> = {
  GENERAL_MULTI_CATEGORY: "Đa ngành",
  FASHION_APPAREL: "Thời trang",
  COSMETICS_BEAUTY: "Mỹ phẩm • FEFO",
  ELECTRONICS_TECH: "Điện tử • IMEI",
  FOOD_BEVERAGE: "Thực phẩm • HSD",
  MOTHER_AND_BABY: "Mẹ & Bé",
  HOME_LIVING_APPLIANCES: "Gia dụng",
};

export function ProductsAndInventoryWorkspace({
  initialTab = "VARIANTS",
}: {
  initialTab?: CatalogPageTabKey;
}) {
  const searchParams = useSearchParams();
  const activeShopIdFromPerm = usePermissionStore((s) => s.activeShopId);
  const activeShop = useChannelWorkspaceStore((s) => s.activeShop);
  const shopId = activeShopIdFromPerm || activeShop?.id || "default_shop";

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
    scanBindSerialToOrder,
  } = useCatalogPosStore();

  const tabFromUrl = searchParams.get("tab") as CatalogPageTabKey | null;
  const [activeTab, setActiveTab] = useState<CatalogPageTabKey>(
    tabFromUrl || initialTab,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [filterIndustry, setFilterIndustry] = useState<
    "ALL" | ProductIndustryType
  >("ALL");

  // 1. State Modal tạo Sản phẩm Đa ngành hàng & Ma trận Biến thể 2 trục động
  const [openCreateMatrixModal, setOpenCreateMatrixModal] = useState(false);
  const [selectedIndustry, setSelectedIndustry] =
    useState<ProductIndustryType>("FASHION_APPAREL");
  const [prodCode, setProdCode] = useState("");
  const [prodName, setProdName] = useState("");
  const [categoryName, setCategoryName] = useState("Thời trang & Phụ kiện");
  const [brandName, setBrandName] = useState("Pancake Brand");
  const [unitName, setUnitName] = useState("Chiếc");
  const [axis1Name, setAxis1Name] = useState("Màu sắc");
  const [axis1ValuesInput, setAxis1ValuesInput] = useState("Trắng, Đen, Kem");
  const [axis2Name, setAxis2Name] = useState("Kích cỡ (Size)");
  const [axis2ValuesInput, setAxis2ValuesInput] = useState("S, M, L");
  const [retailPriceInput, setRetailPriceInput] = useState(390000);
  const [wholesalePriceInput, setWholesalePriceInput] = useState(320000);
  const [costPriceInput, setCostPriceInput] = useState(195000);
  const [maxDiscountInput, setMaxDiscountInput] = useState(15);
  const [weightGramsInput, setWeightGramsInput] = useState(350);
  const [lengthCmInput, setLengthCmInput] = useState(25);
  const [widthCmInput, setWidthCmInput] = useState(20);
  const [heightCmInput, setHeightCmInput] = useState(6);
  const [initStockInput, setInitStockInput] = useState(30);
  const [requiresSerialImei, setRequiresSerialImei] = useState(false);
  const [warrantyMonthsInput, setWarrantyMonthsInput] = useState(12);
  const [requiresBatchExpiry, setRequiresBatchExpiry] = useState(false);
  const [batchCodeInput, setBatchCodeInput] = useState("LOT-2026-11A");
  const [expiryDateInput, setExpiryDateInput] = useState("2028-11-15");
  const [storageConditionInput, setStorageConditionInput] = useState(
    "Bảo quản nơi khô thoáng < 25°C",
  );

  // 2. State Modal tạo Sản phẩm Combo (Bundle BOM — F05.7)
  const [openCreateBundleModal, setOpenCreateBundleModal] = useState(false);
  const [bundleSkuCode, setBundleSkuCode] = useState("");
  const [bundleName, setBundleName] = useState("");
  const [bundleRetailPrice, setBundleRetailPrice] = useState(590000);
  const [bundleMaxDiscount, setBundleMaxDiscount] = useState(10);
  const [bundleComponents, setBundleComponents] = useState<
    IBundleBomComponent[]
  >([]);
  const [pickComponentVariantId, setPickComponentVariantId] = useState("");
  const [pickComponentQty, setPickComponentQty] = useState(1);

  // 3. State Modal tạo Phiếu chuyển kho 2 bước (F05.6)
  const [openTransferModal, setOpenTransferModal] = useState(false);
  const [fromWhId, setFromWhId] = useState("");
  const [toWhId, setToWhId] = useState("");
  const [transferVariantId, setTransferVariantId] = useState("");
  const [transferQty, setTransferQty] = useState(5);
  const [transferNote, setTransferNote] = useState(
    "Điều chuyển bổ sung tồn kho giữa các chi nhánh",
  );

  // 4. State Modal Kiểm kho cân bằng / Nhập PO / Chuyển hàng lỗi (F05.3 & F05.5)
  const [openAdjustModal, setOpenAdjustModal] = useState(false);
  const [adjustWhId, setAdjustWhId] = useState("");
  const [adjustVariantId, setAdjustVariantId] = useState("");
  const [adjustMovementType, setAdjustMovementType] =
    useState<InventoryMovementType>("PO_RECEIVE");
  const [adjustDeltaQty, setAdjustDeltaQty] = useState(10);
  const [adjustDefectiveDelta, setAdjustDefectiveDelta] = useState(0);
  const [adjustNote, setAdjustNote] = useState(
    "Nhập kho lô hàng mới / Kiểm kê cân bằng kho",
  );

  // 5. State Modal Đăng ký & Quét gắn Serial / IMEI (F05.8)
  const [openSerialModal, setOpenSerialModal] = useState(false);
  const [serialWhId, setSerialWhId] = useState("");
  const [serialVariantId, setSerialVariantId] = useState("");
  const [serialNumbersBulkText, setSerialNumbersBulkText] = useState(
    "SN-PRO-2026101, SN-PRO-2026102",
  );
  const [serialWarrantyMonths, setSerialWarrantyMonths] = useState(12);
  const [bindSerialNumberInput, setBindSerialNumberInput] = useState("");
  const [bindOrderCodeInput, setBindOrderCodeInput] = useState("ORD-2026-001");

  useEffect(() => {
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

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
    if (warehouses.length >= 1 && !adjustWhId) {
      setAdjustWhId(warehouses[0].id);
      setSerialWhId(warehouses[0].id);
    }
    if (variants.length > 0 && !transferVariantId) {
      const nonBom = variants.find((v) => !v.isBundleBom) || variants[0];
      setTransferVariantId(nonBom.id);
      setAdjustVariantId(nonBom.id);
      setPickComponentVariantId(nonBom.id);
      const serialVar = variants.find((v) => v.requiresSerialImei) || nonBom;
      setSerialVariantId(serialVar.id);
    }
  }, [warehouses, variants, fromWhId, transferVariantId, adjustWhId]);

  const handleSelectIndustryPreset = (industry: ProductIndustryType) => {
    setSelectedIndustry(industry);
    const preset = INDUSTRY_PRESETS[industry];
    setCategoryName(preset.categoryPlaceholder);
    setUnitName(preset.unitPlaceholder);
    setAxis1Name(preset.axis1Name);
    setAxis1ValuesInput(preset.axis1DefaultValues);
    setAxis2Name(preset.axis2Name);
    setAxis2ValuesInput(preset.axis2DefaultValues);
    setRequiresSerialImei(preset.requiresSerialImei);
    setRequiresBatchExpiry(preset.requiresBatchExpiry);
  };

  const displayedVariants = useMemo(() => {
    return variants.filter((v) => {
      if (activeTab === "BUNDLES" && !v.isBundleBom) return false;
      if (filterIndustry !== "ALL" && v.industryType !== filterIndustry) {
        return false;
      }
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        v.skuCode.toLowerCase().includes(q) ||
        v.barcode.toLowerCase().includes(q) ||
        v.variantName.toLowerCase().includes(q) ||
        (v.categoryName || "").toLowerCase().includes(q) ||
        (v.batchCode || "").toLowerCase().includes(q)
      );
    });
  }, [variants, activeTab, filterIndustry, searchQuery]);

  const volumetricWeightPreview = useMemo(() => {
    const vol = Math.round(
      (Math.max(1, lengthCmInput) *
        Math.max(1, widthCmInput) *
        Math.max(1, heightCmInput)) /
        5,
    );
    return {
      volumetricGrams: vol,
      chargeableGrams: Math.max(weightGramsInput, vol),
    };
  }, [weightGramsInput, lengthCmInput, widthCmInput, heightCmInput]);

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-4">
      <GlassSectionHeader
        icon={<Boxes className="w-5 h-5" />}
        title="Danh Mục Sản Phẩm Đa Ngành Hàng, Đa Kho, Tồn Kho Nguyên Tử Redis Lua & Combo BOM (Sprint 4)"
        subtitle="Hỗ trợ Thời trang, Mỹ phẩm (Lô/FEFO), Điện tử (Serial/IMEI), Thực phẩm F&B, Mẹ & Bé, Gia dụng • Bảo mật giá vốn (FLS) & Tồn kho 4 trạng thái"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <PatternButton
              type="button"
              size="sm"
              rounded="full"
              variant="glass"
              color="info"
              icon={<ClipboardCheck className="w-3.5 h-3.5" />}
              onClick={() => setOpenAdjustModal(true)}
            >
              Kiểm kho / Nhập PO
            </PatternButton>
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
              variant="glass"
              color="success"
              icon={<Layers className="w-3.5 h-3.5" />}
              onClick={() => setOpenCreateBundleModal(true)}
            >
              + Tạo Combo (Bundle BOM)
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
              + Tạo Sản Phẩm Đa Ngành (Nhân Ma Trận SKU)
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
              label: "Biến thể SKU Đa ngành & Tồn 4 trạng thái",
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

        <div className="flex items-center gap-2 flex-wrap">
          <Select
            value={filterIndustry}
            onValueChange={(v) =>
              setFilterIndustry(v as "ALL" | ProductIndustryType)
            }
          >
            <TriggerSelect className="h-8 w-52 text-xs">
              <SelectValue placeholder="Lọc theo ngành hàng" />
            </TriggerSelect>
            <ContentSelect>
              <ItemSelect value="ALL">🌐 Tất cả ngành hàng</ItemSelect>
              <ItemSelect value="FASHION_APPAREL">
                👗 Thời trang & Phụ kiện
              </ItemSelect>
              <ItemSelect value="COSMETICS_BEAUTY">
                💄 Mỹ phẩm & Làm đẹp (FEFO)
              </ItemSelect>
              <ItemSelect value="ELECTRONICS_TECH">
                📱 Điện tử & Công nghệ (IMEI)
              </ItemSelect>
              <ItemSelect value="FOOD_BEVERAGE">
                🍵 Thực phẩm & Đồ uống
              </ItemSelect>
              <ItemSelect value="MOTHER_AND_BABY">🍼 Mẹ & Bé</ItemSelect>
              <ItemSelect value="HOME_LIVING_APPLIANCES">
                🏠 Gia dụng & Đời sống
              </ItemSelect>
              <ItemSelect value="GENERAL_MULTI_CATEGORY">
                📦 Đa ngành / Combo
              </ItemSelect>
            </ContentSelect>
          </Select>

          <LiquidGlassInput className="h-8 w-64 p-0 overflow-hidden">
            <div className="flex items-center px-3 h-full w-full">
              <Search className="w-3.5 h-3.5 text-muted-foreground mr-2 shrink-0" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm SKU, Barcode, Lô LOT, tên SP..."
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
                  <th className="py-2.5 px-2">Mã SKU / Ngành hàng</th>
                  <th className="py-2.5 px-2">
                    Tên Biến thể / Thuộc tính Động / Lô HSD & BOM
                  </th>
                  <th className="py-2.5 px-2 text-right">Giá bán lẻ</th>
                  <th className="py-2.5 px-2 text-right">
                    Giá vốn (FLS Protected)
                  </th>
                  <th className="py-2.5 px-2 text-center">Tồn thực tế</th>
                  <th className="py-2.5 px-2 text-center">Đang giữ chỗ</th>
                  <th className="py-2.5 px-2 text-center">Có thể bán</th>
                  <th className="py-2.5 px-2">Phân bổ Đa kho</th>
                  <th className="py-2.5 px-2 text-right">Thao tác nhanh</th>
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
                      {v.industryType && (
                        <div className="mt-1">
                          <GlassBadge variant="secondary" size="sm">
                            {INDUSTRY_BADGE_LABELS[v.industryType] ||
                              v.categoryName}
                          </GlassBadge>
                        </div>
                      )}
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
                        {v.requiresBatchExpiry && v.batchCode && (
                          <GlassBadge
                            variant={v.isNearExpiryWarning ? "danger" : "info"}
                            size="sm"
                          >
                            Lô: {v.batchCode}
                            {v.expiryDate ? ` • HSD: ${v.expiryDate}` : ""}
                          </GlassBadge>
                        )}
                      </div>

                      {v.attributesJson &&
                        Object.keys(v.attributesJson).length > 0 && (
                          <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                            {Object.entries(v.attributesJson).map(
                              ([k, val]) => (
                                <span key={k}>
                                  {k}: <b className="text-foreground">{val}</b>
                                </span>
                              ),
                            )}
                            <span>
                              • TL tính cước:{" "}
                              <b>{v.chargeableWeightGrams || v.weightGrams}g</b>
                            </span>
                          </div>
                        )}

                      {v.isBundleBom &&
                        Array.isArray(v.bundleComponentsJson) && (
                          <div className="text-[10px] text-sky-600 dark:text-sky-400 mt-0.5">
                            Định mức BOM:{" "}
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
                            {st.defectiveHoldQty > 0
                              ? ` (${st.defectiveHoldQty} lỗi)`
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
                              note: `Nhập bổ sung nhanh +10 [${v.skuCode}] vào kho`,
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
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="text-xs text-muted-foreground">
              Quản lý vòng đời từng đơn vị thiết bị theo mã <b>Serial / IMEI</b>{" "}
              (`IN_STOCK` → `RESERVED` → `SOLD_ACTIVE_WARRANTY` →
              `RMA_RETURNED`)
            </div>
            <PatternButton
              type="button"
              size="sm"
              rounded="full"
              variant="solid"
              color="primary"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setOpenSerialModal(true)}
            >
              + Nhập Kho / Quét Xuất Bảo Hành Serial-IMEI
            </PatternButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {serialItems.map((sn) => (
              <div
                key={sn.id}
                className="p-3 rounded-xl border border-border/50 space-y-1.5 bg-background/40"
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
                  {sn.soldOrderCode ? ` • Đơn: #${sn.soldOrderCode}` : ""}
                  {sn.warrantyExpiresAt
                    ? ` • Hết hạn: ${new Date(sn.warrantyExpiresAt).toLocaleDateString("vi-VN")}`
                    : ""}
                </div>
              </div>
            ))}
          </div>
        </GlassSurfaceCard>
      )}

      {/* MODAL 1: TẠO SẢN PHẨM ĐA NGÀNH HÀNG & KHỞI TẠO MA TRẬN BIẾN THỂ 2 TRỤC ĐỘNG (F05.1 & F05.2) */}
      <GlassModal
        open={openCreateMatrixModal}
        onOpenChange={setOpenCreateMatrixModal}
        title="Tạo Sản Phẩm Đa Ngành Hàng & Khởi Tạo Ma Trận Biến Thể SKU Tự Động (F05.1)"
        description="Hỗ trợ linh hoạt mọi ngành hàng (Thời trang, Mỹ phẩm Lô/FEFO, Điện tử Serial/IMEI, Thực phẩm F&B, Mẹ & Bé, Gia dụng) với 2 trục thuộc tính tùy biến."
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
                const axis1Vals = axis1ValuesInput
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean);
                const axis2Vals = axis2ValuesInput
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean);
                const ok = await createProductWithMatrix({
                  shopId,
                  code: prodCode.trim(),
                  name: prodName.trim(),
                  industryType: selectedIndustry,
                  categoryName: categoryName.trim(),
                  brandName: brandName.trim(),
                  unitName: unitName.trim(),
                  attributeAxis1Name: axis1Name.trim(),
                  attributeAxis1Values: axis1Vals,
                  attributeAxis2Name: axis2Name.trim(),
                  attributeAxis2Values: axis2Vals,
                  colors: axis1Vals,
                  sizes: axis2Vals,
                  retailPrice: retailPriceInput,
                  wholesalePrice: wholesalePriceInput,
                  costPrice: costPriceInput,
                  maxDiscountPercent: maxDiscountInput,
                  weightGrams: weightGramsInput,
                  lengthCm: lengthCmInput,
                  widthCm: widthCmInput,
                  heightCm: heightCmInput,
                  requiresSerialImei,
                  warrantyMonths: warrantyMonthsInput,
                  requiresBatchExpiry,
                  batchCode: requiresBatchExpiry ? batchCodeInput : undefined,
                  expiryDate: requiresBatchExpiry ? expiryDateInput : undefined,
                  storageCondition: requiresBatchExpiry
                    ? storageConditionInput
                    : undefined,
                  initialOnHandQtyPerVariant: initStockInput,
                });
                if (ok) setOpenCreateMatrixModal(false);
              }}
            >
              Khởi tạo Ma trận SKU Đa Ngành
            </PatternButton>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          <div>
            <Label className="text-xs font-semibold">
              1. Chọn Ngành hàng Sản phẩm (Tự động gợi ý trục biến thể & quy tắc
              quản lý kho)
            </Label>
            <Select
              value={selectedIndustry}
              onValueChange={(v) =>
                handleSelectIndustryPreset(v as ProductIndustryType)
              }
            >
              <TriggerSelect className="mt-1">
                <SelectValue />
              </TriggerSelect>
              <ContentSelect>
                {Object.entries(INDUSTRY_PRESETS).map(([key, preset]) => (
                  <ItemSelect key={key} value={key}>
                    {preset.label}
                  </ItemSelect>
                ))}
              </ContentSelect>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <Label className="text-xs">Mã sản phẩm gốc</Label>
              <Input
                value={prodCode}
                onChange={(e) => setProdCode(e.target.value)}
                placeholder="VD: SRM-VITC-01 / MAY-S9 / AO-A12"
                className="mt-1"
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">Tên sản phẩm</Label>
              <Input
                value={prodName}
                onChange={(e) => setProdName(e.target.value)}
                placeholder="Nhập tên sản phẩm..."
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <Label className="text-xs">Danh mục</Label>
              <Input
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Thương hiệu</Label>
              <Input
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Đơn vị tính chuẩn</Label>
              <Input
                value={unitName}
                onChange={(e) => setUnitName(e.target.value)}
                placeholder="Chiếc / Chai / Hộp / Máy / Bộ"
                className="mt-1"
              />
            </div>
          </div>

          <div className="p-2.5 rounded-xl border border-border/50 bg-muted/20 space-y-2">
            <div className="font-semibold text-[11px] text-primary">
              2. Cấu hình Ma trận 2 Trục Thuộc tính Động (Tự động nhân tổ hợp
              SKU & cấp Barcode)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <Label className="text-[11px]">Tên Trục thuộc tính 1</Label>
                <Input
                  value={axis1Name}
                  onChange={(e) => setAxis1Name(e.target.value)}
                  placeholder="Màu sắc / Dung tích / Phiên bản..."
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-[11px]">
                  Các giá trị của [{axis1Name || "Trục 1"}] (ngăn cách dấu phẩy)
                </Label>
                <Input
                  value={axis1ValuesInput}
                  onChange={(e) => setAxis1ValuesInput(e.target.value)}
                  className="mt-1 h-8 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <Label className="text-[11px]">Tên Trục thuộc tính 2</Label>
                <Input
                  value={axis2Name}
                  onChange={(e) => setAxis2Name(e.target.value)}
                  placeholder="Kích cỡ / Loại da / Hương vị..."
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-[11px]">
                  Các giá trị của [{axis2Name || "Trục 2"}] (ngăn cách dấu phẩy)
                </Label>
                <Input
                  value={axis2ValuesInput}
                  onChange={(e) => setAxis2ValuesInput(e.target.value)}
                  className="mt-1 h-8 text-xs"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
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
              <Label className="text-xs">Giá bán sỉ (VND)</Label>
              <Input
                type="number"
                value={wholesalePriceInput}
                onChange={(e) => setWholesalePriceInput(Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Giá vốn MAC (Bảo mật FLS)</Label>
              <Input
                type="number"
                value={costPriceInput}
                onChange={(e) => setCostPriceInput(Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Tồn đầu kỳ / mỗi SKU</Label>
              <Input
                type="number"
                value={initStockInput}
                onChange={(e) => setInitStockInput(Number(e.target.value))}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <div>
              <Label className="text-[11px]">Trọng lượng thực (g)</Label>
              <Input
                type="number"
                value={weightGramsInput}
                onChange={(e) => setWeightGramsInput(Number(e.target.value))}
                className="mt-1 h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-[11px]">Dài (cm)</Label>
              <Input
                type="number"
                value={lengthCmInput}
                onChange={(e) => setLengthCmInput(Number(e.target.value))}
                className="mt-1 h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-[11px]">Rộng (cm)</Label>
              <Input
                type="number"
                value={widthCmInput}
                onChange={(e) => setWidthCmInput(Number(e.target.value))}
                className="mt-1 h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-[11px]">Cao (cm)</Label>
              <Input
                type="number"
                value={heightCmInput}
                onChange={(e) => setHeightCmInput(Number(e.target.value))}
                className="mt-1 h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-[11px]">Trần giảm giá (%)</Label>
              <Input
                type="number"
                value={maxDiscountInput}
                onChange={(e) => setMaxDiscountInput(Number(e.target.value))}
                className="mt-1 h-8 text-xs"
              />
            </div>
          </div>

          <div className="text-[11px] text-muted-foreground">
            📦 Trọng lượng quy đổi thể tích 3PL (`D x R x C / 5`):{" "}
            <b>{volumetricWeightPreview.volumetricGrams}g</b> → Trọng lượng tính
            cước vận chuyển: <b>{volumetricWeightPreview.chargeableGrams}g</b>
          </div>

          {/* Tùy chọn chuyên sâu theo ngành: Serial/IMEI hoặc Lô/Hạn sử dụng FEFO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <div className="p-2.5 rounded-xl border border-border/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[11px]">
                  Quản lý mã Serial / IMEI & Bảo hành
                </span>
                <Switch
                  checked={requiresSerialImei}
                  onCheckedChange={setRequiresSerialImei}
                />
              </div>
              {requiresSerialImei && (
                <div>
                  <Label className="text-[11px]">
                    Số tháng bảo hành điện tử
                  </Label>
                  <Input
                    type="number"
                    value={warrantyMonthsInput}
                    onChange={(e) =>
                      setWarrantyMonthsInput(Number(e.target.value))
                    }
                    className="mt-1 h-7 text-xs"
                  />
                </div>
              )}
            </div>

            <div className="p-2.5 rounded-xl border border-border/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[11px]">
                  Quản lý Lô (Batch/Lot) & Hạn sử dụng FEFO
                </span>
                <Switch
                  checked={requiresBatchExpiry}
                  onCheckedChange={setRequiresBatchExpiry}
                />
              </div>
              {requiresBatchExpiry && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[11px]">Mã Lô (Batch/Lot)</Label>
                    <Input
                      value={batchCodeInput}
                      onChange={(e) => setBatchCodeInput(e.target.value)}
                      className="mt-1 h-7 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px]">Hạn sử dụng</Label>
                    <Input
                      type="date"
                      value={expiryDateInput}
                      onChange={(e) => setExpiryDateInput(e.target.value)}
                      className="mt-1 h-7 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </GlassModal>

      {/* MODAL 2: TẠO SẢN PHẨM COMBO (BUNDLE BOM — F05.7) */}
      <GlassModal
        open={openCreateBundleModal}
        onOpenChange={setOpenCreateBundleModal}
        title="Tạo Sản Phẩm Combo / Bộ Quà Tặng Đa Ngành (Bundle BOM — F05.7)"
        description="Tồn khả dụng của Combo tự động tính theo công thức min(Available_i / RequiredQty_i) từ các SKU thành phần."
        size="lg"
        footer={
          <>
            <PatternButton
              type="button"
              variant="ghost"
              size="sm"
              rounded="full"
              onClick={() => setOpenCreateBundleModal(false)}
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
                if (
                  !bundleSkuCode.trim() ||
                  !bundleName.trim() ||
                  bundleComponents.length === 0
                ) {
                  return;
                }
                const ok = await createBundleBom({
                  shopId,
                  skuCode: bundleSkuCode.trim(),
                  variantName: bundleName.trim(),
                  retailPrice: bundleRetailPrice,
                  maxDiscountPercent: bundleMaxDiscount,
                  components: bundleComponents,
                });
                if (ok) {
                  setOpenCreateBundleModal(false);
                  setBundleComponents([]);
                  setActiveTab("BUNDLES");
                }
              }}
            >
              Lưu Sản Phẩm Combo BOM
            </PatternButton>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <Label className="text-xs">Mã SKU Combo</Label>
              <Input
                value={bundleSkuCode}
                onChange={(e) => setBundleSkuCode(e.target.value)}
                placeholder="VD: COMBO-SKINCARE-01"
                className="mt-1"
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">Tên bộ Combo hiển thị</Label>
              <Input
                value={bundleName}
                onChange={(e) => setBundleName(e.target.value)}
                placeholder="VD: Combo Chăm Sóc Da Toàn Diện (Máy Rửa Mặt S9 + Serum B5)"
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <Label className="text-xs">Giá bán trọn bộ Combo (VND)</Label>
              <Input
                type="number"
                value={bundleRetailPrice}
                onChange={(e) => setBundleRetailPrice(Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Trần chiết khấu tối đa (%)</Label>
              <Input
                type="number"
                value={bundleMaxDiscount}
                onChange={(e) => setBundleMaxDiscount(Number(e.target.value))}
                className="mt-1"
              />
            </div>
          </div>

          <div className="p-2.5 rounded-xl border border-border/50 space-y-2">
            <Label className="text-xs font-semibold">
              Thêm SKU thành phần vào định mức BOM
            </Label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Select
                  value={pickComponentVariantId}
                  onValueChange={setPickComponentVariantId}
                >
                  <TriggerSelect className="h-8 text-xs">
                    <SelectValue placeholder="Chọn SKU thành phần..." />
                  </TriggerSelect>
                  <ContentSelect>
                    {variants
                      .filter((v) => !v.isBundleBom)
                      .map((v) => (
                        <ItemSelect key={v.id} value={v.id}>
                          [{v.skuCode}] {v.variantName} (
                          {Number(v.retailPrice).toLocaleString("vi-VN")}đ)
                        </ItemSelect>
                      ))}
                  </ContentSelect>
                </Select>
              </div>
              <Input
                type="number"
                min={1}
                value={pickComponentQty}
                onChange={(e) => setPickComponentQty(Number(e.target.value))}
                className="h-8 w-20 text-xs"
              />
              <PatternButton
                type="button"
                size="sm"
                rounded="full"
                variant="solid"
                color="primary"
                onClick={() => {
                  const found = variants.find(
                    (v) => v.id === pickComponentVariantId,
                  );
                  if (!found) return;
                  setBundleComponents((prev) => {
                    const existing = prev.find(
                      (c) => c.componentVariantId === found.id,
                    );
                    if (existing) {
                      return prev.map((c) =>
                        c.componentVariantId === found.id
                          ? {
                              ...c,
                              requiredQty: c.requiredQty + pickComponentQty,
                            }
                          : c,
                      );
                    }
                    return [
                      ...prev,
                      {
                        componentVariantId: found.id,
                        componentSkuCode: found.skuCode,
                        componentName: found.variantName,
                        requiredQty: Math.max(1, pickComponentQty),
                        retailPriceSnapshot: Number(found.retailPrice),
                      },
                    ];
                  });
                }}
              >
                + Thêm vào BOM
              </PatternButton>
            </div>

            {bundleComponents.length > 0 && (
              <div className="space-y-1.5 pt-2">
                {bundleComponents.map((comp) => (
                  <div
                    key={comp.componentVariantId}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/40"
                  >
                    <span>
                      <b className="font-mono text-primary">
                        {comp.componentSkuCode}
                      </b>{" "}
                      — {comp.componentName} (Định mức: x{comp.requiredQty})
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setBundleComponents((prev) =>
                          prev.filter(
                            (c) =>
                              c.componentVariantId !== comp.componentVariantId,
                          ),
                        )
                      }
                      className="text-destructive hover:underline cursor-pointer"
                    >
                      Xóa
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </GlassModal>

      {/* MODAL 3: TẠO PHIẾU CHUYỂN KHO NỘI BỘ 2 BƯỚC (F05.6) */}
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
                  note: transferNote,
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

          <div className="grid grid-cols-2 gap-2">
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
            <div>
              <Label className="text-xs">Ghi chú phiếu chuyển</Label>
              <Input
                value={transferNote}
                onChange={(e) => setTransferNote(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </div>
      </GlassModal>

      {/* MODAL 4: KIỂM KHO CÂN BẰNG / NHẬP PO / CHUYỂN HÀNG LỖI (F05.3 & F05.5) */}
      <GlassModal
        open={openAdjustModal}
        onOpenChange={setOpenAdjustModal}
        title="Kiểm Kho Cân Bằng, Nhập Hàng PO & Quản Lý Hàng Lỗi (F05.3 & F05.5)"
        description="Mọi thay đổi tồn kho đều ghi vào Sổ cái Thẻ kho phân vùng (inventory_movement_ledgers) và Nhật ký Chuỗi băm Bảo mật HMAC."
        size="md"
        footer={
          <>
            <PatternButton
              type="button"
              variant="ghost"
              size="sm"
              rounded="full"
              onClick={() => setOpenAdjustModal(false)}
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
                if (!adjustWhId || !adjustVariantId) return;
                const ok = await adjustStocktake({
                  shopId,
                  warehouseId: adjustWhId,
                  variantId: adjustVariantId,
                  movementType: adjustMovementType,
                  deltaQty: adjustDeltaQty,
                  deltaDefectiveHoldQty: adjustDefectiveDelta,
                  note: adjustNote,
                });
                if (ok) {
                  setOpenAdjustModal(false);
                }
              }}
            >
              Xác nhận Cập nhật Tồn kho
            </PatternButton>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Chọn Kho hàng</Label>
              <Select value={adjustWhId} onValueChange={setAdjustWhId}>
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
              <Label className="text-xs">Loại nghiệp vụ kho</Label>
              <Select
                value={adjustMovementType}
                onValueChange={(v) =>
                  setAdjustMovementType(v as InventoryMovementType)
                }
              >
                <TriggerSelect className="mt-1">
                  <SelectValue />
                </TriggerSelect>
                <ContentSelect>
                  <ItemSelect value="PO_RECEIVE">
                    📦 Nhập hàng Nhà cung cấp (PO_RECEIVE)
                  </ItemSelect>
                  <ItemSelect value="STOCKTAKE_ADJUST">
                    ⚖️ Kiểm kê cân bằng kho (STOCKTAKE_ADJUST)
                  </ItemSelect>
                  <ItemSelect value="RETURN_RESTOCK">
                    ↩️ Nhập lại hàng hoàn (RETURN_RESTOCK)
                  </ItemSelect>
                  <ItemSelect value="DEFECTIVE_HOLD">
                    ⚠️ Chuyển sang kho hàng lỗi (DEFECTIVE_HOLD)
                  </ItemSelect>
                </ContentSelect>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs">Biến thể SKU</Label>
            <Select value={adjustVariantId} onValueChange={setAdjustVariantId}>
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

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">
                Số lượng thay đổi Tồn thực tế (+ / -)
              </Label>
              <Input
                type="number"
                value={adjustDeltaQty}
                onChange={(e) => setAdjustDeltaQty(Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">
                Thay đổi Hàng lỗi chờ xử lý (defectiveHoldQty)
              </Label>
              <Input
                type="number"
                value={adjustDefectiveDelta}
                onChange={(e) =>
                  setAdjustDefectiveDelta(Number(e.target.value))
                }
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Lý do / Chứng từ tham chiếu</Label>
            <Input
              value={adjustNote}
              onChange={(e) => setAdjustNote(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
      </GlassModal>

      {/* MODAL 5: NHẬP MỚI & QUÉT GẮN SERIAL / IMEI KÍCH HOẠT BẢO HÀNH ĐIỆN TỬ (F05.8) */}
      <GlassModal
        open={openSerialModal}
        onOpenChange={setOpenSerialModal}
        title="Quản Lý Mã Serial / IMEI & Kích Hoạt Bảo Hành Điện Tử (F05.8)"
        description="Đăng ký danh sách Serial/IMEI khi nhập kho hoặc quét gắn Serial vào đơn hàng khi đóng gói xuất kho."
        size="lg"
        footer={
          <PatternButton
            type="button"
            variant="ghost"
            size="sm"
            rounded="full"
            onClick={() => setOpenSerialModal(false)}
          >
            Đóng
          </PatternButton>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3 rounded-xl border border-border/50 space-y-2.5">
            <div className="font-bold text-primary">
              1. Đăng ký Lô Mã Serial / IMEI mới vào Kho
            </div>
            <div>
              <Label className="text-xs">Kho lưu trữ</Label>
              <Select value={serialWhId} onValueChange={setSerialWhId}>
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
              <Label className="text-xs">Sản phẩm / Biến thể SKU</Label>
              <Select
                value={serialVariantId}
                onValueChange={setSerialVariantId}
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
              <Label className="text-xs">
                Danh sách Serial / IMEI (cách nhau dấu phẩy)
              </Label>
              <Input
                value={serialNumbersBulkText}
                onChange={(e) => setSerialNumbersBulkText(e.target.value)}
                className="mt-1 font-mono"
              />
            </div>
            <div>
              <Label className="text-xs">Hạn bảo hành (tháng)</Label>
              <Input
                type="number"
                value={serialWarrantyMonths}
                onChange={(e) =>
                  setSerialWarrantyMonths(Number(e.target.value))
                }
                className="mt-1"
              />
            </div>
            <PatternButton
              type="button"
              variant="solid"
              color="primary"
              size="sm"
              rounded="full"
              fullWidth
              onClick={async () => {
                const list = serialNumbersBulkText
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean);
                if (list.length === 0) return;
                await registerProductSerials({
                  shopId,
                  warehouseId: serialWhId,
                  variantId: serialVariantId,
                  serialNumbers: list,
                  warrantyMonths: serialWarrantyMonths,
                });
              }}
            >
              Nhập Danh Sách Serial / IMEI vào Kho
            </PatternButton>
          </div>

          <div className="p-3 rounded-xl border border-border/50 space-y-2.5">
            <div className="font-bold text-emerald-600 dark:text-emerald-400">
              2. Quét Serial / IMEI Gắn Vào Đơn Hàng & Kích Hoạt Bảo Hành
            </div>
            <div>
              <Label className="text-xs">Mã Serial / IMEI quét trên hộp</Label>
              <Input
                value={bindSerialNumberInput}
                onChange={(e) => setBindSerialNumberInput(e.target.value)}
                placeholder="VD: SN-S9PRO-2026001"
                className="mt-1 font-mono"
              />
            </div>
            <div>
              <Label className="text-xs">Mã đơn hàng xuất bán</Label>
              <Input
                value={bindOrderCodeInput}
                onChange={(e) => setBindOrderCodeInput(e.target.value)}
                placeholder="VD: ORD-2026-001"
                className="mt-1 font-mono"
              />
            </div>
            <PatternButton
              type="button"
              variant="solid"
              color="success"
              size="sm"
              rounded="full"
              fullWidth
              onClick={async () => {
                if (!bindSerialNumberInput.trim() || !bindOrderCodeInput.trim())
                  return;
                await scanBindSerialToOrder({
                  shopId,
                  serialNumber: bindSerialNumberInput.trim(),
                  orderId: bindOrderCodeInput.trim(),
                });
                setBindSerialNumberInput("");
              }}
            >
              Quét Gắn Đơn Hàng & Kích Hoạt Bảo Hành
            </PatternButton>
          </div>
        </div>
      </GlassModal>
    </div>
  );
}

export default function ProductsAndInventoryPage() {
  return <ProductsAndInventoryWorkspace initialTab="VARIANTS" />;
}
