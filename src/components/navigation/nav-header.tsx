"use client";

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

export function NavHeader({
  logo = { text: "LiquidChat", href: "/" },
  links = [
    { label: "Trang chủ", href: "/" },
    { label: "Trò chuyện", href: config.routes.private.chat },
    { label: "Danh bạ", href: config.routes.private.directory },
    { label: "Kết bạn", href: config.routes.private.addNew },
  ],
  className,
}: NavHeaderProps) {
  const isAuthenticated = useAuthStore((s) => s.authenticated);
  const resolvedActions = {
    showSignIn: !isAuthenticated,
    showSignUp: !isAuthenticated,
    showAccount: isAuthenticated,
  };
  return (
    <header
      className={cn("sticky z-40 top-0 w-full bg-transparent p-1", className)}
    >
      <LiquidGlassNavigation>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between bg-transparent">
          <div className="md:hidden h-full relative flex items-center justify-between space-x-1.5">
            <MobileMenuTrigger links={links} actions={resolvedActions} />
          </div>
          {/* Logo Section */}
          <NavLogo logo={logo} />

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center">
            <NavLinks links={links} />
          </div>

          {/* Desktop Actions */}
          <div className="hidden h-full md:flex items-center gap-3">
            <NavActions actions={resolvedActions} />
            <div className="h-5">
              <Separator orientation="vertical" />
            </div>
            <ModeToggle />
          </div>

          {/* Mobile Menu Trigger */}
          <div className="md:hidden h-full relative flex items-center justify-between space-x-2">
            {resolvedActions.showAccount && <AccountMenu />}
            <div className="h-5">
              <Separator orientation="vertical" />
            </div>
            <ModeToggle />
          </div>
        </nav>
      </LiquidGlassNavigation>
    </header>
  );
}
