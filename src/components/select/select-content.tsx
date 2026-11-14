"use client";

import React, { useMemo } from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { cn } from "@/lib/utils";
import {
  LiquidGlassDropdown,
  useGlassNestingLevel,
  type GlassVariant,
  type GlassBlur,
  type GlassOpacity,
} from "../liquid-glass/liquid-glass";
import {
  LiquidGlassConfigProvider,
  useLiquidGlassConfig,
} from "../liquid-glass/liquid-glass-config";
import { SelectScrollDownButton, SelectScrollUpButton } from "../ui/select";

export interface ContentSelectProps
  extends React.ComponentProps<typeof SelectPrimitive.Content> {
  glassVariant?: GlassVariant;
  glassBlur?: GlassBlur;
  glassOpacity?: GlassOpacity;
}

export default function ContentSelect({
  className,
  children,
  position = "popper",
  align = "center",
  sideOffset = 6,
  collisionPadding = 12,
  glassVariant = "primary",
  glassBlur,
  glassOpacity,
  ...props
}: ContentSelectProps) {
  const themeConfig = useLiquidGlassConfig();
  const nestingLevel = useGlassNestingLevel();
  const isOverGlass = nestingLevel > 0;

  // Bảo toàn hiệu ứng backdrop-blur cho menu thả xuống kể cả khi Select được đặt trong nhiều tầng LiquidGlass lồng nhau
  const dropdownGlassConfig = useMemo(
    () => ({
      ...themeConfig,
      maxBackdropNestingDepth: Math.max(
        themeConfig.maxBackdropNestingDepth,
        nestingLevel + 4,
        10,
      ),
    }),
    [themeConfig, nestingLevel],
  );

  const resolvedBlur: GlassBlur = glassBlur || (isOverGlass ? "2xl" : "xl");
  const resolvedOpacity: GlassOpacity =
    glassOpacity || (isOverGlass ? "90" : "80");

  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        position={position}
        align={align}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cn(
          "relative min-w-[8rem] max-w-[calc(100vw-1rem)] origin-(--radix-select-content-transform-origin)",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className,
          // Đặt z-[100]! sau className để luôn nổi hoàn toàn lên trên mọi TriggerSelect LiquidGlassAnchor (10/55/75), GlassSheet (50) và GlassModal (70)
          "z-[100]! rounded-2xl bg-transparent! border-0! shadow-none! p-0! overflow-visible!",
        )}
        {...props}
      >
        <LiquidGlassConfigProvider config={dropdownGlassConfig}>
          <LiquidGlassDropdown
            variant={glassVariant}
            blur={resolvedBlur}
            opacity={resolvedOpacity}
            surface={isOverGlass ? "glossy" : "flat"}
            border={isOverGlass ? "highlight" : "distinct"}
            glow={isOverGlass}
            shadow="2xl"
            rounded="2xl"
            isolate={true}
            animate={true}
            className="w-full overflow-hidden ring-1 ring-black/5 dark:ring-white/15"
            contentClassName="flex flex-col max-h-[min(var(--radix-select-content-available-height,320px),320px)] overflow-hidden"
          >
            <SelectScrollUpButton />
            <SelectPrimitive.Viewport
              className={cn(
                "p-1 overflow-y-auto overflow-x-hidden",
                position === "popper" &&
                  "w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1",
              )}
            >
              {children}
            </SelectPrimitive.Viewport>
            <SelectScrollDownButton />
          </LiquidGlassDropdown>
        </LiquidGlassConfigProvider>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}
