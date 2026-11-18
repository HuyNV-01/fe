/** biome-ignore-all lint/suspicious/noArrayIndexKey: <explanation> */
/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
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
  IProductFreeGiftRule,
  IProductVariant,
  ISellerAdvisorFieldSchema,
  ISellerAdvisorRuleRow,
  ISellerCategoryBlueprint,
  InventoryMovementType,
  ProductIndustryType,
} from "@/types/catalog-pos";
import {
  ArrowLeftRight,
  Barcode,
  Boxes,
  CheckCircle2,
  ClipboardCheck,
  Cpu,
  Edit3,
  Gift,
  History,
  Landmark,
  Layers,
  PackagePlus,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Trash2,
  Warehouse,
} from "lucide-react";
import { toast } from "sonner";

export type CatalogPageTabKey =
  | "VARIANTS"
  | "BUNDLES"
  | "TRANSFERS"
  | "LEDGERS"
  | "SERIALS"
  | "SETTINGS";

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
    catalogConfig,
    inventoryLedgers,
    transferOrders,
    serialItems,
    fetchCatalogAndStock,
    fetchCatalogPosConfig,
    updateCatalogPosConfig,
    upsertSellerCategoryBlueprint,
    deleteSellerCategoryBlueprint,
    seedSampleCatalog,
    updateProductVariant,
    deleteProductVariant,
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
  const [filterCategoryId, setFilterCategoryId] = useState<string>("ALL");

  const sellerCategories = useMemo(
    () =>
      [...(catalogConfig?.categories || [])].sort(
        (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0),
      ),
    [catalogConfig],
  );

  // 1. State Modal tạo Sản phẩm theo Ngành hàng Người bán cấu hình & Ma trận Biến thể 2 trục động
  const [openCreateMatrixModal, setOpenCreateMatrixModal] = useState(false);
  const [selectedCustomCategoryId, setSelectedCustomCategoryId] =
    useState<string>("");
  const [selectedIndustry, setSelectedIndustry] =
    useState<ProductIndustryType>("FASHION_APPAREL");
  const [prodCode, setProdCode] = useState("");
  const [prodName, setProdName] = useState("");
  const [categoryName, setCategoryName] = useState("Thời trang & Phụ kiện");
  const [brandName, setBrandName] = useState("Thương hiệu riêng");
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
  const [isFreeGiftItemInput, setIsFreeGiftItemInput] = useState(false);
  const [requiresSerialImei, setRequiresSerialImei] = useState(false);
  const [warrantyMonthsInput, setWarrantyMonthsInput] = useState(12);
  const [requiresBatchExpiry, setRequiresBatchExpiry] = useState(false);
  const [batchCodeInput, setBatchCodeInput] = useState("LOT-2026-11A");
  const [expiryDateInput, setExpiryDateInput] = useState("2028-11-15");
  const [storageConditionInput, setStorageConditionInput] = useState(
    "Bảo quản nơi khô thoáng < 25°C",
  );

  // 1B. State Modal Chỉnh sửa Biến thể SKU (`editingVariant`)
  const [editingVariant, setEditingVariant] = useState<IProductVariant | null>(
    null,
  );
  const [editVariantName, setEditVariantName] = useState("");
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editUnitName, setEditUnitName] = useState("");
  const [editRetailPrice, setEditRetailPrice] = useState(0);
  const [editWholesalePrice, setEditWholesalePrice] = useState(0);
  const [editCostPrice, setEditCostPrice] = useState(0);
  const [editMaxDiscount, setEditMaxDiscount] = useState(15);
  const [editWeightGrams, setEditWeightGrams] = useState(300);
  const [editBatchCode, setEditBatchCode] = useState("");
  const [editExpiryDate, setEditExpiryDate] = useState("");
  const [editIsFreeGift, setEditIsFreeGift] = useState(false);

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

  // 6. State Quản lý Ngành hàng Động, Tư vấn Thông số, Quà tặng & Ngân hàng VietQR (Tab SETTINGS)
  const [openUpsertCategoryModal, setOpenUpsertCategoryModal] = useState(false);
  const [catFormId, setCatFormId] = useState<string | undefined>(undefined);
  const [catFormCode, setCatFormCode] = useState("");
  const [catFormName, setCatFormName] = useState("");
  const [catFormBadge, setCatFormBadge] = useState("");
  const [catFormEmoji, setCatFormEmoji] = useState("📦");
  const [catFormIndustry, setCatFormIndustry] = useState<ProductIndustryType>(
    "GENERAL_MULTI_CATEGORY",
  );
  const [catFormUnit, setCatFormUnit] = useState("Sản phẩm");
  const [catFormAxis1Name, setCatFormAxis1Name] = useState("Phân loại 1");
  const [catFormAxis1Values, setCatFormAxis1Values] = useState(
    "Tiêu chuẩn, Cao cấp",
  );
  const [catFormAxis2Name, setCatFormAxis2Name] =
    useState("Kích cỡ / Quy cách");
  const [catFormAxis2Values, setCatFormAxis2Values] = useState("S, M, L");
  const [catFormSerial, setCatFormSerial] = useState(false);
  const [catFormWarranty, setCatFormWarranty] = useState(12);
  const [catFormBatch, setCatFormBatch] = useState(false);
  const [catFormShelfLife, setCatFormShelfLife] = useState(24);
  const [catFormMaxDisc, setCatFormMaxDisc] = useState(15);
  const [catFormEnableAdvisor, setCatFormEnableAdvisor] = useState(true);
  const [catFormAdvisorTitle, setCatFormAdvisorTitle] = useState(
    "Bảng tư vấn thông số & kích cỡ",
  );
  const [catFormAdvisorFields, setCatFormAdvisorFields] = useState<
    ISellerAdvisorFieldSchema[]
  >([]);
  const [catFormAdvisorRules, setCatFormAdvisorRules] = useState<
    ISellerAdvisorRuleRow[]
  >([]);

  // State thêm mới Quy tắc Quà tặng kèm 0đ
  const [newGiftRuleName, setNewGiftRuleName] = useState(
    "Tặng quà 0đ cho đơn từ 500k",
  );
  const [newGiftMinSubtotal, setNewGiftMinSubtotal] = useState(500000);
  const [newGiftVariantId, setNewGiftVariantId] = useState("");
  const [newGiftQty, setNewGiftQty] = useState(1);

  // State cấu hình Tài khoản Ngân hàng VietQR
  const [bankBinInput, setBankBinInput] = useState("970422");
  const [bankShortNameInput, setBankShortNameInput] = useState("MBBank");
  const [bankAccountNumberInput, setBankAccountNumberInput] =
    useState("0988123456888");
  const [bankAccountNameInput, setBankAccountNameInput] = useState(
    "CONG TY TNHH PANCAKE SELLER OS",
  );
  const [bankPrefixInput, setBankPrefixInput] = useState("SEVQR ORD");

  useEffect(() => {
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  useEffect(() => {
    if (!shopId) return;
    void fetchCatalogAndStock({ shopId });
    void fetchCatalogPosConfig(shopId);
    void fetchInventoryLedgers(shopId);
    void fetchWarehouseTransfers(shopId);
    void fetchProductSerials({ shopId });
  }, [
    shopId,
    fetchCatalogAndStock,
    fetchCatalogPosConfig,
    fetchInventoryLedgers,
    fetchWarehouseTransfers,
    fetchProductSerials,
  ]);

  useEffect(() => {
    if (catalogConfig?.vietQrBankConfig) {
      setBankBinInput(catalogConfig.vietQrBankConfig.bankBin || "970422");
      setBankShortNameInput(
        catalogConfig.vietQrBankConfig.bankShortName || "MBBank",
      );
      setBankAccountNumberInput(
        catalogConfig.vietQrBankConfig.accountNumber || "",
      );
      setBankAccountNameInput(catalogConfig.vietQrBankConfig.accountName || "");
      setBankPrefixInput(
        catalogConfig.vietQrBankConfig.transferPrefix || "SEVQR ORD",
      );
    }
    if (sellerCategories.length > 0 && !selectedCustomCategoryId) {
      handleSelectSellerCategoryForProduct(sellerCategories[0]);
    }
  }, [catalogConfig, sellerCategories.length]);

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
      setNewGiftVariantId(nonBom.id);
      const serialVar = variants.find((v) => v.requiresSerialImei) || nonBom;
      setSerialVariantId(serialVar.id);
    }
  }, [warehouses, variants, fromWhId, transferVariantId, adjustWhId]);

  const handleSelectSellerCategoryForProduct = (
    cat: ISellerCategoryBlueprint,
  ) => {
    setSelectedCustomCategoryId(cat.categoryId);
    setSelectedIndustry(cat.industryType);
    setCategoryName(cat.name);
    setUnitName(cat.defaultUnitName);
    setAxis1Name(cat.attributeAxis1Name);
    setAxis1ValuesInput((cat.attributeAxis1SampleValues || []).join(", "));
    setAxis2Name(cat.attributeAxis2Name);
    setAxis2ValuesInput((cat.attributeAxis2SampleValues || []).join(", "));
    setRequiresSerialImei(cat.requiresSerialImei);
    setWarrantyMonthsInput(cat.defaultWarrantyMonths || 12);
    setRequiresBatchExpiry(cat.requiresBatchExpiry);
    setMaxDiscountInput(cat.defaultMaxDiscountPercent || 15);
    if (cat.defaultStorageCondition) {
      setStorageConditionInput(cat.defaultStorageCondition);
    }
  };

  const handleOpenEditVariant = (v: IProductVariant) => {
    setEditingVariant(v);
    setEditVariantName(v.variantName);
    setEditCategoryName(v.categoryName || "");
    setEditUnitName(v.unitName || "Sản phẩm");
    setEditRetailPrice(Number(v.retailPrice || 0));
    setEditWholesalePrice(Number(v.wholesalePrice || 0));
    setEditCostPrice(Number(v.costPrice || 0));
    setEditMaxDiscount(Number(v.maxDiscountPercent || 15));
    setEditWeightGrams(Number(v.weightGrams || 300));
    setEditBatchCode(v.batchCode || "");
    setEditExpiryDate(v.expiryDate || "");
    setEditIsFreeGift(Boolean(v.isFreeGiftItem));
  };

  const handleOpenCategoryEditor = (cat?: ISellerCategoryBlueprint) => {
    if (cat) {
      setCatFormId(cat.categoryId);
      setCatFormCode(cat.code);
      setCatFormName(cat.name);
      setCatFormBadge(cat.badgeLabel);
      setCatFormEmoji(cat.iconEmoji || "📦");
      setCatFormIndustry(cat.industryType);
      setCatFormUnit(cat.defaultUnitName);
      setCatFormAxis1Name(cat.attributeAxis1Name);
      setCatFormAxis1Values((cat.attributeAxis1SampleValues || []).join(", "));
      setCatFormAxis2Name(cat.attributeAxis2Name);
      setCatFormAxis2Values((cat.attributeAxis2SampleValues || []).join(", "));
      setCatFormSerial(cat.requiresSerialImei);
      setCatFormWarranty(cat.defaultWarrantyMonths || 12);
      setCatFormBatch(cat.requiresBatchExpiry);
      setCatFormShelfLife(cat.defaultShelfLifeMonths || 24);
      setCatFormMaxDisc(cat.defaultMaxDiscountPercent || 15);
      setCatFormEnableAdvisor(cat.enableAdvisorInPos);
      setCatFormAdvisorTitle(cat.advisorTitle);
      setCatFormAdvisorFields(cat.advisorFields || []);
      setCatFormAdvisorRules(cat.advisorRules || []);
    } else {
      setCatFormId(undefined);
      setCatFormCode("");
      setCatFormName("");
      setCatFormBadge("");
      setCatFormEmoji("📦");
      setCatFormIndustry("GENERAL_MULTI_CATEGORY");
      setCatFormUnit("Sản phẩm");
      setCatFormAxis1Name("Phân loại 1");
      setCatFormAxis1Values("Tiêu chuẩn, Cao cấp");
      setCatFormAxis2Name("Kích cỡ / Quy cách");
      setCatFormAxis2Values("S, M, L");
      setCatFormSerial(false);
      setCatFormWarranty(12);
      setCatFormBatch(false);
      setCatFormShelfLife(24);
      setCatFormMaxDisc(15);
      setCatFormEnableAdvisor(true);
      setCatFormAdvisorTitle("Tư vấn thông số & kích cỡ");
      setCatFormAdvisorFields([
        {
          fieldKey: "heightCm",
          label: "Chiều cao",
          unit: "cm",
          fieldType: "NUMBER",
          defaultValue: 160,
          min: 100,
          max: 220,
          nerAutoFillField: "heightCm",
        },
        {
          fieldKey: "weightKg",
          label: "Cân nặng",
          unit: "kg",
          fieldType: "NUMBER",
          defaultValue: 52,
          min: 20,
          max: 150,
          nerAutoFillField: "weightKg",
        },
      ]);
      setCatFormAdvisorRules([
        {
          ruleId: `RULE_${Date.now()}`,
          recommendedResultCode: "M",
          fitNote: "Form chuẩn vừa vặn",
          numericRanges: {
            heightCm: { min: 155, max: 168 },
            weightKg: { min: 48, max: 58 },
          },
        },
      ]);
    }
    setOpenUpsertCategoryModal(true);
  };

  const displayedVariants = useMemo(() => {
    return variants.filter((v) => {
      if (activeTab === "BUNDLES" && !v.isBundleBom) return false;
      if (filterCategoryId !== "ALL") {
        const catObj = sellerCategories.find(
          (c) => c.categoryId === filterCategoryId,
        );
        const matchCustomId = v.customCategoryId === filterCategoryId;
        const matchIndustry =
          catObj &&
          !v.customCategoryId &&
          v.industryType === catObj.industryType;
        const matchName =
          catObj &&
          (v.categoryName || "").toLowerCase() === catObj.name.toLowerCase();
        if (!matchCustomId && !matchIndustry && !matchName) {
          return false;
        }
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
  }, [variants, activeTab, filterCategoryId, sellerCategories, searchQuery]);

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
        title="Danh Mục Sản Phẩm Cấu Hình Động, Đa Kho, Tồn Kho Nguyên Tử Redis Lua & Combo BOM (Sprint 4)"
        subtitle="Người bán tự cấu hình Ngành hàng, Trục biến thể, Công thức tư vấn thông số/size động, Quy tắc quà tặng 0đ & Tài khoản VietQR • Bảo mật giá vốn (FLS)"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <PatternButton
              type="button"
              size="sm"
              rounded="full"
              variant="glass"
              color="warning"
              icon={<Settings2 className="w-3.5 h-3.5" />}
              onClick={() => setActiveTab("SETTINGS")}
            >
              ⚙️ Tự Cấu Hình Ngành Hàng & POS
            </PatternButton>
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
              label: "Biến thể SKU & Tồn 4 trạng thái",
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
              label: "Sổ cái Thẻ kho",
              icon: <History className="w-3.5 h-3.5" />,
              badge: inventoryLedgers.length,
            },
            {
              key: "SERIALS",
              label: "Serial / IMEI & Bảo hành",
              icon: <Cpu className="w-3.5 h-3.5" />,
              badge: serialItems.length,
            },
            {
              key: "SETTINGS",
              label: "Cấu hình Ngành hàng & POS Động",
              icon: <Settings2 className="w-3.5 h-3.5" />,
              badge: sellerCategories.length,
            },
          ]}
        />

        {activeTab !== "SETTINGS" && (
          <div className="flex items-center gap-2 flex-wrap">
            <Select
              value={filterCategoryId}
              onValueChange={(v) => setFilterCategoryId(v)}
            >
              <TriggerSelect className="h-8 w-56 text-xs">
                <SelectValue placeholder="Lọc theo ngành hàng của shop" />
              </TriggerSelect>
              <ContentSelect>
                <ItemSelect value="ALL">
                  🌐 Tất cả ngành hàng ({variants.length})
                </ItemSelect>
                {sellerCategories.map((cat) => (
                  <ItemSelect key={cat.categoryId} value={cat.categoryId}>
                    {cat.iconEmoji ? `${cat.iconEmoji} ` : ""}
                    {cat.name}
                  </ItemSelect>
                ))}
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
        )}
      </div>

      {/* TAB 1 & TAB 2: DANH SÁCH BIẾN THỂ SKU & COMBO BOM */}
      {(activeTab === "VARIANTS" || activeTab === "BUNDLES") && (
        <GlassSurfaceCard className="p-4">
          {displayedVariants.length === 0 ? (
            <GlassEmptyState
              icon={<Boxes className="w-8 h-8" />}
              title="Chưa có sản phẩm nào trong danh mục lọc này"
              description="Bạn có thể bấm '+ Tạo Sản Phẩm (Nhân Ma Trận SKU)' theo ngành hàng tự cấu hình hoặc nạp bộ dữ liệu mẫu tham khảo."
              action={
                <div className="flex items-center gap-2 justify-center">
                  <PatternButton
                    type="button"
                    size="sm"
                    rounded="full"
                    variant="solid"
                    color="primary"
                    icon={<PackagePlus className="w-3.5 h-3.5" />}
                    onClick={() => setOpenCreateMatrixModal(true)}
                  >
                    + Tạo Sản Phẩm Mới
                  </PatternButton>
                  <PatternButton
                    type="button"
                    size="sm"
                    rounded="full"
                    variant="glass"
                    color="info"
                    icon={<Sparkles className="w-3.5 h-3.5" />}
                    onClick={() => seedSampleCatalog(shopId)}
                  >
                    Nạp Dữ Liệu Mẫu Tham Khảo
                  </PatternButton>
                </div>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/50 text-muted-foreground">
                    <th className="py-2.5 px-2">Mã SKU / Ngành hàng Shop</th>
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
                    <th className="py-2.5 px-2 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {displayedVariants.map((v) => {
                    const matchedCat = sellerCategories.find(
                      (c) =>
                        c.categoryId === v.customCategoryId ||
                        c.industryType === v.industryType,
                    );
                    return (
                      <tr key={v.id} className="hover:bg-muted/20">
                        <td className="py-2.5 px-2 font-mono">
                          <div className="font-bold text-primary">
                            {v.skuCode}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {v.barcode}
                          </div>
                          <div className="mt-1">
                            <GlassBadge variant="secondary" size="sm">
                              {matchedCat?.iconEmoji
                                ? `${matchedCat.iconEmoji} `
                                : ""}
                              {matchedCat?.badgeLabel ||
                                v.categoryName ||
                                "Đa ngành"}
                            </GlassBadge>
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
                            {v.isFreeGiftItem && (
                              <GlassBadge variant="success" size="sm">
                                🎁 Quà tặng
                              </GlassBadge>
                            )}
                            {v.requiresSerialImei && (
                              <GlassBadge variant="warning" size="sm">
                                Serial/IMEI ({v.warrantyMonths}T)
                              </GlassBadge>
                            )}
                            {v.requiresBatchExpiry && v.batchCode && (
                              <GlassBadge
                                variant={
                                  v.isNearExpiryWarning ? "danger" : "info"
                                }
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
                                      {k}:{" "}
                                      <b className="text-foreground">{val}</b>
                                    </span>
                                  ),
                                )}
                                <span>
                                  • ĐVT: <b>{v.unitName || "SP"}</b> • TL tính
                                  cước:{" "}
                                  <b>
                                    {v.chargeableWeightGrams || v.weightGrams}g
                                  </b>
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
                            variant={
                              v.totalAvailableQty > 0 ? "success" : "danger"
                            }
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
                                {st.warehouseCode}: {st.availableQty}/
                                {st.onHandQty}
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
                          <div className="flex items-center justify-end gap-1">
                            {!v.isBundleBom && warehouses[0] && (
                              <PatternButton
                                type="button"
                                size="sm"
                                rounded="full"
                                variant="glass"
                                color="primary"
                                className="h-7 px-2 text-[10px]"
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
                                +10 Kho
                              </PatternButton>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenEditVariant(v)}
                              className="p-1.5 rounded-lg border border-border/50 hover:bg-muted cursor-pointer"
                              title="Chỉnh sửa biến thể SKU"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-primary" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                deleteProductVariant({
                                  shopId,
                                  variantId: v.id,
                                })
                              }
                              className="p-1.5 rounded-lg border border-border/50 hover:bg-destructive/10 cursor-pointer"
                              title="Ngừng kinh doanh / Xóa SKU"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-destructive" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </GlassSurfaceCard>
      )}

      {/* TAB 3: CHUYỂN KHO NỘI BỘ 2 BƯỚC (F05.6) */}
      {activeTab === "TRANSFERS" && (
        <GlassSurfaceCard className="p-4 space-y-3">
          {transferOrders.length === 0 ? (
            <GlassEmptyState
              icon={<ArrowLeftRight className="w-7 h-7" />}
              title="Chưa có phiếu chuyển kho nội bộ"
              description="Bấm 'Chuyển kho 2 bước' ở góc trên để tạo lệnh điều chuyển hàng hóa giữa các kho chi nhánh."
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

      {/* TAB 4: SỔ CÁI THẺ KHO PHÂN VÙNG THEO THÁNG (F05.5) */}
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

      {/* TAB 5: QUẢN LÝ MÃ SERIAL / IMEI & KÍCH HOẠT BẢO HÀNH ĐIỆN TỬ (F05.8) */}
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

      {/* TAB 6: TRUNG TÂM NGƯỜI BÁN TỰ CẤU HÌNH NGÀNH HÀNG ĐỘNG, TƯ VẤN THÔNG SỐ, QUÀ TẶNG KÈM & VIETQR (LOẠI BỎ 100% HARDCODE) */}
      {activeTab === "SETTINGS" && (
        <div className="space-y-4">
          {/* Khối 1: Danh sách Ngành hàng & Bộ tiêu chí Tư vấn Thông số Động của Shop */}
          <GlassSurfaceCard className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <div className="font-bold text-sm flex items-center gap-1.5">
                  <Settings2 className="w-4 h-4 text-primary" />
                  <span>
                    1. Danh Mục Ngành Hàng, Trục Biến Thể & Công Thức Tư Vấn
                    Động Của Shop ({sellerCategories.length} ngành hàng)
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Tất cả nút lọc ngành hàng và bộ công cụ tư vấn thông số trong{" "}
                  <b>In-Chat POS (`Alt+O`)</b> đều tự động hiển thị theo cấu
                  hình tại đây.
                </div>
              </div>
              <div className="flex items-center gap-2">
                <PatternButton
                  type="button"
                  size="sm"
                  rounded="full"
                  variant="glass"
                  color="info"
                  icon={<Sparkles className="w-3.5 h-3.5" />}
                  onClick={() => seedSampleCatalog(shopId)}
                >
                  Nạp Sản Phẩm Mẫu Tham Khảo
                </PatternButton>
                <PatternButton
                  type="button"
                  size="sm"
                  rounded="full"
                  variant="solid"
                  color="primary"
                  icon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => handleOpenCategoryEditor(undefined)}
                >
                  + Thêm Ngành Hàng Tùy Chỉnh Mới
                </PatternButton>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sellerCategories.map((cat) => (
                <div
                  key={cat.categoryId}
                  className="p-3.5 rounded-xl border border-border/60 bg-background/50 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-bold text-sm flex items-center gap-1.5">
                      <span>{cat.iconEmoji || "📦"}</span>
                      <span>{cat.name}</span>
                      <GlassBadge variant="secondary" size="sm">
                        {cat.badgeLabel}
                      </GlassBadge>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenCategoryEditor(cat)}
                        className="p-1.5 rounded-lg border border-border/50 hover:bg-muted cursor-pointer"
                        title="Chỉnh sửa cấu hình ngành hàng"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-primary" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          deleteSellerCategoryBlueprint({
                            shopId,
                            categoryId: cat.categoryId,
                          })
                        }
                        className="p-1.5 rounded-lg border border-border/50 hover:bg-destructive/10 cursor-pointer"
                        title="Xóa ngành hàng"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </button>
                    </div>
                  </div>

                  <div className="text-[11px] text-muted-foreground space-y-0.5">
                    <div>
                      • Mã ngành:{" "}
                      <b className="font-mono text-foreground">{cat.code}</b> •
                      ĐVT chuẩn: <b>{cat.defaultUnitName}</b> • Trần giảm giá:{" "}
                      <b>{cat.defaultMaxDiscountPercent}%</b>
                    </div>
                    <div>
                      • Trục biến thể 1: <b>{cat.attributeAxis1Name}</b> (
                      {(cat.attributeAxis1SampleValues || []).join(", ")})
                    </div>
                    <div>
                      • Trục biến thể 2: <b>{cat.attributeAxis2Name}</b> (
                      {(cat.attributeAxis2SampleValues || []).join(", ")})
                    </div>
                    <div>
                      • Tư vấn động trên In-Chat POS:{" "}
                      {cat.enableAdvisorInPos ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          Đang bật ({cat.advisorFields?.length || 0} trường nhập
                          • {cat.advisorRules?.length || 0} quy tắc gợi ý)
                        </span>
                      ) : (
                        <span>Đang tắt</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassSurfaceCard>

          {/* Khối 2: Cấu hình Quy tắc Quà tặng kèm 0đ tự động & Tài khoản Ngân hàng VietQR EMVCo */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <GlassSurfaceCard className="p-4 space-y-3">
              <div className="font-bold text-sm flex items-center gap-1.5">
                <Gift className="w-4 h-4 text-emerald-500" />
                <span>
                  2. Quy Tắc Quà Tặng Kèm 0đ Tự Động Khi Lên Đơn (Free Gift
                  Rules)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <Label className="text-[11px]">Tên chương trình</Label>
                  <Input
                    value={newGiftRuleName}
                    onChange={(e) => setNewGiftRuleName(e.target.value)}
                    className="mt-1 h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[11px]">
                    Giá trị đơn tối thiểu (VND)
                  </Label>
                  <Input
                    type="number"
                    value={newGiftMinSubtotal}
                    onChange={(e) =>
                      setNewGiftMinSubtotal(Number(e.target.value))
                    }
                    className="mt-1 h-8 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <div className="flex-1">
                  <Select
                    value={newGiftVariantId}
                    onValueChange={setNewGiftVariantId}
                  >
                    <TriggerSelect className="h-8 text-xs">
                      <SelectValue placeholder="Chọn SKU làm quà tặng 0đ..." />
                    </TriggerSelect>
                    <ContentSelect>
                      {variants.map((v) => (
                        <ItemSelect key={v.id} value={v.id}>
                          [{v.skuCode}] {v.variantName} (Tồn:{" "}
                          {v.totalAvailableQty})
                        </ItemSelect>
                      ))}
                    </ContentSelect>
                  </Select>
                </div>
                <Input
                  type="number"
                  min={1}
                  value={newGiftQty}
                  onChange={(e) => setNewGiftQty(Number(e.target.value))}
                  className="h-8 w-16 text-xs"
                />
                <PatternButton
                  type="button"
                  size="sm"
                  rounded="full"
                  variant="solid"
                  color="success"
                  onClick={async () => {
                    const giftVar = variants.find(
                      (v) => v.id === newGiftVariantId,
                    );
                    if (!giftVar) {
                      toast.error("Vui lòng chọn SKU quà tặng!");
                      return;
                    }
                    const nextRules: IProductFreeGiftRule[] = [
                      ...(catalogConfig?.freeGiftRules || []),
                      {
                        ruleId: `GIFT_${Date.now()}`,
                        ruleName: newGiftRuleName.trim() || "Quà tặng đơn hàng",
                        minOrderSubtotalVnd: Math.max(0, newGiftMinSubtotal),
                        requiredCategoryId: null,
                        giftVariantId: giftVar.id,
                        giftSkuCode: giftVar.skuCode,
                        giftVariantName: giftVar.variantName,
                        giftQty: Math.max(1, newGiftQty),
                        isActive: true,
                      },
                    ];
                    await updateCatalogPosConfig({
                      shopId,
                      freeGiftRules: nextRules,
                    });
                  }}
                >
                  + Thêm Quy Tắc
                </PatternButton>
              </div>

              <div className="space-y-1.5 pt-1">
                {(catalogConfig?.freeGiftRules || []).map((rule) => (
                  <div
                    key={rule.ruleId}
                    className="p-2.5 rounded-xl border border-border/50 flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="font-semibold">{rule.ruleName}</div>
                      <div className="text-[11px] text-muted-foreground">
                        Đơn từ{" "}
                        <b>
                          {Number(rule.minOrderSubtotalVnd).toLocaleString(
                            "vi-VN",
                          )}
                          đ
                        </b>{" "}
                        → Tặng{" "}
                        <b className="text-primary">
                          [{rule.giftSkuCode}] {rule.giftVariantName} (x
                          {rule.giftQty})
                        </b>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.isActive}
                        onCheckedChange={(checked) => {
                          const nextRules = (
                            catalogConfig?.freeGiftRules || []
                          ).map((r) =>
                            r.ruleId === rule.ruleId
                              ? { ...r, isActive: checked }
                              : r,
                          );
                          void updateCatalogPosConfig({
                            shopId,
                            freeGiftRules: nextRules,
                          });
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const nextRules = (
                            catalogConfig?.freeGiftRules || []
                          ).filter((r) => r.ruleId !== rule.ruleId);
                          void updateCatalogPosConfig({
                            shopId,
                            freeGiftRules: nextRules,
                          });
                        }}
                        className="text-destructive hover:underline cursor-pointer"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </GlassSurfaceCard>

            <GlassSurfaceCard className="p-4 space-y-3">
              <div className="font-bold text-sm flex items-center gap-1.5">
                <Landmark className="w-4 h-4 text-primary" />
                <span>
                  3. Cấu Hình Tài Khoản Ngân Hàng Thụ Hưởng VietQR EMVCo Của Cửa
                  Hàng
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div>
                  <Label className="text-[11px]">
                    Mã BIN Ngân hàng (NAPAS)
                  </Label>
                  <Input
                    value={bankBinInput}
                    onChange={(e) => setBankBinInput(e.target.value)}
                    placeholder="970422 (MB), 970436 (VCB)..."
                    className="mt-1 h-8 text-xs font-mono"
                  />
                </div>
                <div>
                  <Label className="text-[11px]">Tên viết tắt Ngân hàng</Label>
                  <Input
                    value={bankShortNameInput}
                    onChange={(e) => setBankShortNameInput(e.target.value)}
                    placeholder="MBBank / Vietcombank / Techcombank"
                    className="mt-1 h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[11px]">Số tài khoản thụ hưởng</Label>
                  <Input
                    value={bankAccountNumberInput}
                    onChange={(e) => setBankAccountNumberInput(e.target.value)}
                    className="mt-1 h-8 text-xs font-mono"
                  />
                </div>
                <div>
                  <Label className="text-[11px]">Cú pháp nhận diện</Label>
                  <Input
                    value={bankPrefixInput}
                    onChange={(e) => setBankPrefixInput(e.target.value)}
                    placeholder="SEVQR ORD"
                    className="mt-1 h-8 text-xs font-mono"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-[11px]">
                    Tên chủ tài khoản (Không dấu)
                  </Label>
                  <Input
                    value={bankAccountNameInput}
                    onChange={(e) => setBankAccountNameInput(e.target.value)}
                    className="mt-1 h-8 text-xs font-mono"
                  />
                </div>
              </div>

              <PatternButton
                type="button"
                size="sm"
                rounded="full"
                variant="solid"
                color="primary"
                onClick={() =>
                  updateCatalogPosConfig({
                    shopId,
                    vietQrBankConfig: {
                      bankBin: bankBinInput.trim(),
                      bankShortName: bankShortNameInput.trim(),
                      accountNumber: bankAccountNumberInput.trim(),
                      accountName: bankAccountNameInput.trim(),
                      transferPrefix: bankPrefixInput.trim() || "SEVQR ORD",
                      autoConfirmWebhookEnabled: true,
                    },
                  })
                }
              >
                Lưu Cấu Hình Ngân Hàng VietQR Của Shop
              </PatternButton>
            </GlassSurfaceCard>
          </div>
        </div>
      )}

      {/* MODAL 1: TẠO SẢN PHẨM THEO NGÀNH HÀNG NGƯỜI BÁN TỰ CẤU HÌNH & KHỞI TẠO MA TRẬN BIẾN THỂ 2 TRỤC ĐỘNG (F05.1 & F05.2) */}
      <GlassModal
        open={openCreateMatrixModal}
        onOpenChange={setOpenCreateMatrixModal}
        title="Tạo Sản Phẩm & Khởi Tạo Ma Trận Biến Thể SKU Theo Ngành Hàng Của Shop (F05.1)"
        description="Chọn từ danh sách ngành hàng cửa hàng đã cấu hình (hoặc tùy chỉnh trục thuộc tính tự do) để nhân tổ hợp SKU và cấp mã vạch tự động."
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
                  customCategoryId: selectedCustomCategoryId || undefined,
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
                  isFreeGiftItem: isFreeGiftItemInput,
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
              Khởi tạo Ma trận SKU
            </PatternButton>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          <div>
            <Label className="text-xs font-semibold">
              1. Chọn Ngành hàng của Cửa hàng (Tự động điền Trục biến thể & Quy
              tắc kho đã cấu hình)
            </Label>
            <Select
              value={selectedCustomCategoryId}
              onValueChange={(catId) => {
                const found = sellerCategories.find(
                  (c) => c.categoryId === catId,
                );
                if (found) {
                  handleSelectSellerCategoryForProduct(found);
                }
              }}
            >
              <TriggerSelect className="mt-1">
                <SelectValue placeholder="Chọn ngành hàng của shop..." />
              </TriggerSelect>
              <ContentSelect>
                {sellerCategories.map((cat) => (
                  <ItemSelect key={cat.categoryId} value={cat.categoryId}>
                    {cat.iconEmoji ? `${cat.iconEmoji} ` : ""}
                    {cat.name} ({cat.attributeAxis1Name} x{" "}
                    {cat.attributeAxis2Name})
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
                placeholder="VD: GIAY-JD1 / SRM-B5 / AO-A12"
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
              <Label className="text-xs">Tên Danh mục hiển thị</Label>
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
                placeholder="Chiếc / Đôi / Chai / Hộp / Máy"
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

          <div className="flex items-center justify-between text-[11px] text-muted-foreground flex-wrap gap-2">
            <span>
              📦 Trọng lượng quy đổi thể tích 3PL (`D x R x C / 5`):{" "}
              <b>{volumetricWeightPreview.volumetricGrams}g</b> → Tính cước:{" "}
              <b>{volumetricWeightPreview.chargeableGrams}g</b>
            </span>
            <div className="flex items-center gap-2">
              <Switch
                checked={isFreeGiftItemInput}
                onCheckedChange={setIsFreeGiftItemInput}
              />
              <span>Đánh dấu là Sản phẩm Quà tặng kèm</span>
            </div>
          </div>

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

      {/* MODAL 1B: CHỈNH SỬA BIẾN THỂ SKU (`editingVariant`) */}
      <GlassModal
        open={Boolean(editingVariant)}
        onOpenChange={(open) => {
          if (!open) setEditingVariant(null);
        }}
        title={`Chỉnh Sửa Biến Thể SKU [${editingVariant?.skuCode || ""}]`}
        description="Cập nhật tên hiển thị, danh mục, đơn vị tính, giá bán lẻ, giá vốn, trần giảm giá hoặc thông tin lô hạn sử dụng."
        size="md"
        footer={
          <>
            <PatternButton
              type="button"
              variant="ghost"
              size="sm"
              rounded="full"
              onClick={() => setEditingVariant(null)}
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
                if (!editingVariant) return;
                const ok = await updateProductVariant({
                  shopId,
                  variantId: editingVariant.id,
                  variantName: editVariantName,
                  categoryName: editCategoryName,
                  unitName: editUnitName,
                  retailPrice: editRetailPrice,
                  wholesalePrice: editWholesalePrice,
                  costPrice: editCostPrice,
                  maxDiscountPercent: editMaxDiscount,
                  weightGrams: editWeightGrams,
                  batchCode: editBatchCode || null,
                  expiryDate: editExpiryDate || null,
                  isFreeGiftItem: editIsFreeGift,
                });
                if (ok) setEditingVariant(null);
              }}
            >
              Lưu Cập Nhật SKU
            </PatternButton>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          <div>
            <Label className="text-xs">Tên biến thể SKU</Label>
            <Input
              value={editVariantName}
              onChange={(e) => setEditVariantName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <Label className="text-xs">Tên danh mục</Label>
              <Input
                value={editCategoryName}
                onChange={(e) => setEditCategoryName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Đơn vị tính</Label>
              <Input
                value={editUnitName}
                onChange={(e) => setEditUnitName(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <Label className="text-xs">Giá bán lẻ (VND)</Label>
              <Input
                type="number"
                value={editRetailPrice}
                onChange={(e) => setEditRetailPrice(Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Giá bán sỉ (VND)</Label>
              <Input
                type="number"
                value={editWholesalePrice}
                onChange={(e) => setEditWholesalePrice(Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Giá vốn MAC</Label>
              <Input
                type="number"
                value={editCostPrice}
                onChange={(e) => setEditCostPrice(Number(e.target.value))}
                className="mt-1"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <Label className="text-xs">Trần giảm giá tối đa (%)</Label>
              <Input
                type="number"
                value={editMaxDiscount}
                onChange={(e) => setEditMaxDiscount(Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Trọng lượng (gram)</Label>
              <Input
                type="number"
                value={editWeightGrams}
                onChange={(e) => setEditWeightGrams(Number(e.target.value))}
                className="mt-1"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <Label className="text-xs">Mã Lô (Batch/Lot)</Label>
              <Input
                value={editBatchCode}
                onChange={(e) => setEditBatchCode(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Hạn sử dụng</Label>
              <Input
                type="date"
                value={editExpiryDate}
                onChange={(e) => setEditExpiryDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span>Đánh dấu làm Sản phẩm Quà tặng kèm (Free Gift Item)</span>
            <Switch
              checked={editIsFreeGift}
              onCheckedChange={setEditIsFreeGift}
            />
          </div>
        </div>
      </GlassModal>

      {/* MODAL 6: TRÌNH SOẠN THẢO NGÀNH HÀNG ĐỘNG & CÔNG THỨC TƯ VẤN THÔNG SỐ ĐỘNG (`openUpsertCategoryModal`) */}
      <GlassModal
        open={openUpsertCategoryModal}
        onOpenChange={setOpenUpsertCategoryModal}
        title={
          catFormId
            ? `Chỉnh Sửa Ngành Hàng & Bộ Tiêu Chí Tư Vấn [${catFormName}]`
            : "Tạo Ngành Hàng Tùy Chỉnh Mới & Cấu Hình Tư Vấn Động"
        }
        description="Thiết lập tên ngành hàng, 2 trục biến thể, quy tắc quản lý Serial/Lô HSD và các trường nhập liệu + bảng đối chiếu tư vấn thông số trên In-Chat POS."
        size="lg"
        footer={
          <>
            <PatternButton
              type="button"
              variant="ghost"
              size="sm"
              rounded="full"
              onClick={() => setOpenUpsertCategoryModal(false)}
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
                if (!catFormCode.trim() || !catFormName.trim()) {
                  toast.error("Vui lòng nhập Mã và Tên ngành hàng!");
                  return;
                }
                const ok = await upsertSellerCategoryBlueprint({
                  shopId,
                  categoryId: catFormId,
                  code: catFormCode.trim(),
                  name: catFormName.trim(),
                  badgeLabel: catFormBadge.trim() || catFormName.trim(),
                  iconEmoji: catFormEmoji.trim() || "📦",
                  industryType: catFormIndustry,
                  defaultUnitName: catFormUnit.trim() || "Sản phẩm",
                  attributeAxis1Name: catFormAxis1Name.trim() || "Phân loại 1",
                  attributeAxis1SampleValues: catFormAxis1Values
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                  attributeAxis2Name: catFormAxis2Name.trim() || "Phân loại 2",
                  attributeAxis2SampleValues: catFormAxis2Values
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                  requiresSerialImei: catFormSerial,
                  defaultWarrantyMonths: catFormWarranty,
                  requiresBatchExpiry: catFormBatch,
                  defaultShelfLifeMonths: catFormShelfLife,
                  defaultMaxDiscountPercent: catFormMaxDisc,
                  enableAdvisorInPos: catFormEnableAdvisor,
                  advisorTitle: catFormAdvisorTitle.trim(),
                  advisorFields: catFormAdvisorFields,
                  advisorRules: catFormAdvisorRules,
                  isActive: true,
                });
                if (ok) setOpenUpsertCategoryModal(false);
              }}
            >
              Lưu Cấu Hình Ngành Hàng
            </PatternButton>
          </>
        }
      >
        <div className="space-y-3 text-xs max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <div>
              <Label className="text-[11px]">Biểu tượng</Label>
              <Input
                value={catFormEmoji}
                onChange={(e) => setCatFormEmoji(e.target.value)}
                className="mt-1 h-8 text-xs text-center"
              />
            </div>
            <div>
              <Label className="text-[11px]">Mã ngành hàng</Label>
              <Input
                value={catFormCode}
                onChange={(e) => setCatFormCode(e.target.value)}
                placeholder="VD: SNEAKERS_VN"
                className="mt-1 h-8 text-xs font-mono"
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-[11px]">Tên ngành hàng đầy đủ</Label>
              <Input
                value={catFormName}
                onChange={(e) => setCatFormName(e.target.value)}
                placeholder="VD: Giày Thể Thao & Phụ Kiện"
                className="mt-1 h-8 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-[11px]">Nhãn nút lọc POS</Label>
              <Input
                value={catFormBadge}
                onChange={(e) => setCatFormBadge(e.target.value)}
                placeholder="VD: Giày Sneaker"
                className="mt-1 h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-[11px]">Đơn vị tính mặc định</Label>
              <Input
                value={catFormUnit}
                onChange={(e) => setCatFormUnit(e.target.value)}
                placeholder="Đôi / Chiếc / Hộp"
                className="mt-1 h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-[11px]">Trần chiết khấu (%)</Label>
              <Input
                type="number"
                value={catFormMaxDisc}
                onChange={(e) => setCatFormMaxDisc(Number(e.target.value))}
                className="mt-1 h-8 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <Label className="text-[11px]">Trục thuộc tính 1</Label>
              <Input
                value={catFormAxis1Name}
                onChange={(e) => setCatFormAxis1Name(e.target.value)}
                className="mt-1 h-8 text-xs"
              />
              <Input
                value={catFormAxis1Values}
                onChange={(e) => setCatFormAxis1Values(e.target.value)}
                placeholder="Giá trị mẫu cách nhau dấu phẩy"
                className="mt-1 h-7 text-[11px]"
              />
            </div>
            <div>
              <Label className="text-[11px]">Trục thuộc tính 2</Label>
              <Input
                value={catFormAxis2Name}
                onChange={(e) => setCatFormAxis2Name(e.target.value)}
                className="mt-1 h-8 text-xs"
              />
              <Input
                value={catFormAxis2Values}
                onChange={(e) => setCatFormAxis2Values(e.target.value)}
                placeholder="Giá trị mẫu cách nhau dấu phẩy"
                className="mt-1 h-7 text-[11px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-xl border border-border/50 flex items-center justify-between">
              <span>Bắt buộc quản lý Serial / IMEI</span>
              <Switch
                checked={catFormSerial}
                onCheckedChange={setCatFormSerial}
              />
            </div>
            <div className="p-2 rounded-xl border border-border/50 flex items-center justify-between">
              <span>Quản lý Lô & Hạn sử dụng FEFO</span>
              <Switch
                checked={catFormBatch}
                onCheckedChange={setCatFormBatch}
              />
            </div>
          </div>

          {/* Cấu hình Công cụ Tư vấn Thông số / Size Động cho Ngành hàng */}
          <div className="p-3 rounded-xl border border-border/60 bg-muted/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-primary">
                Bật Công Cụ Tư Vấn Thông Số / Size Động Trong In-Chat POS
              </span>
              <Switch
                checked={catFormEnableAdvisor}
                onCheckedChange={setCatFormEnableAdvisor}
              />
            </div>

            {catFormEnableAdvisor && (
              <>
                <div>
                  <Label className="text-[11px]">Tiêu đề khung tư vấn</Label>
                  <Input
                    value={catFormAdvisorTitle}
                    onChange={(e) => setCatFormAdvisorTitle(e.target.value)}
                    className="mt-1 h-8 text-xs"
                  />
                </div>

                {/* Danh sách Trường nhập liệu động (`advisorFields`) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[11px]">
                      Các trường thông số khách hàng cần nhập (
                      {catFormAdvisorFields.length})
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setCatFormAdvisorFields((prev) => [
                          ...prev,
                          {
                            fieldKey: `param_${prev.length + 1}`,
                            label: `Thông số ${prev.length + 1}`,
                            unit: "cm",
                            fieldType: "NUMBER",
                            defaultValue: 50,
                          },
                        ])
                      }
                      className="text-primary font-semibold hover:underline cursor-pointer"
                    >
                      + Thêm trường nhập
                    </button>
                  </div>

                  {catFormAdvisorFields.map((f, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-5 gap-1.5 items-center bg-background/60 p-1.5 rounded-lg border border-border/40"
                    >
                      <Input
                        value={f.fieldKey}
                        onChange={(e) =>
                          setCatFormAdvisorFields((prev) =>
                            prev.map((item, i) =>
                              i === idx
                                ? { ...item, fieldKey: e.target.value }
                                : item,
                            ),
                          )
                        }
                        placeholder="Mã (VD: heightCm)"
                        className="h-7 text-[11px] font-mono"
                      />
                      <Input
                        value={f.label}
                        onChange={(e) =>
                          setCatFormAdvisorFields((prev) =>
                            prev.map((item, i) =>
                              i === idx
                                ? { ...item, label: e.target.value }
                                : item,
                            ),
                          )
                        }
                        placeholder="Nhãn hiển thị"
                        className="h-7 text-[11px] col-span-2"
                      />
                      <Input
                        value={f.unit || ""}
                        onChange={(e) =>
                          setCatFormAdvisorFields((prev) =>
                            prev.map((item, i) =>
                              i === idx
                                ? { ...item, unit: e.target.value }
                                : item,
                            ),
                          )
                        }
                        placeholder="Đơn vị (cm/kg)"
                        className="h-7 text-[11px]"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setCatFormAdvisorFields((prev) =>
                            prev.filter((_, i) => i !== idx),
                          )
                        }
                        className="text-destructive text-[11px] hover:underline cursor-pointer"
                      >
                        Xóa
                      </button>
                    </div>
                  ))}
                </div>

                {/* Danh sách Quy tắc đối chiếu kết quả (`advisorRules`) */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[11px]">
                      Bảng quy tắc gợi ý Size / Phiên bản (
                      {catFormAdvisorRules.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const firstKey =
                          catFormAdvisorFields[0]?.fieldKey || "heightCm";
                        setCatFormAdvisorRules((prev) => [
                          ...prev,
                          {
                            ruleId: `RULE_${Date.now()}_${prev.length}`,
                            recommendedResultCode: "Size Chuẩn",
                            fitNote: "Gợi ý phù hợp với thông số khách",
                            numericRanges: {
                              [firstKey]: { min: 40, max: 60 },
                            },
                          },
                        ]);
                      }}
                      className="text-primary font-semibold hover:underline cursor-pointer"
                    >
                      + Thêm quy tắc gợi ý
                    </button>
                  </div>

                  {catFormAdvisorRules.map((r, rIdx) => (
                    <div
                      key={r.ruleId}
                      className="p-2 rounded-lg bg-background/60 border border-border/40 space-y-1.5"
                    >
                      <div className="grid grid-cols-4 gap-1.5 items-center">
                        <Input
                          value={r.recommendedResultCode}
                          onChange={(e) =>
                            setCatFormAdvisorRules((prev) =>
                              prev.map((item, i) =>
                                i === rIdx
                                  ? {
                                      ...item,
                                      recommendedResultCode: e.target.value,
                                    }
                                  : item,
                              ),
                            )
                          }
                          placeholder="Kết quả (VD: S, M, 39)"
                          className="h-7 text-[11px] font-bold"
                        />
                        <Input
                          value={r.fitNote}
                          onChange={(e) =>
                            setCatFormAdvisorRules((prev) =>
                              prev.map((item, i) =>
                                i === rIdx
                                  ? { ...item, fitNote: e.target.value }
                                  : item,
                              ),
                            )
                          }
                          placeholder="Ghi chú tư vấn cho Sale"
                          className="h-7 text-[11px] col-span-2"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setCatFormAdvisorRules((prev) =>
                              prev.filter((_, i) => i !== rIdx),
                            )
                          }
                          className="text-destructive text-[11px] hover:underline cursor-pointer text-right"
                        >
                          Xóa quy tắc
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
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
