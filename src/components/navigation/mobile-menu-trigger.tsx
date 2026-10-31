"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassSheet, PatternButton } from "@/components/toolkit";
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
    <>
      <PatternButton
        variant="ghost"
        size="icon"
        rounded="full"
        onClick={() => setOpen(true)}
        className="text-slate-900 dark:text-white h-9 w-9"
        aria-label={tNav("openMobileMenu")}
      >
        <Menu className="w-5 h-5" />
      </PatternButton>

      <GlassSheet
        open={open}
        onOpenChange={setOpen}
        side="left"
        title={tNav("mobileMenuTitle")}
      >
        <div
          className={cn(
            "animate-in fade-in slide-in-from-top-2 duration-200 pt-2",
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
      </GlassSheet>
    </>
  );
}
