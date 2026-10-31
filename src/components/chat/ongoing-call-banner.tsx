"use client";

import { PhoneCall, Video, Users } from "lucide-react";
import {
  LiquidGlass,
  PatternButton,
  GlassBadge,
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/toolkit";
import { CallTypeEnum } from "@/common/enum";
import type { IActiveCallState } from "@/types/chat";
import { getInitials } from "@/utils/helper";
import { useTranslations } from "next-intl";

interface OngoingCallBannerProps {
  ongoingCall: IActiveCallState | null;
  currentActiveCallId?: string | null;
  onJoinCall: (callType: CallTypeEnum) => void;
}

export function OngoingCallBanner({
  ongoingCall,
  currentActiveCallId,
  onJoinCall,
}: OngoingCallBannerProps) {
  const t = useTranslations("Chat.Detail.call");

  if (!ongoingCall || ongoingCall.callId === currentActiveCallId) {
    return null;
  }

  const participantIds = Object.keys(ongoingCall.participants || {});
  if (participantIds.length === 0) return null;

  const isVideo = ongoingCall.callType === CallTypeEnum.VIDEO;

  return (
    <div className="px-3 sm:px-4 py-1.5 border-t border-emerald-500/20 bg-emerald-500/5">
      <LiquidGlass
        variant="success"
        opacity="10"
        blur="md"
        rounded="2xl"
        isolate={false}
        className="px-3 py-2 border border-emerald-500/30"
        contentClassName="flex items-center justify-between gap-3 flex-wrap"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="relative flex items-center justify-center h-8 w-8 rounded-full bg-emerald-500 text-white shrink-0 shadow-xs">
            <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-40" />
            {isVideo ? (
              <Video className="w-4 h-4 relative z-10" />
            ) : (
              <PhoneCall className="w-4 h-4 relative z-10" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 truncate">
                {isVideo
                  ? t("ongoingVideoBannerTitle")
                  : t("ongoingAudioBannerTitle")}
              </p>
              <GlassBadge variant="success" size="sm" className="shrink-0">
                <Users className="w-3 h-3" />
                {participantIds.length}
              </GlassBadge>
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              {t("ongoingBannerDesc")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex -space-x-2 overflow-hidden">
            {participantIds.slice(0, 4).map((uid) => {
              const info = ongoingCall.membersInfo?.find((m) => m.id === uid);
              return (
                <Avatar
                  key={uid}
                  className="h-6 w-6 border-2 border-background"
                >
                  <AvatarImage src={info?.avatar || undefined} />
                  <AvatarFallback className="text-[9px] bg-emerald-600 text-white font-bold">
                    {getInitials(info?.name || "U")}
                  </AvatarFallback>
                </Avatar>
              );
            })}
          </div>

          <PatternButton
            size="sm"
            variant="solid"
            color="success"
            rounded="full"
            onClick={() => onJoinCall(ongoingCall.callType)}
            className="h-8 px-3.5 text-xs font-semibold shadow-sm"
          >
            {t("joinNowBtn")}
          </PatternButton>
        </div>
      </LiquidGlass>
    </div>
  );
}
