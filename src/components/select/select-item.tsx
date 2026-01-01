import { cn } from "@/lib/utils";
import type React from "react";
import type * as SelectPrimitive from "@radix-ui/react-select";
import { SelectItem } from "../ui/select";

type ItemProps = {
  icon?: React.ReactNode;
  children: React.ReactNode;
  value: string;
  className?: string;
};

export default function ItemSelect({
  icon,
  children,
  value,
  className,
}: React.ComponentProps<typeof SelectPrimitive.Item> & ItemProps) {
  return (
    <SelectItem
      value={value}
      className={cn("text-sm! cursor-pointer", className)}
    >
      <div className="flex items-center gap-2">
        {icon && icon}
        {children}
      </div>
    </SelectItem>
  );
}
