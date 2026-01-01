"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { PatternButton } from "../button/button-patterns";
import { LiquidGlassModal } from "../liquid-glass/liquid-glass";

interface MobileMenuTriggerProps {
  links: Array<{ label: string; href: string }>;
  actions: {
    showSignIn?: boolean;
    showSignUp?: boolean;
  };
}

export function MobileMenuTrigger({ links, actions }: MobileMenuTriggerProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-slate-900 dark:text-white"
          aria-label="Toggle menu"
        >
          <Menu className="w-6 h-6" />
        </Button>
      </SheetTrigger>

      <SheetContent className="p-2! bg-transparent! border-none" side="left">
        <LiquidGlassModal className="h-full p-4">
          <div
            className={cn(
              "animate-in fade-in slide-in-from-top-2 duration-200",
            )}
          >
            {/* Navigation Links */}
            <div className="space-y-1 mb-4">
              {links.map((link) => (
                <Link key={link.href} href={link.href}>
                  <div
                    className={cn(
                      "px-4 py-2 rounded-lg",
                      "text-sm font-medium",
                      "text-slate-900 dark:text-slate-100",
                      "hover:scale-105 transition-transform duration-200",
                      "cursor-pointer",
                    )}
                  >
                    {link.label}
                  </div>
                </Link>
              ))}
            </div>

            {/* Actions Section */}
            <div className="border-t border-white/20 dark:border-white/10 pt-4 space-y-2">
              {actions.showSignIn && (
                <PatternButton variant="glass" size="md" fullWidth>
                  Đăng nhập
                </PatternButton>
              )}

              {actions.showSignUp && (
                <PatternButton variant="solid" size="md" fullWidth>
                  Đăng ký
                </PatternButton>
              )}
            </div>
          </div>
        </LiquidGlassModal>
      </SheetContent>
    </Sheet>
  );
}
