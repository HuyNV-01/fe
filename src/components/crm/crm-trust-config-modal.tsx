/** biome-ignore-all lint/correctness/useExhaustiveDependencies: sync form when modal opens */
"use client";

import { useEffect, useState } from "react";
import {
  ContentSelect,
  GlassAlert,
  GlassModal,
  GlassSurfaceCard,
  ItemSelect,
  PatternButton,
  ScrollArea,
  Switch,
  TriggerSelect,
} from "@/components/toolkit";
import { Label } from "@/components/ui/label";
import { Select, SelectValue } from "@/components/ui/select";
import { useCrmStore } from "@/lib/stores/crm/use-crm-store";
import type {
  ICrmTrustAndIndustryConfig,
  PhoneTrustLookupSourceType,
  ShopBusinessCategoryType,
} from "@/types/crm";
import { Save, ShieldCheck, SlidersHorizontal } from "lucide-react";
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
  }, [shopCrmConfig, open]);

  const handleSave = async () => {
    setIsSaving(true);
    const enabledSources: PhoneTrustLookupSourceType[] = ["INTERNAL_POS"];
    if (enableCommunity) enabledSources.push("PANCAKE_COMMUNITY");
    if (enableCarrier3pl) enabledSources.push("CARRIER_3PL");

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
      <ScrollArea className="max-h-[440px] pr-2">
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
              <span>{t("crmConfigModal.enableCommunitySource")}</span>
              <Switch
                checked={enableCommunity}
                onCheckedChange={setEnableCommunity}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>{t("crmConfigModal.consortiumSharingToggle")}</span>
              <Switch
                checked={consortiumSharing}
                onCheckedChange={setConsortiumSharing}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>{t("crmConfigModal.enableCarrier3plSource")}</span>
              <Switch
                checked={enableCarrier3pl}
                onCheckedChange={setEnableCarrier3pl}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>{t("crmConfigModal.enablePublicWebRiskToggle")}</span>
              <Switch
                checked={enablePublicWebRisk}
                onCheckedChange={setEnablePublicWebRisk}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>{t("crmConfigModal.alwaysShowApparelToggle")}</span>
              <Switch checked={showApparel} onCheckedChange={setShowApparel} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>{t("crmConfigModal.autoMaskPhoneInChatToggle")}</span>
              <Switch
                checked={autoMaskPhone}
                onCheckedChange={setAutoMaskPhone}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>{t("crmConfigModal.autoExtractNerToggle")}</span>
              <Switch
                checked={autoExtractNer}
                onCheckedChange={setAutoExtractNer}
              />
            </div>
          </GlassSurfaceCard>
        </div>
      </ScrollArea>
    </GlassModal>
  );
}
