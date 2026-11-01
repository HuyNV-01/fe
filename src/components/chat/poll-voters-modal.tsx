"use client";

import { useMemo, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  GlassModal,
  GlassTabs,
  GlassAvatar,
  GlassBadge,
} from "@/components/toolkit";
import { BarChart3, CheckCircle2, Lock, ShieldAlert, Users } from "lucide-react";
import type { IConversationMemberDetail, IPollMetadata } from "@/types/chat";
import { useTranslations } from "next-intl";

interface PollVotersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poll: IPollMetadata | null;
  members?: IConversationMemberDetail[];
  currentUserId?: string;
  initialOptionId?: string;
}

export function PollVotersModal({
  open,
  onOpenChange,
  poll,
  members = [],
  currentUserId,
  initialOptionId = "ALL",
}: PollVotersModalProps) {
  const t = useTranslations("Chat.Detail.conversation");
  const tBubble = useTranslations("Chat.Detail.conversation.bubble");
  const [activeTab, setActiveTab] = useState<string>(initialOptionId || "ALL");

  const memberMap = useMemo(() => {
    const map = new Map<string, IConversationMemberDetail>();
    members.forEach((m) => map.set(m.userId, m));
    return map;
  }, [members]);

  const resolveVoterInfo = (userId: string) => {
    const found = memberMap.get(userId);
    const isMe = Boolean(currentUserId && userId === currentUserId);
    return {
      userId,
      displayName: found?.nickname || found?.name || (isMe ? t("me") : t("unknownUser")),
      originalName: found?.name || null,
      hasNickname: Boolean(found?.nickname),
      avatar: found?.avatar || null,
      isMe,
    };
  };

  if (!poll) return null;

  const totalVotes = poll.options.reduce(
    (sum, opt) => sum + (opt.voterIds?.length || 0),
    0,
  );

  const uniqueVoterIds = Array.from(
    new Set(poll.options.flatMap((opt) => opt.voterIds || [])),
  );

  const tabItems = [
    {
      key: "ALL",
      label: t("pinnedFilterAll"),
      badge: totalVotes,
    },
    ...poll.options.map((opt, idx) => ({
      key: opt.id,
      label:
        opt.text.length > 18 ? `${opt.text.slice(0, 18)}…` : opt.text || `#${idx + 1}`,
      badge: opt.voterIds?.length || 0,
    })),
  ];

  const effectiveTab =
    activeTab === "ALL" || poll.options.some((o) => o.id === activeTab)
      ? activeTab
      : "ALL";

  const visibleOptions =
    effectiveTab === "ALL"
      ? poll.options
      : poll.options.filter((o) => o.id === effectiveTab);

  return (
    <GlassModal
      open={open}
      onOpenChange={onOpenChange}
      size="md"
      title={
        <span className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary shrink-0" />
          <span className="truncate">{tBubble("poll.votersModalTitle")}</span>
        </span>
      }
      description={
        <div className="space-y-1.5 pt-1">
          <p className="font-semibold text-foreground text-sm break-words">
            {poll.question}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-primary" />
              {tBubble("poll.votersSummary", {
                voters: uniqueVoterIds.length,
                votes: totalVotes,
              })}
            </span>
            <span>•</span>
            <span>
              {poll.allowMultipleAnswers
                ? tBubble("poll.multipleChoice")
                : tBubble("poll.singleChoice")}
            </span>
            {poll.isClosed && (
              <GlassBadge variant="secondary" size="sm" className="gap-1 text-[10px]">
                <Lock className="w-2.5 h-2.5" />
                {tBubble("poll.closed")}
              </GlassBadge>
            )}
          </div>
        </div>
      }
    >
      {poll.isAnonymous ? (
        <div className="flex flex-col items-center justify-center text-center py-8 px-4 rounded-2xl bg-muted/40 border border-border/50 space-y-2">
          <ShieldAlert className="w-8 h-8 text-amber-500" />
          <p className="text-xs font-semibold text-foreground">
            {tBubble("poll.anonymousNoticeTitle")}
          </p>
          <p className="text-[11px] text-muted-foreground max-w-xs">
            {tBubble("poll.anonymousNoticeDesc")}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <GlassTabs
            size="sm"
            value={effectiveTab}
            onValueChange={setActiveTab}
            items={tabItems}
            className="w-full"
          />

          <ScrollArea className="h-72 rounded-2xl border border-border/50 bg-background/40 p-3">
            {totalVotes === 0 ? (
              <div className="h-60 flex flex-col items-center justify-center text-xs text-muted-foreground gap-2">
                <BarChart3 className="w-7 h-7 opacity-40" />
                <span>{tBubble("poll.noVotesYet")}</span>
              </div>
            ) : (
              <div className="space-y-4 pr-2">
                {visibleOptions.map((opt) => {
                  const voters = opt.voterIds || [];
                  const percent =
                    totalVotes > 0
                      ? Math.round((voters.length * 100) / totalVotes)
                      : 0;

                  return (
                    <div
                      key={opt.id}
                      className="space-y-2 rounded-xl bg-muted/30 border border-border/40 p-2.5"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2">
                        <span className="text-xs font-bold text-foreground break-words">
                          {opt.text}
                        </span>
                        <GlassBadge
                          variant={voters.length > 0 ? "primary" : "secondary"}
                          size="sm"
                          className="shrink-0 text-[10px]"
                        >
                          {voters.length} ({percent}%)
                        </GlassBadge>
                      </div>

                      {voters.length === 0 ? (
                        <p className="text-[11px] text-muted-foreground italic py-1">
                          {tBubble("poll.noOneChosenOption")}
                        </p>
                      ) : (
                        <div className="space-y-1.5 pt-0.5">
                          {voters.map((voterId) => {
                            const info = resolveVoterInfo(voterId);
                            return (
                              <div
                                key={`${opt.id}-${voterId}`}
                                className="flex items-center justify-between gap-2.5 p-1.5 rounded-lg hover:bg-background/60 transition-colors"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <GlassAvatar
                                    src={info.avatar}
                                    name={info.displayName}
                                    size="xs"
                                  />
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-xs font-medium text-foreground truncate">
                                        {info.displayName}
                                      </span>
                                      {info.isMe && (
                                        <GlassBadge
                                          variant="accent"
                                          size="sm"
                                          className="h-4 px-1.5 text-[9px]"
                                        >
                                          {t("me")}
                                        </GlassBadge>
                                      )}
                                    </div>
                                    {info.hasNickname && info.originalName && (
                                      <p className="text-[10px] text-muted-foreground truncate">
                                        {info.originalName}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </GlassModal>
  );
}
