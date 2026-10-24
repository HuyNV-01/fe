"use client";

import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface IReader {
  id: string;
  name: string;
  avatar: string | null;
}

interface MessageReadListProps {
  readers: IReader[];
  isMe: boolean;
}

export const MessageReadList = ({ readers, isMe }: MessageReadListProps) => {
  if (!readers || readers.length === 0) return null;

  return (
    <div
      className={cn(
        "flex items-center mt-1 space-x-[-6px] select-none",
        isMe ? "justify-end mr-1" : "justify-start ml-1",
      )}
    >
      <TooltipProvider delayDuration={100}>
        {readers.map((reader) => (
          <Tooltip key={reader.id}>
            <TooltipTrigger asChild>
              <div className="relative z-10 hover:z-20 transition-transform hover:scale-110 cursor-default">
                <Avatar className="w-3.5 h-3.5 border-[1.5px] border-background ring-0">
                  <AvatarImage src={reader.avatar || ""} alt={reader.name} />
                  <AvatarFallback className="text-[5px] bg-muted text-muted-foreground font-bold flex items-center justify-center">
                    {reader.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[10px] px-2 py-1">
              <p>Đã xem: {reader.name}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  );
};
