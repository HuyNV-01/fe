"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LiquidGlassModal } from "@/components/liquid-glass/liquid-glass";
import { PatternButton } from "@/components/button/button-patterns";
import { Check, Forward, Search } from "lucide-react";
import { useChatStore } from "@/lib/stores/chat/use-chat-store";
import type { IMessage } from "@/types/chat";
import { getInitials } from "@/utils/helper";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface ForwardMessageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: IMessage | null;
}

export function ForwardMessageModal({
  open,
  onOpenChange,
  message,
}: ForwardMessageModalProps) {
  const t = useTranslations("Chat.Detail.conversation.forwardModal");
  const { conversations, forwardMessage } = useChatStore();
  const [search, setSearch] = useState("");
  const [selectedConvIds, setSelectedConvIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredConversations = useMemo(() => {
    const q = search.trim().toLowerCase();
    return conversations.filter((c) =>
      !q ? true : (c.name || "").toLowerCase().includes(q),
    );
  }, [conversations, search]);

  const toggleConversation = (convId: string) => {
    setSelectedConvIds((prev) =>
      prev.includes(convId)
        ? prev.filter((id) => id !== convId)
        : [...prev, convId],
    );
  };

  const handleConfirmForward = async () => {
    if (!message || selectedConvIds.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    const ok = await forwardMessage({
      messageId: message.id,
      sourceConversationId: message.conversationId,
      targetConversationIds: selectedConvIds,
    });
    setIsSubmitting(false);
    if (ok) {
      setSelectedConvIds([]);
      setSearch("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 bg-transparent border-none shadow-none max-w-[calc(100vw-1.5rem)] sm:max-w-md">
        <LiquidGlassModal className="p-5 sm:p-6">
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold">
                <Forward className="w-5 h-5 text-primary shrink-0" />
                <span>{t("title")}</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                {t("description")}
              </DialogDescription>
            </DialogHeader>

            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="pl-9 rounded-xl bg-background/60 h-9 text-xs"
              />
            </div>

            <ScrollArea className="h-56 rounded-xl border border-border/50 bg-background/40 p-2">
              {filteredConversations.length === 0 ? (
                <div className="h-44 flex items-center justify-center text-xs text-muted-foreground">
                  {t("empty")}
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredConversations.map((conv) => {
                    const isSelected = selectedConvIds.includes(conv.id);
                    return (
                      <button
                        key={conv.id}
                        type="button"
                        onClick={() => toggleConversation(conv.id)}
                        className={cn(
                          "w-full flex items-center justify-between gap-3 p-2 rounded-xl text-left transition-colors cursor-pointer",
                          isSelected
                            ? "bg-primary/10 border border-primary/30"
                            : "hover:bg-muted/60 border border-transparent",
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <Avatar className="h-8 w-8 border shrink-0">
                            <AvatarImage src={conv.avatar || undefined} />
                            <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                              {getInitials(conv.name || "C")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-semibold truncate">
                            {conv.name}
                          </span>
                        </div>

                        <div
                          className={cn(
                            "w-5 h-5 rounded-full flex items-center justify-center border transition-colors shrink-0",
                            isSelected
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-muted-foreground/40",
                          )}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            <DialogFooter className="gap-2">
              <PatternButton
                type="button"
                variant="ghost"
                size="sm"
                rounded="full"
                onClick={() => onOpenChange(false)}
              >
                {t("cancel")}
              </PatternButton>
              <PatternButton
                type="button"
                variant="solid"
                size="sm"
                rounded="full"
                isLoading={isSubmitting}
                disabled={selectedConvIds.length === 0 || isSubmitting}
                onClick={handleConfirmForward}
              >
                {t("submit", { count: selectedConvIds.length })}
              </PatternButton>
            </DialogFooter>
          </div>
        </LiquidGlassModal>
      </DialogContent>
    </Dialog>
  );
}