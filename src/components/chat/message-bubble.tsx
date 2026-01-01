"use client";

import { memo, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, CheckCheck, Clock } from "lucide-react";
import { MessageTypeEnum } from "@/common/enum";
import type { IMessage, MessageStatus } from "@/types/chat";
import { useDateFormat } from "@/utils/hooks/use-date-format";

interface MessageBubbleProps {
  message: IMessage & { status?: MessageStatus };
  isMe: boolean;
  isContinuous?: boolean;
  avatarUrl?: string;
  displayName?: string;
}

export const MessageBubble = memo(
  ({
    message,
    isMe,
    isContinuous = false,
    avatarUrl,
    displayName,
  }: MessageBubbleProps) => {
    const { toChatTime } = useDateFormat();
    const timeString = useMemo(() => {
      return toChatTime(message.createdAt);
    }, [message.createdAt, toChatTime]);

    const renderStatusIcon = () => {
      if (!isMe) return null;

      switch (message.status) {
        case "sending":
          return (
            <Clock className="w-3 h-3 text-muted-foreground animate-pulse" />
          );
        case "sent":
          return <Check className="w-3 h-3 text-muted-foreground" />;
        case "read":
          return <CheckCheck className="w-3 h-3 text-blue-500" />;
        default:
          return <CheckCheck className="w-3 h-3 text-muted-foreground" />;
      }
    };

    return (
      <div
        className={cn(
          "flex w-full mb-1 animate-in fade-in slide-in-from-bottom-2 duration-300",
          isMe ? "justify-end" : "justify-start",
          isContinuous ? "mt-0.5" : "mt-4",
        )}
      >
        <div
          className={cn(
            "flex max-w-[75%] md:max-w-[65%] items-end gap-2",
            isMe ? "flex-row-reverse" : "flex-row",
          )}
        >
          {!isMe && (
            <div className="w-8 shrink-0">
              {!isContinuous ? (
                <Avatar className="w-8 h-8 border border-border/50 shadow-sm">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                    {displayName?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="w-8" />
              )}
            </div>
          )}

          <div
            className={cn(
              "relative px-4 py-2 text-sm shadow-sm transition-all",
              isMe
                ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm"
                : "bg-white dark:bg-muted text-foreground border border-border/50 rounded-2xl rounded-tl-sm",
              isContinuous && isMe && "rounded-tr-2xl",
              isContinuous && !isMe && "rounded-tl-2xl",
            )}
          >
            {message.type === MessageTypeEnum.IMAGE && (
              <div className="mb-2 overflow-hidden rounded-lg">
                {/* Thay bằng Next/Image nếu cần optimize */}
                <img
                  src={message.content}
                  alt="attachment"
                  className="max-w-full h-auto object-cover"
                  loading="lazy"
                />
              </div>
            )}

            {/* Nội dung Text */}
            {message.type === MessageTypeEnum.TEXT && (
              <p className="whitespace-pre-wrap leading-relaxed break-words">
                {message.content}
              </p>
            )}

            {/* Time & Status */}
            <div
              className={cn(
                "flex items-center gap-1 text-[10px] mt-1 select-none",
                isMe
                  ? "justify-end text-primary-foreground/70"
                  : "justify-start text-muted-foreground",
              )}
            >
              <span>{timeString}</span>
              {renderStatusIcon()}
            </div>
          </div>
        </div>
      </div>
    );
  },
);

MessageBubble.displayName = "MessageBubble";
