"use client";

import { memo } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  GlassAvatar,
  GlassIconButton,
  PatternButton,
  ButtonBack,
  DropdownMenuContentCus,
  ItemMenu,
} from "@/components/toolkit";
import {
  Phone,
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
  statusText?: string;
  onAudioCall?: () => void;
  onVideoCall?: () => void;
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
    statusText,
    onAudioCall,
    onVideoCall,
    onToggleMute,
    onAddGroupMembers,
    onLeaveGroup,
    onToggleSearch,
    onOpenInfoDrawer,
    onDeleteConversation,
  }: IChatHeaderProps) => {
    const t = useTranslations("Chat.Detail.header");
    const router = useRouter();

    const handleViewProfile = () => {
      if (!isGroupChat && partnerId) {
        router.push(config.routes.private.profile(partnerId));
      }
    };

    return (
      <div className="h-14 sm:h-16 flex items-center justify-between px-3 sm:px-4 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-0 z-10">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
          <div className="md:hidden shrink-0">
            <ButtonBack />
          </div>

          <button
            type="button"
            onClick={handleViewProfile}
            className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 overflow-hidden text-left group/header cursor-pointer"
          >
            <GlassAvatar
              src={avatarUrl}
              name={displayName}
              size="md"
              isOnline={Boolean(!isGroupChat && isOnline)}
              showStatus={Boolean(!isGroupChat && isOnline)}
              className="transition-transform group-hover/header:scale-105"
            />

            <div className="flex flex-col leading-tight min-w-0 flex-1 overflow-hidden">
              <div className="flex items-center gap-1.5 min-w-0">
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
              </div>
              <span className="text-[11px] sm:text-xs text-muted-foreground truncate block">
                {isTyping ? (
                  <span className="text-primary font-medium animate-pulse">
                    {t("status.typing")}
                  </span>
                ) : isGroupChat ? (
                  t("status.groupChat")
                ) : isOnline ? (
                  t("status.active")
                ) : statusText !== EMPTY_STRING ? (
                  t("status.noActive")
                ) : (
                  EMPTY_STRING
                )}
              </span>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          <GlassIconButton
            variant="ghost"
            onClick={onAudioCall}
            tooltip={t("actions.audioCall")}
            className="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-primary hover:bg-primary/10"
            icon={<Phone className="w-4 h-4 sm:w-5 sm:h-5" />}
          />

          <GlassIconButton
            variant="ghost"
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
            <DropdownMenuContentCus align="end" className="w-52">
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
