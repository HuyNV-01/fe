"use client";

import { useState, useMemo } from "react";
import {
  Pin,
  ChevronDown,
  ChevronUp,
  Trash2,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ConfirmDeleteModal } from "@/components/common/confirm-delete-modal";
import type { IMessage } from "@/types/chat";
import { MessageTypeEnum } from "@/common/enum";
import { getInitials } from "@/utils/helper";
import { useDateFormat } from "@/utils/hooks/use-date-format";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface PinnedMessagesBarProps {
  pinnedMessages: IMessage[];
  onScrollToMessage: (messageId: string) => void;
  onUnpinMessage: (messageId: string) => Promise<void> | void;
}

export function PinnedMessagesBar({
  pinnedMessages,
  onScrollToMessage,
  onUnpinMessage,
}: PinnedMessagesBarProps) {
  const t = useTranslations("Chat.Detail.conversation");
  const { toFullDateTime } = useDateFormat();

  const [activeIndex, setActiveIndex] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [unpinTarget, setUnpinTarget] = useState<IMessage | null>(null);

  const safeIndex = useMemo(() => {
    if (!pinnedMessages.length) return 0;
    return activeIndex >= pinnedMessages.length ? 0 : activeIndex;
  }, [activeIndex, pinnedMessages.length]);

  if (!pinnedMessages.length) return null;

  const currentPinned = pinnedMessages[safeIndex];
  const totalPinned = pinnedMessages.length;

  const formatPinnedPreview = (msg: IMessage) => {
    if (msg.type === MessageTypeEnum.IMAGE) return "📷 [Hình ảnh]";
    if (msg.type === MessageTypeEnum.VIDEO) return "🎬 [Video]";
    if (msg.type === MessageTypeEnum.AUDIO) return "🎤 [Tin nhắn thoại]";
    if (msg.type === MessageTypeEnum.FILE)
      return `📎 ${msg.content || "[Tệp đính kèm]"}`;
    return msg.content;
  };

  const handleCycleNext = () => {
    if (!currentPinned) return;
    onScrollToMessage(currentPinned.id);
    if (totalPinned > 1) {
      setActiveIndex((prev) => (prev + 1) % totalPinned);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-1.5 bg-primary/5 dark:bg-primary/10 border-t border-border/60 text-xs transition-all">
        {/* Vạch chỉ báo Carousel khi có nhiều tin nhắn ghim */}
        {totalPinned > 1 && (
          <div className="flex flex-col gap-0.5 py-0.5 shrink-0">
            {pinnedMessages.slice(0, 5).map((item, idx) => (
              <span
                key={item.id}
                className={cn(
                  "w-1 rounded-full transition-all duration-200",
                  idx === safeIndex ? "h-3 bg-primary" : "h-1.5 bg-primary/30",
                )}
              />
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={handleCycleNext}
          className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer group"
        >
          <div className="p-1 rounded-lg bg-primary/15 text-primary shrink-0">
            <Pin className="w-3.5 h-3.5 rotate-45" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-primary shrink-0">
                {t("pinnedMessage")}
              </span>
              {totalPinned > 1 && (
                <Badge
                  variant="secondary"
                  className="h-4 px-1.5 text-[10px] font-bold rounded-full bg-primary/15 text-primary"
                >
                  #{safeIndex + 1}/{totalPinned}
                </Badge>
              )}
              {currentPinned.sender?.name && (
                <span className="text-[11px] text-muted-foreground truncate">
                  • {currentPinned.sender.name}
                </span>
              )}
            </div>
            <p className="truncate text-foreground/85 group-hover:text-foreground transition-colors mt-0.5">
              {formatPinnedPreview(currentPinned)}
            </p>
          </div>
        </button>

        <div className="flex items-center gap-1 shrink-0">
          {totalPinned > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-[11px] font-medium text-primary hover:bg-primary/10 rounded-full"
              onClick={() => setIsDrawerOpen(true)}
            >
              <span>{t("viewAllPinned", { count: totalPinned })}</span>
              <ChevronDown className="w-3.5 h-3.5 ml-1" />
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
            title={t("unpin")}
            onClick={() => setUnpinTarget(currentPinned)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Ngăn kéo xem toàn bộ danh sách tin nhắn đã ghim */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md h-dvh max-h-dvh overflow-hidden p-0 flex flex-col gap-0"
        >
          <SheetHeader className="px-5 py-4 border-b shrink-0">
            <SheetTitle className="flex items-center gap-2 text-base">
              <Pin className="w-4 h-4 text-primary rotate-45 shrink-0" />
              <span className="truncate">
                {t("pinnedListTitle")} ({totalPinned})
              </span>
            </SheetTitle>
            <SheetDescription className="text-xs break-words">
              {t("pinnedListDesc")}
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1 min-h-0 w-full p-4">
            <div className="space-y-3">
              {pinnedMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="group p-3 rounded-2xl border border-border/60 bg-muted/30 hover:bg-muted/60 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar className="h-7 w-7 border">
                        <AvatarImage src={msg.sender?.avatar || undefined} />
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                          {getInitials(msg.sender?.name || "U")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">
                          {msg.sender?.name || t("unknownUser")}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {toFullDateTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-primary"
                        onClick={() => {
                          setIsDrawerOpen(false);
                          onScrollToMessage(msg.id);
                        }}
                      >
                        <MessageSquare className="w-3.5 h-3.5 mr-1" />
                        {t("jumpToMessage")}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setUnpinTarget(msg)}
                        title={t("unpin")}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  <p className="text-xs text-foreground/90 whitespace-pre-wrap break-words [overflow-wrap:anywhere] pl-9">
                    {formatPinnedPreview(msg)}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Modal xác nhận bỏ ghim / xoá ghim */}
      <ConfirmDeleteModal
        open={Boolean(unpinTarget)}
        onOpenChange={(open) => !open && setUnpinTarget(null)}
        title={t("unpinConfirmTitle")}
        description={t("unpinConfirmDesc")}
        confirmText={t("unpin")}
        onConfirm={async () => {
          if (unpinTarget) {
            await onUnpinMessage(unpinTarget.id);
            setUnpinTarget(null);
          }
        }}
      />
    </>
  );
}
