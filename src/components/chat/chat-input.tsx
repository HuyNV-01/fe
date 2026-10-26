/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
/** biome-ignore-all lint/suspicious/useIterableCallbackReturn: <explanation> */
"use client";

import type React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  Film,
  Volume2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/lib/stores/chat/use-chat-store";
import { MessageTypeEnum, SocketNamespaceEnum } from "@/common/enum";
import { SOCKET_EVENTS } from "@/constant/socket-events";
import { socketService } from "@/services/socket/socket-client";
import { formatFileSize } from "@/utils/crypto-e2ee";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

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
  onSendMessage: (content: string) => Promise<void> | void;
  onSendAttachments?: (files: File[], content?: string) => Promise<void> | void;
  onConfirmEdit?: (
    messageId: string,
    newContent: string,
  ) => Promise<void> | void;
  onScrollToMessage?: (messageId: string) => void;
  disabled?: boolean;
}

export const ChatInput = ({
  onSendMessage,
  onSendAttachments,
  onConfirmEdit,
  onScrollToMessage,
  disabled,
}: IChatInputProps) => {
  const [message, setMessage] = useState("");
  const [selectedItems, setSelectedItems] = useState<SelectedFilePreview[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);

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

  const {
    activeConversationId,
    replyingTo,
    editingMessage,
    setReplyingTo,
    setEditingMessage,
  } = useChatStore();
  const t = useTranslations("Chat.Detail.conversation.input");
  const tBubble = useTranslations("Chat.Detail.conversation.bubble");
  const tHeader = useTranslations("Chat.Detail.header");

  const activeReply = activeConversationId
    ? replyingTo[activeConversationId]
    : null;
  const activeEdit = activeConversationId
    ? editingMessage[activeConversationId]
    : null;

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
      selectedItems.forEach((item) => {
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

  const handleSend = useCallback(() => {
    if (disabled || isSubmittingRef.current) return;

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
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
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
      onSendMessage(trimmedMessage);
    }
  }, [
    disabled,
    message,
    selectedItems,
    activeEdit,
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

    if (!activeConversationId) return;

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

  return (
    <div className="bg-background relative">
      {/* Thanh hiển thị Trả lời / Chỉnh sửa tin nhắn */}
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

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full shrink-0 hover:bg-destructive/10 hover:text-destructive"
            onClick={() => {
              setReplyingTo(activeConversationId, null);
              setEditingMessage(activeConversationId, null);
              if (activeEdit) setMessage("");
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Thanh xem trước tệp đính kèm đã chọn */}
      {selectedItems.length > 0 && (
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2.5 mb-2 scrollbar-thin">
          {selectedItems.map((item, idx) => (
            <div
              key={`${item.file.name}-${idx}`}
              className="relative group flex items-center gap-2.5 p-2 rounded-xl bg-muted/80 border border-border/60 text-xs shrink-0 shadow-2xs"
            >
              {item.previewUrl && item.file.type.startsWith("image/") ? (
                <img
                  src={item.previewUrl}
                  alt={item.file.name}
                  className="w-11 h-11 rounded-lg object-cover border"
                />
              ) : item.file.type.startsWith("video/") ? (
                <div className="w-11 h-11 rounded-lg bg-indigo-500/15 text-indigo-500 flex items-center justify-center">
                  <Film className="w-5 h-5" />
                </div>
              ) : item.file.type.startsWith("audio/") ? (
                <div className="w-11 h-11 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                  <Volume2 className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
              )}

              <div className="flex flex-col min-w-0 max-w-[130px] pr-4">
                <span className="font-medium truncate">{item.file.name}</span>
                <span className="text-[10px] text-muted-foreground">
                  {formatFileSize(item.file.size)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => removeSelectedFile(idx)}
                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Bộ chọn Emoji nổi */}
      {showEmojiPicker && (
        <div
          ref={emojiContainerRef}
          className="absolute bottom-full right-2 sm:right-4 mb-2 p-2.5 bg-background/95 backdrop-blur-xl border rounded-2xl shadow-xl grid grid-cols-4 gap-1.5 w-60 sm:w-64 max-w-[calc(100vw-2rem)] z-30 animate-in fade-in zoom-in-95 duration-150"
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

      {/* Input ẩn cho File và Hình ảnh/Video */}
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

      <div className="flex items-end gap-1.5 sm:gap-2 bg-muted/50 p-1.5 sm:p-2 rounded-2xl border focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all">
        {!isRecording && (
          <div className="flex gap-0.5 pb-0.5 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              className="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-foreground rounded-full"
              title={t("attachFile")}
            >
              <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => imageInputRef.current?.click()}
              className="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-foreground rounded-full hidden sm:inline-flex"
              title={t("attachMedia")}
            >
              <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={startVoiceRecording}
              className="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-foreground rounded-full"
              title={t("recordVoice")}
            >
              <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
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
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={cancelVoiceRecording}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive rounded-lg"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                {t("cancel")}
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={stopAndSendVoiceRecording}
                className="h-7 px-3 text-xs rounded-lg"
              >
                <Square className="w-3 h-3 mr-1.5 fill-current" />
                {t("send")}
              </Button>
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
            placeholder={t("placeholder")}
            className="min-h-8 sm:min-h-9 max-h-[150px] w-full resize-none border-0 bg-transparent px-1.5 sm:px-2 py-1.5 focus-visible:ring-0 shadow-none scrollbar-hide text-sm leading-relaxed"
            rows={1}
            disabled={disabled}
          />
        )}

        {!isRecording && (
          <div className="flex gap-0.5 sm:gap-1 pb-0.5 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowEmojiPicker((v) => !v)}
              className="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-foreground rounded-full hidden sm:inline-flex"
              title={t("emoji")}
            >
              <Smile className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <Button
              type="button"
              onClick={handleSend}
              disabled={
                (!message.trim() && selectedItems.length === 0) || disabled
              }
              size="icon"
              className={cn(
                "h-8 w-8 sm:h-9 sm:w-9 rounded-full transition-all duration-200",
                message.trim() || selectedItems.length > 0
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm scale-100"
                  : "bg-transparent text-muted-foreground hover:bg-muted scale-95",
              )}
            >
              <SendHorizontal className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
