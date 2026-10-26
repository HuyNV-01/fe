import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ContactStatusEnum } from "@/common/enum";
import { useContactStore } from "@/lib/stores/contact/use-contact-store";
import { useUserStore } from "@/lib/stores/user/use-user-store";
import { useChatStore } from "@/lib/stores/chat/use-chat-store";
import config from "@/config";
import type { IUserProfile } from "@/types/profile";
import { useTranslations } from "next-intl";

export const useProfileActions = (profile: IUserProfile) => {
  const router = useRouter();
  const t = useTranslations("Profile.actions.toast");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const { requestContact, acceptFriend, removeContact, isRequest } =
    useContactStore();
  const { updateRelationship, updateAvatar, deleteAvatar } = useUserStore();
  const { createDirectChat } = useChatStore();

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

  const onSendMessage = useCallback(async () => {
    if (!profile.id) return;
    try {
      const conversation = await createDirectChat({ receiverId: profile.id });
      if (conversation) {
        router.push(config.routes.private.detailChat(conversation));
      }
    } catch {
      toast.error(t("chatError"));
    }
  }, [profile.id, createDirectChat, router, t]);

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

  return {
    isLoading: isRequest,
    isUploadingAvatar,
    relationship: profile.relationship ?? ContactStatusEnum.NONE,
    onAddFriend,
    onAcceptFriend,
    onRemoveContact,
    onSendMessage,
    onUploadAvatar,
    onDeleteAvatar,
  };
};
