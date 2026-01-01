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
  logo = { text: "LiquidGlass", href: "/" },
  links = [
    { label: "Home", href: "/" },
    { label: "Chats", href: config.routes.private.chat },
    { label: "Services", href: "/services" },
    { label: "Contact", href: "/contact" },
  ],
  actions = { showSignIn: true, showSignUp: true, showAccount: false },
  className,
}: NavHeaderProps) {
  const isAuthenticated = useAuthStore((s) => s.authenticated);
  actions = {
    showSignIn: !isAuthenticated,
    showSignUp: !isAuthenticated,
    showAccount: isAuthenticated,
  };
  return (
    <header
      className={cn("sticky z-50 top-0 w-full bg-transparent p-1", className)}
    >
      <LiquidGlassNavigation>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between bg-transparent">
          <div className="md:hidden h-full relative flex items-center justify-between space-x-1.5">
            <MobileMenuTrigger links={links} actions={actions} />
          </div>
          {/* Logo Section */}
          <NavLogo logo={logo} />

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center">
            <NavLinks links={links} />
          </div>

          {/* Desktop Actions */}
          <div className="hidden h-full md:flex items-center gap-3">
            <NavActions actions={actions} />
            <div className="h-1/2">
              <Separator orientation="vertical" />
            </div>
            <ModeToggle />
          </div>

          {/* Mobile Menu Trigger */}
          <div className="md:hidden h-full relative flex items-center justify-between space-x-2">
            {actions.showAccount && <AccountMenu />}
            <div className="h-1/2">
              <Separator orientation="vertical" />
            </div>
            <ModeToggle />
          </div>
        </nav>
      </LiquidGlassNavigation>
    </header>
  );
}
