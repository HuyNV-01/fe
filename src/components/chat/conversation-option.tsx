/** biome-ignore-all lint/suspicious/noArrayIndexKey: <explanation> */
"use client";

import { useRouter, usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { PatternButton } from "@/components/button/button-patterns";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { MENU_GROUPS } from "@/constant/chat";
import type { IMenuItem, IOptionCounts, TOptionKey } from "@/types/chat";
import { ScrollArea } from "../ui/scroll-area";
import { useContactMenu } from "@/utils/hooks/use-contact-menu";

export interface IConversationOptionProps {
  counts?: IOptionCounts;
  className?: string;
  onSelect?: (key: TOptionKey) => void;
}

export default function ConversationOption({
  counts = { friendRequests: 0, groupRequests: 0 },
  className,
  onSelect,
}: IConversationOptionProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isActive = (href: string) => pathname.includes(href);
  const { menuGroups } = useContactMenu();

  const handleNavigation = (item: IMenuItem) => {
    router.push(item.href);
    onSelect?.(item.key);
  };

  return (
    <ScrollArea className="h-full w-full">
      <nav className={cn("w-full flex flex-col gap-6 px-4 py-2", className)}>
        {menuGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="flex flex-col gap-2">
            {group.title && (
              <h3 className="px-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 opacity-70">
                {group.title}
              </h3>
            )}

            <div className="flex flex-col gap-1">
              {group.items.map((item) => {
                const active = isActive(item.href);
                const badgeCount = item.countKey ? counts[item.countKey] : 0;
                const Icon = item.icon;

                return (
                  <PatternButton
                    key={item.key}
                    variant={active ? "glass" : "ghost"}
                    color={active ? "primary" : "neutral"}
                    fullWidth
                    className={cn(
                      "group transition-all duration-300",
                      active ? "pl-3 pr-2" : "px-2",
                    )}
                    onClick={() => handleNavigation(item)}
                    icon={
                      <div className="flex items-center">
                        {badgeCount && badgeCount > 0 ? (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white shadow-sm animate-in zoom-in duration-300">
                            {badgeCount > 99 ? "99+" : badgeCount}
                          </span>
                        ) : (
                          active && (
                            <ChevronRight className="size-3 text-muted-foreground/50 animate-in slide-in-from-left-1" />
                          )
                        )}
                      </div>
                    }
                    iconPosition="right"
                    contentAlign="between"
                    glassZIndex={0}
                    overflowPadding={0}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "p-1.5 rounded-md transition-colors duration-300",
                          active
                            ? "bg-primary/10 text-primary dark:bg-primary/20"
                            : "bg-muted/50 text-muted-foreground group-hover:bg-muted group-hover:text-foreground",
                        )}
                      >
                        <Icon className="size-4" />
                      </div>

                      <span
                        className={cn(
                          "text-sm font-medium transition-colors",
                          active
                            ? "text-foreground"
                            : "text-muted-foreground group-hover:text-foreground",
                        )}
                      >
                        {item.label}
                      </span>
                    </div>
                  </PatternButton>
                );
              })}
            </div>

            {groupIndex < MENU_GROUPS.length - 1 && (
              <Separator className="my-1 bg-linear-to-r from-transparent via-border to-transparent opacity-50" />
            )}
          </div>
        ))}
      </nav>
      <div className="h-4 w-full shrink-0" />
    </ScrollArea>
  );
}
