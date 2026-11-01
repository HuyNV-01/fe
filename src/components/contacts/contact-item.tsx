/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <explanation> */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
"use client";

import { useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import {
  MessageCircle,
  MoreHorizontal,
  Pencil,
  User,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  LiquidGlassCard,
  GlassModal,
  GlassConfirmDialog,
  GlassAvatar,
  GlassBadge,
  PatternButton,
} from "@/components/toolkit";
import type { IContactsDataRes } from "@/types/common";
import { ContactActionsMenu } from "./contact-actions";
import { ContactActionButton } from "../chat/add-new-contact";
import config from "@/config";
import { useChatStore } from "@/lib/stores/chat/use-chat-store";
import { useContactStore } from "@/lib/stores/contact/use-contact-store";
import { ContactStatusEnum } from "@/common/enum";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface ContactItemProps {
  contact: IContactsDataRes;
}

export const ContactItem = ({ contact }: ContactItemProps) => {
  const router = useRouter();
  const t = useTranslations("Chat.Detail.contact.item");
  const { createDirectChat, syncBlockStateForUser } = useChatStore();
  const {
    acceptFriend,
    removeContact,
    updateAlias,
    blockUser,
    unblockUser,
    isRequest,
  } = useContactStore();

  const user = contact.contactUser;
  const targetUserId = user?.id || contact.contactId;
  const displayName = contact.alias || user?.name || t("defaultUser");

  const [isAliasOpen, setIsAliasOpen] = useState(false);
  const [aliasValue, setAliasValue] = useState(contact.alias || "");

  const [confirmRemoveAction, setConfirmRemoveAction] = useState<
    "REJECT" | "REVOKE" | "REMOVE" | "BLOCK" | "UNBLOCK" | null
  >(null);

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
    if (!targetUserId || contact.status === ContactStatusEnum.BLOCKED) return;
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
      toast.warning(t("aliasModal.emptyWarning"));
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
          toast.success(t("aliasModal.updateSuccess"));
          setIsAliasOpen(false);
        },
        onError: () => {
          toast.error(t("aliasModal.updateError"));
        },
      },
    );
  };

  return (
    <>
      <LiquidGlassCard
        onKeyDown={handleKeyDown}
        interactive
        hover
        isolate={false}
        className="p-2.5 sm:p-3 group"
        onClick={handleNavigate}
      >
        <div className="flex items-center justify-between gap-2.5 sm:gap-4 transition-all">
          <div className="relative shrink-0">
            <GlassAvatar src={user?.avatar} name={displayName} size="lg" />
          </div>

          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h4 className="font-semibold text-foreground truncate text-sm sm:text-base">
                {displayName}
              </h4>
              {contact.alias && (
                <GlassBadge
                  variant="secondary"
                  size="sm"
                  className="max-w-[140px] truncate"
                >
                  <User className="w-3 h-3 shrink-0" />
                  <span className="truncate">{user?.name}</span>
                </GlassBadge>
              )}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground truncate mt-0.5">
              {user?.email}
            </p>
          </div>

          <div
            className="flex items-center gap-1 sm:gap-1.5 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <ContactActionButton
              contactStatus={contact.status}
              isLoading={isRequest}
              disabled={isRequest}
              tooltip={
                contact.status === ContactStatusEnum.PENDING_RECEIVED
                  ? t("accept")
                  : undefined
              }
              handleAccept={() =>
                acceptFriend(
                  { data: { senderId: targetUserId } },
                  {
                    onSuccess: () => toast.success(t("toast.accepted")),
                  },
                )
              }
              handleRemove={() => setConfirmRemoveAction("REJECT")}
            />

            {contact.status !== ContactStatusEnum.BLOCKED && (
              <PatternButton
                size="icon"
                variant="glass"
                rounded="full"
                className="h-8 w-8 sm:h-9 sm:w-9"
                disabled={isRequest}
                onClick={handleSendMessage}
                title={t("sendMessage")}
              >
                <MessageCircle className="w-4 h-4" />
              </PatternButton>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <PatternButton
                  size="icon"
                  variant="ghost"
                  rounded="full"
                  disabled={isRequest}
                  className="h-8 w-8 sm:h-9 sm:w-9"
                  aria-label={t("moreOptions")}
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
                  onRequestRemove={() =>
                    setConfirmRemoveAction(
                      contact.status === ContactStatusEnum.PENDING_SENT
                        ? "REVOKE"
                        : contact.status === ContactStatusEnum.PENDING_RECEIVED
                          ? "REJECT"
                          : "REMOVE",
                    )
                  }
                  onRequestBlock={() =>
                    setConfirmRemoveAction(
                      contact.status === ContactStatusEnum.BLOCKED
                        ? "UNBLOCK"
                        : "BLOCK",
                    )
                  }
                />
              )}
            </DropdownMenu>
          </div>
        </div>
      </LiquidGlassCard>

      <GlassModal
        open={isAliasOpen}
        onOpenChange={setIsAliasOpen}
        size="sm"
        title={
          <span className="flex items-center gap-2">
            <Pencil className="w-4 h-4 text-primary" />
            <span>{t("aliasModal.title")}</span>
          </span>
        }
        description={t("aliasModal.description", {
          name: user?.name || t("defaultUser"),
        })}
        footer={
          <>
            <PatternButton
              type="button"
              variant="ghost"
              size="sm"
              rounded="full"
              onClick={() => setIsAliasOpen(false)}
            >
              {t("aliasModal.cancel")}
            </PatternButton>
            <PatternButton
              type="submit"
              form={`alias-form-${contact.id}`}
              variant="solid"
              size="sm"
              rounded="full"
              isLoading={isRequest}
            >
              {t("aliasModal.save")}
            </PatternButton>
          </>
        }
      >
        <form id={`alias-form-${contact.id}`} onSubmit={handleSaveAlias}>
          <Input
            value={aliasValue}
            onChange={(e) => setAliasValue(e.target.value)}
            placeholder={t("aliasModal.placeholder")}
            className="rounded-xl bg-background/60"
            autoFocus
          />
        </form>
      </GlassModal>

      <GlassConfirmDialog
        open={Boolean(confirmRemoveAction)}
        onOpenChange={(open) => !open && setConfirmRemoveAction(null)}
        title={
          confirmRemoveAction === "BLOCK"
            ? t("blockConfirmTitle")
            : confirmRemoveAction === "UNBLOCK"
              ? t("unblockConfirmTitle")
              : undefined
        }
        description={
          confirmRemoveAction === "BLOCK"
            ? t("blockConfirmDesc", { name: displayName })
            : confirmRemoveAction === "UNBLOCK"
              ? t("unblockConfirmDesc", { name: displayName })
              : undefined
        }
        itemName={displayName}
        isLoading={isRequest}
        onConfirm={async () => {
          if (!targetUserId || !confirmRemoveAction) return;

          if (confirmRemoveAction === "BLOCK") {
            const ok = await blockUser(targetUserId, user);
            if (ok) {
              syncBlockStateForUser(targetUserId, { blockedByMe: true });
              toast.success(t("toast.blocked"));
            }
          } else if (confirmRemoveAction === "UNBLOCK") {
            const ok = await unblockUser(targetUserId);
            if (ok) {
              syncBlockStateForUser(targetUserId, { blockedByMe: false });
              toast.success(t("toast.unblocked"));
            }
          } else {
            await removeContact(
              { data: { targetId: targetUserId } },
              {
                onSuccess: () => {
                  if (confirmRemoveAction === "REJECT") {
                    toast.info(t("toast.rejected"));
                  } else if (confirmRemoveAction === "REVOKE") {
                    toast.info(t("toast.revoked"));
                  }
                },
              },
            );
          }
          setConfirmRemoveAction(null);
        }}
      />
    </>
  );
};
