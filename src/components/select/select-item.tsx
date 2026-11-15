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
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item> & ItemProps) {
  return (
    <SelectItem
      value={value}
      className={cn(
        "text-sm! cursor-pointer rounded-xl transition-colors duration-150",
        "focus:bg-primary/10 dark:focus:bg-white/15 focus:text-foreground",
        "data-[state=checked]:bg-primary/15 dark:data-[state=checked]:bg-white/20 data-[state=checked]:font-semibold",
        "my-0.5",
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        {icon && icon}
        {children}
      </div>
    </SelectItem>
  );
}
