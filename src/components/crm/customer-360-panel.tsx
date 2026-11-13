"use client";

import { useEffect, useState } from "react";
import {
  GlassAlert,
  GlassAvatar,
  GlassBadge,
  GlassEmptyState,
  GlassSurfaceCard,
  GlassTabs,
  LiquidGlassInput,
  PatternButton,
  ScrollArea,
} from "@/components/toolkit";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PermissionGate } from "@/components/iam/permission-gate";
import { useCrmStore } from "@/lib/stores/crm/use-crm-store";
import { PiiMaskedPhoneField } from "./pii-masked-phone-field";
import { ProvinceDistrictWardCombobox } from "./province-district-ward-combobox";
import { CustomerMergeModal } from "./customer-merge-modal";
import { LoyaltyWalletAdjustModal } from "./loyalty-wallet-adjust-modal";
import {
  AlertTriangle,
  Award,
  Ban,
  Coins,
  ExternalLink,
  GitMerge,
  Link2,
  MapPin,
  Package,
  Ruler,
  Save,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Wallet,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import config from "@/config";

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
    customers,
    customer360ByConv,
    activeCustomerDetail,
    fetchAdministrativeTree,
    fetchCustomers,
    fetchCustomer360ByConversation,
    fetchCustomer360Detail,
    saveCustomerProfile,
    toggleCustomerBlacklist,
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
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [preferredSize, setPreferredSize] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [isMergeOpen, setIsMergeOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  useEffect(() => {
    if (!shopId) return;
    fetchAdministrativeTree(shopId);
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
    fetchCustomer360ByConversation,
    fetchCustomer360Detail,
    fetchCustomers,
  ]);

  useEffect(() => {
    if (customer) {
      setFullName(customer.fullName || fallbackDisplayName || "");
      setProvinceCode(customer.defaultProvinceCode || null);
      setDistrictCode(customer.defaultDistrictCode || null);
      setWardCode(customer.defaultWardCode || null);
      setAddressLine(customer.defaultAddressLine || "");
      setHeightCm(customer.heightCm ? String(customer.heightCm) : "");
      setWeightKg(customer.weightKg ? String(customer.weightKg) : "");
      setPreferredSize(customer.preferredSize || "");
      setNotes(customer.notes || "");
    } else if (fallbackDisplayName) {
      setFullName(fallbackDisplayName);
    }
  }, [customer, fallbackDisplayName]);

  const handleCreateInitialProfile = async () => {
    if (!shopId) return;
    setIsSaving(true);
    await saveCustomerProfile({
      shopId,
      fullName: (fullName || fallbackDisplayName || "Khách hàng").trim(),
      rawPhone: rawPhoneInput.trim() || undefined,
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

  const handleSaveProfile = async () => {
    setIsSaving(true);
    await saveCustomerProfile({
      shopId,
      customerId: customer.id,
      fullName: fullName.trim() || customer.fullName,
      rawPhone: rawPhoneInput.trim() || undefined,
      defaultProvinceCode: provinceCode || undefined,
      defaultDistrictCode: districtCode || undefined,
      defaultWardCode: wardCode || undefined,
      defaultAddressLine: addressLine.trim() || undefined,
      heightCm: heightCm ? Number(heightCm) : undefined,
      weightKg: weightKg ? Number(weightKg) : undefined,
      preferredSize: preferredSize.trim() || undefined,
      notes: notes.trim() || undefined,
      conversationId:
        conversationId && !conversationId.startsWith("detail_")
          ? conversationId
          : undefined,
    });
    setRawPhoneInput("");
    setIsSaving(false);
  };

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Thẻ Định danh 360° & Hạng thành viên / RFM */}
      <GlassSurfaceCard className="p-3.5 space-y-3">
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
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                <span className="font-mono">{customer.code}</span>
                <span>•</span>
                <GlassBadge variant="info" size="sm">
                  RFM: {customer.rfmSegmentCode} ({customer.rfmScoreR}-
                  {customer.rfmScoreF}-{customer.rfmScoreM})
                </GlassBadge>
              </div>
            </div>
          </div>

          <Link
            href={config.routes.private.customerDetail(customer.id)}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline shrink-0"
          >
            <span>360°</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
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

        {/* Điểm Uy tín Nhận hàng & Cảnh báo Bom hàng (F04.3) */}
        {trust && (
          <GlassAlert
            variant={trust.badgeVariant}
            title={`${trust.headline} (${trust.score}/100)`}
            description={
              <div className="space-y-1 text-[11px]">
                <p>{trust.recommendation}</p>
                <div className="flex items-center gap-2 font-semibold pt-0.5">
                  <span className="text-emerald-600 dark:text-emerald-400">
                    ✓ Nhận: {customer.successfulDeliveriesCount} đơn
                  </span>
                  <span>•</span>
                  <span className="text-red-600 dark:text-red-400">
                    ✕ Hoàn: {customer.returnedOrdersCount} đơn
                  </span>
                  {trust.requireDepositVietQr && (
                    <GlassBadge variant="danger" size="sm" pulse>
                      {t("requireVietQrDepositBadge")}
                    </GlassBadge>
                  )}
                </div>
              </div>
            }
            icon={
              trust.band === "HIGH_RISK_RED" ? (
                <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
              ) : trust.band === "TRUSTED_GREEN" ? (
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              )
            }
          />
        )}

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

      {/* Tabs chuyển đổi: Địa chỉ & Số đo | Đơn hàng | Ví & Điểm | Kênh liên kết */}
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
          <GlassSurfaceCard className="p-3.5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold">
                  {t("fullNameLabel")}
                </Label>
                <LiquidGlassInput className="h-8 p-0 overflow-hidden">
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
                <LiquidGlassInput className="h-8 p-0 overflow-hidden">
                  <Input
                    value={rawPhoneInput}
                    onChange={(e) => setRawPhoneInput(e.target.value)}
                    placeholder="Nhập SĐT mới (tự động mã hóa PII)..."
                    className="h-full text-xs bg-transparent! border-none shadow-none focus-visible:ring-0 px-2.5"
                  />
                </LiquidGlassInput>
              </div>
            </div>

            <div className="space-y-1.5">
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
              <LiquidGlassInput className="h-8 p-0 overflow-hidden mt-1.5">
                <Input
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  placeholder={t("streetAddressPlaceholder")}
                  className="h-full text-xs bg-transparent! border-none shadow-none focus-visible:ring-0 px-2.5"
                />
              </LiquidGlassInput>
            </div>

            {/* Số đo chiều cao, cân nặng & size thường mặc */}
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold inline-flex items-center gap-1">
                  <Ruler className="w-3 h-3" />
                  <span>{t("heightCmLabel")}</span>
                </Label>
                <LiquidGlassInput className="h-8 p-0 overflow-hidden">
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
                <LiquidGlassInput className="h-8 p-0 overflow-hidden">
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
                <LiquidGlassInput className="h-8 p-0 overflow-hidden">
                  <Input
                    value={preferredSize}
                    onChange={(e) => setPreferredSize(e.target.value)}
                    placeholder="S / M / L"
                    className="h-full text-xs bg-transparent! border-none shadow-none focus-visible:ring-0 px-2.5"
                  />
                </LiquidGlassInput>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-semibold">
                {t("notesLabel")}
              </Label>
              <LiquidGlassInput className="h-8 p-0 overflow-hidden">
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
                  <div className="flex items-center gap-1.5">
                    <GlassBadge variant="primary" size="sm">
                      {ext.pageShortCode || ext.channelType}
                    </GlassBadge>
                    <span className="font-semibold truncate">
                      {ext.externalUsername || customer.fullName}
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-muted-foreground truncate">
                    ID: {ext.externalUserId}
                  </p>
                </div>
                <GlassBadge variant="success" size="sm">
                  Đã hợp nhất
                </GlassBadge>
              </div>
            ))}
          </GlassSurfaceCard>
        )}
      </ScrollArea>

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
