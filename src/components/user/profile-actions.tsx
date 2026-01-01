import {
  MessageCircle,
  Settings,
  UserX,
  MoreHorizontal,
  Flag,
  Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const {
    isLoading,
    onAddFriend,
    onAcceptFriend,
    onRemoveContact,
    onSendMessage,
    contacts,
  } = useProfileActions(profile);

  if (profile.isMe) {
    return (
      <div className={cn("flex justify-end", className)}>
        <Button
          variant="secondary"
          className="gap-2 bg-white/10 hover:bg-white/20 text-foreground border border-white/10 backdrop-blur-md transition-all"
        >
          <Settings className="w-4 h-4" />
          Chỉnh sửa hồ sơ
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 w-full md:w-auto justify-center md:justify-end",
        className,
      )}
    >
      <ContactActionButton
        contactStatus={
          contacts.data[0]?.contactStatus ?? ContactStatusEnum.NONE
        }
        isLoading={isLoading}
        onClick={(e) => {
          e.stopPropagation();
          onAddFriend();
        }}
        handleAccept={() => onAcceptFriend()}
      />
      <PatternButton
        size="sm"
        onClick={onSendMessage}
        rounded={"full"}
        icon={<MessageCircle className="w-3.5 h-3.5" />}
        variant={"glass"}
      >
        Nhắn tin
      </PatternButton>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <PatternButton variant="glass" size="sm" rounded={"full"}>
            <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
          </PatternButton>
        </DropdownMenuTrigger>
        <DropdownMenuContentCus align="end" className="w-48">
          {contacts.data[0]?.contactStatus && (
            <>
              {contacts.data[0]?.contactStatus === ContactStatusEnum.FRIEND && (
                <ItemMenu
                  onClick={onRemoveContact}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                  icon={<UserX className="w-4 h-4" />}
                >
                  Hủy kết bạn
                </ItemMenu>
              )}
              {contacts.data[0]?.contactStatus ===
                ContactStatusEnum.PENDING_SENT && (
                <ItemMenu
                  onClick={onRemoveContact}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                  icon={<UserX className="w-4 h-4" />}
                >
                  Thu hồi lời mời
                </ItemMenu>
              )}
            </>
          )}
          <ItemMenu icon={<Flag className="w-4 h-4" />}>
            Báo cáo người dùng
          </ItemMenu>
          <ItemMenu icon={<Ban className="w-4 h-4" />}>
            Chặn người dùng
          </ItemMenu>
        </DropdownMenuContentCus>
      </DropdownMenu>
    </div>
  );
};
