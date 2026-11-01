import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ContactStatusEnum } from "@/common/enum";
import { useContactStore } from "@/lib/stores/contact/use-contact-store";
import { useUserStore } from "@/lib/stores/user/use-user-store";
import { useChatStore } from "@/lib/stores/chat/use-chat-store";
import config from "@/config";
import type { IUpdateProfilePayload, IUserProfile } from "@/types/profile";
import { useTranslations } from "next-intl";

export const useProfileActions = (profile: IUserProfile) => {
  const router = useRouter();
  const t = useTranslations("Profile.actions.toast");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const {
    requestContact,
    acceptFriend,
    removeContact,
    blockUser,
    unblockUser,
    isRequest,
  } = useContactStore();
  const {
    updateRelationship,
    updateAvatar,
    deleteAvatar,
    updateCover,
    deleteCover,
    updateMyProfile,
  } = useUserStore();
  const { createDirectChat, syncBlockStateForUser } = useChatStore();

  const performAction = async (
    action: () => Promise<any>,
    newStatus: ContactStatusEnum | null,
    successMessage?: string,
  ) => {
    if (!profile.id) return;
    try {
      await action();
      updateRelationship(newStatus);
      if (successMessage) {
        toast.success(successMessage);
      }
    } catch {
      toast.error(t("genericError"));
    }
  };

  const onAddFriend = () =>
    performAction(
      () => requestContact({ data: { targetUserId: profile.id! } }),
      ContactStatusEnum.PENDING_SENT,
      t("requestSent"),
    );

  const onAcceptFriend = () =>
    performAction(
      () => acceptFriend({ data: { senderId: profile.id! } }),
      ContactStatusEnum.FRIEND,
      t("requestAccepted"),
    );

  const onRemoveContact = () =>
    performAction(
      () => removeContact({ data: { targetId: profile.id! } }),
      null,
      t("relationshipUpdated"),
    );

  const onBlockUser = useCallback(async () => {
    if (!profile.id) return false;
    const ok = await blockUser(profile.id, {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      avatar: profile.avatar,
    });
    if (ok) {
      syncBlockStateForUser(profile.id, { blockedByMe: true });
      toast.success(t("userBlocked"));
    } else {
      toast.error(t("genericError"));
    }
    return ok;
  }, [profile, blockUser, syncBlockStateForUser, t]);

  const onUnblockUser = useCallback(async () => {
    if (!profile.id) return false;
    const ok = await unblockUser(profile.id);
    if (ok) {
      syncBlockStateForUser(profile.id, { blockedByMe: false });
      toast.success(t("userUnblocked"));
    } else {
      toast.error(t("genericError"));
    }
    return ok;
  }, [profile.id, unblockUser, syncBlockStateForUser, t]);

  const onSendMessage = useCallback(async () => {
    if (!profile.id || profile.isBlocked) return;
    try {
      const conversation = await createDirectChat({ receiverId: profile.id });
      if (conversation) {
        router.push(config.routes.private.detailChat(conversation));
      }
    } catch {
      toast.error(t("chatError"));
    }
  }, [profile.id, profile.isBlocked, createDirectChat, router, t]);

  const onUploadAvatar = useCallback(
    async (file: File) => {
      if (!file) return;
      setIsUploadingAvatar(true);
      await updateAvatar(file, {
        onSuccess: () => {
          toast.success(t("avatarUpdated"));
        },
        onError: (errMsg) => {
          toast.error(errMsg || t("avatarUploadError"));
        },
      });
      setIsUploadingAvatar(false);
    },
    [updateAvatar, t],
  );

  const onDeleteAvatar = useCallback(async () => {
    setIsUploadingAvatar(true);
    await deleteAvatar({
      onSuccess: () => {
        toast.success(t("avatarDeleted"));
      },
      onError: (errMsg) => {
        toast.error(errMsg || t("avatarDeleteError"));
      },
    });
    setIsUploadingAvatar(false);
  }, [deleteAvatar, t]);

  const onUploadCover = useCallback(
    async (file: File) => {
      if (!file) return;
      setIsUploadingCover(true);
      await updateCover(file, {
        onSuccess: () => {
          toast.success(t("coverUpdated"));
        },
        onError: (errMsg) => {
          toast.error(errMsg || t("coverUploadError"));
        },
      });
      setIsUploadingCover(false);
    },
    [updateCover, t],
  );

  const onDeleteCover = useCallback(async () => {
    setIsUploadingCover(true);
    await deleteCover({
      onSuccess: () => {
        toast.success(t("coverDeleted"));
      },
      onError: (errMsg) => {
        toast.error(errMsg || t("coverDeleteError"));
      },
    });
    setIsUploadingCover(false);
  }, [deleteCover, t]);

  const onSaveProfile = useCallback(
    async (payload: IUpdateProfilePayload) => {
      setIsSavingProfile(true);
      const ok = await updateMyProfile(payload, {
        onSuccess: () => {
          toast.success(t("profileUpdated"));
        },
        onError: (errMsg) => {
          toast.error(errMsg || t("genericError"));
        },
      });
      setIsSavingProfile(false);
      return ok;
    },
    [updateMyProfile, t],
  );

  return {
    isLoading: isRequest,
    isUploadingAvatar,
    isUploadingCover,
    isSavingProfile,
    relationship: profile.relationship ?? ContactStatusEnum.NONE,
    onAddFriend,
    onAcceptFriend,
    onRemoveContact,
    onBlockUser,
    onUnblockUser,
    onSendMessage,
    onUploadAvatar,
    onDeleteAvatar,
    onUploadCover,
    onDeleteCover,
    onSaveProfile,
  };
};
