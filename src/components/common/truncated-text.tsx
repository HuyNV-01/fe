"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TruncatedTextProps extends React.HTMLAttributes<HTMLHeadingElement> {
  text: string;
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "span" | "p";
  className?: string;
}

export function TruncatedText({
  text,
  as: Component = "h2",
  className,
  ...props
}: TruncatedTextProps) {
  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <Component
          className={cn("truncate cursor-default", className)}
          {...props}
        >
          {text}
        </Component>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        align="start"
        className="max-w-[200px] break-words"
      >
        <p>{text}</p>
      </TooltipContent>
    </Tooltip>
  );
}
