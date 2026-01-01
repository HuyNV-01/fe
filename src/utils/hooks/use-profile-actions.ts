import { useCallback, useEffect } from "react";
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

  const {
    requestContact,
    acceptFriend,
    removeContact,
    findContactUsers,
    contacts,
    isRequest,
  } = useContactStore();
  const { updateRelationship } = useUserStore();
  const { createDirectChat } = useChatStore();

  useEffect(() => {
    findContactUsers({
      params: {
        search: profile.email,
      },
    });
  }, [findContactUsers, profile]);

  const performAction = async (
    action: () => Promise<any>,
    newStatus: ContactStatusEnum | null,
  ) => {
    if (!profile.id) return;
    try {
      await action();
      updateRelationship(newStatus);
    } catch (error) {
      toast.error("Đã có lỗi xảy ra, vui lòng thử lại.");
    }
  };

  const onAddFriend = () =>
    performAction(
      () => requestContact({ data: { targetUserId: profile.id! } }),
      ContactStatusEnum.PENDING_SENT,
    );

  const onAcceptFriend = () =>
    performAction(
      () => acceptFriend({ data: { senderId: profile.id! } }),
      ContactStatusEnum.FRIEND,
    );

  const onRemoveContact = () =>
    performAction(
      () => removeContact({ data: { targetId: profile.id! } }),
      null,
    );

  const onSendMessage = useCallback(async () => {
    if (!profile.id) return;
    try {
      const conversation = await createDirectChat({ receiverId: profile.id });
      if (conversation) {
        router.push(config.routes.private.detailChat(conversation));
      }
    } catch (error) {
      toast.error("Không thể tạo cuộc trò chuyện.");
    }
  }, [profile.id, createDirectChat, router]);

  return {
    isLoading: isRequest,
    onAddFriend,
    onAcceptFriend,
    onRemoveContact,
    onSendMessage,
    contacts,
  };
};
