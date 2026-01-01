import type { TLocaleProps } from "@/types";
import {
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "../ui/dropdown-menu";

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
        <DropdownMenuSubContent>
          <DropdownMenuLabel className="font-extrabold">
            {label}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {children}
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}
