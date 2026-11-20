/** biome-ignore-all lint/a11y/useMediaCaption: <explanation> */
"use client";

import React, { useMemo, useState } from "react";
import { Download, FileText, ImageOff, ThumbsUp, ZoomIn } from "lucide-react";
import { useTranslations } from "next-intl";
import { resolveFrontendApiBaseUrl } from "@/config/tunnel";
import { cn } from "@/lib/utils";

export interface OmnichannelAttachmentItem {
  fileId?: string;
  url: string;
  thumbnailUrl?: string;
  fileName?: string;
  mimeType?: string;
  size?: number;
  attachmentKind?:
    | "IMAGE"
    | "STICKER"
    | "GIF"
    | "VIDEO"
    | "AUDIO"
    | "FILE"
    | "LINK_SHARE";
  stickerId?: string;
  isSticker?: boolean;
  isAnimatedGif?: boolean;
  width?: number;
  height?: number;
  platformSourceUrl?: string;
}

export interface OmnichannelMediaRendererProps {
  attachments?: OmnichannelAttachmentItem[];
  legacyMediaUrl?: string | null;
  stickerId?: string | null;
  hasSticker?: boolean;
  isMe?: boolean;
  onOpenLightbox?: (
    images: Array<{ url: string; fileName?: string }>,
    index: number,
  ) => void;
  onDownloadFile?: (url: string, fileName: string) => void;
}

const META_LIKE_STICKER_IDS = new Set([
  "369239263222822",
  "369239343222814",
  "369239383222810",
]);

export const PLACEHOLDER_MEDIA_TEXTS = new Set([
  "[Khách hàng gửi tệp đính kèm]",
  "[Khách hàng gửi bình luận kèm hình ảnh/nhãn dán]",
  "[Tin nhắn đính kèm từ nền tảng]",
  "[Tin nhắn hình ảnh/vị trí Zalo OA]",
  "[Hình ảnh]",
  "[Nhãn dán]",
  "[Ảnh động GIF]",
  "[Video]",
  "[Tin nhắn thoại]",
]);

export function resolveOmnichannelMediaUrl(rawUrl?: string | null): string {
  if (!rawUrl) return "";
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.startsWith("meta-like-sticker://")) return trimmed;
  if (trimmed.startsWith("/api/")) {
    const apiBase = resolveFrontendApiBaseUrl().replace(/\/+$/, "");
    // Loại bỏ hậu tố /api trùng lặp nếu resolveFrontendApiBaseUrl đã chứa /api
    const originBase = apiBase.replace(/\/api$/i, "");
    return originBase ? `${originBase}${trimmed}` : trimmed;
  }
  return trimmed;
}

function formatBytes(size?: number): string {
  if (!size || size <= 0) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export const OmnichannelMediaRenderer: React.FC<
  OmnichannelMediaRendererProps
> = ({
  attachments,
  legacyMediaUrl,
  stickerId,
  hasSticker,
  isMe = false,
  onOpenLightbox,
  onDownloadFile,
}) => {
  const t = useTranslations("ChatBubble");
  const [failedUrls, setFailedUrls] = useState<Record<string, boolean>>({});

  // Hợp nhất mảng `metadata.attachments` mới và `metadata.mediaAttachmentUrl` cũ để tin nhắn lịch sử trước đó cũng hiển thị ảnh ngay
  const normalizedList = useMemo<OmnichannelAttachmentItem[]>(() => {
    const list: OmnichannelAttachmentItem[] = Array.isArray(attachments)
      ? attachments.filter((a) => Boolean(a?.url))
      : [];

    if (list.length === 0 && legacyMediaUrl) {
      const lower = legacyMediaUrl.toLowerCase();
      const guessedKind: OmnichannelAttachmentItem["attachmentKind"] =
        hasSticker || Boolean(stickerId)
          ? "STICKER"
          : lower.includes(".gif")
            ? "GIF"
            : lower.includes(".mp4") || lower.includes("video")
              ? "VIDEO"
              : lower.includes(".mp3") ||
                  lower.includes(".ogg") ||
                  lower.includes("audio")
                ? "AUDIO"
                : "IMAGE";

      list.push({
        fileId: "legacy_media_0",
        url: legacyMediaUrl,
        thumbnailUrl: legacyMediaUrl,
        fileName: guessedKind === "STICKER" ? "sticker.webp" : "attachment.jpg",
        attachmentKind: guessedKind,
        isSticker: guessedKind === "STICKER",
        stickerId: stickerId || undefined,
      });
    }

    return list;
  }, [attachments, legacyMediaUrl, stickerId, hasSticker]);

  if (normalizedList.length === 0) return null;

  const stickerItems = normalizedList.filter(
    (a) =>
      a.isSticker ||
      a.attachmentKind === "STICKER" ||
      a.url.startsWith("meta-like-sticker://"),
  );
  const imageOrGifItems = normalizedList.filter(
    (a) =>
      !a.isSticker &&
      a.attachmentKind !== "STICKER" &&
      !a.url.startsWith("meta-like-sticker://") &&
      (a.attachmentKind === "IMAGE" ||
        a.attachmentKind === "GIF" ||
        a.mimeType?.startsWith("image/")),
  );
  const videoItems = normalizedList.filter(
    (a) => a.attachmentKind === "VIDEO" || a.mimeType?.startsWith("video/"),
  );
  const audioItems = normalizedList.filter(
    (a) => a.attachmentKind === "AUDIO" || a.mimeType?.startsWith("audio/"),
  );
  const fileItems = normalizedList.filter(
    (a) =>
      !stickerItems.includes(a) &&
      !imageOrGifItems.includes(a) &&
      !videoItems.includes(a) &&
      !audioItems.includes(a),
  );

  const lightboxGallery = imageOrGifItems.map((img) => ({
    url: resolveOmnichannelMediaUrl(img.url),
    fileName: img.fileName,
  }));

  return (
    <div className="space-y-1.5 my-1">
      {/* 1. Sticker / Icon (nền trong suốt, không viền hộp, hỗ trợ icon Like Meta chuẩn) */}
      {stickerItems.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 py-1">
          {stickerItems.map((st, idx) => {
            const isMetaLike =
              st.url.startsWith("meta-like-sticker://") ||
              (st.stickerId && META_LIKE_STICKER_IDS.has(st.stickerId));
            const resolvedUrl = resolveOmnichannelMediaUrl(st.url);
            const hasFailed = failedUrls[resolvedUrl];

            if (isMetaLike || hasFailed) {
              return (
                <div
                  key={st.fileId || `st_${idx}`}
                  className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary"
                  title="Sticker"
                >
                  <ThumbsUp className="w-8 h-8 fill-current" />
                </div>
              );
            }

            return (
              <img
                key={st.fileId || `st_${idx}`}
                src={resolvedUrl}
                alt={st.fileName || "Sticker"}
                loading="lazy"
                onError={() =>
                  setFailedUrls((prev) => ({ ...prev, [resolvedUrl]: true }))
                }
                className="w-28 h-28 object-contain select-none drop-shadow-sm"
              />
            );
          })}
        </div>
      )}

      {/* 2. Hình ảnh & Ảnh động GIF (lưới tự co giãn 1-3 cột + nút phóng to Lightbox & tải về) */}
      {imageOrGifItems.length > 0 && (
        <div
          className={cn(
            "grid gap-1.5",
            imageOrGifItems.length === 1
              ? "grid-cols-1 max-w-xs"
              : imageOrGifItems.length === 2
                ? "grid-cols-2 max-w-sm"
                : "grid-cols-2 sm:grid-cols-3 max-w-md",
          )}
        >
          {imageOrGifItems.map((img, idx) => {
            const resolvedUrl = resolveOmnichannelMediaUrl(
              img.thumbnailUrl || img.url,
            );
            const fullUrl = resolveOmnichannelMediaUrl(img.url);
            const hasFailed = failedUrls[resolvedUrl];

            if (hasFailed) {
              return (
                <a
                  key={img.fileId || `img_${idx}`}
                  href={fullUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-col items-center justify-center gap-1 p-4 rounded-xl border border-border/50 bg-muted/40 text-xs text-muted-foreground hover:bg-muted/70"
                >
                  <ImageOff className="w-5 h-5 opacity-70" />
                  <span className="truncate max-w-full">
                    {img.fileName || t("attachmentAlt")}
                  </span>
                </a>
              );
            }

            return (
              <div
                key={img.fileId || `img_${idx}`}
                className="group/img relative overflow-hidden rounded-xl bg-black/5"
              >
                <button
                  type="button"
                  onClick={() => onOpenLightbox?.(lightboxGallery, idx)}
                  className="block w-full text-left cursor-zoom-in"
                >
                  <img
                    src={resolvedUrl}
                    alt={img.fileName || t("attachmentAlt")}
                    loading="lazy"
                    onError={() =>
                      setFailedUrls((prev) => ({
                        ...prev,
                        [resolvedUrl]: true,
                      }))
                    }
                    className="max-h-72 w-full object-cover group-hover/img:scale-105 transition-transform duration-200"
                  />
                </button>
                <div className="absolute top-1.5 right-1.5 flex items-center gap-1 opacity-0 group-hover/img:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => onOpenLightbox?.(lightboxGallery, idx)}
                    className="p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 cursor-pointer"
                    title={t("actions.viewImage")}
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  {onDownloadFile && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDownloadFile(
                          fullUrl,
                          img.fileName || `image-${idx + 1}.jpg`,
                        );
                      }}
                      className="p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 cursor-pointer"
                      title={t("actions.download")}
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Video / Reels */}
      {videoItems.map((vid, idx) => (
        <div
          key={vid.fileId || `vid_${idx}`}
          className="overflow-hidden rounded-xl bg-black/80 max-w-sm"
        >
          <video
            src={resolveOmnichannelMediaUrl(vid.url)}
            controls
            preload="metadata"
            className="max-h-72 w-full rounded-xl"
          />
        </div>
      ))}

      {/* 4. Tin nhắn thoại / Audio */}
      {audioItems.map((aud, idx) => (
        <div
          key={aud.fileId || `aud_${idx}`}
          className="min-w-[200px] sm:min-w-[240px]"
        >
          <audio
            src={resolveOmnichannelMediaUrl(aud.url)}
            controls
            className="w-full h-9"
          />
        </div>
      ))}

      {/* 5. Tệp tài liệu / Liên kết chia sẻ */}
      {fileItems.map((f, idx) => {
        const resolvedUrl = resolveOmnichannelMediaUrl(f.url);
        return (
          <a
            key={f.fileId || `file_${idx}`}
            href={resolvedUrl}
            target="_blank"
            rel="noreferrer"
            className={cn(
              "w-full text-left flex items-center gap-2.5 p-2.5 rounded-xl border transition-colors",
              isMe
                ? "bg-white/10 border-white/20 hover:bg-white/20"
                : "bg-muted/60 border-border hover:bg-muted",
            )}
          >
            <div className="p-2 rounded-lg bg-primary/15 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">
                {f.fileName || "Tệp đính kèm"}
              </p>
              {f.size ? (
                <p className="text-[10px] opacity-75">{formatBytes(f.size)}</p>
              ) : null}
            </div>
            <Download className="w-4 h-4 shrink-0 opacity-80" />
          </a>
        );
      })}
    </div>
  );
};
