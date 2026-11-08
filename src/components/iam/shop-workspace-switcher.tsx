"use client";

import React from "react";
import {
  Store,
  ChevronDown,
  Check,
  PlusCircle,
  Users,
  Clock,
  Share2,
  ShieldCheck,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LiquidGlassInput,
  DropdownMenuContentCus,
  ItemMenu,
  GlassBadge,
  PatternButton,
  TruncatedText,
} from "@/components/toolkit";
import { usePermissionStore } from "@/lib/stores/iam/use-permission-store";
import config from "@/config";
import { cn } from "@/lib/utils";

export const ShopWorkspaceSwitcher = () => {
  const t = useTranslations("OnboardingAndRoles");
  const router = useRouter();

  const activeShopId = usePermissionStore((s) => s.activeShopId);
  const role = usePermissionStore((s) => s.role);
  const memberships = usePermissionStore((s) => s.memberships);
  const pendingInvitations = usePermissionStore((s) => s.pendingInvitations);
  const switchShopWorkspace = usePermissionStore((s) => s.switchShopWorkspace);
  const hasPermission = usePermissionStore((s) => s.hasPermission);

  const activeShop = memberships.find((m) => m.shopId === activeShopId);

  const handleSelectShop = async (shopId: string) => {
    if (shopId !== activeShopId) {
      await switchShopWorkspace(shopId);
    }
  };

  if (!activeShop) {
    return (
      <PatternButton
        type="button"
        variant="solid"
        color="primary"
        size="sm"
        rounded={"full"}
        onClick={() => router.push(config.routes.private.onboarding)}
        icon={<Store className="w-3.5 h-3.5" />}
        iconPosition="left"
      >
        <TruncatedText className="max-w-40">
          {t("switcher.setupShopBtn")}
        </TruncatedText>
        {pendingInvitations.length > 0 && (
          <span className="ml-1.5 rounded-full bg-red-500 text-white text-[10px] px-1.5 py-0.2 font-bold">
            {pendingInvitations.length}
          </span>
        )}
      </PatternButton>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <LiquidGlassInput
          fluid={false}
          className="cursor-pointer p-0 overflow-hidden"
        >
          <button
            type="button"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-transparent outline-none cursor-pointer max-w-60"
          >
            <Store className="w-4 h-4 text-primary shrink-0" />
            <TruncatedText className="text-xs font-bold max-w-28">
              {activeShop.shopName}
            </TruncatedText>
            {role && (
              <GlassBadge variant="primary" size="sm" className="max-w-28">
                <TruncatedText>{t(`roles.${role}`)}</TruncatedText>
              </GlassBadge>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          </button>
        </LiquidGlassInput>
      </DropdownMenuTrigger>

      <DropdownMenuContentCus
        align="end"
        className="w-76 max-w-[calc(100vw-1.5rem)]"
      >
        <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground">
          <TruncatedText>{t("switcher.yourWorkspacesTitle")}</TruncatedText>
        </DropdownMenuLabel>

        <DropdownMenuGroup>
          {memberships.map((m) => {
            const isSelected = m.shopId === activeShopId;
            const isPending = m.membershipStatus === "PENDING_APPROVAL";

            return (
              <DropdownMenuItem
                key={m.memberId}
                disabled={isPending}
                onClick={() => handleSelectShop(m.shopId)}
                className={cn(
                  "flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl cursor-pointer",
                  isSelected && "bg-primary/15 text-primary font-semibold",
                )}
              >
                <div className="min-w-0 flex items-center space-x-2.5">
                  <TruncatedText className="text-xs font-bold max-w-36">
                    {m.shopName}
                  </TruncatedText>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isPending ? (
                      <GlassBadge variant="warning" size="sm">
                        <Clock className="w-2.5 h-2.5 mr-1 inline shrink-0" />
                        <TruncatedText className="max-w-24">
                          {t("status.PENDING_APPROVAL")}
                        </TruncatedText>
                      </GlassBadge>
                    ) : (
                      <GlassBadge variant="secondary" size="sm">
                        <TruncatedText className="max-w-24">
                          {t(`roles.${m.role}`)}
                        </TruncatedText>
                      </GlassBadge>
                    )}
                  </div>
                </div>
                {isSelected && (
                  <Check className="w-4 h-4 text-primary shrink-0" />
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          {hasPermission("CHANNEL_INTEGRATION_CONNECT") && (
            <ItemMenu
              route={config.routes.private.settingsChannels}
              icon={<Share2 className="size-4 text-sky-500" />}
            >
              <TruncatedText>{t("switcher.manageChannelsBtn")}</TruncatedText>
            </ItemMenu>
          )}

          {hasPermission("IAM_MEMBER_INVITE_MANAGE") && (
            <>
              <ItemMenu
                route={config.routes.private.settingsPermissions}
                icon={<ShieldCheck className="size-4 text-emerald-500" />}
              >
                <TruncatedText>
                  {t("switcher.managePermissionsMatrixBtn")}
                </TruncatedText>
              </ItemMenu>

              <ItemMenu
                route={config.routes.private.settingsMembers}
                icon={<Users className="size-4 text-indigo-500" />}
              >
                <TruncatedText>{t("switcher.manageMembersBtn")}</TruncatedText>
              </ItemMenu>
            </>
          )}

          <ItemMenu
            route={config.routes.private.onboarding}
            icon={<PlusCircle className="size-4 text-primary" />}
          >
            <TruncatedText>{t("switcher.createOrJoinShopBtn")}</TruncatedText>
          </ItemMenu>
        </DropdownMenuGroup>
      </DropdownMenuContentCus>
    </DropdownMenu>
  );
};
