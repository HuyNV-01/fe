"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ContentSelect,
  GlassAlert,
  GlassAvatar,
  GlassBadge,
  GlassModal,
  GlassEmptyState,
  GlassSurfaceCard,
  GlassTabs,
  ItemSelect,
  LiquidGlassInput,
  PatternButton,
  ScrollArea,
  TriggerSelect,
  TruncatedText,
} from "@/components/toolkit";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectValue } from "@/components/ui/select";
import { PermissionGate } from "@/components/iam/permission-gate";
import { useCrmStore } from "@/lib/stores/crm/use-crm-store";
import type {
  ICustomerCustomAttributeItem,
  PhoneTrustLookupSourceType,
  ShopBusinessCategoryType,
} from "@/types/crm";
import { PiiMaskedPhoneField } from "./pii-masked-phone-field";
import { ProvinceDistrictWardCombobox } from "./province-district-ward-combobox";
import { CustomerMergeModal } from "./customer-merge-modal";
import { LoyaltyWalletAdjustModal } from "./loyalty-wallet-adjust-modal";
import {
  AlertTriangle,
  Award,
  Ban,
  CheckCircle2,
  Coins,
  Database,
  ExternalLink,
  Flag,
  Gauge,
  GitMerge,
  Layers,
  Link2,
  MapPin,
  Package,
  Plus,
  RefreshCw,
  Ruler,
  Save,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UserCheck,
  UserPlus,
  Wallet,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import config from "@/config";

const INDUSTRY_PRESET_ATTRIBUTE_KEYS: Record<
  ShopBusinessCategoryType,
  Array<{ key: string; label: string; placeholder: string }>
> = {
  GENERAL_MULTI_CATEGORY: [
    {
      key: "nhom_san_pham_quan_tam",
      label: "Nhóm sản phẩm quan tâm",
      placeholder: "VD: Đồ gia dụng, Phụ kiện, Quà tặng...",
    },
    {
      key: "khung_gio_nhan_hang",
      label: "Khung giờ nhận hàng",
      placeholder: "VD: Giờ hành chính / Buổi tối",
    },
  ],
  FASHION_APPAREL: [
    {
      key: "phong_cach_mac",
      label: "Phong cách / Dáng đồ",
      placeholder: "VD: Công sở, Oversize, Thể thao...",
    },
    {
      key: "so_do_vong_eo",
      label: "Số đo 3 vòng / Lưu ý form",
      placeholder: "VD: Eo 68cm, thích mặc rộng...",
    },
  ],
  COSMETICS_BEAUTY: [
    {
      key: "loai_da",
      label: "Loại da / Tình trạng da",
      placeholder: "VD: Da dầu nhạy cảm, dễ kích ứng hương liệu...",
    },
    {
      key: "routine_hien_tai",
      label: "Routine đang dùng",
      placeholder: "VD: BHA 2%, Retinol 0.5%, Kem chống nắng...",
    },
  ],
  ELECTRONICS_TECH: [
    {
      key: "thiet_bi_dang_dung",
      label: "Thiết bị / Hệ sinh thái",
      placeholder: "VD: iPhone 16 Pro Max, MacBook M3...",
    },
    {
      key: "han_bao_hanh_serial",
      label: "Ghi chú Bảo hành / Serial",
      placeholder: "VD: Bảo hành VIP 12 tháng 1 đổi 1...",
    },
  ],
  FOOD_BEVERAGE: [
    {
      key: "khau_vi_di_ung",
      label: "Khẩu vị / Dị ứng thực phẩm",
      placeholder: "VD: Ít ngọt, không ăn cay, dị ứng đậu phộng...",
    },
    {
      key: "ung_dung_giao_nhanh",
      label: "Lưu ý bảo quản lạnh / Giao hỏa tốc",
      placeholder: "VD: Cần giao GrabExpress trước 11h trưa...",
    },
  ],
  MOTHER_AND_BABY: [
    {
      key: "do_tuoi_can_nang_be",
      label: "Tháng tuổi & Cân nặng của bé",
      placeholder: "VD: Bé trai 14 tháng, 10.5kg...",
    },
    {
      key: "dong_bim_sua_quen_dung",
      label: "Dòng bỉm / Sữa đang dùng",
      placeholder: "VD: Bỉm quần size L, Sữa công thức số 2...",
    },
  ],
};

export interface Customer360PanelProps {
  shopId: string;
  conversationId?: string;
  customerId?: string | null;
  fallbackDisplayName?: string;
  fallbackAvatarUrl?: string | null;
  onMaskedVoipCall?: (maskedPhone?: string) => void;
}

export function Customer360Panel({
  shopId,
  conversationId,
  customerId,
  fallbackDisplayName,
  fallbackAvatarUrl,
  onMaskedVoipCall,
}: Customer360PanelProps) {
  const t = useTranslations("Crm360.panel");
  const {
    administrativeTree,
    shopCrmConfig,
    customers,
    customer360ByConv,
    activeCustomerDetail,
    fetchAdministrativeTree,
    fetchShopCrmConfig,
    updateShopCrmConfig,
    fetchCustomers,
    fetchCustomer360ByConversation,
    fetchCustomer360Detail,
    saveCustomerProfile,
    lookupCustomerTrustFromSources,
    reportCustomerPhoneAbuse,
    toggleCustomerBlacklist,
    overrideTrustScore,
    recordOrderDeliveredAndAwardPoints,
  } = useCrmStore();

  const convBundle = conversationId
    ? customer360ByConv[conversationId]
    : undefined;
  const resolvedBundle = convBundle?.customer
    ? convBundle
    : customerId && activeCustomerDetail?.customer?.id === customerId
      ? activeCustomerDetail
      : undefined;

  const customer =
    resolvedBundle?.customer ||
    (customerId ? customers.find((c) => c.id === customerId) || null : null);
  const walletLedgers = resolvedBundle?.walletLedgers || [];

  const [activeTab, setActiveTab] = useState<
    "PROFILE" | "ORDERS" | "WALLET" | "CHANNELS"
  >("PROFILE");

  const [fullName, setFullName] = useState("");
  const [rawPhoneInput, setRawPhoneInput] = useState("");
  const [provinceCode, setProvinceCode] = useState<string | null>(null);
  const [districtCode, setDistrictCode] = useState<string | null>(null);
  const [wardCode, setWardCode] = useState<string | null>(null);
  const [addressLine, setAddressLine] = useState("");
  const [industryCategory, setIndustryCategory] =
    useState<ShopBusinessCategoryType>("GENERAL_MULTI_CATEGORY");
  const [showApparelMeasurements, setShowApparelMeasurements] = useState(false);
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [preferredSize, setPreferredSize] = useState("");
  const [customAttributes, setCustomAttributes] = useState<
    ICustomerCustomAttributeItem[]
  >([]);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshingTrust, setIsRefreshingTrust] = useState(false);

  const [isMergeOpen, setIsMergeOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isReportAbuseOpen, setIsReportAbuseOpen] = useState(false);
  const [isCrmConfigOpen, setIsCrmConfigOpen] = useState(false);
  const [isOverrideTrustOpen, setIsOverrideTrustOpen] = useState(false);
  const [isRecordOrderOpen, setIsRecordOrderOpen] = useState(false);

  // State cho Modal Báo xấu SĐT / Bom hàng
  const [reportReasonCode, setReportReasonCode] = useState<
    | "BOM_HANG"
    | "BOOM_AO_SPAM"
    | "TU_CHOI_NHAN_NHIEU_LAN"
    | "SAI_SO_DIEN_THOAI"
    | "OTHER"
  >("BOM_HANG");
  const [reportReasonNote, setReportReasonNote] = useState("");
  const [reportCarrierCode, setReportCarrierCode] = useState("GHN");
  const [reportOrderCode, setReportOrderCode] = useState("");
  const [reportMarkBlacklisted, setReportMarkBlacklisted] = useState(true);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // State cho Modal Ghi đè Điểm uy tín nhận hàng (CRM_TRUST_SCORE_OVERRIDE)
  const [overrideScoreValue, setOverrideScoreValue] = useState("85");
  const [overrideReason, setOverrideReason] = useState("");
  const [isSubmittingOverride, setIsSubmittingOverride] = useState(false);

  // State cho Modal Ghi nhận Đơn giao thành công & Tích điểm tự động (F11.4)
  const [deliveredOrderCode, setDeliveredOrderCode] = useState("");
  const [deliveredOrderAmount, setDeliveredOrderAmount] = useState("650000");
  const [deliveredCarrierCode, setDeliveredCarrierCode] = useState("GHN");
  const [deliveredExtraCredit, setDeliveredExtraCredit] = useState("0");
  const [isSubmittingDeliveredOrder, setIsSubmittingDeliveredOrder] =
    useState(false);

  // State cho Modal Cấu hình Nguồn dữ liệu Tra cứu Uy tín SĐT & Ngành hàng Shop
  const [cfgBusinessCategory, setCfgBusinessCategory] =
    useState<ShopBusinessCategoryType>("GENERAL_MULTI_CATEGORY");
  const [cfgShowApparel, setCfgShowApparel] = useState(false);
  const [cfgEnableCommunity, setCfgEnableCommunity] = useState(true);
  const [cfgEnableCarrier3pl, setCfgEnableCarrier3pl] = useState(true);
  const [cfgCustomWebhookUrl, setCfgCustomWebhookUrl] = useState("");
  const [cfgCustomApiKey, setCfgCustomApiKey] = useState("");
  const [cfgAutoMaskPhone, setCfgAutoMaskPhone] = useState(true);
  const [cfgAutoExtractNer, setCfgAutoExtractNer] = useState(true);
  const [isSavingCfg, setIsSavingCfg] = useState(false);

  useEffect(() => {
    if (!shopId) return;
    fetchAdministrativeTree(shopId);
    fetchShopCrmConfig(shopId);
    if (conversationId && !conversationId.startsWith("detail_")) {
      fetchCustomer360ByConversation(shopId, conversationId);
    }
    if (customerId) {
      fetchCustomer360Detail(shopId, customerId);
    }
    if (customers.length === 0) {
      fetchCustomers({ shopId, page: 1, limit: 25 });
    }
  }, [
    shopId,
    conversationId,
    customerId,
    customers.length,
    fetchAdministrativeTree,
    fetchShopCrmConfig,
    fetchCustomer360ByConversation,
    fetchCustomer360Detail,
    fetchCustomers,
  ]);

  useEffect(() => {
    if (shopCrmConfig) {
      setCfgBusinessCategory(shopCrmConfig.businessCategory);
      setCfgShowApparel(
        Boolean(shopCrmConfig.showApparelMeasurementsInProfile),
      );
      setCfgEnableCommunity(
        Boolean(
          shopCrmConfig.enableCommunityTrustLookup ??
            shopCrmConfig.usePancakeCommunityNetwork ??
            true,
        ),
      );
      setCfgEnableCarrier3pl(
        Boolean(
          shopCrmConfig.enableCarrier3plTrustLookup ??
            shopCrmConfig.useCarrier3plLookup ??
            true,
        ),
      );
      setCfgCustomWebhookUrl(shopCrmConfig.customLookupWebhookUrl || "");
      setCfgAutoMaskPhone(
        Boolean(
          shopCrmConfig.autoMaskPhoneInChatMessages ??
            shopCrmConfig.autoMaskBuyerPhoneInChat ??
            true,
        ),
      );
      setCfgAutoExtractNer(
        Boolean(
          shopCrmConfig.autoExtractPhoneAndAddressInChat ??
            shopCrmConfig.autoExtractAddressFromChat ??
            true,
        ),
      );
    }
  }, [shopCrmConfig]);

  useEffect(() => {
    if (customer) {
      setFullName(customer.fullName || fallbackDisplayName || "");
      setProvinceCode(customer.defaultProvinceCode || null);
      setDistrictCode(customer.defaultDistrictCode || null);
      setWardCode(customer.defaultWardCode || null);
      setAddressLine(customer.defaultAddressLine || "");
      const resolvedIndustry =
        customer.industryCategory ||
        shopCrmConfig?.businessCategory ||
        "GENERAL_MULTI_CATEGORY";
      setIndustryCategory(resolvedIndustry);
      const hasExistingBodyStats = Boolean(
        customer.heightCm || customer.weightKg || customer.preferredSize,
      );
      setShowApparelMeasurements(
        resolvedIndustry === "FASHION_APPAREL" ||
          Boolean(shopCrmConfig?.showApparelMeasurementsInProfile) ||
          hasExistingBodyStats,
      );
      setHeightCm(customer.heightCm ? String(customer.heightCm) : "");
      setWeightKg(customer.weightKg ? String(customer.weightKg) : "");
      setPreferredSize(customer.preferredSize || "");
      setCustomAttributes(
        Array.isArray(customer.customAttributesJson)
          ? customer.customAttributesJson
          : [],
      );
      setNotes(customer.notes || "");
      setOverrideScoreValue(
        String(
          customer.trustEvaluation?.score ?? customer.deliveryTrustScore ?? 80,
        ),
      );
    } else if (fallbackDisplayName) {
      setFullName(fallbackDisplayName);
    }
  }, [customer, fallbackDisplayName, shopCrmConfig]);

  const presetAttributesForIndustry = useMemo(
    () =>
      INDUSTRY_PRESET_ATTRIBUTE_KEYS[industryCategory] ||
      INDUSTRY_PRESET_ATTRIBUTE_KEYS.GENERAL_MULTI_CATEGORY,
    [industryCategory],
  );

  const handleAddPresetOrCustomAttribute = (preset?: {
    key: string;
    label: string;
  }) => {
    setCustomAttributes((prev) => {
      if (preset && prev.some((item) => item.key === preset.key)) {
        return prev;
      }
      return [
        ...prev,
        {
          key: preset?.key || `attr_${Date.now().toString().slice(-4)}`,
          label: preset?.label || t("customAttrDefaultLabel"),
          value: "",
        },
      ];
    });
  };

  const handleUpdateCustomAttribute = (
    idx: number,
    patch: Partial<ICustomerCustomAttributeItem>,
  ) => {
    setCustomAttributes((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, ...patch } : item)),
    );
  };

  const handleRemoveCustomAttribute = (idx: number) => {
    setCustomAttributes((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCreateInitialProfile = async () => {
    if (!shopId) return;
    setIsSaving(true);
    await saveCustomerProfile({
      shopId,
      fullName: (fullName || fallbackDisplayName || "Khách hàng").trim(),
      rawPhone: rawPhoneInput.trim() || undefined,
      industryCategory,
      conversationId:
        conversationId && !conversationId.startsWith("detail_")
          ? conversationId
          : undefined,
    });
    setRawPhoneInput("");
    setIsSaving(false);
  };

  if (!customer) {
    return (
      <GlassSurfaceCard className="p-4">
        <GlassEmptyState
          icon={<UserPlus className="w-6 h-6" />}
          title={t("emptyTitle")}
          description={t("emptyDesc")}
          action={
            <PermissionGate can="CRM_CUSTOMER_PROFILE_EDIT" mode="hide">
              <PatternButton
                type="button"
                size="sm"
                variant="solid"
                color="primary"
                rounded="full"
                isLoading={isSaving}
                icon={<UserPlus className="w-3.5 h-3.5" />}
                onClick={handleCreateInitialProfile}
              >
                {t("createFromChatBtn")}
              </PatternButton>
            </PermissionGate>
          }
        />
      </GlassSurfaceCard>
    );
  }

  const trust = customer.trustEvaluation;
  const totalDelivered =
    trust?.totalDeliveredCount ??
    Number(customer.successfulDeliveriesCount || 0) +
      Number(customer.networkDeliveredCount || 0);
  const totalReturned =
    trust?.totalReturnedCount ??
    Number(customer.returnedOrdersCount || 0) +
      Number(customer.networkReturnedCount || 0);
  const totalReported =
    trust?.reportedCount ?? Number(customer.reportedCount || 0);
  const returnRatePercent =
    trust?.returnRatePercent ??
    (totalDelivered + totalReturned > 0
      ? Math.round((totalReturned * 100) / (totalDelivered + totalReturned))
      : 0);

  const isHighRiskRed =
    trust?.band === "HIGH_RISK_RED" ||
    customer.isBlacklisted ||
    totalReported > 0;

  const handleSaveProfile = async () => {
    setIsSaving(true);
    const cleanedCustomAttrs = customAttributes
      .map((item) => ({
        key:
          item.key.trim() ||
          item.label.trim().toLowerCase().replace(/\s+/g, "_"),
        label: item.label.trim(),
        value: item.value.trim(),
      }))
      .filter((item) => item.label && item.value);

    await saveCustomerProfile({
      shopId,
      customerId: customer.id,
      fullName: fullName.trim() || customer.fullName,
      rawPhone: rawPhoneInput.trim() || undefined,
      defaultProvinceCode: provinceCode || undefined,
      defaultDistrictCode: districtCode || undefined,
      defaultWardCode: wardCode || undefined,
      defaultAddressLine: addressLine.trim() || undefined,
      industryCategory,
      heightCm:
        showApparelMeasurements && heightCm ? Number(heightCm) : undefined,
      weightKg:
        showApparelMeasurements && weightKg ? Number(weightKg) : undefined,
      preferredSize:
        showApparelMeasurements && preferredSize.trim()
          ? preferredSize.trim()
          : undefined,
      customAttributesJson: cleanedCustomAttrs,
      notes: notes.trim() || undefined,
      conversationId:
        conversationId && !conversationId.startsWith("detail_")
          ? conversationId
          : undefined,
    });
    setRawPhoneInput("");
    setIsSaving(false);
  };

  const handleRefreshTrustFromSources = async () => {
    setIsRefreshingTrust(true);
    await lookupCustomerTrustFromSources({
      shopId,
      customerId: customer.id,
      conversationId,
    });
    setIsRefreshingTrust(false);
  };

  const handleSubmitAbuseReport = async () => {
    if (!reportReasonNote.trim()) return;
    setIsSubmittingReport(true);
    const res = await reportCustomerPhoneAbuse({
      shopId,
      customerId: customer.id,
      reasonCode: reportReasonCode,
      reasonNote: reportReasonNote.trim(),
      carrierCode: reportCarrierCode.trim() || undefined,
      orderCode: reportOrderCode.trim() || undefined,
      markBlacklisted: reportMarkBlacklisted,
      conversationId,
    });
    setIsSubmittingReport(false);
    if (res) {
      setReportReasonNote("");
      setReportOrderCode("");
      setIsReportAbuseOpen(false);
    }
  };

  const handleSubmitOverrideTrust = async () => {
    const numScore = Number(overrideScoreValue);
    if (
      !Number.isFinite(numScore) ||
      numScore < 0 ||
      numScore > 100 ||
      !overrideReason.trim()
    ) {
      return;
    }
    setIsSubmittingOverride(true);
    const ok = await overrideTrustScore({
      shopId,
      customerId: customer.id,
      deliveryTrustScore: Math.round(numScore),
      reason: overrideReason.trim(),
      conversationId,
    });
    setIsSubmittingOverride(false);
    if (ok) {
      setOverrideReason("");
      setIsOverrideTrustOpen(false);
    }
  };

  const handleSubmitDeliveredOrder = async () => {
    const amt = Number(deliveredOrderAmount);
    if (!deliveredOrderCode.trim() || !Number.isFinite(amt) || amt <= 0) {
      return;
    }
    setIsSubmittingDeliveredOrder(true);
    const ok = await recordOrderDeliveredAndAwardPoints({
      shopId,
      customerId: customer.id,
      orderCode: deliveredOrderCode.trim(),
      orderTotalAmount: amt,
      carrierCode: deliveredCarrierCode.trim() || "GHN",
      overpaymentOrRmaCreditAmount:
        Number(deliveredExtraCredit) > 0
          ? Number(deliveredExtraCredit)
          : undefined,
      conversationId,
    });
    setIsSubmittingDeliveredOrder(false);
    if (ok) {
      setDeliveredOrderCode("");
      setDeliveredExtraCredit("0");
      setIsRecordOrderOpen(false);
    }
  };

  const handleSaveShopCrmConfig = async () => {
    setIsSavingCfg(true);
    const enabledSources: PhoneTrustLookupSourceType[] = ["INTERNAL_POS"];
    if (cfgEnableCommunity) enabledSources.push("PANCAKE_COMMUNITY");
    if (cfgEnableCarrier3pl) enabledSources.push("CARRIER_3PL");
    if (cfgCustomWebhookUrl.trim()) enabledSources.push("CUSTOM_WEBHOOK");

    const updated = await updateShopCrmConfig({
      shopId,
      businessCategory: cfgBusinessCategory,
      showApparelMeasurementsInProfile:
        cfgBusinessCategory === "FASHION_APPAREL" ? true : cfgShowApparel,
      enableCommunityTrustLookup: cfgEnableCommunity,
      enableCarrier3plTrustLookup: cfgEnableCarrier3pl,
      enabledLookupSources: enabledSources,
      customLookupWebhookUrl: cfgCustomWebhookUrl.trim(),
      customLookupApiKey: cfgCustomApiKey.trim() || undefined,
      autoMaskPhoneInChatMessages: cfgAutoMaskPhone,
      autoExtractPhoneAndAddressInChat: cfgAutoExtractNer,
    });
    setIsSavingCfg(false);
    if (updated) {
      setIndustryCategory(updated.businessCategory);
      setShowApparelMeasurements(
        updated.businessCategory === "FASHION_APPAREL" ||
          updated.showApparelMeasurementsInProfile,
      );
      setCfgCustomApiKey("");
      setIsCrmConfigOpen(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Hộp cảnh báo đỏ HIGH_RISK_RED theo đúng đặc tả F04.3 */}
      {isHighRiskRed && (
        <GlassAlert
          variant="danger"
          title={trust?.headline || t("highRiskAlertTitle")}
          description={trust?.recommendation || t("highRiskAlertDesc")}
          icon={<ShieldAlert className="w-4 h-4 text-red-500" />}
        />
      )}

      {/* Thẻ Định danh 360° & Hạng thành viên / RFM */}
      <GlassSurfaceCard className="p-3 space-y-3">
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <GlassAvatar
              src={customer.avatarUrl || fallbackAvatarUrl}
              name={customer.fullName || fallbackDisplayName || "Khách hàng"}
              size="md"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-sm font-bold text-foreground truncate">
                  {customer.fullName}
                </h3>
                <GlassBadge
                  variant={
                    customer.tier === "VIP"
                      ? "accent"
                      : customer.tier === "GOLD"
                        ? "warning"
                        : customer.tier === "BLACKLIST"
                          ? "danger"
                          : "primary"
                  }
                  size="sm"
                >
                  <Award className="w-2.5 h-2.5 mr-0.5 inline" />
                  {customer.tier}
                </GlassBadge>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5 flex-wrap">
                <span className="font-mono">{customer.code}</span>
                <span>•</span>
                <GlassBadge variant="info" size="sm">
                  RFM: {customer.rfmSegmentCode} ({customer.rfmScoreR}-
                  {customer.rfmScoreF}-{customer.rfmScoreM})
                </GlassBadge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <PatternButton
              type="button"
              size="sm"
              variant="ghost"
              rounded="full"
              className="h-7 px-2 text-[11px]"
              icon={<Settings2 className="w-3.5 h-3.5" />}
              onClick={() => setIsCrmConfigOpen(true)}
              title={t("crmConfigBtnTooltip")}
            >
              {t("crmConfigBtnShort")}
            </PatternButton>
            <Link
              href={config.routes.private.customerDetail(customer.id)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline shrink-0"
            >
              <span>360°</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* SĐT bảo mật PII Vault + Mở khóa 15 giây */}
        <PiiMaskedPhoneField
          shopId={shopId}
          customerId={customer.id}
          phoneMasked={customer.phoneMasked}
          conversationId={conversationId}
          onMaskedCall={() =>
            onMaskedVoipCall?.(customer.phoneMasked || "098***678")
          }
        />

        {/* Bảng Chỉ số Nhận / Hoàn / Bị báo cáo đa nguồn (POS + Cộng đồng Pancake + 3PL GHN/GHTK/VTP/J&T) */}
        <div className="rounded-2xl border border-border/60 bg-muted/30 p-3 space-y-2.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              {trust?.band === "HIGH_RISK_RED" || totalReported > 0 ? (
                <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
              ) : trust?.band === "TRUSTED_GREEN" ? (
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              )}
              <span className="text-xs font-bold text-foreground">
                {trust?.headline || t("reputationTitle")} (
                {trust?.score ?? customer.deliveryTrustScore ?? 75}/100)
              </span>
            </div>

            <div className="flex items-center gap-1 flex-wrap">
              <PatternButton
                type="button"
                size="sm"
                variant="glass"
                color="info"
                rounded="full"
                isLoading={isRefreshingTrust}
                className="h-6 px-2 text-[10px]"
                icon={<RefreshCw className="w-3 h-3" />}
                onClick={handleRefreshTrustFromSources}
              >
                {t("refreshTrustLookupBtn")}
              </PatternButton>

              <PermissionGate can="CRM_TRUST_SCORE_OVERRIDE" mode="hide">
                <PatternButton
                  type="button"
                  size="sm"
                  variant="ghost"
                  rounded="full"
                  className="h-6 px-2 text-[10px]"
                  icon={<Gauge className="w-3 h-3" />}
                  onClick={() => setIsOverrideTrustOpen(true)}
                >
                  {t("overrideTrustScoreBtn")}
                </PatternButton>
              </PermissionGate>

              <PatternButton
                type="button"
                size="sm"
                variant="outline"
                color="danger"
                rounded="full"
                className="h-6 px-2 text-[10px]"
                icon={<Flag className="w-3 h-3" />}
                onClick={() => setIsReportAbuseOpen(true)}
              >
                {t("reportAbuseBtn")}
              </PatternButton>
            </div>
          </div>

          {/* 3 Ô chỉ số cốt lõi: ĐÃ NHẬN | ĐÃ HOÀN | BỊ BÁO CÁO */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
              <p className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
                {t("deliveredCountLabel")}
              </p>
              <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {totalDelivered} {t("ordersUnit")}
              </p>
              <p className="text-[9px] text-muted-foreground">
                Shop: {customer.successfulDeliveriesCount || 0} • 3PL:{" "}
                {customer.networkDeliveredCount || 0}
              </p>
            </div>

            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center">
              <p className="text-[10px] font-medium text-amber-700 dark:text-amber-300">
                {t("returnedCountLabel")}
              </p>
              <p className="text-sm font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
                {totalReturned} ({returnRatePercent}%)
              </p>
              <p className="text-[9px] text-muted-foreground">
                Shop: {customer.returnedOrdersCount || 0} • 3PL:{" "}
                {customer.networkReturnedCount || 0}
              </p>
            </div>

            <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/30 text-center">
              <p className="text-[10px] font-medium text-red-700 dark:text-red-300">
                {t("reportedCountLabel")}
              </p>
              <p className="text-sm font-extrabold text-red-600 dark:text-red-400 tabular-nums">
                {totalReported} {t("reportsUnit")}
              </p>
              <p className="text-[9px] text-muted-foreground">
                {totalReported > 0
                  ? t("reportedWarningSub")
                  : t("cleanReportSub")}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground pt-0.5 flex-wrap">
            <span className="inline-flex items-center gap-1 truncate">
              <Database className="w-3 h-3 text-primary shrink-0" />
              <span className="truncate">
                {t("lookupSourcePrefix")}:{" "}
                <strong className="text-foreground">
                  {trust?.lookupSourceLabel || t("defaultLookupSourceLabel")}
                </strong>
              </span>
            </span>
            {trust?.requireDepositVietQr && (
              <GlassBadge variant="danger" size="sm" pulse>
                {t("requireVietQrDepositBadge")}
              </GlassBadge>
            )}
          </div>

          {trust?.recommendation && (
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {trust.recommendation}
            </p>
          )}

          {/* Hiển thị danh sách lý do bị báo xấu gần nhất nếu có */}
          {Array.isArray(customer.reportedReasonsJson) &&
            customer.reportedReasonsJson.length > 0 && (
              <div className="space-y-1 pt-1 border-t border-border/40">
                <p className="text-[10px] font-semibold text-red-600 dark:text-red-400">
                  {t("recentAbuseReportsHeading")} (
                  {customer.reportedReasonsJson.length}):
                </p>
                {customer.reportedReasonsJson.slice(0, 2).map((rep) => (
                  <div
                    key={rep.reportId}
                    className="text-[10px] px-2 py-1 rounded-lg bg-red-500/10 text-red-700 dark:text-red-300 flex items-center justify-between gap-2"
                  >
                    <span className="truncate">
                      • [{rep.reasonCode || rep.source || "REPORT"}]{" "}
                      {rep.reasonNote || rep.reason}
                    </span>
                    {rep.carrierCode && (
                      <span className="font-mono shrink-0">
                        {rep.carrierCode}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
        </div>

        {/* Chỉ số LTV, Điểm thưởng & Ví tiền thừa (F11.4) */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="p-2 rounded-xl bg-muted/40 border border-border/50 text-center">
            <p className="text-[10px] text-muted-foreground">{t("ltvLabel")}</p>
            <p className="text-xs font-bold text-foreground tabular-nums">
              {Number(customer.lifetimeValueAmount || 0).toLocaleString(
                "vi-VN",
              )}
              đ
            </p>
          </div>
          <div className="p-2 rounded-xl bg-muted/40 border border-border/50 text-center">
            <p className="text-[10px] text-muted-foreground">
              {t("loyaltyPointsLabel")}
            </p>
            <p className="text-xs font-bold text-amber-600 dark:text-amber-400 tabular-nums">
              {Number(customer.loyaltyPointsBalance || 0).toLocaleString(
                "vi-VN",
              )}{" "}
              pts
            </p>
          </div>
          <div className="p-2 rounded-xl bg-muted/40 border border-border/50 text-center">
            <p className="text-[10px] text-muted-foreground">
              {t("walletCreditLabel")}
            </p>
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {Number(customer.walletCreditBalance || 0).toLocaleString(
                "vi-VN",
              )}
              đ
            </p>
          </div>
        </div>
      </GlassSurfaceCard>

      {/* Tabs chuyển đổi: Hồ sơ & Địa chỉ | Đơn hàng | Ví & Điểm | Kênh liên kết */}
      <GlassTabs
        fullWidth
        size="sm"
        value={activeTab}
        onValueChange={setActiveTab}
        items={[
          {
            key: "PROFILE",
            label: t("tabs.profile"),
            icon: <MapPin className="w-3.5 h-3.5" />,
          },
          {
            key: "ORDERS",
            label: t("tabs.orders"),
            icon: <Package className="w-3.5 h-3.5" />,
            badge: (customer.recentOrdersSnapshotJson || []).length,
          },
          {
            key: "WALLET",
            label: t("tabs.wallet"),
            icon: <Wallet className="w-3.5 h-3.5" />,
          },
          {
            key: "CHANNELS",
            label: t("tabs.channels"),
            icon: <Link2 className="w-3.5 h-3.5" />,
            badge: (customer.linkedExternalIdentitiesJson || []).length,
          },
        ]}
      />

      <ScrollArea className="flex-1 min-h-0 pr-1">
        {activeTab === "PROFILE" && (
          <GlassSurfaceCard className="p-3 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold">
                  {t("fullNameLabel")}
                </Label>
                <LiquidGlassInput className="p-0 overflow-hidden">
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-full text-xs bg-transparent! border-none shadow-none focus-visible:ring-0 px-2.5"
                  />
                </LiquidGlassInput>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-semibold">
                  {t("updateRawPhoneLabel")}
                </Label>
                <LiquidGlassInput className="p-0 overflow-hidden">
                  <Input
                    value={rawPhoneInput}
                    onChange={(e) => setRawPhoneInput(e.target.value)}
                    placeholder={t("updateRawPhonePlaceholder")}
                    className="h-full text-xs bg-transparent! border-none shadow-none focus-visible:ring-0 px-2.5"
                  />
                </LiquidGlassInput>
              </div>
            </div>

            <div className="space-y-1.5 mt-1.5">
              <Label className="text-[11px] font-semibold">
                {t("threeTierAddressLabel")}
              </Label>
              <ProvinceDistrictWardCombobox
                administrativeTree={administrativeTree}
                provinceCode={provinceCode}
                districtCode={districtCode}
                wardCode={wardCode}
                onChange={(val) => {
                  setProvinceCode(val.provinceCode);
                  setDistrictCode(val.districtCode);
                  setWardCode(val.wardCode);
                }}
              />
              <LiquidGlassInput className="p-0 overflow-hidden mt-2.5">
                <Input
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  placeholder={t("streetAddressPlaceholder")}
                  className="h-full text-xs bg-transparent! border-none shadow-none focus-visible:ring-0 px-2.5"
                />
              </LiquidGlassInput>
            </div>

            {/* Bộ chọn Ngành hàng sản phẩm & Nút bật/tắt thông số Chiều cao / Cân nặng / Size quần áo */}
            <div className="rounded-xl border border-border/60 bg-muted/25 p-2.5 space-y-2.5 mt-1.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <Label className="text-[11px] font-semibold inline-flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-primary" />
                  <span>{t("industryCategoryLabel")}</span>
                </Label>

                <button
                  type="button"
                  onClick={() => setShowApparelMeasurements((v) => !v)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                >
                  <Ruler className="w-3 h-3" />
                  <span>
                    {showApparelMeasurements
                      ? t("hideApparelMeasurementsBtn")
                      : t("showApparelMeasurementsBtn")}
                  </span>
                </button>
              </div>

              <Select
                value={industryCategory}
                onValueChange={(val) => {
                  const nextCat = val as ShopBusinessCategoryType;
                  setIndustryCategory(nextCat);
                  setShowApparelMeasurements(nextCat === "FASHION_APPAREL");
                }}
              >
                <TriggerSelect className="w-full h-8 text-xs justify-between">
                  <TruncatedText className="max-w-64">
                    <SelectValue placeholder={t("industryCategoryLabel")} />
                  </TruncatedText>
                </TriggerSelect>
                <ContentSelect>
                  <ItemSelect value="GENERAL_MULTI_CATEGORY">
                    {t("industries.GENERAL_MULTI_CATEGORY")}
                  </ItemSelect>
                  <ItemSelect value="FASHION_APPAREL">
                    {t("industries.FASHION_APPAREL")}
                  </ItemSelect>
                  <ItemSelect value="COSMETICS_BEAUTY">
                    {t("industries.COSMETICS_BEAUTY")}
                  </ItemSelect>
                  <ItemSelect value="ELECTRONICS_TECH">
                    {t("industries.ELECTRONICS_TECH")}
                  </ItemSelect>
                  <ItemSelect value="FOOD_BEVERAGE">
                    {t("industries.FOOD_BEVERAGE")}
                  </ItemSelect>
                  <ItemSelect value="MOTHER_AND_BABY">
                    {t("industries.MOTHER_AND_BABY")}
                  </ItemSelect>
                </ContentSelect>
              </Select>

              {/* Chỉ hiển thị Chiều cao / Cân nặng / Size khi bán Thời trang hoặc khi người bán chủ động bật */}
              {showApparelMeasurements && (
                <div className="grid grid-cols-3 gap-2 pt-1 animate-in fade-in duration-150">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold inline-flex items-center gap-1">
                      <Ruler className="w-3 h-3" />
                      <span>{t("heightCmLabel")}</span>
                    </Label>
                    <LiquidGlassInput className="p-0 overflow-hidden">
                      <Input
                        type="number"
                        value={heightCm}
                        onChange={(e) => setHeightCm(e.target.value)}
                        placeholder="160"
                        className="h-full text-xs bg-transparent! border-none shadow-none focus-visible:ring-0 px-2.5"
                      />
                    </LiquidGlassInput>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">
                      {t("weightKgLabel")}
                    </Label>
                    <LiquidGlassInput className="p-0 overflow-hidden">
                      <Input
                        type="number"
                        value={weightKg}
                        onChange={(e) => setWeightKg(e.target.value)}
                        placeholder="52"
                        className="h-full text-xs bg-transparent! border-none shadow-none focus-visible:ring-0 px-2.5"
                      />
                    </LiquidGlassInput>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">
                      {t("preferredSizeLabel")}
                    </Label>
                    <LiquidGlassInput className="p-0 overflow-hidden">
                      <Input
                        value={preferredSize}
                        onChange={(e) => setPreferredSize(e.target.value)}
                        placeholder="S / M / L"
                        className="h-full text-xs bg-transparent! border-none shadow-none focus-visible:ring-0 px-2.5"
                      />
                    </LiquidGlassInput>
                  </div>
                </div>
              )}

              {/* Thuộc tính hồ sơ tùy biến linh hoạt cho đa ngành hàng */}
              <div className="space-y-2 pt-1 border-t border-border/40">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {t("customAttributesHeading")}
                  </span>
                  <div className="flex items-center gap-1 flex-wrap">
                    {presetAttributesForIndustry.map((preset) => (
                      <button
                        key={preset.key}
                        type="button"
                        onClick={() => handleAddPresetOrCustomAttribute(preset)}
                        className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                      >
                        + {preset.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleAddPresetOrCustomAttribute()}
                      className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-foreground hover:bg-muted/80 cursor-pointer"
                    >
                      <Plus className="w-2.5 h-2.5" />
                      <span>{t("addCustomAttrBtn")}</span>
                    </button>
                  </div>
                </div>

                {customAttributes.length > 0 && (
                  <div className="space-y-1.5">
                    {customAttributes.map((attr, idx) => (
                      <div
                        key={`${attr.key}-${idx}`}
                        className="grid grid-cols-12 gap-1.5 items-center"
                      >
                        <div className="col-span-5">
                          <LiquidGlassInput className="p-0 overflow-hidden">
                            <Input
                              value={attr.label}
                              onChange={(e) =>
                                handleUpdateCustomAttribute(idx, {
                                  label: e.target.value,
                                })
                              }
                              placeholder={t("customAttrLabelPlaceholder")}
                              className="h-full text-[11px] bg-transparent! border-none shadow-none focus-visible:ring-0 px-2"
                            />
                          </LiquidGlassInput>
                        </div>
                        <div className="col-span-6">
                          <LiquidGlassInput className="p-0 overflow-hidden">
                            <Input
                              value={attr.value}
                              onChange={(e) =>
                                handleUpdateCustomAttribute(idx, {
                                  value: e.target.value,
                                })
                              }
                              placeholder={t("customAttrValuePlaceholder")}
                              className="h-full text-[11px] bg-transparent! border-none shadow-none focus-visible:ring-0 px-2"
                            />
                          </LiquidGlassInput>
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomAttribute(idx)}
                            className="p-1 rounded-lg text-muted-foreground hover:text-destructive cursor-pointer"
                            title={t("removeCustomAttrTooltip")}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1 mt-1.5">
              <Label className="text-[11px] font-semibold">
                {t("notesLabel")}
              </Label>
              <LiquidGlassInput className="p-0 overflow-hidden">
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("notesPlaceholder")}
                  className="h-full text-xs bg-transparent! border-none shadow-none focus-visible:ring-0 px-2.5"
                />
              </LiquidGlassInput>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <PermissionGate can="CRM_CUSTOMER_MERGE_DUPLICATE" mode="hide">
                  <PatternButton
                    type="button"
                    size="sm"
                    variant="outline"
                    rounded="full"
                    className="h-8 text-xs"
                    icon={<GitMerge className="w-3.5 h-3.5" />}
                    onClick={() => setIsMergeOpen(true)}
                  >
                    {t("mergeDuplicateBtn")}
                  </PatternButton>
                </PermissionGate>

                <PermissionGate can="CRM_CUSTOMER_BLACKLIST_TOGGLE" mode="hide">
                  <PatternButton
                    type="button"
                    size="sm"
                    variant="outline"
                    color={customer.isBlacklisted ? "success" : "danger"}
                    rounded="full"
                    className="h-8 text-xs"
                    icon={
                      customer.isBlacklisted ? (
                        <UserCheck className="w-3.5 h-3.5" />
                      ) : (
                        <Ban className="w-3.5 h-3.5" />
                      )
                    }
                    onClick={() =>
                      toggleCustomerBlacklist({
                        shopId,
                        customerId: customer.id,
                        isBlacklisted: !customer.isBlacklisted,
                        conversationId,
                      })
                    }
                  >
                    {customer.isBlacklisted
                      ? t("unblacklistBtn")
                      : t("blacklistBtn")}
                  </PatternButton>
                </PermissionGate>
              </div>

              <PermissionGate can="CRM_CUSTOMER_PROFILE_EDIT" mode="hide">
                <PatternButton
                  type="button"
                  size="sm"
                  variant="solid"
                  color="primary"
                  rounded="full"
                  isLoading={isSaving}
                  className="h-8 text-xs"
                  icon={<Save className="w-3.5 h-3.5" />}
                  onClick={handleSaveProfile}
                >
                  {t("saveProfileBtn")}
                </PatternButton>
              </PermissionGate>
            </div>
          </GlassSurfaceCard>
        )}

        {activeTab === "ORDERS" && (
          <GlassSurfaceCard className="p-3.5 space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-bold">
                {t("ordersHistoryTitle")}
              </span>
              <PermissionGate can="CRM_LOYALTY_WALLET_ADJUST" mode="hide">
                <PatternButton
                  type="button"
                  size="sm"
                  variant="glass"
                  color="success"
                  rounded="full"
                  className="h-7 px-2.5 text-xs"
                  icon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => {
                    setDeliveredOrderCode(
                      `DH-${new Date().toISOString().slice(5, 10).replace("-", "")}-${Math.floor(100 + Math.random() * 900)}`,
                    );
                    setIsRecordOrderOpen(true);
                  }}
                >
                  {t("recordDeliveredOrderBtn")}
                </PatternButton>
              </PermissionGate>
            </div>

            {(customer.recentOrdersSnapshotJson || []).length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                {t("emptyOrders")}
              </p>
            ) : (
              (customer.recentOrdersSnapshotJson || []).map((ord) => (
                <div
                  key={ord.orderId}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/50"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold font-mono">
                        {ord.orderCode}
                      </span>
                      <GlassBadge
                        variant={
                          ord.status === "DELIVERED_RECONCILED"
                            ? "success"
                            : ord.status === "RETURNED"
                              ? "danger"
                              : "info"
                        }
                        size="sm"
                      >
                        {ord.status}
                      </GlassBadge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {ord.pageShortCode || ord.channelType} •{" "}
                      {ord.carrierCode || "3PL"} #{ord.trackingNumber || "N/A"}
                    </p>
                  </div>
                  <span className="text-xs font-bold tabular-nums shrink-0">
                    {Number(ord.totalAmount || 0).toLocaleString("vi-VN")}đ
                  </span>
                </div>
              ))
            )}
          </GlassSurfaceCard>
        )}

        {activeTab === "WALLET" && (
          <GlassSurfaceCard className="p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">
                {t("walletHistoryTitle")}
              </span>
              <PermissionGate can="CRM_LOYALTY_WALLET_ADJUST" mode="hide">
                <PatternButton
                  type="button"
                  size="sm"
                  variant="glass"
                  color="primary"
                  rounded="full"
                  className="h-7 px-2.5 text-xs"
                  icon={<Coins className="w-3.5 h-3.5" />}
                  onClick={() => setIsWalletModalOpen(true)}
                >
                  {t("adjustWalletBtn")}
                </PatternButton>
              </PermissionGate>
            </div>

            {walletLedgers.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                {t("emptyWalletLedgers")}
              </p>
            ) : (
              walletLedgers.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/50 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{entry.note}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {entry.ledgerType} • {entry.transactionType}
                    </p>
                  </div>
                  <span
                    className={
                      Number(entry.deltaAmount) >= 0
                        ? "font-bold text-emerald-600 tabular-nums"
                        : "font-bold text-red-600 tabular-nums"
                    }
                  >
                    {Number(entry.deltaAmount) >= 0 ? "+" : ""}
                    {Number(entry.deltaAmount).toLocaleString("vi-VN")}
                  </span>
                </div>
              ))
            )}
          </GlassSurfaceCard>
        )}

        {activeTab === "CHANNELS" && (
          <GlassSurfaceCard className="p-3.5 space-y-2.5">
            {(customer.linkedExternalIdentitiesJson || []).map((ext, idx) => (
              <div
                key={`${ext.channelType}-${ext.externalUserId}-${idx}`}
                className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/50 text-xs"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <GlassBadge variant="primary" size="sm">
                      {ext.pageShortCode || ext.channelType}
                    </GlassBadge>
                    {ext.pageName && (
                      <span className="text-[11px] font-medium text-muted-foreground truncate">
                        ({ext.pageName})
                      </span>
                    )}
                    <span className="font-semibold truncate">
                      {ext.externalUsername || customer.fullName}
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-muted-foreground truncate">
                    ID: {ext.externalUserId}
                  </p>
                </div>
                <GlassBadge variant="success" size="sm">
                  <CheckCircle2 className="w-2.5 h-2.5 mr-0.5 inline" />
                  {t("mergedIdentityBadge")}
                </GlassBadge>
              </div>
            ))}
          </GlassSurfaceCard>
        )}
      </ScrollArea>

      {/* Modal Ghi đè Điểm uy tín nhận hàng (CRM_TRUST_SCORE_OVERRIDE — F04.3) */}
      <GlassModal
        open={isOverrideTrustOpen}
        onOpenChange={setIsOverrideTrustOpen}
        title={t("overrideTrustModal.title")}
        description={t("overrideTrustModal.description", {
          name: customer.fullName,
        })}
        size="md"
        footer={
          <>
            <PatternButton
              type="button"
              size="sm"
              variant="ghost"
              rounded="full"
              onClick={() => setIsOverrideTrustOpen(false)}
            >
              {t("overrideTrustModal.cancelBtn")}
            </PatternButton>
            <PatternButton
              type="button"
              size="sm"
              variant="solid"
              color="primary"
              rounded="full"
              isLoading={isSubmittingOverride}
              disabled={!overrideReason.trim()}
              icon={<Gauge className="w-3.5 h-3.5" />}
              onClick={handleSubmitOverrideTrust}
            >
              {t("overrideTrustModal.confirmBtn")}
            </PatternButton>
          </>
        }
      >
        <div className="space-y-3 py-1">
          <div className="space-y-1">
            <Label className="text-xs font-semibold">
              {t("overrideTrustModal.scoreLabel")}
            </Label>
            <LiquidGlassInput className="p-0 overflow-hidden">
              <Input
                type="number"
                min={0}
                max={100}
                value={overrideScoreValue}
                onChange={(e) => setOverrideScoreValue(e.target.value)}
                className="h-full text-xs bg-transparent! border-none shadow-none focus-visible:ring-0 px-3"
              />
            </LiquidGlassInput>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold">
              {t("overrideTrustModal.reasonLabel")}
            </Label>
            <LiquidGlassInput className="p-0 overflow-hidden">
              <Input
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder={t("overrideTrustModal.reasonPlaceholder")}
                className="h-full text-xs bg-transparent! border-none shadow-none focus-visible:ring-0 px-3"
              />
            </LiquidGlassInput>
          </div>
        </div>
      </GlassModal>

      {/* Modal Ghi nhận Đơn giao thành công & Tích điểm tự động (F11.4) */}
      <GlassModal
        open={isRecordOrderOpen}
        onOpenChange={setIsRecordOrderOpen}
        title={t("recordOrderModal.title")}
        description={t("recordOrderModal.description", {
          name: customer.fullName,
        })}
        size="md"
        footer={
          <>
            <PatternButton
              type="button"
              size="sm"
              variant="ghost"
              rounded="full"
              onClick={() => setIsRecordOrderOpen(false)}
            >
              {t("recordOrderModal.cancelBtn")}
            </PatternButton>
            <PatternButton
              type="button"
              size="sm"
              variant="solid"
              color="success"
              rounded="full"
              isLoading={isSubmittingDeliveredOrder}
              disabled={
                !deliveredOrderCode.trim() || !Number(deliveredOrderAmount)
              }
              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
              onClick={handleSubmitDeliveredOrder}
            >
              {t("recordOrderModal.confirmBtn")}
            </PatternButton>
          </>
        }
      >
        <div className="space-y-3 py-1">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">
                {t("recordOrderModal.orderCodeLabel")}
              </Label>
              <LiquidGlassInput className="p-0 overflow-hidden">
                <Input
                  value={deliveredOrderCode}
                  onChange={(e) => setDeliveredOrderCode(e.target.value)}
                  placeholder="VD: DH-2611-889"
                  className="h-full text-xs bg-transparent! border-none shadow-none focus-visible:ring-0 px-2.5 font-mono"
                />
              </LiquidGlassInput>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">
                {t("recordOrderModal.carrierLabel")}
              </Label>
              <LiquidGlassInput className="p-0 overflow-hidden">
                <Input
                  value={deliveredCarrierCode}
                  onChange={(e) => setDeliveredCarrierCode(e.target.value)}
                  placeholder="GHN / GHTK / VTP"
                  className="h-full text-xs bg-transparent! border-none shadow-none focus-visible:ring-0 px-2.5"
                />
              </LiquidGlassInput>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">
              {t("recordOrderModal.amountLabel")}
            </Label>
            <LiquidGlassInput className="p-0 overflow-hidden">
              <Input
                type="number"
                value={deliveredOrderAmount}
                onChange={(e) => setDeliveredOrderAmount(e.target.value)}
                className="h-full text-xs bg-transparent! border-none shadow-none focus-visible:ring-0 px-2.5"
              />
            </LiquidGlassInput>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">
              {t("recordOrderModal.extraCreditLabel")}
            </Label>
            <LiquidGlassInput className="p-0 overflow-hidden">
              <Input
                type="number"
                value={deliveredExtraCredit}
                onChange={(e) => setDeliveredExtraCredit(e.target.value)}
                placeholder="0"
                className="h-full text-xs bg-transparent! border-none shadow-none focus-visible:ring-0 px-2.5"
              />
            </LiquidGlassInput>
          </div>
        </div>
      </GlassModal>

      {/* Modal Báo xấu SĐT / Bom hàng (Ghi nhận vào Cộng đồng Pancake & Blacklist) */}
      <GlassModal
        open={isReportAbuseOpen}
        onOpenChange={setIsReportAbuseOpen}
        title={t("reportAbuseModal.title")}
        description={t("reportAbuseModal.description", {
          name: customer.fullName,
        })}
        size="md"
        footer={
          <>
            <PatternButton
              type="button"
              size="sm"
              variant="ghost"
              rounded="full"
              onClick={() => setIsReportAbuseOpen(false)}
            >
              {t("reportAbuseModal.cancelBtn")}
            </PatternButton>
            <PatternButton
              type="button"
              size="sm"
              variant="solid"
              color="danger"
              rounded="full"
              isLoading={isSubmittingReport}
              disabled={!reportReasonNote.trim()}
              icon={<Flag className="w-3.5 h-3.5" />}
              onClick={handleSubmitAbuseReport}
            >
              {t("reportAbuseModal.submitBtn")}
            </PatternButton>
          </>
        }
      >
        <div className="space-y-3 py-1">
          <div className="space-y-1">
            <Label className="text-xs font-semibold">
              {t("reportAbuseModal.reasonCodeLabel")}
            </Label>
            <Select
              value={reportReasonCode}
              onValueChange={(v) => setReportReasonCode(v as any)}
            >
              <TriggerSelect className="w-full h-9 text-xs justify-between">
                <SelectValue />
              </TriggerSelect>
              <ContentSelect>
                <ItemSelect value="BOM_HANG">
                  {t("reportAbuseModal.reasons.BOM_HANG")}
                </ItemSelect>
                <ItemSelect value="TU_CHOI_NHAN_NHIEU_LAN">
                  {t("reportAbuseModal.reasons.TU_CHOI_NHAN_NHIEU_LAN")}
                </ItemSelect>
                <ItemSelect value="BOOM_AO_SPAM">
                  {t("reportAbuseModal.reasons.BOOM_AO_SPAM")}
                </ItemSelect>
                <ItemSelect value="SAI_SO_DIEN_THOAI">
                  {t("reportAbuseModal.reasons.SAI_SO_DIEN_THOAI")}
                </ItemSelect>
                <ItemSelect value="OTHER">
                  {t("reportAbuseModal.reasons.OTHER")}
                </ItemSelect>
              </ContentSelect>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">
                {t("reportAbuseModal.carrierLabel")}
              </Label>
              <LiquidGlassInput className="p-0 overflow-hidden">
                <Input
                  value={reportCarrierCode}
                  onChange={(e) => setReportCarrierCode(e.target.value)}
                  placeholder="GHN / GHTK / ViettelPost"
                  className="h-full text-xs bg-transparent! border-none shadow-none focus-visible:ring-0 px-2.5"
                />
              </LiquidGlassInput>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">
                {t("reportAbuseModal.orderCodeLabel")}
              </Label>
              <LiquidGlassInput className="p-0 overflow-hidden">
                <Input
                  value={reportOrderCode}
                  onChange={(e) => setReportOrderCode(e.target.value)}
                  placeholder="VD: ORD-2026-889"
                  className="h-full text-xs bg-transparent! border-none shadow-none focus-visible:ring-0 px-2.5"
                />
              </LiquidGlassInput>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">
              {t("reportAbuseModal.noteLabel")}
            </Label>
            <LiquidGlassInput className="p-0 overflow-hidden">
              <Input
                value={reportReasonNote}
                onChange={(e) => setReportReasonNote(e.target.value)}
                placeholder={t("reportAbuseModal.notePlaceholder")}
                className="h-full text-xs bg-transparent! border-none shadow-none focus-visible:ring-0 px-2.5"
              />
            </LiquidGlassInput>
          </div>

          <label className="flex items-center gap-2 text-xs cursor-pointer select-none pt-1">
            <input
              type="checkbox"
              checked={reportMarkBlacklisted}
              onChange={(e) => setReportMarkBlacklisted(e.target.checked)}
              className="rounded border-border"
            />
            <span>{t("reportAbuseModal.markBlacklistCheckbox")}</span>
          </label>
        </div>
      </GlassModal>

      {/* Modal Cấu hình Nguồn Dữ Liệu Tra Cứu Uy Tín SĐT (Nhận/Hoàn/Báo cáo) & Ngành Hàng Cửa Hàng */}
      <GlassModal
        open={isCrmConfigOpen}
        onOpenChange={setIsCrmConfigOpen}
        title={t("crmConfigModal.title")}
        description={t("crmConfigModal.description")}
        size="md"
        footer={
          <>
            <PatternButton
              type="button"
              size="sm"
              variant="ghost"
              rounded="full"
              onClick={() => setIsCrmConfigOpen(false)}
            >
              {t("crmConfigModal.cancelBtn")}
            </PatternButton>
            <PatternButton
              type="button"
              size="sm"
              variant="solid"
              color="primary"
              rounded="full"
              isLoading={isSavingCfg}
              icon={<Save className="w-3.5 h-3.5" />}
              onClick={handleSaveShopCrmConfig}
            >
              {t("crmConfigModal.saveBtn")}
            </PatternButton>
          </>
        }
      >
        <div className="space-y-3.5 py-1">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold inline-flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
              <span>{t("crmConfigModal.defaultIndustryLabel")}</span>
            </Label>
            <Select
              value={cfgBusinessCategory}
              onValueChange={(v) =>
                setCfgBusinessCategory(v as ShopBusinessCategoryType)
              }
            >
              <TriggerSelect className="w-full h-9 text-xs justify-between">
                <SelectValue />
              </TriggerSelect>
              <ContentSelect>
                <ItemSelect value="GENERAL_MULTI_CATEGORY">
                  {t("industries.GENERAL_MULTI_CATEGORY")}
                </ItemSelect>
                <ItemSelect value="FASHION_APPAREL">
                  {t("industries.FASHION_APPAREL")}
                </ItemSelect>
                <ItemSelect value="COSMETICS_BEAUTY">
                  {t("industries.COSMETICS_BEAUTY")}
                </ItemSelect>
                <ItemSelect value="ELECTRONICS_TECH">
                  {t("industries.ELECTRONICS_TECH")}
                </ItemSelect>
                <ItemSelect value="FOOD_BEVERAGE">
                  {t("industries.FOOD_BEVERAGE")}
                </ItemSelect>
                <ItemSelect value="MOTHER_AND_BABY">
                  {t("industries.MOTHER_AND_BABY")}
                </ItemSelect>
              </ContentSelect>
            </Select>
          </div>

          <div className="space-y-2 rounded-xl border border-border/60 bg-muted/30 p-3 text-xs">
            <p className="font-bold text-foreground">
              {t("crmConfigModal.lookupSourcesHeading")}
            </p>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={cfgEnableCommunity}
                onChange={(e) => setCfgEnableCommunity(e.target.checked)}
              />
              <span>{t("crmConfigModal.enableCommunitySource")}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={cfgEnableCarrier3pl}
                onChange={(e) => setCfgEnableCarrier3pl(e.target.checked)}
              />
              <span>{t("crmConfigModal.enableCarrier3plSource")}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={cfgShowApparel}
                onChange={(e) => setCfgShowApparel(e.target.checked)}
              />
              <span>{t("crmConfigModal.alwaysShowApparelToggle")}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={cfgAutoMaskPhone}
                onChange={(e) => setCfgAutoMaskPhone(e.target.checked)}
              />
              <span>{t("crmConfigModal.autoMaskPhoneInChatToggle")}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={cfgAutoExtractNer}
                onChange={(e) => setCfgAutoExtractNer(e.target.checked)}
              />
              <span>{t("crmConfigModal.autoExtractNerToggle")}</span>
            </label>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              {t("crmConfigModal.customWebhookUrlLabel")}
            </Label>
            <LiquidGlassInput className="h-8 p-0 overflow-hidden">
              <Input
                value={cfgCustomWebhookUrl}
                onChange={(e) => setCfgCustomWebhookUrl(e.target.value)}
                placeholder="https://pos.yourshop.vn/api/phone-reputation"
                className="h-full text-xs bg-transparent! border-none shadow-none focus-visible:ring-0 px-2.5"
              />
            </LiquidGlassInput>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              {t("crmConfigModal.customApiKeyLabel")}
            </Label>
            <LiquidGlassInput className="h-8 p-0 overflow-hidden">
              <Input
                type="password"
                value={cfgCustomApiKey}
                onChange={(e) => setCfgCustomApiKey(e.target.value)}
                placeholder={
                  shopCrmConfig?.hasCustomLookupApiKey
                    ? "•••••••••••••••• (Đã mã hóa AES-256-GCM)"
                    : "Bearer Token / API Key (Tùy chọn)..."
                }
                className="h-full text-xs bg-transparent! border-none shadow-none focus-visible:ring-0 px-2.5"
              />
            </LiquidGlassInput>
          </div>
        </div>
      </GlassModal>

      <CustomerMergeModal
        open={isMergeOpen}
        onOpenChange={setIsMergeOpen}
        shopId={shopId}
        primaryCustomer={customer}
        candidates={customers}
      />

      <LoyaltyWalletAdjustModal
        open={isWalletModalOpen}
        onOpenChange={setIsWalletModalOpen}
        shopId={shopId}
        customer={customer}
        conversationId={conversationId}
      />
    </div>
  );
}
