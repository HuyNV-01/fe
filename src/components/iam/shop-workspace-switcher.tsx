"use client";

import React, { useState } from "react";
import {
  Store,
  ChevronDown,
  Check,
  PlusCircle,
  Users,
  Clock,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  LiquidPopover,
  LiquidPopoverTrigger,
  LiquidPopoverContent,
  GlassBadge,
  PatternButton,
  GlassSurfaceCard,
} from "@/components/toolkit";
import { usePermissionStore } from "@/lib/stores/iam/use-permission-store";
import config from "@/config";
import { cn } from "@/lib/utils";

export const ShopWorkspaceSwitcher = () => {
  const t = useTranslations("OnboardingAndRoles");
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const activeShopId = usePermissionStore((s) => s.activeShopId);
  const role = usePermissionStore((s) => s.role);
  const memberships = usePermissionStore((s) => s.memberships);
  const pendingInvitations = usePermissionStore((s) => s.pendingInvitations);
  const switchShopWorkspace = usePermissionStore((s) => s.switchShopWorkspace);
  const hasPermission = usePermissionStore((s) => s.hasPermission);

  const activeShop = memberships.find((m) => m.shopId === activeShopId);

  const handleSelectShop = async (shopId: string) => {
    setOpen(false);
    if (shopId !== activeShopId) {
      await switchShopWorkspace(shopId);
    }
  };

  if (!activeShop) {
    return (
      <PatternButton
        variant="glass"
        size="sm"
        rounded="full"
        onClick={() => router.push(config.routes.private.onboarding)}
      >
        <div className="flex flex-row items-center">
            <Store className="w-3.5 h-3.5 mr-1.5" />
            {t("switcher.setupShopBtn")}
            {pendingInvitations.length > 0 && (
            <span className="ml-1.5 rounded-full bg-red-500 text-white text-[10px] px-1.5 py-0.2 font-bold">
                {pendingInvitations.length}
            </span>
            )}
        </div>
      </PatternButton>
    );
  }

  return (
    <LiquidPopover open={open} onOpenChange={setOpen}>
      <LiquidPopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/50 bg-white/30 dark:bg-white/5 backdrop-blur-md hover:bg-white/50 transition-all cursor-pointer"
        >
          <Store className="w-4 h-4 text-primary shrink-0" />
          <span className="text-xs font-bold truncate max-w-32">
            {activeShop.shopName}
          </span>
          {role && (
            <GlassBadge variant="primary" size="sm">
              {t(`roles.${role}`)}
            </GlassBadge>
          )}
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </LiquidPopoverTrigger>

      <LiquidPopoverContent>
        <GlassSurfaceCard className="w-80!"  bodyClassName="w-full space-y-1.5">
            <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground">
                {t("switcher.yourWorkspacesTitle")}
            </div>

            <div className="space-y-1 max-h-56 overflow-y-auto">
            {memberships.map((m) => {
                const isSelected = m.shopId === activeShopId;
                const isPending = m.membershipStatus === "PENDING_APPROVAL";

                return (
                <button
                    key={m.memberId}
                    type="button"
                    disabled={isPending}
                    onClick={() => handleSelectShop(m.shopId)}
                    className={cn(
                    "w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-left transition-all cursor-pointer",
                    isSelected
                        ? "bg-primary/15 text-primary font-semibold"
                        : "hover:bg-black/5 dark:hover:bg-white/5",
                    isPending && "opacity-60 cursor-not-allowed",
                    )}
                >
                    <div className="min-w-0 flex items-center space-x-3">
                        <p className="text-xs font-bold truncate">{m.shopName}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            {isPending ? (
                            <GlassBadge variant="warning" size="sm">
                                <Clock className="w-2.5 h-2.5 mr-1 inline" />
                                {t("status.PENDING_APPROVAL")}
                            </GlassBadge>
                            ) : (
                            <GlassBadge variant="secondary" size="sm">
                                {t(`roles.${m.role}`)}
                            </GlassBadge>
                            )}
                        </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                </button>
                );
            })}
            </div>

            <div className="h-px bg-border/50 my-1" />

            {hasPermission("IAM_MEMBER_INVITE_MANAGE") && (
            <button
                type="button"
                onClick={() => {
                setOpen(false);
                router.push(config.routes.private.settingsMembers);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            >
                <Users className="w-5 h-5 text-indigo-500" />
                <span>{t("switcher.manageMembersBtn")}</span>
            </button>
            )}

            <button
                type="button"
                onClick={() => {
                    setOpen(false);
                    router.push(config.routes.private.onboarding);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold text-primary hover:bg-primary/10 cursor-pointer"
            >
                <PlusCircle className="w-5 h-5" />
                <span>{t("switcher.createOrJoinShopBtn")}</span>
            </button>
        </GlassSurfaceCard>
      </LiquidPopoverContent>
    </LiquidPopover>
  );
};
