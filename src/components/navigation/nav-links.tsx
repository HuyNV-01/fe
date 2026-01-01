"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavLink {
  label: string;
  href: string;
}

interface NavLinksProps {
  links: NavLink[];
  className?: string;
}

export function NavLinks({ links, className }: NavLinksProps) {
  const pathname = usePathname();

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {links.map((link) => {
        const isActive = pathname === link.href;

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "px-4 py-2 rounded-lg transition-all duration-200",
              "text-sm font-medium",
              isActive
                ? "bg-white/40 text-slate-900 dark:bg-white/10 dark:text-white"
                : "text-slate-700 dark:text-slate-300 hover:bg-white/20 dark:hover:bg-white/5",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
