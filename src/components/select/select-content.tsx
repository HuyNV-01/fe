import type React from "react";
import { cn } from "@/lib/utils";
import type * as SelectPrimitive from "@radix-ui/react-select";
import { LiquidGlassDropdown } from "../liquid-glass/liquid-glass";
import { SelectContent } from "../ui/select";

export default function ContentSelect({
  className,
  children,
  position = "popper",
  collisionPadding = 12,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectContent
      position={position}
      collisionPadding={collisionPadding}
      className={cn(
        "rounded-2xl bg-transparent border-0 shadow-none p-0 max-w-[calc(100vw-1rem)]",
        className,
      )}
      {...props}
    >
      <LiquidGlassDropdown rounded="2xl" className="p-1 shadow-xl">
        {children}
      </LiquidGlassDropdown>
    </SelectContent>
  );
}
