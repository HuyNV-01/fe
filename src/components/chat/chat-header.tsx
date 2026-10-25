"use client";

import { memo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Phone, Video, Bell, BellOff, ShieldCheck } from "lucide-react";
import { EMPTY_STRING } from "@/constant";
import { useTranslations } from "next-intl";
import ButtonBack from "../button/button-back";
import { BaseTooltip } from "@/components/tooltip/base-tooltip";

interface IChatHeaderProps {
  displayName: string;
  avatarUrl?: string;
  isOnline?: boolean;
  isTyping?: boolean;
  isMuted?: boolean;
  statusText?: string;
  onAudioCall?: () => void;
  onVideoCall?: () => void;
  onToggleMute?: () => void;
}

export const ChatHeader = memo(
  ({
    displayName,
    avatarUrl,
    isOnline,
    isTyping,
    isMuted,
    statusText,
    onAudioCall,
    onVideoCall,
    onToggleMute,
  }: IChatHeaderProps) => {
    const t = useTranslations("Chat.Detail.header");

    return (
      <div className="h-16 flex items-center justify-between px-4 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="md:hidden">
            <ButtonBack />
          </div>

          <div className="relative shrink-0">
            <Avatar className="h-10 w-10 border">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback>
                {displayName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {isOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-background rounded-full" />
            )}
          </div>

          <div className="flex flex-col leading-tight min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="font-semibold text-sm truncate">{displayName}</h2>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            </div>
            <span className="text-xs text-muted-foreground truncate">
              {isTyping ? (
                <span className="text-primary font-medium animate-pulse">
                  Đang soạn tin nhắn...
                </span>
              ) : isOnline ? (
                t("status.active")
              ) : statusText !== EMPTY_STRING ? (
                t("status.noActive")
              ) : (
                EMPTY_STRING
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <BaseTooltip content="Gọi thoại">
            <Button
              variant="ghost"
              size="icon"
              onClick={onAudioCall}
              className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full"
            >
              <Phone className="w-5 h-5" />
            </Button>
          </BaseTooltip>

          <BaseTooltip content="Gọi video">
            <Button
              variant="ghost"
              size="icon"
              onClick={onVideoCall}
              className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full"
            >
              <Video className="w-5 h-5" />
            </Button>
          </BaseTooltip>

          <BaseTooltip content={isMuted ? "Bật thông báo" : "Tắt thông báo"}>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleMute}
              className="text-muted-foreground hover:text-foreground rounded-full"
            >
              {isMuted ? (
                <BellOff className="w-5 h-5 text-amber-500" />
              ) : (
                <Bell className="w-5 h-5" />
              )}
            </Button>
          </BaseTooltip>
        </div>
      </div>
    );
  },
);

ChatHeader.displayName = "ChatHeader";
