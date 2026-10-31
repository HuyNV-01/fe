"use client";

import { UserX, Check, Pencil, User } from "lucide-react";
import { ContactStatusEnum } from "@/common/enum";
import { DropdownMenuContentCus, ItemMenu } from "@/components/toolkit";
import { useContactStore } from "@/lib/stores/contact/use-contact-store";
import type { IContactsDataRes } from "@/types/common";
import { useAuthStore } from "@/lib/stores/auth/use-auth-store";
import { useTranslations } from "next-intl";
import config from "@/config";

interface ContactActionsMenuProps {
  contact: IContactsDataRes;
  userId: string;
  onEditAlias?: () => void;
  onRequestRemove?: () => void;
}

export const ContactActionsMenu = ({
  contact,
  userId,
  onEditAlias,
  onRequestRemove,
}: ContactActionsMenuProps) => {
  const t = useTranslations("Chat.Detail.contact.item");
  const { removeContact, acceptFriend } = useContactStore();
  const { currentAccount } = useAuthStore();

  const isSender =
    contact.status === ContactStatusEnum.PENDING_SENT ||
    (contact.userId === currentAccount?.user?.id &&
      contact.status !== ContactStatusEnum.PENDING_RECEIVED);

  const handleRemove = () => {
    if (onRequestRemove) {
      onRequestRemove();
      return;
    }
    removeContact({ data: { targetId: userId } });
  };

  const handleAccept = () => {
    acceptFriend({ data: { senderId: userId } });
  };

  const getRemoveLabel = () => {
    if (contact.status === ContactStatusEnum.FRIEND) return t("unfriend");
    if (contact.status === ContactStatusEnum.PENDING_RECEIVED)
      return t("rejectRequest");
    if (isSender) return t("revokeRequest");
    return t("removeContact");
  };

  return (
    <DropdownMenuContentCus align="end" className="w-52">
      <ItemMenu
        route={config.routes.private.profile(userId)}
        icon={<User className="w-4 h-4 mr-2" />}
      >
        {t("viewProfile")}
      </ItemMenu>

      {contact.status === ContactStatusEnum.FRIEND && onEditAlias && (
        <ItemMenu
          onClick={onEditAlias}
          icon={<Pencil className="w-4 h-4 mr-2" />}
        >
          {t("setAlias")}
        </ItemMenu>
      )}

      {contact.status === ContactStatusEnum.PENDING_RECEIVED && (
        <ItemMenu
          onClick={handleAccept}
          className="text-emerald-600 focus:text-emerald-600"
          icon={<Check className="w-4 h-4 mr-2 text-emerald-600" />}
        >
          {t("acceptFriend")}
        </ItemMenu>
      )}

      <ItemMenu
        onClick={handleRemove}
        className="text-red-600 focus:text-red-600"
        icon={<UserX className="w-4 h-4 mr-2 text-red-600" />}
      >
        {getRemoveLabel()}
      </ItemMenu>
    </DropdownMenuContentCus>
  );
};
