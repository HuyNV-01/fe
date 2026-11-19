"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import config from "@/config";
import {
  GlassBadge,
  GlassEmptyState,
  GlassSectionHeader,
  GlassSurfaceCard,
  GlassTabs,
  LiquidSearch,
  PatternButton,
  TruncatedText,
  type GlassTabItem,
} from "@/components/toolkit";
import { PermissionGate } from "@/components/iam/permission-gate";
import { usePermissionStore } from "@/lib/stores/iam/use-permission-store";
import { useChannelWorkspaceStore } from "@/lib/stores/channel/use-channel-workspace-store";
import {
  ArrowLeftRight,
  ArrowRight,
  Barcode,
  Boxes,
  Layers,
  MessageSquareQuote,
  Package,
  PlusCircle,
  Settings,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Store,
  Tags,
  UserCheck,
  Users,
  Warehouse,
} from "lucide-react";

type SettingsGroupKey =
  | "ALL"
  | "CHANNELS_INBOX"
  | "TEAM_SECURITY"
  | "CATALOG_POS"
  | "CRM_GROWTH";

interface SettingsHubItem {
  id: string;
  group: Exclude<SettingsGroupKey, "ALL">;
  titleKey: string;
  descKey: string;
  ctaKey: string;
  href: string;
  icon: ReactNode;
  accentClass: string;
  requiredPermission?: string;
  badgeText?: string;
  badgeVariant?:
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger"
    | "info";
}

export default function SettingsHubPage() {
  const t = useTranslations("SettingsHub");
  const router = useRouter();

  const activeShopId = usePermissionStore((s) => s.activeShopId);
  const memberships = usePermissionStore((s) => s.memberships);
  const hasPermission = usePermissionStore((s) => s.hasPermission);

  const channels = useChannelWorkspaceStore((s) => s.channels);
  const fetchShopChannels = useChannelWorkspaceStore(
    (s) => s.fetchShopChannels,
  );

  const [activeGroup, setActiveGroup] = useState<SettingsGroupKey>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const activeShopName = useMemo(
    () => memberships.find((m) => m.shopId === activeShopId)?.shopName || "",
    [memberships, activeShopId],
  );

  useEffect(() => {
    if (activeShopId) {
      void fetchShopChannels(activeShopId);
    }
  }, [activeShopId, fetchShopChannels]);

  const warningChannelsCount = useMemo(
    () =>
      channels.filter(
        (ch) =>
          ch.webhookStatus === "TOKEN_EXPIRED" ||
          ch.webhookStatus === "TOKEN_EXPIRING_SOON",
      ).length,
    [channels],
  );

  const allItems = useMemo<SettingsHubItem[]>(
    () => [
      {
        id: "channels",
        group: "CHANNELS_INBOX",
        titleKey: "items.channels.title",
        descKey: "items.channels.desc",
        ctaKey: "openBtn",
        href: config.routes.private.settingsChannels,
        icon: <Share2 className="w-5 h-5" />,
        accentClass: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
        requiredPermission: "CHANNEL_INTEGRATION_CONNECT",
        badgeText:
          warningChannelsCount > 0
            ? t("badges.tokenWarning", { count: warningChannelsCount })
            : t("badges.connectedCount", { count: channels.length }),
        badgeVariant: warningChannelsCount > 0 ? "danger" : "success",
      },
      {
        id: "tags",
        group: "CHANNELS_INBOX",
        titleKey: "items.tags.title",
        descKey: "items.tags.desc",
        ctaKey: "openBtn",
        href: config.routes.private.settingsTags,
        icon: <Tags className="w-5 h-5" />,
        accentClass: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
        requiredPermission: "INBOX_TAG_MANAGE",
      },
      {
        id: "quick-replies",
        group: "CHANNELS_INBOX",
        titleKey: "items.quickReplies.title",
        descKey: "items.quickReplies.desc",
        ctaKey: "openBtn",
        href: config.routes.private.settingsQuickReplies,
        icon: <MessageSquareQuote className="w-5 h-5" />,
        accentClass: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
        requiredPermission: "INBOX_QUICK_REPLY_MANAGE",
      },
      {
        id: "merged-inbox",
        group: "CHANNELS_INBOX",
        titleKey: "items.mergedInbox.title",
        descKey: "items.mergedInbox.desc",
        ctaKey: "openBtn",
        href: config.routes.private.multiPageMergeChat,
        icon: <Layers className="w-5 h-5" />,
        accentClass: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
        requiredPermission: "INBOX_MULTI_PAGE_MERGE",
      },
      {
        id: "members",
        group: "TEAM_SECURITY",
        titleKey: "items.members.title",
        descKey: "items.members.desc",
        ctaKey: "openBtn",
        href: config.routes.private.settingsMembers,
        icon: <Users className="w-5 h-5" />,
        accentClass: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
        requiredPermission: "IAM_MEMBER_INVITE_MANAGE",
      },
      {
        id: "permissions",
        group: "TEAM_SECURITY",
        titleKey: "items.permissions.title",
        descKey: "items.permissions.desc",
        ctaKey: "openBtn",
        href: config.routes.private.settingsPermissions,
        icon: <ShieldCheck className="w-5 h-5" />,
        accentClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
        requiredPermission: "IAM_PERMISSION_MATRIX_MANAGE",
      },
      {
        id: "security-audit",
        group: "TEAM_SECURITY",
        titleKey: "items.securityAudit.title",
        descKey: "items.securityAudit.desc",
        ctaKey: "openBtn",
        href: config.routes.private.settingsSecurityAudit,
        icon: <ShieldAlert className="w-5 h-5" />,
        accentClass: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
        requiredPermission: "CRM_SECURITY_AUDIT_VIEW",
      },
      {
        id: "workspace-onboarding",
        group: "TEAM_SECURITY",
        titleKey: "items.workspaceOnboarding.title",
        descKey: "items.workspaceOnboarding.desc",
        ctaKey: "openBtn",
        href: config.routes.private.onboarding,
        icon: <PlusCircle className="w-5 h-5" />,
        accentClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
      },
      {
        id: "products",
        group: "CATALOG_POS",
        titleKey: "items.products.title",
        descKey: "items.products.desc",
        ctaKey: "openBtn",
        href: config.routes.private.products,
        icon: <Package className="w-5 h-5" />,
        accentClass: "bg-teal-500/15 text-teal-600 dark:text-teal-400",
      },
      {
        id: "bundles",
        group: "CATALOG_POS",
        titleKey: "items.bundles.title",
        descKey: "items.bundles.desc",
        ctaKey: "openBtn",
        href: config.routes.private.productBundles,
        icon: <Boxes className="w-5 h-5" />,
        accentClass: "bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400",
      },
      {
        id: "inventory",
        group: "CATALOG_POS",
        titleKey: "items.inventory.title",
        descKey: "items.inventory.desc",
        ctaKey: "openBtn",
        href: config.routes.private.warehouseInventory,
        icon: <Warehouse className="w-5 h-5" />,
        accentClass: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
      },
      {
        id: "transfers",
        group: "CATALOG_POS",
        titleKey: "items.transfers.title",
        descKey: "items.transfers.desc",
        ctaKey: "openBtn",
        href: config.routes.private.warehouseTransfers,
        icon: <ArrowLeftRight className="w-5 h-5" />,
        accentClass: "bg-lime-500/15 text-lime-600 dark:text-lime-400",
      },
      {
        id: "serial-imei",
        group: "CATALOG_POS",
        titleKey: "items.serialImei.title",
        descKey: "items.serialImei.desc",
        ctaKey: "openBtn",
        href: config.routes.private.serialImeiLookup,
        icon: <Barcode className="w-5 h-5" />,
        accentClass: "bg-slate-500/15 text-slate-600 dark:text-slate-300",
      },
      {
        id: "pos-counter",
        group: "CATALOG_POS",
        titleKey: "items.posCounter.title",
        descKey: "items.posCounter.desc",
        ctaKey: "openBtn",
        href: config.routes.private.posCounter,
        icon: <Store className="w-5 h-5" />,
        accentClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
      },
      {
        id: "customers-crm",
        group: "CRM_GROWTH",
        titleKey: "items.customersCrm.title",
        descKey: "items.customersCrm.desc",
        ctaKey: "openBtn",
        href: config.routes.private.customersCrm,
        icon: <UserCheck className="w-5 h-5" />,
        accentClass: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
      },
      {
        id: "rfm-segments",
        group: "CRM_GROWTH",
        titleKey: "items.rfmSegments.title",
        descKey: "items.rfmSegments.desc",
        ctaKey: "openBtn",
        href: config.routes.private.customerRfmSegments,
        icon: <Sparkles className="w-5 h-5" />,
        accentClass: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
      },
    ],
    [channels.length, warningChannelsCount, t],
  );

  const visibleItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allItems.filter((item) => {
      if (item.requiredPermission && !hasPermission(item.requiredPermission)) {
        return false;
      }
      if (activeGroup !== "ALL" && item.group !== activeGroup) {
        return false;
      }
      if (!q) return true;
      const titleText = t(item.titleKey).toLowerCase();
      const descText = t(item.descKey).toLowerCase();
      return titleText.includes(q) || descText.includes(q);
    });
  }, [allItems, activeGroup, searchQuery, hasPermission, t]);

  const tabItems = useMemo<GlassTabItem<SettingsGroupKey>[]>(
    () => [
      { key: "ALL", label: t("tabs.all") },
      { key: "CHANNELS_INBOX", label: t("tabs.channelsInbox") },
      { key: "TEAM_SECURITY", label: t("tabs.teamSecurity") },
      { key: "CATALOG_POS", label: t("tabs.catalogPos") },
      { key: "CRM_GROWTH", label: t("tabs.crmGrowth") },
    ],
    [t],
  );

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <GlassSectionHeader
          icon={<Settings className="w-5 h-5" />}
          title={t("pageTitle")}
          subtitle={
            activeShopName
              ? t("pageSubtitleWithShop", { shopName: activeShopName })
              : t("pageSubtitle")
          }
        />

        <div className="w-full md:w-72 shrink-0">
          <LiquidSearch
            mode="input"
            value={searchQuery}
            onValueChange={(val) => setSearchQuery(val)}
            placeholder={t("searchPlaceholder")}
          />
        </div>
      </div>

      <GlassTabs<SettingsGroupKey>
        items={tabItems}
        value={activeGroup}
        onValueChange={(val) => setActiveGroup(val)}
      />

      {visibleItems.length === 0 ? (
        <GlassSurfaceCard className="p-8">
          <GlassEmptyState
            icon={<Settings className="w-6 h-6" />}
            title={t("emptyTitle")}
            description={t("emptyDesc")}
            action={
              <PatternButton
                type="button"
                size="sm"
                variant="glass"
                color="primary"
                rounded="full"
                uniformWidth="md"
                onClick={() => {
                  setSearchQuery("");
                  setActiveGroup("ALL");
                }}
              >
                {t("resetFilterBtn")}
              </PatternButton>
            }
          />
        </GlassSurfaceCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleItems.map((item) => {
            const cardBody = (
              <GlassSurfaceCard
                key={item.id}
                className="p-4 h-full flex flex-col justify-between gap-4 hover:border-primary/40 transition-colors"
              >
                <div className="space-y-2.5 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.accentClass}`}
                    >
                      {item.icon}
                    </div>
                    {item.badgeText && (
                      <GlassBadge
                        variant={item.badgeVariant || "secondary"}
                        size="sm"
                        className="shrink-0 max-w-36"
                      >
                        <TruncatedText>{item.badgeText}</TruncatedText>
                      </GlassBadge>
                    )}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <TruncatedText
                      as="h3"
                      className="text-sm font-bold text-foreground"
                    >
                      {t(item.titleKey)}
                    </TruncatedText>
                    <TruncatedText
                      as="p"
                      lines={2}
                      className="text-xs text-muted-foreground leading-relaxed"
                    >
                      {t(item.descKey)}
                    </TruncatedText>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-2 border-t border-border/40">
                  <PatternButton
                    type="button"
                    size="sm"
                    variant="glass"
                    color="primary"
                    rounded="full"
                    uniformWidth="sm"
                    icon={<ArrowRight className="w-3.5 h-3.5" />}
                    iconPosition="right"
                    onClick={() => router.push(item.href)}
                  >
                    {t(item.ctaKey)}
                  </PatternButton>
                </div>
              </GlassSurfaceCard>
            );

            return item.requiredPermission ? (
              <PermissionGate
                key={item.id}
                can={item.requiredPermission}
                mode="hide"
              >
                {cardBody}
              </PermissionGate>
            ) : (
              cardBody
            );
          })}
        </div>
      )}
    </div>
  );
}
