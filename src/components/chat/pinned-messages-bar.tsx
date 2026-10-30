"use client";

import { useState, useMemo } from "react";
import {
  Pin,
  ChevronDown,
  ChevronUp,
  Trash2,
  MessageSquare,
  BarChart3,
  CheckCircle2,
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
import { useAuthStore } from "@/lib/stores/auth/use-auth-store";
import { useChatStore } from "@/lib/stores/chat/use-chat-store";
import { Progress } from "../ui/progress";

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
  const tBubble = useTranslations("Chat.Detail.conversation.bubble");
  const { toFullDateTime } = useDateFormat();
  const currentUserId = useAuthStore((s) => s.currentAccount?.user?.id);
  const { votePoll } = useChatStore();

  const [activeIndex, setActiveIndex] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [filterTab, setFilterTab] = useState<"ALL" | "POLLS">("ALL");
  const [unpinTarget, setUnpinTarget] = useState<IMessage | null>(null);

  const pinnedPolls = useMemo(
    () =>
      pinnedMessages.filter(
        (m) => m.type === MessageTypeEnum.POLL || Boolean(m.metadata?.poll),
      ),
    [pinnedMessages],
  );

  const filteredDrawerList =
    filterTab === "POLLS" ? pinnedPolls : pinnedMessages;

  const safeIndex = useMemo(() => {
    if (!pinnedMessages.length) return 0;
    return activeIndex >= pinnedMessages.length ? 0 : activeIndex;
  }, [activeIndex, pinnedMessages.length]);

  if (!pinnedMessages.length) return null;

  const currentPinned = pinnedMessages[safeIndex];
  const totalPinned = pinnedMessages.length;

  const formatPinnedPreview = (msg: IMessage) => {
    if (msg.type === MessageTypeEnum.POLL || msg.metadata?.poll) {
      const poll = msg.metadata?.poll;
      const totalVotes = (poll?.options || []).reduce(
        (sum, o) => sum + (o.voterIds?.length || 0),
        0,
      );
      return `📊 ${poll?.question || msg.content} (${totalVotes} ${t("pollVotesCount")})`;
    }
    if (msg.type === MessageTypeEnum.IMAGE) return tBubble("mediaPreview.image");
    if (msg.type === MessageTypeEnum.VIDEO) return tBubble("mediaPreview.video");
    if (msg.type === MessageTypeEnum.AUDIO) return tBubble("mediaPreview.audio");
    if (msg.type === MessageTypeEnum.FILE) {
      return msg.content
        ? `📎 ${msg.content}`
        : tBubble("mediaPreview.file");
    }
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
          <SheetHeader className="px-5 pt-4 pb-3 border-b shrink-0 space-y-2.5">
            <SheetTitle className="flex items-center gap-2 text-base">
              <Pin className="w-4 h-4 text-primary rotate-45 shrink-0" />
              <span className="truncate">
                {t("pinnedListTitle")} ({totalPinned})
              </span>
            </SheetTitle>
            <SheetDescription className="text-xs">
              {t("pinnedListDesc")}
            </SheetDescription>

            {/* Bộ lọc Tất cả vs Bảng bình chọn đã ghim */}
            {pinnedPolls.length > 0 && (
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-muted/60 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFilterTab("ALL")}
                  className={cn(
                    "py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer",
                    filterTab === "ALL"
                      ? "bg-background text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t("pinnedFilterAll")} ({pinnedMessages.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab("POLLS")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer",
                    filterTab === "POLLS"
                      ? "bg-background text-primary shadow-2xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>
                    {t("pinnedFilterPolls")} ({pinnedPolls.length})
                  </span>
                </button>
              </div>
            )}
          </SheetHeader>

          <ScrollArea className="flex-1 min-h-0 w-full p-4">
            <div className="space-y-3">
              {filteredDrawerList.map((msg) => {
                const poll = msg.metadata?.poll;
                const totalVotes = (poll?.options || []).reduce(
                  (sum, o) => sum + (o.voterIds?.length || 0),
                  0,
                );
                const myVotedIds = (poll?.options || [])
                  .filter(
                    (o) => currentUserId && o.voterIds?.includes(currentUserId),
                  )
                  .map((o) => o.id);

                return (
                  <div
                    key={msg.id}
                    className="group p-3 rounded-2xl border border-border/60 bg-muted/30 hover:bg-muted/50 transition-all space-y-2.5"
                  >
                    {/* ... existing sender header & Jump/Unpin buttons ... */}

                    {poll ? (
                      <div className="pl-9 space-y-2">
                        <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <BarChart3 className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="break-words [overflow-wrap:anywhere]">
                            {poll.question}
                          </span>
                        </p>

                        <div className="space-y-1.5">
                          {poll.options.map((opt) => {
                            const count = opt.voterIds?.length || 0;
                            const percent =
                              totalVotes > 0
                                ? Math.round((count * 100) / totalVotes)
                                : 0;
                            const isSelected = myVotedIds.includes(opt.id);

                            return (
                              <button
                                key={opt.id}
                                type="button"
                                disabled={poll.isClosed}
                                onClick={() => {
                                  if (poll.isClosed) return;
                                  const nextIds = poll.allowMultipleAnswers
                                    ? isSelected
                                      ? myVotedIds.filter((id) => id !== opt.id)
                                      : [...myVotedIds, opt.id]
                                    : isSelected
                                      ? []
                                      : [opt.id];
                                  votePoll({
                                    conversationId: msg.conversationId,
                                    messageId: msg.id,
                                    optionIds: nextIds,
                                  });
                                }}
                                className={cn(
                                  "w-full text-left p-2 rounded-xl border text-xs transition-all space-y-1 cursor-pointer disabled:cursor-default",
                                  isSelected
                                    ? "bg-primary/10 border-primary/50"
                                    : "bg-background/80 border-border/60 hover:bg-background",
                                )}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-medium flex items-center gap-1.5 break-words [overflow-wrap:anywhere]">
                                    {isSelected && (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                                    )}
                                    {opt.text}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                                    {count} ({percent}%)
                                  </span>
                                </div>
                                <Progress value={percent} className="h-1" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-foreground/90 whitespace-pre-wrap break-words [overflow-wrap:anywhere] pl-9">
                        {formatPinnedPreview(msg)}
                      </p>
                    )}
                  </div>
                );
              })}
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
