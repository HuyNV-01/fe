/** biome-ignore-all lint/correctness/useExhaustiveDependencies: sync form when modal opens */
"use client";

import { useEffect, useState } from "react";
import {
  ContentSelect,
  GlassAlert,
  GlassBadge,
  GlassModal,
  GlassSurfaceCard,
  ItemSelect,
  LiquidGlassInput,
  PatternButton,
  ScrollArea,
  Switch,
  TriggerSelect,
  TruncatedText,
} from "@/components/toolkit";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectValue } from "@/components/ui/select";
import { useCrmStore } from "@/lib/stores/crm/use-crm-store";
import type {
  ICrmTrustAndIndustryConfig,
  PhoneTrustLookupSourceType,
  ShopBusinessCategoryType,
} from "@/types/crm";
import {
  KeyRound,
  Link2,
  Save,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { useTranslations } from "next-intl";

export interface CrmTrustConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shopId: string;
  shopCrmConfig?: ICrmTrustAndIndustryConfig | null;
  onSaved?: (updated: ICrmTrustAndIndustryConfig) => void;
}

export function CrmTrustConfigModal({
  open,
  onOpenChange,
  shopId,
  shopCrmConfig,
  onSaved,
}: CrmTrustConfigModalProps) {
  const t = useTranslations("Crm360.panel");
  const { updateShopCrmConfig } = useCrmStore();

  const [businessCategory, setBusinessCategory] =
    useState<ShopBusinessCategoryType>("GENERAL_MULTI_CATEGORY");
  const [showApparel, setShowApparel] = useState(false);
  const [enableCommunity, setEnableCommunity] = useState(true);
  const [consortiumSharing, setConsortiumSharing] = useState(true);
  const [enablePublicWebRisk, setEnablePublicWebRisk] = useState(true);
  const [enableCarrier3pl, setEnableCarrier3pl] = useState(true);
  const [autoMaskPhone, setAutoMaskPhone] = useState(true);
  const [autoExtractNer, setAutoExtractNer] = useState(true);

  const [pancakePosShopId, setPancakePosShopId] = useState("");
  const [pancakePosApiKey, setPancakePosApiKey] = useState("");
  const [ghnToken, setGhnToken] = useState("");
  const [ghtkToken, setGhtkToken] = useState("");
  const [customWebhookUrl, setCustomWebhookUrl] = useState("");
  const [customWebhookApiKey, setCustomWebhookApiKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!shopCrmConfig) return;
    setBusinessCategory(shopCrmConfig.businessCategory);
    setShowApparel(Boolean(shopCrmConfig.showApparelMeasurementsInProfile));
    setEnableCommunity(
      Boolean(
        shopCrmConfig.enableCommunityTrustLookup ??
          shopCrmConfig.usePancakeCommunityNetwork ??
          true,
      ),
    );
    setConsortiumSharing(shopCrmConfig.consortiumSharingEnabled !== false);
    setEnablePublicWebRisk(shopCrmConfig.enablePublicWebRiskLookup !== false);
    setEnableCarrier3pl(
      Boolean(
        shopCrmConfig.enableCarrier3plTrustLookup ??
          shopCrmConfig.useCarrier3plLookup ??
          true,
      ),
    );
    setAutoMaskPhone(
      Boolean(
        shopCrmConfig.autoMaskPhoneInChatMessages ??
          shopCrmConfig.autoMaskBuyerPhoneInChat ??
          true,
      ),
    );
    setAutoExtractNer(
      Boolean(
        shopCrmConfig.autoExtractPhoneAndAddressInChat ??
          shopCrmConfig.autoExtractAddressFromChat ??
          true,
      ),
    );
    setPancakePosShopId(shopCrmConfig.pancakePosShopId || "");
    setCustomWebhookUrl(shopCrmConfig.customLookupWebhookUrl || "");
    setPancakePosApiKey("");
    setGhnToken("");
    setGhtkToken("");
    setCustomWebhookApiKey("");
  }, [shopCrmConfig, open]);

  const handleSave = async () => {
    setIsSaving(true);
    const enabledSources: PhoneTrustLookupSourceType[] = ["INTERNAL_POS"];
    if (enableCommunity) enabledSources.push("PANCAKE_COMMUNITY");
    if (enableCarrier3pl) enabledSources.push("CARRIER_3PL");
    if (customWebhookUrl.trim()) enabledSources.push("CUSTOM_WEBHOOK");

    const updated = await updateShopCrmConfig({
      shopId,
      businessCategory,
      showApparelMeasurementsInProfile:
        businessCategory === "FASHION_APPAREL" ? true : showApparel,
      enableCommunityTrustLookup: enableCommunity,
      consortiumSharingEnabled: consortiumSharing,
      enablePublicWebRiskLookup: enablePublicWebRisk,
      enableCarrier3plTrustLookup: enableCarrier3pl,
      enabledLookupSources: enabledSources,
      autoMaskPhoneInChatMessages: autoMaskPhone,
      autoExtractPhoneAndAddressInChat: autoExtractNer,
      pancakePosShopId: pancakePosShopId.trim() || null,
      pancakePosApiKey: pancakePosApiKey.trim() || undefined,
      ghnToken: ghnToken.trim() || undefined,
      ghtkToken: ghtkToken.trim() || undefined,
      customLookupWebhookUrl: customWebhookUrl.trim() || undefined,
      customLookupApiKey: customWebhookApiKey.trim() || undefined,
    });
    setIsSaving(false);

    if (updated) {
      onSaved?.(updated);
      onOpenChange(false);
    }
  };

  return (
    <GlassModal
      open={open}
      onOpenChange={onOpenChange}
      title={t("crmConfigModal.title")}
      description={t("crmConfigModal.description")}
      size="md"
      footer={
        <div className="flex items-center justify-end w-full gap-2">
          <PatternButton
            type="button"
            size="sm"
            variant="ghost"
            rounded="full"
            onClick={() => onOpenChange(false)}
          >
            {t("crmConfigModal.cancelBtn")}
          </PatternButton>
          <PatternButton
            type="button"
            size="sm"
            variant="solid"
            color="primary"
            rounded="full"
            isLoading={isSaving}
            icon={<Save className="w-3.5 h-3.5" />}
            onClick={handleSave}
          >
            {t("crmConfigModal.saveBtn")}
          </PatternButton>
        </div>
      }
    >
      <ScrollArea className="max-h-[480px] pr-2">
        <div className="space-y-3.5 py-1">
          <GlassAlert
            variant="info"
            title={t("crmConfigModal.zeroConfigBannerTitle")}
            description={t("crmConfigModal.zeroConfigBannerDesc")}
            icon={<ShieldCheck className="w-4 h-4 text-sky-500" />}
          />

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold inline-flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
              <span>{t("crmConfigModal.defaultIndustryLabel")}</span>
            </Label>
            <Select
              value={businessCategory}
              onValueChange={(v) =>
                setBusinessCategory(v as ShopBusinessCategoryType)
              }
            >
              <TriggerSelect
                fluid
                enableGlassAnchor
                className="w-full h-9 text-xs justify-between"
              >
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
                <ItemSelect value="HOME_LIVING_APPLIANCES">
                  {t("industries.HOME_LIVING_APPLIANCES")}
                </ItemSelect>
              </ContentSelect>
            </Select>
          </div>

          <GlassSurfaceCard className="p-3 space-y-2.5 text-xs">
            <p className="font-bold text-foreground">
              {t("crmConfigModal.lookupSourcesHeading")}
            </p>
            <div className="flex items-center justify-between gap-3">
              <TruncatedText>
                {t("crmConfigModal.enableCommunitySource")}
              </TruncatedText>
              <Switch
                checked={enableCommunity}
                onCheckedChange={setEnableCommunity}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <TruncatedText>
                {t("crmConfigModal.consortiumSharingToggle")}
              </TruncatedText>
              <Switch
                checked={consortiumSharing}
                onCheckedChange={setConsortiumSharing}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <TruncatedText>
                {t("crmConfigModal.enableCarrier3plSource")}
              </TruncatedText>
              <Switch
                checked={enableCarrier3pl}
                onCheckedChange={setEnableCarrier3pl}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <TruncatedText>
                {t("crmConfigModal.enablePublicWebRiskToggle")}
              </TruncatedText>
              <Switch
                checked={enablePublicWebRisk}
                onCheckedChange={setEnablePublicWebRisk}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <TruncatedText>
                {t("crmConfigModal.alwaysShowApparelToggle")}
              </TruncatedText>
              <Switch checked={showApparel} onCheckedChange={setShowApparel} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <TruncatedText>
                {t("crmConfigModal.autoMaskPhoneInChatToggle")}
              </TruncatedText>
              <Switch
                checked={autoMaskPhone}
                onCheckedChange={setAutoMaskPhone}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <TruncatedText>
                {t("crmConfigModal.autoExtractNerToggle")}
              </TruncatedText>
              <Switch
                checked={autoExtractNer}
                onCheckedChange={setAutoExtractNer}
              />
            </div>
          </GlassSurfaceCard>

          <GlassSurfaceCard className="p-3 space-y-3 text-xs">
            <div className="flex items-center justify-between gap-2">
              <p className="font-bold text-foreground inline-flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-primary" />
                <span>
                  {t("crmConfigModal.liveProviderCredentialsHeading")}
                </span>
              </p>
              <GlassBadge variant="info" size="sm">
                AES-256-GCM
              </GlassBadge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label className="text-[11px]">
                  {t("crmConfigModal.pancakePosShopIdLabel")}
                </Label>
                <LiquidGlassInput className="h-8 p-0 overflow-hidden">
                  <Input
                    value={pancakePosShopId}
                    onChange={(e) => setPancakePosShopId(e.target.value)}
                    placeholder="VD: 102938"
                    className="h-full text-xs bg-transparent! border-none shadow-none focus-visible:ring-0 px-2.5 font-mono"
                  />
                </LiquidGlassInput>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px]">
                    {t("crmConfigModal.pancakePosApiKeyLabel")}
                  </Label>
                  {shopCrmConfig?.hasPancakePosApiKey && (
                    <GlassBadge variant="success" size="sm">
                      {"AES-256"}
                    </GlassBadge>
                  )}
                </div>
                <LiquidGlassInput className="h-8 p-0 overflow-hidden">
                  <Input
                    type="password"
                    value={pancakePosApiKey}
                    onChange={(e) => setPancakePosApiKey(e.target.value)}
                    placeholder={t("crmConfigModal.encryptedKeyPlaceholder")}
                    className="h-full text-xs bg-transparent! border-none shadow-none focus-visible:ring-0 px-2.5 font-mono"
                  />
                </LiquidGlassInput>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px]">
                    {t("crmConfigModal.ghnTokenLabel")}
                  </Label>
                  {shopCrmConfig?.hasGhnToken && (
                    <GlassBadge variant="success" size="sm">
                      {"AES-256"}
                    </GlassBadge>
                  )}
                </div>
                <LiquidGlassInput className="h-8 p-0 overflow-hidden">
                  <Input
                    type="password"
                    value={ghnToken}
                    onChange={(e) => setGhnToken(e.target.value)}
                    placeholder={t("crmConfigModal.encryptedKeyPlaceholder")}
                    className="h-full text-xs bg-transparent! border-none shadow-none focus-visible:ring-0 px-2.5 font-mono"
                  />
                </LiquidGlassInput>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px]">
                    {t("crmConfigModal.ghtkTokenLabel")}
                  </Label>
                  {shopCrmConfig?.hasGhtkToken && (
                    <GlassBadge variant="success" size="sm">
                      {"AES-256"}
                    </GlassBadge>
                  )}
                </div>
                <LiquidGlassInput className="h-8 p-0 overflow-hidden">
                  <Input
                    type="password"
                    value={ghtkToken}
                    onChange={(e) => setGhtkToken(e.target.value)}
                    placeholder={t("crmConfigModal.encryptedKeyPlaceholder")}
                    className="h-full text-xs bg-transparent! border-none shadow-none focus-visible:ring-0 px-2.5 font-mono"
                  />
                </LiquidGlassInput>
              </div>
            </div>

            <div className="space-y-2 pt-1 border-t border-border/40">
              <div className="space-y-1">
                <Label className="text-[11px] inline-flex items-center gap-1">
                  <Link2 className="w-3 h-3 text-primary" />
                  <span>{t("crmConfigModal.customWebhookUrlLabel")}</span>
                </Label>
                <LiquidGlassInput className="h-8 p-0 overflow-hidden">
                  <Input
                    value={customWebhookUrl}
                    onChange={(e) => setCustomWebhookUrl(e.target.value)}
                    placeholder="https://erp.shopdomain.vn/api/trust-lookup"
                    className="h-full text-xs bg-transparent! border-none shadow-none focus-visible:ring-0 px-2.5 font-mono"
                  />
                </LiquidGlassInput>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px]">
                    {t("crmConfigModal.customApiKeyLabel")}
                  </Label>
                  {shopCrmConfig?.hasCustomLookupApiKey && (
                    <GlassBadge variant="success" size="sm">
                      {"AES-256"}
                    </GlassBadge>
                  )}
                </div>
                <LiquidGlassInput className="h-8 p-0 overflow-hidden">
                  <Input
                    type="password"
                    value={customWebhookApiKey}
                    onChange={(e) => setCustomWebhookApiKey(e.target.value)}
                    placeholder={t("crmConfigModal.encryptedKeyPlaceholder")}
                    className="h-full text-xs bg-transparent! border-none shadow-none focus-visible:ring-0 px-2.5 font-mono"
                  />
                </LiquidGlassInput>
              </div>
            </div>
          </GlassSurfaceCard>
        </div>
      </ScrollArea>
    </GlassModal>
  );
}
