"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { BaseTooltip } from "@/components/tooltip/base-tooltip";

interface TruncatedTextProps extends React.HTMLAttributes<HTMLHeadingElement> {
  text: string;
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "span" | "p";
  className?: string;
  lines?: 1 | 2 | 3;
}

export function TruncatedText({
  text,
  as: Component = "h2",
  className,
  lines = 1,
  ...props
}: TruncatedTextProps) {
  const clampClass =
    lines === 2
      ? "line-clamp-2 break-words [overflow-wrap:anywhere]"
      : lines === 3
        ? "line-clamp-3 break-words [overflow-wrap:anywhere]"
        : "truncate";

  return (
    <BaseTooltip
      delayDuration={300}
      side="bottom"
      align="start"
      content={text}
      className="max-w-xs break-words [overflow-wrap:anywhere] z-90"
    >
      <Component
        className={cn(
          "min-w-0 max-w-full cursor-default",
          clampClass,
          className,
        )}
        {...props}
      >
        {text}
      </Component>
    </BaseTooltip>
  );
}
