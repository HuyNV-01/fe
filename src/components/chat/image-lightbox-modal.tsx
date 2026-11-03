"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  LiquidGlass,
  GlassBadge,
  GlassIconButton,
  PatternButton,
} from "@/components/toolkit";
import {
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  X,
  Maximize2,
  Loader2,
} from "lucide-react";
import {
  downloadMediaFile,
  formatFileSize,
  sanitizeMediaUrl,
} from "@/utils/crypto-e2ee";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface LightboxImageItem {
  url: string;
  thumbnailUrl?: string;
  fileName?: string;
  size?: number;
}

interface ImageLightboxModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: LightboxImageItem[];
  initialIndex?: number;
}

export function ImageLightboxModal({
  open,
  onOpenChange,
  images,
  initialIndex = 0,
}: ImageLightboxModalProps) {
  const t = useTranslations("Chat.Detail.conversation.lightbox");
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (open) {
      setCurrentIndex(
        Math.min(Math.max(0, initialIndex), Math.max(0, images.length - 1)),
      );
      setScale(1);
      setRotation(0);
    }
  }, [open, initialIndex, images.length]);

  const currentImage = images[currentIndex];
  const hasMultiple = images.length > 1;

  const handlePrev = useCallback(() => {
    setScale(1);
    setRotation(0);
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const handleNext = useCallback(() => {
    setScale(1);
    setRotation(0);
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && hasMultiple) handlePrev();
      if (e.key === "ArrowRight" && hasMultiple) handleNext();
      if (e.key === "+" || e.key === "=")
        setScale((s) => Math.min(s + 0.25, 3));
      if (e.key === "-") setScale((s) => Math.max(s - 0.25, 0.5));
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, hasMultiple, handlePrev, handleNext]);

  const handleDownload = async () => {
    if (!currentImage || isDownloading) return;
    setIsDownloading(true);
    const ok = await downloadMediaFile(
      currentImage.url,
      currentImage.fileName || `image-${currentIndex + 1}.webp`,
    );
    setIsDownloading(false);
    if (ok) {
      toast.success(t("downloadSuccess"));
    } else {
      toast.error(t("downloadError"));
    }
  };

  if (!currentImage) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[96vw] sm:max-w-[92vw] h-[92dvh] p-0 bg-transparent border-none shadow-none flex flex-col justify-between overflow-hidden select-none"
      >
        <DialogTitle className="sr-only">
          {currentImage.fileName || t("title")}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {t("description")}
        </DialogDescription>

        {/* Thanh Header nổi với LiquidGlass */}
        <div className="z-30 flex items-center justify-between gap-3 px-4 py-3">
          <LiquidGlass
            variant="frosted"
            blur="xl"
            opacity="80"
            rounded="full"
            fluid={false}
            isolate={false}
            className="px-3.5 py-1.5"
            contentClassName="flex items-center gap-2.5 max-w-[60vw]"
          >
            <span className="text-xs font-semibold truncate text-foreground">
              {currentImage.fileName || t("title")}
            </span>
            {currentImage.size ? (
              <GlassBadge variant="secondary" size="sm" className="shrink-0">
                {formatFileSize(currentImage.size)}
              </GlassBadge>
            ) : null}
            {hasMultiple && (
              <GlassBadge variant="frosted" size="sm" className="shrink-0">
                {currentIndex + 1} / {images.length}
              </GlassBadge>
            )}
          </LiquidGlass>

          <LiquidGlass
            variant="frosted"
            blur="xl"
            opacity="80"
            rounded="full"
            fluid={false}
            isolate={false}
            className="p-1"
            contentClassName="flex items-center gap-1"
          >
            <GlassIconButton
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
              tooltip={t("zoomOut")}
              icon={<ZoomOut className="w-4 h-4" />}
            />
            <span className="text-[11px] font-mono w-11 text-center tabular-nums">
              {Math.round(scale * 100)}%
            </span>
            <GlassIconButton
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setScale((s) => Math.min(3, s + 0.25))}
              tooltip={t("zoomIn")}
              icon={<ZoomIn className="w-4 h-4" />}
            />
            <GlassIconButton
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              tooltip={t("rotate")}
              icon={<RotateCw className="w-4 h-4" />}
            />
            <GlassIconButton
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setScale(1);
                setRotation(0);
              }}
              tooltip={t("reset")}
              icon={<Maximize2 className="w-4 h-4" />}
            />
            <PatternButton
              type="button"
              variant="solid"
              color="primary"
              size="sm"
              rounded="full"
              disabled={isDownloading}
              onClick={handleDownload}
              className="h-8 px-3 text-xs gap-1.5"
              icon={
                isDownloading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )
              }
            >
              <span className="hidden sm:inline">{t("download")}</span>
            </PatternButton>
            <GlassIconButton
              type="button"
              variant="ghost"
              color="danger"
              size="sm"
              className="hover:bg-destructive/15 hover:text-destructive"
              onClick={() => onOpenChange(false)}
              tooltip={t("close")}
              icon={<X className="w-4 h-4" />}
            />
          </LiquidGlass>
        </div>

        {/* Vùng hiển thị ảnh chính */}
        <div
          className="relative flex-1 min-h-0 flex items-center justify-center overflow-hidden px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) onOpenChange(false);
          }}
        >
          {hasMultiple && (
            <PatternButton
              type="button"
              variant="glass"
              size="icon"
              rounded="full"
              onClick={handlePrev}
              className="absolute left-3 sm:left-6 z-30 h-10 w-10 shadow-lg bg-background/80 backdrop-blur-md hover:scale-105 transition-transform"
            >
              <ChevronLeft className="w-5 h-5" />
            </PatternButton>
          )}

          <img
            src={sanitizeMediaUrl(currentImage.url)}
            alt={currentImage.fileName || t("title")}
            style={{
              transform: `scale(${scale}) rotate(${rotation}deg)`,
            }}
            className="max-h-[75dvh] max-w-[88vw] object-contain rounded-xl shadow-2xl transition-transform duration-200"
            draggable={false}
          />

          {hasMultiple && (
            <PatternButton
              type="button"
              variant="glass"
              size="icon"
              rounded="full"
              onClick={handleNext}
              className="absolute right-3 sm:right-6 z-30 h-10 w-10 shadow-lg bg-background/80 backdrop-blur-md hover:scale-105 transition-transform"
            >
              <ChevronRight className="w-5 h-5" />
            </PatternButton>
          )}
        </div>

        {/* Dải Thumbnail phía dưới nếu có nhiều ảnh */}
        {hasMultiple && (
          <div className="z-30 flex justify-center pb-3 px-4">
            <LiquidGlass
              variant="frosted"
              blur="xl"
              opacity="70"
              rounded="2xl"
              fluid={false}
              isolate={false}
              className="p-1.5 max-w-full overflow-x-auto"
              contentClassName="flex items-center gap-2"
            >
              {images.map((img, idx) => (
                <button
                  key={`${img.url}-${idx}`}
                  type="button"
                  onClick={() => {
                    setScale(1);
                    setRotation(0);
                    setCurrentIndex(idx);
                  }}
                  className={cn(
                    "relative w-12 h-12 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer",
                    idx === currentIndex
                      ? "border-primary scale-105 shadow-md"
                      : "border-transparent opacity-60 hover:opacity-100",
                  )}
                >
                  <img
                    src={sanitizeMediaUrl(img.thumbnailUrl || img.url)}
                    alt={img.fileName || ""}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </LiquidGlass>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
