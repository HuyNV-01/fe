/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
/** biome-ignore-all lint/suspicious/useIterableCallbackReturn: <explanation> */
"use client";

import type React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  LiquidGlass,
  LiquidGlassCard,
  GlassAvatar,
  GlassBadge,
  GlassIconButton,
  PatternButton,
} from "@/components/toolkit";
import { PermissionGate } from "@/components/iam/permission-gate";
import {
  ImageLightboxModal,
  type LightboxImageItem,
} from "@/components/chat/image-lightbox-modal";
import {
  SendHorizontal,
  Paperclip,
  Smile,
  Image as ImageIcon,
  Mic,
  Square,
  Trash2,
  X,
  Reply,
  Pencil,
  FileText,
  Volume2,
  Eye,
  EyeOff,
  Plus,
  Ban,
  BarChart3,
  Link2,
  AtSign,
  StickyNote,
  Zap,
  Languages,
  ShoppingBag,
  MessageSquare,
  MessageSquareShare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/lib/stores/chat/use-chat-store";
import { usePermissionStore } from "@/lib/stores/iam/use-permission-store";
import { useAuthStore } from "@/lib/stores/auth/use-auth-store";
import { MessageTypeEnum, SocketNamespaceEnum } from "@/common/enum";
import { SOCKET_EVENTS } from "@/constant/socket-events";
import { socketService } from "@/services/socket/socket-client";
import { formatFileSize } from "@/utils/crypto-e2ee";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { getLinkPreviewApi } from "@/lib/stores/chat/api";
import type {
  CommentReplyModeType,
  ILinkPreviewMetadata,
  IQuickReplyProductCard,
} from "@/types/chat";
import { CreatePollModal } from "./create-poll-modal";
import { QuickReplyPopover } from "./quick-reply-popover";
import { useRouter } from "@/i18n/navigation";
import config from "@/config";

const COMMON_EMOJIS = [
  "😀",
  "😂",
  "🥰",
  "😎",
  "😭",
  "😡",
  "👍",
  "❤️",
  "🔥",
  "🎉",
  "🙏",
  "💯",
  "🤩",
  "🤔",
  "👏",
  "✨",
];

interface SelectedFilePreview {
  file: File;
  previewUrl: string | null;
}

export interface IChatInputProps {
  onSendMessage: (
    content: string,
    options?: {
      mentionedUserIds?: string[];
      mentionAll?: boolean;
      productCards?: IQuickReplyProductCard[];
      quickReplyShortcutUsed?: string;
      commentReplyMode?: CommentReplyModeType;
      autoHideCommentOnReply?: boolean;
    },
  ) => Promise<void> | void;
  onSendInternalNote?: (
    content: string,
    mentionedUserIds?: string[],
  ) => Promise<void> | void;
  onSendAttachments?: (files: File[], content?: string) => Promise<void> | void;
  onConfirmEdit?: (
    messageId: string,
    newContent: string,
  ) => Promise<void> | void;
  onScrollToMessage?: (messageId: string) => void;
  disabled?: boolean;
  isCollisionLockedByOther?: boolean;
  isCommentThread?: boolean;
  blockState?: {
    isBlocked: boolean;
    blockedByMe: boolean;
    blockedByPartner: boolean;
    partnerId: string | null;
  };
  onUnblockPartner?: () => void;
}

export const ChatInput = ({
  onSendMessage,
  onSendInternalNote,
  onSendAttachments,
  onConfirmEdit,
  onScrollToMessage,
  disabled,
  isCollisionLockedByOther = false,
  isCommentThread = false,
  blockState,
  onUnblockPartner,
}: IChatInputProps) => {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [selectedItems, setSelectedItems] = useState<SelectedFilePreview[]>([]);
  const [previewLightboxIndex, setPreviewLightboxIndex] = useState<
    number | null
  >(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);

  // Sprint 2 states: Internal Note (Alt+N), Quick Reply (/shortcut), Product Cards, Comment Reply Mode & Draft Translation
  const [isInternalNoteMode, setIsInternalNoteMode] = useState(false);
  const [quickReplyQuery, setQuickReplyQuery] = useState<string | null>(null);
  const [attachedProductCards, setAttachedProductCards] = useState<
    IQuickReplyProductCard[]
  >([]);
  const [quickReplyShortcutUsed, setQuickReplyShortcutUsed] = useState<
    string | undefined
  >(undefined);
  const [commentReplyMode, setCommentReplyMode] =
    useState<CommentReplyModeType>("REPLY_COMMENT_ONLY");
  const [autoHideCommentOnReply, setAutoHideCommentOnReply] = useState(true);
  const [isTranslatingDraft, setIsTranslatingDraft] = useState(false);

  const selectedItemsRef = useRef<SelectedFilePreview[]>([]);
  selectedItemsRef.current = selectedItems;

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const emojiContainerRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const shouldSendRecordingRef = useRef<boolean>(true);

  const isComposingRef = useRef<boolean>(false);
  const compositionEndedAtRef = useRef<number>(0);
  const isSubmittingRef = useRef<boolean>(false);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingTimeRef = useRef<number>(0);
  const [isPollModalOpen, setIsPollModalOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const [mentionAll, setMentionAll] = useState(false);
  const [draftLinkPreview, setDraftLinkPreview] =
    useState<ILinkPreviewMetadata | null>(null);
  const lastPreviewedUrlRef = useRef<string | null>(null);

  const activeShopId = usePermissionStore((s) => s.activeShopId);
  const currentUser = useAuthStore((s) => s.currentAccount?.user);

  const {
    activeConversationId,
    conversations,
    conversationDetails,
    replyingTo,
    editingMessage,
    setReplyingTo,
    setEditingMessage,
    translateMessageOrDraft,
  } = useChatStore();
  const t = useTranslations("Chat.Detail.conversation.input");
  const tBubble = useTranslations("Chat.Detail.conversation.bubble");
  const tHeader = useTranslations("Chat.Detail.header");
  const tInbox = useTranslations("OmnichannelInbox");

  const activeReply = activeConversationId
    ? replyingTo[activeConversationId]
    : null;
  const activeEdit = activeConversationId
    ? editingMessage[activeConversationId]
    : null;

  const currentConv = conversations.find((c) => c.id === activeConversationId);
  const isGroupChat = currentConv?.type === "GROUP";
  const canMentionColleagues =
    isGroupChat ||
    isInternalNoteMode ||
    Boolean(currentConv?.shopId || activeShopId);
  const groupMembers = activeConversationId
    ? conversationDetails[activeConversationId]?.members || []
    : [];

  // Phím tắt toàn cục Alt+N để bật/tắt chế độ Ghi chú nội bộ (F03.5)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === "n" || e.key === "N")) {
        e.preventDefault();
        setIsInternalNoteMode((prev) => !prev);
        setTimeout(() => textareaRef.current?.focus(), 20);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const mentionCandidates =
    canMentionColleagues && mentionQuery !== null
      ? groupMembers.filter((m) =>
          (m.nickname || m.name || "")
            .toLowerCase()
            .includes(mentionQuery.toLowerCase()),
        )
      : [];

  const detectMentionAndQuickReplyTrigger = (
    text: string,
    cursorPosition: number,
  ) => {
    // 1. Kiểm tra gõ /shortcut ở đầu dòng
    if (activeShopId && text.startsWith("/")) {
      const firstToken = text.slice(1).split(/\s/)[0] || "";
      if (!text.includes(" ")) {
        setQuickReplyQuery(firstToken);
      } else {
        setQuickReplyQuery(null);
      }
    } else {
      setQuickReplyQuery(null);
    }

    // 2. Kiểm tra gõ @mention đồng nghiệp
    if (!canMentionColleagues) {
      setMentionQuery(null);
      return;
    }
    const textBeforeCursor = text.slice(0, cursorPosition);
    const match = /(?:^|\s)@([^\s@]*)$/.exec(textBeforeCursor);
    if (match) {
      setMentionQuery(match[1]);
    } else {
      setMentionQuery(null);
    }
  };

  const handleSelectMention = (target: {
    userId: string;
    displayName: string;
    isAll?: boolean;
  }) => {
    const textarea = textareaRef.current;
    const cursor = textarea?.selectionStart ?? message.length;
    const before = message.slice(0, cursor);
    const after = message.slice(cursor);
    const replacedBefore = before.replace(
      /(?:^|\s)@([^\s@]*)$/,
      (full) => `${full.startsWith(" ") ? " " : ""}@${target.displayName} `,
    );

    setMessage(`${replacedBefore}${after}`);
    setMentionQuery(null);

    if (target.isAll) {
      setMentionAll(true);
    } else if (!mentionedUserIds.includes(target.userId)) {
      setMentionedUserIds((prev) => [...prev, target.userId]);
    }

    setTimeout(() => textarea?.focus(), 10);
  };

  useEffect(() => {
    const match = message.match(/https?:\/\/[^\s<>"'`]+/i);
    const url = match ? match[0] : null;
    if (!url) {
      setDraftLinkPreview(null);
      lastPreviewedUrlRef.current = null;
      return;
    }
    if (url === lastPreviewedUrlRef.current) return;

    const timer = setTimeout(async () => {
      lastPreviewedUrlRef.current = url;
      try {
        const res: any = await getLinkPreviewApi(url);
        const data = res?.data ?? res;
        if (data?.url) setDraftLinkPreview(data);
      } catch {
        // Ignore preview error
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    if (activeEdit) {
      setMessage(activeEdit.content);
      setTimeout(() => {
        textareaRef.current?.focus();
        const len = activeEdit.content.length;
        textareaRef.current?.setSelectionRange(len, len);
      }, 20);
    }
  }, [activeEdit]);

  useEffect(() => {
    if (activeReply) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 20);
    }
  }, [activeReply]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [message]);

  useEffect(() => {
    if (!isRecording) {
      setRecordSeconds(0);
      return;
    }
    const timer = setInterval(() => {
      setRecordSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isRecording]);

  useEffect(() => {
    if (!showEmojiPicker) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        emojiContainerRef.current &&
        !emojiContainerRef.current.contains(e.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmojiPicker]);

  useEffect(() => {
    return () => {
      selectedItemsRef.current.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, []);

  const appendFiles = useCallback(
    (files: File[]) => {
      if (!files.length) return;
      const newItems: SelectedFilePreview[] = files.map((file) => ({
        file,
        previewUrl:
          file.type.startsWith("image/") || file.type.startsWith("video/")
            ? URL.createObjectURL(file)
            : null,
      }));
      setSelectedItems((prev) => {
        const combined = [...prev, ...newItems];
        if (combined.length > 10) {
          toast.warning(t("maxFilesWarning"));
          combined.slice(10).forEach((item) => {
            if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
          });
          return combined.slice(0, 10);
        }
        return combined;
      });
    },
    [t],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    appendFiles(files);
    e.target.value = "";
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = Array.from(e.clipboardData?.items || []);
    const pastedFiles: File[] = [];
    for (const item of items) {
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file) pastedFiles.push(file);
      }
    }
    if (pastedFiles.length > 0) {
      e.preventDefault();
      appendFiles(pastedFiles);
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedItems((prev) => {
      const target = prev[index];
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const stopTypingNotification = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (activeConversationId) {
      socketService.send(
        SocketNamespaceEnum.CHAT,
        SOCKET_EVENTS.CHAT.TYPING_EMIT,
        {
          conversationId: activeConversationId,
          isTyping: false,
        },
      );
    }
  }, [activeConversationId]);

  const handleTranslateOutboundDraft = async () => {
    if (!message.trim() || isTranslatingDraft) return;
    setIsTranslatingDraft(true);
    const res = await translateMessageOrDraft({
      text: message.trim(),
      targetLang: "en",
      sourceLang: "vi",
    });
    if (res?.translatedText) {
      setMessage(res.translatedText);
    }
    setIsTranslatingDraft(false);
  };

  const handleSend = useCallback(() => {
    if (disabled || isCollisionLockedByOther || isSubmittingRef.current) return;

    const trimmedMessage = message.trim();
    const hasFiles = selectedItems.length > 0;

    if (!trimmedMessage && !hasFiles) return;

    isSubmittingRef.current = true;
    setTimeout(() => {
      isSubmittingRef.current = false;
    }, 250);

    stopTypingNotification();

    setMessage("");
    setShowEmojiPicker(false);
    setMentionQuery(null);
    setQuickReplyQuery(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    if (isInternalNoteMode && onSendInternalNote && trimmedMessage) {
      onSendInternalNote(
        trimmedMessage,
        mentionedUserIds.length > 0 ? mentionedUserIds : undefined,
      );
      setMentionedUserIds([]);
      setMentionAll(false);
      return;
    }

    if (hasFiles && onSendAttachments) {
      const filesToSend = selectedItems.map((item) => item.file);
      selectedItems.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
      setSelectedItems([]);
      onSendAttachments(filesToSend, trimmedMessage || undefined);
      return;
    }

    if (activeEdit && onConfirmEdit) {
      onConfirmEdit(activeEdit.id, trimmedMessage);
    } else if (trimmedMessage) {
      onSendMessage(trimmedMessage, {
        mentionedUserIds:
          mentionedUserIds.length > 0 ? mentionedUserIds : undefined,
        mentionAll: mentionAll || undefined,
        productCards:
          attachedProductCards.length > 0 ? attachedProductCards : undefined,
        quickReplyShortcutUsed,
        commentReplyMode: isCommentThread ? commentReplyMode : undefined,
        autoHideCommentOnReply: isCommentThread
          ? autoHideCommentOnReply
          : undefined,
      });
      setMentionedUserIds([]);
      setMentionAll(false);
      setAttachedProductCards([]);
      setQuickReplyShortcutUsed(undefined);
    }
  }, [
    disabled,
    isCollisionLockedByOther,
    message,
    selectedItems,
    activeEdit,
    isInternalNoteMode,
    mentionedUserIds,
    mentionAll,
    attachedProductCards,
    quickReplyShortcutUsed,
    isCommentThread,
    commentReplyMode,
    autoHideCommentOnReply,
    onSendInternalNote,
    onSendAttachments,
    onConfirmEdit,
    onSendMessage,
    stopTypingNotification,
  ]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isImeComposing =
      e.nativeEvent.isComposing ||
      isComposingRef.current ||
      e.keyCode === 229 ||
      Date.now() - compositionEndedAtRef.current < 50;

    if (e.key === "Enter" && !e.shiftKey) {
      if (isImeComposing) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      handleSend();
    } else if (e.key === "Escape") {
      if (activeConversationId) {
        setReplyingTo(activeConversationId, null);
        setEditingMessage(activeConversationId, null);
      }
      setShowEmojiPicker(false);
      setQuickReplyQuery(null);
      setIsInternalNoteMode(false);
    }
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      shouldSendRecordingRef.current = true;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        if (!shouldSendRecordingRef.current) {
          audioChunksRef.current = [];
          return;
        }
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        if (audioBlob.size > 0 && onSendAttachments) {
          const voiceFile = new File([audioBlob], `voice-${Date.now()}.webm`, {
            type: "audio/webm",
          });
          onSendAttachments([voiceFile], t("voiceMessageLabel"));
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      toast.error(t("micError"));
    }
  };

  const stopAndSendVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      shouldSendRecordingRef.current = true;
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const cancelVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      shouldSendRecordingRef.current = false;
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);
    detectMentionAndQuickReplyTrigger(
      value,
      e.target.selectionStart ?? value.length,
    );

    if (!activeConversationId || isInternalNoteMode) return;

    if (!value.trim()) {
      stopTypingNotification();
      return;
    }

    const now = Date.now();
    const THROTTLE_TIME = 2000;

    if (now - lastTypingTimeRef.current > THROTTLE_TIME) {
      socketService.send(
        SocketNamespaceEnum.CHAT,
        SOCKET_EVENTS.CHAT.TYPING_EMIT,
        { conversationId: activeConversationId, isTyping: true },
      );
      lastTypingTimeRef.current = now;
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socketService.send(
        SocketNamespaceEnum.CHAT,
        SOCKET_EVENTS.CHAT.TYPING_EMIT,
        { conversationId: activeConversationId, isTyping: false },
      );
    }, 3000);
  };

  const getReplySummaryText = () => {
    if (!activeReply) return "";
    if (activeReply.type === MessageTypeEnum.IMAGE)
      return tBubble("mediaPreview.image");
    if (activeReply.type === MessageTypeEnum.VIDEO)
      return tBubble("mediaPreview.video");
    if (activeReply.type === MessageTypeEnum.AUDIO)
      return tBubble("mediaPreview.audio");
    if (activeReply.type === MessageTypeEnum.FILE)
      return activeReply.content
        ? `📎 ${activeReply.content}`
        : tBubble("mediaPreview.file");
    return activeReply.content;
  };

  const clearAllSelectedFiles = useCallback(() => {
    setSelectedItems((prev) => {
      prev.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
      return [];
    });
  }, []);

  const previewableImages: LightboxImageItem[] = selectedItems
    .filter((i) => i.previewUrl && i.file.type.startsWith("image/"))
    .map((i) => ({
      url: i.previewUrl!,
      fileName: i.file.name,
      size: i.file.size,
    }));

  const totalSelectedSize = selectedItems.reduce(
    (sum, item) => sum + item.file.size,
    0,
  );

  if (blockState?.isBlocked) {
    return (
      <LiquidGlass
        variant="danger"
        opacity="10"
        blur="md"
        rounded="2xl"
        isolate={false}
        className="p-3"
        contentClassName="flex items-center justify-between gap-3 flex-wrap"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <Ban className="w-4 h-4 text-destructive shrink-0" />
          <p className="text-xs font-medium text-foreground break-words">
            {blockState.blockedByMe
              ? t("blockedByMeBanner")
              : t("blockedByPartnerBanner")}
          </p>
        </div>
        {blockState.blockedByMe && onUnblockPartner && (
          <PatternButton
            type="button"
            size="sm"
            variant="outline"
            rounded="full"
            onClick={onUnblockPartner}
            className="h-7 px-3 text-xs shrink-0"
          >
            {t("unblockBtn")}
          </PatternButton>
        )}
      </LiquidGlass>
    );
  }

  return (
    <div className="bg-background relative">
      {/* Popover Thư viện Mẫu Câu Trả Lời Nhanh (/shortcut — F03.3 & F03.4) */}
      {activeShopId && quickReplyQuery !== null && (
        <QuickReplyPopover
          open={quickReplyQuery !== null}
          query={quickReplyQuery}
          shopId={activeShopId}
          customerName={currentConv?.name}
          agentName={currentUser?.name}
          pageName={currentConv?.pageName || currentConv?.pageShortCode}
          onSelectQuickReply={(interpolatedText, tpl, productCards) => {
            setMessage(interpolatedText);
            setQuickReplyShortcutUsed(tpl.shortcut);
            if (productCards && productCards.length > 0) {
              setAttachedProductCards(productCards);
            }
            setQuickReplyQuery(null);
            setTimeout(() => textareaRef.current?.focus(), 10);
          }}
          onOpenManageModal={() => {
            setQuickReplyQuery(null);
            router.push(config.routes.private.settingsQuickReplies);
          }}
        />
      )}

      {/* Thanh chọn Chế độ Phản hồi Bình luận Đa Kênh (Comment + Private Reply Inbox — F03.3 & F03.4) */}
      {isCommentThread && !isInternalNoteMode && (
        <div className="flex items-center justify-between gap-2 px-3 py-1.5 mb-2 rounded-xl bg-primary/5 border border-primary/20 text-xs flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-[11px] text-muted-foreground mr-1">
              {tInbox("commentActions.modeLabel")}
            </span>
            {(
              [
                {
                  mode: "REPLY_COMMENT_AND_PRIVATE_INBOX" as CommentReplyModeType,
                  labelKey: "modeBoth",
                  icon: MessageSquareShare,
                },
                {
                  mode: "REPLY_COMMENT_ONLY" as CommentReplyModeType,
                  labelKey: "modePublicOnly",
                  icon: MessageSquare,
                },
                {
                  mode: "SEND_PRIVATE_REPLY_ONLY" as CommentReplyModeType,
                  labelKey: "modePrivateOnly",
                  icon: SendHorizontal,
                },
              ] as const
            ).map((opt) => {
              const IconComp = opt.icon;
              const isSelected = commentReplyMode === opt.mode;
              return (
                <button
                  key={opt.mode}
                  type="button"
                  onClick={() => setCommentReplyMode(opt.mode)}
                  className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border transition-all cursor-pointer",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                      : "bg-background/80 text-muted-foreground border-border/50 hover:text-foreground",
                  )}
                >
                  <IconComp className="w-3 h-3 shrink-0" />
                  <span>{tInbox(`commentActions.${opt.labelKey}` as any)}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setAutoHideCommentOnReply((v) => !v)}
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors cursor-pointer",
              autoHideCommentOnReply
                ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40"
                : "text-muted-foreground border-border/40",
            )}
          >
            <EyeOff className="w-3 h-3 shrink-0" />
            <span>{tInbox("commentActions.autoHideToggle")}</span>
          </button>
        </div>
      )}

      {/* Popover @mention đồng nghiệp trong Nhóm hoặc Ghi chú nội bộ */}
      {canMentionColleagues && mentionQuery !== null && (
        <LiquidGlass
          variant="primary"
          blur="xl"
          opacity="95"
          rounded="2xl"
          isolate={false}
          className="absolute bottom-full left-0 mb-2 w-72 max-w-[calc(100vw-2rem)] p-1.5 border shadow-xl z-40"
        >
          <ScrollArea className="max-h-48 pr-1">
            <div className="space-y-0.5">
              {isGroupChat && (
                <button
                  type="button"
                  onClick={() =>
                    handleSelectMention({
                      userId: "ALL",
                      displayName: "All",
                      isAll: true,
                    })
                  }
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-primary/10 text-left text-xs font-semibold text-primary cursor-pointer"
                >
                  <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                    <AtSign className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate">@All</p>
                    <p className="text-[10px] text-muted-foreground font-normal truncate">
                      {t("mentionAllDesc")}
                    </p>
                  </div>
                </button>
              )}

              {mentionCandidates.map((member) => {
                const label = member.nickname || member.name;
                return (
                  <button
                    key={member.userId}
                    type="button"
                    onClick={() =>
                      handleSelectMention({
                        userId: member.userId,
                        displayName: label,
                      })
                    }
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-muted text-left text-xs cursor-pointer"
                  >
                    <GlassAvatar src={member.avatar} name={label} size="xs" />
                    <span className="font-medium truncate">{label}</span>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </LiquidGlass>
      )}

      {/* Huy hiệu chế độ Ghi chú nội bộ (Alt+N — F03.5) */}
      {isInternalNoteMode && (
        <div className="flex items-center justify-between gap-2 px-3 py-1.5 mb-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-700 dark:text-amber-300 text-xs">
          <div className="flex items-center gap-1.5 font-semibold">
            <StickyNote className="w-3.5 h-3.5 shrink-0" />
            <span>{tInbox("composer.internalNoteBadge")}</span>
          </div>
          <GlassIconButton
            size="sm"
            variant="ghost"
            className="h-6 w-6"
            icon={<X className="w-3.5 h-3.5" />}
            onClick={() => setIsInternalNoteMode(false)}
          />
        </div>
      )}

      {/* Thẻ sản phẩm đính kèm từ Quick Reply (F03.3) */}
      {attachedProductCards.length > 0 && (
        <div className="flex items-center justify-between gap-2 px-3 py-1.5 mb-2 rounded-xl bg-sky-500/10 border border-sky-500/30 text-xs">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <ShoppingBag className="w-3.5 h-3.5 text-sky-500 shrink-0" />
            {attachedProductCards.map((card) => (
              <GlassBadge key={card.skuCode} variant="info" size="sm">
                {card.name} ({card.retailPrice.toLocaleString("vi-VN")}đ)
              </GlassBadge>
            ))}
          </div>
          <GlassIconButton
            size="sm"
            variant="ghost"
            className="h-6 w-6 shrink-0"
            icon={<X className="w-3.5 h-3.5" />}
            onClick={() => setAttachedProductCards([])}
          />
        </div>
      )}

      {draftLinkPreview && (
        <div className="flex items-center justify-between gap-2.5 px-3 py-2 mb-2 rounded-xl bg-muted/60 border border-border/60 text-xs">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <Link2 className="w-4 h-4 text-primary shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold truncate">
                {draftLinkPreview.title || draftLinkPreview.hostname}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {draftLinkPreview.description || draftLinkPreview.url}
              </p>
            </div>
          </div>
          <GlassIconButton
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 w-6 shrink-0"
            icon={<X className="w-3.5 h-3.5" />}
            onClick={() => setDraftLinkPreview(null)}
          />
        </div>
      )}

      {isGroupChat && activeConversationId && (
        <CreatePollModal
          open={isPollModalOpen}
          onOpenChange={setIsPollModalOpen}
          conversationId={activeConversationId}
        />
      )}

      {(activeReply || activeEdit) && activeConversationId && (
        <div className="flex items-center justify-between gap-2.5 sm:gap-3 px-3 sm:px-3.5 py-2 mb-2 rounded-2xl bg-primary/5 dark:bg-primary/10 border border-primary/20 text-xs animate-in fade-in slide-in-from-bottom-2 duration-200">
          <button
            type="button"
            onClick={() => {
              const targetId = activeEdit?.id || activeReply?.id;
              if (targetId && onScrollToMessage) {
                onScrollToMessage(targetId);
              }
            }}
            className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer group"
          >
            <div className="p-1.5 rounded-full bg-primary/15 text-primary shrink-0">
              {activeEdit ? (
                <Pencil className="w-3.5 h-3.5" />
              ) : (
                <Reply className="w-3.5 h-3.5" />
              )}
            </div>
            <div className="min-w-0 flex-1 border-l-2 border-primary pl-2.5">
              <p className="font-semibold text-primary truncate">
                {activeEdit
                  ? t("editingTitle")
                  : t("replyingTo", {
                      name: activeReply?.sender?.name || tHeader("defaultUser"),
                    })}
              </p>
              <p className="truncate text-muted-foreground group-hover:text-foreground transition-colors mt-0.5">
                {activeEdit ? activeEdit.content : getReplySummaryText()}
              </p>
            </div>
          </button>

          <GlassIconButton
            type="button"
            variant="ghost"
            color="danger"
            size="sm"
            className="h-7 w-7 shrink-0 hover:bg-destructive/10 hover:text-destructive"
            icon={<X className="w-4 h-4" />}
            onClick={() => {
              setReplyingTo(activeConversationId, null);
              setEditingMessage(activeConversationId, null);
              if (activeEdit) setMessage("");
            }}
          />
        </div>
      )}

      {selectedItems.length > 0 && (
        <LiquidGlassCard
          isolate={false}
          rounded="2xl"
          className="mb-2.5 p-2.5 sm:p-3 border border-border/60"
          contentClassName="space-y-2.5"
        >
          <div className="flex items-center justify-between gap-2 px-0.5">
            <div className="flex items-center gap-2 min-w-0">
              <GlassBadge
                variant="secondary"
                size="sm"
                className="font-semibold px-2.5 py-0.5"
              >
                {t("previewCount", { count: selectedItems.length })}
              </GlassBadge>
              <span className="text-[11px] text-muted-foreground truncate">
                {formatFileSize(totalSelectedSize)}
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <PatternButton
                type="button"
                variant="ghost"
                color="primary"
                size="sm"
                rounded="full"
                onClick={() => fileInputRef.current?.click()}
                className="h-7 px-2 text-xs text-primary hover:bg-primary/10"
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                {t("addMoreFiles")}
              </PatternButton>
              <PatternButton
                type="button"
                variant="ghost"
                color="danger"
                size="sm"
                rounded="full"
                onClick={clearAllSelectedFiles}
                className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                icon={<Trash2 className="w-3.5 h-3.5" />}
              >
                {t("clearAllFiles")}
              </PatternButton>
            </div>
          </div>

          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex items-center gap-2.5 pb-2 pt-1 px-0.5">
              {selectedItems.map((item, idx) => {
                const isImage =
                  Boolean(item.previewUrl) &&
                  item.file.type.startsWith("image/");
                const isVideo =
                  Boolean(item.previewUrl) &&
                  item.file.type.startsWith("video/");
                const ext =
                  item.file.name.split(".").pop()?.toUpperCase() || "FILE";

                if (isImage || isVideo) {
                  return (
                    <div
                      key={`${item.file.name}-${idx}`}
                      className="relative group/preview w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-border/60 bg-muted shrink-0 shadow-xs"
                    >
                      {isImage ? (
                        <img
                          src={item.previewUrl!}
                          alt={item.file.name}
                          className="w-full h-full object-cover transition-transform duration-200 group-hover/preview:scale-105"
                        />
                      ) : (
                        <video
                          src={item.previewUrl!}
                          className="w-full h-full object-cover"
                          muted
                        />
                      )}

                      {isImage && (
                        <button
                          type="button"
                          onClick={() => {
                            const imgIdx = previewableImages.findIndex(
                              (img) => img.url === item.previewUrl,
                            );
                            if (imgIdx !== -1) setPreviewLightboxIndex(imgIdx);
                          }}
                          className="absolute inset-0 bg-black/35 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                          title={t("clickToPreview")}
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      )}

                      <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between gap-1 pointer-events-none">
                        <span className="px-1.5 py-0.2 rounded bg-black/65 text-[9px] font-semibold text-white truncate">
                          {formatFileSize(item.file.size)}
                        </span>
                      </div>

                      <PatternButton
                        type="button"
                        variant="solid"
                        color="danger"
                        size="icon"
                        rounded="full"
                        onClick={() => removeSelectedFile(idx)}
                        className="absolute top-1 right-1 h-5 w-5 shadow-md opacity-95 hover:scale-110 transition-transform"
                      >
                        <X className="w-3 h-3" />
                      </PatternButton>
                    </div>
                  );
                }

                return (
                  <LiquidGlass
                    key={`${item.file.name}-${idx}`}
                    variant="secondary"
                    blur="md"
                    opacity="70"
                    rounded="xl"
                    fluid={false}
                    isolate={false}
                    className="p-2.5 pr-8 border border-border/60 shrink-0 w-52"
                    contentClassName="flex items-center gap-2.5"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex flex-col items-center justify-center shrink-0">
                      {item.file.type.startsWith("audio/") ? (
                        <Volume2 className="w-4 h-4" />
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                      <span className="text-[8px] font-bold mt-0.5 truncate max-w-[34px]">
                        {ext}
                      </span>
                    </div>

                    <div className="flex flex-col min-w-0 flex-1">
                      <span
                        title={item.file.name}
                        className="text-xs font-semibold truncate text-foreground"
                      >
                        {item.file.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatFileSize(item.file.size)}
                      </span>
                    </div>

                    <PatternButton
                      type="button"
                      variant="ghost"
                      size="icon"
                      rounded="full"
                      onClick={() => removeSelectedFile(idx)}
                      className="absolute top-1.5 right-1.5 h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <X className="w-3.5 h-3.5" />
                    </PatternButton>
                  </LiquidGlass>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </LiquidGlassCard>
      )}

      <ImageLightboxModal
        open={previewLightboxIndex !== null}
        onOpenChange={(open) => !open && setPreviewLightboxIndex(null)}
        images={previewableImages}
        initialIndex={previewLightboxIndex ?? 0}
      />

      {showEmojiPicker && (
        <div
          ref={emojiContainerRef}
          className="absolute bottom-full right-2 sm:right-4 mb-2 p-2.5 bg-background/95 border rounded-2xl shadow-xl grid grid-cols-4 gap-1.5 w-60 sm:w-64 max-w-[calc(100vw-2rem)] z-30 animate-in fade-in zoom-in-95 duration-150"
        >
          {COMMON_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                setMessage((prev) => `${prev}${emoji}`);
                textareaRef.current?.focus();
              }}
              className="text-xl p-1.5 hover:bg-muted rounded-xl transition-transform hover:scale-115 flex items-center justify-center"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={imageInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <LiquidGlass
        variant={isInternalNoteMode ? "warning" : "primary"}
        blur="md"
        rounded="2xl"
        isolate={false}
        className={cn(
          "p-1.5 sm:p-2 border transition-all",
          isInternalNoteMode
            ? "border-amber-500/50 focus-within:ring-2 focus-within:ring-amber-500/30"
            : "focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50",
        )}
        contentClassName="flex items-end gap-1.5 sm:gap-2 w-full"
      >
        {!isRecording && (
          <div className="flex gap-0.5 pb-0.5 shrink-0">
            {activeShopId && (
              <PermissionGate can="INBOX_INTERNAL_NOTE_WRITE" mode="hide">
                <GlassIconButton
                  type="button"
                  variant={isInternalNoteMode ? "solid" : "ghost"}
                  color={isInternalNoteMode ? "warning" : "neutral"}
                  onClick={() => setIsInternalNoteMode((v) => !v)}
                  className="h-8 w-8 sm:h-9 sm:w-9"
                  tooltip={tInbox("composer.internalNoteBadge")}
                  icon={<StickyNote className="w-4 h-4 sm:w-5 sm:h-5" />}
                />
              </PermissionGate>
            )}

            {activeShopId && (
              <GlassIconButton
                type="button"
                variant={quickReplyQuery !== null ? "solid" : "ghost"}
                color={quickReplyQuery !== null ? "primary" : "neutral"}
                onClick={() =>
                  setQuickReplyQuery((prev) => (prev === null ? "" : null))
                }
                className="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-primary"
                tooltip={tInbox("composer.quickReplyHint")}
                icon={<Zap className="w-4 h-4 sm:w-5 sm:h-5" />}
              />
            )}

            {isGroupChat && activeConversationId && (
              <GlassIconButton
                type="button"
                variant="ghost"
                onClick={() => setIsPollModalOpen(true)}
                className="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-primary"
                tooltip={t("createPoll")}
                icon={<BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />}
              />
            )}
            <GlassIconButton
              type="button"
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
              className="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-foreground"
              tooltip={t("attachFile")}
              icon={<Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />}
            />
            <div className="hidden sm:inline-flex">
              <GlassIconButton
                type="button"
                variant="ghost"
                onClick={() => imageInputRef.current?.click()}
                className="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-foreground"
                tooltip={t("attachMedia")}
                icon={<ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
              />
            </div>
            <GlassIconButton
              type="button"
              variant="ghost"
              onClick={startVoiceRecording}
              className="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-foreground"
              tooltip={t("recordVoice")}
              icon={<Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
            />
          </div>
        )}

        {isRecording ? (
          <div className="flex-1 flex items-center justify-between gap-2 sm:gap-3 px-2.5 sm:px-3 py-1.5 bg-red-500/10 rounded-xl border border-red-500/20">
            <div className="flex items-center gap-2 text-xs text-red-500 font-semibold truncate">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
              <span className="truncate">
                {t("recording")} {Math.floor(recordSeconds / 60)}:
                {(recordSeconds % 60).toString().padStart(2, "0")}
              </span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <PatternButton
                type="button"
                variant="ghost"
                color="danger"
                size="sm"
                rounded="md"
                onClick={cancelVoiceRecording}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                icon={<Trash2 className="w-3.5 h-3.5" />}
              >
                {t("cancel")}
              </PatternButton>
              <PatternButton
                type="button"
                variant="solid"
                color="danger"
                size="sm"
                rounded="md"
                onClick={stopAndSendVoiceRecording}
                className="h-7 px-3 text-xs"
                icon={<Square className="w-3 h-3 fill-current" />}
              >
                {t("send")}
              </PatternButton>
            </div>
          </div>
        ) : (
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onCompositionStart={() => {
              isComposingRef.current = true;
            }}
            onCompositionEnd={() => {
              isComposingRef.current = false;
              compositionEndedAtRef.current = Date.now();
            }}
            placeholder={
              isInternalNoteMode
                ? tInbox("composer.internalNotePlaceholder")
                : activeShopId
                  ? tInbox("composer.replyPlaceholder")
                  : t("placeholder")
            }
            className="min-h-8 sm:min-h-9 max-h-[150px] w-full resize-none border-0 bg-transparent px-1.5 sm:px-2 py-1.5 focus-visible:ring-0 shadow-none scrollbar-hide text-sm leading-relaxed"
            rows={1}
            disabled={disabled || isCollisionLockedByOther}
          />
        )}

        {!isRecording && (
          <div className="flex gap-0.5 sm:gap-1 pb-0.5 shrink-0">
            {activeShopId && message.trim().length > 0 && (
              <PermissionGate can="INBOX_TRANSLATION_USE" mode="hide">
                <GlassIconButton
                  type="button"
                  variant="ghost"
                  onClick={handleTranslateOutboundDraft}
                  className="h-8 w-8 sm:h-9 sm:w-9 text-sky-500 hover:bg-sky-500/10"
                  tooltip={tInbox("translation.translateDraftTooltip")}
                  icon={<Languages className="w-4 h-4" />}
                />
              </PermissionGate>
            )}

            <div className="hidden sm:inline-flex">
              <GlassIconButton
                type="button"
                variant="ghost"
                onClick={() => setShowEmojiPicker((v) => !v)}
                className="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-foreground"
                tooltip={t("emoji")}
                icon={<Smile className="w-4 h-4 sm:w-5 sm:h-5" />}
              />
            </div>

            <PatternButton
              type="button"
              onClick={handleSend}
              disabled={
                (!message.trim() && selectedItems.length === 0) ||
                disabled ||
                isCollisionLockedByOther
              }
              size="icon"
              rounded="full"
              variant={
                message.trim() || selectedItems.length > 0 ? "solid" : "ghost"
              }
              color={isInternalNoteMode ? "warning" : "primary"}
              className={cn(
                "h-8 w-8 sm:h-9 sm:w-9 transition-all duration-200",
                message.trim() || selectedItems.length > 0
                  ? isInternalNoteMode
                    ? "bg-amber-500 text-white hover:bg-amber-600 shadow-sm scale-100"
                    : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm scale-100"
                  : "bg-transparent text-muted-foreground hover:bg-muted scale-95",
              )}
            >
              <SendHorizontal className="w-4 h-4" />
            </PatternButton>
          </div>
        )}
      </LiquidGlass>
    </div>
  );
};
