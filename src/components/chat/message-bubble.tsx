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
} from "lucide-react";
import { CallStatusEnum, CallTypeEnum, MessageTypeEnum } from "@/common/enum";
import type { IMessage } from "@/types/chat";
import { useDateFormat } from "@/utils/hooks/use-date-format";
import { formatFileSize, sanitizeMediaUrl } from "@/utils/crypto-e2ee";
import { MessageReadList } from "./message-read-list";

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
  onCallbackCall?: (callType: CallTypeEnum) => void;
  onScrollToMessage?: (messageId: string) => void;
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
    onCallbackCall,
    onScrollToMessage,
  }: MessageBubbleProps) => {
    const { toChatTime } = useDateFormat();
    const [showReactionPicker, setShowReactionPicker] = useState(false);

    const timeString = useMemo(
      () => toChatTime(message.createdAt),
      [message.createdAt, toChatTime],
    );

    const isRecalled = message.status === "removed";
    const attachments = message.metadata?.attachments || [];
    const replyPreview = message.metadata?.replyPreview;
    const reactions = message.metadata?.reactions || {};
    const callInfo = message.metadata?.callInfo;

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
      if (replyPreview.type === MessageTypeEnum.IMAGE) return "📷 [Hình ảnh]";
      if (replyPreview.type === MessageTypeEnum.VIDEO) return "🎬 [Video]";
      if (replyPreview.type === MessageTypeEnum.AUDIO)
        return "🎤 [Tin nhắn thoại]";
      if (replyPreview.type === MessageTypeEnum.FILE)
        return `📎 ${replyPreview.content || "[Tệp đính kèm]"}`;
      return replyPreview.content;
    };

    return (
      <div
        id={`msg-${message.id}`}
        className={cn(
          "flex flex-col w-full mb-1 px-2 md:px-4 py-0.5 rounded-xl transition-all duration-500 group/bubble",
          isMe ? "items-end" : "items-start",
          !isContinuous ? "mt-3" : "mt-0.5",
          isHighlighted && "bg-primary/15 ring-2 ring-primary/40",
        )}
        onMouseLeave={() => setShowReactionPicker(false)}
      >
        {/* Tên người gửi ở đầu nhóm tin nhắn nếu là chat nhóm */}
        {!isMe && isGroupChat && !isContinuous && displayName && (
          <span className="text-[11px] font-medium text-muted-foreground ml-11 mb-1 select-none">
            {displayName}
          </span>
        )}

        <div
          className={cn(
            "relative flex max-w-[85%] md:max-w-[70%] items-end gap-2",
            isMe ? "flex-row-reverse" : "flex-row",
          )}
        >
          {!isMe && (
            <div className="w-8 shrink-0 flex flex-col justify-end">
              {isLastInGroup ? (
                <Avatar className="w-8 h-8 border border-border/50 shadow-sm">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                    {displayName?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="w-8" />
              )}
            </div>
          )}

          {/* Bong bóng tin nhắn chính */}
          <div
            className={cn(
              "relative px-3.5 py-2 text-sm shadow-xs transition-all",
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
            )}
          >
            {/* Nhãn Đã ghim */}
            {!isRecalled &&
              (message.isPinned || message.metadata?.isPinned) && (
                <div className="flex items-center gap-1 text-[10px] opacity-85 mb-1 font-medium">
                  <Pin className="w-3 h-3 rotate-45" />
                  <span>Tin nhắn đã ghim</span>
                </div>
              )}

            {/* Khung Trích dẫn tin nhắn trả lời (Reply Preview) có thể click để cuộn tới tin gốc */}
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
                    {replyPreview.senderName || "Tin nhắn gốc"}
                  </span>
                </div>
                <p className="truncate opacity-85 text-[11px] pl-4">
                  {formatReplyPreviewContent()}
                </p>
              </button>
            )}

            {/* Nội dung khi đã thu hồi */}
            {isRecalled ? (
              <p className="text-xs py-0.5 select-none">
                Tin nhắn đã được thu hồi
              </p>
            ) : (
              <>
                {/* 1. Hiển thị Hình ảnh (Attachments hoặc URL trực tiếp) */}
                {message.type === MessageTypeEnum.IMAGE && (
                  <div
                    className={cn(
                      "mb-1.5 grid gap-1.5 overflow-hidden rounded-xl",
                      attachments.length > 1 ? "grid-cols-2" : "grid-cols-1",
                    )}
                  >
                    {attachments.length > 0 ? (
                      attachments.map((att) => (
                        <a
                          key={att.fileId}
                          href={sanitizeMediaUrl(att.url)}
                          target="_blank"
                          rel="noreferrer"
                          className="block overflow-hidden rounded-lg bg-black/5"
                        >
                          <img
                            src={sanitizeMediaUrl(att.thumbnailUrl || att.url)}
                            alt={att.fileName}
                            className="max-h-72 w-full object-cover hover:scale-105 transition-transform"
                            loading="lazy"
                          />
                        </a>
                      ))
                    ) : (
                      <img
                        src={sanitizeMediaUrl(message.content)}
                        alt="attachment"
                        className="max-h-72 w-full object-cover rounded-lg"
                        loading="lazy"
                      />
                    )}
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
                    <div key={att.fileId} className="my-1 min-w-[230px]">
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
                    <a
                      key={att.fileId}
                      href={sanitizeMediaUrl(att.url)}
                      target="_blank"
                      rel="noreferrer"
                      download={att.fileName}
                      className={cn(
                        "flex items-center gap-3 p-2.5 my-1 rounded-xl border transition-colors",
                        isMe
                          ? "bg-white/10 border-white/20 hover:bg-white/20"
                          : "bg-muted/60 border-border hover:bg-muted",
                      )}
                    >
                      <div className="p-2 rounded-lg bg-primary/15">
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
                    </a>
                  ))}

                {/* 5. Hiển thị Thẻ Lịch sử Cuộc gọi (CALL) */}
                {message.type === MessageTypeEnum.CALL && (
                  <div className="flex items-center gap-3 py-1 min-w-[210px]">
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
                        Gọi lại ngay
                      </button>
                    </div>
                  </div>
                )}

                {/* 6. Nội dung văn bản */}
                {(message.type === MessageTypeEnum.TEXT ||
                  (message.content &&
                    message.type !== MessageTypeEnum.CALL &&
                    message.type !== MessageTypeEnum.IMAGE)) && (
                  <p className="whitespace-pre-wrap leading-relaxed break-words">
                    {message.content}
                  </p>
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
                <span className="italic">(Đã sửa)</span>
              )}
              <span>{timeString}</span>
              {StatusIcon}
            </div>

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

          {/* Thanh công cụ tương tác khi Hover (Chuẩn Messenger/Zalo) */}
          {!isRecalled && message.status !== "sending" && (
            <div
              className={cn(
                "opacity-0 group-hover/bubble:opacity-100 focus-within:opacity-100 transition-opacity flex items-center gap-0.5 bg-background/95 backdrop-blur border rounded-full px-1.5 py-0.5 shadow-sm z-20",
              )}
            >
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowReactionPicker((v) => !v)}
                  className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                  title="Thả cảm xúc"
                >
                  <SmilePlus className="w-3.5 h-3.5" />
                </button>

                {showReactionPicker && (
                  <div
                    className={cn(
                      "absolute bottom-full mb-1.5 flex items-center gap-1 bg-background border rounded-full px-2.5 py-1 shadow-xl z-30 animate-in fade-in zoom-in-95 duration-150",
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
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                title="Trả lời"
              >
                <Reply className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => onTogglePin?.(message)}
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                title={
                  message.isPinned || message.metadata?.isPinned
                    ? "Bỏ ghim tin nhắn"
                    : "Ghim tin nhắn"
                }
              >
                <Pin className="w-3.5 h-3.5" />
              </button>

              {isMe && message.type === MessageTypeEnum.TEXT && (
                <button
                  type="button"
                  onClick={() => onEdit?.(message)}
                  className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                  title="Chỉnh sửa"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}

              {isMe && (
                <button
                  type="button"
                  onClick={() => onRecall?.(message)}
                  className="p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive cursor-pointer"
                  title="Thu hồi"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
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
      </div>
    );
  },
);

MessageBubble.displayName = "MessageBubble";
