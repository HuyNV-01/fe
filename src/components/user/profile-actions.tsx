"use client";

import { useRef } from "react";
import {
  MessageCircle,
  UserX,
  MoreHorizontal,
  Camera,
  Trash2,
} from "lucide-react";
import { ContactStatusEnum } from "@/common/enum";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { IUserProfile } from "@/types/profile";
import { cn } from "@/lib/utils";
import { useProfileActions } from "@/utils/hooks/use-profile-actions";
import { PatternButton } from "../button/button-patterns";
import DropdownMenuContentCus from "../dropdown-menu/dropdown-menu-content-cus";
import ItemMenu from "../dropdown-menu/item-menu";
import { ContactActionButton } from "../chat/add-new-contact";

interface ProfileActionsProps {
  profile: IUserProfile;
  className?: string;
}

export const ProfileActions = ({ profile, className }: ProfileActionsProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    isLoading,
    isUploadingAvatar,
    relationship,
    onAddFriend,
    onAcceptFriend,
    onRemoveContact,
    onSendMessage,
    onUploadAvatar,
    onDeleteAvatar,
  } = useProfileActions(profile);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadAvatar(file);
    }
    e.target.value = "";
  };

  if (profile.isMe) {
    return (
      <div className={cn("flex flex-wrap items-center gap-2.5", className)}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />

        <PatternButton
          size="sm"
          variant="glass"
          color="primary"
          rounded="full"
          isLoading={isUploadingAvatar}
          icon={<Camera className="w-4 h-4" />}
          onClick={() => fileInputRef.current?.click()}
        >
          Đổi ảnh đại diện
        </PatternButton>

        {profile.avatar && (
          <PatternButton
            size="sm"
            variant="ghost"
            color="danger"
            rounded="full"
            disabled={isUploadingAvatar}
            icon={<Trash2 className="w-4 h-4" />}
            onClick={onDeleteAvatar}
          >
            Xóa ảnh
          </PatternButton>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2.5 justify-center md:justify-end",
        className,
      )}
    >
      <ContactActionButton
        contactStatus={relationship}
        isLoading={isLoading}
        onClick={(e) => {
          e.stopPropagation();
          onAddFriend();
        }}
        handleAccept={onAcceptFriend}
        handleRemove={onRemoveContact}
      />
      <PatternButton
        size="sm"
        onClick={onSendMessage}
        rounded="full"
        icon={<MessageCircle className="w-3.5 h-3.5" />}
        variant="solid"
        color="primary"
      >
        Nhắn tin
      </PatternButton>

      {(relationship === ContactStatusEnum.FRIEND ||
        relationship === ContactStatusEnum.PENDING_SENT) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <PatternButton
              variant="glass"
              size="icon"
              rounded="full"
              className="h-8 w-8"
            >
              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
            </PatternButton>
          </DropdownMenuTrigger>
          <DropdownMenuContentCus align="end" className="w-48">
            {relationship === ContactStatusEnum.FRIEND && (
              <ItemMenu
                onClick={onRemoveContact}
                className="text-red-600 focus:text-red-600"
                icon={<UserX className="w-4 h-4 mr-2 text-red-600" />}
              >
                Hủy kết bạn
              </ItemMenu>
            )}
            {relationship === ContactStatusEnum.PENDING_SENT && (
              <ItemMenu
                onClick={onRemoveContact}
                className="text-red-600 focus:text-red-600"
                icon={<UserX className="w-4 h-4 mr-2 text-red-600" />}
              >
                Thu hồi lời mời
              </ItemMenu>
            )}
          </DropdownMenuContentCus>
        </DropdownMenu>
      )}
    </div>
  );
};
