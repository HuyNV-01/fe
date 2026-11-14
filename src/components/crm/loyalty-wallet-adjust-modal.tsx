"use client";

import { useState } from "react";
import {
  ContentSelect,
  GlassModal,
  GlassTabs,
  ItemSelect,
  LiquidGlassInput,
  PatternButton,
  TriggerSelect,
} from "@/components/toolkit";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectValue } from "@/components/ui/select";
import { useCrmStore } from "@/lib/stores/crm/use-crm-store";
import type {
  CustomerWalletLedgerType,
  CustomerWalletTransactionType,
  ICustomerProfile,
} from "@/types/crm";
import { Coins, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";

export interface LoyaltyWalletAdjustModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shopId: string;
  customer: ICustomerProfile;
  conversationId?: string;
}

export function LoyaltyWalletAdjustModal({
  open,
  onOpenChange,
  shopId,
  customer,
  conversationId,
}: LoyaltyWalletAdjustModalProps) {
  const t = useTranslations("Crm360.walletModal");
  const adjustWalletOrPoints = useCrmStore((s) => s.adjustWalletOrPoints);

  const [ledgerType, setLedgerType] =
    useState<CustomerWalletLedgerType>("LOYALTY_POINT");
  const [transactionType, setTransactionType] =
    useState<CustomerWalletTransactionType>("MANUAL_ADJUST");
  const [deltaAmount, setDeltaAmount] = useState("100");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const numDelta = Number(deltaAmount);
    if (!Number.isFinite(numDelta) || numDelta === 0 || !note.trim()) return;

    setIsSubmitting(true);
    const ok = await adjustWalletOrPoints({
      shopId,
      customerId: customer.id,
      ledgerType,
      transactionType,
      deltaAmount: numDelta,
      note: note.trim(),
      conversationId,
    });
    setIsSubmitting(false);
    if (ok) {
      setNote("");
      onOpenChange(false);
    }
  };

  return (
    <GlassModal
      open={open}
      onOpenChange={onOpenChange}
      title={t("title")}
      description={t("description", { name: customer.fullName })}
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
            disabled={!note.trim() || !Number(deltaAmount)}
            isLoading={isSubmitting}
            onClick={handleSubmit}
          >
            {t("confirmAdjustBtn")}
          </PatternButton>
        </>
      }
    >
      <div className="space-y-4 p-2">
        <GlassTabs
          fullWidth
          size="sm"
          value={ledgerType}
          onValueChange={setLedgerType}
          items={[
            {
              key: "LOYALTY_POINT",
              label: t("loyaltyPointsTab"),
              icon: <Coins className="w-3.5 h-3.5" />,
            },
            {
              key: "WALLET_CREDIT",
              label: t("walletCreditTab"),
              icon: <Wallet className="w-3.5 h-3.5" />,
            },
          ]}
        />

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">
            {t("transactionTypeLabel")}
          </Label>
          <Select
            value={transactionType}
            onValueChange={(v) =>
              setTransactionType(v as CustomerWalletTransactionType)
            }
          >
            <TriggerSelect className="w-full justify-between">
              <SelectValue placeholder={t("transactionTypeLabel")} />
            </TriggerSelect>
            <ContentSelect>
              <ItemSelect value="MANUAL_ADJUST">
                {t("txTypes.MANUAL_ADJUST")}
              </ItemSelect>
              <ItemSelect value="EARN_FROM_ORDER">
                {t("txTypes.EARN_FROM_ORDER")}
              </ItemSelect>
              <ItemSelect value="REDEEM_ON_ORDER">
                {t("txTypes.REDEEM_ON_ORDER")}
              </ItemSelect>
              <ItemSelect value="OVERPAYMENT_CREDIT">
                {t("txTypes.OVERPAYMENT_CREDIT")}
              </ItemSelect>
              <ItemSelect value="RMA_REFUND_CREDIT">
                {t("txTypes.RMA_REFUND_CREDIT")}
              </ItemSelect>
            </ContentSelect>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">
            {t("deltaAmountLabel")}
          </Label>
          <LiquidGlassInput className="h-9 p-0 overflow-hidden">
            <Input
              type="number"
              value={deltaAmount}
              onChange={(e) => setDeltaAmount(e.target.value)}
              className="h-full text-xs bg-transparent! border-none shadow-none focus-visible:ring-0 px-3"
            />
          </LiquidGlassInput>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">{t("noteLabel")}</Label>
          <LiquidGlassInput className="h-9 p-0 overflow-hidden">
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("notePlaceholder")}
              className="h-full text-xs bg-transparent! border-none shadow-none focus-visible:ring-0 px-3"
            />
          </LiquidGlassInput>
        </div>
      </div>
    </GlassModal>
  );
}
