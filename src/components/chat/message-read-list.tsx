"use client";

import React from "react";
import {
  BaseTooltip,
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/toolkit";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface IReader {
  id: string;
  name: string;
  avatar: string | null;
}

interface MessageReadListProps {
  readers: IReader[];
  isMe: boolean;
  maxVisible?: number;
}

export const MessageReadList = ({
  readers,
  isMe,
  maxVisible = 5,
}: MessageReadListProps) => {
  const t = useTranslations("Chat.Detail.conversation");
  if (!readers || readers.length === 0) return null;

  const visibleReaders = readers.slice(0, maxVisible);
  const remainingCount = Math.max(0, readers.length - maxVisible);
  const allReaderNames = readers.map((r) => r.name).join(", ");

  return (
    <div
      className={cn(
        "flex items-center mt-1 -space-x-1.5 select-none",
        isMe ? "justify-end mr-1" : "justify-start ml-1",
      )}
    >
      {visibleReaders.map((reader) => (
        <BaseTooltip
          key={reader.id}
          side="bottom"
          delayDuration={100}
          content={t("seenBy", { name: reader.name })}
          className="text-[10px] px-2 py-1"
        >
          <div className="relative z-10 hover:z-20 transition-transform hover:scale-110 cursor-default">
            <Avatar className="w-4 h-4 border-[1.5px] border-background ring-0 shadow-2xs">
              <AvatarImage src={reader.avatar || ""} alt={reader.name} />
              <AvatarFallback className="text-[7px] bg-muted text-muted-foreground font-bold flex items-center justify-center">
                {reader.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </BaseTooltip>
      ))}

      {remainingCount > 0 && (
        <BaseTooltip
          side="bottom"
          delayDuration={100}
          content={t("seenBy", { name: allReaderNames })}
          className="text-[10px] px-2 py-1 max-w-xs break-words"
        >
          <div className="relative z-10 hover:z-20 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-primary/15 text-primary border-[1.5px] border-background text-[8px] font-bold cursor-default">
            +{remainingCount}
          </div>
        </BaseTooltip>
      )}
    </div>
  );
};