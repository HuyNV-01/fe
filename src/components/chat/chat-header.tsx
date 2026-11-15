"use client";

import { memo } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  GlassAvatar,
  GlassBadge,
  GlassIconButton,
  PatternButton,
  ButtonBack,
  DropdownMenuContentCus,
  ItemMenu,
} from "@/components/toolkit";
import { PermissionGate } from "@/components/iam/permission-gate";
import {
  Phone,
  PhoneForwarded,
  Video,
  Bell,
  BellOff,
  ShieldCheck,
  MoreVertical,
  UserPlus,
  LogOut,
  User,
  UsersRound,
  Search,
  FolderOpen,
  Trash2,
  AlarmClock,
  Bookmark,
  AlertTriangle,
  Megaphone,
  Store,
} from "lucide-react";
import { EMPTY_STRING } from "@/constant";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import config from "@/config";

interface IChatHeaderProps {
  displayName: string;
  avatarUrl?: string | null;
  isOnline?: boolean;
  isTyping?: boolean;
  isMuted?: boolean;
  isGroupChat?: boolean;
  isAdmin?: boolean;
  partnerId?: string;
  isBlocked?: boolean;
  statusText?: string;
  shopId?: string | null;
  channelType?: string | null;
  pageName?: string | null;
  pageShortCode?: string | null;
  channelAvatarUrl?: string | null;
  externalPageId?: string | null;
  interactionType?: "INBOX" | "COMMENT" | "LIVESTREAM" | "MARKETPLACE" | null;
  sourceAdId?: string | null;
  sourcePostId?: string | null;
  isGhostedByAgent?: boolean;
  isSlaBreached?: boolean;
  snoozedUntilAt?: string | null;
  onAudioCall?: () => void;
  onVideoCall?: () => void;
  onMaskedVoipCall?: () => void;
  onOpenSnoozeAndTimeline?: () => void;
  onOpenBookmarksSheet?: () => void;
  onToggleMute?: () => void;
  onAddGroupMembers?: () => void;
  onLeaveGroup?: () => void;
  onToggleSearch?: () => void;
  onOpenInfoDrawer?: () => void;
  onDeleteConversation?: () => void;
}

export const ChatHeader = memo(
  ({
    displayName,
    avatarUrl,
    isOnline,
    isTyping,
    isMuted,
    isGroupChat = false,
    isAdmin = false,
    partnerId,
    isBlocked = false,
    statusText,
    shopId,
    channelType,
    pageName,
    pageShortCode,
    channelAvatarUrl,
    externalPageId,
    interactionType,
    sourceAdId,
    sourcePostId,
    isGhostedByAgent = false,
    isSlaBreached = false,
    snoozedUntilAt,
    onAudioCall,
    onVideoCall,
    onMaskedVoipCall,
    onOpenSnoozeAndTimeline,
    onOpenBookmarksSheet,
    onToggleMute,
    onAddGroupMembers,
    onLeaveGroup,
    onToggleSearch,
    onOpenInfoDrawer,
    onDeleteConversation,
  }: IChatHeaderProps) => {
    const t = useTranslations("Chat.Detail.header");
    const tInbox = useTranslations("OmnichannelInbox");
    const router = useRouter();

    const handleViewProfile = () => {
      if (!isGroupChat && partnerId) {
        router.push(config.routes.private.profile(partnerId));
      }
    };

    const hasPageIdentity = Boolean(
      pageName || pageShortCode || channelAvatarUrl,
    );

    return (
      <div className="min-h-14 sm:min-h-16 py-1.5 flex items-center justify-between px-3 sm:px-4 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-0 z-10 gap-2">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
          <div className="md:hidden shrink-0">
            <ButtonBack />
          </div>

          <button
            type="button"
            onClick={handleViewProfile}
            className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 overflow-hidden text-left group/header cursor-pointer"
          >
            <div className="relative shrink-0">
              <GlassAvatar
                src={avatarUrl}
                name={displayName}
                size="md"
                isOnline={Boolean(!isGroupChat && !isBlocked && isOnline)}
                showStatus={Boolean(!isGroupChat && !isBlocked && isOnline)}
                className="transition-transform group-hover/header:scale-105"
              />
            </div>

            <div className="flex flex-col leading-tight min-w-0 flex-1 overflow-hidden gap-0.5">
              <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                <h2
                  title={displayName}
                  className="font-semibold text-sm truncate min-w-0 max-w-full group-hover/header:text-primary transition-colors"
                >
                  {displayName}
                </h2>
                {isGroupChat ? (
                  <UsersRound className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                )}

                {interactionType &&
                  (interactionType === "COMMENT" ||
                    interactionType === "LIVESTREAM") && (
                    <GlassBadge
                      variant="accent"
                      size="sm"
                      className="text-[10px] py-0 px-1.5"
                    >
                      {interactionType === "LIVESTREAM"
                        ? "Livestream"
                        : t("commentModeBadge")}
                    </GlassBadge>
                  )}

                {sourceAdId && (
                  <GlassBadge
                    variant="info"
                    size="sm"
                    className="hidden sm:inline-flex text-[10px] py-0 px-1.5"
                  >
                    <Megaphone className="w-2.5 h-2.5 mr-1 inline" />
                    {tInbox("adAttribution.fromAdBadge", { adId: sourceAdId })}
                  </GlassBadge>
                )}

                {!sourceAdId && sourcePostId && (
                  <GlassBadge
                    variant="secondary"
                    size="sm"
                    className="hidden sm:inline-flex text-[10px] py-0 px-1.5"
                  >
                    {tInbox("adAttribution.fromPostBadge", {
                      postId: sourcePostId,
                    })}
                  </GlassBadge>
                )}

                {isGhostedByAgent && (
                  <GlassBadge
                    variant="danger"
                    size="sm"
                    dot
                    pulse
                    className="text-[10px] py-0 px-1.5"
                  >
                    <AlertTriangle className="w-2.5 h-2.5 mr-0.5 inline" />
                    {tInbox("filters.slaBreached")}
                  </GlassBadge>
                )}

                {!isGhostedByAgent && isSlaBreached && (
                  <GlassBadge
                    variant="warning"
                    size="sm"
                    className="text-[10px] py-0 px-1.5"
                  >
                    {tInbox("filters.slaBreached")}
                  </GlassBadge>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground truncate">
                {isTyping ? (
                  <span className="text-primary font-medium animate-pulse">
                    {t("status.typing")}
                  </span>
                ) : hasPageIdentity ? (
                  <span className="truncate">
                    {t("messagingViaPageLabel", {
                      pageName:
                        pageName || pageShortCode || channelType || "Fanpage",
                    })}
                  </span>
                ) : isGroupChat ? (
                  <span>{t("status.groupChat")}</span>
                ) : isOnline ? (
                  <span>{t("status.active")}</span>
                ) : statusText !== EMPTY_STRING ? (
                  <span>{t("status.noActive")}</span>
                ) : (
                  <span>{EMPTY_STRING}</span>
                )}
              </div>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          {shopId && onMaskedVoipCall && (
            <PermissionGate can="INBOX_VOIP_CALL_MASKED" mode="hide">
              <PatternButton
                type="button"
                variant="glass"
                color="success"
                size="sm"
                rounded="full"
                onClick={onMaskedVoipCall}
                className="hidden lg:inline-flex h-8 px-2.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mr-1"
                icon={<PhoneForwarded className="w-3.5 h-3.5" />}
              >
                {tInbox("composer.maskedCallBtn")}
              </PatternButton>
            </PermissionGate>
          )}

          {shopId && onOpenSnoozeAndTimeline && (
            <GlassIconButton
              variant={snoozedUntilAt ? "solid" : "ghost"}
              color={snoozedUntilAt ? "warning" : "neutral"}
              onClick={onOpenSnoozeAndTimeline}
              tooltip={tInbox("composer.snoozeBtn")}
              className="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-amber-500"
              icon={<AlarmClock className="w-4 h-4 sm:w-5 sm:h-5" />}
            />
          )}

          {shopId && onOpenBookmarksSheet && (
            <GlassIconButton
              variant="ghost"
              onClick={onOpenBookmarksSheet}
              tooltip={tInbox("composer.bookmarksBtn")}
              className="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-sky-500"
              icon={<Bookmark className="w-4 h-4 sm:w-5 sm:h-5" />}
            />
          )}

          <GlassIconButton
            variant="ghost"
            disabled={isBlocked}
            onClick={onAudioCall}
            tooltip={t("actions.audioCall")}
            className="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-primary hover:bg-primary/10"
            icon={<Phone className="w-4 h-4 sm:w-5 sm:h-5" />}
          />

          <GlassIconButton
            variant="ghost"
            disabled={isBlocked}
            onClick={onVideoCall}
            tooltip={t("actions.videoCall")}
            className="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-primary hover:bg-primary/10"
            icon={<Video className="w-4 h-4 sm:w-5 sm:h-5" />}
          />

          <GlassIconButton
            variant="ghost"
            onClick={onToggleSearch}
            tooltip={t("actions.searchInChat")}
            className="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-primary hover:bg-primary/10"
            icon={<Search className="w-4 h-4 sm:w-5 sm:h-5" />}
          />

          <GlassIconButton
            variant="ghost"
            onClick={onOpenInfoDrawer}
            tooltip={t("actions.openVaultAndSettings")}
            className="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-primary hover:bg-primary/10"
            icon={<FolderOpen className="w-4 h-4 sm:w-5 sm:h-5" />}
          />

          <div className="hidden sm:inline-flex">
            <GlassIconButton
              variant="ghost"
              onClick={onToggleMute}
              tooltip={isMuted ? t("actions.unmute") : t("actions.mute")}
              className="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-foreground"
              icon={
                isMuted ? (
                  <BellOff className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                ) : (
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                )
              }
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <PatternButton
                variant="ghost"
                size="icon"
                rounded="full"
                className="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-foreground"
                aria-label={t("actions.moreOptions")}
              >
                <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
              </PatternButton>
            </DropdownMenuTrigger>
            <DropdownMenuContentCus align="end" className="w-56">
              {shopId && onMaskedVoipCall && (
                <ItemMenu
                  onClick={onMaskedVoipCall}
                  icon={
                    <PhoneForwarded className="w-4 h-4 mr-2 text-emerald-500" />
                  }
                >
                  {tInbox("composer.maskedCallBtn")}
                </ItemMenu>
              )}

              {shopId && onOpenSnoozeAndTimeline && (
                <ItemMenu
                  onClick={onOpenSnoozeAndTimeline}
                  icon={<AlarmClock className="w-4 h-4 mr-2 text-amber-500" />}
                >
                  {tInbox("composer.snoozeBtn")}
                </ItemMenu>
              )}

              {!isGroupChat && partnerId && (
                <ItemMenu
                  onClick={handleViewProfile}
                  icon={<User className="w-4 h-4 mr-2" />}
                >
                  {t("actions.viewProfile")}
                </ItemMenu>
              )}

              <ItemMenu
                onClick={onToggleMute}
                icon={
                  isMuted ? (
                    <Bell className="w-4 h-4 mr-2" />
                  ) : (
                    <BellOff className="w-4 h-4 mr-2" />
                  )
                }
              >
                {isMuted ? t("actions.unmute") : t("actions.mute")}
              </ItemMenu>

              <ItemMenu
                onClick={onOpenInfoDrawer}
                icon={<FolderOpen className="w-4 h-4 mr-2" />}
              >
                {t("actions.openVaultAndSettings")}
              </ItemMenu>

              <ItemMenu
                onClick={onDeleteConversation}
                className="text-red-600 focus:text-red-600"
                icon={<Trash2 className="w-4 h-4 mr-2 text-red-600" />}
              >
                {t("actions.deleteConversation")}
              </ItemMenu>

              {isGroupChat && isAdmin && (
                <ItemMenu
                  onClick={onAddGroupMembers}
                  icon={<UserPlus className="w-4 h-4 mr-2" />}
                >
                  {t("actions.addMembers")}
                </ItemMenu>
              )}

              {isGroupChat && (
                <ItemMenu
                  onClick={onLeaveGroup}
                  className="text-red-600 focus:text-red-600"
                  icon={<LogOut className="w-4 h-4 mr-2 text-red-600" />}
                >
                  {t("actions.leaveGroup")}
                </ItemMenu>
              )}
            </DropdownMenuContentCus>
          </DropdownMenu>
        </div>
      </div>
    );
  },
);

ChatHeader.displayName = "ChatHeader";
