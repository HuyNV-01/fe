/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <explanation> */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
"use client";

import { useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  User,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  LiquidGlassCard,
  LiquidGlassModal,
} from "@/components/liquid-glass/liquid-glass";
import type { IContactsDataRes } from "@/types/common";
import { ContactActionsMenu } from "./contact-actions";
import config from "@/config";
import { PatternButton } from "../button/button-patterns";
import { getInitials } from "@/utils/helper";
import { useChatStore } from "@/lib/stores/chat/use-chat-store";
import { useContactStore } from "@/lib/stores/contact/use-contact-store";
import { ContactStatusEnum } from "@/common/enum";
import { toast } from "sonner";
import { LiquidGlassAnchor } from "../liquid-glass/liquid-glass-anchor";

interface ContactItemProps {
  contact: IContactsDataRes;
}

export const ContactItem = ({ contact }: ContactItemProps) => {
  const router = useRouter();
  const { createDirectChat } = useChatStore();
  const { acceptFriend, removeContact, updateAlias, isRequest } =
    useContactStore();

  const user = contact.contactUser;
  const targetUserId = user?.id || contact.contactId;
  const displayName = contact.alias || user?.name || "Người dùng";

  const [isAliasOpen, setIsAliasOpen] = useState(false);
  const [aliasValue, setAliasValue] = useState(contact.alias || "");

  const handleNavigate = () => {
    if (targetUserId) {
      router.push(`${config.routes.private.profile(targetUserId)}`);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleNavigate();
    }
  };

  const handleSendMessage = async () => {
    if (!targetUserId) return;
    const conversation = await createDirectChat({ receiverId: targetUserId });
    if (conversation) {
      router.push(config.routes.private.detailChat(conversation));
    }
  };

  const handleSaveAlias = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId) return;
    const trimmed = aliasValue.trim();
    if (!trimmed) {
      toast.warning("Vui lòng nhập tên gợi nhớ");
      return;
    }

    await updateAlias(
      {
        data: {
          targetId: targetUserId,
          alias: trimmed,
        },
      },
      {
        onSuccess: () => {
          toast.success("Đã cập nhật tên gợi nhớ");
          setIsAliasOpen(false);
        },
        onError: () => {
          toast.error("Không thể cập nhật tên gợi nhớ");
        },
      },
    );
  };

  return (
    <LiquidGlassAnchor zIndex={0}>
      <LiquidGlassCard
        onKeyDown={handleKeyDown}
        interactive
        hover
        className="p-3 group"
        onClick={handleNavigate}
      >
        <div className="flex items-center justify-between gap-3 sm:gap-4 transition-all">
          <div className="relative shrink-0">
            <Avatar className="h-12 w-12 border border-border/50 shadow-xs">
              <AvatarImage src={user?.avatar || undefined} alt={displayName} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-foreground truncate text-sm sm:text-base">
                {displayName}
              </h4>
              {contact.alias && (
                <span className="text-xs text-muted-foreground/70 inline-flex items-center gap-1 bg-muted/60 px-2 py-0.5 rounded-full">
                  <User className="w-3 h-3" /> {user?.name}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground truncate mt-0.5">
              {user?.email}
            </p>
          </div>

          <div
            className="flex items-center gap-1.5 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            {contact.status === ContactStatusEnum.PENDING_RECEIVED && (
              <>
                <PatternButton
                  size="sm"
                  variant="solid"
                  color="success"
                  rounded="full"
                  disabled={isRequest}
                  icon={<Check className="w-3.5 h-3.5" />}
                  onClick={() =>
                    acceptFriend(
                      { data: { senderId: targetUserId } },
                      {
                        onSuccess: () =>
                          toast.success("Đã chấp nhận lời mời kết bạn"),
                      },
                    )
                  }
                >
                  Đồng ý
                </PatternButton>
                <PatternButton
                  size="icon"
                  variant="ghost"
                  color="danger"
                  rounded="full"
                  className="h-8 w-8"
                  disabled={isRequest}
                  title="Từ chối"
                  onClick={() =>
                    removeContact(
                      { data: { targetId: targetUserId } },
                      {
                        onSuccess: () =>
                          toast.info("Đã từ chối lời mời kết bạn"),
                      },
                    )
                  }
                >
                  <X className="w-4 h-4" />
                </PatternButton>
              </>
            )}

            {contact.status === ContactStatusEnum.PENDING_SENT && (
              <PatternButton
                size="sm"
                variant="outline"
                color="warning"
                rounded="full"
                disabled={isRequest}
                onClick={() =>
                  removeContact(
                    { data: { targetId: targetUserId } },
                    {
                      onSuccess: () => toast.info("Đã thu hồi lời mời kết bạn"),
                    },
                  )
                }
              >
                Thu hồi
              </PatternButton>
            )}

            <PatternButton
              size="icon"
              variant="glass"
              rounded="full"
              className="h-9 w-9"
              onClick={handleSendMessage}
              title="Nhắn tin"
            >
              <MessageCircle className="w-4 h-4" />
            </PatternButton>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <PatternButton
                  size="icon"
                  variant="ghost"
                  rounded="full"
                  className="h-9 w-9"
                >
                  <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                </PatternButton>
              </DropdownMenuTrigger>
              {targetUserId && (
                <ContactActionsMenu
                  contact={contact}
                  userId={targetUserId}
                  onEditAlias={() => {
                    setAliasValue(contact.alias || user?.name || "");
                    setIsAliasOpen(true);
                  }}
                />
              )}
            </DropdownMenu>
          </div>
        </div>
      </LiquidGlassCard>

      <Dialog open={isAliasOpen} onOpenChange={setIsAliasOpen}>
        <DialogContent
          className="p-0 bg-transparent border-none shadow-none sm:max-w-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <LiquidGlassModal className="p-6">
            <form onSubmit={handleSaveAlias} className="space-y-4">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base font-bold">
                  <Pencil className="w-4 h-4 text-primary" />
                  <span>Đặt tên gợi nhớ</span>
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Đặt biệt danh dễ nhớ cho <strong>{user?.name}</strong> trong
                  danh bạ của bạn.
                </DialogDescription>
              </DialogHeader>

              <Input
                value={aliasValue}
                onChange={(e) => setAliasValue(e.target.value)}
                placeholder="Nhập tên gợi nhớ..."
                className="rounded-xl bg-background/60"
                autoFocus
              />

              <DialogFooter className="gap-2">
                <PatternButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  rounded="full"
                  onClick={() => setIsAliasOpen(false)}
                >
                  Hủy
                </PatternButton>
                <PatternButton
                  type="submit"
                  variant="solid"
                  size="sm"
                  rounded="full"
                  isLoading={isRequest}
                >
                  Lưu thay đổi
                </PatternButton>
              </DialogFooter>
            </form>
          </LiquidGlassModal>
        </DialogContent>
      </Dialog>
    </LiquidGlassAnchor>
  );
};
