/** biome-ignore-all lint/a11y/useMediaCaption: <explanation> */
/** biome-ignore-all lint/suspicious/noArrayIndexKey: <explanation> */
"use client";

import React, { useRef, useState } from "react";
import { Play, Pause, Download, Volume2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { GlassBadge, GlassIconButton } from "@/components/toolkit";
import { PermissionGate } from "@/components/iam/permission-gate";
import { downloadMediaFile, sanitizeMediaUrl } from "@/utils/crypto-e2ee";
import { cn } from "@/lib/utils";

export interface AudioWaveformPlayerProps {
  recordingUrl?: string | null;
  durationSeconds?: number;
  maskedPhoneDisplay?: string | null;
  callDispositionTag?: string | null;
  waveformPeaks?: number[];
  isMe?: boolean;
}

const DEFAULT_PEAKS = [
  28, 42, 65, 50, 82, 74, 40, 35, 90, 68, 54, 72, 85, 60, 44, 38, 76, 92, 64,
  48, 56, 70, 80, 45, 32, 60, 75, 52, 40, 66, 84, 58, 44, 36, 50, 30,
];

const SPEEDS = [1, 1.25, 1.5, 2] as const;

export const AudioWaveformPlayer = ({
  recordingUrl,
  durationSeconds = 0,
  maskedPhoneDisplay,
  callDispositionTag,
  waveformPeaks = DEFAULT_PEAKS,
  isMe = false,
}: AudioWaveformPlayerProps) => {
  const t = useTranslations("MaskedVoip");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progressRatio, setProgressRatio] = useState(0);
  const [speedIndex, setSpeedIndex] = useState(0);

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const rem = Math.floor(sec % 60);
    return `${mins}:${rem.toString().padStart(2, "0")}`;
  };

  const handleTogglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !recordingUrl) {
      setIsPlaying((prev) => !prev);
      return;
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(() => {
        setIsPlaying(true);
      });
      setIsPlaying(true);
    }
  };

  const handleCycleSpeed = () => {
    const nextIdx = (speedIndex + 1) % SPEEDS.length;
    setSpeedIndex(nextIdx);
    if (audioRef.current) {
      audioRef.current.playbackRate = SPEEDS[nextIdx];
    }
  };

  const peaks = waveformPeaks.length > 0 ? waveformPeaks : DEFAULT_PEAKS;

  return (
    <PermissionGate can="INBOX_VOIP_LISTEN_RECORDING" mode="mask">
      <div
        className={cn(
          "mt-1.5 p-2.5 rounded-xl border space-y-2 min-w-[230px] sm:min-w-[270px]",
          isMe
            ? "bg-black/20 border-white/20 text-white"
            : "bg-muted/70 border-border/60 text-foreground",
        )}
      >
        {recordingUrl && (
          <audio
            ref={audioRef}
            src={sanitizeMediaUrl(recordingUrl)}
            preload="metadata"
            onTimeUpdate={(e) => {
              const el = e.currentTarget;
              if (el.duration > 0) {
                setProgressRatio(el.currentTime / el.duration);
              }
            }}
            onEnded={() => {
              setIsPlaying(false);
              setProgressRatio(0);
            }}
          />
        )}

        <div className="flex items-center justify-between gap-2 text-[11px]">
          <span className="inline-flex items-center gap-1 font-semibold">
            <Volume2 className="w-3.5 h-3.5 shrink-0" />
            <span>{maskedPhoneDisplay || "098***678"}</span>
          </span>
          {callDispositionTag && (
            <GlassBadge
              variant={isMe ? "frosted" : "primary"}
              size="sm"
              className="text-[9px] px-1.5 py-0"
            >
              {callDispositionTag}
            </GlassBadge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTogglePlay}
            className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer",
              isMe
                ? "bg-white text-primary"
                : "bg-primary text-primary-foreground",
            )}
            title={isPlaying ? t("pauseBtn") : t("playBtn")}
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            )}
          </button>

          <div className="flex-1 flex items-center gap-[2px] h-7">
            {peaks.map((peak, idx) => {
              const barRatio = idx / peaks.length;
              const isPlayed = barRatio <= progressRatio;
              return (
                <span
                  key={idx}
                  style={{ height: `${Math.max(18, Math.min(100, peak))}%` }}
                  className={cn(
                    "flex-1 rounded-full transition-colors",
                    isPlayed
                      ? isMe
                        ? "bg-emerald-300"
                        : "bg-primary"
                      : isMe
                        ? "bg-white/35"
                        : "bg-foreground/25",
                  )}
                />
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleCycleSpeed}
            className={cn(
              "px-1.5 py-0.5 rounded-md text-[10px] font-bold font-mono border cursor-pointer shrink-0",
              isMe
                ? "border-white/30 bg-white/10 text-white"
                : "border-border bg-background text-foreground",
            )}
          >
            {SPEEDS[speedIndex]}x
          </button>

          {recordingUrl && (
            <PermissionGate can="INBOX_VOIP_DOWNLOAD_RECORDING" mode="hide">
              <GlassIconButton
                size="sm"
                variant="ghost"
                className="h-7 w-7 shrink-0"
                icon={<Download className="w-3.5 h-3.5" />}
                onClick={() =>
                  downloadMediaFile(recordingUrl, "call-recording.mp3")
                }
              />
            </PermissionGate>
          )}
        </div>

        <div className="flex items-center justify-between text-[10px] opacity-80">
          <span>{t("recordedCallBadge")}</span>
          <span className="font-mono">{formatSeconds(durationSeconds)}</span>
        </div>
      </div>
    </PermissionGate>
  );
};
