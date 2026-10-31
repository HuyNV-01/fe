import type { TLocaleProps } from "@/types";
import {
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
} from "../ui/dropdown-menu";
import { DropdownMenuSubContentCus } from "@/components/toolkit";

export default function BaseLocaleSelect({
  children,
  label,
  isPending,
}: TLocaleProps) {
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger disabled={isPending}>
        {label}
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContentCus>
          <DropdownMenuLabel className="font-extrabold">
            {label}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {children}
        </DropdownMenuSubContentCus>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}
