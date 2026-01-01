"use client";

import { useRouter } from "next/navigation";
import { MessageCircle, MoreHorizontal, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LiquidGlassCard } from "@/components/liquid-glass/liquid-glass";
import type { IContactsDataRes } from "@/types/common";
import { ContactActionsMenu } from "./contact-actions";
import type { KeyboardEvent } from "react";
import { LiquidGlassAnchor } from "../liquid-glass/liquid-glass-anchor";
import config from "@/config";
import { PatternButton } from "../button/button-patterns";
import { getInitials } from "@/utils/helper";
import { useChatStore } from "@/lib/stores/chat/use-chat-store";

interface ContactItemProps {
  contact: IContactsDataRes;
}

export const ContactItem = ({ contact }: ContactItemProps) => {
  const router = useRouter();
  const { createDirectChat } = useChatStore();
  const user = contact.contactUser;
  const displayName = contact.alias || user.name;

  const handleNavigate = () => {
    user.id && router.push(`${config.routes.private.profile(user.id)}`);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleNavigate();
    }
  };

  const handleSendMessage = async () => {
    if (!user.id) return;
    const conversation = await createDirectChat({ receiverId: user.id });
    if (conversation) {
      router.push(config.routes.private.detailChat(conversation));
    }
  };
  return (
    <LiquidGlassAnchor zIndex={0}>
      <LiquidGlassCard
        onKeyDown={handleKeyDown}
        interactive
        hover
        className="p-2 group z-0"
        onClick={handleNavigate}
      >
        <div className="flex items-center justify-between gap-4 transition-all">
          <div className="relative shrink-0">
            <Avatar className="h-12 w-12 border-2 border-white/10">
              <AvatarImage src={user.avatar || undefined} alt={displayName} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {displayName && getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-foreground truncate text-base">
                {displayName}
              </h4>
              {contact.alias && (
                <p className="text-xs text-muted-foreground/50 flex items-center gap-1">
                  <User className="w-3 h-3" /> {user.name}
                </p>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {user.email}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <PatternButton
              size="icon"
              variant="glass"
              rounded={"full"}
              onClick={(e) => {
                e.stopPropagation();
                handleSendMessage();
              }}
              title="Nhắn tin"
              onKeyDown={(e) => e.stopPropagation()}
              glassZIndex={0}
            >
              <MessageCircle className="w-4 h-4" />
            </PatternButton>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <PatternButton
                  size="icon"
                  variant="ghost"
                  rounded={"full"}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                </PatternButton>
              </DropdownMenuTrigger>
              {user.id && (
                <ContactActionsMenu contact={contact} userId={user.id} />
              )}
            </DropdownMenu>
          </div>
        </div>
      </LiquidGlassCard>
    </LiquidGlassAnchor>
  );
};
