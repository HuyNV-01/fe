"use client";

import type * as React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface LiquidTooltipProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof TooltipContent>,
    "content"
  > {
  children: React.ReactNode;
  content: React.ReactNode | string;
  delayDuration?: number;
  skipDelayDuration?: number;
  disabled?: boolean;
}

export function BaseTooltip({
  children,
  content,
  delayDuration = 300,
  skipDelayDuration = 0,
  disabled = false,
  className,
  side = "top",
  align = "center",
  sideOffset = 5,
  ...props
}: LiquidTooltipProps) {
  if (disabled || !content) {
    return <>{children}</>;
  }

  return (
    <Tooltip delayDuration={delayDuration}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side={side}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 overflow-hidden rounded-md px-3 py-1.5 text-xs font-medium animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",

          className,
        )}
        {...props}
      >
        {typeof content === "string" ? (
          <p className="max-w-[250px] wrap-break-word leading-relaxed">
            {content}
          </p>
        ) : (
          content
        )}
      </TooltipContent>
    </Tooltip>
  );
}
