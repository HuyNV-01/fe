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

export interface DropdownMenuSubContentCusProps
  extends React.ComponentProps<typeof DropdownMenuPrimitive.SubContent> {
  glassVariant?: GlassVariant;
  glassBlur?: GlassBlur;
  glassOpacity?: GlassOpacity;
}

export default function DropdownMenuSubContentCus({
  className,
  children,
  collisionPadding = 12,
  avoidCollisions = true,
  glassVariant = "primary",
  glassBlur,
  glassOpacity,
  ...props
}: DropdownMenuSubContentCusProps) {
  const themeConfig = useLiquidGlassConfig();
  const nestingLevel = useGlassNestingLevel();
  const isOverGlass = nestingLevel > 0;

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
      <DropdownMenuPrimitive.SubContent
        data-slot="dropdown-menu-sub-content"
        collisionPadding={collisionPadding}
        avoidCollisions={avoidCollisions}
        className={cn(
          "min-w-[8rem] max-w-[calc(100vw-1rem)] origin-(--radix-dropdown-menu-content-transform-origin) outline-none",
          className,
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
              "max-h-[min(var(--radix-dropdown-menu-content-available-height,360px),75dvh)] overflow-y-auto overflow-x-hidden",
              hasZeroPadding ? "p-0" : "p-1",
            )}
          >
            {children}
          </LiquidGlassDropdown>
        </LiquidGlassConfigProvider>
      </DropdownMenuPrimitive.SubContent>
    </DropdownMenuPrimitive.Portal>
  );
}
