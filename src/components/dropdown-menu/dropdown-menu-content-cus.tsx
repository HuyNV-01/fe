import type React from "react";
import { DropdownMenuContent } from "../ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { LiquidGlassDropdown } from "../liquid-glass/liquid-glass";

export default function DropdownMenuContentCus({
  className,
  children,
  collisionPadding = 12,
  sideOffset = 6,
  avoidCollisions = true,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuContent
      sideOffset={sideOffset}
      collisionPadding={collisionPadding}
      avoidCollisions={avoidCollisions}
      className={cn(
        "rounded-2xl bg-transparent p-0 border-0 shadow-none max-w-[calc(100vw-1rem)] overflow-visible",
        className,
      )}
      {...props}
    >
      <LiquidGlassDropdown
        rounded="2xl"
        className="p-1 max-w-full overflow-hidden shadow-xl"
      >
        {children}
      </LiquidGlassDropdown>
    </DropdownMenuContent>
  );
}
