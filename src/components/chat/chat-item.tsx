"use client";

import type React from "react";
import { memo, useMemo } from "react";
import {
  GlassAvatar,
  GlassBadge,
  PatternButton,
  Skeleton,
} from "@/components/toolkit";
import { BellOff, EllipsisVertical, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRelativeTime } from "@/utils/hooks/use-relative-time";
import { getInitials } from "@/utils/helper";
import { useTranslations } from "next-intl";
import { NOTIFICATION_MESSAGES } from "@/constant";
import { GroupAvatar } from "./group-avatar";

export interface IChatItemProps {
  id: string;
  avatarUrl?: string | null;
  avatarFallback: string;
  displayName: string;
  timestamp?: Date | string | number;
  subtitle?: React.ReactNode;
  badge?: number | React.ReactNode;
  isOnline?: boolean;
  isSelected?: boolean;
  isTyping?: boolean;
  isMuted?: boolean;
  className?: string;
  actions?: React.ReactNode;
  onSelect?: (id: string) => void;
  onMoreOptions?: (id: string, e: React.MouseEvent) => void;
  groupAvatars?: string[];
}

export const ChatItem = memo(
  ({
    id,
    avatarUrl,
    avatarFallback,
    displayName,
    timestamp,
    subtitle,
    badge,
    isOnline = false,
    isSelected = false,
    isTyping = false,
    isMuted = false,
    className,
    actions,
    onSelect,
    onMoreOptions,
    groupAvatars,
  }: IChatItemProps) => {
    const handleSelect = () => onSelect?.(id);
    const t = useTranslations("Chat.Sidebar");

    const handleMoreClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onMoreOptions?.(id, e);
    };

    const timeDisplay = useRelativeTime(timestamp);
    const initials = useMemo(
      () => getInitials(avatarFallback || displayName),
      [avatarFallback, displayName],
    );

    const renderBadge = () => {
      if (!badge) return null;
      if (typeof badge === "number") {
        if (badge <= 0) return null;
        return (
          <GlassBadge
            variant="primary"
            size="sm"
            className="h-5 min-w-5 px-1.5 flex items-center justify-center text-[10px] bg-primary text-primary-foreground"
          >
            {badge > NOTIFICATION_MESSAGES
              ? `${NOTIFICATION_MESSAGES}+`
              : badge}
          </GlassBadge>
        );
      }
      return badge;
    };

    return (
      <div
        className={cn(
          "group relative w-full rounded-xl transition-all duration-200 isolate",
          isSelected ? "shadow-xs" : "",
          className,
        )}
      >
        <div
          className={cn(
            "absolute inset-0 rounded-xl -z-10 transition-colors duration-200",
            isSelected
              ? "bg-accent"
              : "bg-foreground/2 group-hover:bg-accent/50 dark:bg-foreground/3",
          )}
        />
        <div className="flex items-center w-full pr-2 rounded-xl">
          <button
            type="button"
            onClick={handleSelect}
            className="flex-1 min-w-0 h-auto flex items-center justify-start gap-3 p-2.5 sm:p-3 rounded-xl text-left font-normal whitespace-normal hover:bg-transparent cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="relative shrink-0">
              {groupAvatars && groupAvatars.length >= 2 ? (
                <>
                  <GroupAvatar
                    url={avatarUrl || undefined}
                    members={groupAvatars}
                    fallback={initials}
                  />
                  {isOnline && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full bg-emerald-500 ring-2 ring-background" />
                  )}
                </>
              ) : (
                <GlassAvatar
                  src={avatarUrl}
                  name={displayName}
                  size="lg"
                  isOnline={isOnline}
                  showStatus={isOnline}
                  className="transition-transform group-hover:scale-105"
                />
              )}
            </div>

            <div className="flex flex-1 flex-col overflow-hidden min-w-0 gap-1">
              <div className="flex items-center justify-between gap-2 w-full">
                <h3
                  className={cn(
                    "truncate text-sm font-semibold leading-none",
                    isSelected ? "text-foreground" : "text-foreground/90",
                  )}
                >
                  {displayName}
                </h3>
                <div className="flex items-center gap-1 shrink-0">
                  {isMuted && (
                    <BellOff className="w-3 h-3 text-muted-foreground/70" />
                  )}
                  {timeDisplay && (
                    <span className="text-[10px] sm:text-xs text-muted-foreground/70 tabular-nums">
                      {timeDisplay}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 w-full">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate flex-1 min-w-0">
                  {isTyping ? (
                    <div className="inline-flex items-center py-1 gap-1">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                    </div>
                  ) : typeof subtitle === "string" ||
                    subtitle === null ||
                    subtitle === undefined ? (
                    <>
                      <MessageCircle className="h-3 w-3 shrink-0 opacity-60" />
                      <span className="truncate">
                        {subtitle || t("item.noMessages")}
                      </span>
                    </>
                  ) : (
                    <div className="truncate w-full">{subtitle}</div>
                  )}
                </div>

                <div className="shrink-0 flex items-center gap-1.5">
                  {!isSelected && renderBadge()}
                </div>
              </div>
            </div>
          </button>

          {(actions || onMoreOptions) && (
            <div className="shrink-0 z-10">
              {actions || (
                <PatternButton
                  variant="ghost"
                  size="icon"
                  rounded="full"
                  className={cn(
                    "h-8 w-8",
                    "opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity duration-200",
                    "data-[state=open]:opacity-100 bg-background/80 backdrop-blur-sm shadow-xs hover:bg-background",
                  )}
                  onClick={handleMoreClick}
                  aria-label={t("item.moreOptions")}
                >
                  <EllipsisVertical className="h-4 w-4 text-muted-foreground" />
                </PatternButton>
              )}
            </div>
          )}
        </div>
      </div>
    );
  },
);

ChatItem.displayName = "ChatItem";

export const ChatItemSkeleton = () => {
  return (
    <div className="flex items-center gap-3 p-3 w-full rounded-xl">
      <Skeleton className="h-12 w-12 rounded-full shrink-0" />
      <div className="space-y-2 flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-10" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-4 w-4 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default ChatItem;
