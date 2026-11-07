/** biome-ignore-all lint/a11y/noLabelWithoutControl: <explanation> */
"use client";

import React, { useState } from "react";
import {
  AlarmClock,
  ArrowRightLeft,
  History,
  CheckCircle2,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import {
  GlassSheet,
  GlassSurfaceCard,
  GlassTabs,
  GlassBadge,
  GlassAvatar,
  PatternButton,
} from "@/components/toolkit";
import { useChatStore } from "@/lib/stores/chat/use-chat-store";
import { useDateFormat } from "@/utils/hooks/use-date-format";
import type {
  IAccountabilityMilestone,
  IConversationMemberDetail,
} from "@/types/chat";
import { cn } from "@/lib/utils";

export interface ConversationSnoozeAndTimelineSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  currentSnoozedUntil?: string | null;
  currentSnoozeNote?: string | null;
  members?: IConversationMemberDetail[];
  timeline?: IAccountabilityMilestone[];
  currentUserId?: string;
}

export const ConversationSnoozeAndTimelineSheet = ({
  open,
  onOpenChange,
  conversationId,
  currentSnoozedUntil,
  currentSnoozeNote,
  members = [],
  timeline = [],
  currentUserId,
}: ConversationSnoozeAndTimelineSheetProps) => {
  const t = useTranslations("OmnichannelInbox");
  const { toFullDateTime } = useDateFormat();
  const [activeTab, setActiveTab] = useState<
    "SNOOZE" | "TRANSFER" | "TIMELINE"
  >("SNOOZE");
  const [snoozeNote, setSnoozeNote] = useState(currentSnoozeNote || "");
  const [customMinutes, setCustomMinutes] = useState("60");
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [transferNote, setTransferNote] = useState("");

  const snoozeConversation = useChatStore((s) => s.snoozeConversation);
  const cancelSnoozeConversation = useChatStore(
    (s) => s.cancelSnoozeConversation,
  );
  const transferConversation = useChatStore((s) => s.transferConversation);

  const handleScheduleSnoozeMinutes = async (minutesFromNow: number) => {
    const wakeDate = new Date(Date.now() + minutesFromNow * 60_000);
    const ok = await snoozeConversation({
      conversationId,
      snoozedUntilAt: wakeDate.toISOString(),
      snoozeNote: snoozeNote.trim() || undefined,
    });
    if (ok) onOpenChange(false);
  };

  const handleTomorrowMorning = async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    const ok = await snoozeConversation({
      conversationId,
      snoozedUntilAt: tomorrow.toISOString(),
      snoozeNote: snoozeNote.trim() || undefined,
    });
    if (ok) onOpenChange(false);
  };

  const handleTransfer = async () => {
    if (!selectedAgentId) return;
    const ok = await transferConversation({
      conversationId,
      targetAgentId: selectedAgentId,
      transferNote: transferNote.trim() || undefined,
    });
    if (ok) onOpenChange(false);
  };

  const colleagues = members.filter((m) => m.userId !== currentUserId);

  return (
    <GlassSheet
      open={open}
      onOpenChange={onOpenChange}
      side="right"
      title={t("snoozeAndTimeline.sheetTitle")}
      description={t("snoozeAndTimeline.sheetDesc")}
      headerExtra={
        <div className="pt-2">
          <GlassTabs
            size="sm"
            fullWidth
            value={activeTab}
            onValueChange={setActiveTab}
            items={[
              {
                key: "SNOOZE",
                label: t("snoozeAndTimeline.tabs.snooze"),
                icon: <AlarmClock className="w-3.5 h-3.5" />,
              },
              {
                key: "TRANSFER",
                label: t("snoozeAndTimeline.tabs.transfer"),
                icon: <ArrowRightLeft className="w-3.5 h-3.5" />,
              },
              {
                key: "TIMELINE",
                label: t("snoozeAndTimeline.tabs.timeline"),
                icon: <History className="w-3.5 h-3.5" />,
                badge: timeline.length,
              },
            ]}
          />
        </div>
      }
    >
      {activeTab === "SNOOZE" && (
        <div className="space-y-3">
          {currentSnoozedUntil && (
            <GlassSurfaceCard className="p-3 border border-amber-500/40 bg-amber-500/10 space-y-2">
              <div className="flex items-center justify-between">
                <GlassBadge variant="warning" size="sm" dot pulse>
                  {t("snooze.activeSnoozeBadge")}
                </GlassBadge>
                <PatternButton
                  variant="ghost"
                  color="danger"
                  size="sm"
                  rounded="full"
                  icon={<X className="w-3.5 h-3.5" />}
                  onClick={() => cancelSnoozeConversation(conversationId)}
                >
                  {t("snooze.cancelSnoozeBtn")}
                </PatternButton>
              </div>
              <p className="text-xs font-semibold">
                {toFullDateTime(currentSnoozedUntil)}
              </p>
              {currentSnoozeNote && (
                <p className="text-xs text-muted-foreground">
                  {currentSnoozeNote}
                </p>
              )}
            </GlassSurfaceCard>
          )}

          <GlassSurfaceCard className="p-3.5 space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold">
                {t("snooze.noteLabel")}
              </label>
              <Input
                value={snoozeNote}
                onChange={(e) => setSnoozeNote(e.target.value)}
                placeholder={t("snooze.notePlaceholder")}
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <PatternButton
                variant="outline"
                size="sm"
                rounded="xl"
                onClick={() => handleScheduleSnoozeMinutes(30)}
              >
                {t("snooze.preset30m")}
              </PatternButton>
              <PatternButton
                variant="outline"
                size="sm"
                rounded="xl"
                onClick={() => handleScheduleSnoozeMinutes(120)}
              >
                {t("snooze.preset2h")}
              </PatternButton>
              <PatternButton
                variant="outline"
                size="sm"
                rounded="xl"
                onClick={() => handleScheduleSnoozeMinutes(240)}
              >
                {t("snooze.preset4h")}
              </PatternButton>
              <PatternButton
                variant="outline"
                size="sm"
                rounded="xl"
                onClick={handleTomorrowMorning}
              >
                {t("snooze.presetTomorrow9am")}
              </PatternButton>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-border/40">
              <Input
                type="number"
                min={5}
                max={10080}
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value)}
                className="h-8 text-xs w-28"
              />
              <PatternButton
                variant="solid"
                color="primary"
                size="sm"
                rounded="full"
                onClick={() =>
                  handleScheduleSnoozeMinutes(
                    Math.max(5, Number(customMinutes) || 60),
                  )
                }
              >
                {t("snooze.customMinutesBtn")}
              </PatternButton>
            </div>
          </GlassSurfaceCard>
        </div>
      )}

      {activeTab === "TRANSFER" && (
        <GlassSurfaceCard className="p-3.5 space-y-3">
          <p className="text-xs text-muted-foreground">
            {t("transfer.selectColleagueHint")}
          </p>

          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {colleagues.map((col) => {
              const isSelected = selectedAgentId === col.userId;
              return (
                <button
                  key={col.userId}
                  type="button"
                  onClick={() => setSelectedAgentId(col.userId)}
                  className={cn(
                    "w-full flex items-center justify-between p-2 rounded-xl border text-left transition-all cursor-pointer",
                    isSelected
                      ? "border-primary bg-primary/15"
                      : "border-border/50 hover:bg-muted/50",
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <GlassAvatar src={col.avatar} name={col.name} size="xs" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">
                        {col.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {col.email}
                      </p>
                    </div>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          <Input
            value={transferNote}
            onChange={(e) => setTransferNote(e.target.value)}
            placeholder={t("transfer.notePlaceholder")}
            className="h-9 text-xs"
          />

          <PatternButton
            variant="solid"
            color="primary"
            size="sm"
            rounded="full"
            disabled={!selectedAgentId}
            onClick={handleTransfer}
            className="w-full"
          >
            {t("transfer.confirmBtn")}
          </PatternButton>
        </GlassSurfaceCard>
      )}

      {activeTab === "TIMELINE" && (
        <div className="space-y-2.5">
          {timeline.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              {t("timeline.emptyText")}
            </p>
          ) : (
            timeline.map((item, idx) => (
              <GlassSurfaceCard
                key={`${item.eventCode}-${idx}`}
                className="p-3 space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <GlassBadge variant="primary" size="sm">
                    {t(`timeline.events.${item.eventCode}`)}
                  </GlassBadge>
                  <span className="text-[10px] text-muted-foreground">
                    {toFullDateTime(item.timestamp)}
                  </span>
                </div>
                {item.actorName && (
                  <p className="text-xs font-semibold text-foreground">
                    {item.actorName}
                    {item.targetUserName ? ` → ${item.targetUserName}` : ""}
                  </p>
                )}
                {item.note && (
                  <p className="text-xs text-muted-foreground">{item.note}</p>
                )}
              </GlassSurfaceCard>
            ))
          )}
        </div>
      )}
    </GlassSheet>
  );
};
