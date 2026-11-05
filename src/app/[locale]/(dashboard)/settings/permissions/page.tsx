/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
"use client";

import React, { useCallback, useEffect, useState } from "react";
import { ShieldCheck, PowerOff, Sliders, ArrowRight, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  GlassSurfaceCard,
  GlassSectionHeader,
  GlassTabs,
  GlassBadge,
  GlassAvatar,
  PatternButton,
  TruncatedText,
} from "@/components/toolkit";
import {
  forceMemberOfflineApi,
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
  const router = useRouter();

  const activeShopId = usePermissionStore((s) => s.activeShopId);
  const membersRefreshTick = usePermissionStore((s) => s.membersRefreshTick);

  const [activeTab, setActiveTab] =
    useState<PermissionsPageTab>("SHIFT_MONITOR");
  const [members, setMembers] = useState<any[]>([]);
  const [forcingUserId, setForcingUserId] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    if (!activeShopId) return;
    try {
      const res: any = await getShopMembersAndInvitationsApi(activeShopId);
      setMembers(
        (res?.data?.members || []).filter(
          (m: any) => m.membershipStatus === "ACTIVE",
        ),
      );
    } catch {}
  }, [activeShopId]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers, membersRefreshTick]);

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
      await loadMembers();
      showSuccessToast(
        tPerm("forceOfflineSuccessToast", { count: reassignedCount }),
      );
    } catch (err: any) {
      showErrorToast(err?.response?.data?.message || "Failed");
    } finally {
      setForcingUserId(null);
    }
  };

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
              rounded={"full"}
              onClick={() => router.push(config.routes.private.settingsMembers)}
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
            >
              <TruncatedText>{tPerm("openMembersDirectoryBtn")}</TruncatedText>
            </PatternButton>
          </div>
        }
      />

      <GlassTabs
        value={activeTab}
        onValueChange={setActiveTab}
        items={[
          {
            key: "SHIFT_MONITOR",
            label: <TruncatedText>{tPerm("tabs.shiftMonitor")}</TruncatedText>,
            badge: members.filter((m) => m.shiftStatus === "ONLINE").length,
          },
          {
            key: "ROLE_MATRIX",
            label: <TruncatedText>{tPerm("tabs.roleMatrix")}</TruncatedText>,
            badge: members.length,
          },
        ]}
      />

      {activeTab === "SHIFT_MONITOR" && (
        <div className="space-y-3">
          {members.map((m) => {
            const isOnline = m.shiftStatus === "ONLINE";
            const isBusy = m.shiftStatus === "BUSY";
            return (
              <GlassSurfaceCard key={m.id} className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <GlassAvatar
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
                        {m.user?.email} • {tIam(`scopes.${m.dataScope}`)}
                      </TruncatedText>
                    </div>
                  </div>

                  {(isOnline || isBusy) && m.role !== "SHOP_OWNER" && (
                    <PatternButton
                      type="button"
                      variant="glass"
                      color="danger"
                      size="sm"
                      rounded={"full"}
                      isLoading={forcingUserId === m.userId}
                      onClick={() => handleForceMemberOffline(m)}
                      icon={<PowerOff className="w-3.5 h-3.5" />}
                      iconPosition="left"
                    >
                      <TruncatedText>{tPerm("forceOfflineBtn")}</TruncatedText>
                    </PatternButton>
                  )}
                </div>
              </GlassSurfaceCard>
            );
          })}
        </div>
      )}

      {activeTab === "ROLE_MATRIX" && (
        <div className="space-y-3">
          {members.map((m) => {
            const isOwner = m.role === "SHOP_OWNER";
            const permCount = isOwner
              ? 92
              : m.grantedPermissionsJson?.length || 0;
            return (
              <GlassSurfaceCard key={m.id} className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <TruncatedText
                        as="span"
                        className="font-bold text-sm max-w-56"
                      >
                        {m.user?.name || m.user?.email}
                      </TruncatedText>
                      <GlassBadge variant="primary" size="sm">
                        <TruncatedText>{tIam(`roles.${m.role}`)}</TruncatedText>
                      </GlassBadge>
                      <GlassBadge variant="accent" size="sm">
                        <TruncatedText>
                          {tIam("membersPage.permissionCountBadge", {
                            count: permCount,
                          })}
                        </TruncatedText>
                      </GlassBadge>
                    </div>
                    <TruncatedText
                      as="p"
                      className="text-xs text-muted-foreground mt-1"
                    >
                      {tIam(`scopes.${m.dataScope}`)} •{" "}
                      {tIam("membersPage.maxDiscountShort", {
                        percent: m.maxDiscountPercent,
                      })}{" "}
                      • SĐT/h: {m.unmaskPhoneHourlyLimit}
                    </TruncatedText>
                  </div>

                  <PatternButton
                    type="button"
                    variant="glass"
                    color="primary"
                    size="sm"
                    rounded={"full"}
                    onClick={() =>
                      router.push(config.routes.private.settingsMembers)
                    }
                    icon={<Sliders className="w-3.5 h-3.5" />}
                    iconPosition="left"
                  >
                    <TruncatedText>{tPerm("customizeMemberBtn")}</TruncatedText>
                  </PatternButton>
                </div>
              </GlassSurfaceCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
