"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/lib/stores/chat/use-chat-store";
import config from "@/config";

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
  const conversations = useChatStore((s) => s.conversations);

  const totalUnreadMessages = useMemo(
    () =>
      conversations.reduce(
        (sum, conv) => sum + Math.max(0, Number(conv.unreadCount || 0)),
        0,
      ),
    [conversations],
  );

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {links.map((link) => {
        const isActive =
          pathname === link.href ||
          (link.href !== "/" && pathname?.includes(link.href));
        const isChatLink = link.href === config.routes.private.chat;

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "relative px-4 py-2 rounded-lg transition-all duration-200 inline-flex items-center gap-1.5",
              "text-sm font-medium",
              isActive
                ? "bg-white/40 text-slate-900 dark:bg-white/10 dark:text-white"
                : "text-slate-700 dark:text-slate-300 hover:bg-white/20 dark:hover:bg-white/5",
            )}
          >
            <span>{link.label}</span>
            {isChatLink && totalUnreadMessages > 0 && (
              <span className="flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground shadow-2xs">
                {totalUnreadMessages > 99 ? "99+" : totalUnreadMessages}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
