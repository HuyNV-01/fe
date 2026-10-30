/** biome-ignore-all lint/a11y/useMediaCaption: <explanation> */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
"use client";

import { memo, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertCircle,
  Check,
  CheckCheck,
  Clock,
  Reply,
  Pencil,
  RotateCcw,
  Pin,
  FileText,
  Download,
  PhoneCall,
  PhoneMissed,
  Video,
  SmilePlus,
  CornerUpLeft,
  Forward,
  Copy,
  ZoomIn,
  ExternalLink,
  BarChart3,
  Lock,
} from "lucide-react";
import { CallStatusEnum, CallTypeEnum, MessageTypeEnum } from "@/common/enum";
import type { IMessage } from "@/types/chat";
import { useDateFormat } from "@/utils/hooks/use-date-format";
import {
  downloadMediaFile,
  formatFileSize,
  sanitizeMediaUrl,
} from "@/utils/crypto-e2ee";
import {
  ImageLightboxModal,
  type LightboxImageItem,
} from "./image-lightbox-modal";
import { MessageReadList } from "./message-read-list";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Progress } from "../ui/progress";
import { Badge } from "../ui/badge";

const QUICK_REACTIONS = ["❤️", "👍", "😂", "😮", "😢", "😡"];

interface MessageBubbleProps {
  message: IMessage;
  currentUserId?: string;
  isMe: boolean;
  isGroupChat?: boolean;
  isContinuous?: boolean;
  isLastInGroup?: boolean;
  isHighlighted?: boolean;
  avatarUrl?: string;
  displayName?: string;
  displayReaders?: { id: string; name: string; avatar: string | null }[];
  uploadPercent?: number;
  onReply?: (message: IMessage) => void;
  onEdit?: (message: IMessage) => void;
  onRecall?: (message: IMessage) => void;
  onReact?: (message: IMessage, emoji: string) => void;
  onTogglePin?: (message: IMessage) => void;
  onForward?: (message: IMessage) => void;
  onCallbackCall?: (callType: CallTypeEnum) => void;
  onScrollToMessage?: (messageId: string) => void;
  onVotePoll?: (messageId: string, optionIds: string[]) => void;
  onClosePoll?: (messageId: string) => void;
}

function renderTextWithMentions(text: string, isMe: boolean) {
  const parts = text.split(/(@All|@[A-Za-zÀ-ỹ0-9_.-]+)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("@") && part.length > 1) {
      return (
        <span
          key={idx}
          className={cn(
            "font-semibold px-1 py-0.2 rounded-md",
            isMe
              ? "bg-white/25 text-white underline decoration-white/60"
              : "bg-primary/15 text-primary",
          )}
        >
          {part}
        </span>
      );
    }
    return part;
  });
}

export const MessageBubble = memo(
  ({
    message,
    currentUserId,
    isMe,
    isGroupChat = false,
    isContinuous = false,
    isLastInGroup = false,
    isHighlighted = false,
    avatarUrl,
    displayName,
    displayReaders,
    uploadPercent,
    onReply,
    onEdit,
    onRecall,
    onReact,
    onTogglePin,
    onForward,
    onCallbackCall,
    onScrollToMessage,
    onVotePoll,
    onClosePoll,
  }: MessageBubbleProps) => {
    const t = useTranslations("Chat.Detail.conversation.bubble");
    const { toMessageTime, toFullDateTime } = useDateFormat();
    const [showReactionPicker, setShowReactionPicker] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    const isRecalled = message.status === "removed";
    const attachments = message.metadata?.attachments || [];
    const replyPreview = message.metadata?.replyPreview;
    const forwardedFrom = message.metadata?.forwardedFrom;
    const reactions = message.metadata?.reactions || {};
    const callInfo = message.metadata?.callInfo;

    const pollInfo = message.metadata?.poll;
    const linkPreview = message.metadata?.linkPreview;

    const imageGallery: LightboxImageItem[] = useMemo(() => {
      if (message.type !== MessageTypeEnum.IMAGE) return [];
      if (attachments.length > 0) {
        return attachments.map((att) => ({
          url: att.url,
          thumbnailUrl: att.thumbnailUrl || att.url,
          fileName: att.fileName,
          size: att.size,
        }));
      }
      return [{ url: message.content, fileName: t("attachmentAlt") }];
    }, [message.type, message.content, attachments, t]);

    const handleCopyText = async () => {
      if (!message.content) return;
      await navigator.clipboard.writeText(message.content);
      toast.success(t("copiedToast"));
    };

    const timeString = useMemo(
      () => toMessageTime(message.createdAt),
      [message.createdAt, toMessageTime],
    );

    const fullTimeTitle = useMemo(
      () => toFullDateTime(message.createdAt),
      [message.createdAt, toFullDateTime],
    );

    const reactionEntries = useMemo(
      () =>
        Object.entries(reactions).filter(
          ([, userIds]) => Array.isArray(userIds) && userIds.length > 0,
        ),
      [reactions],
    );

    const StatusIcon = useMemo(() => {
      if (!isMe || isRecalled) return null;

      switch (message.status) {
        case "sending":
          return (
            <Clock className="w-3 h-3 text-muted-foreground/70 animate-pulse" />
          );
        case "sent":
          return <Check className="w-3 h-3 text-current opacity-70" />;
        case "delivered":
          return <CheckCheck className="w-3 h-3 text-current opacity-80" />;
        case "read":
          return <CheckCheck className="w-3 h-3 text-emerald-300" />;
        case "failed":
          return <AlertCircle className="w-3 h-3 text-destructive" />;
        default:
          return <Check className="w-3 h-3 text-current opacity-70" />;
      }
    }, [isMe, isRecalled, message.status]);

    const formatReplyPreviewContent = () => {
      if (!replyPreview) return "";
      if (replyPreview.type === MessageTypeEnum.IMAGE)
        return t("mediaPreview.image");
      if (replyPreview.type === MessageTypeEnum.VIDEO)
        return t("mediaPreview.video");
      if (replyPreview.type === MessageTypeEnum.AUDIO)
        return t("mediaPreview.audio");
      if (replyPreview.type === MessageTypeEnum.FILE)
        return replyPreview.content
          ? `📎 ${replyPreview.content}`
          : t("mediaPreview.file");
      return replyPreview.content;
    };

    return (
      <div
        id={`msg-${message.id}`}
        className={cn(
          "flex flex-col w-full mb-1 px-1.5 sm:px-2 md:px-4 py-0.5 rounded-xl transition-all duration-300 group/bubble",
          isMe ? "items-end" : "items-start",
          !isContinuous ? "mt-3" : "mt-0.5",
        )}
        onMouseLeave={() => setShowReactionPicker(false)}
      >
        {/* Tên người gửi ở đầu nhóm tin nhắn nếu là chat nhóm */}
        {!isMe && isGroupChat && !isContinuous && displayName && (
          <span className="text-[11px] font-medium text-muted-foreground ml-10 mb-1 select-none">
            {displayName}
          </span>
        )}

        <div
          className={cn(
            "relative flex max-w-[90%] sm:max-w-[78%] md:max-w-[72%] items-end gap-1.5 sm:gap-2",
            isMe ? "flex-row-reverse" : "flex-row",
          )}
        >
          {!isMe && (
            <div className="w-7 sm:w-8 shrink-0 flex flex-col justify-end">
              {isLastInGroup ? (
                <Avatar className="w-7 h-7 sm:w-8 sm:h-8 border border-border/50 shadow-xs">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                    {displayName?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="w-7 sm:w-8" />
              )}
            </div>
          )}

          {/* Bong bóng tin nhắn chính */}
          <div
            className={cn(
              "relative px-3 sm:px-3.5 py-2 text-sm shadow-xs transition-all min-w-0",
              isRecalled
                ? "bg-muted/40 text-muted-foreground italic border border-dashed border-border"
                : isMe
                  ? "bg-primary text-primary-foreground"
                  : "bg-white dark:bg-muted text-foreground border border-border/50",
              "rounded-2xl",
              isMe &&
                isContinuous &&
                !isLastInGroup &&
                "rounded-tr-md rounded-br-md",
              isMe && isLastInGroup && isContinuous && "rounded-tr-md",
              isMe && !isContinuous && !isLastInGroup && "rounded-br-md",
              !isMe &&
                isContinuous &&
                !isLastInGroup &&
                "rounded-tl-md rounded-bl-md",
              !isMe && isLastInGroup && isContinuous && "rounded-tl-md",
              !isMe && !isContinuous && !isLastInGroup && "rounded-bl-md",
              isHighlighted && "bg-primary/15 ring-2 ring-primary/40",
            )}
          >
            {/* Nhãn Đã ghim */}
            {!isRecalled &&
              (message.isPinned || message.metadata?.isPinned) && (
                <div className="flex items-center gap-1 text-[10px] opacity-85 mb-1 font-medium">
                  <Pin className="w-3 h-3 rotate-45" />
                  <span>{t("pinnedLabel")}</span>
                </div>
              )}

            {/* Khung Trích dẫn tin nhắn trả lời (Reply Preview) */}
            {!isRecalled && replyPreview && (
              <button
                type="button"
                onClick={() => {
                  if (replyPreview.messageId && onScrollToMessage) {
                    onScrollToMessage(replyPreview.messageId);
                  }
                }}
                className={cn(
                  "w-full text-left mb-2 rounded-xl px-2.5 py-1.5 text-xs border-l-3 transition-opacity hover:opacity-95 cursor-pointer flex flex-col gap-0.5",
                  isMe
                    ? "bg-black/20 border-white/80 text-primary-foreground/95"
                    : "bg-muted/80 border-primary text-foreground/90",
                )}
              >
                <div className="flex items-center gap-1 font-semibold text-[11px]">
                  <CornerUpLeft className="w-3 h-3 shrink-0 opacity-80" />
                  <span className="truncate">
                    {replyPreview.senderName || t("originalMessage")}
                  </span>
                </div>
                <p className="truncate opacity-85 text-[11px] pl-4">
                  {formatReplyPreviewContent()}
                </p>
              </button>
            )}

            {isRecalled ? (
              <p className="text-xs py-0.5 select-none">
                {t("recalledMessage")}
              </p>
            ) : (
              <>
                {/* 1. Hiển thị Hình ảnh ngay trong Web + Nút Tải xuống nhanh */}
                {message.type === MessageTypeEnum.IMAGE && (
                  <div
                    className={cn(
                      "mb-1.5 grid gap-1.5 overflow-hidden rounded-xl",
                      imageGallery.length > 1 ? "grid-cols-2" : "grid-cols-1",
                    )}
                  >
                    {imageGallery.map((img, idx) => (
                      <div
                        key={`${img.url}-${idx}`}
                        className="group/img relative overflow-hidden rounded-lg bg-black/5"
                      >
                        <button
                          type="button"
                          onClick={() => setLightboxIndex(idx)}
                          className="block w-full text-left cursor-zoom-in"
                        >
                          <img
                            src={sanitizeMediaUrl(img.thumbnailUrl || img.url)}
                            alt={img.fileName || t("attachmentAlt")}
                            className="max-h-72 w-full object-cover group-hover/img:scale-105 transition-transform duration-200"
                            loading="lazy"
                          />
                        </button>

                        {/* Nút Xem lớn & Tải xuống trực tiếp không nhảy trang */}
                        <div className="absolute top-1.5 right-1.5 flex items-center gap-1 opacity-0 group-hover/img:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => setLightboxIndex(idx)}
                            className="p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 cursor-pointer"
                            title={t("actions.viewImage")}
                          >
                            <ZoomIn className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadMediaFile(
                                img.url,
                                img.fileName || `image-${idx + 1}.webp`,
                              );
                            }}
                            className="p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 cursor-pointer"
                            title={t("actions.download")}
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 2. Hiển thị Video */}
                {message.type === MessageTypeEnum.VIDEO &&
                  attachments.map((att) => (
                    <div
                      key={att.fileId}
                      className="mb-1.5 overflow-hidden rounded-xl bg-black/80"
                    >
                      <video
                        src={sanitizeMediaUrl(att.url)}
                        controls
                        preload="metadata"
                        className="max-h-72 w-full rounded-xl"
                      />
                    </div>
                  ))}

                {/* 3. Hiển thị Tin nhắn thoại / Âm thanh */}
                {message.type === MessageTypeEnum.AUDIO &&
                  attachments.map((att) => (
                    <div
                      key={att.fileId}
                      className="my-1 min-w-[180px] sm:min-w-[230px]"
                    >
                      <audio
                        src={sanitizeMediaUrl(att.url)}
                        controls
                        className="w-full h-9"
                      />
                    </div>
                  ))}

                {/* 4. Hiển thị Tệp tài liệu (FILE) */}
                {message.type === MessageTypeEnum.FILE &&
                  attachments.map((att) => (
                    <button
                      key={att.fileId}
                      type="button"
                      onClick={() => downloadMediaFile(att.url, att.fileName)}
                      className={cn(
                        "w-full text-left flex items-center gap-3 p-2.5 my-1 rounded-xl border transition-colors cursor-pointer",
                        isMe
                          ? "bg-white/10 border-white/20 hover:bg-white/20"
                          : "bg-muted/60 border-border hover:bg-muted",
                      )}
                    >
                      <div className="p-2 rounded-lg bg-primary/15 shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">
                          {att.fileName}
                        </p>
                        <p className="text-[10px] opacity-75">
                          {formatFileSize(att.size)}
                        </p>
                      </div>
                      <Download className="w-4 h-4 shrink-0 opacity-80" />
                    </button>
                  ))}

                {/* 5. Hiển thị Thẻ Lịch sử Cuộc gọi (CALL) */}
                {message.type === MessageTypeEnum.CALL && (
                  <div className="flex items-center gap-3 py-1 min-w-[180px] sm:min-w-[200px]">
                    <div
                      className={cn(
                        "p-2.5 rounded-full shrink-0",
                        callInfo?.status === CallStatusEnum.COMPLETED
                          ? isMe
                            ? "bg-white/20 text-white"
                            : "bg-emerald-500/15 text-emerald-500"
                          : isMe
                            ? "bg-red-500/30 text-red-100"
                            : "bg-red-500/15 text-red-500",
                      )}
                    >
                      {callInfo?.callType === CallTypeEnum.VIDEO ? (
                        <Video className="w-4 h-4" />
                      ) : callInfo?.status === CallStatusEnum.COMPLETED ? (
                        <PhoneCall className="w-4 h-4" />
                      ) : (
                        <PhoneMissed className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold">{message.content}</p>
                      <button
                        type="button"
                        onClick={() =>
                          onCallbackCall?.(
                            callInfo?.callType || CallTypeEnum.AUDIO,
                          )
                        }
                        className="text-[11px] font-medium underline opacity-90 hover:opacity-100 mt-0.5 cursor-pointer"
                      >
                        {t("callAgain")}
                      </button>
                    </div>
                  </div>
                )}

                {message.type === MessageTypeEnum.POLL && pollInfo && (
                  <div className="my-1 min-w-[230px] sm:min-w-[280px] space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm">
                        <BarChart3 className="w-4 h-4 shrink-0" />
                        <span className="break-words [overflow-wrap:anywhere]">
                          {pollInfo.question}
                        </span>
                      </div>
                      {pollInfo.isClosed && (
                        <Badge
                          variant="secondary"
                          className="text-[9px] shrink-0 gap-0.5"
                        >
                          <Lock className="w-2.5 h-2.5" />
                          {t("poll.closed")}
                        </Badge>
                      )}
                    </div>

                    <p className="text-[10px] opacity-80">
                      {pollInfo.allowMultipleAnswers
                        ? t("poll.multipleChoice")
                        : t("poll.singleChoice")}
                    </p>

                    <div className="space-y-1.5">
                      {(() => {
                        const totalVotes = pollInfo.options.reduce(
                          (acc, o) => acc + (o.voterIds?.length || 0),
                          0,
                        );
                        const myVotedIds = pollInfo.options
                          .filter(
                            (o) =>
                              currentUserId &&
                              o.voterIds?.includes(currentUserId),
                          )
                          .map((o) => o.id);

                        return pollInfo.options.map((opt) => {
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
                              disabled={pollInfo.isClosed}
                              onClick={() => {
                                if (pollInfo.isClosed || !onVotePoll) return;
                                let nextIds: string[];
                                if (pollInfo.allowMultipleAnswers) {
                                  nextIds = isSelected
                                    ? myVotedIds.filter((id) => id !== opt.id)
                                    : [...myVotedIds, opt.id];
                                } else {
                                  nextIds = isSelected ? [] : [opt.id];
                                }
                                onVotePoll(message.id, nextIds);
                              }}
                              className={cn(
                                "w-full text-left p-2 rounded-xl border transition-all space-y-1.5 cursor-pointer disabled:cursor-default",
                                isMe
                                  ? isSelected
                                    ? "bg-white/25 border-white"
                                    : "bg-black/15 border-white/20 hover:bg-black/25"
                                  : isSelected
                                    ? "bg-primary/10 border-primary"
                                    : "bg-muted/50 border-border/60 hover:bg-muted",
                              )}
                            >
                              <div className="flex items-center justify-between gap-2 text-xs">
                                <span className="font-medium break-words [overflow-wrap:anywhere]">
                                  {opt.text}
                                </span>
                                <span className="text-[10px] font-semibold shrink-0 tabular-nums">
                                  {count} ({percent}%)
                                </span>
                              </div>
                              <Progress value={percent} className="h-1.5" />
                            </button>
                          );
                        });
                      })()}
                    </div>

                    {isMe && !pollInfo.isClosed && onClosePoll && (
                      <button
                        type="button"
                        onClick={() => onClosePoll(message.id)}
                        className="text-[11px] underline opacity-85 hover:opacity-100 cursor-pointer"
                      >
                        {t("poll.closeBtn")}
                      </button>
                    )}
                  </div>
                )}

                {/* 6. Nội dung văn bản có Highlight @Mention */}
                {(message.type === MessageTypeEnum.TEXT ||
                  (message.content &&
                    message.type !== MessageTypeEnum.CALL &&
                    message.type !== MessageTypeEnum.POLL &&
                    message.type !== MessageTypeEnum.IMAGE)) && (
                  <p className="whitespace-pre-wrap leading-relaxed break-words [overflow-wrap:anywhere] max-w-full">
                    {renderTextWithMentions(message.content, isMe)}
                  </p>
                )}

                {/* 7. Thẻ Xem trước Liên kết (Rich OpenGraph Link Preview) */}
                {linkPreview && (
                  <a
                    href={sanitizeMediaUrl(linkPreview.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "mt-2 block rounded-xl overflow-hidden border transition-opacity hover:opacity-95 max-w-xs sm:max-w-sm",
                      isMe
                        ? "bg-black/20 border-white/20 text-primary-foreground"
                        : "bg-muted/60 border-border text-foreground",
                    )}
                  >
                    {linkPreview.image && (
                      <img
                        src={sanitizeMediaUrl(linkPreview.image)}
                        alt={linkPreview.title || linkPreview.hostname}
                        className="w-full h-36 object-cover border-b border-border/20"
                        loading="lazy"
                      />
                    )}
                    <div className="p-2.5 space-y-1">
                      <div className="flex items-center justify-between gap-1 text-[10px] uppercase tracking-wider opacity-75">
                        <span className="truncate">
                          {linkPreview.siteName || linkPreview.hostname}
                        </span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </div>
                      {linkPreview.title && (
                        <p className="text-xs font-bold line-clamp-2 break-words">
                          {linkPreview.title}
                        </p>
                      )}
                      {linkPreview.description && (
                        <p className="text-[11px] opacity-85 line-clamp-2 break-words">
                          {linkPreview.description}
                        </p>
                      )}
                    </div>
                  </a>
                )}

                {/* Thanh tiến trình tải lên (Upload Progress) */}
                {typeof uploadPercent === "number" && uploadPercent < 100 && (
                  <div className="w-full bg-black/20 h-1.5 rounded-full overflow-hidden mt-2">
                    <div
                      className="bg-emerald-400 h-full transition-all duration-200"
                      style={{ width: `${uploadPercent}%` }}
                    />
                  </div>
                )}
              </>
            )}

            {/* Dòng thời gian + Nhãn chỉnh sửa + Icon trạng thái */}
            <div
              className={cn(
                "flex items-center gap-1.5 text-[10px] mt-1 select-none opacity-80",
                isMe
                  ? "justify-end text-primary-foreground/90"
                  : "justify-start text-muted-foreground",
              )}
            >
              {!isRecalled && message.metadata?.isEdited && (
                <span className="italic">{t("editedLabel")}</span>
              )}
              <span title={fullTimeTitle}>{timeString}</span>
              {StatusIcon}
            </div>

            {/* Nhãn Tin nhắn được chuyển tiếp */}
            {!isRecalled && forwardedFrom && (
              <div className="flex items-center gap-1 text-[10px] opacity-80 mb-1 italic">
                <Forward className="w-3 h-3 shrink-0" />
                <span className="truncate">
                  {t("forwardedFrom", { name: forwardedFrom.senderName })}
                </span>
              </div>
            )}

            {/* Huy hiệu Cảm xúc (Reactions) dưới chân bong bóng */}
            {!isRecalled && reactionEntries.length > 0 && (
              <div
                className={cn(
                  "flex flex-wrap items-center gap-1 mt-1.5",
                  isMe ? "justify-end" : "justify-start",
                )}
              >
                {reactionEntries.map(([emoji, users]) => {
                  const hasReacted =
                    currentUserId && users.includes(currentUserId);
                  return (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => onReact?.(message, emoji)}
                      className={cn(
                        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] border shadow-2xs hover:scale-105 transition-transform cursor-pointer",
                        hasReacted
                          ? "bg-primary/15 text-primary border-primary/40 font-semibold dark:bg-primary/25 dark:text-primary-foreground"
                          : "bg-background/95 text-foreground border-border",
                      )}
                    >
                      <span>{emoji}</span>
                      {users.length > 1 && (
                        <span className="text-[10px]">{users.length}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Thanh công cụ tương tác khi Hover/Tap */}
          {!isRecalled &&
            message.status !== "sending" &&
            message.status !== "failed" && (
              <div
                className={cn(
                  "opacity-0 group-hover/bubble:opacity-100 focus-within:opacity-100 transition-opacity flex items-center gap-0.5 bg-background/95 backdrop-blur border rounded-full px-1 sm:px-1.5 py-0.5 shadow-sm z-20 shrink-0",
                )}
              >
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowReactionPicker((v) => !v)}
                    className="p-1 sm:p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                    title={t("actions.react")}
                  >
                    <SmilePlus className="w-3.5 h-3.5" />
                  </button>

                  {showReactionPicker && (
                    <div
                      className={cn(
                        "absolute bottom-full mb-1.5 flex items-center gap-1 bg-background border rounded-full px-2.5 py-1 shadow-xl z-40 animate-in fade-in zoom-in-95 duration-150",
                        isMe ? "right-0" : "left-0",
                      )}
                    >
                      {QUICK_REACTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            onReact?.(message, emoji);
                            setShowReactionPicker(false);
                          }}
                          className="text-base hover:scale-125 transition-transform px-0.5 cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onReply?.(message)}
                  className="p-1 sm:p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                  title={t("actions.reply")}
                >
                  <Reply className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => onTogglePin?.(message)}
                  className="p-1 sm:p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                  title={
                    message.isPinned || message.metadata?.isPinned
                      ? t("actions.unpin")
                      : t("actions.pin")
                  }
                >
                  <Pin className="w-3.5 h-3.5" />
                </button>

                {isMe && message.type === MessageTypeEnum.TEXT && (
                  <button
                    type="button"
                    onClick={() => onEdit?.(message)}
                    className="p-1 sm:p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                    title={t("actions.edit")}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}

                {isMe && (
                  <button
                    type="button"
                    onClick={() => onRecall?.(message)}
                    className="p-1 sm:p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive cursor-pointer"
                    title={t("actions.recall")}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}

                {message.type === MessageTypeEnum.TEXT && (
                  <button
                    type="button"
                    onClick={handleCopyText}
                    className="p-1 sm:p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                    title={t("actions.copy")}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                )}

                {onForward && (
                  <button
                    type="button"
                    onClick={() => onForward(message)}
                    className="p-1 sm:p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                    title={t("actions.forward")}
                  >
                    <Forward className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
        </div>

        {isMe && displayReaders && displayReaders.length > 0 && (
          <div className="mr-2">
            <MessageReadList readers={displayReaders} isMe={isMe} />
          </div>
        )}

        <ImageLightboxModal
          open={lightboxIndex !== null}
          onOpenChange={(open) => !open && setLightboxIndex(null)}
          images={imageGallery}
          initialIndex={lightboxIndex ?? 0}
        />
      </div>
    );
  },
);

MessageBubble.displayName = "MessageBubble";
