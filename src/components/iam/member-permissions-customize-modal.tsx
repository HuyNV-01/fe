/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <explanation> */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Layers,
  Lock,
  MessageSquare,
  Percent,
  PhoneCall,
  RotateCcw,
  Search,
  Share2,
  Shield,
  ShieldCheck,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  ContentSelect,
  GlassAlert,
  GlassAvatar,
  GlassBadge,
  GlassEmptyState,
  GlassModal,
  GlassTabs,
  ItemSelect,
  LiquidGlassInput,
  PatternButton,
  Switch,
  TruncatedText,
} from "@/components/toolkit";
import {
  ALL_92_PERMISSION_CODES,
  DEFAULT_ROLE_PERMISSIONS_FALLBACK,
  PERMISSION_CATALOG_GROUPS,
  type PermissionGroupKey,
  resolveEffectivePermissionsForMember,
  resolveRolePresetDefaults,
} from "@/constant/permission-catalog";
import { useChannelWorkspaceStore } from "@/lib/stores/channel/use-channel-workspace-store";
import {
  type DataScopeType,
  type ShopRoleType,
  updateMemberPermissionsApi,
} from "@/lib/stores/iam/api";
import { usePermissionStore } from "@/lib/stores/iam/use-permission-store";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import { cn } from "@/lib/utils";

const ASSIGNABLE_ROLES: ShopRoleType[] = [
  "SHOP_MANAGER",
  "SENIOR_SALE",
  "SALE_AGENT",
  "WAREHOUSE_PACKER",
  "ACCOUNTANT",
  "MARKETING_AI_OPS",
];

const DATA_SCOPES: DataScopeType[] = [
  "ALL_SHOP",
  "TEAM_SHIFT",
  "ASSIGNED_PLUS_POOL",
  "ASSIGNED_ONLY",
];

export interface MemberPermissionsCustomizeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shopId: string | null;
  member: any | null;
  members?: any[];
  rolePresets?: Record<string, any>;
  onSelectMember?: (member: any) => void;
  onSaved?: () => Promise<void> | void;
}

export const MemberPermissionsCustomizeModal = ({
  open,
  onOpenChange,
  shopId,
  member,
  members = [],
  rolePresets = {},
  onSelectMember,
  onSaved,
}: MemberPermissionsCustomizeModalProps) => {
  const t = useTranslations("OnboardingAndRoles");
  const tCatalog = useTranslations("PermissionCatalog");
  const triggerMembersRefresh = usePermissionStore(
    (s) => s.triggerMembersRefresh,
  );
  const channels = useChannelWorkspaceStore((s) => s.channels);
  const fetchShopChannels = useChannelWorkspaceStore(
    (s) => s.fetchShopChannels,
  );

  const [role, setRole] = useState<ShopRoleType>("SALE_AGENT");
  const [dataScope, setDataScope] =
    useState<DataScopeType>("ASSIGNED_PLUS_POOL");
  const [maxDiscountPercent, setMaxDiscountPercent] = useState<number>(5);
  const [unmaskPhoneHourlyLimit, setUnmaskPhoneHourlyLimit] =
    useState<number>(15);
  const [maxConcurrentChats, setMaxConcurrentChats] = useState<number>(25);
  const [customGrantedPerms, setCustomGrantedPerms] = useState<string[]>([]);
  const [allowedChannelIds, setAllowedChannelIds] = useState<string[]>([]);
  const [initialSnapshot, setInitialSnapshot] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeGroupFilter, setActiveGroupFilter] = useState<
    "ALL" | PermissionGroupKey
  >("ALL");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const editableMembers = useMemo(
    () =>
      members.filter(
        (m) => m.membershipStatus === "ACTIVE" || m.id === member?.id,
      ),
    [members, member?.id],
  );

  useEffect(() => {
    if (open && shopId && channels.length === 0) {
      fetchShopChannels(shopId);
    }
  }, [open, shopId, channels.length, fetchShopChannels]);

  useEffect(() => {
    if (!open || !member) return;
    const memberRole: ShopRoleType = member.role || "SALE_AGENT";
    const memberScope: DataScopeType = member.dataScope || "ASSIGNED_PLUS_POOL";
    const memberDiscount = Number(member.maxDiscountPercent ?? 5);
    const memberUnmask = Number(member.unmaskPhoneHourlyLimit ?? 15);
    const memberMaxChats = Number(member.maxConcurrentChats ?? 25);
    const memberChannelIds = Array.isArray(member.allowedChannelIdsJson)
      ? member.allowedChannelIdsJson
      : [];

    setRole(memberRole);
    setDataScope(memberScope);
    setMaxDiscountPercent(memberDiscount);
    setUnmaskPhoneHourlyLimit(memberUnmask);
    setMaxConcurrentChats(memberMaxChats);
    setAllowedChannelIds(memberChannelIds);

    const effectivePerms = resolveEffectivePermissionsForMember(
      member,
      rolePresets,
    );
    setCustomGrantedPerms(effectivePerms);
    setInitialSnapshot(
      JSON.stringify({
        role: memberRole,
        dataScope: memberScope,
        maxDiscountPercent: memberDiscount,
        unmaskPhoneHourlyLimit: memberUnmask,
        maxConcurrentChats: memberMaxChats,
        allowedChannels: [...memberChannelIds].sort(),
        perms: [...effectivePerms].sort(),
      }),
    );
    setSearchQuery("");
    setActiveGroupFilter("ALL");
  }, [open, member, rolePresets]);

  const isOwner = member?.role === "SHOP_OWNER";

  const hasUnsavedChanges = useMemo(() => {
    if (isOwner || !initialSnapshot) return false;
    const currentSnap = JSON.stringify({
      role,
      dataScope,
      maxDiscountPercent: Number(maxDiscountPercent || 0),
      unmaskPhoneHourlyLimit: Number(unmaskPhoneHourlyLimit || 0),
      maxConcurrentChats: Number(maxConcurrentChats || 25),
      allowedChannels: [...allowedChannelIds].sort(),
      perms: [...customGrantedPerms].sort(),
    });
    return currentSnap !== initialSnapshot;
  }, [
    isOwner,
    initialSnapshot,
    role,
    dataScope,
    maxDiscountPercent,
    unmaskPhoneHourlyLimit,
    maxConcurrentChats,
    allowedChannelIds,
    customGrantedPerms,
  ]);

  const handleRoleChange = (nextRole: ShopRoleType) => {
    setRole(nextRole);
    const { defaultScope, defaultDiscount, defaultUnmask } =
      resolveRolePresetDefaults(nextRole);
    setDataScope(defaultScope);
    setMaxDiscountPercent(defaultDiscount);
    setUnmaskPhoneHourlyLimit(defaultUnmask);

    const presetPerms =
      rolePresets?.[nextRole]?.defaultPermissions ||
      DEFAULT_ROLE_PERMISSIONS_FALLBACK[nextRole] ||
      [];
    setCustomGrantedPerms(presetPerms);
  };

  const handleResetToRoleDefault = () => {
    const targetRole = isOwner ? "SHOP_OWNER" : role;
    const { defaultScope, defaultDiscount, defaultUnmask } =
      resolveRolePresetDefaults(targetRole);
    setDataScope(defaultScope);
    setMaxDiscountPercent(defaultDiscount);
    setUnmaskPhoneHourlyLimit(defaultUnmask);
    setAllowedChannelIds([]);

    const presetPerms =
      rolePresets?.[targetRole]?.defaultPermissions ||
      DEFAULT_ROLE_PERMISSIONS_FALLBACK[targetRole] ||
      [];
    setCustomGrantedPerms(presetPerms);
  };

  const handleTogglePermissionCode = (code: string, checked: boolean) => {
    if (isOwner) return;
    setCustomGrantedPerms((prev) =>
      checked
        ? Array.from(new Set([...prev, code]))
        : prev.filter((c) => c !== code),
    );
  };

  const handleToggleAllowedChannel = (channelId: string) => {
    if (isOwner) return;
    setAllowedChannelIds((prev) =>
      prev.includes(channelId)
        ? prev.filter((id) => id !== channelId)
        : [...prev, channelId],
    );
  };

  const handleToggleEntireGroup = (codes: string[], enableAll: boolean) => {
    if (isOwner) return;
    setCustomGrantedPerms((prev) => {
      const nextSet = new Set(prev);
      for (const code of codes) {
        if (enableAll) {
          nextSet.add(code);
        } else {
          nextSet.delete(code);
        }
      }
      return Array.from(nextSet);
    });
  };

  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return PERMISSION_CATALOG_GROUPS.filter(
      (grp) =>
        activeGroupFilter === "ALL" || grp.groupKey === activeGroupFilter,
    )
      .map((grp) => {
        const matchedCodes = grp.codes.filter((code) => {
          if (!q) return true;
          const label = tCatalog(`permissions.${code}.label`).toLowerCase();
          const desc = tCatalog(`permissions.${code}.desc`).toLowerCase();
          return (
            label.includes(q) ||
            desc.includes(q) ||
            code.toLowerCase().includes(q)
          );
        });
        return {
          ...grp,
          codes: matchedCodes,
        };
      })
      .filter((grp) => grp.codes.length > 0);
  }, [activeGroupFilter, searchQuery, tCatalog]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId || !member || isOwner) return;

    setIsSaving(true);
    try {
      const baseRolePerms =
        rolePresets?.[role]?.defaultPermissions ||
        DEFAULT_ROLE_PERMISSIONS_FALLBACK[role] ||
        [];
      const activeSet = new Set(customGrantedPerms);
      const revokedList = baseRolePerms.filter(
        (code: string) => !activeSet.has(code),
      );

      await updateMemberPermissionsApi(shopId, member.id, {
        role,
        dataScope,
        maxDiscountPercent: Math.min(
          100,
          Math.max(0, Number(maxDiscountPercent || 0)),
        ),
        unmaskPhoneHourlyLimit: Math.max(
          0,
          Number(unmaskPhoneHourlyLimit || 0),
        ),
        maxConcurrentChats: Math.max(1, Number(maxConcurrentChats || 25)),
        grantedPermissionsJson: customGrantedPerms,
        revokedPermissionsJson: revokedList,
        allowedChannelIdsJson: allowedChannelIds,
      });

      triggerMembersRefresh();
      await onSaved?.();
      onOpenChange(false);

      showSuccessToast(
        t("membersPage.permissionsSavedToastDesc", {
          count: customGrantedPerms.length,
          name: member.user?.name || member.user?.email || "Nhân sự",
        }),
        {
          title: t("membersPage.permissionsSavedToastTitle"),
        },
      );
    } catch (err: any) {
      showErrorToast(err?.response?.data?.message || "Error");
    } finally {
      setIsSaving(false);
    }
  };

  if (!member) return null;

  const activePermCount = isOwner
    ? ALL_92_PERMISSION_CODES.length
    : customGrantedPerms.length;

  const canViewCostPrice =
    isOwner ||
    customGrantedPerms.includes("CATALOG_COST_PRICE_VIEW") ||
    customGrantedPerms.includes("FINANCE_PNL_STATEMENT_VIEW");

  const canUnmaskPhone =
    isOwner || customGrantedPerms.includes("CRM_PHONE_UNMASK");

  const groupTabItems = [
    {
      key: "ALL" as const,
      label: t("membersPage.allGroupsTab"),
      badge: `${activePermCount}/${ALL_92_PERMISSION_CODES.length}`,
    },
    ...PERMISSION_CATALOG_GROUPS.map((grp) => {
      const enabledInGroup = grp.codes.filter((c) =>
        isOwner ? true : customGrantedPerms.includes(c),
      ).length;
      return {
        key: grp.groupKey,
        label: tCatalog(`groups.${grp.groupKey}.shortTitle`),
        badge: `${enabledInGroup}/${grp.codes.length}`,
      };
    }),
  ];

  return (
    <GlassModal
      open={open}
      onOpenChange={onOpenChange}
      title={
        <TruncatedText as="span">
          {t("membersPage.customizeModalTitle")}
        </TruncatedText>
      }
      description={t("membersPage.customizeModalDesc")}
      size="full"
      footer={
        <div className="w-full pt-3.5 border-t border-border/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center justify-between sm:justify-start gap-2 flex-wrap">
            <GlassBadge variant="primary" size="md" className="h-8 px-3">
              <Sparkles className="w-3.5 h-3.5 mr-1 inline shrink-0" />
              <span>
                {t("membersPage.permissionCountBadge", {
                  count: activePermCount,
                })}
              </span>
            </GlassBadge>

            {!isOwner && (
              <GlassBadge
                variant={hasUnsavedChanges ? "warning" : "secondary"}
                size="sm"
                dot
              >
                {hasUnsavedChanges
                  ? t("membersPage.unsavedChangesBadge")
                  : t("membersPage.roleDefaultSyncedBadge")}
              </GlassBadge>
            )}

            {!isOwner && (
              <PatternButton
                type="button"
                variant="ghost"
                color="neutral"
                size="sm"
                rounded="full"
                onClick={handleResetToRoleDefault}
                icon={<RotateCcw className="w-3.5 h-3.5" />}
                iconPosition="left"
                className="h-8 px-3 text-xs"
              >
                <TruncatedText>
                  {t("membersPage.resetRoleDefaultBtn")}
                </TruncatedText>
              </PatternButton>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 shrink-0">
            <PatternButton
              type="button"
              variant="glass"
              color="neutral"
              size="sm"
              rounded="full"
              disabled={isSaving}
              onClick={() => onOpenChange(false)}
              className="h-9 px-4 min-w-24"
            >
              <TruncatedText>{t("membersPage.cancelModalBtn")}</TruncatedText>
            </PatternButton>

            {!isOwner && (
              <PatternButton
                type="submit"
                form="customize-92-permissions-form"
                variant="solid"
                color="primary"
                size="sm"
                rounded="full"
                isLoading={isSaving}
                icon={<CheckCircle2 className="w-4 h-4" />}
                iconPosition="left"
                className="h-9 px-5"
              >
                <TruncatedText>
                  {t("membersPage.savePermissionsBtn")}
                </TruncatedText>
              </PatternButton>
            )}
          </div>
        </div>
      }
    >
      <form
        id="customize-92-permissions-form"
        onSubmit={handleSubmit}
        className="space-y-4 px-3"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl border border-border/50 bg-muted/20">
          <div className="flex items-center gap-3 min-w-0">
            <GlassAvatar
              src={member.user?.avatar}
              name={member.user?.name || member.user?.email || "U"}
              size="md"
              isOnline={member.shiftStatus === "ONLINE"}
              showStatus
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <TruncatedText as="span" className="font-bold text-sm max-w-52">
                  {member.user?.name || member.user?.email}
                </TruncatedText>
                <GlassBadge variant="primary" size="sm">
                  {t(`roles.${isOwner ? "SHOP_OWNER" : role}`)}
                </GlassBadge>
              </div>
              <TruncatedText
                as="p"
                className="text-xs text-muted-foreground mt-0.5 max-w-64"
              >
                {member.user?.email}
              </TruncatedText>
            </div>
          </div>

          {editableMembers.length > 1 && onSelectMember && (
            <div className="w-full sm:w-64 shrink-0">
              <Select
                value={member.id}
                onValueChange={(nextMemberId) => {
                  const found = editableMembers.find(
                    (m) => m.id === nextMemberId,
                  );
                  if (found) onSelectMember(found);
                }}
              >
                <LiquidGlassInput
                  className="w-full h-9 overflow-hidden p-0"
                  contentClassName="flex items-center w-full h-full"
                >
                  <SelectTrigger className="w-full h-9! data-[size=default]:h-9! rounded-full cursor-pointer border-0 shadow-none bg-transparent! dark:bg-transparent! hover:bg-transparent! dark:hover:bg-transparent! px-3 py-0 text-xs focus-visible:ring-0">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <User className="h-3.5 w-3.5 text-primary shrink-0" />
                      <SelectValue
                        placeholder={t(
                          "membersPage.selectMemberToCustomizeLabel",
                        )}
                      />
                    </div>
                  </SelectTrigger>
                </LiquidGlassInput>
                <ContentSelect>
                  {editableMembers.map((m) => (
                    <ItemSelect key={m.id} value={m.id}>
                      <span className="text-xs">
                        {m.user?.name || m.user?.email} ({t(`roles.${m.role}`)})
                      </span>
                    </ItemSelect>
                  ))}
                </ContentSelect>
              </Select>
            </div>
          )}
        </div>

        {isOwner ? (
          <GlassAlert
            variant="info"
            title={t("roles.SHOP_OWNER")}
            description={t("membersPage.ownerFullPermissionsNotice")}
          />
        ) : (
          <FieldGroup>
            <FieldSet>
              <FieldGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-3.5 gap-y-3 items-stretch">
                <Field className="flex flex-col justify-between gap-1.5 h-full">
                  <FieldLabel className="w-full min-h-5 flex items-center text-xs font-semibold text-foreground">
                    <TruncatedText className="w-full">
                      {t("membersPage.selectRoleLabel")}
                    </TruncatedText>
                  </FieldLabel>
                  <Select
                    value={role}
                    onValueChange={(val) =>
                      handleRoleChange(val as ShopRoleType)
                    }
                  >
                    <LiquidGlassInput
                      className="w-full h-10 overflow-hidden p-0"
                      contentClassName="flex items-center w-full h-full"
                    >
                      <SelectTrigger className="w-full h-10! data-[size=default]:h-10! rounded-full cursor-pointer border-0 shadow-none bg-transparent! dark:bg-transparent! hover:bg-transparent! dark:hover:bg-transparent! px-3.5 py-0 text-sm focus-visible:ring-0">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Shield className="h-4 w-4 text-primary shrink-0" />
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                    </LiquidGlassInput>
                    <ContentSelect>
                      {ASSIGNABLE_ROLES.map((r) => (
                        <ItemSelect key={r} value={r}>
                          <span>{t(`roles.${r}`)}</span>
                        </ItemSelect>
                      ))}
                    </ContentSelect>
                  </Select>
                </Field>

                <Field className="flex flex-col justify-between gap-1.5 h-full">
                  <FieldLabel className="w-full min-h-5 flex items-center text-xs font-semibold text-foreground">
                    <TruncatedText className="w-full">
                      {t("membersPage.selectScopeLabel")}
                    </TruncatedText>
                  </FieldLabel>
                  <Select
                    value={dataScope}
                    onValueChange={(val) => setDataScope(val as DataScopeType)}
                  >
                    <LiquidGlassInput
                      className="w-full h-10 overflow-hidden p-0"
                      contentClassName="flex items-center w-full h-full"
                    >
                      <SelectTrigger className="w-full h-10! data-[size=default]:h-10! rounded-full cursor-pointer border-0 shadow-none bg-transparent! dark:bg-transparent! hover:bg-transparent! dark:hover:bg-transparent! px-3.5 py-0 text-sm focus-visible:ring-0">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Layers className="h-4 w-4 text-indigo-500 shrink-0" />
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                    </LiquidGlassInput>
                    <ContentSelect>
                      {DATA_SCOPES.map((s) => (
                        <ItemSelect key={s} value={s}>
                          <span>{t(`scopes.${s}`)}</span>
                        </ItemSelect>
                      ))}
                    </ContentSelect>
                  </Select>
                </Field>

                <Field className="flex flex-col justify-between gap-1.5 h-full">
                  <FieldLabel className="w-full min-h-5 flex items-center text-xs font-semibold text-foreground">
                    <TruncatedText className="w-full">
                      {t("membersPage.maxDiscountLabel")}
                    </TruncatedText>
                  </FieldLabel>
                  <LiquidGlassInput
                    className="w-full h-10 overflow-hidden p-0"
                    contentClassName="flex items-center w-full h-full px-3.5"
                  >
                    <Percent className="h-4 w-4 text-muted-foreground/60 mr-2 shrink-0" />
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={String(maxDiscountPercent)}
                      onChange={(e) =>
                        setMaxDiscountPercent(Number(e.target.value || 0))
                      }
                      className="flex h-10 w-full py-0 text-sm bg-transparent! dark:bg-transparent! border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                    />
                  </LiquidGlassInput>
                </Field>

                <Field className="flex flex-col justify-between gap-1.5 h-full">
                  <FieldLabel className="w-full min-h-5 flex items-center text-xs font-semibold text-foreground">
                    <TruncatedText className="w-full">
                      {t("membersPage.unmaskLimitLabel")}
                    </TruncatedText>
                  </FieldLabel>
                  <LiquidGlassInput
                    className="w-full h-10 overflow-hidden p-0"
                    contentClassName="flex items-center w-full h-full px-3.5"
                  >
                    <PhoneCall className="h-4 w-4 text-muted-foreground/60 mr-2 shrink-0" />
                    <Input
                      type="number"
                      min={0}
                      value={String(unmaskPhoneHourlyLimit)}
                      onChange={(e) =>
                        setUnmaskPhoneHourlyLimit(Number(e.target.value || 0))
                      }
                      className="flex h-10 w-full py-0 text-sm bg-transparent! dark:bg-transparent! border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                    />
                  </LiquidGlassInput>
                </Field>

                <Field className="flex flex-col justify-between gap-1.5 h-full">
                  <FieldLabel className="w-full min-h-5 flex items-center text-xs font-semibold text-foreground">
                    <TruncatedText className="w-full">
                      {t("membersPage.maxConcurrentChatsLabel")}
                    </TruncatedText>
                  </FieldLabel>
                  <LiquidGlassInput
                    className="w-full h-10 overflow-hidden p-0"
                    contentClassName="flex items-center w-full h-full px-3.5"
                  >
                    <MessageSquare className="h-4 w-4 text-muted-foreground/60 mr-2 shrink-0" />
                    <Input
                      type="number"
                      min={1}
                      max={500}
                      value={String(maxConcurrentChats)}
                      onChange={(e) =>
                        setMaxConcurrentChats(Number(e.target.value || 25))
                      }
                      className="flex h-10 w-full py-0 text-sm bg-transparent! dark:bg-transparent! border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                    />
                  </LiquidGlassInput>
                </Field>

                <Field className="flex flex-col justify-between gap-1.5 h-full">
                  <FieldLabel className="w-full min-h-5 flex items-center text-xs font-semibold text-foreground">
                    <TruncatedText className="w-full">
                      {t("membersPage.fieldSecurityStatusLabel")}
                    </TruncatedText>
                  </FieldLabel>
                  <LiquidGlassInput
                    className="w-full h-10 overflow-hidden p-0"
                    contentClassName="flex items-center justify-between gap-1.5 w-full h-full px-3"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        handleTogglePermissionCode(
                          "CATALOG_COST_PRICE_VIEW",
                          !canViewCostPrice,
                        )
                      }
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer min-w-0 flex-1 justify-center",
                        canViewCostPrice
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : "bg-muted/70 text-muted-foreground",
                      )}
                    >
                      {canViewCostPrice ? (
                        <Eye className="w-3 h-3 shrink-0" />
                      ) : (
                        <EyeOff className="w-3 h-3 shrink-0" />
                      )}
                      <TruncatedText>
                        {canViewCostPrice
                          ? t("membersPage.fieldSecurityCostOn")
                          : t("membersPage.fieldSecurityCostOff")}
                      </TruncatedText>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleTogglePermissionCode(
                          "CRM_PHONE_UNMASK",
                          !canUnmaskPhone,
                        )
                      }
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer min-w-0 flex-1 justify-center",
                        canUnmaskPhone
                          ? "bg-sky-500/15 text-sky-600 dark:text-sky-400"
                          : "bg-muted/70 text-muted-foreground",
                      )}
                    >
                      {canUnmaskPhone ? (
                        <ShieldCheck className="w-3 h-3 shrink-0" />
                      ) : (
                        <Lock className="w-3 h-3 shrink-0" />
                      )}
                      <TruncatedText>
                        {canUnmaskPhone
                          ? t("membersPage.fieldSecurityPhoneOn")
                          : t("membersPage.fieldSecurityPhoneOff")}
                      </TruncatedText>
                    </button>
                  </LiquidGlassInput>
                </Field>
              </FieldGroup>
            </FieldSet>

            {/* Thiết lập Giới hạn Kênh bán hàng được phép trực (Allowed Channels Scope) */}
            {channels.length > 0 && (
              <div className="p-3 rounded-2xl border border-border/50 bg-muted/15 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-xs font-bold text-foreground">
                      {t("membersPage.allowedChannelsScopeLabel")}
                    </span>
                    <GlassBadge variant="secondary" size="sm">
                      {allowedChannelIds.length === 0
                        ? t("membersPage.allChannelsAllowedBadge")
                        : t("membersPage.selectedChannelsCountBadge", {
                            count: allowedChannelIds.length,
                          })}
                    </GlassBadge>
                  </div>
                  {allowedChannelIds.length > 0 && (
                    <PatternButton
                      type="button"
                      variant="ghost"
                      color="primary"
                      size="sm"
                      rounded="full"
                      onClick={() => setAllowedChannelIds([])}
                      className="h-7 px-2.5 text-[11px]"
                    >
                      {t("membersPage.allowAllChannelsBtn")}
                    </PatternButton>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {channels.map((ch) => {
                    const isExplicitlySelected = allowedChannelIds.includes(
                      ch.id,
                    );
                    const isAllMode = allowedChannelIds.length === 0;
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => handleToggleAllowedChannel(ch.id)}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer",
                          isExplicitlySelected
                            ? "border-primary bg-primary/15 text-primary font-semibold"
                            : isAllMode
                              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                              : "border-border/50 bg-background/50 text-muted-foreground opacity-70 hover:opacity-100",
                        )}
                      >
                        <span>{ch.pageShortCode}</span>
                        <span className="text-[10px] opacity-75">
                          ({ch.pageName})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </FieldGroup>
        )}

        <div className="space-y-2.5 pt-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <span className="text-xs font-bold text-foreground">
              {t("membersPage.granularPermissionsHeading", {
                count: activePermCount,
              })}
            </span>

            <LiquidGlassInput
              className="w-full sm:w-80 h-9 overflow-hidden p-0"
              contentClassName="flex items-center w-full h-full px-3"
            >
              <Search className="h-3.5 w-3.5 text-muted-foreground/60 mr-2 shrink-0" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("membersPage.searchPermissionsPlaceholder")}
                className="flex h-9 w-full py-0 text-xs bg-transparent! dark:bg-transparent! border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="p-1 rounded-full text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </LiquidGlassInput>
          </div>

          <GlassTabs
            size="sm"
            value={activeGroupFilter}
            onValueChange={setActiveGroupFilter}
            items={groupTabItems}
            className="w-full"
          />
        </div>

        <ScrollArea className="h-72 sm:h-80 w-full rounded-2xl border border-border/50 p-2">
          {filteredGroups.length === 0 ? (
            <GlassEmptyState
              icon={<Search className="w-6 h-6" />}
              title={t("membersPage.emptySearchPermissionsTitle")}
              description={t("membersPage.emptySearchPermissionsDesc")}
              className="py-8"
            />
          ) : (
            <div className="space-y-5 px-3">
              {filteredGroups.map((grp) => {
                const enabledInGroup = grp.codes.filter((c) =>
                  isOwner ? true : customGrantedPerms.includes(c),
                ).length;
                const allGroupEnabled = enabledInGroup === grp.codes.length;

                return (
                  <div key={grp.groupKey} className="space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1.5 border-b border-border/40">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs sm:text-sm font-bold text-primary">
                            {tCatalog(`groups.${grp.groupKey}.title`)}
                          </h4>
                          <GlassBadge variant="secondary" size="sm">
                            {enabledInGroup}/{grp.codes.length}
                          </GlassBadge>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {tCatalog(`groups.${grp.groupKey}.description`)}
                        </p>
                      </div>

                      {!isOwner && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <PatternButton
                            type="button"
                            variant="ghost"
                            color={allGroupEnabled ? "neutral" : "primary"}
                            size="sm"
                            rounded="full"
                            onClick={() =>
                              handleToggleEntireGroup(
                                grp.codes,
                                !allGroupEnabled,
                              )
                            }
                            className="h-7 px-2.5"
                          >
                            <span className="text-[11px]">
                              {allGroupEnabled
                                ? t("membersPage.disableAllGroupBtn")
                                : t("membersPage.enableAllGroupBtn")}
                            </span>
                          </PatternButton>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 items-stretch">
                      {grp.codes.map((code) => {
                        const isChecked = isOwner
                          ? true
                          : customGrantedPerms.includes(code);
                        return (
                          <div
                            key={code}
                            onClick={() => {
                              if (!isOwner) {
                                handleTogglePermissionCode(code, !isChecked);
                              }
                            }}
                            className={cn(
                              "flex items-start justify-between gap-3 rounded-xl border p-3 transition-all h-full",
                              !isOwner && "cursor-pointer",
                              isChecked
                                ? "border-primary/40 bg-primary/5 dark:bg-primary/10"
                                : "border-border/40 bg-background/40 opacity-80 hover:opacity-100",
                            )}
                          >
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <p className="text-xs font-semibold text-foreground leading-snug">
                                {tCatalog(`permissions.${code}.label`)}
                              </p>
                              <p className="text-[11px] text-muted-foreground leading-relaxed">
                                {tCatalog(`permissions.${code}.desc`)}
                              </p>
                            </div>

                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="pt-0.5 shrink-0"
                            >
                              <Switch
                                disabled={isOwner}
                                checked={isChecked}
                                onCheckedChange={(checked) =>
                                  handleTogglePermissionCode(code, checked)
                                }
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </form>
    </GlassModal>
  );
};
