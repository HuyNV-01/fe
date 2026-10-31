"use client";

import { useRef, useState } from "react";
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
import {
  PatternButton,
  DropdownMenuContentCus,
  ItemMenu,
  GlassConfirmDialog,
} from "@/components/toolkit";
import { ContactActionButton } from "../chat/add-new-contact";
import { useTranslations } from "next-intl";

interface ProfileActionsProps {
  profile: IUserProfile;
  className?: string;
}

export const ProfileActions = ({ profile, className }: ProfileActionsProps) => {
  const t = useTranslations("Profile.actions");
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

  const [confirmMode, setConfirmMode] = useState<"AVATAR" | "CONTACT" | null>(
    null,
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadAvatar(file);
    }
    e.target.value = "";
  };

  if (profile.isMe) {
    return (
      <div
        className={cn(
          "flex flex-wrap items-center justify-center md:justify-end gap-2.5",
          className,
        )}
      >
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
          {t("changeAvatar")}
        </PatternButton>

        {profile.avatar && (
          <PatternButton
            size="sm"
            variant="ghost"
            color="danger"
            rounded="full"
            disabled={isUploadingAvatar}
            icon={<Trash2 className="w-4 h-4" />}
            onClick={() => setConfirmMode("AVATAR")}
          >
            {t("deleteAvatar")}
          </PatternButton>
        )}

        <GlassConfirmDialog
          open={Boolean(confirmMode)}
          onOpenChange={(open) => !open && setConfirmMode(null)}
          itemName={t("deleteAvatar")}
          isLoading={isLoading || isUploadingAvatar}
          onConfirm={async () => {
            if (confirmMode === "AVATAR") {
              await onDeleteAvatar();
            }
            setConfirmMode(null);
          }}
        />
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
        handleRemove={() => setConfirmMode("CONTACT")}
      />
      <PatternButton
        size="sm"
        onClick={onSendMessage}
        rounded="full"
        icon={<MessageCircle className="w-3.5 h-3.5" />}
        variant="solid"
        color="primary"
      >
        {t("sendMessage")}
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
                onClick={() => setConfirmMode("CONTACT")}
                className="text-red-600 focus:text-red-600"
                icon={<UserX className="w-4 h-4 mr-2 text-red-600" />}
              >
                {t("unfriend")}
              </ItemMenu>
            )}
            {relationship === ContactStatusEnum.PENDING_SENT && (
              <ItemMenu
                onClick={() => setConfirmMode("CONTACT")}
                className="text-red-600 focus:text-red-600"
                icon={<UserX className="w-4 h-4 mr-2 text-red-600" />}
              >
                {t("revokeRequest")}
              </ItemMenu>
            )}
          </DropdownMenuContentCus>
        </DropdownMenu>
      )}

      <GlassConfirmDialog
        open={Boolean(confirmMode)}
        onOpenChange={(open) => !open && setConfirmMode(null)}
        itemName={confirmMode === "AVATAR" ? t("deleteAvatar") : profile.name}
        isLoading={isLoading || isUploadingAvatar}
        onConfirm={async () => {
          if (confirmMode === "AVATAR") {
            await onDeleteAvatar();
          } else if (confirmMode === "CONTACT") {
            await onRemoveContact();
          }
          setConfirmMode(null);
        }}
      />
    </div>
  );
};
