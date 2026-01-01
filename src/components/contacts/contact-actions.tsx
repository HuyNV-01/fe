// modules/contacts/components/contact-actions.tsx
"use client";

import { UserX, Ban, Flag } from "lucide-react";
import { ContactStatusEnum } from "@/common/enum";
import DropdownMenuContentCus from "@/components/dropdown-menu/dropdown-menu-content-cus";
import ItemMenu from "@/components/dropdown-menu/item-menu";
import { useContactStore } from "@/lib/stores/contact/use-contact-store";
import type { IContactsDataRes } from "@/types/common";
import { useAuthStore } from "@/lib/stores/auth/use-auth-store";

interface ContactActionsMenuProps {
  contact: IContactsDataRes;
  userId: string;
}

export const ContactActionsMenu = ({
  contact,
  userId,
}: ContactActionsMenuProps) => {
  const { removeContact } = useContactStore();
  const { currentAccount } = useAuthStore();

  const isSender = contact.userId === currentAccount?.user.id;

  const handleRemove = () => {
    removeContact({ data: { targetId: userId } });
  };

  const getRemoveLabel = () => {
    if (contact.status === ContactStatusEnum.FRIEND) return "Hủy kết bạn";
    if (isSender) return "Thu hồi lời mời";
    return "Từ chối lời mời";
  };

  return (
    <DropdownMenuContentCus align="end" className="w-48">
      <ItemMenu
        onClick={handleRemove}
        className="text-red-600 focus:text-red-600"
        icon={<UserX className="w-4 h-4 mr-2" />}
      >
        {getRemoveLabel()}
      </ItemMenu>

      <ItemMenu icon={<Ban className="w-4 h-4 mr-2" />}>
        Chặn người dùng
      </ItemMenu>

      <ItemMenu icon={<Flag className="w-4 h-4 mr-2" />}>Báo cáo</ItemMenu>
    </DropdownMenuContentCus>
  );
};
