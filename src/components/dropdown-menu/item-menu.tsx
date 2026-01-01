/* eslint-disable @typescript-eslint/no-explicit-any */
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import React from "react";

type ItemProps = {
  icon?: React.ReactNode;
  children: React.ReactNode;
  route?: string | undefined;
  onClick?: (e?: any) => void;
  className?: string;
};

export default function ItemMenu({
  icon,
  children,
  route,
  onClick,
  className,
}: ItemProps) {
  const routes = useRouter();

  const handleClick = () => {
    routes.push(`${route}`);
  };

  return (
    <DropdownMenuItem
      onClick={route ? handleClick : onClick}
      className={cn("text-sm! cursor-pointer", className)}
    >
      {icon && icon}
      {children}
    </DropdownMenuItem>
  );
}
