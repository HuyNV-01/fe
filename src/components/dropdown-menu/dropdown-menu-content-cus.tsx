"use client";

import React, { useMemo } from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
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

export interface DropdownMenuContentCusProps
  extends React.ComponentProps<typeof DropdownMenuPrimitive.Content> {
  glassVariant?: GlassVariant;
  glassBlur?: GlassBlur;
  glassOpacity?: GlassOpacity;
}

export default function DropdownMenuContentCus({
  className,
  children,
  collisionPadding = 12,
  sideOffset = 6,
  avoidCollisions = true,
  glassVariant = "primary",
  glassBlur,
  glassOpacity,
  ...props
}: DropdownMenuContentCusProps) {
  const themeConfig = useLiquidGlassConfig();
  const nestingLevel = useGlassNestingLevel();
  const isOverGlass = nestingLevel > 0;

  // Đảm bảo DropdownMenuContentCus không bị vượt ngưỡng maxBackdropNestingDepth khi mở từ bên trong các thẻ LiquidGlass lồng nhau
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

  const hasZeroPadding = Boolean(className && /\bp-0\b/.test(className));
  const resolvedBlur: GlassBlur = glassBlur || (isOverGlass ? "2xl" : "xl");
  const resolvedOpacity: GlassOpacity =
    glassOpacity || (isOverGlass ? "90" : "80");

  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        avoidCollisions={avoidCollisions}
        className={cn(
          "min-w-[8rem] max-w-[calc(100vw-1rem)] origin-(--radix-dropdown-menu-content-transform-origin) outline-none",
          className,
          // Đặt z-[100]! sau className để không bị class z-50 truyền từ ngoài hạ thấp thứ tự xếp lớp xuống dưới TriggerSelect / Modal
          "z-[100]! rounded-2xl bg-transparent! p-0! border-0! shadow-none! overflow-visible!",
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
            rounded="2xl"
            shadow="2xl"
            isolate={true}
            animate={true}
            className="w-full max-w-full overflow-hidden ring-1 ring-black/5 dark:ring-white/15"
            contentClassName={cn(
              "max-h-[min(var(--radix-dropdown-menu-content-available-height,420px),80dvh)] overflow-y-auto overflow-x-hidden",
              hasZeroPadding ? "p-0" : "p-1",
            )}
          >
            {children}
          </LiquidGlassDropdown>
        </LiquidGlassConfigProvider>
      </DropdownMenuPrimitive.Content>
    </DropdownMenuPrimitive.Portal>
  );
}
