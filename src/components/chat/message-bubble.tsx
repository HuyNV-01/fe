"use client";

import { memo, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertCircle, Check, CheckCheck, Clock } from "lucide-react";
import { MessageTypeEnum } from "@/common/enum";
import type { IMessage } from "@/types/chat";
import { useDateFormat } from "@/utils/hooks/use-date-format";
import { MessageReadList } from "./message-read-list";

interface MessageBubbleProps {
  message: IMessage;
  isMe: boolean;
  isContinuous?: boolean;
  isLastInGroup?: boolean;
  avatarUrl?: string;
  displayName?: string;
  displayReaders?: { id: string; name: string; avatar: string | null }[];
}

export const MessageBubble = memo(
  ({
    message,
    isMe,
    isContinuous = false,
    isLastInGroup = false,
    avatarUrl,
    displayName,
    displayReaders,
  }: MessageBubbleProps) => {
    const { toChatTime } = useDateFormat();

    const timeString = useMemo(
      () => toChatTime(message.createdAt),
      [message.createdAt, toChatTime],
    );

    const StatusIcon = useMemo(() => {
      if (!isMe) return null;

      switch (message.status) {
        case "sending":
          return (
            <Clock className="w-3 h-3 text-muted-foreground/70 animate-pulse" />
          );
        case "sent":
          return <Check className="w-3 h-3 text-muted-foreground" />;
        case "delivered":
          return <CheckCheck className="w-3 h-3 text-muted-foreground" />;
        case "read":
          return <CheckCheck className="w-3 h-3 text-blue-500" />;
        case "failed":
          return <AlertCircle className="w-3 h-3 text-destructive" />;
        default:
          return <Check className="w-3 h-3 text-muted-foreground" />;
      }
    }, [isMe, message.status]);

    return (
      <div
        className={cn(
          "flex flex-col w-full mb-1 px-2 md:px-4  transition-colors group/bubble",
          isMe ? "items-end" : "items-start",
          !isContinuous ? "mt-3" : "mt-0.5",
        )}
      >
        <div
          className={cn(
            "flex max-w-[85%] md:max-w-[70%] items-end gap-2",
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

          <div
            className={cn(
              "relative px-3 py-2 text-sm shadow-sm transition-all",
              isMe
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
            {message.type === MessageTypeEnum.IMAGE && (
              <div className="mb-2 overflow-hidden rounded-lg">
                <img
                  src={message.content}
                  alt="attachment"
                  className="max-w-full h-auto object-cover min-w-[100px]"
                  loading="lazy"
                />
              </div>
            )}

            {message.type === MessageTypeEnum.TEXT && (
              <p className="whitespace-pre-wrap leading-relaxed break-words">
                {message.content}
              </p>
            )}

            <div
              className={cn(
                "flex items-center gap-1 text-[10px] mt-1 select-none opacity-80",
                isMe
                  ? "justify-end text-primary-foreground/90"
                  : "justify-start text-muted-foreground",
              )}
            >
              <span>{timeString}</span>
              {StatusIcon}
            </div>
          </div>
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
