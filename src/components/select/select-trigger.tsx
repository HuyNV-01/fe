import { cn } from "@/lib/utils";
import type React from "react";
import type * as SelectPrimitive from "@radix-ui/react-select";
import { SelectTrigger } from "../ui/select";
import { LiquidGlassAnchor } from "../liquid-glass/liquid-glass-anchor";
import { LiquidGlassInput } from "../liquid-glass/liquid-glass";

export default function TriggerSelect({
  children,
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: "sm" | "default";
}) {
  return (
    <LiquidGlassAnchor
      contentClassName="flex items-center justify-end"
      zIndex={50}
    >
      <LiquidGlassInput className="w-max rounded-xl">
        <SelectTrigger
          className={cn("rounded-xl cursor-pointer", className)}
          size={size}
          {...props}
        >
          {children}
        </SelectTrigger>
      </LiquidGlassInput>
    </LiquidGlassAnchor>
  );
}
