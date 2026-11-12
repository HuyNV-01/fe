/** biome-ignore-all lint/a11y/useMediaCaption: <explanation> */
/** biome-ignore-all lint/suspicious/useIterableCallbackReturn: <explanation> */
/** biome-ignore-all lint/suspicious/noArrayIndexKey: <explanation> */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
"use client";

import { memo, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  GlassAvatar,
  GlassBadge,
  LiquidGlassInput,
} from "@/components/toolkit";
import { Input } from "@/components/ui/input";
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
  Timer,
  Users,
  Bookmark,
  StickyNote,
  Languages,
  ShoppingBag,
  EyeOff,
  Eye,
  Heart,
  MessageSquareShare,
  Trash2,
} from "lucide-react";
import { CallStatusEnum, CallTypeEnum, MessageTypeEnum } from "@/common/enum";
import type {
  IConversationMemberDetail,
  ICustomTag,
  IMessage,
} from "@/types/chat";
import { PollVotersModal } from "./poll-voters-modal";
import { AudioWaveformPlayer } from "./audio-waveform-player";
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

const QUICK_REACTIONS = ["❤️", "👍", "😂", "😮", "😢", "😡"];

interface MessageBubbleProps {
  message: IMessage;
  currentUserId?: string;
  isMe: boolean;
  isGroupChat?: boolean;
  isCommentThread?: boolean;
  isContinuous?: boolean;
  isLastInGroup?: boolean;
  isHighlighted?: boolean;
  avatarUrl?: string;
  displayName?: string;
  displayReaders?: { id: string; name: string; avatar: string | null }[];
  members?: IConversationMemberDetail[];
  bookmarkTags?: ICustomTag[];
  allTagsMap?: Map<string, ICustomTag>;
  uploadPercent?: number;
  onReply?: (message: IMessage) => void;
  onEdit?: (message: IMessage) => void;
  onRecall?: (message: IMessage) => void;
  onReact?: (message: IMessage, emoji: string) => void;
  onTogglePin?: (message: IMessage) => void;
  onForward?: (message: IMessage) => void;
  onToggleBookmarkTag?: (
    messageId: string,
    tagId: string,
    noteText?: string,
  ) => void;
  onTranslateMessage?: (message: IMessage) => void;
  onToggleCommentVisibility?: (message: IMessage) => void;
  onToggleCommentLike?: (message: IMessage) => void;
  onDeleteCommentOnPlatform?: (message: IMessage) => void;
  onSendPrivateReplyFromComment?: (message: IMessage) => void;
  onOpenLinkedInboxConversation?: (inboxConversationId: string) => void;
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
    isCommentThread = false,
    isContinuous = false,
    isLastInGroup = false,
    isHighlighted = false,
    avatarUrl,
    displayName,
    displayReaders,
    members = [],
    bookmarkTags = [],
    allTagsMap,
    uploadPercent,
    onReply,
    onEdit,
    onRecall,
    onReact,
    onTogglePin,
    onForward,
    onToggleBookmarkTag,
    onTranslateMessage,
    onToggleCommentVisibility,
    onToggleCommentLike,
    onDeleteCommentOnPlatform,
    onSendPrivateReplyFromComment,
    onOpenLinkedInboxConversation,
    onCallbackCall,
    onScrollToMessage,
    onVotePoll,
    onClosePoll,
  }: MessageBubbleProps) => {
    const t = useTranslations("Chat.Detail.conversation.bubble");
    const tInbox = useTranslations("OmnichannelInbox");
    const { toMessageTime, toFullDateTime } = useDateFormat();
    const [showReactionPicker, setShowReactionPicker] = useState(false);
    const [showBookmarkPicker, setShowBookmarkPicker] = useState(false);
    const [bookmarkNote, setBookmarkNote] = useState("");
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [pollModalOptionId, setPollModalOptionId] = useState<string | null>(
      null,
    );

    const memberMap = useMemo(() => {
      const map = new Map<string, IConversationMemberDetail>();
      members.forEach((m) => map.set(m.userId, m));
      return map;
    }, [members]);

    const isRecalled = message.status === "removed";
    const isInternalNote = Boolean(
      message.isInternalNote ||
        message.direction === "INTERNAL_NOTE" ||
        message.metadata?.isInternalNote,
    );
    const attachments = message.metadata?.attachments || [];
    const replyPreview = message.metadata?.replyPreview;
    const forwardedFrom = message.metadata?.forwardedFrom;
    const reactions = message.metadata?.reactions || {};
    const callInfo = message.metadata?.callInfo;
    const pollInfo = message.metadata?.poll;
    const linkPreview = message.metadata?.linkPreview;
    const productCards = message.metadata?.productCards || [];
    const translation = message.metadata?.translation;
    const messageTagIds = message.messageTagIdsJson || [];

    const isHiddenOnPlatform = Boolean(message.metadata?.isHiddenOnPlatform);
    const isLikedByPage = Boolean(message.metadata?.isLikedByPage);
    const isDeletedOnPlatform = Boolean(message.metadata?.isDeletedOnPlatform);
    const privateReplySentAt = message.metadata?.privateReplySentAt;
    const linkedInboxConversationId =
      message.metadata?.linkedInboxConversationId;

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
            <span
              className="inline-flex items-center gap-0.5"
              title={t("status.sending")}
            >
              <Clock className="w-3 h-3 text-current opacity-75 animate-pulse" />
              {isLastInGroup && <span>{t("status.sending")}</span>}
            </span>
          );
        case "sent":
          return (
            <span
              className="inline-flex items-center gap-0.5"
              title={t("status.sent")}
            >
              <Check className="w-3 h-3 text-current opacity-80" />
              {isLastInGroup && <span>{t("status.sent")}</span>}
            </span>
          );
        case "delivered":
          return (
            <span
              className="inline-flex items-center gap-0.5"
              title={t("status.delivered")}
            >
              <CheckCheck className="w-3.5 h-3.5 text-current opacity-90" />
              {isLastInGroup && <span>{t("status.delivered")}</span>}
            </span>
          );
        case "read":
          return (
            <span
              className="inline-flex items-center gap-0.5 text-emerald-300 font-medium"
              title={t("status.read")}
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-300" />
              {isLastInGroup && <span>{t("status.read")}</span>}
            </span>
          );
        case "failed":
          return (
            <span
              className="inline-flex items-center gap-0.5 text-red-200"
              title={t("status.failed")}
            >
              <AlertCircle className="w-3 h-3 text-red-200" />
            </span>
          );
        default:
          return (
            <span
              className="inline-flex items-center gap-0.5"
              title={t("status.sent")}
            >
              <Check className="w-3 h-3 text-current opacity-75" />
              {isLastInGroup && <span>{t("status.sent")}</span>}
            </span>
          );
      }
    }, [isMe, isRecalled, isLastInGroup, message.status, t]);

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

    const isMaskedVoipCall =
      message.type === MessageTypeEnum.CALL &&
      (callInfo?.callDirection === "OUTBOUND_SIP_PSTN" ||
        Boolean(callInfo?.recordingFileUrl));

    return (
      <div
        id={`msg-${message.id}`}
        className={cn(
          "flex flex-col w-full mb-1 px-1.5 sm:px-2 md:px-4 py-0.5 rounded-xl transition-all duration-300 group/bubble",
          isMe ? "items-end" : "items-start",
          !isContinuous ? "mt-3" : "mt-0.5",
        )}
        onMouseLeave={() => {
          setShowReactionPicker(false);
          setShowBookmarkPicker(false);
        }}
      >
        {!isMe &&
          (isGroupChat || isCommentThread) &&
          !isContinuous &&
          (displayName ||
            message.sender?.name ||
            message.metadata?.externalCustomerName) && (
            <span className="text-[11px] font-medium text-muted-foreground ml-10 mb-1 select-none">
              {displayName ||
                message.sender?.name ||
                message.metadata?.externalCustomerName}
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
              {isLastInGroup || !isContinuous ? (
                <GlassAvatar
                  src={
                    avatarUrl ||
                    message.sender?.avatar ||
                    message.metadata?.externalCustomerAvatar ||
                    undefined
                  }
                  name={
                    displayName ||
                    message.sender?.name ||
                    message.metadata?.externalCustomerName ||
                    "Khách hàng"
                  }
                  size="xs"
                />
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
                : isInternalNote
                  ? "bg-amber-500/20 dark:bg-amber-500/25 text-amber-950 dark:text-amber-100 border border-amber-500/45"
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
            {/* Huy hiệu Ghi chú nội bộ (Alt+N — F03.5) */}
            {!isRecalled && isInternalNote && (
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 mb-1">
                <StickyNote className="w-3 h-3 shrink-0" />
                <span>{tInbox("composer.internalNoteBadge")}</span>
              </div>
            )}

            {/* Nhãn Đã ghim */}
            {!isRecalled &&
              (message.isPinned || message.metadata?.isPinned) && (
                <div className="flex items-center gap-1 text-[10px] opacity-85 mb-1 font-medium">
                  <Pin className="w-3 h-3 rotate-45" />
                  <span>{t("pinnedLabel")}</span>
                </div>
              )}

            {/* Huy hiệu Trạng thái Bình luận Đa kênh (F03.3 & F03.4) */}
            {!isRecalled &&
              (isHiddenOnPlatform ||
                isLikedByPage ||
                isDeletedOnPlatform ||
                privateReplySentAt) && (
                <div className="flex items-center gap-1 flex-wrap mb-1.5">
                  {isHiddenOnPlatform && (
                    <GlassBadge
                      variant="warning"
                      size="sm"
                      className="text-[10px] py-0 px-1.5"
                    >
                      <EyeOff className="w-2.5 h-2.5 mr-1 inline" />
                      {tInbox("commentActions.hiddenBadge")}
                    </GlassBadge>
                  )}

                  {isLikedByPage && (
                    <GlassBadge
                      variant="danger"
                      size="sm"
                      className="text-[10px] py-0 px-1.5"
                    >
                      <Heart className="w-2.5 h-2.5 mr-1 inline fill-current" />
                      {tInbox("commentActions.likedBadge")}
                    </GlassBadge>
                  )}

                  {isDeletedOnPlatform && (
                    <GlassBadge
                      variant="secondary"
                      size="sm"
                      className="text-[10px] py-0 px-1.5"
                    >
                      {message.metadata?.deletedByActor === "AGENT"
                        ? tInbox("commentActions.deletedByAgentBadge")
                        : tInbox("commentActions.deletedOnPlatformBadge")}
                    </GlassBadge>
                  )}

                  {privateReplySentAt && (
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          linkedInboxConversationId &&
                          onOpenLinkedInboxConversation
                        ) {
                          onOpenLinkedInboxConversation(
                            linkedInboxConversationId,
                          );
                        }
                      }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 cursor-pointer"
                    >
                      <MessageSquareShare className="w-2.5 h-2.5 shrink-0" />
                      <span>
                        {tInbox("commentActions.privateRepliedBadge")}
                      </span>
                    </button>
                  )}
                </div>
              )}

            {/* Huy hiệu Bookmark Tag gắn trên bong bóng (F02.3) */}
            {!isRecalled && messageTagIds.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap mb-1.5">
                {messageTagIds.map((tId) => {
                  const tagObj =
                    allTagsMap?.get(tId) ||
                    bookmarkTags.find((bt) => bt.id === tId);
                  if (!tagObj) return null;
                  return (
                    <span
                      key={tId}
                      style={{
                        backgroundColor: tagObj.colorOklch || tagObj.colorHex,
                      }}
                      className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-semibold text-white shadow-2xs"
                    >
                      <Bookmark className="w-2.5 h-2.5" />
                      <span>{tagObj.name}</span>
                    </span>
                  );
                })}
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

                {/* 5. Hiển thị Thẻ Lịch sử Cuộc gọi & Trình phát sóng âm Ghi âm VoIP Ẩn SĐT (F03.10 & T04) */}
                {message.type === MessageTypeEnum.CALL && (
                  <div className="space-y-1.5">
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
                        <p className="text-xs font-semibold">
                          {message.content}
                        </p>
                        {!isMaskedVoipCall && (
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
                        )}
                      </div>
                    </div>

                    {isMaskedVoipCall && (
                      <AudioWaveformPlayer
                        recordingUrl={callInfo?.recordingFileUrl}
                        durationSeconds={callInfo?.durationSeconds || 0}
                        maskedPhoneDisplay={callInfo?.maskedPhoneDisplay}
                        callDispositionTag={callInfo?.callDispositionTag}
                        waveformPeaks={callInfo?.waveformPeaks}
                        isMe={isMe}
                      />
                    )}
                  </div>
                )}

                {message.type === MessageTypeEnum.POLL && pollInfo && (
                  <div className="my-1 min-w-[240px] sm:min-w-[290px] space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm">
                        <BarChart3 className="w-4 h-4 shrink-0" />
                        <span className="break-words [overflow-wrap:anywhere]">
                          {pollInfo.question}
                        </span>
                      </div>
                      {pollInfo.isClosed && (
                        <GlassBadge
                          variant="secondary"
                          size="sm"
                          className="text-[9px] shrink-0 gap-0.5"
                        >
                          <Lock className="w-2.5 h-2.5" />
                          {t("poll.closed")}
                        </GlassBadge>
                      )}
                    </div>

                    <p className="text-[10px] opacity-80">
                      {pollInfo.allowMultipleAnswers
                        ? t("poll.multipleChoice")
                        : t("poll.singleChoice")}
                      {pollInfo.isAnonymous
                        ? ` • ${t("poll.anonymousTag")}`
                        : ""}
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
                          const voterIds = opt.voterIds || [];
                          const count = voterIds.length;
                          const percent =
                            totalVotes > 0
                              ? Math.round((count * 100) / totalVotes)
                              : 0;
                          const isSelected = myVotedIds.includes(opt.id);

                          return (
                            <div
                              key={opt.id}
                              className={cn(
                                "w-full text-left p-2 rounded-xl border transition-all space-y-1.5",
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
                                <button
                                  type="button"
                                  disabled={pollInfo.isClosed}
                                  onClick={() => {
                                    if (pollInfo.isClosed || !onVotePoll)
                                      return;
                                    let nextIds: string[];
                                    if (pollInfo.allowMultipleAnswers) {
                                      nextIds = isSelected
                                        ? myVotedIds.filter(
                                            (id) => id !== opt.id,
                                          )
                                        : [...myVotedIds, opt.id];
                                    } else {
                                      nextIds = isSelected ? [] : [opt.id];
                                    }
                                    onVotePoll(message.id, nextIds);
                                  }}
                                  className="flex-1 text-left font-medium break-words [overflow-wrap:anywhere] cursor-pointer disabled:cursor-default"
                                >
                                  {opt.text}
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPollModalOptionId(opt.id);
                                  }}
                                  className="inline-flex items-center gap-1.5 shrink-0 hover:opacity-100 opacity-90 cursor-pointer"
                                  title={t("poll.viewVotersBtn")}
                                >
                                  {!pollInfo.isAnonymous && count > 0 && (
                                    <span className="flex items-center -space-x-1.5">
                                      {voterIds.slice(0, 3).map((vid) => {
                                        const mInfo = memberMap.get(vid);
                                        const vName =
                                          mInfo?.nickname || mInfo?.name || "U";
                                        return (
                                          <GlassAvatar
                                            key={vid}
                                            src={mInfo?.avatar}
                                            name={vName}
                                            size="xs"
                                            className="w-4 h-4 border border-background"
                                          />
                                        );
                                      })}
                                    </span>
                                  )}
                                  <span className="text-[10px] font-semibold tabular-nums underline decoration-dotted">
                                    {count} ({percent}%)
                                  </span>
                                </button>
                              </div>

                              <button
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
                                className="block w-full cursor-pointer disabled:cursor-default"
                              >
                                <Progress value={percent} className="h-1.5" />
                              </button>
                            </div>
                          );
                        });
                      })()}
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-current/15 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setPollModalOptionId("ALL")}
                        className="inline-flex items-center gap-1 font-medium underline opacity-90 hover:opacity-100 cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>{t("poll.viewVotersBtn")}</span>
                      </button>

                      {isMe && !pollInfo.isClosed && onClosePoll && (
                        <button
                          type="button"
                          onClick={() => onClosePoll(message.id)}
                          className="underline opacity-85 hover:opacity-100 cursor-pointer"
                        >
                          {t("poll.closeBtn")}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* 6. Nội dung văn bản có Highlight @Mention */}
                {(message.type === MessageTypeEnum.TEXT ||
                  (message.content &&
                    message.type !== MessageTypeEnum.CALL &&
                    message.type !== MessageTypeEnum.POLL &&
                    message.type !== MessageTypeEnum.IMAGE)) && (
                  <p className="whitespace-pre-wrap leading-relaxed break-words [overflow-wrap:anywhere] max-w-full">
                    {renderTextWithMentions(
                      message.content,
                      isMe && !isInternalNote,
                    )}
                  </p>
                )}

                {/* Bản dịch tự động đa ngôn ngữ 2 chiều (F03.11) */}
                {translation?.translatedText && (
                  <div
                    className={cn(
                      "mt-2 pt-1.5 border-t text-xs italic space-y-0.5",
                      isMe && !isInternalNote
                        ? "border-white/25 text-white/95"
                        : "border-border/50 text-muted-foreground",
                    )}
                  >
                    <div className="flex items-center gap-1 text-[10px] font-semibold not-italic opacity-80">
                      <Languages className="w-3 h-3" />
                      <span>
                        {translation.sourceLang.toUpperCase()} →{" "}
                        {translation.targetLang.toUpperCase()}
                      </span>
                    </div>
                    <p>{translation.translatedText}</p>
                  </div>
                )}

                {/* Thẻ sản phẩm đính kèm (F03.3) */}
                {productCards.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {productCards.map((card) => (
                      <div
                        key={card.skuCode}
                        className={cn(
                          "flex items-center justify-between gap-2.5 p-2 rounded-xl border text-xs",
                          isMe && !isInternalNote
                            ? "bg-black/20 border-white/20 text-white"
                            : "bg-muted/60 border-border text-foreground",
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="p-1.5 rounded-lg bg-primary/15 shrink-0">
                            <ShoppingBag className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold truncate">
                              {card.name}
                            </p>
                            <p className="text-[10px] opacity-80 font-mono">
                              SKU: {card.skuCode}
                            </p>
                          </div>
                        </div>
                        <span className="font-bold shrink-0">
                          {Number(card.retailPrice || 0).toLocaleString(
                            "vi-VN",
                          )}
                          đ
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {linkPreview && (
                  <a
                    href={sanitizeMediaUrl(linkPreview.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "mt-2 block rounded-xl overflow-hidden border transition-opacity hover:opacity-95 max-w-xs sm:max-w-sm",
                      isMe && !isInternalNote
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
                isMe && !isInternalNote
                  ? "justify-end text-primary-foreground/90"
                  : "justify-start text-muted-foreground",
              )}
            >
              {!isRecalled &&
                (message.expiresAt || message.metadata?.expiresAt) && (
                  <span
                    className="inline-flex items-center gap-0.5 text-amber-300"
                    title={t("disappearingBadge")}
                  >
                    <Timer className="w-3 h-3" />
                  </span>
                )}
              {!isRecalled && message.metadata?.isEdited && (
                <span className="italic">
                  {t("editedLabel")}
                  {isMe && message.metadata?.platformEditSyncedAt
                    ? ` • ${tInbox("commentActions.platformEditSyncedBadge")}`
                    : ""}
                </span>
              )}
              <span title={fullTimeTitle}>{timeString}</span>
              {StatusIcon}
            </div>

            {!isRecalled && forwardedFrom && (
              <div className="flex items-center gap-1 text-[10px] opacity-80 mb-1 italic">
                <Forward className="w-3 h-3 shrink-0" />
                <span className="truncate">
                  {t("forwardedFrom", { name: forwardedFrom.senderName })}
                </span>
              </div>
            )}

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
                  "opacity-0 group-hover/bubble:opacity-100 focus-within:opacity-100 transition-opacity flex items-center gap-0.5 bg-background/95 border rounded-full px-1 sm:px-1.5 py-0.5 shadow-sm z-20 shrink-0",
                )}
              >
                {/* Nút thao tác Bình luận Đa Kênh: Ẩn/Hiện Comment, Thích Comment, Gửi Private Reply Inbox (F03.3 & F03.4) */}
                {!isMe && isCommentThread && (
                  <>
                    {onToggleCommentVisibility && (
                      <button
                        type="button"
                        onClick={() => onToggleCommentVisibility(message)}
                        className={cn(
                          "p-1 sm:p-1.5 rounded-full hover:bg-muted cursor-pointer",
                          isHiddenOnPlatform
                            ? "text-amber-500"
                            : "text-muted-foreground hover:text-amber-500",
                        )}
                        title={
                          isHiddenOnPlatform
                            ? tInbox("commentActions.unhideTooltip")
                            : tInbox("commentActions.hideTooltip")
                        }
                      >
                        {isHiddenOnPlatform ? (
                          <Eye className="w-3.5 h-3.5" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}

                    {onToggleCommentLike && (
                      <button
                        type="button"
                        onClick={() => onToggleCommentLike(message)}
                        className={cn(
                          "p-1 sm:p-1.5 rounded-full hover:bg-muted cursor-pointer",
                          isLikedByPage
                            ? "text-rose-500"
                            : "text-muted-foreground hover:text-rose-500",
                        )}
                        title={tInbox("commentActions.likeTooltip")}
                      >
                        <Heart
                          className={cn(
                            "w-3.5 h-3.5",
                            isLikedByPage && "fill-current",
                          )}
                        />
                      </button>
                    )}

                    {onSendPrivateReplyFromComment && !privateReplySentAt && (
                      <button
                        type="button"
                        onClick={() => onSendPrivateReplyFromComment(message)}
                        className="p-1 sm:p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-emerald-500 cursor-pointer"
                        title={tInbox("commentActions.sendPrivateReplyTooltip")}
                      >
                        <MessageSquareShare className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {onDeleteCommentOnPlatform && !isDeletedOnPlatform && (
                      <button
                        type="button"
                        onClick={() => onDeleteCommentOnPlatform(message)}
                        className="p-1 sm:p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive cursor-pointer"
                        title={tInbox("commentActions.deleteOnPlatformTooltip")}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </>
                )}

                {/* Nút Gắn Tag Đánh Dấu Bong Bóng Tin Nhắn (F02.3 Bookmark) */}
                {bookmarkTags.length > 0 && onToggleBookmarkTag && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowBookmarkPicker((v) => !v)}
                      className={cn(
                        "p-1 sm:p-1.5 rounded-full hover:bg-muted cursor-pointer",
                        messageTagIds.length > 0
                          ? "text-sky-500"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                      title={tInbox("composer.bookmarkBubbleTooltip")}
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                    </button>

                    {showBookmarkPicker && (
                      <div
                        className={cn(
                          "absolute bottom-full mb-1.5 flex flex-col gap-1.5 bg-background border rounded-2xl p-2 shadow-xl z-40 min-w-52 animate-in fade-in zoom-in-95 duration-150",
                          isMe ? "right-0" : "left-0",
                        )}
                      >
                        <LiquidGlassInput className="h-7 p-0 overflow-hidden">
                          <Input
                            value={bookmarkNote}
                            onChange={(e) => setBookmarkNote(e.target.value)}
                            placeholder="Ghi chú ngắn (tùy chọn)..."
                            className="h-full text-[11px] bg-transparent! border-none shadow-none focus-visible:ring-0 px-2"
                          />
                        </LiquidGlassInput>
                        {bookmarkTags.map((bTag) => {
                          const active = messageTagIds.includes(bTag.id);
                          return (
                            <button
                              key={bTag.id}
                              type="button"
                              onClick={() => {
                                onToggleBookmarkTag(
                                  message.id,
                                  bTag.id,
                                  bookmarkNote.trim() || undefined,
                                );
                                setBookmarkNote("");
                                setShowBookmarkPicker(false);
                              }}
                              className={cn(
                                "flex items-center justify-between gap-2 px-2.5 py-1 rounded-xl text-xs font-medium text-left cursor-pointer transition-colors",
                                active
                                  ? "bg-primary/15 text-primary font-semibold"
                                  : "hover:bg-muted text-foreground",
                              )}
                            >
                              <span className="inline-flex items-center gap-1.5 truncate">
                                <span
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{
                                    backgroundColor:
                                      bTag.colorOklch || bTag.colorHex,
                                  }}
                                />
                                <span className="truncate">{bTag.name}</span>
                              </span>
                              {active && <Check className="w-3 h-3 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Nút Dịch Tin Nhắn 2 Chiều (F03.11) */}
                {message.type === MessageTypeEnum.TEXT &&
                  onTranslateMessage && (
                    <button
                      type="button"
                      onClick={() => onTranslateMessage(message)}
                      className="p-1 sm:p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-sky-500 cursor-pointer"
                      title={tInbox("translation.translateBubbleTooltip")}
                    >
                      <Languages className="w-3.5 h-3.5" />
                    </button>
                  )}

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

        {pollInfo && (
          <PollVotersModal
            open={pollModalOptionId !== null}
            onOpenChange={(open) => !open && setPollModalOptionId(null)}
            poll={pollInfo}
            members={members}
            currentUserId={currentUserId}
            initialOptionId={pollModalOptionId || "ALL"}
          />
        )}
      </div>
    );
  },
);

MessageBubble.displayName = "MessageBubble";
