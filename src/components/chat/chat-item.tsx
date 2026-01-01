"use client";

import type React from "react";
import { memo, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EllipsisVertical, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRelativeTime } from "@/utils/hooks/use-relative-time";
import { getInitials } from "@/utils/helper";
import { useTranslations } from "next-intl";
import { NOTIFICATION_MESSAGES } from "@/constant";

export interface IChatItemProps {
  id: string;
  avatarUrl?: string;
  avatarFallback: string;
  displayName: string;
  timestamp?: Date | string | number;
  subtitle?: React.ReactNode;
  badge?: number | React.ReactNode;
  isOnline?: boolean;
  isSelected?: boolean;
  isTyping?: boolean;
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
    className,
    actions,
    onSelect,
    onMoreOptions,
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
        if (badge === 0) return null;
        return (
          <Badge
            variant="default"
            className="h-5 min-w-5 px-1 flex items-center justify-center text-[10px] rounded-full hover:bg-primary"
          >
            {badge > NOTIFICATION_MESSAGES
              ? `${NOTIFICATION_MESSAGES}+`
              : badge}
          </Badge>
        );
      }
      return badge;
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSelect?.(id);
      }
    };

    return (
      <div
        className={cn(
          "group relative w-full rounded-xl transition-all duration-200",
          "isolate",
          isSelected ? "shadow-sm" : "",
          className,
        )}
        style={{
          willChange: "transform",
        }}
      >
        <div
          className={cn(
            "absolute inset-0 rounded-xl -z-10 transition-colors duration-200",
            isSelected
              ? "bg-accent"
              : "bg-foreground/2 group-hover:bg-accent/50 dark:bg-foreground/3",
          )}
          style={{
            transform: "translateZ(0)",
            WebkitBackfaceVisibility: "hidden",
          }}
        />
        <Button
          variant={"ghost"}
          type="button"
          onClick={handleSelect}
          className=" w-full h-auto flex items-center justify-start gap-3 p-3 rounded-xl text-left font-normal whitespace-normal transition-colors cursor-pointer outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <div className="relative shrink-0">
            <Avatar className="h-12 w-12 border border-border/40 shadow-sm transition-transform group-hover:scale-105">
              <AvatarImage
                src={avatarUrl}
                alt={displayName}
                className="object-cover"
              />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>

            {isOnline && (
              <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-background animate-in fade-in zoom-in duration-300" />
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
              {timeDisplay && (
                <span className="shrink-0 text-[10px] sm:text-xs text-muted-foreground/70 tabular-nums">
                  {timeDisplay}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 w-full">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate flex-1">
                {isTyping ? (
                  <div className="inline-flex items-center py-1 gap-1">
                    <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce"></span>
                  </div>
                ) : typeof subtitle === "string" ? (
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

              <div className="shrink-0 flex items-center gap-2">
                {!isSelected && renderBadge()}
              </div>
            </div>
          </div>
        </Button>

        <div className="absolute right-2 top-1/2 -translate-y-1/2 z-20">
          {actions || (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 rounded-full",
                "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 focus:opacity-100 transition-opacity duration-200",
                "data-[state=open]:opacity-100 bg-background/80 backdrop-blur-sm shadow-sm hover:bg-background",
              )}
              onClick={handleMoreClick}
              aria-label="More options"
            >
              <EllipsisVertical className="h-4 w-4 text-muted-foreground" />
            </Button>
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
