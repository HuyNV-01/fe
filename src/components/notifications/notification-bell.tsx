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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenuContentCus,
  GlassAvatar,
  GlassBadge,
  GlassTabs,
  GlassEmptyState,
  PatternButton,
  Badge,
} from "@/components/toolkit";
import { cn } from "@/lib/utils";
import { useNotificationStore } from "@/lib/stores/notification/use-notification-store";
import { useChatStore } from "@/lib/stores/chat/use-chat-store";
import { type INotification, NotificationTypeEnum } from "@/types/notification";
import { calculateRelativeTime } from "@/utils/date-helper";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import config from "@/config";
import { resolveNotificationI18n } from "@/utils/notification-i18n";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const locale = useLocale();
  const t = useTranslations("Notifications");
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

  const { fetchMessages, markConversationReadOptimistic } = useChatStore();

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
        markAsRead(item.id);
      }
      setOpen(false);

      const targetConvId =
        item.metadata?.conversationId ||
        (item.resourceType === "CONVERSATION" ? item.resourceId : null);
      const targetMsgId = item.metadata?.messageId;

      if (targetConvId) {
        markConversationReadOptimistic(targetConvId);
        // Pre-fetch messages immediately so the conversation has the latest message ready on arrival
        fetchMessages(targetConvId, 1);

        const baseUrl = config.routes.private.detailChat(targetConvId);
        const finalUrl = targetMsgId
          ? `${baseUrl}?messageId=${encodeURIComponent(targetMsgId)}`
          : baseUrl;
        router.push(finalUrl);
        return;
      }

      if (item.metadata?.actionUrl) {
        router.push(item.metadata.actionUrl);
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
    [markAsRead, markConversationReadOptimistic, fetchMessages, router],
  );

  const renderTypeBadgeIcon = (type: NotificationTypeEnum) => {
    switch (type) {
      case NotificationTypeEnum.NEW_MESSAGE:
        return (
          <Badge className="p-1 rounded-full bg-cyan-500 text-white shadow-xs">
            <MessageSquare className="size-3.5" />
          </Badge>
        );
      case NotificationTypeEnum.MESSAGE_REPLY:
        return (
          <Badge className="p-1 rounded-full bg-indigo-500 text-white shadow-xs">
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
        <PatternButton
          variant="ghost"
          size="icon"
          rounded="full"
          className="relative h-9 w-9 text-slate-700 dark:text-slate-200 hover:bg-white/25 dark:hover:bg-white/10 transition-transform hover:scale-105 cursor-pointer"
          aria-label={t("ariaLabel")}
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-background animate-in zoom-in duration-200">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </PatternButton>
      </DropdownMenuTrigger>

      <DropdownMenuContentCus
        align="end"
        collisionPadding={12}
        className="w-[calc(100vw-1.5rem)] max-w-[360px] sm:w-[380px] sm:max-w-[380px] p-0 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5 border-b border-border/50">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-foreground">{t("title")}</h3>
            {unreadCount > 0 && (
              <GlassBadge variant="primary" size="sm">
                {t("newBadge", { count: unreadCount })}
              </GlassBadge>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllAsRead()}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              {t("markAllRead")}
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="px-4 py-2 bg-muted/30 border-b border-border/40">
          <GlassTabs
            size="sm"
            value={filterMode}
            onValueChange={setFilterMode}
            items={[
              { key: "ALL", label: t("tabs.all") },
              { key: "UNREAD", label: t("tabs.unread"), badge: unreadCount },
            ]}
          />
        </div>

        {/* Notification List */}
        <ScrollArea className="h-[min(360px,65dvh)] w-full">
          <div className="flex flex-col divide-y divide-border/30">
            {notifications.length === 0 && !isLoading && (
              <GlassEmptyState
                icon={<Bell className="w-6 h-6 opacity-70" />}
                title={
                  filterMode === "UNREAD"
                    ? t("empty.unreadTitle")
                    : t("empty.allTitle")
                }
                description={t("empty.description")}
                className="py-10"
              />
            )}

            {notifications.map((item) => {
              const actorName = item.actor?.name || t("systemActor");
              const unreadMsgCount = item.metadata?.unreadMessageCount || 0;
              const localized = resolveNotificationI18n(item, t);

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
                    <GlassAvatar
                      src={item.actor?.avatar}
                      name={actorName}
                      size="md"
                    />
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
                        {localized.title}
                      </p>
                      {unreadMsgCount > 1 && !item.isRead && (
                        <GlassBadge
                          variant="primary"
                          size="sm"
                          className="px-1.5 py-0.2 text-[10px]"
                        >
                          +{unreadMsgCount}
                        </GlassBadge>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                      {localized.content}
                    </p>

                    <span className="text-[10px] text-muted-foreground/80 mt-1 block">
                      {calculateRelativeTime(item.createdAt, locale)}
                    </span>
                  </div>

                  {/* Nút xóa thông báo */}
                  <div className="my-auto flex flex-col items-center justify-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(item.id);
                      }}
                      className="opacity-100 sm:opacity-0 cursor-pointer group-hover:opacity-100 p-1 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-opacity"
                      title={t("deleteTitle")}
                    >
                      <Trash2 className="size-4" />
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
                <PatternButton
                  variant="ghost"
                  color="primary"
                  size="sm"
                  fullWidth
                  rounded="full"
                  onClick={handleLoadMore}
                  className="text-xs text-primary"
                >
                  {t("loadMore")}
                </PatternButton>
              </div>
            )}
          </div>
        </ScrollArea>
      </DropdownMenuContentCus>
    </DropdownMenu>
  );
}
