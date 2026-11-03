"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  GlassModal,
  GlassAvatar,
  PatternButton,
} from "@/components/toolkit";
import { Check, Forward, Search } from "lucide-react";
import { useChatStore } from "@/lib/stores/chat/use-chat-store";
import type { IMessage } from "@/types/chat";
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
    <GlassModal
      open={open}
      onOpenChange={onOpenChange}
      size="md"
      title={
        <span className="flex items-center gap-2">
          <Forward className="w-5 h-5 text-primary shrink-0" />
          <span>{t("title")}</span>
        </span>
      }
      description={t("description")}
      footer={
        <>
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
        </>
      }
    >
      <div className="space-y-4">
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
                      <GlassAvatar
                        src={conv.avatar}
                        name={conv.name || "C"}
                        size="sm"
                      />
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
      </div>
    </GlassModal>
  );
}
