"use client";

import { memo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Phone, Video, Info } from "lucide-react";
import { EMPTY_STRING } from "@/constant";
import { useTranslations } from "next-intl";
import ButtonBack from "../button/button-back";

interface IChatHeaderProps {
  displayName: string;
  avatarUrl?: string;
  isOnline?: boolean;
  statusText?: string;
}

export const ChatHeader = memo(
  ({ displayName, avatarUrl, isOnline, statusText }: IChatHeaderProps) => {
    const t = useTranslations("Chat.Detail.header");

    return (
      <div className="h-16 flex items-center justify-between px-4 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="md:hidden">
            <ButtonBack />
          </div>

          <div className="relative">
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

          <div className="flex flex-col leading-tight">
            <h2 className="font-semibold text-sm">{displayName}</h2>
            <span className="text-xs text-muted-foreground">
              {isOnline
                ? t("status.active")
                : statusText !== EMPTY_STRING
                  ? t("status.noActive")
                  : EMPTY_STRING}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hidden sm:inline-flex"
          >
            <Phone className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hidden sm:inline-flex"
          >
            <Video className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Info className="w-5 h-5" />
          </Button>
        </div>
      </div>
    );
  },
);

ChatHeader.displayName = "ChatHeader";
