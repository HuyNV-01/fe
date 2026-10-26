import { cn } from "@/lib/utils";
import type React from "react";
import type * as SelectPrimitive from "@radix-ui/react-select";
import { SelectTrigger } from "../ui/select";
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
    <LiquidGlassInput fluid={false} className="w-max shrink-0">
      <SelectTrigger
        className={cn(
          "w-full rounded-full cursor-pointer border-0 shadow-none bg-transparent",
          className,
        )}
        size={size}
        {...props}
      >
        {children}
      </SelectTrigger>
    </LiquidGlassInput>
  );
}
