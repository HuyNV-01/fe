import type React from "react";
import { DropdownMenuContent } from "../ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { LiquidGlassDropdown } from "../liquid-glass/liquid-glass";

export default function DropdownMenuContentCus({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuContent
      className={cn("rounded-xl bg-transparent p-0", className)}
      {...props}
    >
      <LiquidGlassDropdown className="p-1">{children}</LiquidGlassDropdown>
    </DropdownMenuContent>
  );
}
