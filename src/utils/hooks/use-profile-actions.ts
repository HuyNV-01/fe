import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ContactStatusEnum } from "@/common/enum";
import { useContactStore } from "@/lib/stores/contact/use-contact-store";
import { useUserStore } from "@/lib/stores/user/use-user-store";
import { useChatStore } from "@/lib/stores/chat/use-chat-store";
import config from "@/config";
import type { IUserProfile } from "@/types/profile";

export const useProfileActions = (profile: IUserProfile) => {
  const router = useRouter();
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
      toast.error("Đã có lỗi xảy ra, vui lòng thử lại.");
    }
  };

  const onAddFriend = () =>
    performAction(
      () => requestContact({ data: { targetUserId: profile.id! } }),
      ContactStatusEnum.PENDING_SENT,
      "Đã gửi lời mời kết bạn",
    );

  const onAcceptFriend = () =>
    performAction(
      () => acceptFriend({ data: { senderId: profile.id! } }),
      ContactStatusEnum.FRIEND,
      "Đã chấp nhận lời mời kết bạn",
    );

  const onRemoveContact = () =>
    performAction(
      () => removeContact({ data: { targetId: profile.id! } }),
      null,
      "Đã cập nhật trạng thái liên hệ",
    );

  const onSendMessage = useCallback(async () => {
    if (!profile.id) return;
    try {
      const conversation = await createDirectChat({ receiverId: profile.id });
      if (conversation) {
        router.push(config.routes.private.detailChat(conversation));
      }
    } catch {
      toast.error("Không thể tạo cuộc trò chuyện.");
    }
  }, [profile.id, createDirectChat, router]);

  const onUploadAvatar = useCallback(
    async (file: File) => {
      if (!file) return;
      setIsUploadingAvatar(true);
      await updateAvatar(file, {
        onSuccess: () => {
          toast.success("Đã cập nhật ảnh đại diện mới");
        },
        onError: (errMsg) => {
          toast.error(errMsg || "Không thể tải lên ảnh đại diện");
        },
      });
      setIsUploadingAvatar(false);
    },
    [updateAvatar],
  );

  const onDeleteAvatar = useCallback(async () => {
    setIsUploadingAvatar(true);
    await deleteAvatar({
      onSuccess: () => {
        toast.success("Đã xóa ảnh đại diện");
      },
      onError: (errMsg) => {
        toast.error(errMsg || "Không thể xóa ảnh đại diện");
      },
    });
    setIsUploadingAvatar(false);
  }, [deleteAvatar]);

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
