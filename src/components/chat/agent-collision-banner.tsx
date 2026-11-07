"use client";

import React from "react";
import { Lock, ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { GlassAlert, GlassAvatar, PatternButton } from "@/components/toolkit";
import { PermissionGate } from "@/components/iam/permission-gate";

export interface AgentCollisionBannerProps {
  holderAgentId: string;
  holderAgentName: string;
  holderAgentAvatar?: string | null;
  currentUserId: string;
  onForceTakeOver: () => void;
}

export const AgentCollisionBanner = ({
  holderAgentId,
  holderAgentName,
  holderAgentAvatar,
  currentUserId,
  onForceTakeOver,
}: AgentCollisionBannerProps) => {
  const t = useTranslations("OmnichannelInbox.collision");

  if (!holderAgentId || holderAgentId === currentUserId) {
    return null;
  }

  return (
    <GlassAlert
      variant="warning"
      className="mx-3 mt-2 py-2 px-3"
      icon={
        <GlassAvatar
          src={holderAgentAvatar}
          name={holderAgentName}
          size="xs"
          isOnline
          showStatus
        />
      }
      title={
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
          <Lock className="w-3.5 h-3.5 text-amber-500" />
          {t("lockedByAgent", { agentName: holderAgentName })}
        </span>
      }
      action={
        <PermissionGate can="INBOX_COLLISION_FORCE_TAKEOVER" mode="hide">
          <PatternButton
            variant="solid"
            color="warning"
            size="sm"
            rounded="full"
            onClick={onForceTakeOver}
          >
            <ShieldAlert className="w-3.5 h-3.5 mr-1" />
            {t("takeOverBtn")}
          </PatternButton>
        </PermissionGate>
      }
    />
  );
};
