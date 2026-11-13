"use client";

import { useEffect, useState } from "react";
import {
  GlassBadge,
  GlassIconButton,
  PatternButton,
} from "@/components/toolkit";
import { PermissionGate } from "@/components/iam/permission-gate";
import { useCrmStore } from "@/lib/stores/crm/use-crm-store";
import {
  Copy,
  Eye,
  EyeOff,
  Lock,
  PhoneForwarded,
  ShieldCheck,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

export interface PiiMaskedPhoneFieldProps {
  shopId: string;
  customerId: string;
  phoneMasked?: string | null;
  conversationId?: string;
  compact?: boolean;
  onMaskedCall?: () => void;
}

export function PiiMaskedPhoneField({
  shopId,
  customerId,
  phoneMasked,
  conversationId,
  compact = false,
  onMaskedCall,
}: PiiMaskedPhoneFieldProps) {
  const t = useTranslations("Crm360.piiVault");
  const unmaskedSession = useCrmStore(
    (s) => s.unmaskedPhonesByCustomer[customerId],
  );
  const unmaskCustomerPhone15s = useCrmStore((s) => s.unmaskCustomerPhone15s);
  const clearUnmaskedPhone = useCrmStore((s) => s.clearUnmaskedPhone);

  const [isUnmasking, setIsUnmasking] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    if (!unmaskedSession?.expiresAt) {
      setRemainingSeconds(0);
      return;
    }

    const computeRemain = () => {
      const diffMs = new Date(unmaskedSession.expiresAt).getTime() - Date.now();
      return Math.max(0, Math.ceil(diffMs / 1000));
    };

    setRemainingSeconds(computeRemain());

    const timer = setInterval(() => {
      const next = computeRemain();
      setRemainingSeconds(next);
      if (next <= 0) {
        clearUnmaskedPhone(customerId);
        clearInterval(timer);
      }
    }, 500);

    return () => clearInterval(timer);
  }, [unmaskedSession, customerId, clearUnmaskedPhone]);

  const handleUnmaskClick = async () => {
    if (!shopId || !customerId) return;
    setIsUnmasking(true);
    await unmaskCustomerPhone15s({
      shopId,
      customerId,
      conversationId,
      reason: "Xác nhận thông tin đơn hàng trong CRM 360",
    });
    setIsUnmasking(false);
  };

  const handleCopyUnmasked = async () => {
    if (!unmaskedSession?.unmaskedPhone) return;
    await navigator.clipboard.writeText(unmaskedSession.unmaskedPhone);
    toast.success(t("copiedPhoneToast"));
  };

  const displayPhone =
    unmaskedSession && remainingSeconds > 0
      ? unmaskedSession.unmaskedPhone
      : phoneMasked || "098***678";

  const isCurrentlyUnmasked = Boolean(unmaskedSession && remainingSeconds > 0);
  const progressPercent = isCurrentlyUnmasked
    ? Math.round((remainingSeconds / 15) * 100)
    : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="inline-flex items-center gap-1.5">
          <span className="font-mono text-xs sm:text-sm font-bold tracking-wider text-foreground">
            {displayPhone}
          </span>
          {isCurrentlyUnmasked ? (
            <GlassBadge variant="success" size="sm" dot pulse>
              {t("unmaskedCountdownBadge", { seconds: remainingSeconds })}
            </GlassBadge>
          ) : (
            <GlassBadge variant="secondary" size="sm">
              <Lock className="w-2.5 h-2.5 mr-0.5 inline" />
              {t("maskedBadge")}
            </GlassBadge>
          )}
        </div>

        <div className="flex items-center gap-1">
          {isCurrentlyUnmasked ? (
            <>
              <GlassIconButton
                size="sm"
                variant="ghost"
                tooltip={t("copyPhoneTooltip")}
                icon={<Copy className="w-3.5 h-3.5" />}
                onClick={handleCopyUnmasked}
              />
              <GlassIconButton
                size="sm"
                variant="ghost"
                color="warning"
                tooltip={t("hideImmediatelyTooltip")}
                icon={<EyeOff className="w-3.5 h-3.5" />}
                onClick={() => clearUnmaskedPhone(customerId)}
              />
            </>
          ) : (
            <PermissionGate can="CRM_PHONE_UNMASK" mode="hide">
              <PatternButton
                type="button"
                size="sm"
                variant="glass"
                color="primary"
                rounded="full"
                isLoading={isUnmasking}
                onClick={handleUnmaskClick}
                className="h-7 px-2.5 text-[11px]"
                icon={<Eye className="w-3 h-3" />}
              >
                {t("unmask15sBtn")}
              </PatternButton>
            </PermissionGate>
          )}

          {onMaskedCall && (
            <PermissionGate can="INBOX_VOIP_CALL_MASKED" mode="hide">
              <GlassIconButton
                size="sm"
                variant="glass"
                color="success"
                tooltip={t("maskedVoipCallTooltip")}
                icon={<PhoneForwarded className="w-3.5 h-3.5" />}
                onClick={onMaskedCall}
              />
            </PermissionGate>
          )}
        </div>
      </div>

      {isCurrentlyUnmasked && unmaskedSession && (
        <div className="space-y-1">
          <Progress value={progressPercent} className="h-1" />
          {!compact && (
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                {t("auditRecordedNote")}
              </span>
              <span>
                {t("quotaRemainingLabel", {
                  remaining: unmaskedSession.remainingQuotaThisHour,
                  limit: unmaskedSession.hourlyQuotaLimit,
                })}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
