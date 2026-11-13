/** biome-ignore-all lint/a11y/noLabelWithoutControl: <explanation> */
"use client";

import React, { useEffect, useState } from "react";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  ShieldCheck,
  Radio,
  CheckCircle2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import {
  GlassModal,
  GlassSurfaceCard,
  GlassBadge,
  GlassAvatar,
  PatternButton,
} from "@/components/toolkit";
import { CallStatusEnum } from "@/common/enum";
import { useChatStore } from "@/lib/stores/chat/use-chat-store";
import { cn } from "@/lib/utils";

const DISPOSITION_TAGS = [
  "ORDER_CONFIRMED",
  "CALLBACK_SCHEDULED",
  "NO_ANSWER",
  "ADDRESS_VERIFIED",
  "NEED_MORE_CONSULTATION",
] as const;

export interface MaskedVoipCallModalProps {
  customerName: string;
  customerAvatar?: string | null;
}

export const MaskedVoipCallModal = ({
  customerName,
  customerAvatar,
}: MaskedVoipCallModalProps) => {
  const t = useTranslations("MaskedVoip");
  const activeMaskedCall = useChatStore((s) => s.activeMaskedCall);
  const finalizeMaskedVoipCall = useChatStore((s) => s.finalizeMaskedVoipCall);
  const setActiveMaskedCall = useChatStore((s) => s.setActiveMaskedCall);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [disposition, setDisposition] = useState<string>("ORDER_CONFIRMED");
  const [callNotes, setCallNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!activeMaskedCall) {
      setElapsedSeconds(0);
      setIsConnected(false);
      setIsMuted(false);
      setCallNotes("");
      return;
    }

    const connectTimer = setTimeout(() => {
      setIsConnected(true);
    }, 1500);

    return () => clearTimeout(connectTimer);
  }, [activeMaskedCall]);

  useEffect(() => {
    if (!activeMaskedCall || !isConnected) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeMaskedCall, isConnected]);

  if (!activeMaskedCall) return null;

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const rem = (sec % 60).toString().padStart(2, "0");
    return `${mins}:${rem}`;
  };

  const handleCompleteAndSaveRecording = async () => {
    if (isSaving) return;
    setIsSaving(true);
    await finalizeMaskedVoipCall({
      conversationId: activeMaskedCall.conversationId,
      callSessionId: activeMaskedCall.callSessionId,
      durationSeconds: Math.max(1, elapsedSeconds),
      callDispositionTag: t(`dispositions.${disposition}`),
      callNotes: callNotes.trim() || undefined,
    });
    setIsSaving(false);
  };

  return (
    <GlassModal
      open={Boolean(activeMaskedCall)}
      onOpenChange={(open) => {
        if (!open && !isSaving) {
          setActiveMaskedCall(null);
        }
      }}
      size="sm"
      title={t("modalTitle")}
      description={t("modalSubtitle")}
    >
      <div className="space-y-4">
        <GlassSurfaceCard className="p-4 flex flex-col items-center text-center space-y-3">
          <div className="relative">
            <GlassAvatar
              src={customerAvatar}
              name={customerName}
              size="xl"
              isOnline
              showStatus
            />
            <span className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-emerald-500 text-white shadow-md">
              <Phone className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">
              {customerName}
            </h3>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{activeMaskedCall.maskedPhoneDisplay}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <GlassBadge
              variant={isConnected ? "success" : "warning"}
              size="sm"
              dot
              pulse
            >
              {isConnected
                ? t("statusConnected", {
                    duration: formatDuration(elapsedSeconds),
                  })
                : t("statusRinging")}
            </GlassBadge>
            <GlassBadge variant="info" size="sm">
              <Radio className="w-3 h-3 mr-1 inline text-red-500 animate-pulse" />
              {t("autoRecordingActive")}
            </GlassBadge>
          </div>

          <div className="flex items-center justify-center gap-3 pt-1">
            <PatternButton
              type="button"
              variant={isMuted ? "solid" : "outline"}
              color={isMuted ? "warning" : "neutral"}
              size="sm"
              rounded="full"
              onClick={() => setIsMuted((v) => !v)}
              icon={
                isMuted ? (
                  <MicOff className="w-3.5 h-3.5" />
                ) : (
                  <Mic className="w-3.5 h-3.5" />
                )
              }
            >
              {isMuted ? t("unmuteBtn") : t("muteBtn")}
            </PatternButton>
          </div>
        </GlassSurfaceCard>

        <div className="space-y-2">
          <label className="text-xs font-semibold">
            {t("selectDispositionLabel")}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {DISPOSITION_TAGS.map((tagKey) => (
              <button
                key={tagKey}
                type="button"
                onClick={() => setDisposition(tagKey)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all cursor-pointer",
                  disposition === tagKey
                    ? "border-primary bg-primary/15 text-primary font-semibold"
                    : "border-border/60 text-muted-foreground hover:text-foreground",
                )}
              >
                {t(`dispositions.${tagKey}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold">{t("callNotesLabel")}</label>
          <Input
            value={callNotes}
            onChange={(e) => setCallNotes(e.target.value)}
            placeholder={t("callNotesPlaceholder")}
            className="h-9 text-xs"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <PatternButton
            type="button"
            variant="solid"
            color="danger"
            size="sm"
            rounded="full"
            isLoading={isSaving}
            icon={<PhoneOff className="w-3.5 h-3.5" />}
            onClick={handleCompleteAndSaveRecording}
          >
            {t("hangupAndAttachRecordingBtn")}
          </PatternButton>

          <PatternButton
            type="button"
            variant="solid"
            color="success"
            size="sm"
            rounded="full"
            isLoading={isSaving}
            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
            onClick={handleCompleteAndSaveRecording}
          >
            {t("completeCallBtn")}
          </PatternButton>
        </div>
      </div>
    </GlassModal>
  );
};
