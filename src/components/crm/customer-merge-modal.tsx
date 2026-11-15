"use client";

import { useState } from "react";
import {
  ContentSelect,
  GlassModal,
  ItemSelect,
  LiquidGlassInput,
  PatternButton,
  TriggerSelect,
} from "@/components/toolkit";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectValue } from "@/components/ui/select";
import { useCrmStore } from "@/lib/stores/crm/use-crm-store";
import type { ICustomerProfile } from "@/types/crm";
import { GitMerge } from "lucide-react";
import { useTranslations } from "next-intl";

export interface CustomerMergeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shopId: string;
  primaryCustomer: ICustomerProfile;
  candidates: ICustomerProfile[];
}

export function CustomerMergeModal({
  open,
  onOpenChange,
  shopId,
  primaryCustomer,
  candidates,
}: CustomerMergeModalProps) {
  const t = useTranslations("Crm360.mergeModal");
  const mergeCustomerProfiles = useCrmStore((s) => s.mergeCustomerProfiles);

  const [duplicateId, setDuplicateId] = useState("");
  const [mergeReason, setMergeReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableDuplicates = candidates.filter(
    (c) => c.id !== primaryCustomer.id,
  );

  const handleMerge = async () => {
    if (!duplicateId) return;
    setIsSubmitting(true);
    const merged = await mergeCustomerProfiles({
      shopId,
      primaryCustomerId: primaryCustomer.id,
      duplicateCustomerId: duplicateId,
      mergeReason: mergeReason.trim() || undefined,
    });
    setIsSubmitting(false);
    if (merged) {
      onOpenChange(false);
    }
  };

  return (
    <GlassModal
      open={open}
      onOpenChange={onOpenChange}
      title={t("title")}
      description={t("description", { name: primaryCustomer.fullName })}
      size="md"
      footer={
        <>
          <PatternButton
            type="button"
            variant="ghost"
            size="sm"
            rounded="full"
            onClick={() => onOpenChange(false)}
          >
            {t("cancelBtn")}
          </PatternButton>
          <PatternButton
            type="button"
            variant="solid"
            color="primary"
            size="sm"
            rounded="full"
            disabled={!duplicateId}
            isLoading={isSubmitting}
            icon={<GitMerge className="w-3.5 h-3.5" />}
            onClick={handleMerge}
          >
            {t("confirmMergeBtn")}
          </PatternButton>
        </>
      }
    >
      <div className="space-y-4 py-1">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">
            {t("selectDuplicateLabel")}
          </Label>
          <Select value={duplicateId} onValueChange={setDuplicateId}>
            <TriggerSelect className="w-full justify-between">
              <SelectValue placeholder={t("selectDuplicatePlaceholder")} />
            </TriggerSelect>
            <ContentSelect>
              {availableDuplicates.map((item) => (
                <ItemSelect key={item.id} value={item.id}>
                  {item.fullName} ({item.code} •{" "}
                  {item.phoneMasked || "Chưa có SĐT"})
                </ItemSelect>
              ))}
            </ContentSelect>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">{t("reasonLabel")}</Label>
          <LiquidGlassInput className="h-9 p-0 overflow-hidden">
            <Input
              value={mergeReason}
              onChange={(e) => setMergeReason(e.target.value)}
              placeholder={t("reasonPlaceholder")}
              className="h-full text-xs bg-transparent! border-none shadow-none focus-visible:ring-0 px-3"
            />
          </LiquidGlassInput>
        </div>
      </div>
    </GlassModal>
  );
}
