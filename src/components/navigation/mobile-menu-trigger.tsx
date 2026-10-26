"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "../ui/sheet";
import { PatternButton } from "../button/button-patterns";
import { LiquidGlassModal } from "../liquid-glass/liquid-glass";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import config from "@/config";

interface MobileMenuTriggerProps {
  links: Array<{ label: string; href: string }>;
  actions: {
    showSignIn?: boolean;
    showSignUp?: boolean;
  };
}

export function MobileMenuTrigger({ links, actions }: MobileMenuTriggerProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const tNav = useTranslations("Header.nav");
  const tAction = useTranslations("Header.action");

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-slate-900 dark:text-white h-9 w-9 rounded-full"
          aria-label={tNav("openMobileMenu")}
        >
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>

      <SheetContent className="p-2! bg-transparent! border-none" side="left">
        <SheetTitle className="sr-only">{tNav("mobileMenuTitle")}</SheetTitle>
        <LiquidGlassModal className="h-full p-4">
          <div
            className={cn(
              "animate-in fade-in slide-in-from-top-2 duration-200 pt-6",
            )}
          >
            {/* Navigation Links */}
            <div className="space-y-1 mb-4">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                >
                  <div
                    className={cn(
                      "px-4 py-2.5 rounded-xl",
                      "text-sm font-medium",
                      "text-slate-900 dark:text-slate-100",
                      "hover:bg-primary/10 transition-colors duration-200",
                      "cursor-pointer",
                    )}
                  >
                    {link.label}
                  </div>
                </Link>
              ))}
            </div>

            {/* Actions Section */}
            {(actions.showSignIn || actions.showSignUp) && (
              <div className="border-t border-white/20 dark:border-white/10 pt-4 space-y-2">
                {actions.showSignIn && (
                  <PatternButton
                    variant="glass"
                    size="md"
                    fullWidth
                    rounded="full"
                    onClick={() => {
                      setOpen(false);
                      router.push(config.routes.public.login);
                    }}
                  >
                    {tAction("login")}
                  </PatternButton>
                )}

                {actions.showSignUp && (
                  <PatternButton
                    variant="solid"
                    size="md"
                    fullWidth
                    rounded="full"
                    onClick={() => {
                      setOpen(false);
                      router.push(config.routes.public.register);
                    }}
                  >
                    {tAction("register")}
                  </PatternButton>
                )}
              </div>
            )}
          </div>
        </LiquidGlassModal>
      </SheetContent>
    </Sheet>
  );
}
