"use client";

import { useState } from "react";
import {
  GlassBadge,
  GlassSurfaceCard,
  PatternButton,
} from "@/components/toolkit";
import { PermissionGate } from "@/components/iam/permission-gate";
import { useCrmStore } from "@/lib/stores/crm/use-crm-store";
import type { AdsConversionEventNameType } from "@/types/crm";
import {
  CheckCircle2,
  ExternalLink,
  Megaphone,
  MessageSquare,
  Send,
  ShoppingCart,
  Sparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";

export interface AdAttributionHeaderCardProps {
  shopId?: string | null;
  conversationId?: string;
  customerId?: string | null;
  channelIntegrationId?: string | null;
  interactionType?: string;
  sourcePostId?: string | null;
  sourceAdId?: string | null;
  sourceCampaignId?: string | null;
  ctwaClickId?: string | null;
}

export function AdAttributionHeaderCard({
  shopId,
  conversationId,
  customerId,
  channelIntegrationId,
  interactionType,
  sourcePostId,
  sourceAdId,
  sourceCampaignId,
  ctwaClickId,
}: AdAttributionHeaderCardProps) {
  const t = useTranslations("Crm360.adAttribution");
  const dispatchAdsConversion = useCrmStore((s) => s.dispatchAdsConversion);
  const adsConversionLogs = useCrmStore((s) => s.adsConversionLogs);
  const [sendingEvent, setSendingEvent] =
    useState<AdsConversionEventNameType | null>(null);

  const convLogs = conversationId
    ? adsConversionLogs.filter((l) => l.conversationId === conversationId)
    : [];
  const hasLeadSubmitted = convLogs.some(
    (l) => l.eventName === "LeadSubmitted",
  );
  const hasInitiateCheckout = convLogs.some(
    (l) => l.eventName === "InitiateCheckout",
  );
  const hasPurchaseSent = convLogs.some((l) => l.eventName === "Purchase");

  const handleTriggerCapi = async (eventName: AdsConversionEventNameType) => {
    if (!shopId) return;
    setSendingEvent(eventName);
    await dispatchAdsConversion({
      shopId,
      platform: "META_CAPI",
      eventName,
      conversationId: conversationId || undefined,
      customerId: customerId || undefined,
      channelIntegrationId: channelIntegrationId || undefined,
      ctwaClickId: ctwaClickId || undefined,
      sourceAdId: sourceAdId || undefined,
      valueAmount:
        eventName === "Purchase"
          ? 650000
          : eventName === "InitiateCheckout"
            ? 350000
            : 0,
      currency: "VND",
    });
    setSendingEvent(null);
  };

  const isCommentOrLive =
    interactionType === "COMMENT" || interactionType === "LIVESTREAM";

  return (
    <GlassSurfaceCard className="p-2.5 flex items-center justify-between gap-2 flex-wrap">
      <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
        <GlassBadge variant={isCommentOrLive ? "primary" : "info"} size="sm">
          {isCommentOrLive ? (
            <MessageSquare className="w-3 h-3 mr-1 inline" />
          ) : (
            <Megaphone className="w-3 h-3 mr-1 inline" />
          )}
          {interactionType || "INBOX"}
        </GlassBadge>

        {sourcePostId && (
          <GlassBadge variant="secondary" size="sm">
            Post #{sourcePostId}
          </GlassBadge>
        )}

        {sourceAdId && (
          <GlassBadge variant="warning" size="sm">
            Ad #{sourceAdId}
          </GlassBadge>
        )}

        {sourceCampaignId && (
          <GlassBadge variant="secondary" size="sm">
            Campaign #{sourceCampaignId}
          </GlassBadge>
        )}

        {ctwaClickId && (
          <GlassBadge variant="accent" size="sm">
            <Sparkles className="w-2.5 h-2.5 mr-1 inline" />
            CTWA: {ctwaClickId.slice(0, 12)}...
          </GlassBadge>
        )}

        {hasLeadSubmitted && (
          <GlassBadge variant="success" size="sm">
            <CheckCircle2 className="w-2.5 h-2.5 mr-1 inline" />
            {t("leadSyncedBadge")}
          </GlassBadge>
        )}

        {hasInitiateCheckout && (
          <GlassBadge variant="info" size="sm">
            <CheckCircle2 className="w-2.5 h-2.5 mr-1 inline" />
            {t("checkoutSyncedBadge")}
          </GlassBadge>
        )}

        {hasPurchaseSent && (
          <GlassBadge variant="success" size="sm">
            <CheckCircle2 className="w-2.5 h-2.5 mr-1 inline" />
            {t("purchaseSyncedBadge")}
          </GlassBadge>
        )}
      </div>

      <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
        {shopId && (
          <PermissionGate can="ADS_CAPI_CONFIG_MANAGE" mode="hide">
            <PatternButton
              type="button"
              size="sm"
              variant="glass"
              color="info"
              rounded="full"
              isLoading={sendingEvent === "LeadSubmitted"}
              onClick={() => handleTriggerCapi("LeadSubmitted")}
              className="h-7 px-2.5 text-[11px]"
              icon={<Send className="w-3 h-3" />}
            >
              {t("sendLeadCapiBtn")}
            </PatternButton>

            <PatternButton
              type="button"
              size="sm"
              variant="glass"
              color="warning"
              rounded="full"
              isLoading={sendingEvent === "InitiateCheckout"}
              onClick={() => handleTriggerCapi("InitiateCheckout")}
              className="h-7 px-2.5 text-[11px]"
              icon={<ShoppingCart className="w-3 h-3" />}
            >
              {t("sendCheckoutCapiBtn")}
            </PatternButton>

            <PatternButton
              type="button"
              size="sm"
              variant="glass"
              color="success"
              rounded="full"
              isLoading={sendingEvent === "Purchase"}
              onClick={() => handleTriggerCapi("Purchase")}
              className="h-7 px-2.5 text-[11px]"
              icon={<Send className="w-3 h-3" />}
            >
              {t("sendPurchaseCapiBtn")}
            </PatternButton>
          </PermissionGate>
        )}

        {sourcePostId && (
          <a
            href={`https://facebook.com/${sourcePostId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
          >
            <span>{t("openSourcePost")}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </GlassSurfaceCard>
  );
}
