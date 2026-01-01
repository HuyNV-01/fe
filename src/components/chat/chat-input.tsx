/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/lib/stores/chat/use-chat-store";
import { SocketNamespaceEnum } from "@/common/enum";
import { SOCKET_EVENTS } from "@/constant/socket-events";
import { socketService } from "@/services/socket/socket-client";
import { useTranslations } from "next-intl";

export interface IChatInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
}

export const ChatInput = ({ onSendMessage, disabled }: IChatInputProps) => {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingTimeRef = useRef<number>(0);

  const { activeConversationId } = useChatStore();
  const t = useTranslations("Chat.Detail.conversation.input");

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [message]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (message.trim()) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      socketService.send(
        SocketNamespaceEnum.CHAT,
        SOCKET_EVENTS.CHAT.TYPING_EMIT,
        {
          conversationId: activeConversationId,
          isTyping: false,
        },
      );

      onSendMessage(message);
      setMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
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
    <div className="p-4 bg-background">
      <div className="flex items-end gap-2 bg-muted/50 p-2 rounded-xl border focus-within:ring-1 focus-within:ring-ring focus-within:border-primary/50 transition-all">
        <div className="flex gap-1 pb-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full"
          >
            <Paperclip className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full hidden sm:inline-flex"
          >
            <ImageIcon className="w-5 h-5" />
          </Button>
        </div>

        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e: { target: { value: React.SetStateAction<string> } }) =>
            handleInputChange(e)
          }
          onKeyDown={handleKeyDown}
          placeholder={t("placeholder")}
          className="min-h-10 max-h-[150px] w-full resize-none border-0 bg-transparent p-2 focus-visible:ring-0 shadow-none scrollbar-hide text-sm"
          rows={1}
          disabled={disabled}
        />

        <div className="flex gap-1 pb-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full hidden sm:inline-flex"
          >
            <Smile className="w-5 h-5" />
          </Button>
          <Button
            onClick={handleSend}
            disabled={!message.trim() || disabled}
            size="icon"
            className={cn(
              "h-8 w-8 rounded-full transition-all duration-200",
              message.trim()
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
