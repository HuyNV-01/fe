"use client";

import { memo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DropdownMenuContentCus from "@/components/dropdown-menu/dropdown-menu-content-cus";
import ItemMenu from "@/components/dropdown-menu/item-menu";
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
} from "lucide-react";
import { EMPTY_STRING } from "@/constant";
import { useTranslations } from "next-intl";
import ButtonBack from "../button/button-back";
import { BaseTooltip } from "@/components/tooltip/base-tooltip";
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
  }: IChatHeaderProps) => {
    const t = useTranslations("Chat.Detail.header");
    const router = useRouter();

    const handleViewProfile = () => {
      if (!isGroupChat && partnerId) {
        router.push(config.routes.private.profile(partnerId));
      }
    };

    return (
      <div className="h-16 flex items-center justify-between px-4 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="md:hidden shrink-0">
            <ButtonBack />
          </div>

          <button
            type="button"
            onClick={handleViewProfile}
            className="flex items-center gap-3 min-w-0 text-left group/header cursor-pointer"
          >
            <div className="relative shrink-0">
              <Avatar className="h-10 w-10 border transition-transform group-hover/header:scale-105">
                <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                  {displayName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {!isGroupChat && isOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-background rounded-full" />
              )}
            </div>

            <div className="flex flex-col leading-tight min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="font-semibold text-sm truncate group-hover/header:text-primary transition-colors">
                  {displayName}
                </h2>
                {isGroupChat ? (
                  <UsersRound className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                )}
              </div>
              <span className="text-xs text-muted-foreground truncate">
                {isTyping ? (
                  <span className="text-primary font-medium animate-pulse">
                    Đang soạn tin nhắn...
                  </span>
                ) : isGroupChat ? (
                  "Cuộc trò chuyện nhóm"
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

        <div className="flex items-center gap-1 shrink-0">
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground rounded-full"
                aria-label="Tùy chọn hội thoại"
              >
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContentCus align="end" className="w-52">
              {!isGroupChat && partnerId && (
                <ItemMenu
                  onClick={handleViewProfile}
                  icon={<User className="w-4 h-4 mr-2" />}
                >
                  Xem hồ sơ cá nhân
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
                {isMuted ? "Bật thông báo" : "Tắt thông báo"}
              </ItemMenu>

              {isGroupChat && isAdmin && (
                <ItemMenu
                  onClick={onAddGroupMembers}
                  icon={<UserPlus className="w-4 h-4 mr-2" />}
                >
                  Thêm thành viên
                </ItemMenu>
              )}

              {isGroupChat && (
                <ItemMenu
                  onClick={onLeaveGroup}
                  className="text-red-600 focus:text-red-600"
                  icon={<LogOut className="w-4 h-4 mr-2 text-red-600" />}
                >
                  Rời khỏi nhóm
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
