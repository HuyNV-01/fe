"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { NavLogo } from "./nav-logo";
import { NavLinks } from "./nav-links";
import { NavActions } from "./nav-actions";
import { MobileMenuTrigger } from "./mobile-menu-trigger";
import { ModeToggle } from "../theme/mode-toggle";
import { Separator } from "../ui/separator";
import { AccountMenu } from "../dropdown-menu/account-menu";
import { useAuthStore } from "@/lib/stores/auth/use-auth-store";
import config from "@/config";
import { LiquidGlassNavigation } from "../liquid-glass/liquid-glass";
import { NotificationBell } from "../notifications/notification-bell";
import { useTranslations } from "next-intl";

interface NavHeaderProps {
  logo?: {
    text: string;
    href: string;
  };
  links?: Array<{
    label: string;
    href: string;
  }>;
  actions?: {
    showSignIn?: boolean;
    showSignUp?: boolean;
    showAccount?: boolean;
  };
  className?: string;
}

export function NavHeader({ logo, links, actions, className }: NavHeaderProps) {
  const t = useTranslations("Header");
  const isAuthenticated = useAuthStore((s) => s.authenticated);

  const resolvedLogo = logo || { text: t("brand"), href: "/" };

  const resolvedLinks = useMemo(
    () =>
      links || [
        { label: t("nav.home"), href: "/" },
        { label: t("nav.chat"), href: config.routes.private.chat },
        { label: t("nav.directory"), href: config.routes.private.directory },
        { label: t("nav.addFriend"), href: config.routes.private.addNew },
      ],
    [links, t],
  );

  const resolvedActions = {
    showSignIn: actions?.showSignIn ?? !isAuthenticated,
    showSignUp: actions?.showSignUp ?? !isAuthenticated,
    showAccount: actions?.showAccount ?? isAuthenticated,
  };
  return (
    <header
      className={cn(
        "sticky z-40 top-0 w-full bg-transparent p-0 sm:p-1",
        className,
      )}
    >
      <LiquidGlassNavigation className="rounded-none sm:rounded-2xl">
        <nav className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-13 sm:h-15 flex items-center justify-between bg-transparent">
          <div className="md:hidden h-full relative flex items-center justify-between space-x-1">
            <MobileMenuTrigger
              links={resolvedLinks}
              actions={resolvedActions}
            />
          </div>
          {/* Logo Section */}
          <NavLogo logo={resolvedLogo} />

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center">
            <NavLinks links={resolvedLinks} />
          </div>

          {/* Desktop Actions */}
          <div className="hidden h-full md:flex items-center gap-3">
            <NavActions actions={resolvedActions} />
            <div className="h-5">
              <Separator orientation="vertical" />
            </div>
            <ModeToggle />
          </div>

          {/* Mobile Menu Actions */}
          <div className="md:hidden h-full relative flex items-center justify-between space-x-1.5 sm:space-x-2">
            {resolvedActions.showAccount && (
              <>
                <NotificationBell />
                <AccountMenu />
              </>
            )}
            <div className="h-4 sm:h-5">
              <Separator orientation="vertical" />
            </div>
            <ModeToggle />
          </div>
        </nav>
      </LiquidGlassNavigation>
    </header>
  );
}
