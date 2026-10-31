"use client";

import { useState, useMemo } from "react";
import {
  Pin,
  ChevronDown,
  Trash2,
  BarChart3,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import {
  GlassSheet,
  GlassTabs,
  GlassBadge,
  GlassAvatar,
  GlassConfirmDialog,
  GlassIconButton,
  PatternButton,
} from "@/components/toolkit";
import type { IMessage } from "@/types/chat";
import { MessageTypeEnum } from "@/common/enum";
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
    if (msg.type === MessageTypeEnum.IMAGE)
      return tBubble("mediaPreview.image");
    if (msg.type === MessageTypeEnum.VIDEO)
      return tBubble("mediaPreview.video");
    if (msg.type === MessageTypeEnum.AUDIO)
      return tBubble("mediaPreview.audio");
    if (msg.type === MessageTypeEnum.FILE) {
      return msg.content ? `📎 ${msg.content}` : tBubble("mediaPreview.file");
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
                <GlassBadge
                  variant="primary"
                  size="sm"
                  className="h-4 px-1.5 text-[10px] font-bold"
                >
                  #{safeIndex + 1}/{totalPinned}
                </GlassBadge>
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
            <PatternButton
              type="button"
              variant="ghost"
              color="primary"
              size="sm"
              rounded="full"
              className="h-7 px-2 text-[11px] font-medium text-primary hover:bg-primary/10"
              icon={<ChevronDown className="w-3.5 h-3.5" />}
              iconPosition="right"
              onClick={() => setIsDrawerOpen(true)}
            >
              <span>{t("viewAllPinned", { count: totalPinned })}</span>
            </PatternButton>
          )}

          <GlassIconButton
            type="button"
            variant="ghost"
            color="danger"
            size="sm"
            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
            tooltip={t("unpin")}
            icon={<Trash2 className="w-3.5 h-3.5" />}
            onClick={() => setUnpinTarget(currentPinned)}
          />
        </div>
      </div>

      {/* Ngăn kéo xem toàn bộ danh sách tin nhắn đã ghim */}
      <GlassSheet
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        side="right"
        title={
          <span className="flex items-center gap-2">
            <Pin className="w-4 h-4 text-primary rotate-45 shrink-0" />
            <span className="truncate">
              {t("pinnedListTitle")} ({totalPinned})
            </span>
          </span>
        }
        description={t("pinnedListDesc")}
        headerExtra={
          pinnedPolls.length > 0 ? (
            <div className="pt-2">
              <GlassTabs
                fullWidth
                size="sm"
                value={filterTab}
                onValueChange={setFilterTab}
                items={[
                  {
                    key: "ALL",
                    label: t("pinnedFilterAll"),
                    badge: pinnedMessages.length,
                  },
                  {
                    key: "POLLS",
                    label: t("pinnedFilterPolls"),
                    icon: <BarChart3 className="w-3.5 h-3.5" />,
                    badge: pinnedPolls.length,
                  },
                ]}
              />
            </div>
          ) : undefined
        }
      >
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
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <GlassAvatar
                      src={msg.sender?.avatar}
                      name={msg.sender?.name || "U"}
                      size="xs"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">
                        {msg.sender?.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {toFullDateTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <GlassIconButton
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7"
                      icon={<ExternalLink className="w-3.5 h-3.5" />}
                      onClick={() => {
                        setIsDrawerOpen(false);
                        onScrollToMessage(msg.id);
                      }}
                    />
                    <GlassIconButton
                      type="button"
                      size="sm"
                      variant="ghost"
                      color="danger"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      tooltip={t("unpin")}
                      icon={<Trash2 className="w-3.5 h-3.5" />}
                      onClick={() => setUnpinTarget(msg)}
                    />
                  </div>
                </div>

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
      </GlassSheet>

      {/* Modal xác nhận bỏ ghim / xoá ghim */}
      <GlassConfirmDialog
        open={Boolean(unpinTarget)}
        onOpenChange={(open) => !open && setUnpinTarget(null)}
        title={t("unpinConfirmTitle")}
        description={t("unpinConfirmDesc")}
        confirmLabel={t("unpin")}
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
