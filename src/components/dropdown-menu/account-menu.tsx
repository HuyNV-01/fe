"use client";

import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import Logout from "../auth/logout";
import DropdownMenuContentCus from "./dropdown-menu-content-cus";
import ItemMenu from "./item-menu";
import { useAuthStore } from "@/lib/stores/auth/use-auth-store";
import { getInitials } from "@/utils/helper";
import config from "@/config";
import { Contact, MessageSquare, User, UserPlus } from "lucide-react";

export function AccountMenu() {
  const user = useAuthStore((s) => s.currentAccount?.user);
  const displayName = user?.name || "Tài khoản";
  const email = user?.email || "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-transform hover:scale-105 cursor-pointer"
          aria-label="Menu tài khoản"
        >
          <Avatar className="h-9 w-9 border border-border/60 shadow-xs">
            <AvatarImage
              src={user?.avatar || undefined}
              alt={displayName}
              className="object-cover"
            />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContentCus className="w-60" align="end">
        <DropdownMenuLabel className="font-normal py-2">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-border/50 shrink-0">
              <AvatarImage
                src={user?.avatar || undefined}
                alt={displayName}
                className="object-cover"
              />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
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
              Hồ sơ cá nhân
            </ItemMenu>
          )}
          <ItemMenu
            route={config.routes.private.chat}
            icon={<MessageSquare className="size-4 text-muted-foreground" />}
          >
            Trò chuyện
          </ItemMenu>
          <ItemMenu
            route={config.routes.private.directory}
            icon={<Contact className="size-4 text-muted-foreground" />}
          >
            Danh bạ bạn bè
          </ItemMenu>
          <ItemMenu
            route={config.routes.private.addNew}
            icon={<UserPlus className="size-4 text-muted-foreground" />}
          >
            Thêm liên hệ mới
          </ItemMenu>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <Logout />
      </DropdownMenuContentCus>
    </DropdownMenu>
  );
}
