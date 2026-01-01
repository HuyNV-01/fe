import type React from "react";
import { cn } from "@/lib/utils";
import type * as SelectPrimitive from "@radix-ui/react-select";
import { LiquidGlassDropdown } from "../liquid-glass/liquid-glass";
import { SelectContent } from "../ui/select";

export default function ContentSelect({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectContent
      className={cn("rounded-xl bg-transparent", className)}
      {...props}
    >
      <LiquidGlassDropdown className="p-1">{children}</LiquidGlassDropdown>
    </SelectContent>
  );
}
