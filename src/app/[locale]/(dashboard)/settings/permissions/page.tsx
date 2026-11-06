/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ShieldCheck,
  PowerOff,
  Sliders,
  ArrowRight,
  Lock,
  Search,
  Users,
  Sparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";
import {
  GlassSurfaceCard,
  GlassSectionHeader,
  GlassTabs,
  GlassBadge,
  GlassAvatar,
  GlassEmptyState,
  LiquidGlassInput,
  PatternButton,
  TruncatedText,
} from "@/components/toolkit";
import { MemberPermissionsCustomizeModal } from "@/components/iam/member-permissions-customize-modal";
import { resolveEffectivePermissionsForMember } from "@/constant/permission-catalog";
import {
  forceMemberOfflineApi,
  getRolePresetsApi,
  getShopMembersAndInvitationsApi,
} from "@/lib/stores/iam/api";
import { usePermissionStore } from "@/lib/stores/iam/use-permission-store";
import config from "@/config";
import { showErrorToast, showSuccessToast } from "@/utils/toast";

type PermissionsPageTab = "SHIFT_MONITOR" | "ROLE_MATRIX";

export default function GranularPermissionsAndShiftPage() {
  const tPerm = useTranslations("SettingsPermissions");
  const tIam = useTranslations("OnboardingAndRoles");
  const tShift = useTranslations("ShiftAndIam");
  const tCatalog = useTranslations("PermissionCatalog");
  const router = useRouter();

  const activeShopId = usePermissionStore((s) => s.activeShopId);
  const membersRefreshTick = usePermissionStore((s) => s.membersRefreshTick);

  const [activeTab, setActiveTab] = useState<PermissionsPageTab>("ROLE_MATRIX");
  const [members, setMembers] = useState<any[]>([]);
  const [rolePresets, setRolePresets] = useState<Record<string, any>>({});
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [forcingUserId, setForcingUserId] = useState<string | null>(null);

  const [customizeModalOpen, setCustomizeModalOpen] = useState<boolean>(false);
  const [selectedMemberForModal, setSelectedMemberForModal] = useState<
    any | null
  >(null);

  const loadMembersAndPresets = useCallback(async () => {
    if (!activeShopId) return;
    try {
      const [membersRes, presetsRes]: [any, any] = await Promise.all([
        getShopMembersAndInvitationsApi(activeShopId),
        getRolePresetsApi(),
      ]);
      const activeList = (membersRes?.data?.members || []).filter(
        (m: any) => m.membershipStatus === "ACTIVE",
      );
      setMembers(activeList);
      if (presetsRes?.data) {
        setRolePresets(presetsRes.data);
      }
      if (selectedMemberForModal) {
        const refreshedTarget = activeList.find(
          (m: any) => m.id === selectedMemberForModal.id,
        );
        if (refreshedTarget) {
          setSelectedMemberForModal(refreshedTarget);
        }
      }
    } catch {}
  }, [activeShopId, selectedMemberForModal?.id]);

  useEffect(() => {
    loadMembersAndPresets();
  }, [loadMembersAndPresets, membersRefreshTick]);

  const handleOpenCustomizeModal = (member: any) => {
    setSelectedMemberForModal(member);
    setCustomizeModalOpen(true);
  };

  const handleQuickCustomizeFromHeader = () => {
    const firstCustomizable =
      members.find((m) => m.role !== "SHOP_OWNER") || members[0] || null;
    if (firstCustomizable) {
      setSelectedMemberForModal(firstCustomizable);
      setCustomizeModalOpen(true);
    }
  };

  const handleForceMemberOffline = async (member: any) => {
    if (!activeShopId) return;
    setForcingUserId(member.userId);
    try {
      const res: any = await forceMemberOfflineApi(
        activeShopId,
        member.userId,
        {
          handoverMode: "AUTO_REDISTRIBUTE",
        },
      );
      const reassignedCount = Number(
        res?.data?.reassignedConversationCount || 0,
      );
      await loadMembersAndPresets();
      showSuccessToast(
        tPerm("forceOfflineSuccessToast", { count: reassignedCount }),
      );
    } catch (err: any) {
      showErrorToast(err?.response?.data?.message || "Failed");
    } finally {
      setForcingUserId(null);
    }
  };

  const filteredMembers = useMemo(() => {
    const kw = searchKeyword.trim().toLowerCase();
    if (!kw) return members;
    return members.filter((m) => {
      const name = String(m.user?.name || "").toLowerCase();
      const email = String(m.user?.email || "").toLowerCase();
      const roleLabel = tIam(`roles.${m.role}`).toLowerCase();
      return name.includes(kw) || email.includes(kw) || roleLabel.includes(kw);
    });
  }, [members, searchKeyword, tIam]);

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      <GlassSectionHeader
        icon={<ShieldCheck className="w-5 h-5" />}
        title={<TruncatedText as="span">{tPerm("title")}</TruncatedText>}
        subtitle={<TruncatedText as="span">{tPerm("subtitle")}</TruncatedText>}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <GlassBadge variant="info" size="sm">
              <Lock className="w-3 h-3 mr-1 inline shrink-0" />
              <TruncatedText>{tPerm("flsProtectionBadge")}</TruncatedText>
            </GlassBadge>

            <PatternButton
              type="button"
              variant="solid"
              color="primary"
              size="sm"
              rounded="full"
              onClick={() => router.push(config.routes.private.settingsMembers)}
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
            >
              <TruncatedText>{tPerm("openMembersDirectoryBtn")}</TruncatedText>
            </PatternButton>
          </div>
        }
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <GlassTabs
          value={activeTab}
          onValueChange={setActiveTab}
          items={[
            {
              key: "ROLE_MATRIX",
              label: <TruncatedText>{tPerm("tabs.roleMatrix")}</TruncatedText>,
              badge: members.length,
            },
            {
              key: "SHIFT_MONITOR",
              label: (
                <TruncatedText>{tPerm("tabs.shiftMonitor")}</TruncatedText>
              ),
              badge: members.filter((m) => m.shiftStatus === "ONLINE").length,
            },
          ]}
        />

        <LiquidGlassInput className="w-full sm:w-72 h-9 overflow-hidden p-0">
          <div className="flex items-center px-3 w-full h-full">
            <Search className="h-3.5 w-3.5 text-muted-foreground/60 mr-2 shrink-0" />
            <Input
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder={tPerm("searchMemberPlaceholder")}
              className="flex h-full w-full py-1.5 text-xs bg-transparent! border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
            />
          </div>
        </LiquidGlassInput>
      </div>

      {filteredMembers.length === 0 ? (
        <GlassEmptyState
          icon={<Users className="w-6 h-6" />}
          title={tPerm("emptyMembersTitle")}
          description={tPerm("emptyMembersDesc")}
        />
      ) : activeTab === "SHIFT_MONITOR" ? (
        <div className="space-y-3">
          {filteredMembers.map((m) => {
            const isOnline = m.shiftStatus === "ONLINE";
            const isBusy = m.shiftStatus === "BUSY";
            const isOwner = m.role === "SHOP_OWNER";
            return (
              <GlassSurfaceCard key={m.id} className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <GlassAvatar
                      src={m.user?.avatar}
                      name={m.user?.name || m.user?.email || "U"}
                      size="md"
                      isOnline={isOnline}
                      showStatus
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <TruncatedText
                          as="span"
                          className="font-bold text-sm max-w-52"
                        >
                          {m.user?.name || m.user?.email}
                        </TruncatedText>
                        <GlassBadge variant="primary" size="sm">
                          <TruncatedText>
                            {tIam(`roles.${m.role}`)}
                          </TruncatedText>
                        </GlassBadge>
                        <GlassBadge
                          variant={
                            isOnline
                              ? "success"
                              : isBusy
                                ? "warning"
                                : "secondary"
                          }
                          size="sm"
                          dot
                          pulse={isOnline}
                        >
                          <TruncatedText>
                            {tShift(`status.${m.shiftStatus || "OFFLINE"}`)}
                          </TruncatedText>
                        </GlassBadge>
                      </div>
                      <TruncatedText
                        as="p"
                        className="text-xs text-muted-foreground mt-0.5"
                      >
                        {m.user?.email} • {tIam(`scopes.${m.dataScope}`)} •{" "}
                        {tIam("membersPage.maxChatsShort", {
                          count: m.maxConcurrentChats || 25,
                        })}
                      </TruncatedText>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    {(isOnline || isBusy) && !isOwner && (
                      <PatternButton
                        type="button"
                        variant="glass"
                        color="danger"
                        size="sm"
                        rounded="full"
                        isLoading={forcingUserId === m.userId}
                        onClick={() => handleForceMemberOffline(m)}
                        icon={<PowerOff className="w-3.5 h-3.5" />}
                        iconPosition="left"
                      >
                        <TruncatedText>
                          {tPerm("forceOfflineBtn")}
                        </TruncatedText>
                      </PatternButton>
                    )}
                  </div>
                </div>
              </GlassSurfaceCard>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMembers.map((m) => {
            const isOwner = m.role === "SHOP_OWNER";
            const effectivePerms = resolveEffectivePermissionsForMember(
              m,
              rolePresets,
            );
            const permCount = effectivePerms.length;
            const previewPerms = effectivePerms.slice(0, 4);
            const remainingCount = Math.max(
              0,
              effectivePerms.length - previewPerms.length,
            );

            return (
              <GlassSurfaceCard key={m.id} className="p-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="min-w-0 space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <GlassAvatar
                        src={m.user?.avatar}
                        name={m.user?.name || m.user?.email || "U"}
                        size="md"
                        isOnline={m.shiftStatus === "ONLINE"}
                        showStatus
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <TruncatedText
                            as="span"
                            className="font-bold text-sm max-w-56"
                          >
                            {m.user?.name || m.user?.email}
                          </TruncatedText>
                          <GlassBadge variant="primary" size="sm">
                            <TruncatedText>
                              {tIam(`roles.${m.role}`)}
                            </TruncatedText>
                          </GlassBadge>
                          <GlassBadge
                            variant={isOwner ? "success" : "accent"}
                            size="sm"
                          >
                            <Sparkles className="w-3 h-3 mr-1 inline shrink-0" />
                            <TruncatedText>
                              {isOwner
                                ? tPerm("ownerLockedBadge")
                                : tIam("membersPage.permissionCountBadge", {
                                    count: permCount,
                                  })}
                            </TruncatedText>
                          </GlassBadge>
                        </div>
                        <TruncatedText
                          as="p"
                          className="text-xs text-muted-foreground mt-0.5"
                        >
                          {m.user?.email} • {tIam(`scopes.${m.dataScope}`)} •{" "}
                          {tIam("membersPage.maxDiscountShort", {
                            percent: m.maxDiscountPercent,
                          })}{" "}
                          •{" "}
                          {tIam("membersPage.unmaskLimitShort", {
                            limit: m.unmaskPhoneHourlyLimit,
                          })}
                        </TruncatedText>
                      </div>
                    </div>

                    {previewPerms.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pl-0 sm:pl-13">
                        <span className="text-[11px] font-medium text-muted-foreground mr-1">
                          {tPerm("activePermissionsPreviewLabel")}
                        </span>
                        {previewPerms.map((code) => (
                          <GlassBadge
                            key={code}
                            variant="secondary"
                            size="sm"
                            className="font-normal"
                          >
                            <TruncatedText className="max-w-48">
                              {tCatalog(`permissions.${code}.label`)}
                            </TruncatedText>
                          </GlassBadge>
                        ))}
                        {remainingCount > 0 && (
                          <GlassBadge variant="frosted" size="sm">
                            {tPerm("morePermissionsBadge", {
                              count: remainingCount,
                            })}
                          </GlassBadge>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <PatternButton
                      type="button"
                      variant={isOwner ? "ghost" : "solid"}
                      color="primary"
                      size="sm"
                      rounded="full"
                      onClick={() => handleOpenCustomizeModal(m)}
                      icon={<Sliders className="w-3.5 h-3.5" />}
                      iconPosition="left"
                    >
                      <TruncatedText>
                        {tPerm("customizeMemberBtn")}
                      </TruncatedText>
                    </PatternButton>
                  </div>
                </div>
              </GlassSurfaceCard>
            );
          })}
        </div>
      )}

      <MemberPermissionsCustomizeModal
        open={customizeModalOpen}
        onOpenChange={setCustomizeModalOpen}
        shopId={activeShopId}
        member={selectedMemberForModal}
        members={members}
        rolePresets={rolePresets}
        onSelectMember={(nextMember) => setSelectedMemberForModal(nextMember)}
        onSaved={loadMembersAndPresets}
      />
    </div>
  );
}
