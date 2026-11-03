"use client";

import { useRef, useState } from "react";
import {
  MessageCircle,
  UserX,
  MoreHorizontal,
  Camera,
  Trash2,
  Pencil,
  Shield,
  Ban,
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
  BaseTooltip,
} from "@/components/toolkit";
import { ContactActionButton } from "../chat/add-new-contact";
import { useTranslations } from "next-intl";

interface ProfileActionsProps {
  profile: IUserProfile;
  className?: string;
  onOpenEditModal?: () => void;
  onOpenPrivacyModal?: () => void;
}

export const ProfileActions = ({
  profile,
  className,
  onOpenEditModal,
  onOpenPrivacyModal,
}: ProfileActionsProps) => {
  const t = useTranslations("Profile.actions");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    isLoading,
    isUploadingAvatar,
    relationship,
    onAddFriend,
    onAcceptFriend,
    onRemoveContact,
    onBlockUser,
    onUnblockUser,
    onSendMessage,
    onUploadAvatar,
    onDeleteAvatar,
  } = useProfileActions(profile);

  const [confirmMode, setConfirmMode] = useState<
    "AVATAR" | "CONTACT" | "BLOCK" | "UNBLOCK" | null
  >(null);

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
          "flex flex-wrap items-center justify-center md:justify-end gap-2",
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

        {onOpenEditModal && (
          <PatternButton
            size="sm"
            variant="solid"
            color="primary"
            rounded="full"
            icon={<Pencil className="w-3.5 h-3.5" />}
            onClick={onOpenEditModal}
          >
            {t("editProfile")}
          </PatternButton>
        )}

        {onOpenPrivacyModal && (
          <PatternButton
            size="sm"
            variant="glass"
            color="primary"
            rounded="full"
            icon={<Shield className="w-3.5 h-3.5" />}
            onClick={onOpenPrivacyModal}
          >
            {t("privacySettings")}
          </PatternButton>
        )}

        <PatternButton
          size="sm"
          variant="outline"
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
        "flex flex-wrap items-center gap-2 justify-center md:justify-end",
        className,
      )}
    >
      <ContactActionButton
        contactStatus={relationship}
        isLoading={isLoading}
        disabled={isLoading}
        onClick={(e) => {
          e.stopPropagation();
          onAddFriend();
        }}
        handleAccept={onAcceptFriend}
        handleRemove={() => setConfirmMode("CONTACT")}
      />

      {relationship !== ContactStatusEnum.BLOCKED && (
        <PatternButton
          size="sm"
          onClick={onSendMessage}
          rounded="full"
          disabled={isLoading}
          icon={<MessageCircle className="w-3.5 h-3.5" />}
          variant="solid"
          color="primary"
        >
          {t("sendMessage")}
        </PatternButton>
      )}

      <DropdownMenu>
        <BaseTooltip content={t("moreOptions")}>
          <DropdownMenuTrigger asChild>
            <PatternButton
              variant="glass"
              size="icon"
              rounded="full"
              className="h-8 w-8"
              aria-label={t("moreOptions")}
            >
              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
            </PatternButton>
          </DropdownMenuTrigger>
        </BaseTooltip>
        <DropdownMenuContentCus align="end" className="w-52">
          {relationship === ContactStatusEnum.FRIEND && (
            <ItemMenu
              onClick={() => setConfirmMode("CONTACT")}
              className="text-amber-600 focus:text-amber-600"
              icon={<UserX className="w-4 h-4 mr-2 text-amber-600" />}
            >
              {t("unfriend")}
            </ItemMenu>
          )}
          {relationship === ContactStatusEnum.PENDING_SENT && (
            <ItemMenu
              onClick={() => setConfirmMode("CONTACT")}
              className="text-amber-600 focus:text-amber-600"
              icon={<UserX className="w-4 h-4 mr-2 text-amber-600" />}
            >
              {t("revokeRequest")}
            </ItemMenu>
          )}
          <ItemMenu
            onClick={() =>
              setConfirmMode(
                relationship === ContactStatusEnum.BLOCKED
                  ? "UNBLOCK"
                  : "BLOCK",
              )
            }
            className="text-red-600 focus:text-red-600"
            icon={<Ban className="w-4 h-4 mr-2 text-red-600" />}
          >
            {relationship === ContactStatusEnum.BLOCKED
              ? t("unblockUser")
              : t("blockUser")}
          </ItemMenu>
        </DropdownMenuContentCus>
      </DropdownMenu>

      <GlassConfirmDialog
        open={Boolean(confirmMode)}
        onOpenChange={(open) => !open && setConfirmMode(null)}
        title={
          confirmMode === "BLOCK"
            ? t("blockConfirmTitle")
            : confirmMode === "UNBLOCK"
              ? t("unblockConfirmTitle")
              : undefined
        }
        description={
          confirmMode === "BLOCK"
            ? t("blockConfirmDesc", { name: profile.name || "" })
            : confirmMode === "UNBLOCK"
              ? t("unblockConfirmDesc", { name: profile.name || "" })
              : undefined
        }
        itemName={confirmMode === "AVATAR" ? t("deleteAvatar") : profile.name}
        isLoading={isLoading || isUploadingAvatar}
        onConfirm={async () => {
          if (confirmMode === "AVATAR") {
            await onDeleteAvatar();
          } else if (confirmMode === "CONTACT") {
            await onRemoveContact();
          } else if (confirmMode === "BLOCK") {
            await onBlockUser();
          } else if (confirmMode === "UNBLOCK") {
            await onUnblockUser();
          }
          setConfirmMode(null);
        }}
      />
    </div>
  );
};
