"use client";

import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  GlassAvatar,
  DropdownMenuContentCus,
  ItemMenu,
} from "@/components/toolkit";
import Logout from "../auth/logout";
import { useAuthStore } from "@/lib/stores/auth/use-auth-store";
import config from "@/config";
import { Contact, MessageSquare, User, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";

export function AccountMenu() {
  const t = useTranslations("DropdownMenu.account");
  const user = useAuthStore((s) => s.currentAccount?.user);
  const displayName = user?.name || t("defaultName");
  const email = user?.email || "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-transform hover:scale-105 cursor-pointer"
          aria-label={t("ariaLabel")}
        >
          <GlassAvatar src={user?.avatar} name={displayName} size="sm" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContentCus
        className="w-60 max-w-[calc(100vw-1.5rem)]"
        align="end"
      >
        <DropdownMenuLabel className="font-normal py-2">
          <div className="flex items-center gap-3">
            <GlassAvatar src={user?.avatar} name={displayName} size="md" />
            <div className="flex flex-col min-w-0">
              <p className="text-sm font-semibold leading-none truncate">
                {displayName}
              </p>
              {email && (
                <p className="text-xs text-muted-foreground truncate mt-1">
                  {email}
                </p>
              )}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {user?.id && (
            <ItemMenu
              route={config.routes.private.profile(user.id)}
              icon={<User className="size-4 text-muted-foreground" />}
            >
              {t("profile")}
            </ItemMenu>
          )}
          <ItemMenu
            route={config.routes.private.chat}
            icon={<MessageSquare className="size-4 text-muted-foreground" />}
          >
            {t("chat")}
          </ItemMenu>
          <ItemMenu
            route={config.routes.private.directory}
            icon={<Contact className="size-4 text-muted-foreground" />}
          >
            {t("directory")}
          </ItemMenu>
          <ItemMenu
            route={config.routes.private.addNew}
            icon={<UserPlus className="size-4 text-muted-foreground" />}
          >
            {t("addContact")}
          </ItemMenu>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <Logout />
      </DropdownMenuContentCus>
    </DropdownMenu>
  );
}
