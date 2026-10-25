/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
/** biome-ignore-all lint/suspicious/useIterableCallbackReturn: <explanation> */
"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  SendHorizontal,
  Paperclip,
  Smile,
  Image as ImageIcon,
  Mic,
  Square,
  X,
  Reply,
  Pencil,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/lib/stores/chat/use-chat-store";
import { SocketNamespaceEnum } from "@/common/enum";
import { SOCKET_EVENTS } from "@/constant/socket-events";
import { socketService } from "@/services/socket/socket-client";
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
];

export interface IChatInputProps {
  onSendMessage: (content: string) => void;
  onSendAttachments?: (files: File[], content?: string) => void;
  onConfirmEdit?: (messageId: string, newContent: string) => void;
  disabled?: boolean;
}

export const ChatInput = ({
  onSendMessage,
  onSendAttachments,
  onConfirmEdit,
  disabled,
}: IChatInputProps) => {
  const [message, setMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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

  const activeReply = activeConversationId
    ? replyingTo[activeConversationId]
    : null;
  const activeEdit = activeConversationId
    ? editingMessage[activeConversationId]
    : null;

  useEffect(() => {
    if (activeEdit) {
      setMessage(activeEdit.content);
      textareaRef.current?.focus();
    }
  }, [activeEdit]);

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === "Escape") {
      if (activeConversationId) {
        setReplyingTo(activeConversationId, null);
        setEditingMessage(activeConversationId, null);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...files].slice(0, 10));
    }
    e.target.value = "";
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        if (audioBlob.size > 0 && onSendAttachments) {
          const voiceFile = new File([audioBlob], `voice-${Date.now()}.webm`, {
            type: "audio/webm",
          });
          onSendAttachments([voiceFile], "Tin nhắn thoại");
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      toast.error("Không thể truy cập Microphone để ghi âm");
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSend = () => {
    if (selectedFiles.length > 0 && onSendAttachments) {
      onSendAttachments(selectedFiles, message.trim() || undefined);
      setSelectedFiles([]);
      setMessage("");
      return;
    }

    if (!message.trim()) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
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

    if (activeEdit && onConfirmEdit) {
      onConfirmEdit(activeEdit.id, message.trim());
    } else {
      onSendMessage(message.trim());
    }

    setMessage("");
    setShowEmojiPicker(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleInputChange = (e: {
    target: { value: React.SetStateAction<string> };
  }) => {
    const value = e.target.value;
    setMessage(value);

    if (!activeConversationId) return;

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

  return (
    <div className="bg-background relative">
      {/* Thanh hiển thị Trả lời / Chỉnh sửa tin nhắn */}
      {(activeReply || activeEdit) && activeConversationId && (
        <div className="flex items-center justify-between gap-2 px-3 py-2 mb-2 rounded-xl bg-muted/70 border text-xs animate-in fade-in slide-in-from-bottom-1">
          <div className="flex items-center gap-2 min-w-0">
            {activeEdit ? (
              <Pencil className="w-4 h-4 text-primary shrink-0" />
            ) : (
              <Reply className="w-4 h-4 text-primary shrink-0" />
            )}
            <div className="min-w-0">
              <p className="font-semibold text-primary">
                {activeEdit
                  ? "Đang chỉnh sửa tin nhắn"
                  : `Đang trả lời ${activeReply?.sender?.name || "tin nhắn"}`}
              </p>
              <p className="truncate text-muted-foreground">
                {activeEdit ? activeEdit.content : activeReply?.content}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-full shrink-0"
            onClick={() => {
              setReplyingTo(activeConversationId, null);
              setEditingMessage(activeConversationId, null);
              if (activeEdit) setMessage("");
            }}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      {/* Thanh xem trước tệp đính kèm đã chọn */}
      {selectedFiles.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-2">
          {selectedFiles.map((file, idx) => (
            <div
              key={`${file.name}-${idx}`}
              className="relative flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-muted border text-xs shrink-0"
            >
              <FileText className="w-4 h-4 text-primary shrink-0" />
              <span className="max-w-[120px] truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => removeSelectedFile(idx)}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Bộ chọn Emoji nổi */}
      {showEmojiPicker && (
        <div className="absolute bottom-full right-4 mb-2 p-2 bg-background border rounded-2xl shadow-xl flex flex-wrap gap-1.5 w-60 z-30">
          {COMMON_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setMessage((prev) => `${prev}${emoji}`)}
              className="text-lg p-1 hover:bg-muted rounded-lg transition-transform hover:scale-110"
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

      <div className="flex items-end gap-2 bg-muted/50 p-2 rounded-xl border focus-within:ring-1 focus-within:ring-ring focus-within:border-primary/50 transition-all">
        <div className="flex gap-1 pb-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full"
            title="Đính kèm tệp"
          >
            <Paperclip className="w-5 h-5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => imageInputRef.current?.click()}
            className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full hidden sm:inline-flex"
            title="Gửi ảnh hoặc video"
          >
            <ImageIcon className="w-5 h-5" />
          </Button>
          <Button
            type="button"
            variant={isRecording ? "destructive" : "ghost"}
            size="icon"
            onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
            className="h-8 w-8 rounded-full"
            title={isRecording ? "Dừng và gửi ghi âm" : "Ghi âm giọng nói"}
          >
            {isRecording ? (
              <Square className="w-4 h-4" />
            ) : (
              <Mic className="w-5 h-5 text-muted-foreground hover:text-foreground" />
            )}
          </Button>
        </div>

        {isRecording ? (
          <div className="flex-1 flex items-center gap-2 px-3 py-2 text-xs text-red-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span>
              Đang ghi âm... ({recordSeconds}s) — Nhấn nút dừng để gửi
            </span>
          </div>
        ) : (
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e: {
              target: { value: React.SetStateAction<string> };
            }) => handleInputChange(e)}
            onKeyDown={handleKeyDown}
            placeholder={t("placeholder")}
            className="min-h-10 max-h-[150px] w-full resize-none border-0 bg-transparent p-2 focus-visible:ring-0 shadow-none scrollbar-hide text-sm"
            rows={1}
            disabled={disabled}
          />
        )}

        <div className="flex gap-1 pb-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShowEmojiPicker((v) => !v)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full hidden sm:inline-flex"
          >
            <Smile className="w-5 h-5" />
          </Button>
          <Button
            type="button"
            onClick={handleSend}
            disabled={
              (!message.trim() && selectedFiles.length === 0) || disabled
            }
            size="icon"
            className={cn(
              "h-8 w-8 rounded-full transition-all duration-200",
              message.trim() || selectedFiles.length > 0
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-transparent text-muted-foreground hover:bg-muted",
            )}
          >
            <SendHorizontal className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
