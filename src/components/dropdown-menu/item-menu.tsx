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
  ...props
}: React.ComponentProps<typeof DropdownMenuItem> & ItemProps) {
  const routes = useRouter();

  const handleClick = () => {
    if (route) {
      routes.push(`${route}`);
    }
  };

  return (
    <DropdownMenuItem
      onClick={route ? handleClick : onClick}
      className={cn(
        "text-sm! cursor-pointer rounded-xl transition-colors duration-150",
        "focus:bg-primary/10 dark:focus:bg-white/15 focus:text-foreground my-0.5",
        className,
      )}
      {...props}
    >
      {icon && icon}
      {children}
    </DropdownMenuItem>
  );
}
