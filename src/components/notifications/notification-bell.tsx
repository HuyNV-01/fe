/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <explanation> */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
"use client";

import type React from "react";
import { useState, useCallback } from "react";
import {
  Bell,
  CheckCheck,
  MessageSquare,
  UserPlus,
  UserCheck,
  UsersRound,
  PhoneMissed,
  Heart,
  Reply,
  Trash2,
  Sparkles,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DropdownMenuContentCus from "@/components/dropdown-menu/dropdown-menu-content-cus";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useNotificationStore } from "@/lib/stores/notification/use-notification-store";
import { type INotification, NotificationTypeEnum } from "@/types/notification";
import { calculateRelativeTime } from "@/utils/date-helper";
import { getInitials } from "@/utils/helper";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import config from "@/config";
import { Badge } from "../ui/badge";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const locale = useLocale();
  const router = useRouter();

  const {
    notifications,
    unreadCount,
    isLoading,
    filterMode,
    meta,
    setFilterMode,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
  } = useNotificationStore();

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      fetchNotifications({
        page: 1,
        isRead: filterMode === "UNREAD" ? false : undefined,
      });
    }
  };

  const handleSelectNotification = useCallback(
    async (item: INotification) => {
      if (!item.isRead) {
        await markAsRead(item.id);
      }
      setOpen(false);

      if (item.metadata?.actionUrl) {
        router.push(item.metadata.actionUrl);
        return;
      }

      if (item.metadata?.conversationId) {
        router.push(
          config.routes.private.detailChat(item.metadata.conversationId),
        );
        return;
      }

      if (item.type === NotificationTypeEnum.FRIEND_REQUEST) {
        router.push(`${config.routes.private.directory}?tab=PENDING_RECEIVED`);
        return;
      }

      if (item.type === NotificationTypeEnum.FRIEND_ACCEPTED && item.actorId) {
        router.push(config.routes.private.profile(item.actorId));
      }
    },
    [markAsRead, router],
  );

  const renderTypeBadgeIcon = (type: NotificationTypeEnum) => {
    switch (type) {
      case NotificationTypeEnum.NEW_MESSAGE:
        return (
          <Badge className="p-1 rounded-full bg-cyan-500 shadow-xs">
            <MessageSquare className="size-3.5" />
          </Badge>
        );
      case NotificationTypeEnum.MESSAGE_REPLY:
        return (
          <Badge className="p-1 rounded-full bg-indigo-500 shadow-xs">
            <Reply className="size-3.5" />
          </Badge>
        );
      case NotificationTypeEnum.MESSAGE_REACTION:
        return (
          <Badge className="p-1 rounded-full bg-pink-500 text-white shadow-xs">
            <Heart className="size-3.5 fill-current" />
          </Badge>
        );
      case NotificationTypeEnum.FRIEND_REQUEST:
        return (
          <Badge className="p-1 rounded-full bg-amber-500 text-white shadow-xs">
            <UserPlus className="size-3.5" />
          </Badge>
        );
      case NotificationTypeEnum.FRIEND_ACCEPTED:
        return (
          <Badge className="p-1 rounded-full bg-emerald-500 text-white shadow-xs">
            <UserCheck className="size-3.5" />
          </Badge>
        );
      case NotificationTypeEnum.GROUP_INVITE:
      case NotificationTypeEnum.GROUP_MEMBER_ADDED:
        return (
          <Badge className="p-1 rounded-full bg-purple-500 text-white shadow-xs">
            <UsersRound className="size-3.5" />
          </Badge>
        );
      case NotificationTypeEnum.MISSED_CALL:
        return (
          <Badge className="p-1 rounded-full bg-red-500 text-white shadow-xs">
            <PhoneMissed className="size-3.5" />
          </Badge>
        );
      default:
        return (
          <Badge className="p-1 rounded-full bg-primary text-primary-foreground shadow-xs">
            <Sparkles className="size-3.5" />
          </Badge>
        );
    }
  };

  const hasMore = meta ? meta.page < meta.totalPages : false;

  const handleLoadMore = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!meta || isLoading) return;
    fetchNotifications({
      page: meta.page + 1,
      isRead: filterMode === "UNREAD" ? false : undefined,
    });
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-full text-slate-700 dark:text-slate-200 hover:bg-white/25 dark:hover:bg-white/10 transition-transform hover:scale-105 cursor-pointer"
          aria-label="Thông báo"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-background animate-in zoom-in duration-200">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContentCus
        align="end"
        className="w-[340px] sm:w-[380px] p-0 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5 border-b border-border/50">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-foreground">Thông báo</h3>
            {unreadCount > 0 && (
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary">
                {unreadCount} mới
              </span>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllAsRead()}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Đọc tất cả
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 px-4 py-2 bg-muted/30 border-b border-border/40">
          <button
            type="button"
            onClick={() => setFilterMode("ALL")}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer",
              filterMode === "ALL"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            Tất cả
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("UNREAD")}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer",
              filterMode === "UNREAD"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            Chưa đọc
          </button>
        </div>

        {/* Notification List */}
        <ScrollArea className="h-[360px] w-full">
          <div className="flex flex-col divide-y divide-border/30">
            {notifications.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="p-3 rounded-full bg-muted/60 text-muted-foreground mb-2.5">
                  <Bell className="w-6 h-6 opacity-60" />
                </div>
                <p className="text-sm font-medium text-foreground/80">
                  {filterMode === "UNREAD"
                    ? "Không có thông báo chưa đọc"
                    : "Chưa có thông báo nào"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Các cập nhật mới về tin nhắn, lời mời kết bạn và cuộc gọi sẽ
                  xuất hiện tại đây.
                </p>
              </div>
            )}

            {notifications.map((item) => {
              const actorName = item.actor?.name || "Hệ thống";
              const unreadMsgCount = item.metadata?.unreadMessageCount || 0;

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectNotification(item)}
                  className={cn(
                    "group relative flex items-start gap-3 px-4 py-3 text-left transition-colors cursor-pointer",
                    item.isRead
                      ? "hover:bg-accent/40 opacity-85"
                      : "bg-primary/5 dark:bg-primary/10 hover:bg-primary/10 dark:hover:bg-primary/15",
                  )}
                >
                  <div className="relative shrink-0 mt-0.5">
                    <Avatar className="h-10 w-10 border border-border/50">
                      <AvatarImage
                        src={item.actor?.avatar || undefined}
                        alt={actorName}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                        {getInitials(actorName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1">
                      {renderTypeBadgeIcon(item.type)}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 pr-5">
                    <div className="flex items-center gap-1.5">
                      <p
                        className={cn(
                          "text-xs leading-snug truncate",
                          item.isRead
                            ? "font-medium text-foreground/90"
                            : "font-bold text-foreground",
                        )}
                      >
                        {item.title}
                      </p>
                      {unreadMsgCount > 1 && !item.isRead && (
                        <span className="shrink-0 rounded-full bg-primary/15 px-1.5 py-0.2 text-[10px] font-bold text-primary">
                          +{unreadMsgCount}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                      {item.content}
                    </p>

                    <span className="text-[10px] text-muted-foreground/80 mt-1 block">
                      {calculateRelativeTime(item.createdAt, locale)}
                    </span>
                  </div>

                  {/* Chấm xanh chưa đọc + nút xóa */}
                  <div className="my-auto flex flex-col items-center justify-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(item.id);
                      }}
                      className="opacity-0 cursor-pointer group-hover:opacity-100 p-1 rounded-full hover:bg-destructive/10 text-foreground hover:text-destructive transition-opacity"
                      title="Xóa thông báo"
                    >
                      <Trash2 className="size-4.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-primary/70" />
              </div>
            )}

            {hasMore && !isLoading && (
              <div className="p-2 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLoadMore}
                  className="w-full text-xs text-primary"
                >
                  Xem thêm thông báo cũ
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </DropdownMenuContentCus>
    </DropdownMenu>
  );
}
