import type React from "react";
import { DropdownMenuSubContent } from "../ui/dropdown-menu";
import type * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";
import { LiquidGlassDropdown } from "../liquid-glass/liquid-glass";

export default function DropdownMenuSubContentCus({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
  return (
    <DropdownMenuSubContent
      className={cn("rounded-xl bg-transparent p-0", className)}
      {...props}
    >
      <LiquidGlassDropdown className="p-1">{children}</LiquidGlassDropdown>
    </DropdownMenuSubContent>
  );
}
